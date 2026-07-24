using DealerManagement.Domain.Common;
using DealerManagement.Domain.Enums;

namespace DealerManagement.Domain.Entities.Config;

public class AppSetting : BaseEntity
{
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public string? Description { get; set; }
    public SettingType SettingType { get; set; } = SettingType.String;
    public string? Category { get; set; }
}
