namespace DealerManagement.Domain.Enums;

public enum OrderStatus
{
    Draft = 0,
    Pending = 1,
    Confirmed = 2,
    Processing = 3,
    Shipped = 4,
    Delivered = 5,
    Completed = 6,
    Cancelled = 7,
    Returned = 8
}

public enum PaymentStatus
{
    Pending = 0,
    Partial = 1,
    Paid = 2,
    Overdue = 3,
    Refunded = 4,
    Cancelled = 5
}

public enum PaymentMethod
{
    Cash = 0,
    CreditCard = 1,
    BankTransfer = 2,
    Check = 3,
    OnlinePayment = 4
}

public enum AddressType
{
    Billing = 0,
    Shipping = 1,
    Warehouse = 2,
    Office = 3
}

public enum DealerType
{
    Authorized = 0,
    Premium = 1,
    Distributor = 2,
    Retailer = 3,
    Wholesaler = 4
}

public enum DealerStatus
{
    Pending = 0,
    Active = 1,
    Suspended = 2,
    Terminated = 3
}

public enum StockMovementType
{
    In = 0,
    Out = 1,
    Adjustment = 2,
    Return = 3,
    Transfer = 4
}

public enum NotificationType
{
    Order = 0,
    Dealer = 1,
    System = 2,
    Alert = 3
}

public enum NotificationCategory
{
    Info = 0,
    Warning = 1,
    Error = 2,
    Success = 3
}

public enum InvoiceStatus
{
    Draft = 0,
    Sent = 1,
    Paid = 2,
    Overdue = 3,
    Cancelled = 4
}

public enum TaxType
{
    GST = 0,
    VAT = 1,
    SalesTax = 2,
    ServiceTax = 3,
    CustomDuty = 4
}

public enum AuditAction
{
    Create = 0,
    Update = 1,
    Delete = 2,
    Login = 3,
    Logout = 4,
    View = 5,
    Export = 6
}

public enum LogLevel
{
    Debug = 0,
    Info = 1,
    Warning = 2,
    Error = 3,
    Critical = 4
}

public enum SettingType
{
    String = 0,
    Number = 1,
    Boolean = 2,
    Json = 3,
    Date = 4
}
