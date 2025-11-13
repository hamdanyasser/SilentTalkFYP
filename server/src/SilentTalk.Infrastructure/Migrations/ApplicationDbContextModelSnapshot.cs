using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using SilentTalk.Infrastructure.Data;

#nullable disable

namespace SilentTalk.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    partial class ApplicationDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "8.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            modelBuilder.Entity("SilentTalk.Domain.Entities.User", b =>
                {
                    b.Property<Guid>("UserId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("Email")
                        .IsRequired()
                        .HasMaxLength(255)
                        .HasColumnType("character varying(255)");

                    b.Property<string>("PasswordHash")
                        .IsRequired()
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<string>("DisplayName")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<string>("ProfileImageUrl")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<string>("PreferredLanguage")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("UserId");

                    b.HasIndex("Email")
                        .IsUnique()
                        .HasDatabaseName("IX_Users_Email");

                    b.ToTable("Users", (string)null);
                });

            modelBuilder.Entity("SilentTalk.Domain.Entities.Call", b =>
                {
                    b.Property<Guid>("CallId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<Guid>("InitiatorId")
                        .HasColumnType("uuid");

                    b.Property<DateTime>("StartTime")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime?>("EndTime")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<string>("RecordingUrl")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("CallId");

                    b.HasIndex("InitiatorId")
                        .HasDatabaseName("IX_Calls_InitiatorId");

                    b.HasIndex("Status")
                        .HasDatabaseName("IX_Calls_Status");

                    b.HasIndex("StartTime")
                        .HasDatabaseName("IX_Calls_StartTime");

                    b.ToTable("Calls", (string)null);
                });

            modelBuilder.Entity("SilentTalk.Domain.Entities.Participant", b =>
                {
                    b.Property<Guid>("ParticipantId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<Guid>("CallId")
                        .HasColumnType("uuid");

                    b.Property<Guid>("UserId")
                        .HasColumnType("uuid");

                    b.Property<DateTime>("JoinedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime?>("LeftAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("ParticipantId");

                    b.HasIndex("CallId")
                        .HasDatabaseName("IX_Participants_CallId");

                    b.HasIndex("UserId")
                        .HasDatabaseName("IX_Participants_UserId");

                    b.HasIndex("CallId", "UserId")
                        .HasDatabaseName("IX_Participants_CallId_UserId");

                    b.ToTable("Participants", (string)null);
                });

            modelBuilder.Entity("SilentTalk.Domain.Entities.Contact", b =>
                {
                    b.Property<Guid>("ContactId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<Guid>("UserId")
                        .HasColumnType("uuid");

                    b.Property<Guid>("ContactUserId")
                        .HasColumnType("uuid");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<DateTime>("AddedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("ContactId");

                    b.HasIndex("UserId")
                        .HasDatabaseName("IX_Contacts_UserId");

                    b.HasIndex("ContactUserId")
                        .HasDatabaseName("IX_Contacts_ContactUserId");

                    b.HasIndex("UserId", "ContactUserId")
                        .IsUnique()
                        .HasDatabaseName("IX_Contacts_UserId_ContactUserId");

                    b.HasIndex("Status")
                        .HasDatabaseName("IX_Contacts_Status");

                    b.ToTable("Contacts", (string)null);
                });

            // Relationships
            modelBuilder.Entity("SilentTalk.Domain.Entities.Call", b =>
                {
                    b.HasOne("SilentTalk.Domain.Entities.User", "Initiator")
                        .WithMany("InitiatedCalls")
                        .HasForeignKey("InitiatorId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();
                });

            modelBuilder.Entity("SilentTalk.Domain.Entities.Participant", b =>
                {
                    b.HasOne("SilentTalk.Domain.Entities.Call", "Call")
                        .WithMany("Participants")
                        .HasForeignKey("CallId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("SilentTalk.Domain.Entities.User", "User")
                        .WithMany("Participations")
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("SilentTalk.Domain.Entities.Contact", b =>
                {
                    b.HasOne("SilentTalk.Domain.Entities.User", "User")
                        .WithMany("UserContacts")
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.HasOne("SilentTalk.Domain.Entities.User", "ContactUser")
                        .WithMany("ContactOfUsers")
                        .HasForeignKey("ContactUserId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();
                });
#pragma warning restore 612, 618
        }
    }
}
