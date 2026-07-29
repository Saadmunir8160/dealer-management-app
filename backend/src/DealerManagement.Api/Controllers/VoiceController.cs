using System.Security.Claims;
using DealerManagement.Application.Common;
using DealerManagement.Application.DTOs.Voice;
using DealerManagement.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealerManagement.Api.Controllers;

/// <summary>
/// Voice order endpoints:
/// POST /api/voice/extract — AI/NLP structured extraction + catalog matching (autofill New Order form)
/// POST /api/voice/process — legacy draft command workflow (add/update/confirm)
/// </summary>
[Route("api/voice")]
[ApiController]
[Authorize]
public class VoiceController : ControllerBase
{
    private readonly IVoiceOrderService _voiceOrderService;
    private readonly IVoiceOrderExtractionService _extractionService;
    private readonly ILogger<VoiceController> _logger;

    public VoiceController(
        IVoiceOrderService voiceOrderService,
        IVoiceOrderExtractionService extractionService,
        ILogger<VoiceController> logger)
    {
        _voiceOrderService = voiceOrderService;
        _extractionService = extractionService;
        _logger = logger;
    }

    /// <summary>
    /// Extract structured order fields from speech and match customers/products.
    /// Does not create an order — client autofills the form and saves via POST /api/orders.
    /// </summary>
    [HttpPost("extract")]
    public async Task<ActionResult<ApiResponse<VoiceExtractResponse>>> Extract([FromBody] VoiceExtractRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out _))
            return Unauthorized(ApiResponse<VoiceExtractResponse>.FailResponse("Unauthorized"));

        _logger.LogInformation(
            "Voice extract requested (preferredCustomer={PreferredCustomerId}, len={Len})",
            request.PreferredCustomerId,
            request.Text?.Length ?? 0);

        var result = await _extractionService.ExtractAsync(request);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Process a voice (or typed) command for a customer/dealer (draft mutation).
    /// </summary>
    [HttpPost("process")]
    public async Task<ActionResult<ApiResponse<VoiceProcessResponse>>> Process([FromBody] VoiceProcessRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized(ApiResponse<VoiceProcessResponse>.FailResponse("Unauthorized"));

        _logger.LogInformation("Voice process for customer {CustomerId}: {Text}", request.CustomerId, request.Text);

        var result = await _voiceOrderService.ProcessAsync(request, userId);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}
