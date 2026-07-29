using DealerManagement.Application.Common;
using DealerManagement.Application.DTOs.Voice;

namespace DealerManagement.Application.Interfaces.Services;

/// <summary>
/// Parses free-form speech into intent / product / quantity.
/// Pure text logic — no database access.
/// </summary>
public interface IVoiceCommandParser
{
    ParsedVoiceCommand Parse(string text);
}

/// <summary>
/// Orchestrates draft-order workflow for voice commands.
/// </summary>
public interface IVoiceOrderService
{
    Task<ApiResponse<VoiceProcessResponse>> ProcessAsync(VoiceProcessRequest request, int userId);
}

/// <summary>
/// Extracts structured order fields from free-form speech and matches
/// customers/products against existing records. Does not create orders.
/// </summary>
public interface IVoiceOrderExtractionService
{
    Task<ApiResponse<VoiceExtractResponse>> ExtractAsync(VoiceExtractRequest request);
}
