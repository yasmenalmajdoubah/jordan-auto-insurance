using JordanAutoInsurance.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace JordanAutoInsurance.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Insured> Insureds => Set<Insured>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Policy> Policies => Set<Policy>();
    public DbSet<PricingRule> PricingRules => Set<PricingRule>();
    public DbSet<DepreciationRule> DepreciationRules => Set<DepreciationRule>();
    public DbSet<Accident> Accidents => Set<Accident>();
    public DbSet<CoverageCheckLog> CoverageCheckLogs => Set<CoverageCheckLog>();
    public DbSet<DamageItem> DamageItems => Set<DamageItem>();
    public DbSet<AccidentPayment> AccidentPayments => Set<AccidentPayment>();
    public DbSet<InjuryClaim> InjuryClaims => Set<InjuryClaim>();
    public DbSet<Claim> Claims => Set<Claim>();
    public DbSet<Settlement> Settlements => Set<Settlement>();
    public DbSet<RecoveryClaim> RecoveryClaims => Set<RecoveryClaim>();
    public DbSet<DocumentFile> Documents => Set<DocumentFile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Insured>().HasIndex(x => x.NationalId).IsUnique();
        modelBuilder.Entity<Vehicle>().HasIndex(x => x.ChassisNumber).IsUnique();
        modelBuilder.Entity<Vehicle>().HasIndex(x => x.PlateNumber);
        modelBuilder.Entity<Policy>().HasIndex(x => x.PolicyNumber).IsUnique();
        modelBuilder.Entity<Accident>().HasIndex(x => x.AccidentNumber).IsUnique();
        modelBuilder.Entity<Claim>().HasIndex(x => x.ClaimNumber).IsUnique();
        modelBuilder.Entity<AppUser>().HasIndex(x => x.UserName).IsUnique();
        modelBuilder.Entity<PricingRule>().HasIndex(x => x.ParameterKey).IsUnique();

        modelBuilder.Entity<Vehicle>()
            .HasOne(v => v.Owner)
            .WithMany(i => i.Vehicles)
            .HasForeignKey(v => v.OwnerInsuredId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Policy>()
            .HasOne(p => p.Insured)
            .WithMany(i => i.Policies)
            .HasForeignKey(p => p.InsuredId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Policy>()
            .HasOne(p => p.Vehicle)
            .WithMany(v => v.Policies)
            .HasForeignKey(p => p.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Claim>()
            .HasOne(c => c.Settlement)
            .WithOne(s => s.Claim)
            .HasForeignKey<Settlement>(s => s.ClaimId);

        modelBuilder.Entity<Claim>()
            .HasOne(c => c.RecoveryClaim)
            .WithOne(r => r.Claim)
            .HasForeignKey<RecoveryClaim>(r => r.ClaimId);

        modelBuilder.Entity<CoverageCheckLog>()
            .HasOne(c => c.Accident)
            .WithMany(a => a.CoverageChecks)
            .HasForeignKey(c => c.AccidentId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);
    }
}
