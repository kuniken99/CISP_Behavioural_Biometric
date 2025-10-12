// backend/Controllers/DbManagementController.cs
using System;
using System.Collections.Generic;
using System.IO;
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
        private readonly AppDbContext _context;
        
        // In-memory simulation of database tables and entries for MVP (except Users which comes from real DB)
        private static Dictionary<string, DbTable> _simulatedTables = new Dictionary<string, DbTable>
        {
            { "Users", new DbTable { Name = "Users", Columns = { "id", "username", "email", "isactive", "isemailverified" } } },
            { "Products", new DbTable { Name = "Products", Columns = { "id", "name", "price", "stock" } } },
            { "Orders", new DbTable { Name = "Orders", Columns = { "id", "product_id", "user_id", "quantity", "order_date" } } }
        };
        
        private static Dictionary<string, List<TableEntry>> _simulatedEntries = null!;
        private static int _nextEntryId = 2000; // For new entries
        private static readonly string _dataFilePath = "simulated_data.json";

        static DbManagementController()
        {
            LoadSimulatedData();
        }

        private static void LoadSimulatedData()
        {
            try
            {
                if (System.IO.File.Exists(_dataFilePath))
                {
                    var json = System.IO.File.ReadAllText(_dataFilePath);
                    var data = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(json);
                    
                    _simulatedEntries = new Dictionary<string, List<TableEntry>>();
                    _nextEntryId = data != null ? ((System.Text.Json.JsonElement)data["nextEntryId"]).GetInt32() : 2000;
                    
                    if (data != null)
                    {
                        var entriesJson = ((System.Text.Json.JsonElement)data["entries"]).GetRawText();
                        var entries = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, List<TableEntry>>>(entriesJson);
                        _simulatedEntries = entries ?? GetDefaultSimulatedData();
                    }
                    else
                    {
                        _simulatedEntries = GetDefaultSimulatedData();
                    }
                }
                else
                {
                    _simulatedEntries = GetDefaultSimulatedData();
                    SaveSimulatedData();
                }
            }
            catch
            {
                _simulatedEntries = GetDefaultSimulatedData();
                SaveSimulatedData();
            }
        }

        private static Dictionary<string, List<TableEntry>> GetDefaultSimulatedData()
        {
            return new Dictionary<string, List<TableEntry>>
            {
                { "Products", new List<TableEntry>
                    {
                        new TableEntry { Id = 101, Data = new Dictionary<string, object> { { "name", "Laptop" }, { "price", 1200.00 }, { "stock", 50 } } },
                        new TableEntry { Id = 102, Data = new Dictionary<string, object> { { "name", "Mouse" }, { "price", 25.00 }, { "stock", 200 } } },
                        new TableEntry { Id = 103, Data = new Dictionary<string, object> { { "name", "Keyboard" }, { "price", 75.00 }, { "stock", 150 } } }
                    }
                },
                { "Orders", new List<TableEntry>
                    {
                        new TableEntry { Id = 1001, Data = new Dictionary<string, object> { { "product_id", 101 }, { "user_id", 1 }, { "quantity", 1 }, { "order_date", "2023-01-15" } } },
                        new TableEntry { Id = 1002, Data = new Dictionary<string, object> { { "product_id", 102 }, { "user_id", 2 }, { "quantity", 2 }, { "order_date", "2023-01-16" } } }
                    }
                }
            };
        }

        private static void SaveSimulatedData()
        {
            try
            {
                var data = new Dictionary<string, object>
                {
                    { "nextEntryId", _nextEntryId },
                    { "entries", _simulatedEntries }
                };
                var json = System.Text.Json.JsonSerializer.Serialize(data, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                System.IO.File.WriteAllText(_dataFilePath, json);
            }
            catch (Exception ex)
            {
                // Log error but don't fail the operation
                Console.WriteLine($"Failed to save simulated data: {ex.Message}");
            }
        }

        public DbManagementController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("tables")]
        public async Task<IActionResult> GetTables()
        {
            // Return simulated tables for demo purposes
            var tables = _simulatedTables.Values.Select(t => new { name = t.Name, columns = t.Columns }).ToList();

            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "VIEW_DB_TABLES", Details = "Viewed database tables", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            return Ok(tables);
        }

        [HttpGet("entries")]
        public async Task<IActionResult> GetEntries([FromQuery] string tableName)
        {
            if (string.IsNullOrEmpty(tableName))
            {
                return BadRequest("Table name is required.");
            }

            try
            {
                var entries = new List<object>();

                // Handle Users from real database, others from simulation
                switch (tableName.ToLower())
                {
                    case "users":
                        // Fetch real users from database
                        entries = _context.Users.Select(u => new {
                            id = u.Id,
                            username = u.Username,
                            email = u.Email,
                            isactive = u.IsActive,
                            isemailverified = u.IsEmailVerified
                        }).ToList<object>();
                        break;

                    case "products":
                        // Format Products data to match table structure
                        entries = _simulatedEntries["Products"].Select(entry => new {
                            id = entry.Id,
                            name = entry.Data["name"],
                            price = entry.Data["price"],
                            stock = entry.Data["stock"]
                        }).ToList<object>();
                        break;

                    case "orders":
                        // Format Orders data to match table structure
                        entries = _simulatedEntries["Orders"].Select(entry => new {
                            id = entry.Id,
                            product_id = entry.Data["product_id"],
                            user_id = entry.Data["user_id"],
                            quantity = entry.Data["quantity"],
                            order_date = entry.Data["order_date"]
                        }).ToList<object>();
                        break;

                    default:
                        return BadRequest($"Table '{tableName}' is not supported for viewing.");
                }

                // Log activity
                await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "VIEW_TABLE_ENTRIES", Details = $"Viewed entries for table: {tableName}", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
                await _context.SaveChangesAsync();

                return Ok(entries);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error fetching entries for table '{tableName}': {ex.Message}" });
            }
        }

        [HttpPost("add-entry")]
        public async Task<IActionResult> AddEntry([FromBody] AddEntryDto dto)
        {
            if (string.IsNullOrEmpty(dto.TableName))
            {
                return BadRequest("Table name is required.");
            }

            // Users table is read-only for security
            if (dto.TableName.ToLower() == "users")
            {
                return BadRequest("Adding users is not allowed for security reasons.");
            }

            // Handle Products and Orders with proper field validation
            switch (dto.TableName.ToLower())
            {
                case "products":
                    // Validate required fields for Products table
                    if (!dto.Entry.ContainsKey("name") || !dto.Entry.ContainsKey("price") || !dto.Entry.ContainsKey("stock"))
                    {
                        return BadRequest("Products table requires 'name', 'price', and 'stock' fields.");
                    }

                    var productEntry = new TableEntry 
                    { 
                        Id = _nextEntryId++, 
                        Data = new Dictionary<string, object>
                        {
                            { "name", dto.Entry["name"]?.ToString() ?? "Unnamed Product" },
                            { "price", double.Parse(dto.Entry["price"]?.ToString() ?? "0") },
                            { "stock", int.Parse(dto.Entry["stock"]?.ToString() ?? "0") }
                        }
                    };
                    _simulatedEntries["Products"].Add(productEntry);
                    SaveSimulatedData();

                    // Log activity
                    await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "ADD_DB_ENTRY", Details = $"Added new product: {productEntry.Data["name"]}, ID: {productEntry.Id}", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
                    await _context.SaveChangesAsync();

                    return Ok(new { message = $"Product '{productEntry.Data["name"]}' added successfully with ID: {productEntry.Id}" });

                case "orders":
                    // Validate required fields for Orders table
                    if (!dto.Entry.ContainsKey("product_id") || !dto.Entry.ContainsKey("user_id") || !dto.Entry.ContainsKey("quantity"))
                    {
                        return BadRequest("Orders table requires 'product_id', 'user_id', and 'quantity' fields.");
                    }

                    var orderEntry = new TableEntry 
                    { 
                        Id = _nextEntryId++, 
                        Data = new Dictionary<string, object>
                        {
                            { "product_id", int.Parse(dto.Entry["product_id"]?.ToString() ?? "0") },
                            { "user_id", int.Parse(dto.Entry["user_id"]?.ToString() ?? "0") },
                            { "quantity", int.Parse(dto.Entry["quantity"]?.ToString() ?? "0") },
                            { "order_date", dto.Entry.ContainsKey("order_date") ? dto.Entry["order_date"]?.ToString() ?? DateTime.Now.ToString("yyyy-MM-dd") : DateTime.Now.ToString("yyyy-MM-dd") }
                        }
                    };
                    _simulatedEntries["Orders"].Add(orderEntry);
                    SaveSimulatedData();

                    // Log activity
                    await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "ADD_DB_ENTRY", Details = $"Added new order for User {orderEntry.Data["user_id"]}, Product {orderEntry.Data["product_id"]}, ID: {orderEntry.Id}", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
                    await _context.SaveChangesAsync();

                    return Ok(new { message = $"Order added successfully with ID: {orderEntry.Id}" });

                default:
                    return BadRequest($"Table '{dto.TableName}' is not supported for adding entries.");
            }
        }

        [HttpPut("update-entry")]
        public async Task<IActionResult> UpdateEntry([FromBody] UpdateEntryDto dto)
        {
            if (string.IsNullOrEmpty(dto.TableName))
            {
                return BadRequest("Table name is required.");
            }

            // Handle Users from real database with limited field updates
            if (dto.TableName.ToLower() == "users")
            {
                try
                {
                    var user = await _context.Users.FindAsync(dto.EntryId);
                    if (user == null)
                    {
                        return NotFound($"User with ID {dto.EntryId} not found.");
                    }

                    // Only allow updating safe fields (not passwords or sensitive data)
                    if (dto.UpdatedEntry.ContainsKey("isactive"))
                        user.IsActive = bool.Parse(dto.UpdatedEntry["isactive"]?.ToString() ?? "false");
                    if (dto.UpdatedEntry.ContainsKey("isemailverified"))
                        user.IsEmailVerified = bool.Parse(dto.UpdatedEntry["isemailverified"]?.ToString() ?? "false");

                    await _context.SaveChangesAsync();

                    // Log activity
                    await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "UPDATE_DB_ENTRY", Details = $"Updated user ID: {dto.EntryId} (safe fields only)", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
                    await _context.SaveChangesAsync();

                    return Ok(new { message = $"User entry {dto.EntryId} updated successfully." });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = $"Error updating user: {ex.Message}" });
                }
            }

            // Handle simulated tables (Products, Orders)
            string actualTableName = dto.TableName.ToLower() switch
            {
                "products" => "Products",
                "orders" => "Orders",
                _ => null!
            };

            if (actualTableName == null)
            {
                return BadRequest("Invalid table name.");
            }

            var entryToUpdate = _simulatedEntries[actualTableName].SingleOrDefault(e => e.Id == dto.EntryId);
            if (entryToUpdate == null)
            {
                return NotFound($"Entry with ID {dto.EntryId} not found in {actualTableName}.");
            }

            foreach (var kvp in dto.UpdatedEntry)
            {
                entryToUpdate.Data[kvp.Key] = kvp.Value; // Update existing or add new fields
            }

            SaveSimulatedData();

            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "UPDATE_DB_ENTRY", Details = $"Updated entry ID: {dto.EntryId} in table: {actualTableName}", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Entry {dto.EntryId} updated in {actualTableName}." });
        }

        [HttpDelete("delete-entry")]
        public async Task<IActionResult> DeleteEntry([FromBody] DeleteEntryDto dto)
        {
            // Users cannot be deleted - only deactivated through User Management
            if (dto.TableName.ToLower() == "users")
            {
                return BadRequest(new { 
                    message = "Users cannot be deleted for security and audit reasons. Use User Management to activate/deactivate users instead.",
                    suggestion = "Go to User Management → Toggle User Status"
                });
            }

            // Handle simulated tables (Products, Orders)
            string actualTableName = dto.TableName.ToLower() switch
            {
                "products" => "Products",
                "orders" => "Orders",
                _ => null!
            };

            if (actualTableName == null)
            {
                return BadRequest("Invalid table name.");
            }

            var entryToRemove = _simulatedEntries[actualTableName].SingleOrDefault(e => e.Id == dto.EntryId);
            if (entryToRemove == null)
            {
                return NotFound($"Entry with ID {dto.EntryId} not found in {actualTableName}.");
            }

            _simulatedEntries[actualTableName].Remove(entryToRemove);
            SaveSimulatedData();

            // Log activity
            await _context.AuditLogs.AddAsync(new AuditLog { Username = User.Identity?.Name ?? "Unknown", Action = "DELETE_DB_ENTRY", Details = $"Deleted entry ID: {dto.EntryId} from table: {actualTableName}", IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A" });
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Entry {dto.EntryId} deleted from {actualTableName}." });
        }
    }
}