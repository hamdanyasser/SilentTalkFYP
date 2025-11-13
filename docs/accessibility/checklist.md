# WCAG 2.1 Level AA Accessibility Checklist

## Overview

This checklist ensures SilentTalk meets WCAG 2.1 Level AA compliance for accessibility, with particular focus on users with disabilities.

## 1. Perceivable

### 1.1 Text Alternatives

- [ ] **1.1.1 Non-text Content (A)**: All images, icons, and non-text content have appropriate alt text
  - [ ] Decorative images have empty alt attributes (`alt=""`)
  - [ ] Informative images have descriptive alt text
  - [ ] Complex images (charts, diagrams) have detailed descriptions

### 1.2 Time-based Media

- [ ] **1.2.1 Audio-only and Video-only (A)**: Alternative for pre-recorded audio/video
- [ ] **1.2.2 Captions (A)**: Captions provided for all pre-recorded video
- [ ] **1.2.3 Audio Description (A)**: Audio description or media alternative for pre-recorded video
- [ ] **1.2.4 Captions (Live) (AA)**: Captions provided for all live audio/video
- [ ] **1.2.5 Audio Description (AA)**: Audio description for all pre-recorded video

**Implementation for SilentTalk**:
```typescript
// Video component with captions
<video controls>
  <source src="video.mp4" type="video/mp4" />
  <track kind="captions" src="captions.vtt" srclang="en" label="English" default />
  <track kind="descriptions" src="descriptions.vtt" srclang="en" label="English Descriptions" />
</video>
```

### 1.3 Adaptable

- [ ] **1.3.1 Info and Relationships (A)**: Information structure is programmatically determinable
  - [ ] Semantic HTML elements used (`<header>`, `<nav>`, `<main>`, `<footer>`, etc.)
  - [ ] Form labels properly associated with inputs
  - [ ] Heading hierarchy is logical (h1 → h2 → h3)
  - [ ] Lists use proper markup (`<ul>`, `<ol>`, `<li>`)

**Example**:
```jsx
// Good
<label htmlFor="email">Email Address</label>
<input id="email" type="email" name="email" />

// Bad
<div>Email Address</div>
<input type="email" name="email" />
```

- [ ] **1.3.2 Meaningful Sequence (A)**: Reading order matches visual order
- [ ] **1.3.3 Sensory Characteristics (A)**: Instructions don't rely solely on sensory characteristics
- [ ] **1.3.4 Orientation (AA)**: Content not restricted to single orientation
- [ ] **1.3.5 Identify Input Purpose (AA)**: Input purpose can be programmatically determined

### 1.4 Distinguishable

- [ ] **1.4.1 Use of Color (A)**: Color not the only means of conveying information
  - [ ] Error messages have icons/text, not just red color
  - [ ] Links distinguishable by more than color (underline, icon, etc.)

**Example**:
```jsx
// Good
<p className="error">
  <AlertIcon aria-hidden="true" />
  <span>Error: Email is required</span>
</p>

// Bad
<p style={{color: 'red'}}>Error: Email is required</p>
```

- [ ] **1.4.2 Audio Control (A)**: Audio can be paused/stopped
- [ ] **1.4.3 Contrast (Minimum) (AA)**: Text contrast ratio at least 4.5:1 (3:1 for large text)
  - [ ] Regular text: 4.5:1
  - [ ] Large text (18pt+/14pt+ bold): 3:1
  - [ ] Use contrast checker tools

**Contrast Examples**:
```css
/* Good */
.text {
  color: #333333; /* Dark gray */
  background: #FFFFFF; /* White */
  /* Contrast ratio: 12.6:1 ✓ */
}

/* Bad */
.text-bad {
  color: #767676; /* Light gray */
  background: #FFFFFF; /* White */
  /* Contrast ratio: 4.5:1 (borderline) */
}
```

- [ ] **1.4.4 Resize Text (AA)**: Text can be resized to 200% without loss of functionality
- [ ] **1.4.5 Images of Text (AA)**: Use actual text instead of images of text (except logos)
- [ ] **1.4.10 Reflow (AA)**: Content reflows to fit 320px width without horizontal scrolling
- [ ] **1.4.11 Non-text Contrast (AA)**: UI components and graphics have 3:1 contrast ratio
- [ ] **1.4.12 Text Spacing (AA)**: No loss of content when text spacing is adjusted
- [ ] **1.4.13 Content on Hover or Focus (AA)**: Hoverable/focusable content is dismissible, hoverable, and persistent

## 2. Operable

### 2.1 Keyboard Accessible

- [ ] **2.1.1 Keyboard (A)**: All functionality available via keyboard
  - [ ] Tab through all interactive elements
  - [ ] Enter/Space activates buttons/links
  - [ ] Arrow keys navigate within components (menus, lists)
  - [ ] Escape closes modals/dialogs

**Example**:
```jsx
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  Click Me
</button>
```

- [ ] **2.1.2 No Keyboard Trap (A)**: Keyboard focus never trapped
- [ ] **2.1.4 Character Key Shortcuts (A)**: Single-key shortcuts can be disabled/remapped

### 2.2 Enough Time

- [ ] **2.2.1 Timing Adjustable (A)**: Time limits can be adjusted/extended/disabled
  - [ ] Session timeouts have warnings
  - [ ] Auto-advancing carousels can be paused

**Example**:
```jsx
// Session timeout warning
{showTimeoutWarning && (
  <Alert role="alert">
    <p>Your session will expire in {remainingTime} seconds.</p>
    <button onClick={extendSession}>Extend Session</button>
  </Alert>
)}
```

- [ ] **2.2.2 Pause, Stop, Hide (A)**: Moving/blinking content can be paused/stopped

### 2.3 Seizures and Physical Reactions

- [ ] **2.3.1 Three Flashes or Below Threshold (A)**: No content flashes more than 3 times per second

### 2.4 Navigable

- [ ] **2.4.1 Bypass Blocks (A)**: Skip navigation link provided
  - [ ] "Skip to main content" link at top

**Example**:
```jsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

<main id="main-content">
  {/* Page content */}
</main>
```

- [ ] **2.4.2 Page Titled (A)**: Pages have descriptive titles
  - [ ] Title format: `[Page Name] - SilentTalk`

- [ ] **2.4.3 Focus Order (A)**: Focus order is logical and intuitive
- [ ] **2.4.4 Link Purpose (A)**: Link purpose can be determined from link text or context
  - [ ] Avoid "click here" or "read more" without context

**Example**:
```jsx
// Good
<a href="/profile/john">View John's Profile</a>

// Bad
<a href="/profile/john">Click here</a>
```

- [ ] **2.4.5 Multiple Ways (AA)**: Multiple ways to locate pages (search, sitemap, navigation)
- [ ] **2.4.6 Headings and Labels (AA)**: Headings and labels are descriptive
- [ ] **2.4.7 Focus Visible (AA)**: Keyboard focus indicator is visible
  - [ ] Custom focus styles meet contrast requirements

**Example**:
```css
/* Focus indicator */
button:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}
```

### 2.5 Input Modalities

- [ ] **2.5.1 Pointer Gestures (A)**: Complex gestures have simple alternatives
- [ ] **2.5.2 Pointer Cancellation (A)**: Up-event for activation (not down-event)
- [ ] **2.5.3 Label in Name (A)**: Accessible name contains visible label text
- [ ] **2.5.4 Motion Actuation (A)**: Motion-triggered functions can be disabled

## 3. Understandable

### 3.1 Readable

- [ ] **3.1.1 Language of Page (A)**: Page language declared in HTML

**Example**:
```html
<html lang="en">
```

- [ ] **3.1.2 Language of Parts (AA)**: Language changes marked up

**Example**:
```jsx
<p>The French word for hello is <span lang="fr">bonjour</span>.</p>
```

### 3.2 Predictable

- [ ] **3.2.1 On Focus (A)**: Focusing an element doesn't trigger context change
- [ ] **3.2.2 On Input (A)**: Changing a setting doesn't automatically trigger context change
  - [ ] Forms don't auto-submit on input

- [ ] **3.2.3 Consistent Navigation (AA)**: Navigation is consistent across pages
- [ ] **3.2.4 Consistent Identification (AA)**: Components with same functionality have consistent identification

### 3.3 Input Assistance

- [ ] **3.3.1 Error Identification (A)**: Errors are identified in text
- [ ] **3.3.2 Labels or Instructions (A)**: Labels/instructions provided for user input

**Example**:
```jsx
<label htmlFor="password">
  Password
  <span className="hint">(Must be at least 8 characters)</span>
</label>
<input
  id="password"
  type="password"
  aria-describedby="password-requirements"
  aria-invalid={hasError}
/>
{hasError && (
  <p id="password-error" role="alert" className="error">
    Password must be at least 8 characters long
  </p>
)}
```

- [ ] **3.3.3 Error Suggestion (AA)**: Error messages include suggestions for correction
- [ ] **3.3.4 Error Prevention (AA)**: For legal/financial transactions, submissions are reversible, checked, or confirmed

## 4. Robust

### 4.1 Compatible

- [ ] **4.1.1 Parsing (A)**: HTML is valid and well-formed
  - [ ] No duplicate IDs
  - [ ] Elements properly nested
  - [ ] Required attributes present

- [ ] **4.1.2 Name, Role, Value (A)**: All UI components have accessible name, role, and state
  - [ ] Use ARIA roles appropriately
  - [ ] ARIA states reflect component state

**Example**:
```jsx
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  aria-controls="dialog-content"
>
  ✕
</button>

<div
  id="dialog-content"
  role="dialog"
  aria-labelledby="dialog-title"
  aria-modal="true"
>
  <h2 id="dialog-title">Confirmation</h2>
  {/* Dialog content */}
</div>
```

- [ ] **4.1.3 Status Messages (AA)**: Status messages can be programmatically determined

**Example**:
```jsx
// Use role="status" for status messages
<div role="status" aria-live="polite">
  Your changes have been saved.
</div>

// Use role="alert" for important messages
<div role="alert" aria-live="assertive">
  Error: Failed to save changes.
</div>
```

## SilentTalk-Specific Requirements

### Video Communication

- [ ] Captions for live video calls
- [ ] Screen reader announces connection status
- [ ] Keyboard controls for mute/unmute, video on/off
- [ ] Visual indicators for audio/video status
- [ ] High contrast mode for video controls

### Sign Language Recognition

- [ ] Alternative text input for users without camera
- [ ] Clear feedback on recognition results
- [ ] Keyboard shortcut to re-attempt recognition
- [ ] Visual confirmation of successful recognition

### Forms & Authentication

- [ ] Password visibility toggle
- [ ] Clear error messages with suggestions
- [ ] Form validation on blur and submit
- [ ] Success/error announcements for screen readers

### Navigation

- [ ] Breadcrumbs for deep navigation
- [ ] Clear indication of current page
- [ ] Search functionality with keyboard shortcuts
- [ ] Consistent menu structure

## Testing Tools

### Automated Testing
- [ ] **axe DevTools**: Browser extension for accessibility testing
- [ ] **Lighthouse**: Chrome DevTools accessibility audit
- [ ] **WAVE**: Web accessibility evaluation tool
- [ ] **Pa11y**: Automated accessibility testing CLI

### Manual Testing
- [ ] **Screen Reader**: NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS)
- [ ] **Keyboard Navigation**: Test with Tab, Enter, Space, Arrow keys
- [ ] **Color Contrast**: Use WebAIM Contrast Checker
- [ ] **Zoom**: Test at 200% zoom level
- [ ] **Voice Control**: Dragon NaturallySpeaking (Windows), Voice Control (Mac)

## Testing Checklist

### Initial Development
- [ ] Run automated tests (axe, Lighthouse) on every page
- [ ] Test keyboard navigation for all interactive elements
- [ ] Verify color contrast for all text
- [ ] Check heading structure is logical

### Before Release
- [ ] Full screen reader test on major user flows
- [ ] Manual keyboard navigation through entire application
- [ ] Test with browser zoom at 200%
- [ ] Verify all form validation messages
- [ ] Test with high contrast mode
- [ ] Test with reduced motion preference

### Regression Testing
- [ ] Run automated tests in CI/CD pipeline
- [ ] Quarterly screen reader testing
- [ ] User testing with people with disabilities

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Checklist](https://webaim.org/standards/wcag/checklist)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Inclusive Components](https://inclusive-components.design/)
- [React Accessibility Docs](https://react.dev/learn/accessibility)

## Contact

For accessibility issues or questions, contact: [accessibility@silentstalk.com]
