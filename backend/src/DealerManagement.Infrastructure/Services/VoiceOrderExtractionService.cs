using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using DealerManagement.Application.Common;
using DealerManagement.Application.DTOs.Voice;
using DealerManagement.Application.Interfaces;
using DealerManagement.Application.Interfaces.Services;
using DealerManagement.Domain.Entities.Dealer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DealerManagement.Infrastructure.Services;

/// <summary>
/// Enterprise voice order extraction: optional LLM + local NLP fallback,
/// then customer/product matching against existing repositories.
/// </summary>
public class VoiceOrderExtractionService : IVoiceOrderExtractionService
{
    private const double ReviewThreshold = 0.72;

    private readonly IUnitOfWork _unitOfWork;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<VoiceOrderExtractionService> _logger;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public VoiceOrderExtractionService(
        IUnitOfWork unitOfWork,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<VoiceOrderExtractionService> logger)
    {
        _unitOfWork = unitOfWork;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<ApiResponse<VoiceExtractResponse>> ExtractAsync(VoiceExtractRequest request)
    {
        var transcript = (request.Text ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(transcript))
            return ApiResponse<VoiceExtractResponse>.FailResponse("Speech transcript is empty.");

        try
        {
            var (extracted, engine) = await ExtractStructuredAsync(transcript);
            var response = await BuildMatchedResponseAsync(transcript, extracted, engine, request.PreferredCustomerId);
            return ApiResponse<VoiceExtractResponse>.SuccessResponse(response, response.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Voice extract failed for transcript length {Len}", transcript.Length);
            return ApiResponse<VoiceExtractResponse>.FailResponse(
                "Could not extract order details from speech. Please try again or enter manually.");
        }
    }

    private async Task<(VoiceExtractedOrderDto Extracted, string Engine)> ExtractStructuredAsync(string transcript)
    {
        var apiKey = _configuration["VoiceAi:ApiKey"]
                     ?? _configuration["OpenAI:ApiKey"];
        var enabled = string.Equals(
            _configuration["VoiceAi:Enabled"] ?? "true",
            "true",
            StringComparison.OrdinalIgnoreCase);

        if (enabled && !string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                var llm = await ExtractWithLlmAsync(transcript, apiKey!);
                if (llm != null && (llm.Items.Count > 0 || !string.IsNullOrWhiteSpace(llm.Customer)))
                    return (llm, "openai");
                _logger.LogWarning("LLM extraction returned empty payload; falling back to local NLP.");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "LLM extraction failed; using local NLP fallback.");
            }
        }

        return (LocalVoiceOrderNlp.Extract(transcript), "local");
    }

    private async Task<VoiceExtractedOrderDto?> ExtractWithLlmAsync(string transcript, string apiKey)
    {
        var baseUrl = (_configuration["VoiceAi:BaseUrl"] ?? "https://api.openai.com/v1").TrimEnd('/');
        var model = _configuration["VoiceAi:Model"] ?? "gpt-4o-mini";

        var system = """
You extract dealer purchase orders from speech transcripts.
Return ONLY valid JSON with this shape (omit unknown fields or use null):
{
  "customer":"string",
  "phone":"string|null",
  "items":[{"product":"string","quantity":number,"unit":"string|null"}],
  "deliveryDate":"string|null",
  "address":"string|null",
  "notes":"string|null"
}
Rules:
- Keep product names as spoken (do not invent catalog SKUs).
- Quantity must be a positive number.
- deliveryDate may be relative (tomorrow, next Monday) or ISO YYYY-MM-DD.
- Do not invent customers or products that were not spoken.
""";

        var payload = new
        {
            model,
            temperature = 0.1,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new { role = "system", content = system },
                new { role = "user", content = transcript },
            },
        };

        var client = _httpClientFactory.CreateClient("VoiceAi");
        using var req = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/chat/completions");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var res = await client.SendAsync(req);
        var body = await res.Content.ReadAsStringAsync();
        if (!res.IsSuccessStatusCode)
        {
            _logger.LogWarning("Voice AI HTTP {Status}: {Body}", (int)res.StatusCode, body[..Math.Min(body.Length, 400)]);
            return null;
        }

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        if (string.IsNullOrWhiteSpace(content))
            return null;

        return JsonSerializer.Deserialize<VoiceExtractedOrderDto>(content, JsonOpts);
    }

    private async Task<VoiceExtractResponse> BuildMatchedResponseAsync(
        string transcript,
        VoiceExtractedOrderDto extracted,
        string engine,
        int? preferredCustomerId)
    {
        var warnings = new List<string>();
        var customer = await MatchCustomerAsync(extracted, preferredCustomerId, warnings);
        var matchedItems = await MatchItemsAsync(extracted.Items, warnings);
        var resolvedDate = ResolveDeliveryDate(extracted.DeliveryDate);

        if (!string.IsNullOrWhiteSpace(extracted.DeliveryDate) && resolvedDate == null)
            warnings.Add($"Could not resolve delivery date \"{extracted.DeliveryDate}\" — please set it manually.");

        var confidence = ComputeConfidence(extracted, customer, matchedItems, resolvedDate);
        var needsReview = confidence < ReviewThreshold
                          || !customer.Matched
                          || matchedItems.Count == 0
                          || matchedItems.Any(i => !i.Matched || i.Candidates.Count > 1);

        if (needsReview && !warnings.Any(w => w.Contains("review", StringComparison.OrdinalIgnoreCase)))
            warnings.Add("AI confidence is low or matches are ambiguous — review the form before saving.");

        var message = needsReview
            ? "Order details extracted. Please review and confirm before saving."
            : "Order details extracted and matched successfully. Review then confirm.";

        return new VoiceExtractResponse
        {
            Success = true,
            Message = message,
            Confidence = Math.Round(confidence, 3),
            NeedsReview = needsReview,
            ExtractionEngine = engine,
            Transcript = transcript,
            Extracted = extracted,
            Customer = customer,
            MatchedItems = matchedItems,
            ResolvedDeliveryDate = resolvedDate,
            Warnings = warnings,
        };
    }

    private async Task<VoiceMatchedCustomerDto> MatchCustomerAsync(
        VoiceExtractedOrderDto extracted,
        int? preferredCustomerId,
        List<string> warnings)
    {
        var dealers = await _unitOfWork.Dealers.Query()
            .Include(d => d.Addresses)
            .Where(d => d.IsActive && !d.IsDeleted)
            .ToListAsync();

        if (preferredCustomerId is > 0)
        {
            var preferred = dealers.FirstOrDefault(d => d.Id == preferredCustomerId.Value);
            if (preferred != null && string.IsNullOrWhiteSpace(extracted.Customer))
                return ToMatchedCustomer(preferred, 0.95);
        }

        var spoken = (extracted.Customer ?? string.Empty).Trim();
        var phoneDigits = DigitsOnly(extracted.Phone);

        if (string.IsNullOrWhiteSpace(spoken) && string.IsNullOrWhiteSpace(phoneDigits))
        {
            if (preferredCustomerId is > 0)
            {
                var preferred = dealers.FirstOrDefault(d => d.Id == preferredCustomerId.Value);
                if (preferred != null)
                    return ToMatchedCustomer(preferred, 0.7);
            }

            warnings.Add("No customer detected in speech — select a customer manually.");
            return new VoiceMatchedCustomerDto();
        }

        var scored = dealers
            .Select(d => new { Dealer = d, Score = ScoreDealer(d, spoken, phoneDigits) })
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .ToList();

        if (scored.Count == 0)
        {
            warnings.Add($"No customer match for \"{spoken}\" — select a customer manually.");
            return new VoiceMatchedCustomerDto
            {
                MatchConfidence = 0,
            };
        }

        var best = scored[0];
        var candidates = scored
            .Take(5)
            .Select(x => new VoiceCustomerCandidateDto
            {
                DealerId = x.Dealer.Id,
                DealerName = x.Dealer.DealerName,
                Phone = x.Dealer.Phone,
                City = PrimaryCity(x.Dealer),
            })
            .ToList();

        var ambiguous = scored.Count > 1 && scored[1].Score >= best.Score * 0.9;
        if (ambiguous)
            warnings.Add("Multiple customers matched — confirm the correct customer.");

        var confidence = Math.Min(1.0, best.Score / 100.0);
        if (ambiguous) confidence *= 0.75;

        return ToMatchedCustomer(best.Dealer, Math.Round(confidence, 3), candidates);
    }

    private async Task<List<VoiceMatchedItemDto>> MatchItemsAsync(
        List<VoiceExtractedItemDto> items,
        List<string> warnings)
    {
        var products = await _unitOfWork.Products.Query()
            .Where(p => p.IsActive && !p.IsDeleted)
            .ToListAsync();

        var result = new List<VoiceMatchedItemDto>();
        foreach (var item in items)
        {
            var spoken = (item.Product ?? string.Empty).Trim();
            var qty = item.Quantity <= 0 ? 1 : item.Quantity;
            if (string.IsNullOrWhiteSpace(spoken))
                continue;

            var matches = RankProducts(products, spoken);
            if (matches.Count == 0)
            {
                warnings.Add($"No product match for \"{spoken}\".");
                result.Add(new VoiceMatchedItemDto
                {
                    SpokenProduct = spoken,
                    Quantity = qty,
                    Unit = item.Unit,
                    MatchConfidence = 0,
                });
                continue;
            }

            var top = matches[0];
            var candidates = matches.Take(5).Select(p => new VoiceProductCandidateDto
            {
                ProductId = p.Product.Id,
                ProductName = p.Product.ProductName,
                ProductCode = p.Product.ProductCode,
                Sku = p.Product.SKU,
            }).ToList();

            var ambiguous = matches.Count > 1 && matches[1].Score >= top.Score * 0.85;
            if (ambiguous)
                warnings.Add($"Multiple products matched \"{spoken}\" — pick the correct one.");

            var conf = Math.Min(1.0, top.Score / 100.0);
            if (ambiguous) conf *= 0.7;

            result.Add(new VoiceMatchedItemDto
            {
                SpokenProduct = spoken,
                Quantity = qty,
                Unit = item.Unit ?? top.Product.UnitOfMeasure,
                ProductId = top.Product.Id,
                ProductName = top.Product.ProductName,
                UnitPrice = top.Product.UnitPrice,
                UnitOfMeasure = top.Product.UnitOfMeasure,
                MatchConfidence = Math.Round(conf, 3),
                Candidates = ambiguous ? candidates : new List<VoiceProductCandidateDto>(),
            });
        }

        if (result.Count == 0)
            warnings.Add("No line items detected — add products manually or retry voice.");

        return result;
    }

    private static List<(Domain.Entities.Product.Product Product, int Score)> RankProducts(
        List<Domain.Entities.Product.Product> products,
        string spoken)
    {
        var term = spoken.Trim().ToLowerInvariant();
        var tokens = term.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .SelectMany(ExpandTokenVariants)
            .Where(t => t.Length >= 2)
            .Distinct()
            .ToList();

        return products
            .Select(p => (Product: p, Score: ScoreProduct(p, term, tokens)))
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.Product.ProductName)
            .ToList();
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
            if (Regex.IsMatch(name, $@"\b{Regex.Escape(t)}\b", RegexOptions.IgnoreCase))
                score += 50;
            else if (name.Contains(t, StringComparison.OrdinalIgnoreCase))
                score += 10;
            else if (FieldContains(p.ProductCode, t) || FieldContains(p.SKU, t) || FieldContains(p.Description, t))
                score += 8;
        }
        return score;
    }

    private static bool FieldContains(string? field, string token) =>
        !string.IsNullOrEmpty(field) &&
        field.Contains(token, StringComparison.OrdinalIgnoreCase);

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

    private static int ScoreDealer(Dealer d, string spokenName, string phoneDigits)
    {
        var score = 0;
        var name = (d.DealerName ?? "").ToLowerInvariant();
        var spoken = spokenName.ToLowerInvariant();

        if (!string.IsNullOrWhiteSpace(phoneDigits))
        {
            var dealerPhone = DigitsOnly(d.Phone);
            if (!string.IsNullOrEmpty(dealerPhone) &&
                (dealerPhone.EndsWith(phoneDigits, StringComparison.Ordinal) ||
                 phoneDigits.EndsWith(dealerPhone, StringComparison.Ordinal) ||
                 dealerPhone.Contains(phoneDigits, StringComparison.Ordinal)))
                score += 80;
        }

        if (string.IsNullOrWhiteSpace(spoken))
            return score;

        if (string.Equals(name, spoken, StringComparison.OrdinalIgnoreCase))
            score += 100;
        else if (name.Contains(spoken, StringComparison.OrdinalIgnoreCase) ||
                 spoken.Contains(name, StringComparison.OrdinalIgnoreCase))
            score += 70;
        else
        {
            var spokenTokens = spoken.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Where(t => t.Length >= 3)
                .ToList();
            var hits = spokenTokens.Count(t => name.Contains(t, StringComparison.OrdinalIgnoreCase));
            if (hits > 0)
                score += 25 * hits;
        }

        if (!string.IsNullOrWhiteSpace(d.ContactPerson) &&
            d.ContactPerson.Contains(spoken, StringComparison.OrdinalIgnoreCase))
            score += 20;

        return score;
    }

    private static VoiceMatchedCustomerDto ToMatchedCustomer(
        Dealer d,
        double confidence,
        List<VoiceCustomerCandidateDto>? candidates = null) => new()
    {
        DealerId = d.Id,
        DealerName = d.DealerName,
        Phone = d.Phone ?? d.Mobile,
        Address = PrimaryAddress(d),
        City = PrimaryCity(d),
        MatchConfidence = confidence,
        Candidates = candidates ?? new List<VoiceCustomerCandidateDto>(),
    };

    private static string? PrimaryAddress(Dealer d)
    {
        var addr = d.Addresses?
            .OrderByDescending(a => a.IsDefault)
            .ThenBy(a => a.Id)
            .FirstOrDefault();
        if (addr == null) return d.Notes;
        return string.Join(", ",
            new[] { addr.AddressLine1, addr.AddressLine2, addr.City, addr.State }
                .Where(x => !string.IsNullOrWhiteSpace(x)));
    }

    private static string? PrimaryCity(Dealer d) =>
        d.Addresses?
            .OrderByDescending(a => a.IsDefault)
            .Select(a => a.City)
            .FirstOrDefault(c => !string.IsNullOrWhiteSpace(c));

    private static double ComputeConfidence(
        VoiceExtractedOrderDto extracted,
        VoiceMatchedCustomerDto customer,
        List<VoiceMatchedItemDto> items,
        string? resolvedDate)
    {
        if (items.Count == 0) return 0.2;

        var itemScores = items.Select(i => i.Matched ? i.MatchConfidence : 0).ToList();
        var avgItems = itemScores.Average();
        var customerScore = customer.Matched ? customer.MatchConfidence : 0.25;
        var dateScore = string.IsNullOrWhiteSpace(extracted.DeliveryDate)
            ? 0.85
            : resolvedDate != null ? 0.95 : 0.4;
        var addressScore = string.IsNullOrWhiteSpace(extracted.Address) ? 0.8 : 0.95;

        return (customerScore * 0.30) + (avgItems * 0.50) + (dateScore * 0.10) + (addressScore * 0.10);
    }

    /// <summary>Resolves relative dates like tomorrow / next Monday to YYYY-MM-DD (local server date).</summary>
    internal static string? ResolveDeliveryDate(string? spoken)
    {
        if (string.IsNullOrWhiteSpace(spoken)) return null;
        var t = spoken.Trim();

        if (Regex.IsMatch(t, @"^\d{4}-\d{2}-\d{2}$") &&
            DateTime.TryParseExact(t, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            return t;

        var today = DateTime.Today;
        var lower = t.ToLowerInvariant();

        if (lower is "today" or "aaj")
            return today.ToString("yyyy-MM-dd");
        if (lower is "tomorrow" or "kal" or "gad")
            return today.AddDays(1).ToString("yyyy-MM-dd");
        if (lower.Contains("day after tomorrow") || lower.Contains("parson"))
            return today.AddDays(2).ToString("yyyy-MM-dd");

        var nextDow = Regex.Match(lower, @"\b(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b");
        if (nextDow.Success)
        {
            var target = nextDow.Groups[1].Value switch
            {
                "monday" => DayOfWeek.Monday,
                "tuesday" => DayOfWeek.Tuesday,
                "wednesday" => DayOfWeek.Wednesday,
                "thursday" => DayOfWeek.Thursday,
                "friday" => DayOfWeek.Friday,
                "saturday" => DayOfWeek.Saturday,
                _ => DayOfWeek.Sunday,
            };
            var days = ((int)target - (int)today.DayOfWeek + 7) % 7;
            if (days == 0) days = 7;
            if (lower.Contains("next")) days += days < 7 ? 7 : 0;
            return today.AddDays(days == 0 ? 7 : days).ToString("yyyy-MM-dd");
        }

        if (DateTime.TryParse(t, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsed))
            return parsed.ToString("yyyy-MM-dd");

        return null;
    }

    private static string DigitsOnly(string? value) =>
        string.IsNullOrEmpty(value) ? string.Empty : Regex.Replace(value, @"\D", "");
}

/// <summary>
/// Deterministic local NLP extractor for order speech when no LLM key is configured.
/// Handles multi-item English utterances similar to the product example.
/// </summary>
internal static class LocalVoiceOrderNlp
{
    private static readonly Regex PhoneRegex = new(
        @"(?:\+?\d[\d\s\-()]{7,}\d)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex ForCustomerRegex = new(
        @"\b(?:create\s+(?:an\s+)?order\s+for|order\s+for|for\s+(?:customer|dealer|client)?\s*)(?<name>[A-Za-z0-9][A-Za-z0-9\s.&'-]{1,60}?)(?=\s*[.,]|\s+(?:\d+|deliver|delivery|phone|address|note)|$)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex DeliverToRegex = new(
        @"\b(?:deliver(?:y)?\s+(?:to|at)|ship\s+to|address\s*(?:is|:)?)\s+(?<addr>[^.]+?)(?=\s*(?:\.|$|notes?|phone|on\s+\d))",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    /// <summary>e.g. "deliver tomorrow to Gulberg Lahore"</summary>
    private static readonly Regex DeliverWhenToRegex = new(
        @"\bdeliver(?:y)?\s+(?:tomorrow|today|day after tomorrow|next\s+\w+|on\s+\d{4}-\d{2}-\d{2})\s+to\s+(?<addr>[^.]+?)(?=\s*(?:\.|$|notes?|phone))",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex DeliverDateRegex = new(
        @"\b(?:deliver(?:y)?|ship)\s+(?<when>tomorrow|today|day after tomorrow|next\s+\w+|on\s+\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex NotesRegex = new(
        @"\b(?:notes?|remark|comment)\s*(?:is|:)?\s+(?<notes>.+)$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex ItemRegex = new(
        @"(?<qty>\d+(?:\.\d+)?)\s*(?<unit>bags?|bag|pcs?|pieces?|kg|kgs|tons?|litres?|liters?|l|units?|boxes?|rods?)?\s*(?:of\s+)?(?<product>[A-Za-z][A-Za-z0-9\s\-\/()]{1,40}?)(?=\s*(?:,|and|\d+|deliver|delivery|to\s+|phone|notes?|\.|$))",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public static VoiceExtractedOrderDto Extract(string transcript)
    {
        var text = Normalize(transcript);
        var dto = new VoiceExtractedOrderDto();

        var phoneMatch = PhoneRegex.Match(text);
        if (phoneMatch.Success)
            dto.Phone = phoneMatch.Value.Trim();

        var forMatch = ForCustomerRegex.Match(text);
        if (forMatch.Success)
            dto.Customer = CleanName(forMatch.Groups["name"].Value);

        var deliverWhenTo = DeliverWhenToRegex.Match(text);
        if (deliverWhenTo.Success)
            dto.Address = CleanPhrase(deliverWhenTo.Groups["addr"].Value);

        var deliverTo = DeliverToRegex.Match(text);
        if (string.IsNullOrWhiteSpace(dto.Address) && deliverTo.Success)
            dto.Address = CleanPhrase(deliverTo.Groups["addr"].Value);

        var dateMatch = DeliverDateRegex.Match(text);
        if (dateMatch.Success)
        {
            var when = dateMatch.Groups["when"].Value.Trim();
            if (when.StartsWith("on ", StringComparison.OrdinalIgnoreCase))
                when = when[3..].Trim();
            dto.DeliveryDate = when;
        }
        else if (Regex.IsMatch(text, @"\btomorrow\b", RegexOptions.IgnoreCase))
            dto.DeliveryDate = "Tomorrow";
        else if (Regex.IsMatch(text, @"\btoday\b", RegexOptions.IgnoreCase))
            dto.DeliveryDate = "Today";

        var notesMatch = NotesRegex.Match(text);
        if (notesMatch.Success)
            dto.Notes = CleanPhrase(notesMatch.Groups["notes"].Value);

        foreach (Match m in ItemRegex.Matches(text))
        {
            var product = CleanProduct(m.Groups["product"].Value);
            if (string.IsNullOrWhiteSpace(product) || IsStopProduct(product))
                continue;
            if (!decimal.TryParse(m.Groups["qty"].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var qty))
                qty = 1;
            var unit = m.Groups["unit"].Success ? NormalizeUnit(m.Groups["unit"].Value) : null;
            dto.Items.Add(new VoiceExtractedItemDto
            {
                Product = product,
                Quantity = qty,
                Unit = unit,
            });
        }

        // Fallback: "cement 20 bags" style
        if (dto.Items.Count == 0)
        {
            var alt = Regex.Matches(
                text,
                @"(?<product>[A-Za-z][A-Za-z\s\-]+?)\s+(?<qty>\d+(?:\.\d+)?)\s*(?<unit>bags?|pcs?|kg|rods?)?",
                RegexOptions.IgnoreCase);
            foreach (Match m in alt)
            {
                var product = CleanProduct(m.Groups["product"].Value);
                if (string.IsNullOrWhiteSpace(product) || IsStopProduct(product)) continue;
                if (!decimal.TryParse(m.Groups["qty"].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var qty))
                    continue;
                dto.Items.Add(new VoiceExtractedItemDto
                {
                    Product = product,
                    Quantity = qty,
                    Unit = m.Groups["unit"].Success ? NormalizeUnit(m.Groups["unit"].Value) : null,
                });
            }
        }

        return dto;
    }

    private static string Normalize(string text)
    {
        var t = text.Replace('\n', ' ').Replace('\r', ' ');
        t = Regex.Replace(t, @"\s+", " ").Trim();
        return t;
    }

    private static string CleanName(string value) =>
        Regex.Replace(value, @"\s+", " ").Trim().Trim(',', '.', '-', ' ');

    private static string CleanPhrase(string value) =>
        Regex.Replace(value, @"\s+", " ").Trim().Trim(',', '.', '-', ' ');

    private static string CleanProduct(string value)
    {
        var p = CleanPhrase(value);
        p = Regex.Replace(p, @"\b(and|deliver|delivery|to|for|order|create|please)\b", " ", RegexOptions.IgnoreCase);
        return Regex.Replace(p, @"\s+", " ").Trim().Trim(',', '.', '-', ' ');
    }

    private static bool IsStopProduct(string product)
    {
        var p = product.ToLowerInvariant();
        return p is "order" or "an order" or "customer" or "dealer" or "tomorrow" or "today"
            || p.StartsWith("deliver") || p.Length < 2;
    }

    private static string NormalizeUnit(string unit)
    {
        var u = unit.Trim().ToLowerInvariant();
        return u switch
        {
            "bag" or "bags" => "Bag",
            "pc" or "pcs" or "piece" or "pieces" or "unit" or "units" => "Pcs",
            "kg" or "kgs" => "Kg",
            "ton" or "tons" => "Ton",
            "litre" or "litres" or "liter" or "liters" or "l" => "L",
            "rod" or "rods" => "Pcs",
            "box" or "boxes" => "Box",
            _ => CultureInfo.InvariantCulture.TextInfo.ToTitleCase(u),
        };
    }
}
