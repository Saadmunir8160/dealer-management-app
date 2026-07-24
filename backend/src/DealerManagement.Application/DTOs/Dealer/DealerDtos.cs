using DealerManagement.Domain.Enums;

namespace DealerManagement.Application.DTOs.Dealer;

public class DealerDto
{
    public int Id { get; set; }
    public string DealerCode { get; set; } = string.Empty;
    public string DealerName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Website { get; set; }
    public string? TaxId { get; set; }
    public string? RegistrationNumber { get; set; }
    public DealerType DealerType { get; set; }
    public DealerStatus Status { get; set; }
    public decimal CreditLimit { get; set; }
    public int PaymentTermsDays { get; set; }
    public string? Notes { get; set; }
    public List<DealerAddressDto> Addresses { get; set; } = new();
    public List<DealerContactDto> Contacts { get; set; } = new();
    public DateTime CreatedDate { get; set; }
}

public class DealerAddressDto
{
    public int Id { get; set; }
    public AddressType AddressType { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public bool IsDefault { get; set; }
}

public class DealerContactDto
{
    public int Id { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public bool IsPrimary { get; set; }
}

public class CreateDealerRequest
{
    public string DealerName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Website { get; set; }
    public string? TaxId { get; set; }
    public string? RegistrationNumber { get; set; }
    public DealerType DealerType { get; set; }
    public decimal CreditLimit { get; set; }
    public int PaymentTermsDays { get; set; } = 30;
    public string? Notes { get; set; }
    public List<CreateDealerAddressRequest>? Addresses { get; set; }
    public List<CreateDealerContactRequest>? Contacts { get; set; }
}

public class UpdateDealerRequest
{
    public string DealerName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Website { get; set; }
    public string? TaxId { get; set; }
    public string? RegistrationNumber { get; set; }
    public DealerType DealerType { get; set; }
    public DealerStatus Status { get; set; }
    public decimal CreditLimit { get; set; }
    public int PaymentTermsDays { get; set; }
    public string? Notes { get; set; }
}

public class CreateDealerAddressRequest
{
    public AddressType AddressType { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public bool IsDefault { get; set; }
}

public class CreateDealerContactRequest
{
    public string ContactName { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public bool IsPrimary { get; set; }
}
