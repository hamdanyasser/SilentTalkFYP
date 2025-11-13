import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="home-page">
      <header>
        <h1>Welcome to SilentTalk</h1>
        <p>Sign Language Communication Platform</p>
      </header>
      <main>
        <section>
          <h2>Features</h2>
          <ul>
            <li>Real-time video communication</li>
            <li>AI-powered sign language recognition</li>
            <li>Text-to-sign and sign-to-text translation</li>
            <li>Live captions with &lt;3s delay</li>
            <li>Text-to-speech for recognized signs</li>
            <li>Educational resources and community forum</li>
          </ul>
        </section>
        <section>
          <h2>Try It Now</h2>
          <Link to="/call" style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#0066cc',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}>
            Start Video Call with Captions
          </Link>
        </section>
      </main>
    </div>
  )
}

export default HomePage
