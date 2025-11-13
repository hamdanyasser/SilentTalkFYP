import React, { useState } from 'react'
import {
  Button,
  Input,
  TextArea,
  Select,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Toast,
  Grid,
  GridItem,
  Stack,
} from '../design-system'
import '../design-system/tokens.css'
import './DesignSystem.css'

export const DesignSystem: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastVariant, setToastVariant] = useState<'success' | 'error' | 'warning' | 'info'>(
    'success',
  )

  const handleShowToast = (variant: typeof toastVariant) => {
    setToastVariant(variant)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 6000)
  }

  return (
    <div className="design-system-page">
      {/* Header */}
      <header className="ds-page-header">
        <Stack direction="column" gap={2} align="center">
          <h1>SilentTalk Design System</h1>
          <p>A comprehensive, accessible component library built with WCAG 2.1 AA compliance</p>
        </Stack>
      </header>

      <main className="ds-page-content" id="main-content">
        {/* Buttons Section */}
        <section className="ds-section">
          <h2 className="ds-section-title">Buttons</h2>

          <div className="ds-subsection">
            <h3>Variants</h3>
            <Stack direction="row" gap={3} wrap>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
            </Stack>
          </div>

          <div className="ds-subsection">
            <h3>Sizes</h3>
            <Stack direction="row" gap={3} align="center" wrap>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Stack>
          </div>

          <div className="ds-subsection">
            <h3>States</h3>
            <Stack direction="row" gap={3} wrap>
              <Button disabled>Disabled</Button>
              <Button isLoading loadingText="Loading...">
                Submit
              </Button>
              <Button leftIcon={<span>🔍</span>}>Search</Button>
              <Button rightIcon={<span>→</span>}>Next</Button>
            </Stack>
          </div>
        </section>

        {/* Inputs Section */}
        <section className="ds-section">
          <h2 className="ds-section-title">Inputs</h2>

          <Grid columns={2} gap={6}>
            <div className="ds-subsection">
              <h3>Default Variant</h3>
              <Stack gap={4}>
                <Input placeholder="Enter your name" aria-label="Name" />
                <Input placeholder="Search..." leftIcon={<span>🔍</span>} aria-label="Search" />
                <Input
                  placeholder="Error state"
                  hasError
                  aria-invalid="true"
                  aria-describedby="error-msg"
                />
                <span id="error-msg" style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>
                  This field is required
                </span>
              </Stack>
            </div>

            <div className="ds-subsection">
              <h3>Filled Variant</h3>
              <Stack gap={4}>
                <Input variant="filled" placeholder="Filled input" aria-label="Filled input" />
                <Input
                  variant="filled"
                  placeholder="Success state"
                  hasSuccess
                  aria-label="Success input"
                />
                <TextArea
                  variant="filled"
                  placeholder="Enter your message..."
                  rows={4}
                  aria-label="Message"
                />
              </Stack>
            </div>
          </Grid>

          <div className="ds-subsection">
            <h3>Sizes</h3>
            <Stack gap={4}>
              <Input size="sm" placeholder="Small input" aria-label="Small input" />
              <Input size="md" placeholder="Medium input" aria-label="Medium input" />
              <Input size="lg" placeholder="Large input" aria-label="Large input" />
            </Stack>
          </div>
        </section>

        {/* Select Section */}
        <section className="ds-section">
          <h2 className="ds-section-title">Select</h2>

          <Grid columns={3} gap={6}>
            <Select
              placeholder="Select an option"
              aria-label="Default select"
              options={[
                { value: '1', label: 'Option 1' },
                { value: '2', label: 'Option 2' },
                { value: '3', label: 'Option 3' },
              ]}
            />

            <Select
              variant="filled"
              placeholder="Filled select"
              aria-label="Filled select"
              options={[
                { value: 'a', label: 'Option A' },
                { value: 'b', label: 'Option B' },
              ]}
            />

            <Select
              size="lg"
              placeholder="Large select"
              aria-label="Large select"
              options={[
                { value: 'x', label: 'Option X' },
                { value: 'y', label: 'Option Y' },
              ]}
            />
          </Grid>
        </section>

        {/* Modal Section */}
        <section className="ds-section">
          <h2 className="ds-section-title">Modal</h2>

          <Stack direction="row" gap={3} wrap>
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          </Stack>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Example Modal"
            size="md"
          >
            <ModalHeader>
              <h2>Confirm Action</h2>
            </ModalHeader>
            <ModalBody>
              <p>
                This is an example modal with focus trapping, backdrop click-to-close, and ESC key
                support. Try navigating with Tab and pressing ESC to close.
              </p>
              <p>The modal is fully accessible with ARIA attributes and screen reader support.</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                Confirm
              </Button>
            </ModalFooter>
          </Modal>
        </section>

        {/* Toast Section */}
        <section className="ds-section">
          <h2 className="ds-section-title">Toast Notifications</h2>

          <Stack direction="row" gap={3} wrap>
            <Button variant="success" onClick={() => handleShowToast('success')}>
              Show Success
            </Button>
            <Button variant="danger" onClick={() => handleShowToast('error')}>
              Show Error
            </Button>
            <Button variant="secondary" onClick={() => handleShowToast('warning')}>
              Show Warning
            </Button>
            <Button variant="outline" onClick={() => handleShowToast('info')}>
              Show Info
            </Button>
          </Stack>

          {showToast && (
            <Toast
              variant={toastVariant}
              title={`${toastVariant.charAt(0).toUpperCase() + toastVariant.slice(1)} Notification`}
              description="This is an example toast notification with auto-dismiss after 5 seconds."
              duration={5000}
              isClosable
              onClose={() => setShowToast(false)}
              position="top-right"
            />
          )}
        </section>

        {/* Layout Section */}
        <section className="ds-section">
          <h2 className="ds-section-title">Layout Primitives</h2>

          <div className="ds-subsection">
            <h3>Grid</h3>
            <Grid columns={4} gap={4}>
              <div className="ds-demo-box">1</div>
              <div className="ds-demo-box">2</div>
              <div className="ds-demo-box">3</div>
              <div className="ds-demo-box">4</div>
              <GridItem colSpan={2}>
                <div className="ds-demo-box">Span 2</div>
              </GridItem>
              <GridItem colSpan={2}>
                <div className="ds-demo-box">Span 2</div>
              </GridItem>
            </Grid>
          </div>

          <div className="ds-subsection">
            <h3>Stack (Row)</h3>
            <Stack direction="row" gap={4} wrap>
              <div className="ds-demo-box">Item 1</div>
              <div className="ds-demo-box">Item 2</div>
              <div className="ds-demo-box">Item 3</div>
            </Stack>
          </div>

          <div className="ds-subsection">
            <h3>Stack (Column)</h3>
            <Stack direction="column" gap={4}>
              <div className="ds-demo-box">Item 1</div>
              <div className="ds-demo-box">Item 2</div>
              <div className="ds-demo-box">Item 3</div>
            </Stack>
          </div>
        </section>

        {/* Design Tokens Section */}
        <section className="ds-section">
          <h2 className="ds-section-title">Design Tokens</h2>

          <div className="ds-subsection">
            <h3>Colors</h3>
            <Grid columns={6} gap={3}>
              <div className="ds-color-swatch" style={{ backgroundColor: 'var(--color-blue-500)' }}>
                Blue 500
              </div>
              <div
                className="ds-color-swatch"
                style={{ backgroundColor: 'var(--color-green-500)' }}
              >
                Green 500
              </div>
              <div className="ds-color-swatch" style={{ backgroundColor: 'var(--color-red-500)' }}>
                Red 500
              </div>
              <div
                className="ds-color-swatch"
                style={{ backgroundColor: 'var(--color-yellow-500)' }}
              >
                Yellow 500
              </div>
              <div className="ds-color-swatch" style={{ backgroundColor: 'var(--color-cyan-500)' }}>
                Cyan 500
              </div>
              <div
                className="ds-color-swatch"
                style={{ backgroundColor: 'var(--color-purple-500)' }}
              >
                Purple 500
              </div>
            </Grid>
          </div>

          <div className="ds-subsection">
            <h3>Typography</h3>
            <Stack gap={3}>
              <div style={{ fontSize: 'var(--font-size-xs)' }}>Extra Small (12px)</div>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>Small (14px)</div>
              <div style={{ fontSize: 'var(--font-size-base)' }}>Base (16px)</div>
              <div style={{ fontSize: 'var(--font-size-lg)' }}>Large (18px)</div>
              <div style={{ fontSize: 'var(--font-size-xl)' }}>Extra Large (20px)</div>
              <div style={{ fontSize: 'var(--font-size-2xl)' }}>2XL (24px)</div>
            </Stack>
          </div>

          <div className="ds-subsection">
            <h3>Spacing Scale</h3>
            <Stack gap={2}>
              <div className="ds-spacing-demo" style={{ width: 'var(--spacing-2)' }}>
                2 (8px)
              </div>
              <div className="ds-spacing-demo" style={{ width: 'var(--spacing-4)' }}>
                4 (16px)
              </div>
              <div className="ds-spacing-demo" style={{ width: 'var(--spacing-6)' }}>
                6 (24px)
              </div>
              <div className="ds-spacing-demo" style={{ width: 'var(--spacing-8)' }}>
                8 (32px)
              </div>
            </Stack>
          </div>
        </section>

        {/* Accessibility Features */}
        <section className="ds-section">
          <h2 className="ds-section-title">Accessibility Features</h2>

          <Stack gap={4}>
            <div className="ds-info-box">
              <h3>✅ Keyboard Navigation</h3>
              <p>
                All components are fully keyboard accessible. Press Tab to navigate between
                elements.
              </p>
            </div>

            <div className="ds-info-box">
              <h3>✅ Focus Indicators</h3>
              <p>Visible focus indicators on all interactive elements (WCAG 2.4.7)</p>
            </div>

            <div className="ds-info-box">
              <h3>✅ Color Contrast</h3>
              <p>All text meets WCAG 2.1 AA contrast ratios (4.5:1 minimum)</p>
            </div>

            <div className="ds-info-box">
              <h3>✅ Touch Targets</h3>
              <p>Minimum 44×44px touch targets (WCAG 2.5.5)</p>
            </div>

            <div className="ds-info-box">
              <h3>✅ High Contrast Mode</h3>
              <p>Use the accessibility panel (♿ button) to enable high contrast mode</p>
            </div>

            <div className="ds-info-box">
              <h3>✅ Screen Reader Support</h3>
              <p>All components have proper ARIA labels and live regions</p>
            </div>
          </Stack>
        </section>
      </main>
    </div>
  )
}

export default DesignSystem
