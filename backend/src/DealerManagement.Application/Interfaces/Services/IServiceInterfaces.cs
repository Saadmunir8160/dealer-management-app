using DealerManagement.Application.Common;
using DealerManagement.Application.DTOs.Auth;

namespace DealerManagement.Application.Interfaces.Services;

public interface IAuthService
{
    Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request);
    Task<ApiResponse<AuthResponse>> RegisterAsync(RegisterRequest request);
    Task<ApiResponse<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request);
    Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<ApiResponse<bool>> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequest request);
    Task<ApiResponse<UserDto>> GetProfileAsync(int userId);
    Task<ApiResponse<UserDto>> UpdateProfileAsync(int userId, RegisterRequest request);
    Task RevokeRefreshTokenAsync(int userId);
}

public interface IDealerService
{
    Task<ApiResponse<PagedResult<DTOs.Dealer.DealerDto>>> GetDealersAsync(PaginationParams paginationParams);
    Task<ApiResponse<DTOs.Dealer.DealerDto>> GetDealerByIdAsync(int id);
    Task<ApiResponse<DTOs.Dealer.DealerDto>> CreateDealerAsync(DTOs.Dealer.CreateDealerRequest request, int userId);
    Task<ApiResponse<DTOs.Dealer.DealerDto>> UpdateDealerAsync(int id, DTOs.Dealer.UpdateDealerRequest request, int userId);
    Task<ApiResponse<bool>> DeleteDealerAsync(int id, int userId);
}

public interface IOrderService
{
    Task<ApiResponse<PagedResult<DTOs.Order.OrderDto>>> GetOrdersAsync(PaginationParams paginationParams, int? dealerId = null);
    Task<ApiResponse<DTOs.Order.OrderDto>> GetOrderByIdAsync(int id);
    Task<ApiResponse<DTOs.Order.OrderDto>> CreateOrderAsync(DTOs.Order.CreateOrderRequest request, int userId);
    Task<ApiResponse<DTOs.Order.OrderDto>> UpdateOrderStatusAsync(int id, DTOs.Order.UpdateOrderStatusRequest request, int userId);
    Task<ApiResponse<bool>> DeleteOrderAsync(int id);
}

public interface IProductService
{
    Task<ApiResponse<PagedResult<DTOs.Order.ProductDto>>> GetProductsAsync(PaginationParams paginationParams);
    Task<ApiResponse<DTOs.Order.ProductDto>> GetProductByIdAsync(int id);
    Task<ApiResponse<IEnumerable<DTOs.Order.ProductDto>>> GetAllProductsAsync();
}

public interface IDashboardService
{
    Task<ApiResponse<DTOs.Order.DashboardDto>> GetDashboardAsync();
}
