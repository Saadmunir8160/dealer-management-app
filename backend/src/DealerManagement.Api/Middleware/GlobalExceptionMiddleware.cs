using System.Net;
using System.Text.Json;
using DealerManagement.Application.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace DealerManagement.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = exception switch
        {
            ArgumentNullException => new
            {
                Success = false,
                Message = "Required data was not provided.",
                StatusCode = (int)HttpStatusCode.BadRequest
            },
            UnauthorizedAccessException => new
            {
                Success = false,
                Message = "You are not authorized to perform this action.",
                StatusCode = (int)HttpStatusCode.Forbidden
            },
            KeyNotFoundException => new
            {
                Success = false,
                Message = "The requested resource was not found.",
                StatusCode = (int)HttpStatusCode.NotFound
            },
            InvalidOperationException => new
            {
                Success = false,
                Message = exception.Message,
                StatusCode = (int)HttpStatusCode.BadRequest
            },
            _ => new
            {
                Success = false,
                Message = "An internal server error occurred. Please try again later.",
                StatusCode = (int)HttpStatusCode.InternalServerError
            }
        };

        context.Response.StatusCode = response.StatusCode;

        var result = JsonSerializer.Serialize(new
        {
            success = response.Success,
            message = response.Message,
            statusCode = response.StatusCode
        });

        await context.Response.WriteAsync(result);
    }
}
