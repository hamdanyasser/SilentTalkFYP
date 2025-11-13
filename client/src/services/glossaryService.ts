/**
 * Glossary Service
 *
 * Handles glossary term CRUD operations and search.
 * Currently uses mock implementation - replace with real API calls.
 */

import {
  GlossaryTerm,
  GetGlossaryRequest,
  GetGlossaryResponse,
  GetGlossaryTermRequest,
  GetGlossaryTermResponse,
  CreateGlossaryTermRequest,
  CreateGlossaryTermResponse,
} from '../types/resources'

// Simulated delay for mock API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock data
const mockGlossaryTerms: GlossaryTerm[] = [
  {
    id: 'term-1',
    term: 'ASL',
    definition:
      'American Sign Language - A complete, natural language that has the same linguistic properties as spoken languages, with grammar that differs from English.',
    alternativeTerms: ['American Sign Language', 'Ameslan'],
    example: 'ASL is the primary language of many Deaf people in the United States and Canada.',
    videoUrl: '/videos/signs/asl.mp4',
    category: 'basics',
    tags: ['language', 'basics'],
    viewCount: 2345,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'term-2',
    term: 'Fingerspelling',
    definition:
      'The process of spelling out words using handshapes that correspond to the letters of the written alphabet. Used for proper nouns, technical terms, or words without established signs.',
    alternativeTerms: ['Manual Alphabet', 'Dactylology'],
    example: 'When meeting someone new, you typically fingerspell your name in ASL.',
    videoUrl: '/videos/signs/fingerspelling.mp4',
    category: 'fingerspelling',
    tags: ['fingerspelling', 'basics', 'alphabet'],
    viewCount: 1876,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'term-3',
    term: 'Classifier',
    definition:
      'A handshape that represents a class of objects or concepts. Classifiers are used to show location, movement, and appearance of objects and people.',
    example:
      'Using a "vehicle" classifier, you can show a car driving up a winding road by moving your hand in a curved path.',
    videoUrl: '/videos/signs/classifier.mp4',
    imageUrl: '/images/classifier-example.jpg',
    category: 'grammar',
    tags: ['grammar', 'advanced', 'handshape'],
    relatedTerms: ['term-5'],
    viewCount: 987,
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
  },
  {
    id: 'term-4',
    term: 'Deaf Culture',
    definition:
      'The social beliefs, behaviors, art, literary traditions, history, values, and shared institutions of communities that are affected by deafness and which use sign languages as the main means of communication.',
    alternativeTerms: ['Deaf Community'],
    example:
      'Deaf Culture includes unique traditions such as storytelling through sign, visual arts, and specific social norms.',
    category: 'deaf-culture',
    tags: ['culture', 'community', 'history'],
    viewCount: 1543,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: 'term-5',
    term: 'Handshape',
    definition:
      'The configuration of the hand(s) in a sign. One of the five parameters of a sign in ASL, along with location, movement, palm orientation, and non-manual markers.',
    example: 'The sign for "water" uses a "W" handshape tapped on the chin.',
    videoUrl: '/videos/signs/handshape.mp4',
    category: 'grammar',
    tags: ['grammar', 'phonology', 'basics'],
    relatedTerms: ['term-3'],
    viewCount: 1234,
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
  {
    id: 'term-6',
    term: 'Non-manual Markers',
    definition:
      'Facial expressions, head movements, and body positions that are used grammatically in ASL to convey meaning, ask questions, or show emotion.',
    alternativeTerms: ['NMM', 'Facial Grammar'],
    example:
      'Raising your eyebrows is a non-manual marker used when asking yes/no questions in ASL.',
    videoUrl: '/videos/signs/non-manual.mp4',
    category: 'grammar',
    tags: ['grammar', 'facial-expressions', 'intermediate'],
    viewCount: 876,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: 'term-7',
    term: 'Interpreter',
    definition:
      'A professional who facilitates communication between Deaf and hearing individuals by translating spoken language to sign language and vice versa.',
    example:
      'A certified ASL interpreter is required in legal settings to ensure Deaf individuals have equal access to justice.',
    category: 'interpreting',
    tags: ['interpreting', 'profession', 'accessibility'],
    viewCount: 654,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'term-8',
    term: 'Conceptually Accurate Signed English',
    definition:
      'A signing system that conveys the meaning of English words using ASL signs in English word order. Differs from ASL in that it follows English grammar.',
    alternativeTerms: ['CASE', 'Pidgin Signed English', 'PSE'],
    example: 'Many hearing people learning ASL initially use CASE before becoming fluent in ASL.',
    category: 'basics',
    tags: ['language', 'basics', 'education'],
    viewCount: 543,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
]

/**
 * Get glossary terms with filtering and search
 */
export async function getGlossary(request: GetGlossaryRequest = {}): Promise<GetGlossaryResponse> {
  try {
    await delay(300)

    let filtered = [...mockGlossaryTerms]

    // Search by term or definition
    if (request.search) {
      const query = request.search.toLowerCase()
      filtered = filtered.filter(
        t =>
          t.term.toLowerCase().includes(query) ||
          t.definition.toLowerCase().includes(query) ||
          t.alternativeTerms?.some(alt => alt.toLowerCase().includes(query)) ||
          t.tags.some(tag => tag.toLowerCase().includes(query)),
      )
    }

    // Filter by category
    if (request.category) {
      filtered = filtered.filter(t => t.category === request.category)
    }

    // Filter by first letter
    if (request.letter) {
      const letter = request.letter.toUpperCase()
      filtered = filtered.filter(t => t.term.toUpperCase().startsWith(letter))
    }

    // Sort alphabetically by term
    filtered.sort((a, b) => a.term.localeCompare(b.term))

    // Pagination
    const offset = request.offset || 0
    const limit = request.limit || 50
    const paginated = filtered.slice(offset, offset + limit)

    return {
      success: true,
      terms: paginated,
      totalCount: filtered.length,
    }
  } catch (error) {
    console.error('Get glossary error:', error)
    return {
      success: false,
      terms: [],
      totalCount: 0,
    }
  }
}

/**
 * Get single glossary term by ID
 */
export async function getGlossaryTerm(
  request: GetGlossaryTermRequest,
): Promise<GetGlossaryTermResponse> {
  try {
    await delay(200)

    const term = mockGlossaryTerms.find(t => t.id === request.termId)

    if (!term) {
      return {
        success: false,
      }
    }

    // Increment view count (in real app this would be on backend)
    term.viewCount++

    return {
      success: true,
      term,
    }
  } catch (error) {
    console.error('Get glossary term error:', error)
    return {
      success: false,
    }
  }
}

/**
 * Create new glossary term
 */
export async function createGlossaryTerm(
  request: CreateGlossaryTermRequest,
): Promise<CreateGlossaryTermResponse> {
  try {
    await delay(400)

    // Validation
    if (!request.term || request.term.trim().length < 2) {
      return {
        success: false,
        message: 'Term must be at least 2 characters',
      }
    }

    if (!request.definition || request.definition.trim().length < 10) {
      return {
        success: false,
        message: 'Definition must be at least 10 characters',
      }
    }

    // Check for duplicates
    const exists = mockGlossaryTerms.find(t => t.term.toLowerCase() === request.term.toLowerCase())

    if (exists) {
      return {
        success: false,
        message: 'A term with this name already exists',
      }
    }

    const newTerm: GlossaryTerm = {
      id: `term-${Date.now()}`,
      term: request.term,
      definition: request.definition,
      alternativeTerms: request.alternativeTerms,
      example: request.example,
      videoUrl: request.videoUrl,
      imageUrl: request.imageUrl,
      category: request.category,
      tags: request.tags,
      addedBy: 'current-user',
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockGlossaryTerms.push(newTerm)

    return {
      success: true,
      message: 'Glossary term created successfully',
      term: newTerm,
    }
  } catch (error) {
    console.error('Create glossary term error:', error)
    return {
      success: false,
      message: 'Failed to create glossary term',
    }
  }
}

/**
 * Get alphabet letters for glossary navigation
 */
export function getAlphabetLetters(): string[] {
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
}

/**
 * Get available letters (letters that have terms)
 */
export function getAvailableLetters(): string[] {
  const letters = new Set<string>()
  mockGlossaryTerms.forEach(term => {
    const firstLetter = term.term.charAt(0).toUpperCase()
    if (/[A-Z]/.test(firstLetter)) {
      letters.add(firstLetter)
    }
  })
  return Array.from(letters).sort()
}

/**
 * Get related terms
 */
export async function getRelatedTerms(termId: string): Promise<GlossaryTerm[]> {
  try {
    await delay(200)

    const term = mockGlossaryTerms.find(t => t.id === termId)

    if (!term || !term.relatedTerms) {
      return []
    }

    return mockGlossaryTerms.filter(t => term.relatedTerms!.includes(t.id))
  } catch (error) {
    console.error('Get related terms error:', error)
    return []
  }
}
