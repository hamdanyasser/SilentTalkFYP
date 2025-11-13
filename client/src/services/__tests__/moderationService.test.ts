/**
 * Moderation Service Tests
 *
 * Tests for permission checks, moderation actions, and reputation management.
 */

import { canModerate, canEdit, canDelete, calculateReputationChange } from '../moderationService'

describe('moderationService - Permission Tests', () => {
  describe('canModerate', () => {
    it('should allow moderators to moderate', () => {
      expect(canModerate('moderator')).toBe(true)
    })

    it('should allow admins to moderate', () => {
      expect(canModerate('admin')).toBe(true)
    })

    it('should not allow regular users to moderate', () => {
      expect(canModerate('user')).toBe(false)
    })

    it('should not allow guests to moderate', () => {
      expect(canModerate('guest')).toBe(false)
    })
  })

  describe('canEdit', () => {
    it('should allow content author to edit their own content', () => {
      expect(canEdit('user-1', 'user-1', 'user')).toBe(true)
    })

    it('should not allow non-author to edit content', () => {
      expect(canEdit('user-1', 'user-2', 'user')).toBe(false)
    })

    it('should allow moderators to edit any content', () => {
      expect(canEdit('user-1', 'user-2', 'moderator')).toBe(true)
    })

    it('should allow admins to edit any content', () => {
      expect(canEdit('user-1', 'user-2', 'admin')).toBe(true)
    })

    it('should allow author to edit even with moderator role', () => {
      expect(canEdit('user-1', 'user-1', 'moderator')).toBe(true)
    })
  })

  describe('canDelete', () => {
    it('should allow content author to delete their own content', () => {
      expect(canDelete('user-1', 'user-1', 'user')).toBe(true)
    })

    it('should not allow non-author to delete content', () => {
      expect(canDelete('user-1', 'user-2', 'user')).toBe(false)
    })

    it('should allow moderators to delete any content', () => {
      expect(canDelete('user-1', 'user-2', 'moderator')).toBe(true)
    })

    it('should allow admins to delete any content', () => {
      expect(canDelete('user-1', 'user-2', 'admin')).toBe(true)
    })

    it('should allow author to delete even with moderator role', () => {
      expect(canDelete('user-1', 'user-1', 'moderator')).toBe(true)
    })
  })

  describe('calculateReputationChange', () => {
    it('should calculate correct points for thread creation', () => {
      expect(calculateReputationChange('thread_created')).toBe(5)
      expect(calculateReputationChange('thread_created', 3)).toBe(15)
    })

    it('should calculate correct points for reply creation', () => {
      expect(calculateReputationChange('reply_created')).toBe(2)
      expect(calculateReputationChange('reply_created', 5)).toBe(10)
    })

    it('should calculate correct points for upvote received', () => {
      expect(calculateReputationChange('upvote_received')).toBe(10)
      expect(calculateReputationChange('upvote_received', 2)).toBe(20)
    })

    it('should calculate correct negative points for downvote', () => {
      expect(calculateReputationChange('downvote_received')).toBe(-2)
      expect(calculateReputationChange('downvote_received', 3)).toBe(-6)
    })

    it('should calculate correct points for reply accepted', () => {
      expect(calculateReputationChange('reply_accepted')).toBe(25)
    })

    it('should calculate correct points for helpful reply', () => {
      expect(calculateReputationChange('reply_marked_helpful')).toBe(15)
    })

    it('should calculate correct negative points for content removed', () => {
      expect(calculateReputationChange('content_removed')).toBe(-10)
      expect(calculateReputationChange('content_removed', 2)).toBe(-20)
    })

    it('should calculate correct negative points for user warned', () => {
      expect(calculateReputationChange('user_warned')).toBe(-25)
    })

    it('should calculate correct negative points for user banned', () => {
      expect(calculateReputationChange('user_banned')).toBe(-100)
    })

    it('should return 0 for unknown action', () => {
      expect(calculateReputationChange('unknown_action')).toBe(0)
    })
  })
})
