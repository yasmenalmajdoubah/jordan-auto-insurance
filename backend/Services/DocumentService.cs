using JordanAutoInsurance.Api.Data;
using JordanAutoInsurance.Api.Domain.Entities;
using JordanAutoInsurance.Api.Domain.Enums;

namespace JordanAutoInsurance.Api.Services;

public class DocumentService(AppDbContext db, IWebHostEnvironment env)
{
    public async Task<DocumentFile> SaveAsync(
        IFormFile file,
        DocumentType type,
        string uploadedBy,
        int? accidentId = null,
        int? claimId = null)
    {
        var root = Path.Combine(env.ContentRootPath, "Storage", "documents");
        Directory.CreateDirectory(root);
        var safeName = $"{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid():N}_{Path.GetFileName(file.FileName)}";
        var fullPath = Path.Combine(root, safeName);

        await using (var stream = File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        var doc = new DocumentFile
        {
            AccidentId = accidentId,
            ClaimId = claimId,
            DocumentType = type,
            FileName = file.FileName,
            StoredPath = fullPath,
            ContentType = file.ContentType,
            FileSize = file.Length,
            UploadedBy = uploadedBy
        };
        db.Documents.Add(doc);
        await db.SaveChangesAsync();
        return doc;
    }
}
