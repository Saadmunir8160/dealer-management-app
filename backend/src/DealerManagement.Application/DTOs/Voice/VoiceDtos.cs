namespace DealerManagement.Application.DTOs.Voice;

/// <summary>
/// Incoming spoken (or typed) command from the mobile client.
/// CustomerId maps to DealerId in this portal.
/// </summary>
public class VoiceProcessRequest
{
    public int CustomerId { get; set; }
    public string Text { get; set; } = string.Empty;
    /// <summary>Optional: continue a known draft; otherwise active draft is resolved.</summary>
    public int? OrderId { get; set; }
    /// <summary>When multiple products matched, client can resubmit with a chosen product name.</summary>
    public string? SelectedProductName { get; set; }
}

public class VoiceProcessResponse
{
    public bool Success { get; set; }
    public int? OrderId { get; set; }
    public string Intent { get; set; } = string.Empty;
    public string? Product { get; set; }
    public decimal? Quantity { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string? OrderStatus { get; set; }
    public List<VoiceOrderItemDto> Items { get; set; } = new();
    public List<VoiceProductCandidateDto>? Candidates { get; set; }
}

public class VoiceOrderItemDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

public class VoiceProductCandidateDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductCode { get; set; }
    public string? Sku { get; set; }
}

/// <summary>Result of parsing raw speech text into a structured intent.</summary>
public class ParsedVoiceCommand
{
    public string Intent { get; set; } = "unknown";
    public string? Product { get; set; }
    public decimal? Quantity { get; set; }
    public string RawText { get; set; } = string.Empty;
}

/// <summary>
/// Natural-language utterance to extract into a structured order draft (AI / local NLP).
/// Does not mutate orders — client autofills the form and saves via POST /api/orders.
/// </summary>
public class VoiceExtractRequest
{
    public string Text { get; set; } = string.Empty;
    /// <summary>Optional hint when the user already selected a customer.</summary>
    public int? PreferredCustomerId { get; set; }
}

/// <summary>Raw structured fields extracted from speech before DB matching.</summary>
public class VoiceExtractedOrderDto
{
    public string? Customer { get; set; }
    public string? Phone { get; set; }
    public List<VoiceExtractedItemDto> Items { get; set; } = new();
    public string? DeliveryDate { get; set; }
    public string? Address { get; set; }
    public string? Notes { get; set; }
}

public class VoiceExtractedItemDto
{
    public string Product { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public string? Unit { get; set; }
}

/// <summary>Product match against the catalog for one spoken line item.</summary>
public class VoiceMatchedItemDto
{
    public string SpokenProduct { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string? Unit { get; set; }
    public int? ProductId { get; set; }
    public string? ProductName { get; set; }
    public decimal? UnitPrice { get; set; }
    public string? UnitOfMeasure { get; set; }
    public double MatchConfidence { get; set; }
    public bool Matched => ProductId.HasValue && ProductId.Value > 0;
    public List<VoiceProductCandidateDto> Candidates { get; set; } = new();
}

public class VoiceMatchedCustomerDto
{
    public int? DealerId { get; set; }
    public string? DealerName { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public double MatchConfidence { get; set; }
    public bool Matched => DealerId.HasValue && DealerId.Value > 0;
    public List<VoiceCustomerCandidateDto> Candidates { get; set; } = new();
}

public class VoiceCustomerCandidateDto
{
    public int DealerId { get; set; }
    public string DealerName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? City { get; set; }
}

public class VoiceExtractResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    /// <summary>0–1 overall confidence. Below threshold → NeedsReview.</summary>
    public double Confidence { get; set; }
    public bool NeedsReview { get; set; }
    public string ExtractionEngine { get; set; } = "local";
    public string Transcript { get; set; } = string.Empty;
    public VoiceExtractedOrderDto Extracted { get; set; } = new();
    public VoiceMatchedCustomerDto Customer { get; set; } = new();
    public List<VoiceMatchedItemDto> MatchedItems { get; set; } = new();
    public string? ResolvedDeliveryDate { get; set; }
    public List<string> Warnings { get; set; } = new();
}
