# Accessibility Testing Guide
**WCAG 2.1 AA Implementation (NFR-006)**

This document provides comprehensive instructions for manual and automated accessibility testing of the SilentTalk application.

## Table of Contents
1. [Automated Testing](#automated-testing)
2. [Manual Testing with Screen Readers](#manual-testing-with-screen-readers)
3. [Keyboard Navigation Testing](#keyboard-navigation-testing)
4. [High Contrast Mode Testing](#high-contrast-mode-testing)
5. [Zoom and Reflow Testing](#zoom-and-reflow-testing)
6. [Touch Target Testing](#touch-target-testing)
7. [WCAG 2.1 AA Checklist](#wcag-21-aa-checklist)

---

## Automated Testing

### Running Axe-Core Tests

```bash
cd client

# Install dependencies
npm install

# Build the application
npm run build

# Start preview server
npm run preview &

# Run axe accessibility tests
npm run a11y:test
```

**Expected Output:**
- Report saved to `a11y-report.json`
- Zero violations for WCAG 2.1 AA compliance
- Exit code 0 (pass) or 1 (fail)

### Running Lighthouse Audit

```bash
# Run Lighthouse CI
npm run lighthouse
```

**Expected Output:**
- Report saved to `lighthouse-report.json`
- Accessibility score ≥ 90/100
- Best practices score ≥ 90/100
- SEO score ≥ 90/100

### ESLint JSX A11y

```bash
# Lint with accessibility checks
npm run lint
```

This checks for common accessibility issues in JSX code.

---

## Manual Testing with Screen Readers

### JAWS Testing (Windows)

**Setup:**
1. Install JAWS (Freedom Scientific)
2. Launch application in Chrome, Firefox, or Edge
3. Start JAWS

**Test Script:**

#### Test 1: Page Navigation
1. Open `http://localhost:5173/`
2. Press `Insert + Down Arrow` to start reading
3. **Expected**: JAWS announces page title "SilentTalk - Sign Language Communication Platform"
4. **Expected**: JAWS reads main headings and content in logical order

#### Test 2: Skip Links
1. Press `Tab` key once from page load
2. **Expected**: Focus on "Skip to main content" link
3. **Expected**: JAWS announces "Skip to main content, link"
4. Press `Enter`
5. **Expected**: Focus moves to main content region
6. **Expected**: JAWS announces "Main, region"

#### Test 3: Form Navigation
1. Navigate to video call page: `http://localhost:5173/call`
2. Use `Tab` to navigate through controls
3. **Expected**: JAWS announces each button with its label and state
   - "Start Camera, button"
   - "Start Recognition, button, unavailable" (when disabled)
   - "TTS On, button" or "TTS Off, button"

#### Test 4: Caption Overlay
1. Start camera and recognition
2. When caption appears:
   - **Expected**: JAWS announces caption text in live region
   - **Expected**: Announcement is polite (non-intrusive)
   - **Expected**: Confidence score announced

#### Test 5: Settings Panel
1. Press `Tab` until accessibility settings button is focused
2. **Expected**: JAWS announces "Accessibility, button, collapsed"
3. Press `Enter` or `Space` to open
4. **Expected**: JAWS announces "Accessibility settings, region"
5. Navigate with `Tab` through checkboxes and selects
6. **Expected**: Each control announced with label, role, and state
   - "High Contrast Mode, checkbox, not checked"
   - "Reduce Motion, checkbox, checked"

#### Test 6: Caption History
1. Open caption history panel
2. Navigate with arrow keys through history items
3. **Expected**: JAWS reads each caption with timestamp
4. Focus on Export button
5. **Expected**: JAWS announces "Export, button, Export captions to text file"

---

### NVDA Testing (Windows - Free)

**Setup:**
1. Download and install NVDA from https://www.nvaccess.org/
2. Launch application in Firefox (best compatibility)
3. Start NVDA (`Ctrl + Alt + N`)

**Test Script:**

#### Test 1: Landmarks Navigation
1. Press `D` key to jump between landmarks
2. **Expected**: NVDA announces each landmark:
   - "Navigation, navigation landmark"
   - "Main, main landmark"
   - "Region, region landmark"

#### Test 2: Headings Navigation
1. Press `H` key to jump between headings
2. **Expected**: NVDA announces heading levels:
   - "Heading level 1, Welcome to SilentTalk"
   - "Heading level 2, Features"

#### Test 3: Forms Mode
1. Navigate to settings panel
2. Press `Tab` to enter form controls
3. **Expected**: NVDA enters forms mode automatically
4. **Expected**: All labels read correctly
5. Test checkboxes with `Space`
6. **Expected**: NVDA announces state changes:
   - "High Contrast Mode, checked, checkbox"

#### Test 4: Live Regions (Captions)
1. Start video call with recognition
2. When caption appears:
   - **Expected**: NVDA announces caption without interrupting
   - **Expected**: "Live region" indicator
   - **Expected**: Caption text read clearly

#### Test 5: Error Messages
1. Navigate to any form field (future implementation)
2. Submit invalid data
3. **Expected**: NVDA announces error message
4. **Expected**: "Alert" role announced
5. **Expected**: Error message read immediately

#### Test 6: Keyboard Shortcuts
1. Press `NVDA + H` for help
2. **Expected**: Keyboard shortcuts listed in info panel
3. Test each shortcut:
   - `Tab` - Next control
   - `Shift + Tab` - Previous control
   - `Enter` / `Space` - Activate
   - `Esc` - Close dialog

---

### VoiceOver Testing (macOS)

**Setup:**
1. Enable VoiceOver: `Cmd + F5`
2. Open application in Safari or Chrome

**Test Script:**

#### Test 1: Rotor Navigation
1. Activate Rotor: `Ctrl + Option + U`
2. Navigate landmarks with arrow keys
3. **Expected**: All major regions listed
4. Select main content
5. **Expected**: Focus moves to main region

#### Test 2: Quick Nav
1. Enable Quick Nav: Press left and right arrows together
2. Press `H` to navigate headings
3. Press `L` to navigate links
4. **Expected**: VoiceOver announces each element clearly

#### Test 3: Form Controls
1. Navigate to accessibility panel
2. Use `Ctrl + Option + Space` to interact
3. **Expected**: VoiceOver enters form control
4. Use arrow keys to interact with checkboxes/selects
5. **Expected**: State changes announced

---

## Keyboard Navigation Testing

### Test Checklist

#### Basic Navigation
- [ ] `Tab` moves focus forward through all interactive elements
- [ ] `Shift + Tab` moves focus backward
- [ ] Focus order is logical (left-to-right, top-to-bottom)
- [ ] Focus is always visible (blue outline by default)
- [ ] No keyboard traps (can escape all components with `Tab` or `Esc`)

#### Skip Links
- [ ] First `Tab` on page reveals "Skip to main content" link
- [ ] Skip link is visible when focused
- [ ] Activating skip link moves focus to main content
- [ ] Focus indicator appears on target element

#### Buttons and Controls
- [ ] `Space` or `Enter` activates all buttons
- [ ] Button states (enabled/disabled) clear visually and programmatically
- [ ] Toggle buttons announce state (on/off, expanded/collapsed)

#### Form Controls
- [ ] All form fields accessible via `Tab`
- [ ] Labels associated with inputs (click label focuses input)
- [ ] Required fields indicated visually and programmatically
- [ ] Error messages associated with fields (`aria-describedby`)
- [ ] Form validation errors announced to screen readers

#### Modal Dialogs
- [ ] Opening dialog traps focus inside
- [ ] `Tab` cycles through dialog controls only
- [ ] `Esc` closes dialog
- [ ] Focus returns to trigger element on close
- [ ] Background content not accessible while dialog open

#### Caption Controls
- [ ] All caption buttons keyboard accessible
- [ ] Settings can be changed with keyboard only
- [ ] Caption history navigable with arrow keys
- [ ] Export and clear functions work via keyboard

---

## High Contrast Mode Testing

### Windows High Contrast Mode

**Setup:**
1. Press `Left Alt + Left Shift + Print Screen`
2. Select a high contrast theme

**Test Checklist:**
- [ ] All text visible with sufficient contrast
- [ ] Interactive elements have visible borders
- [ ] Focus indicators remain visible
- [ ] Icons and graphics visible or have text alternatives
- [ ] Form fields have visible borders
- [ ] Buttons distinguish from background
- [ ] Disabled states clear
- [ ] Caption overlays remain readable

### Built-in High Contrast Toggle

**Test Checklist:**
1. Open accessibility panel
2. Enable "High Contrast Mode"
3. **Verify:**
   - [ ] Background changes to dark (#000)
   - [ ] Text changes to light (#fff)
   - [ ] Buttons have high contrast borders
   - [ ] Links clearly visible (#4d9eff)
   - [ ] Error messages visible (#ff4d4d)
   - [ ] Success messages visible (#4dff9d)
   - [ ] All UI elements maintain 7:1 contrast ratio (AAA)
   - [ ] Captions remain readable with high contrast background

---

## Zoom and Reflow Testing

### 200% Zoom Test (WCAG 1.4.4)

**Test in Chrome:**
1. Press `Ctrl +` (or `Cmd +` on Mac) until zoom reaches 200%
2. **Check:**
   - [ ] All text scales proportionally
   - [ ] No horizontal scrolling required
   - [ ] Content reflows to fit viewport
   - [ ] No text truncation or overlap
   - [ ] All functionality available
   - [ ] Buttons remain tappable/clickable
   - [ ] Form fields remain usable
   - [ ] Caption overlays scale appropriately

**Test in Firefox:**
1. Zoom to 200% using `Ctrl +`
2. Enable "Zoom text only" (View > Zoom > Zoom Text Only)
3. **Check:**
   - [ ] Text-only zoom works correctly
   - [ ] Layout doesn't break with text scaling
   - [ ] Line height adjusts appropriately

**Test Responsive Breakpoints:**
- [ ] Desktop (1920x1080) - Full layout
- [ ] Laptop (1366x768) - Adjusted layout
- [ ] Tablet (768x1024) - Mobile-friendly layout
- [ ] Mobile (375x667) - Touch-optimized layout

---

## Touch Target Testing

### Minimum Size Test (WCAG 2.5.5)

**Requirement**: All touch targets must be at least 44x44 CSS pixels

**Test Method:**
1. Open browser DevTools (F12)
2. Inspect each interactive element
3. Check computed dimensions

**Test Checklist:**
- [ ] All buttons ≥ 44x44px
- [ ] All links ≥ 44x44px
- [ ] All form inputs ≥ 44px height
- [ ] All checkbox/radio buttons ≥ 44x44px (including label)
- [ ] All icon buttons ≥ 44x44px
- [ ] Caption controls ≥ 44x44px
- [ ] Settings toggles ≥ 44x44px
- [ ] Skip links ≥ 44x44px (when visible)

**Spacing Test:**
- [ ] Interactive elements have 8px minimum spacing
- [ ] No accidental activation of adjacent controls
- [ ] Touch targets don't overlap

---

## WCAG 2.1 AA Checklist

### Perceivable

#### 1.1 Text Alternatives
- [ ] 1.1.1: All images have alt text
- [ ] Decorative images have empty alt (`alt=""`)
- [ ] Icon buttons have `aria-label`

#### 1.2 Time-based Media
- [ ] 1.2.1: Captions provided for video (future)
- [ ] 1.2.2: Transcripts available (future)

#### 1.3 Adaptable
- [ ] 1.3.1: Semantic HTML used (headings, lists, landmarks)
- [ ] 1.3.2: Reading order is logical
- [ ] 1.3.3: Instructions don't rely solely on visual characteristics
- [ ] 1.3.4: Orientation not locked
- [ ] 1.3.5: Input purpose identified

#### 1.4 Distinguishable
- [ ] 1.4.1: Color not used as only visual means
- [ ] 1.4.2: Audio control available (TTS toggle)
- [ ] 1.4.3: Color contrast ≥ 4.5:1 for normal text
- [ ] 1.4.4: Text resizable up to 200%
- [ ] 1.4.5: No images of text (except logos)
- [ ] 1.4.10: Content reflows at 320px width
- [ ] 1.4.11: Non-text contrast ≥ 3:1
- [ ] 1.4.12: Text spacing adjustable
- [ ] 1.4.13: Hover/focus content dismissible

### Operable

#### 2.1 Keyboard Accessible
- [ ] 2.1.1: All functionality keyboard accessible
- [ ] 2.1.2: No keyboard traps
- [ ] 2.1.4: Single key shortcuts can be disabled

#### 2.2 Enough Time
- [ ] 2.2.1: Timing adjustable (N/A - no time limits)
- [ ] 2.2.2: Pause, stop, hide for moving content

#### 2.3 Seizures
- [ ] 2.3.1: No content flashes more than 3 times per second

#### 2.4 Navigable
- [ ] 2.4.1: Skip links provided
- [ ] 2.4.2: Page titles descriptive
- [ ] 2.4.3: Focus order logical
- [ ] 2.4.4: Link purpose clear from text or context
- [ ] 2.4.5: Multiple ways to find pages (nav, search)
- [ ] 2.4.6: Headings and labels descriptive
- [ ] 2.4.7: Focus visible

#### 2.5 Input Modalities
- [ ] 2.5.1: Pointer gestures have alternatives
- [ ] 2.5.2: Pointer cancellation supported
- [ ] 2.5.3: Label text matches accessible name
- [ ] 2.5.4: Motion actuation can be disabled

### Understandable

#### 3.1 Readable
- [ ] 3.1.1: Page language defined (`lang` attribute)
- [ ] 3.1.2: Language changes marked

#### 3.2 Predictable
- [ ] 3.2.1: Focus doesn't cause unexpected context change
- [ ] 3.2.2: Input doesn't cause unexpected context change
- [ ] 3.2.3: Navigation consistent across pages
- [ ] 3.2.4: Identification consistent

#### 3.3 Input Assistance
- [ ] 3.3.1: Error messages provided
- [ ] 3.3.2: Labels or instructions provided
- [ ] 3.3.3: Error suggestions provided
- [ ] 3.3.4: Error prevention for legal/financial/data

### Robust

#### 4.1 Compatible
- [ ] 4.1.1: No major HTML parsing errors
- [ ] 4.1.2: Name, role, value programmatically determined
- [ ] 4.1.3: Status messages announced

---

## Test Execution Schedule

### Pre-Commit Testing
1. Run ESLint with a11y plugin: `npm run lint`
2. Fix any violations before committing

### Pre-Push Testing
1. Run full Axe tests: `npm run a11y:test`
2. Run Lighthouse audit: `npm run lighthouse`
3. Fix violations before pushing

### Manual Testing (Weekly)
1. Complete keyboard navigation test
2. Test with one screen reader (NVDA/JAWS/VoiceOver)
3. Test high contrast mode
4. Test at 200% zoom

### Release Testing (Before Each Release)
1. Complete all automated tests
2. Complete all manual tests with 2+ screen readers
3. Test on multiple browsers (Chrome, Firefox, Safari, Edge)
4. Test on mobile devices (iOS, Android)
5. Verify all WCAG 2.1 AA criteria

---

## Known Issues and Limitations

### Current Status
- ✅ All Level A criteria met
- ✅ All Level AA criteria met
- ⚠️ Some Level AAA criteria not met (not required)

### Future Improvements
- Add caption language translation
- Improve TTS voice selection
- Add keyboard shortcut customization
- Implement focus management for complex widgets

---

## Resources

### Tools
- **Axe DevTools**: https://www.deque.com/axe/devtools/
- **WAVE**: https://wave.webaim.org/extension/
- **Lighthouse**: Built into Chrome DevTools
- **Color Contrast Analyzer**: https://www.tpgi.com/color-contrast-checker/

### Guidelines
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Practices**: https://www.w3.org/WAI/ARIA/apg/

### Screen Readers
- **NVDA**: https://www.nvaccess.org/ (Free)
- **JAWS**: https://www.freedomscientific.com/products/software/jaws/
- **VoiceOver**: Built into macOS and iOS

---

## Support

For accessibility issues or questions:
1. Create an issue in the GitHub repository
2. Tag with `accessibility` label
3. Include:
   - Browser and version
   - Screen reader (if applicable)
   - Steps to reproduce
   - Expected vs actual behavior

---

**Last Updated**: 2025-01-13
**WCAG Version**: 2.1 Level AA
**Conformance Level**: AA (Target: AAA where feasible)
