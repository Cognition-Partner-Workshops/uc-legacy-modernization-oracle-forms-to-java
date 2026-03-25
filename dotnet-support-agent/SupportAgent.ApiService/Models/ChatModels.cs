namespace SupportAgent.ApiService.Models;

public record ChatRequest(string SessionId, string Message);

public record ChatResponse(string Message);

public record ChatHistoryEntry(string Role, string Message, DateTime Timestamp);
