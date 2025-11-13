using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SilentTalk.Domain.Entities;
using SilentTalk.Domain.Enums;

namespace SilentTalk.Infrastructure.Data.Configurations;

/// <summary>
/// Entity configuration for Contact
/// </summary>
public class ContactConfiguration : IEntityTypeConfiguration<Contact>
{
    public void Configure(EntityTypeBuilder<Contact> builder)
    {
        // Table name
        builder.ToTable("Contacts");

        // Primary key
        builder.HasKey(c => c.ContactId);

        // Properties
        builder.Property(c => c.ContactId)
            .IsRequired()
            .ValueGeneratedOnAdd();

        builder.Property(c => c.UserId)
            .IsRequired();

        builder.Property(c => c.ContactUserId)
            .IsRequired();

        builder.Property(c => c.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(c => c.AddedAt)
            .IsRequired();

        builder.Property(c => c.CreatedAt)
            .IsRequired();

        builder.Property(c => c.UpdatedAt)
            .IsRequired();

        // Ignore the base entity Id property
        builder.Ignore(c => c.Id);

        // Indexes
        builder.HasIndex(c => c.UserId)
            .HasDatabaseName("IX_Contacts_UserId");

        builder.HasIndex(c => c.ContactUserId)
            .HasDatabaseName("IX_Contacts_ContactUserId");

        builder.HasIndex(c => new { c.UserId, c.ContactUserId })
            .IsUnique()
            .HasDatabaseName("IX_Contacts_UserId_ContactUserId");

        builder.HasIndex(c => c.Status)
            .HasDatabaseName("IX_Contacts_Status");

        // Relationships
        builder.HasOne(c => c.User)
            .WithMany(u => u.UserContacts)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.ContactUser)
            .WithMany(u => u.ContactOfUsers)
            .HasForeignKey(c => c.ContactUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
