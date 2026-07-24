using AutoMapper;
using DealerManagement.Application.Common;
using DealerManagement.Application.DTOs.Dealer;
using DealerManagement.Application.Interfaces;
using DealerManagement.Application.Interfaces.Services;
using DealerManagement.Domain.Entities.Dealer;
using DealerManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealerManagement.Infrastructure.Services;

public class DealerService : IDealerService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public DealerService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PagedResult<DealerDto>>> GetDealersAsync(PaginationParams paginationParams)
    {
        var (items, totalCount) = await _unitOfWork.Dealers.GetPagedAsync(
            paginationParams.PageNumber,
            paginationParams.PageSize,
            filter: d => string.IsNullOrEmpty(paginationParams.Search) ||
                        d.DealerName.Contains(paginationParams.Search) ||
                        d.DealerCode.Contains(paginationParams.Search) ||
                        d.Email!.Contains(paginationParams.Search),
            orderBy: q => paginationParams.SortDescending
                ? q.OrderByDescending(d => d.CreatedDate)
                : q.OrderBy(d => d.CreatedDate),
            includeProperties: "Addresses,Contacts");

        var dtos = _mapper.Map<IEnumerable<DealerDto>>(items);
        var result = new PagedResult<DealerDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize
        };

        return ApiResponse<PagedResult<DealerDto>>.SuccessResponse(result);
    }

    public async Task<ApiResponse<DealerDto>> GetDealerByIdAsync(int id)
    {
        var dealer = await _unitOfWork.Dealers.Query()
            .Include(d => d.Addresses)
            .Include(d => d.Contacts)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dealer == null)
            return ApiResponse<DealerDto>.FailResponse("Dealer not found");

        var dto = _mapper.Map<DealerDto>(dealer);
        return ApiResponse<DealerDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<DealerDto>> CreateDealerAsync(CreateDealerRequest request, int userId)
    {
        // Generate unique dealer code
        var dealerCode = $"DLR-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}";

        var dealer = _mapper.Map<Domain.Entities.Dealer.Dealer>(request);
        dealer.DealerCode = dealerCode;
        dealer.Status = DealerStatus.Active;
        dealer.CreatedBy = userId;

        await _unitOfWork.Dealers.AddAsync(dealer);
        await _unitOfWork.SaveChangesAsync();

        // Reload with navigation properties
        var created = await _unitOfWork.Dealers.Query()
            .Include(d => d.Addresses)
            .Include(d => d.Contacts)
            .FirstAsync(d => d.Id == dealer.Id);

        var dto = _mapper.Map<DealerDto>(created);
        return ApiResponse<DealerDto>.SuccessResponse(dto, "Dealer created successfully");
    }

    public async Task<ApiResponse<DealerDto>> UpdateDealerAsync(int id, UpdateDealerRequest request, int userId)
    {
        var dealer = await _unitOfWork.Dealers.GetByIdAsync(id);
        if (dealer == null)
            return ApiResponse<DealerDto>.FailResponse("Dealer not found");

        dealer.DealerName = request.DealerName;
        dealer.ContactPerson = request.ContactPerson;
        dealer.Email = request.Email;
        dealer.Phone = request.Phone;
        dealer.Mobile = request.Mobile;
        dealer.Website = request.Website;
        dealer.TaxId = request.TaxId;
        dealer.RegistrationNumber = request.RegistrationNumber;
        dealer.DealerType = request.DealerType;
        dealer.Status = request.Status;
        dealer.CreditLimit = request.CreditLimit;
        dealer.PaymentTermsDays = request.PaymentTermsDays;
        dealer.Notes = request.Notes;
        dealer.UpdatedBy = userId;

        _unitOfWork.Dealers.Update(dealer);
        await _unitOfWork.SaveChangesAsync();

        var updated = await _unitOfWork.Dealers.Query()
            .Include(d => d.Addresses)
            .Include(d => d.Contacts)
            .FirstAsync(d => d.Id == dealer.Id);

        var dto = _mapper.Map<DealerDto>(updated);
        return ApiResponse<DealerDto>.SuccessResponse(dto, "Dealer updated successfully");
    }

    public async Task<ApiResponse<bool>> DeleteDealerAsync(int id, int userId)
    {
        var dealer = await _unitOfWork.Dealers.GetByIdAsync(id);
        if (dealer == null)
            return ApiResponse<bool>.FailResponse("Dealer not found");

        dealer.IsDeleted = true;
        dealer.IsActive = false;
        dealer.UpdatedBy = userId;
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Dealer deleted successfully");
    }
}
