using DealerManagement.Application.Common;
using DealerManagement.Application.DTOs.Voice;
using DealerManagement.Application.Interfaces;
using DealerManagement.Application.Interfaces.Services;
using DealerManagement.Domain.Entities.Sales;
using DealerManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace DealerManagement.Infrastructure.Services;

/// <summary>
/// Voice-driven draft order orchestration.
/// - Reuses one Draft order per dealer until Confirm/Cancel
/// - Matches products dynamically from Products table (never hardcoded)
/// </summary>
public class VoiceOrderService : IVoiceOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IVoiceCommandParser _parser;
    private readonly ILogger<VoiceOrderService> _logger;

    public VoiceOrderService(
        IUnitOfWork unitOfWork,
        IVoiceCommandParser parser,
        ILogger<VoiceOrderService> logger)
    {
        _unitOfWork = unitOfWork;
        _parser = parser;
        _logger = logger;
    }

    public async Task<ApiResponse<VoiceProcessResponse>> ProcessAsync(VoiceProcessRequest request, int userId)
    {
        if (request.CustomerId <= 0)
            return ApiResponse<VoiceProcessResponse>.FailResponse("Customer (dealer) is required.");

        if (string.IsNullOrWhiteSpace(request.Text) && string.IsNullOrWhiteSpace(request.SelectedProductName))
            return ApiResponse<VoiceProcessResponse>.FailResponse("Voice text is required.");

        var dealer = await _unitOfWork.Dealers.Query()
            .FirstOrDefaultAsync(d => d.Id == request.CustomerId && d.IsActive && !d.IsDeleted);

        if (dealer == null)
            return ApiResponse<VoiceProcessResponse>.FailResponse("Customer not found.");

        var parsed = _parser.Parse(request.Text ?? string.Empty);

        // Client chose a product after multi-match
        if (!string.IsNullOrWhiteSpace(request.SelectedProductName))
        {
            parsed.Product = request.SelectedProductName.Trim();
            if (parsed.Intent is "unknown" or "")
                parsed.Intent = "add";
        }

        if (parsed.Intent == "unknown")
        {
            return ApiResponse<VoiceProcessResponse>.FailResponse(
                "Sorry, I did not understand that command. Try: Add 20 rods, Update rod quantity to 50, Delete cement, Confirm order.");
        }

        try
        {
            await _unitOfWork.BeginTransactionAsync();

            var order = await ResolveDraftOrderAsync(request, dealer.Id, userId, parsed.Intent);
            if (order == null && parsed.Intent is "update" or "delete" or "show" or "search" or "open" or "confirm" or "cancel")
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ApiResponse<VoiceProcessResponse>.FailResponse("No active draft order found. Say \"Create order for 40 bags\" to start.");
            }

            // create/add/continue without order → ensure draft
            if (order == null)
            {
                order = await CreateDraftOrderAsync(dealer.Id, userId);
            }

            VoiceProcessResponse response;

            switch (parsed.Intent)
            {
                case "create":
                case "add":
                    response = await AddOrIncreaseAsync(order, parsed);
                    break;
                case "update":
                    response = await UpdateQuantityAsync(order, parsed);
                    break;
                case "delete":
                    response = await DeleteItemAsync(order, parsed);
                    break;
                case "show":
                case "search":
                case "open":
                case "continue":
                    response = BuildSuccess(order, parsed.Intent, null, null,
                        parsed.Intent == "continue"
                            ? "Continuing with your draft order. Speak the next command."
                            : $"Draft order #{order.Id} has {order.OrderItems.Count} item(s).");
                    break;
                case "confirm":
                    response = await ConfirmOrderAsync(order, userId);
                    break;
                case "cancel":
                    response = await CancelOrderAsync(order, userId);
                    break;
                default:
                    await _unitOfWork.RollbackTransactionAsync();
                    return ApiResponse<VoiceProcessResponse>.FailResponse($"Unsupported intent: {parsed.Intent}");
            }

            // Multi-match: do not commit mutations
            if (response.Candidates is { Count: > 0 })
            {
                await _unitOfWork.RollbackTransactionAsync();
                response.CustomerName = dealer.DealerName;
                return ApiResponse<VoiceProcessResponse>.SuccessResponse(response, response.Message);
            }

            if (!response.Success)
            {
                await _unitOfWork.RollbackTransactionAsync();
                response.CustomerName = dealer.DealerName;
                return ApiResponse<VoiceProcessResponse>.FailResponse(response.Message);
            }

            RecalculateTotals(order);
            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitTransactionAsync();

            // Reload items with product names
            var fresh = await LoadOrderWithItemsAsync(order.Id);
            response = AttachOrderSnapshot(response, fresh!, dealer.DealerName);
            _logger.LogInformation("Voice intent {Intent} on order {OrderId} by user {UserId}", parsed.Intent, order.Id, userId);
            return ApiResponse<VoiceProcessResponse>.SuccessResponse(response, response.Message);
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync();
            _logger.LogError(ex, "Voice process failed");
            return ApiResponse<VoiceProcessResponse>.FailResponse($"Voice processing failed: {ex.Message}");
        }
    }

    private async Task<Order?> ResolveDraftOrderAsync(VoiceProcessRequest request, int dealerId, int userId, string intent)
    {
        if (request.OrderId.HasValue && request.OrderId.Value > 0)
        {
            var specific = await LoadOrderWithItemsAsync(request.OrderId.Value);
            if (specific == null || specific.DealerId != dealerId)
                return null;
            return specific;
        }

        var draft = await _unitOfWork.Orders.Query()
            .Include(o => o.OrderItems).ThenInclude(i => i.Product)
            .Include(o => o.Dealer)
            .Where(o => o.DealerId == dealerId && o.Status == OrderStatus.Draft && o.IsActive && !o.IsDeleted)
            .OrderByDescending(o => o.CreatedDate)
            .FirstOrDefaultAsync();

        return draft;
    }

    private async Task<Order> CreateDraftOrderAsync(int dealerId, int userId)
    {
        var orderNumber = $"VOX-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";
        var order = new Order
        {
            OrderNumber = orderNumber,
            CouponNumber = orderNumber,
            DealerId = dealerId,
            OrderDate = DateTime.UtcNow,
            Status = OrderStatus.Draft,
            PaymentStatus = PaymentStatus.Pending,
            SalesPersonId = userId,
            CreatedBy = userId,
            Notes = "Created via voice recognition"
        };
        await _unitOfWork.Orders.AddAsync(order);
        await _unitOfWork.SaveChangesAsync();
        return order;
    }

    private async Task<VoiceProcessResponse> AddOrIncreaseAsync(Order order, ParsedVoiceCommand parsed)
    {
        if (parsed.Quantity is null or <= 0)
            return Fail(order, parsed.Intent, "Quantity must be a positive number.");

        var match = await MatchProductsAsync(parsed.Product);
        if (match.Error != null)
            return Fail(order, parsed.Intent, match.Error);
        if (match.Candidates.Count > 1)
            return MultiMatch(order, parsed, match.Candidates);
        if (match.Candidates.Count == 0)
            return Fail(order, parsed.Intent, $"No product found matching \"{parsed.Product}\".");

        var product = match.Candidates[0];
        var existing = order.OrderItems.FirstOrDefault(i => i.ProductId == product.Id && i.IsActive && !i.IsDeleted);
        if (existing != null)
        {
            existing.Quantity += parsed.Quantity.Value;
            existing.UnitPrice = product.UnitPrice;
        }
        else
        {
            order.OrderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = parsed.Quantity.Value,
                UnitPrice = product.UnitPrice,
                TaxRate = product.TaxRate,
                CreatedBy = order.CreatedBy
            });
        }

        return BuildSuccess(order, parsed.Intent, product.ProductName, parsed.Quantity,
            $"{parsed.Quantity.Value:0.##} {product.ProductName} added successfully.");
    }

    private async Task<VoiceProcessResponse> UpdateQuantityAsync(Order order, ParsedVoiceCommand parsed)
    {
        if (parsed.Quantity is null or < 0)
            return Fail(order, parsed.Intent, "Quantity must be numeric.");

        var match = await MatchProductsAsync(parsed.Product);
        if (match.Error != null)
            return Fail(order, parsed.Intent, match.Error);
        if (match.Candidates.Count > 1)
            return MultiMatch(order, parsed, match.Candidates);
        if (match.Candidates.Count == 0)
            return Fail(order, parsed.Intent, $"No product found matching \"{parsed.Product}\".");

        var product = match.Candidates[0];
        var existing = order.OrderItems.FirstOrDefault(i => i.ProductId == product.Id && i.IsActive && !i.IsDeleted);
        if (existing == null)
            return Fail(order, parsed.Intent, $"{product.ProductName} is not on this order. Say \"Add {parsed.Quantity} {parsed.Product}\" first.");

        if (parsed.Quantity == 0)
        {
            _unitOfWork.OrderItems.Remove(existing);
            order.OrderItems.Remove(existing);
            return BuildSuccess(order, parsed.Intent, product.ProductName, 0,
                $"{product.ProductName} removed (quantity set to 0).");
        }

        existing.Quantity = parsed.Quantity.Value;
        existing.UnitPrice = product.UnitPrice;
        return BuildSuccess(order, parsed.Intent, product.ProductName, parsed.Quantity,
            $"{product.ProductName} quantity updated to {parsed.Quantity.Value:0.##}.");
    }

    private async Task<VoiceProcessResponse> DeleteItemAsync(Order order, ParsedVoiceCommand parsed)
    {
        var match = await MatchProductsAsync(parsed.Product);
        if (match.Error != null)
            return Fail(order, parsed.Intent, match.Error);
        if (match.Candidates.Count > 1)
            return MultiMatch(order, parsed, match.Candidates);
        if (match.Candidates.Count == 0)
            return Fail(order, parsed.Intent, $"No product found matching \"{parsed.Product}\".");

        var product = match.Candidates[0];
        var existing = order.OrderItems.FirstOrDefault(i => i.ProductId == product.Id && i.IsActive && !i.IsDeleted);
        if (existing == null)
            return Fail(order, parsed.Intent, $"{product.ProductName} is not on this draft order.");

        _unitOfWork.OrderItems.Remove(existing);
        order.OrderItems.Remove(existing);
        return BuildSuccess(order, parsed.Intent, product.ProductName, null,
            $"{product.ProductName} removed from the order.");
    }

    private Task<VoiceProcessResponse> ConfirmOrderAsync(Order order, int userId)
    {
        if (!order.OrderItems.Any(i => i.IsActive && !i.IsDeleted))
            return Task.FromResult(Fail(order, "confirm", "Cannot confirm an empty order. Add products first."));

        order.Status = OrderStatus.Confirmed;
        order.UpdatedBy = userId;
        return Task.FromResult(BuildSuccess(order, "confirm", null, null,
            $"Order #{order.Id} confirmed successfully."));
    }

    private Task<VoiceProcessResponse> CancelOrderAsync(Order order, int userId)
    {
        order.Status = OrderStatus.Cancelled;
        order.UpdatedBy = userId;
        return Task.FromResult(BuildSuccess(order, "cancel", null, null,
            $"Order #{order.Id} cancelled."));
    }

    private async Task<(List<Domain.Entities.Product.Product> Candidates, string? Error)> MatchProductsAsync(string? spoken)
    {
        if (string.IsNullOrWhiteSpace(spoken))
            return (new List<Domain.Entities.Product.Product>(), "Product name is required in the command.");

        var term = spoken.Trim().ToLowerInvariant();
        var tokens = term.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .SelectMany(ExpandTokenVariants)
            .Where(t => t.Length >= 2)
            .Distinct()
            .ToList();

        var products = await _unitOfWork.Products.Query()
            .Where(p => p.IsActive && !p.IsDeleted)
            .ToListAsync();

        // Prefer exact / starts-with, then contains on name, code, sku
        var matches = products
            .Where(p =>
                FieldMatches(p.ProductName, term, tokens) ||
                FieldMatches(p.ProductCode, term, tokens) ||
                FieldMatches(p.SKU, term, tokens) ||
                FieldMatches(p.Description, term, tokens))
            .GroupBy(p => p.Id)
            .Select(g => g.First())
            .ToList();

        // Rank: whole-term in name > exact token as word > starts-with > contains
        matches = matches
            .OrderByDescending(p => ScoreProduct(p, term, tokens))
            .ThenBy(p => p.ProductName)
            .ToList();

        return (matches, null);
    }

    private static int ScoreProduct(Domain.Entities.Product.Product p, string term, List<string> tokens)
    {
        var name = (p.ProductName ?? "").ToLowerInvariant();
        var score = 0;
        if (string.Equals(name, term, StringComparison.OrdinalIgnoreCase)) score += 100;
        if (name.StartsWith(term, StringComparison.OrdinalIgnoreCase)) score += 40;
        if (name.Contains(term, StringComparison.OrdinalIgnoreCase)) score += 25;
        foreach (var t in tokens)
        {
            // Prefer "paint" matching "Paint (20L)" over weak substring noise
            if (Regex.IsMatch(name, $@"\b{Regex.Escape(t)}\b", RegexOptions.IgnoreCase))
                score += 50;
            else if (name.Contains(t, StringComparison.OrdinalIgnoreCase))
                score += 10;
        }
        return score;
    }

    /// <summary>Expand plurals: rods→rod, bags→bag.</summary>
    private static IEnumerable<string> ExpandTokenVariants(string token)
    {
        yield return token;
        if (token.EndsWith("ies", StringComparison.Ordinal) && token.Length > 4)
            yield return token[..^3] + "y";
        else if (token.EndsWith("ses", StringComparison.Ordinal) && token.Length > 4)
            yield return token[..^2];
        else if (token.EndsWith('s') && token.Length > 3)
            yield return token[..^1];
    }

    private static bool FieldMatches(string? field, string fullTerm, List<string> tokens)
    {
        if (string.IsNullOrEmpty(field)) return false;
        if (field.Contains(fullTerm, StringComparison.OrdinalIgnoreCase)) return true;
        var fieldLower = field.ToLowerInvariant();
        return tokens.Any(t =>
            fieldLower.Contains(t, StringComparison.OrdinalIgnoreCase) ||
            Regex.IsMatch(fieldLower, $@"\b{Regex.Escape(t)}\b", RegexOptions.IgnoreCase));
    }

    private async Task<Order?> LoadOrderWithItemsAsync(int orderId) =>
        await _unitOfWork.Orders.Query()
            .Include(o => o.OrderItems).ThenInclude(i => i.Product)
            .Include(o => o.Dealer)
            .FirstOrDefaultAsync(o => o.Id == orderId);

    private static void RecalculateTotals(Order order)
    {
        var activeItems = order.OrderItems.Where(i => i.IsActive && !i.IsDeleted).ToList();
        decimal subTotal = 0;
        decimal tax = 0;
        foreach (var item in activeItems)
        {
            var line = item.Quantity * item.UnitPrice;
            subTotal += line;
            tax += line * (item.TaxRate / 100m);
        }
        order.SubTotal = subTotal;
        order.TaxAmount = tax;
        order.TotalAmount = subTotal + tax + order.ShippingCost - order.DiscountAmount;
    }

    private static VoiceProcessResponse MultiMatch(Order order, ParsedVoiceCommand parsed, List<Domain.Entities.Product.Product> products) =>
        new()
        {
            Success = true,
            OrderId = order.Id,
            Intent = parsed.Intent,
            Product = parsed.Product,
            Quantity = parsed.Quantity,
            Message = "Multiple products found. Please choose one.",
            OrderStatus = order.Status.ToString(),
            Candidates = products.Select(p => new VoiceProductCandidateDto
            {
                ProductId = p.Id,
                ProductName = p.ProductName,
                ProductCode = p.ProductCode,
                Sku = p.SKU
            }).ToList(),
            Items = MapItems(order)
        };

    private static VoiceProcessResponse Fail(Order order, string intent, string message) =>
        new()
        {
            Success = false,
            OrderId = order.Id,
            Intent = intent,
            Message = message,
            OrderStatus = order.Status.ToString(),
            Items = MapItems(order)
        };

    private static VoiceProcessResponse BuildSuccess(Order order, string intent, string? product, decimal? qty, string message) =>
        new()
        {
            Success = true,
            OrderId = order.Id,
            Intent = intent,
            Product = product,
            Quantity = qty,
            Message = message,
            OrderStatus = order.Status.ToString(),
            Items = MapItems(order)
        };

    private static VoiceProcessResponse AttachOrderSnapshot(VoiceProcessResponse response, Order order, string customerName)
    {
        response.OrderId = order.Id;
        response.CustomerName = customerName;
        response.OrderStatus = order.Status.ToString();
        response.Items = MapItems(order);
        return response;
    }

    private static List<VoiceOrderItemDto> MapItems(Order order) =>
        order.OrderItems
            .Where(i => i.IsActive && !i.IsDeleted)
            .Select(i => new VoiceOrderItemDto
            {
                ProductId = i.ProductId,
                ProductName = i.Product?.ProductName ?? $"Product #{i.ProductId}",
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                LineTotal = i.Quantity * i.UnitPrice
            })
            .ToList();
}
