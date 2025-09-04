// backend/Models/DbTable.cs
using System.Collections.Generic;

namespace db_biometrics_mvp.Backend.Models
{
    public class DbTable
    {
        public string Name { get; set; } = string.Empty;
        public List<string> Columns { get; set; } = new List<string>();
    }

    public class TableEntry
    {
        public int Id { get; set; } // Assuming an 'Id' column
        public Dictionary<string, object> Data { get; set; } = new Dictionary<string, object>();
    }

    // DTOs for Db Entry Management
    public class AddEntryDto
    {
        public string TableName { get; set; } = string.Empty;
        public Dictionary<string, object> Entry { get; set; } = new Dictionary<string, object>();
    }

    public class UpdateEntryDto
    {
        public string TableName { get; set; } = string.Empty;
        public int EntryId { get; set; }
        public Dictionary<string, object> UpdatedEntry { get; set; } = new Dictionary<string, object>();
    }

    public class DeleteEntryDto
    {
        public string TableName { get; set; } = string.Empty;
        public int EntryId { get; set; }
    }
}