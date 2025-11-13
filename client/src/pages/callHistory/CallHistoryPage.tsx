/**
 * Call History Page
 *
 * Displays past calls with filtering, search, and detailed information.
 * Shows call duration, quality, features used, and allows viewing call logs.
 */

import React, { useState, useEffect } from 'react'
import { Button, Input } from '../../design-system'
import { NetworkIndicator } from '../../components/NetworkIndicator'
import { CallHistoryEntry } from '../../types/call'
import * as callHistoryService from '../../services/callHistoryService'
import './CallHistoryPage.css'

type FilterType = 'all' | 'video' | 'audio' | 'missed'

export const CallHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<CallHistoryEntry[]>([])
  const [filteredHistory, setFilteredHistory] = useState<CallHistoryEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [statistics, setStatistics] = useState({
    totalCalls: 0,
    totalDuration: 0,
    videoCallCount: 0,
    audioCallCount: 0,
    averageDuration: 0,
    missedCallCount: 0,
  })

  // Load call history
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true)
      const response = await callHistoryService.getCallHistory({ limit: 100 })
      if (response.success) {
        setHistory(response.entries)
        setFilteredHistory(response.entries)
      }
      setIsLoading(false)
    }

    const loadStatistics = async () => {
      const stats = await callHistoryService.getCallStatistics()
      setStatistics(stats)
    }

    loadHistory()
    loadStatistics()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...history]

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(entry => entry.contactName.toLowerCase().includes(query))
    }

    // Apply type filter
    if (filterType !== 'all') {
      if (filterType === 'missed') {
        filtered = filtered.filter(entry => entry.status === 'missed')
      } else {
        filtered = filtered.filter(entry => entry.callType === filterType)
      }
    }

    setFilteredHistory(filtered)
  }, [history, searchQuery, filterType])

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const formatDate = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear all call history?')) {
      await callHistoryService.clearCallHistory()
      setHistory([])
      setFilteredHistory([])
    }
  }

  const renderCallEntry = (entry: CallHistoryEntry) => {
    const statusIcon = {
      completed: entry.direction === 'outgoing' ? '📞' : '📲',
      missed: '📵',
      declined: '❌',
      failed: '⚠️',
    }[entry.status]

    return (
      <div key={entry.id} className="call-entry">
        <div className="call-entry__icon" aria-hidden="true">
          {entry.callType === 'video' ? '📹' : '🎤'}
        </div>

        <div className="call-entry__info">
          <div className="call-entry__name">{entry.contactName}</div>
          <div className="call-entry__details">
            <span className="call-entry__status" aria-label={entry.status}>
              {statusIcon}
            </span>
            <span className="call-entry__direction">{entry.direction}</span>
            <span className="call-entry__separator">•</span>
            <span className="call-entry__time">{formatTime(entry.startTime)}</span>
            {entry.duration > 0 && (
              <>
                <span className="call-entry__separator">•</span>
                <span className="call-entry__duration">{formatDuration(entry.duration)}</span>
              </>
            )}
          </div>
          <div className="call-entry__features">
            {entry.hadScreenShare && (
              <span className="call-entry__feature" title="Screen sharing was used">
                🖥️
              </span>
            )}
            {entry.hadRecording && (
              <span className="call-entry__feature" title="Call was recorded">
                🎥
              </span>
            )}
            <NetworkIndicator quality={entry.quality} size="sm" />
          </div>
        </div>

        <div className="call-entry__date">{formatDate(entry.startTime)}</div>
      </div>
    )
  }

  const renderEmptyState = () => (
    <div className="call-history__empty">
      <div className="call-history__empty-icon" aria-hidden="true">
        📞
      </div>
      <h3>No Calls Yet</h3>
      <p>Your call history will appear here once you make or receive calls.</p>
    </div>
  )

  return (
    <div className="call-history-page">
      <div className="call-history-page__header">
        <h1 className="call-history-page__title">Call History</h1>
        <p className="call-history-page__subtitle">View your past calls and call statistics</p>
      </div>

      {/* Statistics */}
      <div className="call-history-page__stats">
        <div className="stat-card">
          <div className="stat-card__value">{statistics.totalCalls}</div>
          <div className="stat-card__label">Total Calls</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{formatDuration(statistics.totalDuration)}</div>
          <div className="stat-card__label">Total Duration</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value stat-card__value--primary">
            {statistics.videoCallCount}
          </div>
          <div className="stat-card__label">Video Calls</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value stat-card__value--warning">
            {statistics.missedCallCount}
          </div>
          <div className="stat-card__label">Missed</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="call-history-page__controls">
        <Input
          type="search"
          placeholder="Search calls..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Search call history"
        />

        <div className="call-history-page__filters">
          {(['all', 'video', 'audio', 'missed'] as FilterType[]).map(type => (
            <button
              key={type}
              type="button"
              className={`filter-button ${filterType === type ? 'filter-button--active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearHistory}>
            Clear History
          </Button>
        )}
      </div>

      {/* Call List */}
      <div className="call-history-page__content">
        {isLoading ? (
          <div className="call-history__loading">Loading call history...</div>
        ) : filteredHistory.length === 0 ? (
          history.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="call-history__empty">
              <p>No calls match your search or filters</p>
            </div>
          )
        ) : (
          <div className="call-history__list">
            {filteredHistory.map(entry => renderCallEntry(entry))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CallHistoryPage
