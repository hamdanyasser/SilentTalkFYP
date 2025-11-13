/**
 * Contacts Page
 *
 * Main page for viewing and managing contacts.
 * Includes contact list, requests, recent activity, and statistics.
 */

import React, { useState } from 'react'
import { useContacts } from '../../contexts/ContactsContext'
import { ContactList } from '../../components/ContactList'
import { AddContactDialog } from '../../components/AddContactDialog'
import { Button, Stack } from '../../design-system'
import { Contact, RecentActivity } from '../../types/contacts'
import './ContactsPage.css'

type TabType = 'all' | 'requests' | 'activity'

export const ContactsPage: React.FC = () => {
  const {
    contacts,
    contactRequests,
    recentActivity,
    statistics,
    isLoading,
    error,
    addContact,
    respondToContactRequest,
    updateContact,
    blockContact,
    unblockContact,
    deleteContact,
    canInitiateCall,
  } = useContacts()

  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleCallContact = async (contact: Contact) => {
    const permission = await canInitiateCall(contact.id)
    if (!permission.allowed) {
      alert(permission.reason || 'Cannot call this contact')
      return
    }
    // TODO: Initiate call
    console.log('Initiating call with:', contact.username)
  }

  const handleMessageContact = (contact: Contact) => {
    // TODO: Navigate to messages
    console.log('Opening messages with:', contact.username)
  }

  const handleBlockContact = async (contact: Contact) => {
    if (confirm(`Are you sure you want to block ${contact.username}?`)) {
      await blockContact(contact.id)
    }
  }

  const handleUnblockContact = async (contact: Contact) => {
    await unblockContact(contact.id)
  }

  const handleDeleteContact = async (contact: Contact) => {
    if (confirm(`Are you sure you want to delete ${contact.username} from your contacts?`)) {
      await deleteContact(contact.id)
    }
  }

  const handleUpdateContact = async (contact: Contact, updates: Partial<Contact>) => {
    await updateContact(contact.id, updates)
  }

  const formatActivityTime = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const renderActivityItem = (activity: RecentActivity) => {
    return (
      <div key={activity.id} className="activity-item">
        <div className="activity-item__icon">
          {activity.type === 'call' && '📞'}
          {activity.type === 'message' && '💬'}
          {activity.type === 'status_change' && '🟢'}
          {activity.type === 'added' && '➕'}
        </div>
        <div className="activity-item__content">
          <div className="activity-item__description">
            <strong>@{activity.contactUsername}</strong> {activity.description}
          </div>
          <div className="activity-item__time">{formatActivityTime(activity.timestamp)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="contacts-page">
      <div className="contacts-page__header">
        <div>
          <h1 className="contacts-page__title">Contacts</h1>
          <p className="contacts-page__subtitle">
            Manage your contacts and stay connected with the community
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsAddDialogOpen(true)}>
          ➕ Add Contact
        </Button>
      </div>

      {error && (
        <div className="contacts-page__error" role="alert">
          {error}
        </div>
      )}

      {statistics && (
        <div className="contacts-page__stats">
          <div className="stat-card">
            <div className="stat-card__value">{statistics.totalContacts}</div>
            <div className="stat-card__label">Total Contacts</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value stat-card__value--success">
              {statistics.onlineContacts}
            </div>
            <div className="stat-card__label">Online Now</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value stat-card__value--warning">
              {statistics.pendingRequests}
            </div>
            <div className="stat-card__label">Pending Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value stat-card__value--primary">
              {statistics.favoriteContacts}
            </div>
            <div className="stat-card__label">Favorites</div>
          </div>
        </div>
      )}

      <div className="contacts-page__tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'all' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('all')}
          role="tab"
          aria-selected={activeTab === 'all'}
        >
          All Contacts ({contacts.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'requests' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('requests')}
          role="tab"
          aria-selected={activeTab === 'requests'}
        >
          Requests ({contactRequests.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'activity' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('activity')}
          role="tab"
          aria-selected={activeTab === 'activity'}
        >
          Recent Activity
        </button>
      </div>

      <div className="contacts-page__content">
        {activeTab === 'all' && (
          <ContactList
            contacts={contacts}
            onCallContact={handleCallContact}
            onMessageContact={handleMessageContact}
            onBlockContact={handleBlockContact}
            onUnblockContact={handleUnblockContact}
            onDeleteContact={handleDeleteContact}
            onUpdateContact={handleUpdateContact}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'requests' && (
          <div className="contacts-page__requests">
            {contactRequests.length === 0 ? (
              <div className="empty-state">
                <p>No pending contact requests</p>
              </div>
            ) : (
              <Stack gap={3}>
                {contactRequests.map(request => (
                  <div key={request.id} className="request-card">
                    <div className="request-card__info">
                      <div className="request-card__username">@{request.fromUsername}</div>
                      {request.message && (
                        <div className="request-card__message">{request.message}</div>
                      )}
                      <div className="request-card__time">
                        {formatActivityTime(request.createdAt)}
                      </div>
                    </div>
                    <div className="request-card__actions">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => respondToContactRequest(request.id, true)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => respondToContactRequest(request.id, false)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </Stack>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="contacts-page__activity">
            {recentActivity.length === 0 ? (
              <div className="empty-state">
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="activity-list">
                {recentActivity.map(activity => renderActivityItem(activity))}
              </div>
            )}
          </div>
        )}
      </div>

      <AddContactDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddContact={addContact}
      />
    </div>
  )
}

export default ContactsPage
