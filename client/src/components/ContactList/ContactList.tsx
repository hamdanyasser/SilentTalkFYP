/**
 * Contact List Component
 *
 * Displays contacts with search, filtering, and grouping.
 * Includes presence indicators and action menus.
 */

import React, { useState, useMemo } from 'react'
import { Contact, ContactGroup, ContactSortBy } from '../../types/contacts'
import { PresenceBadge } from '../PresenceBadge'
import { Input, Stack } from '../../design-system'
import './ContactList.css'

export interface ContactListProps {
  contacts: Contact[]
  onContactClick?: (contact: Contact) => void
  onCallContact?: (contact: Contact) => void
  onMessageContact?: (contact: Contact) => void
  onBlockContact?: (contact: Contact) => void
  onUnblockContact?: (contact: Contact) => void
  onDeleteContact?: (contact: Contact) => void
  onUpdateContact?: (contact: Contact, updates: Partial<Contact>) => void
  showSearch?: boolean
  showFilters?: boolean
  isLoading?: boolean
  className?: string
}

const groupLabels: Record<ContactGroup, string> = {
  friends: 'Friends',
  family: 'Family',
  work: 'Work',
  colleagues: 'Colleagues',
  other: 'Other',
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onContactClick,
  onCallContact,
  onMessageContact,
  onBlockContact,
  onUnblockContact,
  onDeleteContact,
  onUpdateContact,
  showSearch = true,
  showFilters = true,
  isLoading = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | 'all'>('all')
  const [filterOnline, setFilterOnline] = useState(false)
  const [filterFavorites, setFilterFavorites] = useState(false)
  const [sortBy, setSortBy] = useState<ContactSortBy>('name')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let filtered = [...contacts]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        contact =>
          contact.username.toLowerCase().includes(query) ||
          contact.email.toLowerCase().includes(query) ||
          contact.firstName?.toLowerCase().includes(query) ||
          contact.lastName?.toLowerCase().includes(query),
      )
    }

    // Group filter
    if (selectedGroup !== 'all') {
      filtered = filtered.filter(contact => contact.group === selectedGroup)
    }

    // Online filter
    if (filterOnline) {
      filtered = filtered.filter(contact => contact.isOnline)
    }

    // Favorites filter
    if (filterFavorites) {
      filtered = filtered.filter(contact => contact.isFavorite)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.username.localeCompare(b.username)
        case 'recent':
          return (b.lastActivityAt?.getTime() || 0) - (a.lastActivityAt?.getTime() || 0)
        case 'status':
          if (a.isOnline === b.isOnline) return 0
          return a.isOnline ? -1 : 1
        case 'group':
          return (a.group || 'other').localeCompare(b.group || 'other')
        default:
          return 0
      }
    })

    return filtered
  }, [contacts, searchQuery, selectedGroup, filterOnline, filterFavorites, sortBy])

  // Group contacts by group
  const groupedContacts = useMemo(() => {
    const groups: Record<ContactGroup | 'ungrouped', Contact[]> = {
      friends: [],
      family: [],
      work: [],
      colleagues: [],
      other: [],
      ungrouped: [],
    }

    filteredContacts.forEach(contact => {
      if (contact.group) {
        groups[contact.group].push(contact)
      } else {
        groups.ungrouped.push(contact)
      }
    })

    return groups
  }, [filteredContacts])

  const handleToggleFavorite = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdateContact?.(contact, { isFavorite: !contact.isFavorite })
  }

  const handleMenuAction = (
    contact: Contact,
    action: 'call' | 'message' | 'block' | 'unblock' | 'delete',
    e: React.MouseEvent,
  ) => {
    e.stopPropagation()
    setOpenMenuId(null)

    switch (action) {
      case 'call':
        onCallContact?.(contact)
        break
      case 'message':
        onMessageContact?.(contact)
        break
      case 'block':
        onBlockContact?.(contact)
        break
      case 'unblock':
        onUnblockContact?.(contact)
        break
      case 'delete':
        onDeleteContact?.(contact)
        break
    }
  }

  const renderContactItem = (contact: Contact) => {
    const displayName =
      contact.firstName && contact.lastName
        ? `${contact.firstName} ${contact.lastName}`
        : contact.username
    const isMenuOpen = openMenuId === contact.id

    return (
      <div
        key={contact.id}
        className="contact-item"
        onClick={() => onContactClick?.(contact)}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onContactClick?.(contact)
          }
        }}
      >
        <div className="contact-item__avatar">
          {contact.avatarUrl ? (
            <img src={contact.avatarUrl} alt="" />
          ) : (
            <div className="contact-item__avatar-placeholder">
              {contact.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="contact-item__presence">
            <PresenceBadge status={contact.presenceStatus} size="sm" />
          </div>
        </div>

        <div className="contact-item__info">
          <div className="contact-item__name">
            {displayName}
            {contact.isFavorite && (
              <span className="contact-item__favorite" aria-label="Favorite contact">
                ⭐
              </span>
            )}
          </div>
          <div className="contact-item__username">@{contact.username}</div>
          {contact.notes && <div className="contact-item__notes">{contact.notes}</div>}
        </div>

        <div className="contact-item__actions">
          <button
            type="button"
            className="contact-item__favorite-btn"
            onClick={e => handleToggleFavorite(contact, e)}
            aria-label={contact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {contact.isFavorite ? '⭐' : '☆'}
          </button>

          <div className="contact-item__menu">
            <button
              type="button"
              className="contact-item__menu-btn"
              onClick={e => {
                e.stopPropagation()
                setOpenMenuId(isMenuOpen ? null : contact.id)
              }}
              aria-label="Contact actions"
              aria-expanded={isMenuOpen}
            >
              •••
            </button>

            {isMenuOpen && (
              <div className="contact-item__menu-dropdown" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={e => handleMenuAction(contact, 'call', e)}
                  disabled={!contact.isOnline}
                >
                  📞 Call
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={e => handleMenuAction(contact, 'message', e)}
                >
                  💬 Message
                </button>
                <div className="contact-item__menu-divider" role="separator" />
                {contact.isBlocked ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={e => handleMenuAction(contact, 'unblock', e)}
                  >
                    🔓 Unblock
                  </button>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={e => handleMenuAction(contact, 'block', e)}
                  >
                    🚫 Block
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  className="contact-item__menu-danger"
                  onClick={e => handleMenuAction(contact, 'delete', e)}
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderGroupSection = (group: ContactGroup | 'ungrouped', contacts: Contact[]) => {
    if (contacts.length === 0) return null

    return (
      <div key={group} className="contact-group">
        <h3 className="contact-group__title">
          {group === 'ungrouped' ? 'Ungrouped' : groupLabels[group]} ({contacts.length})
        </h3>
        <div className="contact-group__list">
          {contacts.map(contact => renderContactItem(contact))}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`contact-list ${className}`}>
        <div className="contact-list__loading">
          <p>Loading contacts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`contact-list ${className}`}>
      {showSearch && (
        <div className="contact-list__search">
          <Input
            type="search"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            fullWidth
            aria-label="Search contacts"
          />
        </div>
      )}

      {showFilters && (
        <div className="contact-list__filters">
          <Stack gap={2} direction="horizontal">
            <select
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value as ContactGroup | 'all')}
              className="contact-list__filter-select"
              aria-label="Filter by group"
            >
              <option value="all">All Groups</option>
              {Object.entries(groupLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as ContactSortBy)}
              className="contact-list__filter-select"
              aria-label="Sort by"
            >
              <option value="name">Sort by Name</option>
              <option value="recent">Sort by Recent</option>
              <option value="status">Sort by Status</option>
              <option value="group">Sort by Group</option>
            </select>

            <label className="contact-list__filter-checkbox">
              <input
                type="checkbox"
                checked={filterOnline}
                onChange={e => setFilterOnline(e.target.checked)}
              />
              Online Only
            </label>

            <label className="contact-list__filter-checkbox">
              <input
                type="checkbox"
                checked={filterFavorites}
                onChange={e => setFilterFavorites(e.target.checked)}
              />
              Favorites
            </label>
          </Stack>
        </div>
      )}

      <div className="contact-list__content">
        {filteredContacts.length === 0 ? (
          <div className="contact-list__empty">
            <p>No contacts found</p>
            {searchQuery && <p>Try adjusting your search or filters</p>}
          </div>
        ) : sortBy === 'group' ? (
          Object.entries(groupedContacts).map(([group, contacts]) =>
            renderGroupSection(group as ContactGroup | 'ungrouped', contacts),
          )
        ) : (
          <div className="contact-list__items">
            {filteredContacts.map(contact => renderContactItem(contact))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ContactList
