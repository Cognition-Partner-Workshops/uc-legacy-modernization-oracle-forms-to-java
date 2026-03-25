using System.Collections.Concurrent;

namespace SupportAgent.ApiService.Models;

public class TicketStore
{
    private readonly ConcurrentDictionary<string, SupportTicket> _tickets = new();
    private int _nextId = 1000;

    public TicketStore()
    {
        // Seed with sample tickets
        SeedData();
    }

    public SupportTicket CreateTicket(string title, string description, string customerEmail, string category, TicketPriority priority)
    {
        var id = $"TKT-{Interlocked.Increment(ref _nextId)}";
        var ticket = new SupportTicket
        {
            Id = id,
            Title = title,
            Description = description,
            CustomerEmail = customerEmail,
            Priority = priority,
            Category = category,
            Status = TicketStatus.Open,
            CreatedAt = DateTime.UtcNow
        };

        _tickets[id] = ticket;
        return ticket;
    }

    public SupportTicket? GetTicket(string id)
    {
        _tickets.TryGetValue(id, out var ticket);
        return ticket;
    }

    public IReadOnlyList<SupportTicket> GetAllTickets()
    {
        return _tickets.Values.OrderByDescending(t => t.CreatedAt).ToList();
    }

    public IReadOnlyList<SupportTicket> GetTicketsByStatus(TicketStatus status)
    {
        return _tickets.Values.Where(t => t.Status == status).OrderByDescending(t => t.CreatedAt).ToList();
    }

    public IReadOnlyList<SupportTicket> GetTicketsByEmail(string email)
    {
        return _tickets.Values.Where(t => t.CustomerEmail.Equals(email, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(t => t.CreatedAt).ToList();
    }

    public bool UpdateTicketStatus(string id, TicketStatus status)
    {
        if (_tickets.TryGetValue(id, out var ticket))
        {
            ticket.Status = status;
            if (status == TicketStatus.Resolved)
            {
                ticket.ResolvedAt = DateTime.UtcNow;
            }
            return true;
        }
        return false;
    }

    public bool AddNoteToTicket(string id, string note)
    {
        if (_tickets.TryGetValue(id, out var ticket))
        {
            ticket.Notes.Add($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] {note}");
            return true;
        }
        return false;
    }

    private void SeedData()
    {
        var ticket1 = new SupportTicket
        {
            Id = "TKT-1001",
            Title = "Cannot login to my account",
            Description = "I keep getting 'Invalid credentials' error when trying to login with my email.",
            CustomerEmail = "john.doe@example.com",
            Priority = TicketPriority.High,
            Status = TicketStatus.Open,
            Category = "Authentication",
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };

        var ticket2 = new SupportTicket
        {
            Id = "TKT-1002",
            Title = "Billing discrepancy on last invoice",
            Description = "My invoice shows a charge of $99.99 but my plan is $49.99/month.",
            CustomerEmail = "jane.smith@example.com",
            Priority = TicketPriority.Medium,
            Status = TicketStatus.InProgress,
            Category = "Billing",
            CreatedAt = DateTime.UtcNow.AddHours(-5),
            Notes = ["[2026-03-25 10:00] Assigned to billing team for review."]
        };

        var ticket3 = new SupportTicket
        {
            Id = "TKT-1003",
            Title = "Feature request: Dark mode",
            Description = "It would be great to have a dark mode option in the dashboard.",
            CustomerEmail = "alex.johnson@example.com",
            Priority = TicketPriority.Low,
            Status = TicketStatus.Open,
            Category = "Feature Request",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };

        _tickets["TKT-1001"] = ticket1;
        _tickets["TKT-1002"] = ticket2;
        _tickets["TKT-1003"] = ticket3;
    }
}
