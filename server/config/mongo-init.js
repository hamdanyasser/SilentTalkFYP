// ============================================
// MongoDB Initialization Script
// SilentTalk Database Setup
// ============================================

db = db.getSiblingDB('silentstalk');

// Create collections
db.createCollection('messages');
db.createCollection('conversations');
db.createCollection('notifications');

// Create indexes for messages collection
db.messages.createIndex({ conversationId: 1, timestamp: -1 });
db.messages.createIndex({ senderId: 1 });
db.messages.createIndex({ receiverId: 1 });
db.messages.createIndex({ timestamp: -1 });

// Create indexes for conversations collection
db.conversations.createIndex({ participants: 1 });
db.conversations.createIndex({ lastMessageAt: -1 });

// Create indexes for notifications collection
db.notifications.createIndex({ userId: 1, read: 1 });
db.notifications.createIndex({ createdAt: -1 });

// Create application user
db.createUser({
  user: 'silentstalk',
  pwd: 'silentstalk_dev_password',
  roles: [
    {
      role: 'readWrite',
      db: 'silentstalk'
    }
  ]
});

print('MongoDB initialized successfully for SilentTalk');
