# Support Agent - .NET 10 Aspire with Microsoft Agent Framework

An AI-powered customer support agent built with **.NET 10 Aspire** and the **Microsoft Semantic Kernel Agent Framework**. This application demonstrates how to build a distributed, cloud-ready support system with intelligent conversational capabilities.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Aspire AppHost                   │
│         (Orchestration & Dashboard)              │
├─────────────────────┬───────────────────────────┤
│                     │                           │
│  ┌─────────────┐    │    ┌───────────────────┐  │
│  │  Blazor Web  │◄───┼───►│  API Service      │  │
│  │  Frontend    │    │    │  (Support Agent)  │  │
│  │  - Chat UI   │    │    │  - SK Agent       │  │
│  │  - Tickets   │    │    │  - Plugins        │  │
│  └─────────────┘    │    │  - Knowledge Base  │  │
│                     │    └───────────────────┘  │
│  ┌─────────────────────────────────────────┐    │
│  │         Service Defaults                 │    │
│  │  (OpenTelemetry, Health, Resilience)     │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

## Projects

| Project | Description |
|---------|-------------|
| **SupportAgent.AppHost** | .NET Aspire orchestrator — wires up all services, provides the dashboard |
| **SupportAgent.ServiceDefaults** | Shared service configuration (OpenTelemetry, health checks, resilience) |
| **SupportAgent.ApiService** | Web API with the AI support agent, ticket management, and knowledge base |
| **SupportAgent.Web** | Blazor Server frontend with chat UI and ticket management |

## Features

- **AI-Powered Chat** — Uses Microsoft Semantic Kernel Agent Framework with support for Azure OpenAI and OpenAI
- **Knowledge Base Plugin** — Built-in knowledge base for common support topics (billing, accounts, technical issues, shipping, returns)
- **Ticket Management Plugin** — Create, track, update, and search support tickets via natural language
- **Rule-Based Fallback** — Works without an LLM configured using intelligent rule-based responses
- **Aspire Dashboard** — Full observability with OpenTelemetry tracing, metrics, and structured logging
- **Service Discovery** — Automatic service-to-service communication via Aspire service discovery
- **Health Checks** — Built-in health and liveness endpoints for all services

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- (Optional) An OpenAI API key or Azure OpenAI deployment for AI-powered responses

## Getting Started

### 1. Clone and Build

```bash
dotnet build
```

### 2. Configure AI (Optional)

To enable AI-powered responses, configure either OpenAI or Azure OpenAI in `SupportAgent.ApiService/appsettings.json`:

**OpenAI:**
```json
{
  "OpenAI": {
    "ApiKey": "sk-your-api-key",
    "ModelId": "gpt-4o-mini"
  }
}
```

**Azure OpenAI:**
```json
{
  "AzureOpenAI": {
    "Endpoint": "https://your-resource.openai.azure.com/",
    "DeploymentName": "gpt-4o",
    "ApiKey": "your-api-key"
  }
}
```

> Without an API key configured, the agent uses rule-based responses that still demonstrate the full functionality.

### 3. Run with Aspire

```bash
dotnet run --project SupportAgent.AppHost
```

This starts:
- **Aspire Dashboard** — `https://localhost:17043` (orchestration & observability)
- **API Service** — Available via service discovery
- **Web Frontend** — Available via the Aspire dashboard

### 4. Use the Application

1. Open the Aspire Dashboard and click the web frontend endpoint
2. Navigate to **Chat** to interact with the support agent
3. Navigate to **Tickets** to view and track support tickets

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Send a message to the support agent |
| GET | `/api/chat/{sessionId}/history` | Get chat history for a session |
| GET | `/api/tickets` | List all support tickets |
| GET | `/api/tickets/{id}` | Get a ticket by ID |
| GET | `/api/health` | Health check endpoint |

## Agent Plugins

### TicketPlugin
- `create_ticket` — Create a new support ticket
- `get_ticket` — Retrieve a ticket by ID
- `list_tickets` — List tickets with optional status filter
- `update_ticket_status` — Update ticket status
- `add_note_to_ticket` — Add a note to a ticket
- `search_tickets_by_customer` — Search tickets by email

### KnowledgeBasePlugin
- `search_knowledge_base` — Search for information by topic
- `list_knowledge_topics` — List available knowledge base topics

## Technology Stack

- **.NET 10** — Latest .NET runtime
- **Aspire 13.2** — Cloud-ready distributed application framework
- **Microsoft Semantic Kernel 1.74** — AI orchestration and agent framework
- **Blazor Server** — Interactive server-side web UI
- **OpenTelemetry** — Distributed tracing and metrics
