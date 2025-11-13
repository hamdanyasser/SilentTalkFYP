/**
 * Content Filter Tests
 *
 * Tests for abuse detection, content filtering, and validation.
 */

import {
  filterContent,
  isSpam,
  calculateContentQuality,
  validateThreadTitle,
  validatePostContent,
  extractMentions,
  extractHashtags,
  sanitizeHtml,
  stripHtml,
  DEFAULT_CONTENT_FILTER,
} from '../contentFilter'

describe('contentFilter - Abuse Case Tests', () => {
  describe('filterContent', () => {
    it('should detect and filter banned words', () => {
      const content = 'This is spam content'
      const result = filterContent(content)

      expect(result.isClean).toBe(false)
      expect(result.violations).toContain('Contains banned word: spam')
      expect(result.content).toBe('This is **** content')
      expect(result.modified).toBe(true)
    })

    it('should detect multiple banned words', () => {
      const content = 'This is spam and scam'
      const result = filterContent(content)

      expect(result.violations.length).toBe(2)
      expect(result.violations).toContain('Contains banned word: spam')
      expect(result.violations).toContain('Contains banned word: scam')
    })

    it('should detect phone numbers', () => {
      const content = 'Call me at 123-456-7890'
      const result = filterContent(content)

      expect(result.isClean).toBe(false)
      expect(result.violations).toContain('Contains banned pattern #1')
      expect(result.content).toContain('[REMOVED]')
      expect(result.modified).toBe(true)
    })

    it('should detect email addresses', () => {
      const content = 'Contact me at test@example.com'
      const result = filterContent(content)

      expect(result.isClean).toBe(false)
      expect(result.violations).toContain('Contains banned pattern #2')
      expect(result.content).toContain('[REMOVED]')
    })

    it('should detect URLs', () => {
      const content = 'Visit https://example.com'
      const result = filterContent(content)

      expect(result.isClean).toBe(false)
      expect(result.violations).toContain('Contains banned pattern #3')
      expect(result.content).toContain('[REMOVED]')
    })

    it('should reject content exceeding max length', () => {
      const longContent = 'a'.repeat(50001)
      const result = filterContent(longContent)

      expect(result.violations).toContain('Content exceeds maximum length of 50000 characters')
    })

    it('should allow clean content', () => {
      const content = 'This is perfectly clean content with no issues.'
      const result = filterContent(content)

      expect(result.isClean).toBe(true)
      expect(result.violations).toHaveLength(0)
      expect(result.modified).toBe(false)
    })

    it('should sanitize HTML when allowHtml is false', () => {
      const content = '<script>alert("xss")</script><p>Hello</p>'
      const filter = { ...DEFAULT_CONTENT_FILTER, allowHtml: false }
      const result = filterContent(content, filter)

      expect(result.content).toBe('alert("xss")Hello')
      expect(result.violations).toContain('HTML tags removed')
    })

    it('should remove disallowed HTML tags', () => {
      const content = '<script>alert("xss")</script><p>Safe content</p>'
      const result = filterContent(content)

      expect(result.content).not.toContain('<script>')
      expect(result.violations).toContain('Disallowed HTML tags removed')
    })
  })

  describe('isSpam', () => {
    it('should detect spam keywords', () => {
      expect(isSpam('Buy now and save!')).toBe(true)
      expect(isSpam('Click here for amazing deals')).toBe(true)
      expect(isSpam('Limited time offer, act now!')).toBe(true)
    })

    it('should detect pharmaceutical spam', () => {
      expect(isSpam('Get cheap viagra online')).toBe(true)
      expect(isSpam('Buy cialis from pharmacy')).toBe(true)
    })

    it('should detect gambling spam', () => {
      expect(isSpam('Win the lottery jackpot')).toBe(true)
      expect(isSpam('Best online casino')).toBe(true)
    })

    it('should detect excessive symbols', () => {
      expect(isSpam('$$$ Make money now $$$')).toBe(true)
      expect(isSpam('Amazing deal!!!!!!!!')).toBe(true)
      expect(isSpam('FREE FREE FREE')).toBe(true)
    })

    it('should detect repeated characters', () => {
      expect(isSpam('Hellooooooooooo')).toBe(true)
    })

    it('should allow legitimate content', () => {
      expect(isSpam('I have a question about sign language')).toBe(false)
      expect(isSpam('This is a helpful discussion')).toBe(false)
    })
  })

  describe('calculateContentQuality', () => {
    it('should penalize very short content', () => {
      const shortContent = 'Hi'
      const score = calculateContentQuality(shortContent)
      expect(score).toBeLessThan(100)
      expect(score).toBeLessThanOrEqual(70) // -30 penalty
    })

    it('should penalize excessive caps', () => {
      const capsContent = 'THIS IS ALL CAPS AND SHOUTING'
      const score = calculateContentQuality(capsContent)
      expect(score).toBeLessThan(100)
    })

    it('should penalize excessive punctuation', () => {
      const punctContent = 'What is this?!?!?!?!?!?!'
      const score = calculateContentQuality(punctContent)
      expect(score).toBeLessThan(100)
    })

    it('should heavily penalize spam content', () => {
      const spamContent = 'Buy now!!! Click here!!! Limited time!!!'
      const score = calculateContentQuality(spamContent)
      expect(score).toBeLessThan(50)
    })

    it('should penalize repeated words', () => {
      const repeated = 'spam spam spam spam spam spam spam'
      const score = calculateContentQuality(repeated)
      expect(score).toBeLessThan(100)
    })

    it('should give high score to quality content', () => {
      const quality =
        'I have been learning sign language for a few months now and would appreciate any tips from experienced signers. What resources did you find most helpful when you were starting out?'
      const score = calculateContentQuality(quality)
      expect(score).toBeGreaterThan(80)
    })

    it('should never return score below 0', () => {
      const terrible = 'SPAM!!! BUY NOW!!! $$$ FREE!!! CLICK HERE!!! spam spam spam'
      const score = calculateContentQuality(terrible)
      expect(score).toBeGreaterThanOrEqual(0)
    })

    it('should never return score above 100', () => {
      const perfect = 'This is a thoughtful, well-written contribution to the discussion.'
      const score = calculateContentQuality(perfect)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('validateThreadTitle', () => {
    it('should reject empty title', () => {
      const result = validateThreadTitle('')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Title is required')
    })

    it('should reject title that is too short', () => {
      const result = validateThreadTitle('Short')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Title must be at least 10 characters')
    })

    it('should reject title that is too long', () => {
      const longTitle = 'a'.repeat(201)
      const result = validateThreadTitle(longTitle)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Title must be less than 200 characters')
    })

    it('should reject all-caps title', () => {
      const result = validateThreadTitle('THIS IS AN ALL CAPS TITLE')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Title should not be all caps')
    })

    it('should allow valid title', () => {
      const result = validateThreadTitle('This is a valid thread title')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should allow short all-caps titles', () => {
      const result = validateThreadTitle('ASL HELP')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validatePostContent', () => {
    it('should reject empty content', () => {
      const result = validatePostContent('')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Content is required')
    })

    it('should reject content that is too short', () => {
      const result = validatePostContent('Short')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Content must be at least 10 characters')
    })

    it('should reject content that is too long', () => {
      const longContent = 'a'.repeat(50001)
      const result = validatePostContent(longContent)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Content must be less than 50,000 characters')
    })

    it('should reject low-quality content', () => {
      const spamContent = 'BUY NOW!!! $$$ CLICK HERE!!! spam spam spam'
      const result = validatePostContent(spamContent)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Content quality is too low')
    })

    it('should allow valid content', () => {
      const validContent =
        'This is a thoughtful response with enough content and good quality. It contributes meaningfully to the discussion.'
      const result = validatePostContent(validContent)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should count content length without HTML tags', () => {
      const content = '<p>Short</p>'
      const result = validatePostContent(content)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Content must be at least 10 characters')
    })
  })

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const html = '<script>alert("xss")</script><p>Safe content</p>'
      const result = sanitizeHtml(html, ['p'])
      expect(result).not.toContain('<script>')
      expect(result).toContain('<p>')
    })

    it('should remove disallowed tags', () => {
      const html = '<p>Allowed</p><iframe>Not allowed</iframe>'
      const result = sanitizeHtml(html, ['p'])
      expect(result).toContain('<p>')
      expect(result).not.toContain('<iframe>')
    })

    it('should strip attributes from allowed tags', () => {
      const html = '<p class="test" onclick="alert()">Content</p>'
      const result = sanitizeHtml(html, ['p'])
      expect(result).toBe('<p>Content</p>')
    })

    it('should preserve href in anchor tags', () => {
      const html = '<a href="https://example.com" class="link">Link</a>'
      const result = sanitizeHtml(html, ['a'])
      expect(result).toContain('href="https://example.com"')
      expect(result).not.toContain('class')
    })

    it('should reject non-http(s) URLs in anchors', () => {
      const html = '<a href="javascript:alert()">Bad link</a>'
      const result = sanitizeHtml(html, ['a'])
      expect(result).not.toContain('javascript:')
    })

    it('should add security attributes to anchor tags', () => {
      const html = '<a href="https://example.com">Link</a>'
      const result = sanitizeHtml(html, ['a'])
      expect(result).toContain('target="_blank"')
      expect(result).toContain('rel="noopener noreferrer"')
    })
  })

  describe('stripHtml', () => {
    it('should remove all HTML tags', () => {
      const html = '<p>Hello</p><strong>World</strong>'
      const result = stripHtml(html)
      expect(result).toBe('HelloWorld')
    })

    it('should handle self-closing tags', () => {
      const html = 'Line 1<br/>Line 2'
      const result = stripHtml(html)
      expect(result).toBe('Line 1Line 2')
    })

    it('should handle nested tags', () => {
      const html = '<div><p><strong>Nested</strong> content</p></div>'
      const result = stripHtml(html)
      expect(result).toBe('Nested content')
    })
  })

  describe('extractMentions', () => {
    it('should extract username mentions', () => {
      const content = 'Hello @john and @jane_doe'
      const mentions = extractMentions(content)
      expect(mentions).toEqual(['john', 'jane_doe'])
    })

    it('should remove duplicate mentions', () => {
      const content = '@john @jane @john'
      const mentions = extractMentions(content)
      expect(mentions).toEqual(['john', 'jane'])
    })

    it('should handle mentions with hyphens', () => {
      const content = '@user-name @another-user'
      const mentions = extractMentions(content)
      expect(mentions).toEqual(['user-name', 'another-user'])
    })

    it('should return empty array for no mentions', () => {
      const content = 'No mentions here'
      const mentions = extractMentions(content)
      expect(mentions).toEqual([])
    })
  })

  describe('extractHashtags', () => {
    it('should extract hashtags', () => {
      const content = 'Learning #ASL and #SignLanguage'
      const hashtags = extractHashtags(content)
      expect(hashtags).toEqual(['ASL', 'SignLanguage'])
    })

    it('should remove duplicate hashtags', () => {
      const content = '#asl #deaf #asl'
      const hashtags = extractHashtags(content)
      expect(hashtags).toEqual(['asl', 'deaf'])
    })

    it('should handle hashtags with hyphens', () => {
      const content = '#sign-language #deaf-culture'
      const hashtags = extractHashtags(content)
      expect(hashtags).toEqual(['sign-language', 'deaf-culture'])
    })

    it('should return empty array for no hashtags', () => {
      const content = 'No hashtags here'
      const hashtags = extractHashtags(content)
      expect(hashtags).toEqual([])
    })
  })
})
