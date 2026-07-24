using System.Security.Claims;
using DealerManagement.Application.Common;
using DealerManagement.Application.DTOs.Dealer;
using DealerManagement.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealerManagement.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DealersController : ControllerBase
{
    private readonly IDealerService _dealerService;

    public DealersController(IDealerService dealerService)
    {
        _dealerService = dealerService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<DealerDto>>>> GetDealers([FromQuery] PaginationParams paginationParams)
    {
        var result = await _dealerService.GetDealersAsync(paginationParams);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<DealerDto>>> GetDealer(int id)
    {
        var result = await _dealerService.GetDealerByIdAsync(id);
        if (!result.Success)
            return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<DealerDto>>> CreateDealer([FromBody] CreateDealerRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _dealerService.CreateDealerAsync(request, userId);
        if (!result.Success)
            return BadRequest(result);
        return CreatedAtAction(nameof(GetDealer), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<DealerDto>>> UpdateDealer(int id, [FromBody] UpdateDealerRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _dealerService.UpdateDealerAsync(id, request, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteDealer(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _dealerService.DeleteDealerAsync(id, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }
}
