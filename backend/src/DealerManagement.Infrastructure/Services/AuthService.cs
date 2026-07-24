using AutoMapper;
using DealerManagement.Application.Common;
using DealerManagement.Application.DTOs.Auth;
using DealerManagement.Application.Interfaces;
using DealerManagement.Application.Interfaces.Services;
using DealerManagement.Domain.Entities.Auth;
using DealerManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealerManagement.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtService _jwtService;
    private readonly IMapper _mapper;
    private readonly JwtSettings _jwtSettings;

    public AuthService(IUnitOfWork unitOfWork, IJwtService jwtService, IMapper mapper, Microsoft.Extensions.Options.IOptions<JwtSettings> jwtSettings)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
        _mapper = mapper;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request)
    {
        var user = await _unitOfWork.Users.Query()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => (u.Username == request.Username || u.Email == request.Username) && u.IsActive);

        if (user == null)
            return ApiResponse<AuthResponse>.FailResponse("Invalid credentials");

        if (user.LockedUntil.HasValue && user.LockedUntil > DateTime.UtcNow)
            return ApiResponse<AuthResponse>.FailResponse("Account is locked. Please try again later.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 5)
            {
                user.LockedUntil = DateTime.UtcNow.AddMinutes(15);
            }
            await _unitOfWork.SaveChangesAsync();
            return ApiResponse<AuthResponse>.FailResponse("Invalid credentials");
        }

        // Reset failed attempts on successful login
        user.FailedLoginAttempts = 0;
        user.LockedUntil = null;
        user.LastLoginDate = DateTime.UtcNow;

        var roles = user.UserRoles.Select(ur => ur.Role.RoleName).ToList();
        var accessToken = _jwtService.GenerateAccessToken(user, roles);
        var refreshToken = _jwtService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);
        await _unitOfWork.SaveChangesAsync();

        var response = new AuthResponse
        {
            Token = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles
        };

        return ApiResponse<AuthResponse>.SuccessResponse(response, "Login successful");
    }

    public async Task<ApiResponse<AuthResponse>> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _unitOfWork.Users.AnyAsync(u => u.Username == request.Username || u.Email == request.Email);
        if (existingUser)
            return ApiResponse<AuthResponse>.FailResponse("Username or email already exists");

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            IsActive = true
        };

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        // Assign default "User" role
        var defaultRole = await _unitOfWork.Roles.FirstOrDefaultAsync(r => r.RoleName == "User");
        if (defaultRole != null)
        {
            await _unitOfWork.UserRoles.AddAsync(new UserRole { UserId = user.Id, RoleId = defaultRole.Id });
            await _unitOfWork.SaveChangesAsync();
        }

        var roles = new List<string> { "User" };
        var accessToken = _jwtService.GenerateAccessToken(user, roles);
        var refreshToken = _jwtService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);
        await _unitOfWork.SaveChangesAsync();

        var response = new AuthResponse
        {
            Token = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles
        };

        return ApiResponse<AuthResponse>.SuccessResponse(response, "Registration successful");
    }

    public async Task<ApiResponse<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var userId = _jwtService.ValidateToken(request.Token);
        if (userId == null)
            return ApiResponse<AuthResponse>.FailResponse("Invalid token");

        var user = await _unitOfWork.Users.Query()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            return ApiResponse<AuthResponse>.FailResponse("Invalid or expired refresh token");

        var roles = user.UserRoles.Select(ur => ur.Role.RoleName).ToList();
        var newAccessToken = _jwtService.GenerateAccessToken(user, roles);
        var newRefreshToken = _jwtService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);
        await _unitOfWork.SaveChangesAsync();

        var response = new AuthResponse
        {
            Token = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles
        };

        return ApiResponse<AuthResponse>.SuccessResponse(response, "Token refreshed");
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            return ApiResponse<bool>.FailResponse("User not found");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return ApiResponse<bool>.FailResponse("Current password is incorrect");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Password changed successfully");
    }

    public async Task<ApiResponse<bool>> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
            return ApiResponse<bool>.SuccessResponse(true, "If email exists, reset link will be sent"); // Don't reveal if email exists

        user.ResetToken = _jwtService.GenerateRefreshToken();
        user.ResetTokenExpiryTime = DateTime.UtcNow.AddHours(1);
        await _unitOfWork.SaveChangesAsync();

        // TODO: Send email with reset link containing the token
        return ApiResponse<bool>.SuccessResponse(true, "If email exists, reset link will be sent");
    }

    public async Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _unitOfWork.Users.FirstOrDefaultAsync(u => u.Email == request.Email && u.ResetToken == request.Token);
        if (user == null || user.ResetTokenExpiryTime <= DateTime.UtcNow)
            return ApiResponse<bool>.FailResponse("Invalid or expired reset token");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.ResetToken = null;
        user.ResetTokenExpiryTime = null;
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Password reset successfully");
    }

    public async Task<ApiResponse<UserDto>> GetProfileAsync(int userId)
    {
        var user = await _unitOfWork.Users.Query()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return ApiResponse<UserDto>.FailResponse("User not found");

        var dto = _mapper.Map<UserDto>(user);
        return ApiResponse<UserDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<UserDto>> UpdateProfileAsync(int userId, RegisterRequest request)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            return ApiResponse<UserDto>.FailResponse("User not found");

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.PhoneNumber = request.PhoneNumber;
        await _unitOfWork.SaveChangesAsync();

        var updatedUser = await _unitOfWork.Users.Query()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstAsync(u => u.Id == userId);

        var dto = _mapper.Map<UserDto>(updatedUser);
        return ApiResponse<UserDto>.SuccessResponse(dto, "Profile updated");
    }

    public async Task RevokeRefreshTokenAsync(int userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
