using System.Globalization;
using System.Text.RegularExpressions;
using DealerManagement.Application.DTOs.Voice;
using DealerManagement.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace DealerManagement.Infrastructure.Services;

/// <summary>
/// Rule-based voice intent parser.
/// Supports EN / AR / UR create/add/update/delete/show/confirm/cancel.
/// Product names are left as spoken tokens for DB matching (never hardcoded catalog).
/// </summary>
public class VoiceCommandParser : IVoiceCommandParser
{
    private readonly ILogger<VoiceCommandParser> _logger;

    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "a", "an", "the", "for", "of", "to", "my", "please", "order", "orders",
        "quantity", "qty", "bags", "bag", "pieces", "piece", "units", "unit",
        "create", "add", "update", "change", "set", "delete", "remove", "show",
        "search", "open", "confirm", "cancel", "continue", "and", "with",
        // Arabic
        "من", "الى", "إلى", "على", "في", "و", "الطلب", "طلب", "كمية", "قطعة", "قطع", "كيس", "اكياس", "أكياس",
        // Urdu
        "کا", "کی", "کے", "اور", "سے", "میں", "آرڈر", "آرڈرز", "مقدار", "عدد"
    };

    public VoiceCommandParser(ILogger<VoiceCommandParser> logger)
    {
        _logger = logger;
    }

    public ParsedVoiceCommand Parse(string text)
    {
        var raw = (text ?? string.Empty).Trim();
        var normalized = Normalize(raw);

        var result = new ParsedVoiceCommand { RawText = raw, Intent = "unknown" };

        if (string.IsNullOrWhiteSpace(normalized))
        {
            _logger.LogWarning("Empty voice text received");
            return result;
        }

        // Intent-only
        if (IsMatch(normalized, @"\b(confirm|confirm order|place order)\b") ||
            ContainsAny(normalized, "تأكيد", "تاكيد", "أكد", "اكد", "تصدیق", "تصدیق کریں"))
        {
            result.Intent = "confirm";
            return result;
        }
        if (IsMatch(normalized, @"\b(cancel|cancel order|abort)\b") ||
            ContainsAny(normalized, "إلغاء", "الغاء", "الغي", "ألغي", "منسوخ", "منسوخ کریں"))
        {
            result.Intent = "cancel";
            return result;
        }
        if (IsMatch(normalized, @"\b(continue|continue order|keep going)\b") ||
            ContainsAny(normalized, "متابعة", "استمر", "جاری"))
        {
            result.Intent = "continue";
            return result;
        }
        if (IsMatch(normalized, @"\b(show( my)? order|view( my)? order|what('?s| is) (in )?my order)\b") ||
            ContainsAny(normalized, "أظهر الطلب", "اظهر الطلب", "عرض الطلب", "آرڈر دکھائیں", "آرڈر دیکھو"))
        {
            result.Intent = "show";
            return result;
        }
        if (IsMatch(normalized, @"\b(search order|find order|open order)\b"))
        {
            result.Intent = IsMatch(normalized, @"\bopen\b") ? "open" : "search";
            return result;
        }

        // Update EN: "update rod quantity to 50"
        var updateMatch = Regex.Match(
            normalized,
            @"\b(?:update|change|set)\s+(.+?)\s+(?:quantity\s+)?(?:to|=)\s+(\d+(?:\.\d+)?)\b",
            RegexOptions.IgnoreCase);
        if (updateMatch.Success)
        {
            result.Intent = "update";
            result.Product = CleanProduct(updateMatch.Groups[1].Value);
            result.Quantity = ParseQty(updateMatch.Groups[2].Value);
            return result;
        }

        // Update AR: "غير كمية الحديد الى 50" / "حدث الاسمنت الى 20"
        var updateAr = Regex.Match(
            normalized,
            @"(?:غير|غيّر|حدث|حدّث|عدل|عدّل|تحديث)\s+(?:كمية\s+)?(.+?)\s+(?:الى|إلى|=|to)\s+(\d+(?:\.\d+)?)");
        if (updateAr.Success)
        {
            result.Intent = "update";
            result.Product = CleanProduct(updateAr.Groups[1].Value);
            result.Quantity = ParseQty(updateAr.Groups[2].Value);
            return result;
        }

        // Delete EN
        var deleteMatch = Regex.Match(
            normalized,
            @"\b(?:delete|remove)\s+(.+)$",
            RegexOptions.IgnoreCase);
        if (deleteMatch.Success)
        {
            result.Intent = "delete";
            result.Product = CleanProduct(deleteMatch.Groups[1].Value);
            return result;
        }

        // Delete AR / UR
        var deleteAr = Regex.Match(
            normalized,
            @"(?:احذف|حذف|ازل|أزل|شيل|مٹاؤ|ہٹاؤ|حذف کریں)\s+(.+)$");
        if (deleteAr.Success)
        {
            result.Intent = "delete";
            result.Product = CleanProduct(deleteAr.Groups[1].Value);
            return result;
        }

        // Create / Add EN: "add 20 rods" / "I need 20 rods"
        var createAddMatch = Regex.Match(
            normalized,
            @"\b(?:(?:create(?:\s+order)?(?:\s+for)?)|add|order|(?:i\s+)?(?:need|want)|give\s+me)\s+(\d+(?:\.\d+)?)\s+(.+)$",
            RegexOptions.IgnoreCase);
        if (createAddMatch.Success)
        {
            result.Intent = IsMatch(normalized, @"\b(create|need|want)\b") ? "create" : "add";
            result.Quantity = ParseQty(createAddMatch.Groups[1].Value);
            result.Product = CleanProduct(createAddMatch.Groups[2].Value);
            return result;
        }

        // Create / Add AR: "اضف 20 حديد" / "أريد 15 اسمنت" / "ابي 10 طوب"
        var createAr = Regex.Match(
            normalized,
            @"(?:اضف|أضف|اضافة|إضافة|اطلب|أريد|اريد|ابي|أبغى|ابغى|أحتاج|احتاج)\s+(\d+(?:\.\d+)?)\s+(.+)$");
        if (createAr.Success)
        {
            result.Intent = "add";
            result.Quantity = ParseQty(createAr.Groups[1].Value);
            result.Product = CleanProduct(createAr.Groups[2].Value);
            return result;
        }

        // Create / Add UR: "شامل کریں 20 rod" / "مجھے 15 cement چاہیے"
        var createUr = Regex.Match(
            normalized,
            @"(?:شامل(?:\s+کریں|\s+کرو)?|add|آرڈر)\s+(\d+(?:\.\d+)?)\s+(.+)$",
            RegexOptions.IgnoreCase);
        if (createUr.Success)
        {
            result.Intent = "add";
            result.Quantity = ParseQty(createUr.Groups[1].Value);
            result.Product = CleanProduct(createUr.Groups[2].Value);
            return result;
        }

        var needUr = Regex.Match(
            normalized,
            @"مجھے\s+(\d+(?:\.\d+)?)\s+(.+?)(?:\s+چاہیے)?$");
        if (needUr.Success)
        {
            result.Intent = "create";
            result.Quantity = ParseQty(needUr.Groups[1].Value);
            result.Product = CleanProduct(needUr.Groups[2].Value);
            return result;
        }

        // Bare: "20 rods"
        var bareMatch = Regex.Match(
            normalized,
            @"^(\d+(?:\.\d+)?)\s+(.+)$",
            RegexOptions.IgnoreCase);
        if (bareMatch.Success)
        {
            result.Intent = "create";
            result.Quantity = ParseQty(bareMatch.Groups[1].Value);
            result.Product = CleanProduct(bareMatch.Groups[2].Value);
            return result;
        }

        // Alternate EN: "add bags 40"
        var altMatch = Regex.Match(
            normalized,
            @"\b(?:create(?:\s+order)?(?:\s+for)?|add)\s+(.+?)\s+(\d+(?:\.\d+)?)\b",
            RegexOptions.IgnoreCase);
        if (altMatch.Success)
        {
            result.Intent = IsMatch(normalized, @"\bcreate\b") ? "create" : "add";
            result.Product = CleanProduct(altMatch.Groups[1].Value);
            result.Quantity = ParseQty(altMatch.Groups[2].Value);
            return result;
        }

        // Alternate AR: "اضف حديد 20"
        var altAr = Regex.Match(
            normalized,
            @"(?:اضف|أضف|اضافة|إضافة)\s+(.+?)\s+(\d+(?:\.\d+)?)$");
        if (altAr.Success)
        {
            result.Intent = "add";
            result.Product = CleanProduct(altAr.Groups[1].Value);
            result.Quantity = ParseQty(altAr.Groups[2].Value);
            return result;
        }

        _logger.LogInformation("Unrecognized voice command: {Text}", raw);
        return result;
    }

    private static string Normalize(string raw)
    {
        var t = NormalizeDigits(raw ?? string.Empty);
        t = Regex.Replace(t.ToLowerInvariant(), @"\s+", " ").Trim();
        return t;
    }

    private static string NormalizeDigits(string raw)
    {
        var map = new Dictionary<char, char>
        {
            ['٠'] = '0', ['١'] = '1', ['٢'] = '2', ['٣'] = '3', ['٤'] = '4',
            ['٥'] = '5', ['٦'] = '6', ['٧'] = '7', ['٨'] = '8', ['٩'] = '9',
            ['۰'] = '0', ['۱'] = '1', ['۲'] = '2', ['۳'] = '3', ['۴'] = '4',
            ['۵'] = '5', ['۶'] = '6', ['۷'] = '7', ['۸'] = '8', ['۹'] = '9',
        };
        var chars = raw.ToCharArray();
        for (var i = 0; i < chars.Length; i++)
        {
            if (map.TryGetValue(chars[i], out var d)) chars[i] = d;
        }
        return new string(chars);
    }

    private static bool ContainsAny(string input, params string[] phrases) =>
        phrases.Any(p => input.Contains(p, StringComparison.OrdinalIgnoreCase));

    private static bool IsMatch(string input, string pattern) =>
        Regex.IsMatch(input, pattern, RegexOptions.IgnoreCase);

    private static decimal? ParseQty(string value) =>
        decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var q) ? q : null;

    private static string? CleanProduct(string phrase)
    {
        if (string.IsNullOrWhiteSpace(phrase)) return null;

        var tokens = phrase
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(t => !StopWords.Contains(t) && !Regex.IsMatch(t, @"^\d+(\.\d+)?$"))
            .ToArray();

        var cleaned = tokens.Length > 0
            ? string.Join(' ', tokens)
            : phrase.Trim();

        return string.IsNullOrWhiteSpace(cleaned) ? null : cleaned;
    }
}
