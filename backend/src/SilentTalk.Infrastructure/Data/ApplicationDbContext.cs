using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SilentTalk.Domain.Entities;

namespace SilentTalk.Infrastructure.Data;

/// <summary>
/// Main database context for SilentTalk application
/// Implements EF Core with Identity integration
/// Maps to NFR-008: SQL database for structured data
/// </summary>
public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Call> Calls => Set<Call>();
    public DbSet<Participant> Participants => Set<Participant>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<ForumPost> ForumPosts => Set<ForumPost>();
    public DbSet<Resource> Resources => Set<Resource>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User entity configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(e => e.DisplayName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.PreferredLanguage).HasMaxLength(10).IsRequired();
            entity.Property(e => e.AvailabilityStatus).HasMaxLength(20);

            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.IsOnline);

            // Self-referencing many-to-many through Contacts
            entity.HasMany(e => e.Contacts)
                .WithOne(e => e.User)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.ContactOf)
                .WithOne(e => e.ContactUser)
                .HasForeignKey(e => e.ContactUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Call entity configuration
        modelBuilder.Entity<Call>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasConversion<string>();

            entity.HasOne(e => e.Initiator)
                .WithMany(e => e.InitiatedCalls)
                .HasForeignKey(e => e.InitiatorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.StartTime);
        });

        // Participant entity configuration
        modelBuilder.Entity<Participant>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Call)
                .WithMany(e => e.Participants)
                .HasForeignKey(e => e.CallId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(e => e.CallParticipations)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.CallId, e.UserId });
        });

        // Contact entity configuration
        modelBuilder.Entity<Contact>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasConversion<string>();

            entity.HasIndex(e => new { e.UserId, e.ContactUserId }).IsUnique();
            entity.HasIndex(e => e.Status);
        });

        // ForumPost entity configuration
        modelBuilder.Entity<ForumPost>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Category).HasMaxLength(50);

            entity.HasOne(e => e.Author)
                .WithMany()
                .HasForeignKey(e => e.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ParentPost)
                .WithMany(e => e.Replies)
                .HasForeignKey(e => e.ParentPostId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.ParentPostId);
        });

        // Resource entity configuration
        modelBuilder.Entity<Resource>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Type).HasConversion<string>();
            entity.Property(e => e.Category).HasMaxLength(50).IsRequired();
            entity.Property(e => e.SignLanguage).HasMaxLength(10);

            entity.HasOne(e => e.Uploader)
                .WithMany()
                .HasForeignKey(e => e.UploadedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.SignLanguage);
        });

        // Apply global query filters for soft delete if needed
        modelBuilder.Entity<ForumPost>().HasQueryFilter(p => !p.IsDeleted);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is BaseEntity && (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entry in entries)
        {
            var entity = (BaseEntity)entry.Entity;

            if (entry.State == EntityState.Added)
            {
                entity.CreatedAt = DateTime.UtcNow;
            }

            entity.UpdatedAt = DateTime.UtcNow;
        }

        // Update User timestamps separately
        var userEntries = ChangeTracker.Entries<User>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in userEntries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }

            entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
    }
}
