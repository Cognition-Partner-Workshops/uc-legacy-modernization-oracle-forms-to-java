using System.ComponentModel;
using Microsoft.SemanticKernel;

namespace SupportAgent.ApiService.Plugins;

public class KnowledgeBasePlugin
{
    private static readonly Dictionary<string, string> KnowledgeBase = new(StringComparer.OrdinalIgnoreCase)
    {
        ["password reset"] = """
            **Password Reset Instructions:**
            1. Go to the login page and click "Forgot Password".
            2. Enter the email address associated with your account.
            3. Check your inbox (and spam folder) for a password reset email.
            4. Click the reset link in the email (valid for 24 hours).
            5. Enter your new password (minimum 8 characters, must include uppercase, lowercase, and a number).
            6. If you don't receive the email within 5 minutes, try again or contact support.
            """,

        ["billing"] = """
            **Billing & Subscription Information:**
            - Plans: Starter ($19.99/mo), Professional ($49.99/mo), Enterprise ($99.99/mo)
            - Billing cycle: Monthly or Annual (20% discount for annual)
            - Payment methods: Credit card, PayPal, bank transfer (Enterprise only)
            - Invoices are sent on the 1st of each month
            - Refund policy: Full refund within 30 days, prorated after
            - To change your plan: Go to Settings > Subscription > Change Plan
            - To update payment method: Go to Settings > Billing > Payment Methods
            """,

        ["account"] = """
            **Account Management:**
            - To update profile: Go to Settings > Profile
            - To change email: Settings > Account > Email (requires verification)
            - To enable 2FA: Settings > Security > Two-Factor Authentication
            - To delete account: Settings > Account > Delete Account (30-day grace period)
            - Account data export: Settings > Privacy > Export Data (GDPR compliant)
            """,

        ["technical"] = """
            **Common Technical Issues:**
            - Clear browser cache and cookies if experiencing display issues
            - Supported browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
            - API rate limits: 100 requests/minute (Starter), 500/min (Pro), Unlimited (Enterprise)
            - File upload limit: 10MB (Starter), 50MB (Pro), 200MB (Enterprise)
            - If the app is slow, check https://status.example.com for service status
            - For API integration help, see docs at https://docs.example.com/api
            """,

        ["shipping"] = """
            **Shipping & Delivery:**
            - Standard shipping: 5-7 business days
            - Express shipping: 2-3 business days
            - Overnight shipping: Next business day
            - Free shipping on orders over $50
            - Tracking information sent via email once order ships
            - International shipping available to select countries
            """,

        ["returns"] = """
            **Returns & Exchanges:**
            - 30-day return policy for unused items
            - Items must be in original packaging
            - Refund processed within 5-7 business days
            - Exchange available for different size/color
            - Defective items: Contact support for prepaid return label
            - Digital products: Non-refundable after download/activation
            """
    };

    [KernelFunction("search_knowledge_base")]
    [Description("Searches the support knowledge base for information on a topic. Use this to find answers to common customer questions.")]
    public string SearchKnowledgeBase(
        [Description("The topic to search for (e.g., 'password reset', 'billing', 'shipping')")] string topic)
    {
        // Direct match
        if (KnowledgeBase.TryGetValue(topic, out var directResult))
        {
            return directResult;
        }

        // Partial match
        var matches = KnowledgeBase
            .Where(kv => kv.Key.Contains(topic, StringComparison.OrdinalIgnoreCase) ||
                         topic.Contains(kv.Key, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (matches.Count > 0)
        {
            return string.Join("\n\n---\n\n", matches.Select(m => m.Value));
        }

        // Keyword search in values
        var keywordMatches = KnowledgeBase
            .Where(kv => kv.Value.Contains(topic, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (keywordMatches.Count > 0)
        {
            return string.Join("\n\n---\n\n", keywordMatches.Select(m => m.Value));
        }

        return $"No knowledge base articles found for '{topic}'. Available topics: {string.Join(", ", KnowledgeBase.Keys)}";
    }

    [KernelFunction("list_knowledge_topics")]
    [Description("Lists all available topics in the support knowledge base.")]
    public string ListKnowledgeTopics()
    {
        return $"Available knowledge base topics: {string.Join(", ", KnowledgeBase.Keys)}";
    }
}
