using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Enums;

namespace SilentTalk.Infrastructure.Data.Configurations;

/// <summary>
/// Entity configuration for Call
/// </summary>
public class CallConfiguration : IEntityTypeConfiguration<Call>
{
    public void Configure(EntityTypeBuilder<Call> builder)
    {
        // Table name
        builder.ToTable("Calls");

        // Primary key
        builder.HasKey(c => c.CallId);

        // Properties
        builder.Property(c => c.CallId)
            .IsRequired()
            .ValueGeneratedOnAdd();

        builder.Property(c => c.InitiatorId)
            .IsRequired();

        builder.Property(c => c.StartTime)
            .IsRequired();

        builder.Property(c => c.EndTime);

        builder.Property(c => c.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(c => c.RecordingUrl)
            .HasMaxLength(500);

        builder.Property(c => c.CreatedAt)
            .IsRequired();

        builder.Property(c => c.UpdatedAt)
            .IsRequired();

        // Ignore the base entity Id property
        builder.Ignore(c => c.Id);

        // Indexes
        builder.HasIndex(c => c.InitiatorId)
            .HasDatabaseName("IX_Calls_InitiatorId");

        builder.HasIndex(c => c.Status)
            .HasDatabaseName("IX_Calls_Status");

        builder.HasIndex(c => c.StartTime)
            .HasDatabaseName("IX_Calls_StartTime");

        // Relationships
        builder.HasOne(c => c.Initiator)
            .WithMany(u => u.InitiatedCalls)
            .HasForeignKey(c => c.InitiatorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Participants)
            .WithOne(p => p.Call)
            .HasForeignKey(p => p.CallId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
