using AutoMapper;
using DealerManagement.Application.Common;
using DealerManagement.Application.DTOs.Order;
using DealerManagement.Application.Interfaces;
using DealerManagement.Application.Interfaces.Services;
using DealerManagement.Domain.Entities.Sales;
using DealerManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealerManagement.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public OrderService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PagedResult<OrderDto>>> GetOrdersAsync(PaginationParams paginationParams, int? dealerId = null)
    {
        var (items, totalCount) = await _unitOfWork.Orders.GetPagedAsync(
            paginationParams.PageNumber,
            paginationParams.PageSize,
            filter: o => (!dealerId.HasValue || o.DealerId == dealerId.Value) &&
                         (string.IsNullOrEmpty(paginationParams.Search) ||
                          o.OrderNumber.Contains(paginationParams.Search)),
            orderBy: q => paginationParams.SortDescending
                ? q.OrderByDescending(o => o.CreatedDate)
                : q.OrderBy(o => o.CreatedDate),
            includeProperties: "Dealer,OrderItems.Product");

        var dtos = _mapper.Map<IEnumerable<OrderDto>>(items);
        var result = new PagedResult<OrderDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize
        };

        return ApiResponse<PagedResult<OrderDto>>.SuccessResponse(result);
    }

    public async Task<ApiResponse<OrderDto>> GetOrderByIdAsync(int id)
    {
        var order = await _unitOfWork.Orders.Query()
            .Include(o => o.Dealer)
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return ApiResponse<OrderDto>.FailResponse("Order not found");

        var dto = _mapper.Map<OrderDto>(order);
        return ApiResponse<OrderDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<OrderDto>> CreateOrderAsync(CreateOrderRequest request, int userId)
    {
        await _unitOfWork.BeginTransactionAsync();
        try
        {
            var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmss}-{new Random().Next(1000, 9999)}";

            var order = new Order
            {
                OrderNumber = orderNumber,
                DealerId = request.DealerId,
                OrderDate = DateTime.UtcNow,
                DeliveryDate = request.DeliveryDate,
                Status = OrderStatus.Pending,
                PaymentStatus = PaymentStatus.Pending,
                DiscountAmount = request.DiscountAmount,
                ShippingCost = request.ShippingCost,
                ShippingAddress = request.ShippingAddress,
                BillingAddress = request.BillingAddress,
                Notes = request.Notes,
                SalesPersonId = userId,
                CreatedBy = userId
            };

            decimal subTotal = 0;
            decimal taxAmount = 0;

            foreach (var item in request.Items)
            {
                var orderItem = new OrderItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    DiscountPercent = item.DiscountPercent,
                    TaxRate = item.TaxRate,
                    Notes = item.Notes
                };
                order.OrderItems.Add(orderItem);

                var lineTotal = item.Quantity * item.UnitPrice;
                var lineTax = lineTotal * (item.TaxRate / 100);
                subTotal += lineTotal;
                taxAmount += lineTax;
            }

            order.SubTotal = subTotal;
            order.TaxAmount = taxAmount;
            order.TotalAmount = subTotal + taxAmount + order.ShippingCost - order.DiscountAmount;

            await _unitOfWork.Orders.AddAsync(order);
            await _unitOfWork.CommitTransactionAsync();

            // Reload
            var created = await _unitOfWork.Orders.Query()
                .Include(o => o.Dealer)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .FirstAsync(o => o.Id == order.Id);

            var dto = _mapper.Map<OrderDto>(created);
            return ApiResponse<OrderDto>.SuccessResponse(dto, "Order created successfully");
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync();
            return ApiResponse<OrderDto>.FailResponse($"Failed to create order: {ex.Message}");
        }
    }

    public async Task<ApiResponse<OrderDto>> UpdateOrderStatusAsync(int id, UpdateOrderStatusRequest request, int userId)
    {
        var order = await _unitOfWork.Orders.Query()
            .Include(o => o.Dealer)
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return ApiResponse<OrderDto>.FailResponse("Order not found");

        order.Status = request.Status;
        if (request.Notes != null) order.Notes = request.Notes;
        order.UpdatedBy = userId;

        if (request.Status == OrderStatus.Delivered || request.Status == OrderStatus.Completed)
            order.DeliveryDate = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();

        var dto = _mapper.Map<OrderDto>(order);
        return ApiResponse<OrderDto>.SuccessResponse(dto, "Order status updated");
    }

    public async Task<ApiResponse<bool>> DeleteOrderAsync(int id)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(id);
        if (order == null)
            return ApiResponse<bool>.FailResponse("Order not found");

        order.IsDeleted = true;
        order.IsActive = false;
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Order deleted successfully");
    }
}

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ProductService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PagedResult<ProductDto>>> GetProductsAsync(PaginationParams paginationParams)
    {
        var (items, totalCount) = await _unitOfWork.Products.GetPagedAsync(
            paginationParams.PageNumber,
            paginationParams.PageSize,
            filter: p => string.IsNullOrEmpty(paginationParams.Search) ||
                        p.ProductName.Contains(paginationParams.Search) ||
                        p.ProductCode.Contains(paginationParams.Search) ||
                        p.SKU!.Contains(paginationParams.Search),
            orderBy: q => paginationParams.SortDescending
                ? q.OrderByDescending(p => p.CreatedDate)
                : q.OrderBy(p => p.CreatedDate),
            includeProperties: "Category,Brand");

        var dtos = _mapper.Map<IEnumerable<ProductDto>>(items);
        var result = new PagedResult<ProductDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize
        };

        return ApiResponse<PagedResult<ProductDto>>.SuccessResponse(result);
    }

    public async Task<ApiResponse<ProductDto>> GetProductByIdAsync(int id)
    {
        var product = await _unitOfWork.Products.Query()
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return ApiResponse<ProductDto>.FailResponse("Product not found");

        var dto = _mapper.Map<ProductDto>(product);
        return ApiResponse<ProductDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<IEnumerable<ProductDto>>> GetAllProductsAsync()
    {
        var products = await _unitOfWork.Products.Query()
            .Include(p => p.Category)
            .Include(p => p.Brand)
            .Where(p => p.IsActive)
            .OrderBy(p => p.ProductName)
            .ToListAsync();

        var dtos = _mapper.Map<IEnumerable<ProductDto>>(products);
        return ApiResponse<IEnumerable<ProductDto>>.SuccessResponse(dtos);
    }
}

public class DashboardService : IDashboardService
{
    private readonly IUnitOfWork _unitOfWork;

    public DashboardService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<DashboardDto>> GetDashboardAsync()
    {
        var totalSales = await _unitOfWork.Orders.Query()
            .Where(o => o.Status != OrderStatus.Cancelled)
            .SumAsync(o => o.TotalAmount);

        var totalOrders = await _unitOfWork.Orders.CountAsync();
        var activeDealers = await _unitOfWork.Dealers.CountAsync(d => d.Status == DealerStatus.Active);

        var avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        var pendingPayments = await _unitOfWork.Orders.Query()
            .Where(o => o.PaymentStatus == PaymentStatus.Pending || o.PaymentStatus == PaymentStatus.Partial)
            .SumAsync(o => o.TotalAmount);

        var dto = new DashboardDto
        {
            TotalSales = totalSales,
            TotalOrders = totalOrders,
            ActiveDealers = activeDealers,
            AverageOrderValue = avgOrderValue,
            PendingPayments = pendingPayments,
            LowStockProducts = 0 // TODO: implement stock check
        };

        return ApiResponse<DashboardDto>.SuccessResponse(dto);
    }
}
