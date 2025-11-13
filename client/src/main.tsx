import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { store } from './store'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import './styles/accessibility.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AccessibilityProvider>
          <App />
        </AccessibilityProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
