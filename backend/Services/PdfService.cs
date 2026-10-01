using JordanAutoInsurance.Api.Data;
using JordanAutoInsurance.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace JordanAutoInsurance.Api.Services;

public class PdfService(AppDbContext db)
{
    static PdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GenerateSettlementPdfAsync(int settlementId)
    {
        var settlement = await db.Settlements
            .Include(s => s.Claim)!.ThenInclude(c => c!.Accident)
            .FirstOrDefaultAsync(s => s.Id == settlementId)
            ?? throw new InvalidOperationException("Settlement not found");

        var accidentNo = settlement.Claim?.Accident?.AccidentNumber ?? "-";
        var claimNo = settlement.Claim?.ClaimNumber ?? "-";

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.Header().Text("مخالصة مطالبة تأمين مركبات").SemiBold().FontSize(18).AlignCenter();
                page.Content().Column(col =>
                {
                    col.Spacing(8);
                    col.Item().Text($"رقم المطالبة: {claimNo}");
                    col.Item().Text($"رقم الحادث: {accidentNo}");
                    col.Item().Text($"مبلغ المطالبة: {settlement.ClaimAmount:N2} دينار");
                    col.Item().Text($"التحمل: {settlement.Deductible:N2} دينار");
                    col.Item().Text($"تعديلات أخرى: {settlement.OtherAdjustments:N2} دينار");
                    col.Item().Text($"المبلغ النهائي: {settlement.FinalAmount:N2} دينار").SemiBold();
                    col.Item().Text($"الحالة: {settlement.Status}");
                    col.Item().PaddingTop(20).Text("توقيع المستفيد: ____________________");
                    col.Item().Text("توقيع الشركة: ____________________");
                });
                page.Footer().AlignCenter().Text(txt =>
                {
                    txt.Span("Jordan Auto Insurance System - ");
                    txt.Span(DateTime.Now.ToString("yyyy-MM-dd"));
                });
            });
        });

        return document.GeneratePdf();
    }

    public async Task<byte[]> GenerateRecoveryPdfAsync(int recoveryId)
    {
        var recovery = await db.RecoveryClaims
            .Include(r => r.Claim)!.ThenInclude(c => c!.Accident)
            .FirstOrDefaultAsync(r => r.Id == recoveryId)
            ?? throw new InvalidOperationException("Recovery claim not found");

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.Header().Text("مطالبة مالية لشركة تأمين أخرى (استرداد)").SemiBold().FontSize(16).AlignCenter();
                page.Content().Column(col =>
                {
                    col.Spacing(8);
                    col.Item().Text($"شركة التأمين الأخرى: {recovery.OtherInsurerName}");
                    col.Item().Text($"رقم وثيقتهم: {recovery.OtherPolicyNumber}");
                    col.Item().Text($"رقم الحادث: {recovery.AccidentNumber}");
                    col.Item().Text($"قيمة المطالبة: {recovery.ClaimedAmount:N2} دينار");
                    col.Item().Text($"المبلغ المدفوع: {recovery.PaidAmount:N2} دينار");
                    col.Item().Text($"الحالة: {recovery.Status}");
                    col.Item().PaddingTop(12).Text(recovery.Notes ?? "");
                });
            });
        });

        return document.GeneratePdf();
    }
}
