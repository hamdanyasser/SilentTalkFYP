using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SilentTalk.Domain.Entities;

namespace SilentTalk.Infrastructure.Data.Configurations;

/// <summary>
/// Entity configuration for ApplicationUser
/// </summary>
public class UserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        // Configure additional properties
        builder.Property(u => u.DisplayName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.ProfileImageUrl)
            .HasMaxLength(500);

        builder.Property(u => u.PreferredLanguage)
            .HasMaxLength(50);

        builder.Property(u => u.RefreshToken)
            .HasMaxLength(500);

        builder.Property(u => u.CreatedAt)
            .IsRequired();

        builder.Property(u => u.UpdatedAt)
            .IsRequired();

        // Relationships
        // Note: Contact relationships are configured in ContactConfiguration
        // to avoid duplicate relationship definitions

        builder.HasMany(u => u.InitiatedCalls)
            .WithOne(c => c.Initiator)
            .HasForeignKey(c => c.InitiatorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(u => u.Participations)
            .WithOne(p => p.User)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
