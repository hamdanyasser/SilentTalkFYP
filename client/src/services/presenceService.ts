/**
 * Presence Service with SignalR Integration
 *
 * Handles real-time presence updates for contacts using SignalR.
 * Provides connection management, presence updates, and contact subscriptions.
 */

import * as signalR from '@microsoft/signalr'
import { PresenceUpdate, UserStatus } from '../types/contacts'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

type PresenceCallback = (update: PresenceUpdate) => void
type ContactAddedCallback = (contact: unknown) => void
type ContactRemovedCallback = (contactId: string) => void
type ContactUpdatedCallback = (contact: unknown) => void
type ContactBlockedCallback = (contactId: string) => void
type ContactUnblockedCallback = (contactId: string) => void

export class PresenceService {
  private connection: signalR.HubConnection | null = null
  private presenceListeners: Set<PresenceCallback> = new Set()
  private contactAddedListeners: Set<ContactAddedCallback> = new Set()
  private contactRemovedListeners: Set<ContactRemovedCallback> = new Set()
  private contactUpdatedListeners: Set<ContactUpdatedCallback> = new Set()
  private contactBlockedListeners: Set<ContactBlockedCallback> = new Set()
  private contactUnblockedListeners: Set<ContactUnblockedCallback> = new Set()
  private subscribedContacts: Set<string> = new Set()
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  /**
   * Initialize and connect to SignalR hub
   */
  async connect(): Promise<void> {
    if (this.connection && this.isConnected) {
      console.warn('Presence service already connected')
      return
    }

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/hubs/presence`, {
          accessTokenFactory: () => this.getAccessToken(),
          withCredentials: true,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
              return null // Stop reconnecting
            }
            // Exponential backoff: 0s, 2s, 10s, 30s, 60s
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 60000)
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build()

      // Register event handlers
      this.registerEventHandlers()

      // Register reconnection handlers
      this.connection.onreconnecting(error => {
        console.warn('Presence connection lost, reconnecting...', error)
        this.isConnected = false
      })

      this.connection.onreconnected(connectionId => {
        console.log('Presence connection reestablished', connectionId)
        this.isConnected = true
        this.reconnectAttempts = 0
        // Resubscribe to all contacts
        this.resubscribeAll()
      })

      this.connection.onclose(error => {
        console.error('Presence connection closed', error)
        this.isConnected = false
        this.handleConnectionClosed(error)
      })

      // Start connection
      await this.connection.start()
      this.isConnected = true
      this.reconnectAttempts = 0
      console.log('Presence service connected successfully')
    } catch (error) {
      console.error('Failed to connect to presence service:', error)
      this.isConnected = false
      throw error
    }
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop()
        this.isConnected = false
        console.log('Presence service disconnected')
      } catch (error) {
        console.error('Error disconnecting from presence service:', error)
      }
    }
  }

  /**
   * Register SignalR event handlers
   */
  private registerEventHandlers(): void {
    if (!this.connection) return

    // Presence updates
    this.connection.on('PresenceUpdate', (update: PresenceUpdate) => {
      console.log('Presence update received:', update)
      this.presenceListeners.forEach(listener => {
        try {
          listener(update)
        } catch (error) {
          console.error('Error in presence listener:', error)
        }
      })
    })

    // Contact added
    this.connection.on('ContactAdded', (contact: unknown) => {
      console.log('Contact added:', contact)
      this.contactAddedListeners.forEach(listener => {
        try {
          listener(contact)
        } catch (error) {
          console.error('Error in contact added listener:', error)
        }
      })
    })

    // Contact removed
    this.connection.on('ContactRemoved', (contactId: string) => {
      console.log('Contact removed:', contactId)
      this.contactRemovedListeners.forEach(listener => {
        try {
          listener(contactId)
        } catch (error) {
          console.error('Error in contact removed listener:', error)
        }
      })
    })

    // Contact updated
    this.connection.on('ContactUpdated', (contact: unknown) => {
      console.log('Contact updated:', contact)
      this.contactUpdatedListeners.forEach(listener => {
        try {
          listener(contact)
        } catch (error) {
          console.error('Error in contact updated listener:', error)
        }
      })
    })

    // Contact blocked
    this.connection.on('ContactBlocked', (contactId: string) => {
      console.log('Contact blocked:', contactId)
      this.contactBlockedListeners.forEach(listener => {
        try {
          listener(contactId)
        } catch (error) {
          console.error('Error in contact blocked listener:', error)
        }
      })
    })

    // Contact unblocked
    this.connection.on('ContactUnblocked', (contactId: string) => {
      console.log('Contact unblocked:', contactId)
      this.contactUnblockedListeners.forEach(listener => {
        try {
          listener(contactId)
        } catch (error) {
          console.error('Error in contact unblocked listener:', error)
        }
      })
    })
  }

  /**
   * Update current user's presence status
   */
  async updatePresence(status: UserStatus): Promise<void> {
    if (!this.isConnected || !this.connection) {
      throw new Error('Presence service not connected')
    }

    try {
      await this.connection.invoke('UpdatePresence', status)
      console.log('Presence updated to:', status)
    } catch (error) {
      console.error('Failed to update presence:', error)
      throw error
    }
  }

  /**
   * Subscribe to presence updates for a specific contact
   */
  async subscribeToContact(contactId: string): Promise<void> {
    if (!this.isConnected || !this.connection) {
      console.warn('Cannot subscribe: Presence service not connected')
      return
    }

    if (this.subscribedContacts.has(contactId)) {
      console.log('Already subscribed to contact:', contactId)
      return
    }

    try {
      await this.connection.invoke('SubscribeToContact', contactId)
      this.subscribedContacts.add(contactId)
      console.log('Subscribed to contact:', contactId)
    } catch (error) {
      console.error('Failed to subscribe to contact:', error)
      throw error
    }
  }

  /**
   * Unsubscribe from presence updates for a specific contact
   */
  async unsubscribeFromContact(contactId: string): Promise<void> {
    if (!this.isConnected || !this.connection) {
      console.warn('Cannot unsubscribe: Presence service not connected')
      return
    }

    if (!this.subscribedContacts.has(contactId)) {
      console.log('Not subscribed to contact:', contactId)
      return
    }

    try {
      await this.connection.invoke('UnsubscribeFromContact', contactId)
      this.subscribedContacts.delete(contactId)
      console.log('Unsubscribed from contact:', contactId)
    } catch (error) {
      console.error('Failed to unsubscribe from contact:', error)
      throw error
    }
  }

  /**
   * Subscribe to multiple contacts at once
   */
  async subscribeToContacts(contactIds: string[]): Promise<void> {
    const subscribePromises = contactIds.map(id => this.subscribeToContact(id))
    await Promise.all(subscribePromises)
  }

  /**
   * Unsubscribe from all contacts
   */
  async unsubscribeFromAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.subscribedContacts).map(id =>
      this.unsubscribeFromContact(id),
    )
    await Promise.all(unsubscribePromises)
  }

  /**
   * Resubscribe to all previously subscribed contacts (after reconnection)
   */
  private async resubscribeAll(): Promise<void> {
    if (this.subscribedContacts.size === 0) return

    console.log('Resubscribing to all contacts...')
    const contactIds = Array.from(this.subscribedContacts)
    this.subscribedContacts.clear() // Clear to allow resubscription

    try {
      await this.subscribeToContacts(contactIds)
      console.log('Resubscribed to all contacts successfully')
    } catch (error) {
      console.error('Failed to resubscribe to contacts:', error)
    }
  }

  /**
   * Handle connection closed event
   */
  private handleConnectionClosed(error: Error | undefined): void {
    if (error) {
      console.error('Connection closed with error:', error)
    }

    this.reconnectAttempts++

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Please refresh the page.')
      // TODO: Show user notification about connection loss
    }
  }

  /**
   * Get access token for authentication
   */
  private getAccessToken(): string {
    // TODO: Replace with actual token retrieval from auth context
    return localStorage.getItem('accessToken') || ''
  }

  /**
   * Add listener for presence updates
   */
  onPresenceUpdate(callback: PresenceCallback): () => void {
    this.presenceListeners.add(callback)
    // Return cleanup function
    return () => {
      this.presenceListeners.delete(callback)
    }
  }

  /**
   * Add listener for contact added events
   */
  onContactAdded(callback: ContactAddedCallback): () => void {
    this.contactAddedListeners.add(callback)
    return () => {
      this.contactAddedListeners.delete(callback)
    }
  }

  /**
   * Add listener for contact removed events
   */
  onContactRemoved(callback: ContactRemovedCallback): () => void {
    this.contactRemovedListeners.add(callback)
    return () => {
      this.contactRemovedListeners.delete(callback)
    }
  }

  /**
   * Add listener for contact updated events
   */
  onContactUpdated(callback: ContactUpdatedCallback): () => void {
    this.contactUpdatedListeners.add(callback)
    return () => {
      this.contactUpdatedListeners.delete(callback)
    }
  }

  /**
   * Add listener for contact blocked events
   */
  onContactBlocked(callback: ContactBlockedCallback): () => void {
    this.contactBlockedListeners.add(callback)
    return () => {
      this.contactBlockedListeners.delete(callback)
    }
  }

  /**
   * Add listener for contact unblocked events
   */
  onContactUnblocked(callback: ContactUnblockedCallback): () => void {
    this.contactUnblockedListeners.add(callback)
    return () => {
      this.contactUnblockedListeners.delete(callback)
    }
  }

  /**
   * Check if service is connected
   */
  get connected(): boolean {
    return this.isConnected
  }

  /**
   * Get connection state
   */
  get state(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected
  }
}

// Export singleton instance
export const presenceService = new PresenceService()
