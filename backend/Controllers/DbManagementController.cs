// backend/Controllers/DbManagementController.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using db_biometrics_mvp.Backend.Models;
using db_biometrics_mvp.Backend.Data;

namespace db_biometrics_mvp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "RequireDbaOrAdminRole")]
    public class DbManagementController : ControllerBase
    {
        private readonly AppDbContext _context; // For auditing
        // In-memory simulation of database tables and entries for MVP
        private static Dictionary<string, DbTable> _simulatedTables = new Dictionary<string, DbTable>
        {
            { "Users", new DbTable { Name = "Users", Columns = { "id", "username", "email", "status" } } },
            { "Products", new DbTable { Name = "Products", Columns = { "id", "name", "price", "stock" } } },
            { "Orders", new DbTable { Name = "Orders", Columns = { "id", "product_id", "user_id", "quantity", "order_date" } } }
        };
        private static Dictionary<string, List<TableEntry>> _simulatedEntries = new Dictionary<string, List<TableEntry>>
        {
            { "Users", new List<TableEntry>
                {
                    new TableEntry { Id = 1, Data = new Dictionary<string, object> { { "username", "alice" }, { "email", "alice@example.com" }, { "status", "active" } } },
                    new TableEntry { Id = 2, Data = new Dictionary<string, object> { { "username", "bob" }, { "email", "bob@example.com" }, { "status", "inactive" } } }
                }
            },
            { "Products", new List<TableEntry>
                {
                    new TableEntry { Id = 101, Data = new Dictionary<string, object> { { "name", "Laptop" }, { "price", 1200.00 }, { "stock", 50 } } },
                    new TableEntry { Id = 102, Data = new Dictionary<string, object> { { "name", "Mouse" }, { "price", 25.00 }, { "stock", 200 } } }
                }
            },
            { "Orders", new List<TableEntry>
                {
                    new TableEntry { Id = 1001, Data = new Dictionary<string, object> { { "product_id", 101 }, { "user_id", 1 }, { "quantity", 1 }, { "order_date", "2023-01-15" } } }
                }
            }
        };
        private static int _nextEntryId = 2000; // For new entries

        public DbManagementController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("tables")]
        public async Task<IActionResult> GetTables()
        {
            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "VIEW_DB_TABLES", Details = "Viewed available database tables.", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            return Ok(_simulatedTables.Values);
        }

        [HttpGet("entries")]
        public async Task<IActionResult> GetEntries([FromQuery] string tableName)
        {
            if (string.IsNullOrEmpty(tableName) || !_simulatedEntries.ContainsKey(tableName))
            {
                return BadRequest("Invalid table name.");
            }

            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "VIEW_TABLE_ENTRIES", Details = $"Viewed entries for table: {tableName}", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            // Return deep copy to prevent direct modification
            return Ok(_simulatedEntries[tableName].Select(e => new TableEntry { Id = e.Id, Data = new Dictionary<string, object>(e.Data) }));
        }

        [HttpPost("add-entry")]
        public async Task<IActionResult> AddEntry([FromBody] AddEntryDto dto)
        {
            if (string.IsNullOrEmpty(dto.TableName) || !_simulatedEntries.ContainsKey(dto.TableName))
            {
                return BadRequest("Invalid table name.");
            }

            var newEntry = new TableEntry { Id = _nextEntryId++, Data = dto.Entry };
            _simulatedEntries[dto.TableName].Add(newEntry);

            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "ADD_DB_ENTRY", Details = $"Added new entry to table: {dto.TableName}, ID: {newEntry.Id}", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Entry {newEntry.Id} added to {dto.TableName}." });
        }

        [HttpPut("update-entry")]
        public async Task<IActionResult> UpdateEntry([FromBody] UpdateEntryDto dto)
        {
            if (string.IsNullOrEmpty(dto.TableName) || !_simulatedEntries.ContainsKey(dto.TableName))
            {
                return BadRequest("Invalid table name.");
            }

            var entryToUpdate = _simulatedEntries[dto.TableName].SingleOrDefault(e => e.Id == dto.EntryId);
            if (entryToUpdate == null)
            {
                return NotFound($"Entry with ID {dto.EntryId} not found in {dto.TableName}.");
            }

            foreach (var kvp in dto.UpdatedEntry)
            {
                entryToUpdate.Data[kvp.Key] = kvp.Value; // Update existing or add new fields
            }

            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "UPDATE_DB_ENTRY", Details = $"Updated entry ID: {dto.EntryId} in table: {dto.TableName}", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Entry {dto.EntryId} updated in {dto.TableName}." });
        }

        [HttpDelete("delete-entry")]
        public async Task<IActionResult> DeleteEntry([FromBody] DeleteEntryDto dto)
        {
            if (string.IsNullOrEmpty(dto.TableName) || !_simulatedEntries.ContainsKey(dto.TableName))
            {
                return BadRequest("Invalid table name.");
            }

            var entryToRemove = _simulatedEntries[dto.TableName].SingleOrDefault(e => e.Id == dto.EntryId);
            if (entryToRemove == null)
            {
                return NotFound($"Entry with ID {dto.EntryId} not found in {dto.TableName}.");
            }

            _simulatedEntries[dto.TableName].Remove(entryToRemove);

            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "DELETE_DB_ENTRY", Details = $"Deleted entry ID: {dto.EntryId} from table: {dto.TableName}", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Entry {dto.EntryId} deleted from {dto.TableName}." });
        }
    }
}