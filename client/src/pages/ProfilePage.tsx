import React, { useState } from 'react';
import '../styles/ProfilePage.css';
import { updateProfile } from '../services/authService';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatarUrl: string;
  preferredSignLanguage: 'ASL' | 'BSL' | 'ISL';
  pronouns: string;
  location: string;
  joinedDate: string;
  lastActive: string;
}

const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    email: 'user@silenttalk.com',
    displayName: 'JohnDoe',
    firstName: 'John',
    lastName: 'Doe',
    bio: 'Passionate about sign language and accessible communication.',
    avatarUrl: '/default-avatar.png',
    preferredSignLanguage: 'ASL',
    pronouns: 'he/him',
    location: 'New York, USA',
    joinedDate: '2024-01-15',
    lastActive: new Date().toISOString(),
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditedProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const response = await updateProfile({
        displayName: editedProfile.displayName,
        firstName: editedProfile.firstName,
        lastName: editedProfile.lastName,
        bio: editedProfile.bio,
        avatarUrl: editedProfile.avatarUrl,
        preferredSignLanguage: editedProfile.preferredSignLanguage,
        pronouns: editedProfile.pronouns,
        location: editedProfile.location,
      });

      if (response.success) {
        setProfile(editedProfile);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert(`Failed to save profile: ${response.message}`);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('An error occurred while saving your profile');
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedProfile((prev) => ({
          ...prev,
          avatarUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary"
            aria-label="Edit profile"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="avatar-section">
            <img
              src={isEditing ? editedProfile.avatarUrl : profile.avatarUrl}
              alt={`${profile.displayName}'s avatar`}
              className="profile-avatar"
            />
            {isEditing && (
              <div className="avatar-upload">
                <label htmlFor="avatar-input" className="btn-secondary">
                  Change Avatar
                </label>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="visually-hidden"
                />
              </div>
            )}
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-label">Member Since</span>
              <span className="stat-value">
                {new Date(profile.joinedDate).toLocaleDateString()}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Last Active</span>
              <span className="stat-value">
                {new Date(profile.lastActive).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-main">
          <section className="profile-section">
            <h2>Personal Information</h2>

            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              {isEditing ? (
                <input
                  id="displayName"
                  type="text"
                  name="displayName"
                  value={editedProfile.displayName}
                  onChange={handleInputChange}
                  className="form-control"
                />
              ) : (
                <p className="profile-value">{profile.displayName}</p>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                {isEditing ? (
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={editedProfile.firstName}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                ) : (
                  <p className="profile-value">{profile.firstName}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                {isEditing ? (
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={editedProfile.lastName}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                ) : (
                  <p className="profile-value">{profile.lastName}</p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <p className="profile-value">{profile.email}</p>
              <small className="form-text">Email cannot be changed here</small>
            </div>

            <div className="form-group">
              <label htmlFor="pronouns">Pronouns</label>
              {isEditing ? (
                <input
                  id="pronouns"
                  type="text"
                  name="pronouns"
                  value={editedProfile.pronouns}
                  onChange={handleInputChange}
                  placeholder="e.g., he/him, she/her, they/them"
                  className="form-control"
                />
              ) : (
                <p className="profile-value">{profile.pronouns}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              {isEditing ? (
                <input
                  id="location"
                  type="text"
                  name="location"
                  value={editedProfile.location}
                  onChange={handleInputChange}
                  placeholder="City, Country"
                  className="form-control"
                />
              ) : (
                <p className="profile-value">{profile.location}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              {isEditing ? (
                <textarea
                  id="bio"
                  name="bio"
                  value={editedProfile.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="form-control"
                  maxLength={500}
                />
              ) : (
                <p className="profile-value">{profile.bio}</p>
              )}
              {isEditing && (
                <small className="form-text">
                  {editedProfile.bio.length}/500 characters
                </small>
              )}
            </div>
          </section>

          <section className="profile-section">
            <h2>Sign Language Preferences</h2>

            <div className="form-group">
              <label htmlFor="preferredSignLanguage">Preferred Sign Language</label>
              {isEditing ? (
                <select
                  id="preferredSignLanguage"
                  name="preferredSignLanguage"
                  value={editedProfile.preferredSignLanguage}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="ASL">American Sign Language (ASL)</option>
                  <option value="BSL">British Sign Language (BSL)</option>
                  <option value="ISL">Irish Sign Language (ISL)</option>
                </select>
              ) : (
                <p className="profile-value">
                  {profile.preferredSignLanguage === 'ASL' && 'American Sign Language (ASL)'}
                  {profile.preferredSignLanguage === 'BSL' && 'British Sign Language (BSL)'}
                  {profile.preferredSignLanguage === 'ISL' && 'Irish Sign Language (ISL)'}
                </p>
              )}
            </div>
          </section>

          {isEditing && (
            <div className="profile-actions">
              <button onClick={handleSave} className="btn-primary">
                Save Changes
              </button>
              <button onClick={handleCancel} className="btn-secondary">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
