using System.Collections.Concurrent;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Agents;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using SupportAgent.ApiService.Models;
using SupportAgent.ApiService.Plugins;

namespace SupportAgent.ApiService.Agents;

public class SupportAgentService
{
    private readonly Kernel _kernel;
    private readonly ILogger<SupportAgentService> _logger;
    private readonly ConcurrentDictionary<string, List<ChatHistoryEntry>> _sessionHistories = new();
    private readonly bool _hasLlm;

    private const string AgentInstructions = """
        You are a friendly and professional customer support agent. Your name is "Aspire Support Agent".
        
        Your responsibilities:
        1. Help customers with their questions and issues
        2. Search the knowledge base for relevant information before answering
        3. Create, update, and track support tickets
        4. Provide clear, helpful, and empathetic responses
        
        Guidelines:
        - Always greet the customer warmly
        - Search the knowledge base first when a customer asks a question
        - If a customer reports an issue, create a ticket for tracking
        - Provide step-by-step instructions when possible
        - If you cannot resolve an issue, escalate by creating a high-priority ticket
        - Always confirm actions you've taken (e.g., "I've created ticket TKT-1004 for you")
        - Be concise but thorough
        - Use a professional yet friendly tone
        """;

    public SupportAgentService(Kernel kernel, ILogger<SupportAgentService> logger, IConfiguration configuration)
    {
        _kernel = kernel;
        _logger = logger;

        // Check if an LLM is configured
        var hasAzure = !string.IsNullOrWhiteSpace(configuration["AzureOpenAI:Endpoint"]) &&
                       !string.IsNullOrWhiteSpace(configuration["AzureOpenAI:ApiKey"]);
        var hasOpenAi = !string.IsNullOrWhiteSpace(configuration["OpenAI:ApiKey"]);
        _hasLlm = hasAzure || hasOpenAi;
    }

    public async Task<string> ChatAsync(string sessionId, string userMessage)
    {
        _logger.LogInformation("Processing chat for session {SessionId}: {Message}", sessionId, userMessage);

        // Store user message in history
        var history = _sessionHistories.GetOrAdd(sessionId, _ => []);
        history.Add(new ChatHistoryEntry("user", userMessage, DateTime.UtcNow));

        string response;

        if (_hasLlm)
        {
            response = await ChatWithAgentAsync(sessionId, userMessage);
        }
        else
        {
            response = HandleWithRules(userMessage);
        }

        // Store assistant response in history
        history.Add(new ChatHistoryEntry("assistant", response, DateTime.UtcNow));

        return response;
    }

    public List<ChatHistoryEntry> GetHistory(string sessionId)
    {
        return _sessionHistories.GetOrAdd(sessionId, _ => []);
    }

    private async Task<string> ChatWithAgentAsync(string sessionId, string userMessage)
    {
        try
        {
            ChatCompletionAgent agent = new()
            {
                Name = "SupportAgent",
                Instructions = AgentInstructions,
                Kernel = _kernel,
                Arguments = new KernelArguments(
                    new OpenAIPromptExecutionSettings
                    {
                        FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
                    })
            };

            var chatHistory = new ChatHistory();
            chatHistory.AddSystemMessage(AgentInstructions);

            // Add previous messages for context (current user message is already in session history)
            var sessionHistory = GetHistory(sessionId);
            foreach (var entry in sessionHistory.TakeLast(10))
            {
                if (entry.Role == "user")
                    chatHistory.AddUserMessage(entry.Message);
                else if (entry.Role == "assistant")
                    chatHistory.AddAssistantMessage(entry.Message);
            }

            var responses = new List<string>();
            await foreach (var content in agent.InvokeAsync(chatHistory))
            {
                if (!string.IsNullOrWhiteSpace(content.Message.Content))
                {
                    responses.Add(content.Message.Content);
                }
            }

            return responses.Count > 0
                ? string.Join("\n", responses)
                : "I apologize, but I couldn't process your request. Please try again or rephrase your question.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in agent chat for session {SessionId}", sessionId);
            return HandleWithRules(userMessage);
        }
    }

    private string HandleWithRules(string userMessage)
    {
        var lowerMessage = userMessage.ToLowerInvariant();

        // Knowledge base lookup
        var knowledgePlugin = new KnowledgeBasePlugin();

        if (lowerMessage.Contains("password") || lowerMessage.Contains("login") || lowerMessage.Contains("sign in") || lowerMessage.Contains("credentials"))
        {
            var kb = knowledgePlugin.SearchKnowledgeBase("password reset");
            return $"Hello! I'd be happy to help you with your login issue. Here's what I found:\n\n{kb}\n\nWould you like me to create a support ticket for this issue?";
        }

        if (lowerMessage.Contains("bill") || lowerMessage.Contains("invoice") || lowerMessage.Contains("charge") || lowerMessage.Contains("payment") || lowerMessage.Contains("subscription") || lowerMessage.Contains("plan") || lowerMessage.Contains("price"))
        {
            var kb = knowledgePlugin.SearchKnowledgeBase("billing");
            return $"I can help with billing questions! Here's our billing information:\n\n{kb}\n\nWould you like me to look into a specific billing issue for you?";
        }

        if (lowerMessage.Contains("account") || lowerMessage.Contains("profile") || lowerMessage.Contains("2fa") || lowerMessage.Contains("security"))
        {
            var kb = knowledgePlugin.SearchKnowledgeBase("account");
            return $"Here's information about account management:\n\n{kb}\n\nIs there something specific you need help with?";
        }

        if (lowerMessage.Contains("slow") || lowerMessage.Contains("bug") || lowerMessage.Contains("error") || lowerMessage.Contains("broken") || lowerMessage.Contains("not working") || lowerMessage.Contains("technical"))
        {
            var kb = knowledgePlugin.SearchKnowledgeBase("technical");
            return $"I'm sorry you're experiencing technical difficulties. Here are some troubleshooting steps:\n\n{kb}\n\nShall I create a support ticket to track this issue?";
        }

        if (lowerMessage.Contains("ship") || lowerMessage.Contains("delivery") || lowerMessage.Contains("tracking"))
        {
            var kb = knowledgePlugin.SearchKnowledgeBase("shipping");
            return $"Here's our shipping information:\n\n{kb}\n\nDo you need help with a specific order?";
        }

        if (lowerMessage.Contains("return") || lowerMessage.Contains("refund") || lowerMessage.Contains("exchange"))
        {
            var kb = knowledgePlugin.SearchKnowledgeBase("returns");
            return $"Here's our return and exchange policy:\n\n{kb}\n\nWould you like to initiate a return?";
        }

        if (lowerMessage.Contains("ticket") || lowerMessage.Contains("status") || lowerMessage.Contains("track"))
        {
            return "I can help you with ticket tracking! Please provide your ticket ID (e.g., TKT-1001) and I'll look up the status for you. You can also ask me to create a new ticket.";
        }

        if (lowerMessage.Contains("hello") || lowerMessage.Contains("hi") || lowerMessage.Contains("hey") || lowerMessage.Contains("help"))
        {
            return """
                Hello! 👋 Welcome to Aspire Support! I'm your AI support agent, here to help you with:

                • **Account Issues** - Password resets, login problems, account settings
                • **Billing** - Invoices, subscriptions, payment methods
                • **Technical Support** - Bug reports, troubleshooting, API help
                • **Shipping & Returns** - Order tracking, delivery, refunds
                • **Ticket Management** - Create, track, and manage support tickets

                How can I assist you today?
                """;
        }

        return """
            Thank you for reaching out! I'm the Aspire Support Agent. I can help you with:

            • Account and login issues
            • Billing and subscription questions
            • Technical troubleshooting
            • Shipping and returns
            • Creating and tracking support tickets

            Could you please provide more details about what you need help with? I'll do my best to assist you!
            """;
    }
}
