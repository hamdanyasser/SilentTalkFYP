using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SilentTalk.Domain.Entities;

namespace SilentTalk.Infrastructure.Data.Configurations;

/// <summary>
/// Entity configuration for Participant
/// </summary>
public class ParticipantConfiguration : IEntityTypeConfiguration<Participant>
{
    public void Configure(EntityTypeBuilder<Participant> builder)
    {
        // Table name
        builder.ToTable("Participants");

        // Primary key
        builder.HasKey(p => p.ParticipantId);

        // Properties
        builder.Property(p => p.ParticipantId)
            .IsRequired()
            .ValueGeneratedOnAdd();

        builder.Property(p => p.CallId)
            .IsRequired();

        builder.Property(p => p.UserId)
            .IsRequired();

        builder.Property(p => p.JoinedAt)
            .IsRequired();

        builder.Property(p => p.LeftAt);

        builder.Property(p => p.CreatedAt)
            .IsRequired();

        builder.Property(p => p.UpdatedAt)
            .IsRequired();

        // Ignore the base entity Id property
        builder.Ignore(p => p.Id);

        // Indexes
        builder.HasIndex(p => p.CallId)
            .HasDatabaseName("IX_Participants_CallId");

        builder.HasIndex(p => p.UserId)
            .HasDatabaseName("IX_Participants_UserId");

        builder.HasIndex(p => new { p.CallId, p.UserId })
            .HasDatabaseName("IX_Participants_CallId_UserId");

        // Relationships
        builder.HasOne(p => p.Call)
            .WithMany(c => c.Participants)
            .HasForeignKey(p => p.CallId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.User)
            .WithMany(u => u.Participations)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
