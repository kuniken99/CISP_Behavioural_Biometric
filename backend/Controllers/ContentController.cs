// backend/Controllers/ContentController.cs
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using db_biometrics_mvp.Backend.Data;
using db_biometrics_mvp.Backend.Models;

namespace db_biometrics_mvp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "RequireAdminRole")] // Only Admins can update website content
    public class ContentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ContentController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("get-website-content")]
        public async Task<IActionResult> GetWebsiteContent()
        {
            var content = await _context.WebsiteContents.FirstOrDefaultAsync() ?? new WebsiteContent();
            return Ok(content);
        }

        [HttpPut("update-website-content")]
        public async Task<IActionResult> UpdateWebsiteContent([FromBody] WebsiteContent updatedContent)
        {
            var content = await _context.WebsiteContents.FirstOrDefaultAsync();
            if (content == null)
            {
                _context.WebsiteContents.Add(updatedContent);
            }
            else
            {
                content.Content = updatedContent.Content;
                _context.WebsiteContents.Update(content);
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Website content updated successfully." });
        }
    }
}