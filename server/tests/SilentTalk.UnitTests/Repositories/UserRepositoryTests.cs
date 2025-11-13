using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SilentTalk.Domain.Entities;
using SilentTalk.Infrastructure.Data;
using SilentTalk.Infrastructure.Repositories;
using Xunit;

namespace SilentTalk.UnitTests.Repositories;

public class UserRepositoryTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly UserRepository _repository;

    public UserRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _repository = new UserRepository(_context);
    }

    [Fact]
    public async Task AddAsync_ShouldAddUser_WhenValidUser()
    {
        // Arrange
        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = "test@example.com",
            PasswordHash = "hashedpassword",
            DisplayName = "Test User",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Act
        var result = await _repository.AddAsync(user);
        await _context.SaveChangesAsync();

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be(user.UserId);
        result.Email.Should().Be(user.Email);
    }

    [Fact]
    public async Task GetByEmailAsync_ShouldReturnUser_WhenEmailExists()
    {
        // Arrange
        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = "john.doe@example.com",
            PasswordHash = "hashedpassword",
            DisplayName = "John Doe",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _repository.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByEmailAsync("john.doe@example.com");

        // Assert
        result.Should().NotBeNull();
        result!.Email.Should().Be("john.doe@example.com");
        result.DisplayName.Should().Be("John Doe");
    }

    [Fact]
    public async Task GetByEmailAsync_ShouldReturnNull_WhenEmailDoesNotExist()
    {
        // Act
        var result = await _repository.GetByEmailAsync("nonexistent@example.com");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task EmailExistsAsync_ShouldReturnTrue_WhenEmailExists()
    {
        // Arrange
        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = "existing@example.com",
            PasswordHash = "hashedpassword",
            DisplayName = "Existing User",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _repository.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.EmailExistsAsync("existing@example.com");

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task EmailExistsAsync_ShouldReturnFalse_WhenEmailDoesNotExist()
    {
        // Act
        var result = await _repository.EmailExistsAsync("nonexistent@example.com");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnUser_WhenUserExists()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            UserId = userId,
            Email = "user@example.com",
            PasswordHash = "hashedpassword",
            DisplayName = "User",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _repository.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result!.UserId.Should().Be(userId);
    }

    [Fact]
    public async Task Update_ShouldUpdateUser_WhenValidChanges()
    {
        // Arrange
        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = "update@example.com",
            PasswordHash = "hashedpassword",
            DisplayName = "Original Name",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _repository.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        user.DisplayName = "Updated Name";
        _repository.Update(user);
        await _context.SaveChangesAsync();

        var result = await _repository.GetByIdAsync(user.UserId);

        // Assert
        result.Should().NotBeNull();
        result!.DisplayName.Should().Be("Updated Name");
    }

    [Fact]
    public async Task Delete_ShouldRemoveUser_WhenUserExists()
    {
        // Arrange
        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = "delete@example.com",
            PasswordHash = "hashedpassword",
            DisplayName = "To Delete",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _repository.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        _repository.Delete(user);
        await _context.SaveChangesAsync();

        var result = await _repository.GetByIdAsync(user.UserId);

        // Assert
        result.Should().BeNull();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
