using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Agents;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using SupportAgent.ApiService.Agents;
using SupportAgent.ApiService.Models;
using SupportAgent.ApiService.Plugins;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register the in-memory ticket store
builder.Services.AddSingleton<TicketStore>();

// Register Semantic Kernel
builder.Services.AddSingleton<Kernel>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var kernelBuilder = Kernel.CreateBuilder();

    // Support both Azure OpenAI and OpenAI configurations
    var azureEndpoint = configuration["AzureOpenAI:Endpoint"];
    var azureDeployment = configuration["AzureOpenAI:DeploymentName"];
    var azureApiKey = configuration["AzureOpenAI:ApiKey"];

    var openAiApiKey = configuration["OpenAI:ApiKey"];
    var openAiModel = configuration["OpenAI:ModelId"] ?? "gpt-4o-mini";

    if (!string.IsNullOrWhiteSpace(azureEndpoint) && !string.IsNullOrWhiteSpace(azureApiKey))
    {
        kernelBuilder.AddAzureOpenAIChatCompletion(
            deploymentName: azureDeployment ?? "gpt-4o",
            endpoint: azureEndpoint,
            apiKey: azureApiKey);
    }
    else if (!string.IsNullOrWhiteSpace(openAiApiKey))
    {
        kernelBuilder.AddOpenAIChatCompletion(
            modelId: openAiModel,
            apiKey: openAiApiKey);
    }
    else
    {
        // Fallback: register a no-op kernel for demo/testing without LLM
        // The agent will use rule-based responses
    }

    kernelBuilder.Services.AddLogging(logging => logging.AddConsole());

    var kernel = kernelBuilder.Build();

    // Import plugins
    var ticketStore = sp.GetRequiredService<TicketStore>();
    kernel.ImportPluginFromObject(new TicketPlugin(ticketStore), "TicketPlugin");
    kernel.ImportPluginFromObject(new KnowledgeBasePlugin(), "KnowledgeBasePlugin");

    return kernel;
});

// Register the SupportAgentService
builder.Services.AddSingleton<SupportAgentService>();

var app = builder.Build();

app.UseCors();
app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// ---- API Endpoints ----

// Chat endpoint - sends a message to the support agent
app.MapPost("/api/chat", async (ChatRequest request, SupportAgentService agentService) =>
{
    var response = await agentService.ChatAsync(request.SessionId, request.Message);
    return Results.Ok(new ChatResponse(response));
})
.WithName("Chat")
.WithDescription("Send a message to the support agent");

// Get chat history for a session
app.MapGet("/api/chat/{sessionId}/history", (string sessionId, SupportAgentService agentService) =>
{
    var history = agentService.GetHistory(sessionId);
    return Results.Ok(history);
})
.WithName("GetChatHistory")
.WithDescription("Get chat history for a session");

// Get all tickets
app.MapGet("/api/tickets", (TicketStore store) =>
{
    return Results.Ok(store.GetAllTickets());
})
.WithName("GetTickets")
.WithDescription("Get all support tickets");

// Get ticket by ID
app.MapGet("/api/tickets/{id}", (string id, TicketStore store) =>
{
    var ticket = store.GetTicket(id);
    return ticket is not null ? Results.Ok(ticket) : Results.NotFound();
})
.WithName("GetTicketById")
.WithDescription("Get a support ticket by ID");

// Health check
app.MapGet("/api/health", () => Results.Ok(new { Status = "Healthy", Timestamp = DateTime.UtcNow }))
.WithName("HealthCheck");

app.Run();
