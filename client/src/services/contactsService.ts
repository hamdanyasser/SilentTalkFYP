/**
 * Contacts API Service
 *
 * Handles all contacts-related API calls including CRUD operations,
 * search, grouping, blocking, and presence updates.
 */

import {
  Contact,
  ContactRequest,
  RecentActivity,
  AddContactRequest,
  AddContactResponse,
  UpdateContactRequest,
  UpdateContactResponse,
  BlockContactRequest,
  BlockContactResponse,
  UnblockContactRequest,
  UnblockContactResponse,
  DeleteContactRequest,
  DeleteContactResponse,
  GetContactsResponse,
  GetContactRequestsResponse,
  RespondToContactRequestRequest,
  RespondToContactRequestResponse,
  SearchContactsRequest,
  SearchContactsResponse,
  GetRecentActivityResponse,
  ContactStatistics,
} from '../types/contacts'

// Simulated delay for mock API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock data store
// TODO: Replace with real API calls
const mockContacts: Contact[] = [
  {
    id: '1',
    userId: 'user-1',
    username: 'johndoe',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatarUrl: undefined,
    status: 'accepted',
    group: 'friends',
    isBlocked: false,
    isFavorite: true,
    notes: 'College friend',
    presenceStatus: 'online',
    lastSeen: new Date(),
    isOnline: true,
    preferredSignLanguage: 'ASL',
    bio: 'Software developer and ASL enthusiast',
    addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    lastActivityAt: new Date(),
  },
  {
    id: '2',
    userId: 'user-2',
    username: 'janedoe',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    avatarUrl: undefined,
    status: 'accepted',
    group: 'family',
    isBlocked: false,
    isFavorite: true,
    notes: 'Sister',
    presenceStatus: 'away',
    lastSeen: new Date(Date.now() - 15 * 60 * 1000),
    isOnline: false,
    preferredSignLanguage: 'ASL',
    addedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '3',
    userId: 'user-3',
    username: 'bobsmith',
    email: 'bob@example.com',
    firstName: 'Bob',
    lastName: 'Smith',
    avatarUrl: undefined,
    status: 'accepted',
    group: 'work',
    isBlocked: false,
    isFavorite: false,
    notes: 'Colleague from marketing',
    presenceStatus: 'busy',
    lastSeen: new Date(Date.now() - 5 * 60 * 1000),
    isOnline: true,
    preferredSignLanguage: 'BSL',
    addedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    lastActivityAt: new Date(Date.now() - 30 * 60 * 1000),
  },
]

const mockContactRequests: ContactRequest[] = [
  {
    id: 'req-1',
    fromUserId: 'user-4',
    fromUsername: 'alicewonder',
    fromAvatarUrl: undefined,
    toUserId: 'current-user',
    message: 'Hey! Would love to connect and practice sign language together.',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
]

const mockRecentActivity: RecentActivity[] = [
  {
    id: 'act-1',
    contactId: '1',
    contactUsername: 'johndoe',
    type: 'call',
    description: 'Video call - 15 minutes',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'act-2',
    contactId: '2',
    contactUsername: 'janedoe',
    type: 'message',
    description: 'Sent you a message',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'act-3',
    contactId: '1',
    contactUsername: 'johndoe',
    type: 'status_change',
    description: 'Came online',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
  },
]

/**
 * Get all contacts
 */
export async function getContacts(): Promise<GetContactsResponse> {
  try {
    // TODO: Replace with real API call
    await delay(800)

    return {
      success: true,
      contacts: mockContacts.filter(c => c.status === 'accepted' && !c.isBlocked),
      totalCount: mockContacts.filter(c => c.status === 'accepted' && !c.isBlocked).length,
    }
  } catch (error) {
    console.error('Get contacts error:', error)
    return {
      success: false,
      contacts: [],
      totalCount: 0,
    }
  }
}

/**
 * Get contact requests
 */
export async function getContactRequests(): Promise<GetContactRequestsResponse> {
  try {
    // TODO: Replace with real API call
    await delay(500)

    return {
      success: true,
      requests: mockContactRequests.filter(r => r.status === 'pending'),
      totalCount: mockContactRequests.filter(r => r.status === 'pending').length,
    }
  } catch (error) {
    console.error('Get contact requests error:', error)
    return {
      success: false,
      requests: [],
      totalCount: 0,
    }
  }
}

/**
 * Add a new contact
 */
export async function addContact(data: AddContactRequest): Promise<AddContactResponse> {
  try {
    // TODO: Replace with real API call
    await delay(1000)

    // Simulate user not found
    if (data.userIdOrEmail === 'notfound@example.com') {
      return {
        success: false,
        message: 'User not found',
      }
    }

    const newRequest: ContactRequest = {
      id: `req-${Date.now()}`,
      fromUserId: 'current-user',
      fromUsername: 'currentuser',
      toUserId: 'target-user',
      message: data.message,
      status: 'pending',
      createdAt: new Date(),
    }

    mockContactRequests.push(newRequest)

    return {
      success: true,
      message: 'Contact request sent successfully',
      contactRequest: newRequest,
    }
  } catch (error) {
    console.error('Add contact error:', error)
    return {
      success: false,
      message: 'Failed to send contact request',
    }
  }
}

/**
 * Respond to contact request
 */
export async function respondToContactRequest(
  data: RespondToContactRequestRequest,
): Promise<RespondToContactRequestResponse> {
  try {
    // TODO: Replace with real API call
    await delay(800)

    const request = mockContactRequests.find(r => r.id === data.requestId)

    if (!request) {
      return {
        success: false,
        message: 'Contact request not found',
      }
    }

    if (data.accept) {
      // Accept request - create contact
      const newContact: Contact = {
        id: `contact-${Date.now()}`,
        userId: request.fromUserId,
        username: request.fromUsername,
        email: `${request.fromUsername}@example.com`,
        avatarUrl: request.fromAvatarUrl,
        status: 'accepted',
        group: 'other',
        isBlocked: false,
        isFavorite: false,
        presenceStatus: 'offline',
        isOnline: false,
        addedAt: new Date(),
        updatedAt: new Date(),
      }

      mockContacts.push(newContact)
      request.status = 'accepted'
      request.respondedAt = new Date()

      return {
        success: true,
        message: 'Contact request accepted',
        contact: newContact,
      }
    } else {
      // Reject request
      request.status = 'rejected'
      request.respondedAt = new Date()

      return {
        success: true,
        message: 'Contact request rejected',
      }
    }
  } catch (error) {
    console.error('Respond to contact request error:', error)
    return {
      success: false,
      message: 'Failed to respond to contact request',
    }
  }
}

/**
 * Update contact
 */
export async function updateContact(data: UpdateContactRequest): Promise<UpdateContactResponse> {
  try {
    // TODO: Replace with real API call
    await delay(500)

    const contact = mockContacts.find(c => c.id === data.contactId)

    if (!contact) {
      return {
        success: false,
        message: 'Contact not found',
      }
    }

    // Update fields
    if (data.group !== undefined) contact.group = data.group
    if (data.isFavorite !== undefined) contact.isFavorite = data.isFavorite
    if (data.notes !== undefined) contact.notes = data.notes
    contact.updatedAt = new Date()

    return {
      success: true,
      message: 'Contact updated successfully',
      contact,
    }
  } catch (error) {
    console.error('Update contact error:', error)
    return {
      success: false,
      message: 'Failed to update contact',
    }
  }
}

/**
 * Block contact
 */
export async function blockContact(data: BlockContactRequest): Promise<BlockContactResponse> {
  try {
    // TODO: Replace with real API call
    await delay(800)

    const contact = mockContacts.find(c => c.id === data.contactId)

    if (!contact) {
      return {
        success: false,
        message: 'Contact not found',
      }
    }

    contact.isBlocked = true
    contact.updatedAt = new Date()

    return {
      success: true,
      message: 'Contact blocked successfully',
    }
  } catch (error) {
    console.error('Block contact error:', error)
    return {
      success: false,
      message: 'Failed to block contact',
    }
  }
}

/**
 * Unblock contact
 */
export async function unblockContact(data: UnblockContactRequest): Promise<UnblockContactResponse> {
  try {
    // TODO: Replace with real API call
    await delay(800)

    const contact = mockContacts.find(c => c.id === data.contactId)

    if (!contact) {
      return {
        success: false,
        message: 'Contact not found',
      }
    }

    contact.isBlocked = false
    contact.updatedAt = new Date()

    return {
      success: true,
      message: 'Contact unblocked successfully',
    }
  } catch (error) {
    console.error('Unblock contact error:', error)
    return {
      success: false,
      message: 'Failed to unblock contact',
    }
  }
}

/**
 * Delete contact
 */
export async function deleteContact(data: DeleteContactRequest): Promise<DeleteContactResponse> {
  try {
    // TODO: Replace with real API call
    await delay(800)

    const index = mockContacts.findIndex(c => c.id === data.contactId)

    if (index === -1) {
      return {
        success: false,
        message: 'Contact not found',
      }
    }

    mockContacts.splice(index, 1)

    return {
      success: true,
      message: 'Contact deleted successfully',
    }
  } catch (error) {
    console.error('Delete contact error:', error)
    return {
      success: false,
      message: 'Failed to delete contact',
    }
  }
}

/**
 * Search contacts
 */
export async function searchContacts(data: SearchContactsRequest): Promise<SearchContactsResponse> {
  try {
    // TODO: Replace with real API call
    await delay(500)

    let filtered = mockContacts.filter(c => c.status === 'accepted')

    // Apply search query
    if (data.query) {
      const query = data.query.toLowerCase()
      filtered = filtered.filter(
        c =>
          c.username.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.firstName?.toLowerCase().includes(query) ||
          c.lastName?.toLowerCase().includes(query),
      )
    }

    // Apply filters
    if (data.filters?.group) {
      filtered = filtered.filter(c => c.group === data.filters!.group)
    }

    if (data.filters?.isOnline !== undefined) {
      filtered = filtered.filter(c => c.isOnline === data.filters!.isOnline)
    }

    if (data.filters?.isFavorite !== undefined) {
      filtered = filtered.filter(c => c.isFavorite === data.filters!.isFavorite)
    }

    return {
      success: true,
      contacts: filtered,
      totalCount: filtered.length,
    }
  } catch (error) {
    console.error('Search contacts error:', error)
    return {
      success: false,
      contacts: [],
      totalCount: 0,
    }
  }
}

/**
 * Get recent activity
 */
export async function getRecentActivity(): Promise<GetRecentActivityResponse> {
  try {
    // TODO: Replace with real API call
    await delay(500)

    return {
      success: true,
      activities: mockRecentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    }
  } catch (error) {
    console.error('Get recent activity error:', error)
    return {
      success: false,
      activities: [],
    }
  }
}

/**
 * Get contact statistics
 */
export async function getContactStatistics(): Promise<ContactStatistics> {
  try {
    // TODO: Replace with real API call
    await delay(300)

    const acceptedContacts = mockContacts.filter(c => c.status === 'accepted' && !c.isBlocked)

    const stats: ContactStatistics = {
      totalContacts: acceptedContacts.length,
      onlineContacts: acceptedContacts.filter(c => c.isOnline).length,
      pendingRequests: mockContactRequests.filter(r => r.status === 'pending').length,
      blockedContacts: mockContacts.filter(c => c.isBlocked).length,
      favoriteContacts: acceptedContacts.filter(c => c.isFavorite).length,
      groupCounts: {
        friends: acceptedContacts.filter(c => c.group === 'friends').length,
        family: acceptedContacts.filter(c => c.group === 'family').length,
        work: acceptedContacts.filter(c => c.group === 'work').length,
        colleagues: acceptedContacts.filter(c => c.group === 'colleagues').length,
        other: acceptedContacts.filter(c => c.group === 'other').length,
      },
    }

    return stats
  } catch (error) {
    console.error('Get contact statistics error:', error)
    return {
      totalContacts: 0,
      onlineContacts: 0,
      pendingRequests: 0,
      blockedContacts: 0,
      favoriteContacts: 0,
      groupCounts: {
        friends: 0,
        family: 0,
        work: 0,
        colleagues: 0,
        other: 0,
      },
    }
  }
}

/**
 * Check if contact is blocked
 */
export async function isContactBlocked(contactId: string): Promise<boolean> {
  try {
    const contact = mockContacts.find(c => c.id === contactId)
    return contact?.isBlocked ?? false
  } catch (error) {
    console.error('Check blocked status error:', error)
    return false
  }
}

/**
 * Check if user can initiate call with contact
 */
export async function canInitiateCall(
  contactId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const contact = mockContacts.find(c => c.id === contactId)

    if (!contact) {
      return { allowed: false, reason: 'Contact not found' }
    }

    if (contact.isBlocked) {
      return { allowed: false, reason: 'This contact has been blocked' }
    }

    if (contact.status !== 'accepted') {
      return { allowed: false, reason: 'Contact request not accepted' }
    }

    if (!contact.isOnline) {
      return { allowed: false, reason: 'Contact is offline' }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Check call permission error:', error)
    return { allowed: false, reason: 'Failed to check permissions' }
  }
}
