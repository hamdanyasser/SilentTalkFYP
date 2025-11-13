/**
 * Content Filtering Utilities
 *
 * Provides content moderation, profanity filtering, and HTML sanitization
 * for forum posts and user-generated content.
 */

import { ContentFilter, FilteredContent } from '../types/forum'

// Default banned words (basic profanity filter)
const DEFAULT_BANNED_WORDS = [
  // Add your banned words here
  'spam',
  'scam',
]

// Default banned patterns (regex patterns for common abuse)
const DEFAULT_BANNED_PATTERNS = [
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  /https?:\/\/[^\s]+/g, // URLs (can be relaxed if needed)
]

// Allowed HTML tags for rich text
const DEFAULT_ALLOWED_HTML_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
]

export const DEFAULT_CONTENT_FILTER: ContentFilter = {
  bannedWords: DEFAULT_BANNED_WORDS,
  bannedPatterns: DEFAULT_BANNED_PATTERNS,
  maxLength: 50000,
  allowHtml: true,
  allowedHtmlTags: DEFAULT_ALLOWED_HTML_TAGS,
}

/**
 * Filter content for profanity and inappropriate content
 */
export function filterContent(
  content: string,
  filter: ContentFilter = DEFAULT_CONTENT_FILTER,
): FilteredContent {
  let filtered = content
  const violations: string[] = []
  let modified = false

  // Check length
  if (filtered.length > filter.maxLength) {
    violations.push(`Content exceeds maximum length of ${filter.maxLength} characters`)
  }

  // Check for banned words
  filter.bannedWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    if (regex.test(filtered)) {
      violations.push(`Contains banned word: ${word}`)
      filtered = filtered.replace(regex, '*'.repeat(word.length))
      modified = true
    }
  })

  // Check for banned patterns
  filter.bannedPatterns.forEach((pattern, index) => {
    if (pattern.test(filtered)) {
      violations.push(`Contains banned pattern #${index + 1}`)
      filtered = filtered.replace(pattern, '[REMOVED]')
      modified = true
    }
  })

  // Sanitize HTML if not allowed
  if (!filter.allowHtml) {
    filtered = stripHtml(filtered)
    if (filtered !== content) {
      modified = true
      violations.push('HTML tags removed')
    }
  } else if (filter.allowedHtmlTags.length > 0) {
    const sanitized = sanitizeHtml(filtered, filter.allowedHtmlTags)
    if (sanitized !== filtered) {
      filtered = sanitized
      modified = true
      violations.push('Disallowed HTML tags removed')
    }
  }

  return {
    content: filtered,
    isClean: violations.length === 0,
    violations,
    modified,
  }
}

/**
 * Strip all HTML tags from content
 */
export function stripHtml(content: string): string {
  return content.replace(/<[^>]*>/g, '')
}

/**
 * Sanitize HTML to only allow specific tags
 */
export function sanitizeHtml(content: string, allowedTags: string[]): string {
  // Create regex to match allowed tags
  const allowedTagsLower = allowedTags.map(tag => tag.toLowerCase())

  // Remove all tags except allowed ones
  return content.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    if (allowedTagsLower.includes(tag.toLowerCase())) {
      // Keep allowed tags but strip attributes for safety
      if (match.startsWith('</')) {
        return `</${tag}>`
      }
      // Special handling for <a> tags to preserve href
      if (tag.toLowerCase() === 'a') {
        const hrefMatch = match.match(/href=["']([^"']*)["']/i)
        if (hrefMatch) {
          const href = hrefMatch[1]
          // Only allow http/https URLs
          if (href.startsWith('http://') || href.startsWith('https://')) {
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">`
          }
        }
      }
      return `<${tag}>`
    }
    return ''
  })
}

/**
 * Check if content contains spam indicators
 */
export function isSpam(content: string): boolean {
  const spamIndicators = [
    /\b(buy now|click here|limited time|act now)\b/gi,
    /\b(viagra|cialis|pharmacy)\b/gi,
    /\b(casino|lottery|jackpot)\b/gi,
    /(\$\$\$|!!!+|FREE)/g,
    /(.)\1{10,}/, // Repeated characters
  ]

  return spamIndicators.some(pattern => pattern.test(content))
}

/**
 * Calculate content quality score (0-100)
 */
export function calculateContentQuality(content: string): number {
  let score = 100

  // Penalize very short content
  if (content.length < 20) {
    score -= 30
  } else if (content.length < 50) {
    score -= 15
  }

  // Penalize excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
  if (capsRatio > 0.5) {
    score -= 20
  } else if (capsRatio > 0.3) {
    score -= 10
  }

  // Penalize excessive punctuation
  const punctuationRatio = (content.match(/[!?]{2,}/g) || []).length / content.length
  if (punctuationRatio > 0.1) {
    score -= 15
  }

  // Check for spam indicators
  if (isSpam(content)) {
    score -= 40
  }

  // Penalize repeated words
  const words = content.toLowerCase().split(/\s+/)
  const uniqueWords = new Set(words)
  const repetitionRatio = 1 - uniqueWords.size / words.length
  if (repetitionRatio > 0.5) {
    score -= 20
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Validate thread title
 */
export function validateThreadTitle(title: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!title || title.trim().length === 0) {
    errors.push('Title is required')
  } else {
    if (title.length < 10) {
      errors.push('Title must be at least 10 characters')
    }
    if (title.length > 200) {
      errors.push('Title must be less than 200 characters')
    }
    if (title === title.toUpperCase() && title.length > 20) {
      errors.push('Title should not be all caps')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate post content
 */
export function validatePostContent(content: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!content || content.trim().length === 0) {
    errors.push('Content is required')
  } else {
    if (stripHtml(content).length < 10) {
      errors.push('Content must be at least 10 characters')
    }
    if (content.length > 50000) {
      errors.push('Content must be less than 50,000 characters')
    }

    const qualityScore = calculateContentQuality(stripHtml(content))
    if (qualityScore < 20) {
      errors.push('Content quality is too low')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Extract mentions from content (@username)
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1])
  }

  return [...new Set(mentions)] // Remove duplicates
}

/**
 * Extract hashtags from content (#tag)
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9_-]+)/g
  const hashtags: string[] = []
  let match

  while ((match = hashtagRegex.exec(content)) !== null) {
    hashtags.push(match[1])
  }

  return [...new Set(hashtags)] // Remove duplicates
}
