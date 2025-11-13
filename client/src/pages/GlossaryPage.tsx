import React, { useState, useEffect } from 'react';
import '../styles/GlossaryPage.css';

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: 'basic' | 'intermediate' | 'advanced' | 'fingerspelling' | 'grammar';
  videoUrl?: string;
  imageUrl?: string;
  relatedTerms: string[];
  signLanguage: 'ASL' | 'BSL' | 'ISL';
}

const MOCK_GLOSSARY: GlossaryTerm[] = [
  {
    id: '1',
    term: 'Fingerspelling',
    definition: 'The process of spelling out words by using signs that correspond to the letters of the alphabet. Used for proper nouns, technical terms, or words without established signs.',
    category: 'basic',
    videoUrl: '/videos/fingerspelling-demo.mp4',
    relatedTerms: ['Manual Alphabet', 'Lexicalized Fingerspelling'],
    signLanguage: 'ASL'
  },
  {
    id: '2',
    term: 'Classifier',
    definition: 'Handshapes that are used to represent general categories of things, such as vehicles, people, or objects. They show movement, location, and appearance.',
    category: 'intermediate',
    relatedTerms: ['Depicting Verbs', 'Handshape'],
    signLanguage: 'ASL'
  },
  {
    id: '3',
    term: 'Facial Grammar',
    definition: 'Non-manual markers (facial expressions and head movements) that convey grammatical information such as questions, negations, or topicalization.',
    category: 'grammar',
    relatedTerms: ['Non-Manual Markers', 'WH-Questions', 'Yes/No Questions'],
    signLanguage: 'ASL'
  },
  {
    id: '4',
    term: 'Topicalization',
    definition: 'A grammatical structure where the topic of a sentence is signed first, followed by raised eyebrows, then a comment about that topic.',
    category: 'grammar',
    relatedTerms: ['Facial Grammar', 'Sentence Structure'],
    signLanguage: 'ASL'
  },
  {
    id: '5',
    term: 'Iconicity',
    definition: 'The degree to which a sign visually resembles or suggests its meaning. Many signs are iconic, making them easier to learn and remember.',
    category: 'basic',
    relatedTerms: ['Arbitrary Signs', 'Motivation'],
    signLanguage: 'ASL'
  },
  {
    id: '6',
    term: 'Handshape',
    definition: 'One of the five parameters of a sign, referring to the configuration of the fingers and thumb. ASL uses approximately 40-50 distinct handshapes.',
    category: 'basic',
    relatedTerms: ['Parameters', 'Movement', 'Location', 'Orientation'],
    signLanguage: 'ASL'
  },
  {
    id: '7',
    term: 'Lexicalized Fingerspelling',
    definition: 'A fingerspelled word that has become a sign in its own right, often abbreviated or modified from its original fingerspelled form.',
    category: 'intermediate',
    relatedTerms: ['Fingerspelling', 'Loan Signs'],
    signLanguage: 'ASL'
  },
  {
    id: '8',
    term: 'Space Agreement',
    definition: 'The use of signing space to show relationships between people, places, and things through consistent spatial reference.',
    category: 'advanced',
    relatedTerms: ['Referential Indexing', 'Spatial Grammar'],
    signLanguage: 'ASL'
  },
  {
    id: '9',
    term: 'Minimal Pair',
    definition: 'Two signs that differ by only one parameter (handshape, location, movement, orientation, or non-manual markers).',
    category: 'intermediate',
    relatedTerms: ['Parameters', 'Phonology'],
    signLanguage: 'ASL'
  },
  {
    id: '10',
    term: 'Depicting Verb',
    definition: 'Verbs that use classifiers to show how something moves, looks, or is positioned. Also called classifier predicates.',
    category: 'advanced',
    relatedTerms: ['Classifier', 'Verb Types'],
    signLanguage: 'ASL'
  }
];

const GlossaryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [filteredTerms, setFilteredTerms] = useState<GlossaryTerm[]>(MOCK_GLOSSARY);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  useEffect(() => {
    let filtered = MOCK_GLOSSARY;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (term) =>
          term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
          term.definition.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((term) => term.category === selectedCategory);
    }

    // Filter by sign language
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter((term) => term.signLanguage === selectedLanguage);
    }

    setFilteredTerms(filtered);
  }, [searchTerm, selectedCategory, selectedLanguage]);

  return (
    <div className="glossary-page">
      <header className="glossary-header">
        <h1>Sign Language Glossary</h1>
        <p className="glossary-description">
          Explore sign language terminology, from basic concepts to advanced grammar.
        </p>
      </header>

      <div className="glossary-filters">
        <div className="search-box">
          <label htmlFor="glossary-search" className="visually-hidden">
            Search glossary
          </label>
          <input
            id="glossary-search"
            type="search"
            placeholder="Search terms or definitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Search glossary terms"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="category-filter">Category</label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="fingerspelling">Fingerspelling</option>
            <option value="grammar">Grammar</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="language-filter">Sign Language</label>
          <select
            id="language-filter"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Languages</option>
            <option value="ASL">ASL</option>
            <option value="BSL">BSL</option>
            <option value="ISL">ISL</option>
          </select>
        </div>
      </div>

      <div className="glossary-content">
        <div className="glossary-list" role="list">
          {filteredTerms.length === 0 ? (
            <div className="no-results">
              <p>No terms found matching your search criteria.</p>
            </div>
          ) : (
            filteredTerms.map((term) => (
              <article
                key={term.id}
                className={`glossary-item ${selectedTerm?.id === term.id ? 'active' : ''}`}
                onClick={() => setSelectedTerm(term)}
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedTerm(term);
                  }
                }}
              >
                <div className="term-header">
                  <h3 className="term-name">{term.term}</h3>
                  <span className={`category-badge ${term.category}`}>
                    {term.category}
                  </span>
                </div>
                <p className="term-preview">{term.definition.substring(0, 100)}...</p>
              </article>
            ))
          )}
        </div>

        {selectedTerm && (
          <aside className="term-details" aria-label="Term details">
            <button
              className="close-button"
              onClick={() => setSelectedTerm(null)}
              aria-label="Close term details"
            >
              ×
            </button>

            <div className="term-content">
              <header className="term-detail-header">
                <h2>{selectedTerm.term}</h2>
                <div className="term-meta">
                  <span className={`category-badge ${selectedTerm.category}`}>
                    {selectedTerm.category}
                  </span>
                  <span className="language-badge">{selectedTerm.signLanguage}</span>
                </div>
              </header>

              <div className="term-definition">
                <h3>Definition</h3>
                <p>{selectedTerm.definition}</p>
              </div>

              {selectedTerm.videoUrl && (
                <div className="term-video">
                  <h3>Video Demonstration</h3>
                  <video
                    controls
                    src={selectedTerm.videoUrl}
                    className="demo-video"
                    aria-label={`Video demonstration of ${selectedTerm.term}`}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {selectedTerm.relatedTerms.length > 0 && (
                <div className="related-terms">
                  <h3>Related Terms</h3>
                  <ul className="related-list">
                    {selectedTerm.relatedTerms.map((relatedTerm, index) => (
                      <li key={index}>
                        <button
                          className="related-link"
                          onClick={() => {
                            const term = MOCK_GLOSSARY.find((t) => t.term === relatedTerm);
                            if (term) setSelectedTerm(term);
                          }}
                        >
                          {relatedTerm}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      <div className="glossary-stats">
        <p>
          Showing {filteredTerms.length} of {MOCK_GLOSSARY.length} terms
        </p>
      </div>
    </div>
  );
};

export default GlossaryPage;
