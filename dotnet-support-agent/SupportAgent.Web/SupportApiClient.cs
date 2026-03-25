using System.Net.Http.Json;

namespace SupportAgent.Web;

public class SupportApiClient(HttpClient httpClient)
{
    public async Task<ChatResponseDto?> SendMessageAsync(string sessionId, string message)
    {
        var request = new ChatRequestDto(sessionId, message);
        var response = await httpClient.PostAsJsonAsync("/api/chat", request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<ChatResponseDto>();
    }

    public async Task<List<ChatHistoryEntryDto>> GetHistoryAsync(string sessionId)
    {
        return await httpClient.GetFromJsonAsync<List<ChatHistoryEntryDto>>($"/api/chat/{sessionId}/history") ?? [];
    }

    public async Task<List<SupportTicketDto>> GetTicketsAsync()
    {
        return await httpClient.GetFromJsonAsync<List<SupportTicketDto>>("/api/tickets") ?? [];
    }
}

public record ChatRequestDto(string SessionId, string Message);
public record ChatResponseDto(string Message);
public record ChatHistoryEntryDto(string Role, string Message, DateTime Timestamp);
public record SupportTicketDto(
    string Id,
    string Title,
    string Description,
    string CustomerEmail,
    string Priority,
    string Status,
    string Category,
    DateTime CreatedAt,
    DateTime? ResolvedAt,
    List<string> Notes);
