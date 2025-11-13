/**
 * Contacts Context Provider
 *
 * Manages global contacts state, integrates with presence service,
 * and provides CRUD operations for contacts.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  Contact,
  ContactRequest,
  RecentActivity,
  ContactStatistics,
  PresenceUpdate,
  AddContactRequest,
  UpdateContactRequest,
  SearchContactsRequest,
} from '../types/contacts'
import * as contactsService from '../services/contactsService'
import { presenceService } from '../services/presenceService'

interface ContactsContextValue {
  // State
  contacts: Contact[]
  contactRequests: ContactRequest[]
  recentActivity: RecentActivity[]
  statistics: ContactStatistics | null
  isLoading: boolean
  error: string | null

  // CRUD Operations
  loadContacts: () => Promise<void>
  loadContactRequests: () => Promise<void>
  loadRecentActivity: () => Promise<void>
  loadStatistics: () => Promise<void>
  addContact: (data: AddContactRequest) => Promise<boolean>
  respondToContactRequest: (requestId: string, accept: boolean) => Promise<boolean>
  updateContact: (contactId: string, updates: UpdateContactRequest) => Promise<boolean>
  blockContact: (contactId: string) => Promise<boolean>
  unblockContact: (contactId: string) => Promise<boolean>
  deleteContact: (contactId: string) => Promise<boolean>
  searchContacts: (data: SearchContactsRequest) => Promise<Contact[]>
  canInitiateCall: (contactId: string) => Promise<{ allowed: boolean; reason?: string }>

  // Presence
  updatePresence: (status: import('../types/auth').UserStatus) => Promise<void>
  isPresenceConnected: boolean
}

const ContactsContext = createContext<ContactsContextValue | undefined>(undefined)

export const useContacts = () => {
  const context = useContext(ContactsContext)
  if (!context) {
    throw new Error('useContacts must be used within ContactsProvider')
  }
  return context
}

interface ContactsProviderProps {
  children: React.ReactNode
}

export const ContactsProvider: React.FC<ContactsProviderProps> = ({ children }) => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [statistics, setStatistics] = useState<ContactStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPresenceConnected, setIsPresenceConnected] = useState(false)

  // Load contacts
  const loadContacts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await contactsService.getContacts()
      if (response.success) {
        setContacts(response.contacts)
      } else {
        setError('Failed to load contacts')
      }
    } catch (err) {
      setError('An error occurred while loading contacts')
      console.error('Load contacts error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load contact requests
  const loadContactRequests = useCallback(async () => {
    try {
      const response = await contactsService.getContactRequests()
      if (response.success) {
        setContactRequests(response.requests)
      }
    } catch (err) {
      console.error('Load contact requests error:', err)
    }
  }, [])

  // Load recent activity
  const loadRecentActivity = useCallback(async () => {
    try {
      const response = await contactsService.getRecentActivity()
      if (response.success) {
        setRecentActivity(response.activities)
      }
    } catch (err) {
      console.error('Load recent activity error:', err)
    }
  }, [])

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const stats = await contactsService.getContactStatistics()
      setStatistics(stats)
    } catch (err) {
      console.error('Load statistics error:', err)
    }
  }, [])

  // Add contact
  const addContact = useCallback(
    async (data: AddContactRequest): Promise<boolean> => {
      try {
        const response = await contactsService.addContact(data)
        if (response.success) {
          await loadContactRequests()
          return true
        }
        setError(response.message)
        return false
      } catch (err) {
        setError('Failed to add contact')
        console.error('Add contact error:', err)
        return false
      }
    },
    [loadContactRequests],
  )

  // Respond to contact request
  const respondToContactRequest = useCallback(
    async (requestId: string, accept: boolean): Promise<boolean> => {
      try {
        const response = await contactsService.respondToContactRequest({
          requestId,
          accept,
        })

        if (response.success) {
          await Promise.all([loadContacts(), loadContactRequests()])
          return true
        }
        setError(response.message)
        return false
      } catch (err) {
        setError('Failed to respond to contact request')
        console.error('Respond to contact request error:', err)
        return false
      }
    },
    [loadContacts, loadContactRequests],
  )

  // Update contact
  const updateContact = useCallback(
    async (contactId: string, updates: UpdateContactRequest): Promise<boolean> => {
      try {
        const response = await contactsService.updateContact({ contactId, ...updates })
        if (response.success) {
          // Update local state
          setContacts(prev => prev.map(c => (c.id === contactId ? { ...c, ...updates } : c)))
          return true
        }
        setError(response.message)
        return false
      } catch (err) {
        setError('Failed to update contact')
        console.error('Update contact error:', err)
        return false
      }
    },
    [],
  )

  // Block contact
  const blockContact = useCallback(
    async (contactId: string): Promise<boolean> => {
      try {
        const response = await contactsService.blockContact({ contactId })
        if (response.success) {
          await loadContacts()
          return true
        }
        setError(response.message)
        return false
      } catch (err) {
        setError('Failed to block contact')
        console.error('Block contact error:', err)
        return false
      }
    },
    [loadContacts],
  )

  // Unblock contact
  const unblockContact = useCallback(
    async (contactId: string): Promise<boolean> => {
      try {
        const response = await contactsService.unblockContact({ contactId })
        if (response.success) {
          await loadContacts()
          return true
        }
        setError(response.message)
        return false
      } catch (err) {
        setError('Failed to unblock contact')
        console.error('Unblock contact error:', err)
        return false
      }
    },
    [loadContacts],
  )

  // Delete contact
  const deleteContact = useCallback(async (contactId: string): Promise<boolean> => {
    try {
      const response = await contactsService.deleteContact({ contactId })
      if (response.success) {
        setContacts(prev => prev.filter(c => c.id !== contactId))
        return true
      }
      setError(response.message)
      return false
    } catch (err) {
      setError('Failed to delete contact')
      console.error('Delete contact error:', err)
      return false
    }
  }, [])

  // Search contacts
  const searchContacts = useCallback(async (data: SearchContactsRequest): Promise<Contact[]> => {
    try {
      const response = await contactsService.searchContacts(data)
      if (response.success) {
        return response.contacts
      }
      return []
    } catch (err) {
      console.error('Search contacts error:', err)
      return []
    }
  }, [])

  // Can initiate call
  const canInitiateCall = useCallback(
    async (contactId: string): Promise<{ allowed: boolean; reason?: string }> => {
      return await contactsService.canInitiateCall(contactId)
    },
    [],
  )

  // Update presence
  const updatePresence = useCallback(
    async (status: import('../types/auth').UserStatus) => {
      if (isPresenceConnected) {
        await presenceService.updatePresence(status)
      }
    },
    [isPresenceConnected],
  )

  // Initialize presence service
  useEffect(() => {
    const initializePresence = async () => {
      try {
        await presenceService.connect()
        setIsPresenceConnected(true)

        // Set up presence update listener
        const unsubscribe = presenceService.onPresenceUpdate((update: PresenceUpdate) => {
          setContacts(prev =>
            prev.map(contact =>
              contact.userId === update.userId
                ? {
                    ...contact,
                    presenceStatus: update.status,
                    lastSeen: update.lastSeen,
                    isOnline: update.isOnline,
                  }
                : contact,
            ),
          )
        })

        // Subscribe to all contacts
        const contactIds = contacts.map(c => c.userId)
        if (contactIds.length > 0) {
          await presenceService.subscribeToContacts(contactIds)
        }

        return () => {
          unsubscribe()
          presenceService.disconnect()
        }
      } catch (err) {
        console.error('Failed to initialize presence service:', err)
        setIsPresenceConnected(false)
      }
    }

    initializePresence()
  }, [])

  // Subscribe to new contacts
  useEffect(() => {
    if (!isPresenceConnected) return

    const newContactIds = contacts.map(c => c.userId)
    if (newContactIds.length > 0) {
      presenceService.subscribeToContacts(newContactIds).catch(err => {
        console.error('Failed to subscribe to contacts:', err)
      })
    }
  }, [contacts, isPresenceConnected])

  // Initial data load
  useEffect(() => {
    loadContacts()
    loadContactRequests()
    loadRecentActivity()
    loadStatistics()
  }, [loadContacts, loadContactRequests, loadRecentActivity, loadStatistics])

  const value: ContactsContextValue = {
    contacts,
    contactRequests,
    recentActivity,
    statistics,
    isLoading,
    error,
    loadContacts,
    loadContactRequests,
    loadRecentActivity,
    loadStatistics,
    addContact,
    respondToContactRequest,
    updateContact,
    blockContact,
    unblockContact,
    deleteContact,
    searchContacts,
    canInitiateCall,
    updatePresence,
    isPresenceConnected,
  }

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>
}

export default ContactsProvider
