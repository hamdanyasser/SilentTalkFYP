/**
 * Contacts & Presence Types
 */

import { UserStatus, SignLanguage } from './auth'

export type ContactStatus = 'pending' | 'accepted' | 'blocked'
export type ContactGroup = 'friends' | 'family' | 'work' | 'colleagues' | 'other'

export interface Contact {
  id: string
  userId: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  status: ContactStatus
  group?: ContactGroup
  isBlocked: boolean
  isFavorite: boolean
  notes?: string

  // Presence
  presenceStatus: UserStatus
  lastSeen?: Date
  isOnline: boolean

  // Profile
  preferredSignLanguage?: SignLanguage
  bio?: string

  // Metadata
  addedAt: Date
  updatedAt: Date
  lastActivityAt?: Date
}

export interface ContactRequest {
  id: string
  fromUserId: string
  fromUsername: string
  fromAvatarUrl?: string
  toUserId: string
  message?: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Date
  respondedAt?: Date
}

export interface RecentActivity {
  id: string
  contactId: string
  contactUsername: string
  contactAvatarUrl?: string
  type: 'call' | 'message' | 'status_change' | 'added'
  description: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface ContactGroup {
  id: string
  name: string
  icon?: string
  color?: string
  contactCount: number
}

export interface PresenceUpdate {
  userId: string
  status: UserStatus
  lastSeen?: Date
  isOnline: boolean
}

// API Request/Response Types

export interface AddContactRequest {
  userIdOrEmail: string
  message?: string
  group?: ContactGroup
}

export interface AddContactResponse {
  success: boolean
  message: string
  contactRequest?: ContactRequest
}

export interface UpdateContactRequest {
  contactId: string
  group?: ContactGroup
  isFavorite?: boolean
  notes?: string
}

export interface UpdateContactResponse {
  success: boolean
  message: string
  contact?: Contact
}

export interface BlockContactRequest {
  contactId: string
  reason?: string
}

export interface BlockContactResponse {
  success: boolean
  message: string
}

export interface UnblockContactRequest {
  contactId: string
}

export interface UnblockContactResponse {
  success: boolean
  message: string
}

export interface DeleteContactRequest {
  contactId: string
}

export interface DeleteContactResponse {
  success: boolean
  message: string
}

export interface GetContactsResponse {
  success: boolean
  contacts: Contact[]
  totalCount: number
}

export interface GetContactRequestsResponse {
  success: boolean
  requests: ContactRequest[]
  totalCount: number
}

export interface RespondToContactRequestRequest {
  requestId: string
  accept: boolean
}

export interface RespondToContactRequestResponse {
  success: boolean
  message: string
  contact?: Contact
}

export interface SearchContactsRequest {
  query: string
  filters?: {
    group?: ContactGroup
    isOnline?: boolean
    isFavorite?: boolean
  }
}

export interface SearchContactsResponse {
  success: boolean
  contacts: Contact[]
  totalCount: number
}

export interface GetRecentActivityResponse {
  success: boolean
  activities: RecentActivity[]
}

// SignalR Hub Events

export interface SignalRPresenceEvents {
  // Events we receive from server
  onPresenceUpdate: (update: PresenceUpdate) => void
  onContactAdded: (contact: Contact) => void
  onContactRemoved: (contactId: string) => void
  onContactUpdated: (contact: Contact) => void
  onContactBlocked: (contactId: string) => void
  onContactUnblocked: (contactId: string) => void

  // Events we send to server
  updatePresence: (status: UserStatus) => Promise<void>
  subscribeToContact: (contactId: string) => Promise<void>
  unsubscribeFromContact: (contactId: string) => Promise<void>
}

// Contact List Filters & Sort

export type ContactSortBy = 'name' | 'recent' | 'status' | 'group'
export type ContactSortOrder = 'asc' | 'desc'

export interface ContactFilters {
  status?: ContactStatus
  group?: ContactGroup
  isOnline?: boolean
  isFavorite?: boolean
  isBlocked?: boolean
  searchQuery?: string
}

export interface ContactListState {
  contacts: Contact[]
  filteredContacts: Contact[]
  contactRequests: ContactRequest[]
  recentActivity: RecentActivity[]
  filters: ContactFilters
  sortBy: ContactSortBy
  sortOrder: ContactSortOrder
  isLoading: boolean
  error: string | null
}

// Utility Types

export interface ContactStatistics {
  totalContacts: number
  onlineContacts: number
  pendingRequests: number
  blockedContacts: number
  favoriteContacts: number
  groupCounts: Record<ContactGroup, number>
}
