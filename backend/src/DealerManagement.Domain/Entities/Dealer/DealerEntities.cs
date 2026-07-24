using DealerManagement.Domain.Common;
using DealerManagement.Domain.Enums;

namespace DealerManagement.Domain.Entities.Dealer;

public class Dealer : BaseEntity
{
    public string DealerCode { get; set; } = string.Empty;
    public string DealerName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Website { get; set; }
    public string? TaxId { get; set; }
    public string? RegistrationNumber { get; set; }
    public DealerType DealerType { get; set; } = DealerType.Authorized;
    public DealerStatus Status { get; set; } = DealerStatus.Pending;
    public decimal CreditLimit { get; set; } = 0;
    public int PaymentTermsDays { get; set; } = 30;
    public string? Notes { get; set; }

    // Navigation properties
    public ICollection<DealerAddress> Addresses { get; set; } = new List<DealerAddress>();
    public ICollection<DealerContact> Contacts { get; set; } = new List<DealerContact>();
    public ICollection<Sales.Order> Orders { get; set; } = new List<Sales.Order>();
    public ICollection<Finance.Payment> Payments { get; set; } = new List<Finance.Payment>();
    public ICollection<Finance.Invoice> Invoices { get; set; } = new List<Finance.Invoice>();
}

public class DealerAddress : BaseEntity
{
    public int DealerId { get; set; }
    public AddressType AddressType { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool IsDefault { get; set; } = false;

    // Navigation properties
    public Dealer Dealer { get; set; } = null!;
}

public class DealerContact : BaseEntity
{
    public int DealerId { get; set; }
    public string ContactName { get; set; } = string.Empty;
    public string? Designation { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public bool IsPrimary { get; set; } = false;

    // Navigation properties
    public Dealer Dealer { get; set; } = null!;
}
