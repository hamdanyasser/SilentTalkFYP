using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SilentTalk.Domain.Entities;

namespace SilentTalk.Infrastructure.Data.Configurations;

/// <summary>
/// EF Core configuration for UserReport entity
/// </summary>
public class UserReportConfiguration : IEntityTypeConfiguration<UserReport>
{
    public void Configure(EntityTypeBuilder<UserReport> builder)
    {
        builder.ToTable("UserReports");

        builder.HasKey(r => r.ReportId);

        builder.Property(r => r.ContentType)
            .IsRequired();

        builder.Property(r => r.ContentId)
            .HasMaxLength(100);

        builder.Property(r => r.Reason)
            .IsRequired();

        builder.Property(r => r.Details)
            .HasMaxLength(2000);

        builder.Property(r => r.Status)
            .IsRequired();

        builder.Property(r => r.ReviewNotes)
            .HasMaxLength(2000);

        builder.Property(r => r.ActionTaken);

        // Indexes for efficient querying
        builder.HasIndex(r => r.ReporterId);
        builder.HasIndex(r => r.ReportedUserId);
        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => r.CreatedAt);
        builder.HasIndex(r => new { r.ContentType, r.ContentId });

        // Relationships
        builder.HasOne(r => r.Reporter)
            .WithMany()
            .HasForeignKey(r => r.ReporterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.ReportedUser)
            .WithMany()
            .HasForeignKey(r => r.ReportedUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.ReviewedByUser)
            .WithMany()
            .HasForeignKey(r => r.ReviewedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
