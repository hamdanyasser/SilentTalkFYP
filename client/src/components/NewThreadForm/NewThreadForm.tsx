/**
 * New Thread Form Component
 *
 * Form for creating a new forum thread with title, content, and tags.
 */

import React, { useState, useEffect } from 'react'
import { ForumTag, CreateThreadRequest } from '../../types/forum'
import { createThread, getTags } from '../../services/forumService'
import { validateThreadTitle, validatePostContent } from '../../utils/contentFilter'
import { Button, Stack } from '../../design-system'
import { RichTextEditor } from '../RichTextEditor'
import './NewThreadForm.css'

export interface NewThreadFormProps {
  onSuccess?: (threadId: string) => void
  onCancel?: () => void
  className?: string
}

export const NewThreadForm: React.FC<NewThreadFormProps> = ({
  onSuccess,
  onCancel,
  className = '',
}) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<ForumTag[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; content?: string; tags?: string }>({})
  const [loading, setLoading] = useState(true)

  // Load available tags
  useEffect(() => {
    const loadTags = async () => {
      setLoading(true)
      try {
        const response = await getTags({})
        if (response.success) {
          setAvailableTags(response.tags)
        }
      } catch (err) {
        console.error('Load tags error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTags()
  }, [])

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { title?: string; content?: string; tags?: string } = {}

    // Validate title
    const titleValidation = validateThreadTitle(title)
    if (!titleValidation.isValid) {
      newErrors.title = titleValidation.errors[0]
    }

    // Validate content
    const contentValidation = validatePostContent(content)
    if (!contentValidation.isValid) {
      newErrors.content = contentValidation.errors[0]
    }

    // Validate tags
    if (selectedTags.length === 0) {
      newErrors.tags = 'Please select at least one tag'
    } else if (selectedTags.length > 5) {
      newErrors.tags = 'Please select no more than 5 tags'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const request: CreateThreadRequest = {
        title,
        content,
        tags: selectedTags,
      }

      const response = await createThread(request)

      if (response.success && response.thread) {
        onSuccess?.(response.thread.id)
      } else {
        alert(response.message || 'Failed to create thread')
      }
    } catch (err) {
      console.error('Create thread error:', err)
      alert('An error occurred while creating the thread')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle tag toggle
  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
    }
    // Clear tags error when user selects a tag
    if (errors.tags) {
      setErrors({ ...errors, tags: undefined })
    }
  }

  if (loading) {
    return (
      <div className={`new-thread-form ${className}`}>
        <div className="new-thread-form__loading">Loading form...</div>
      </div>
    )
  }

  return (
    <form className={`new-thread-form ${className}`} onSubmit={handleSubmit}>
      <h2 className="new-thread-form__title">Create New Thread</h2>

      {/* Title Field */}
      <div className="new-thread-form__field">
        <label htmlFor="thread-title" className="new-thread-form__label">
          Title <span className="new-thread-form__required">*</span>
        </label>
        <input
          id="thread-title"
          type="text"
          className={`new-thread-form__input ${errors.title ? 'error' : ''}`}
          value={title}
          onChange={e => {
            setTitle(e.target.value)
            if (errors.title) setErrors({ ...errors, title: undefined })
          }}
          placeholder="Enter a descriptive title for your thread"
          disabled={submitting}
          maxLength={200}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <div id="title-error" className="new-thread-form__error" role="alert">
            {errors.title}
          </div>
        )}
        <div className="new-thread-form__hint">{title.length}/200 characters</div>
      </div>

      {/* Tags Field */}
      <div className="new-thread-form__field">
        <div className="new-thread-form__label" id="tags-label">
          Tags <span className="new-thread-form__required">*</span>
        </div>
        <div className="new-thread-form__tags" role="group" aria-labelledby="tags-label">
          {availableTags.map(tag => (
            <button
              key={tag.id}
              type="button"
              className={`new-thread-form__tag ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
              onClick={() => toggleTag(tag.id)}
              disabled={submitting}
              style={tag.color ? { borderColor: tag.color } : undefined}
              aria-pressed={selectedTags.includes(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
        {errors.tags && (
          <div className="new-thread-form__error" role="alert">
            {errors.tags}
          </div>
        )}
        <div className="new-thread-form__hint">{selectedTags.length}/5 tags selected</div>
      </div>

      {/* Content Field */}
      <div className="new-thread-form__field">
        <label htmlFor="thread-content" className="new-thread-form__label">
          Content <span className="new-thread-form__required">*</span>
        </label>
        <RichTextEditor
          value={content}
          onChange={value => {
            setContent(value)
            if (errors.content) setErrors({ ...errors, content: undefined })
          }}
          placeholder="Write your thread content here... You can use formatting tools above."
          minHeight={300}
          disabled={submitting}
        />
        {errors.content && (
          <div className="new-thread-form__error" role="alert">
            {errors.content}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="new-thread-form__actions">
        <Stack gap={2} direction="horizontal">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Creating Thread...' : 'Create Thread'}
          </Button>
        </Stack>
      </div>
    </form>
  )
}

export default NewThreadForm
