using System.ComponentModel;
using Microsoft.SemanticKernel;
using SupportAgent.ApiService.Models;

namespace SupportAgent.ApiService.Plugins;

public class TicketPlugin(TicketStore ticketStore)
{
    [KernelFunction("create_ticket")]
    [Description("Creates a new support ticket for a customer issue.")]
    public string CreateTicket(
        [Description("Short title summarizing the issue")] string title,
        [Description("Detailed description of the issue")] string description,
        [Description("Customer's email address")] string customerEmail,
        [Description("Category: Authentication, Billing, Technical, Feature Request, General")] string category,
        [Description("Priority level: Low, Medium, High, Critical")] string priority)
    {
        if (!Enum.TryParse<TicketPriority>(priority, ignoreCase: true, out var ticketPriority))
        {
            ticketPriority = TicketPriority.Medium;
        }

        var ticket = ticketStore.CreateTicket(title, description, customerEmail, category, ticketPriority);
        return $"Ticket {ticket.Id} created successfully. Title: '{ticket.Title}', Priority: {ticket.Priority}, Status: {ticket.Status}";
    }

    [KernelFunction("get_ticket")]
    [Description("Retrieves a support ticket by its ID.")]
    public string GetTicket(
        [Description("The ticket ID (e.g., TKT-1001)")] string ticketId)
    {
        var ticket = ticketStore.GetTicket(ticketId);
        if (ticket is null)
        {
            return $"No ticket found with ID '{ticketId}'.";
        }

        return $"Ticket {ticket.Id}: Title='{ticket.Title}', Status={ticket.Status}, Priority={ticket.Priority}, " +
               $"Category={ticket.Category}, Customer={ticket.CustomerEmail}, Created={ticket.CreatedAt:g}" +
               (ticket.Notes.Count > 0 ? $", Notes: {string.Join("; ", ticket.Notes)}" : "");
    }

    [KernelFunction("list_tickets")]
    [Description("Lists all support tickets, optionally filtered by status.")]
    public string ListTickets(
        [Description("Optional status filter: Open, InProgress, WaitingOnCustomer, Resolved, Closed. Leave empty for all.")] string? status = null)
    {
        IReadOnlyList<SupportTicket> tickets;

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<TicketStatus>(status, ignoreCase: true, out var ticketStatus))
        {
            tickets = ticketStore.GetTicketsByStatus(ticketStatus);
        }
        else
        {
            tickets = ticketStore.GetAllTickets();
        }

        if (tickets.Count == 0)
        {
            return "No tickets found.";
        }

        var lines = tickets.Select(t => $"- {t.Id}: '{t.Title}' [{t.Status}] [{t.Priority}] ({t.Category})");
        return $"Found {tickets.Count} ticket(s):\n{string.Join("\n", lines)}";
    }

    [KernelFunction("update_ticket_status")]
    [Description("Updates the status of a support ticket.")]
    public string UpdateTicketStatus(
        [Description("The ticket ID (e.g., TKT-1001)")] string ticketId,
        [Description("New status: Open, InProgress, WaitingOnCustomer, Resolved, Closed")] string newStatus)
    {
        if (!Enum.TryParse<TicketStatus>(newStatus, ignoreCase: true, out var status))
        {
            return $"Invalid status '{newStatus}'. Valid values: Open, InProgress, WaitingOnCustomer, Resolved, Closed.";
        }

        var success = ticketStore.UpdateTicketStatus(ticketId, status);
        return success
            ? $"Ticket {ticketId} status updated to {status}."
            : $"Ticket '{ticketId}' not found.";
    }

    [KernelFunction("add_note_to_ticket")]
    [Description("Adds a note to an existing support ticket.")]
    public string AddNoteToTicket(
        [Description("The ticket ID (e.g., TKT-1001)")] string ticketId,
        [Description("The note text to add")] string note)
    {
        var success = ticketStore.AddNoteToTicket(ticketId, note);
        return success
            ? $"Note added to ticket {ticketId}."
            : $"Ticket '{ticketId}' not found.";
    }

    [KernelFunction("search_tickets_by_customer")]
    [Description("Searches for tickets by customer email address.")]
    public string SearchTicketsByCustomer(
        [Description("Customer's email address")] string email)
    {
        var tickets = ticketStore.GetTicketsByEmail(email);
        if (tickets.Count == 0)
        {
            return $"No tickets found for customer '{email}'.";
        }

        var lines = tickets.Select(t => $"- {t.Id}: '{t.Title}' [{t.Status}] [{t.Priority}]");
        return $"Found {tickets.Count} ticket(s) for '{email}':\n{string.Join("\n", lines)}";
    }
}
