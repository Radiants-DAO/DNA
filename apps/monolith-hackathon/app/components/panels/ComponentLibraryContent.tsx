'use client';

import CrtAccordion from '../CrtAccordion';
import CrtTabs from '../CrtTabs';
import { AnimatedSubtitle } from '../AnimatedSubtitle';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';

// ============================================================================
// Helpers
// ============================================================================

function Section({ title, value, children }: { title: string; value: string; children: React.ReactNode }) {
  return (
    <CrtAccordion.Item value={value}>
      <CrtAccordion.Trigger>{title}</CrtAccordion.Trigger>
      <CrtAccordion.Content>{children}</CrtAccordion.Content>
    </CrtAccordion.Item>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[0.5em] mb-[1em]">
      <code className="font-mono text-[0.75em] text-[var(--panel-accent-65)] uppercase">{label}</code>
      <div className="flex flex-wrap items-center gap-[0.5em]">
        {children}
      </div>
    </div>
  );
}

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3,4H5V5H6V6H7V7H9V6H10V5H11V4H13V6H12V7H11V8H10V10H11V11H12V12H13V14H11V13H10V12H9V11H7V12H6V13H5V14H3V12H4V11H5V10H6V8H5V7H4V6H3V4Z" />
    </svg>
  );
}

function DiscordIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M0 7.79963H2.59998V2.59982H5.19995V-1.33514e-05H10.4V2.59982H7.79993V5.19966H18.2001V2.59982H15.6V-1.33514e-05H20.8V2.59982H23.4V7.79963H26V20.7989H23.4V23.3989H15.6V20.7989H10.4V23.3989H2.59998V20.7989H0V7.79963ZM15.6 10.3995H18.2001V15.5993H15.6V10.3995ZM10.4 10.3995H7.79993V15.5993H10.4V10.3995Z" />
    </svg>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ComponentLibraryContent() {
  return (
    <>
      <CrtAccordion type="multiple" defaultValue={['actions']}>
        <Section title="Action Controls (In Use)" value="actions">
          <Row label="hero cta (.button_mono)">
            <button type="button" className="button_mono">
              Get Started
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 127 2" fill="currentColor" className="svg-line">
                <rect y="0.5" width="127" height="1" fill="currentColor" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" viewBox="0 0 8 10" fill="currentColor" className="icon-arrow">
                <path d="M0 5H1.00535V5.75536H0V5ZM1.00535 4.24465H2.0107V5H1.00535V4.24465ZM1.00535 5H2.0107V5.75536H1.00535V5ZM1.00535 8.00536H2.0107V8.74465H1.00535V8.00536ZM1.00535 8.74465H2.0107V9.5H1.00535V8.74465ZM2.0107 3.50536H2.99465V4.24465H2.0107V3.50536ZM2.0107 4.24465H2.99465V5H2.0107V4.24465ZM2.0107 5H2.99465V5.75536H2.0107V5ZM2.0107 6.49465H2.99465V7.25H2.0107V6.49465ZM2.0107 7.25H2.99465V8.00536H2.0107V7.25ZM2.0107 8.00536H2.99465V8.74465H2.0107V8.00536ZM2.99465 2.75H4V3.50536H2.99465V2.75ZM2.99465 3.50536H4V4.24465H2.99465V3.50536ZM2.99465 4.24465H4V5H2.99465V4.24465ZM2.99465 5H4V5.75536H2.99465V5ZM2.99465 5.75536H4V6.49465H2.99465V5.75536ZM2.99465 6.49465H4V7.25H2.99465V6.49465ZM2.99465 7.25H4V8.00536H2.99465V7.25ZM4 1.99465H5.00535V2.75H4V1.99465ZM4 2.75H5.00535V3.50536H4V2.75ZM4 3.50536H5.00535V4.24465H4V3.50536ZM4 4.24465H5.00535V5H4V4.24465ZM4 5H5.00535V5.75536H4V5ZM4 5.75536H5.00535V6.49465H4V5.75536ZM4 6.49465H5.00535V7.25H4V6.49465ZM5.00535 1.25536H5.9893V1.99465H5.00535V1.25536ZM5.00535 1.99465H5.9893V2.75H5.00535V1.99465ZM5.00535 2.75H5.9893V3.50536H5.00535V2.75ZM5.00535 4.24465H5.9893V5H5.00535V4.24465ZM5.00535 5H5.9893V5.75536H5.00535V5ZM5.00535 5.75536H5.9893V6.49465H5.00535V5.75536ZM5.9893 0.5H6.99465V1.25536H5.9893V0.5ZM5.9893 1.25536H6.99465V1.99465H5.9893V1.25536ZM5.9893 4.24465H6.99465V5H5.9893V4.24465ZM5.9893 5H6.99465V5.75536H5.9893V5ZM6.99465 4.24465H8V5H6.99465V4.24465Z" />
              </svg>
            </button>
          </Row>

          <Row label="window controls (.close_button / .close_button--amber)">
            <button type="button" className="close_button" aria-label="Close">
              <CloseIcon size={16} />
              <span className="close-button-tooltip">Close</span>
            </button>
            <a
              href="https://discord.gg/radiants"
              target="_blank"
              rel="noopener noreferrer"
              className="close_button close_button--amber"
              aria-label="Discord"
              style={{ textDecoration: 'none' }}
            >
              <DiscordIcon size={16} />
              <span className="close-button-tooltip">Discord</span>
            </a>
          </Row>

          <Row label="footer cta (.modal-cta-button)">
            <a
              href="https://align.nexus/organizations/8b216ce8-dd0e-4f96-85a1-0d95ba3022e2/hackathons/6unDGXkWmY1Yw99SsKMt6pPCQTpSSQh5kSiJRgqTwHXE"
              target="_blank"
              rel="noopener noreferrer"
              className="modal-cta-button modal-cta-magma"
              style={{ textDecoration: 'none', maxWidth: '20em' }}
            >
              Submit Your Project
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 127 2" fill="currentColor" className="svg-line">
                <rect y="0.5" width="127" height="1" fill="currentColor" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="12" viewBox="0 0 8 10" fill="currentColor" className="icon-arrow">
                <path d="M0 5H8V6H0V5Z" />
              </svg>
            </a>
            <a
              href="https://docs.solanamobile.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="modal-cta-button modal-cta-secondary"
              style={{ textDecoration: 'none', flex: '0 0 auto' }}
            >
              Docs
            </a>
          </Row>
        </Section>

        <Section title="Panel Patterns (In Use)" value="panel-patterns">
          <Row label="resource cards and event links">
            <div className="w-full max-w-[28em] flex flex-col gap-[0.5em]">
              <a
                href="https://docs.solanamobile.com/react-native/quickstart"
                target="_blank"
                rel="noopener noreferrer"
                className="resource-item resource-item--link"
              >
                <span className="resource-link">Quickstart Template</span>
                <p className="resource-description">
                  Styled link cards used throughout TOOLBOX.exe resources.
                </p>
              </a>
              <div className="workshop-card">
                <div className="workshop-card-header">
                  <span className="cal-dot" style={{ background: '#fd8f3a' }} />
                  <span className="resource-link">Vibecoding Session</span>
                  <span className="panel-muted" style={{ marginLeft: 'auto' }}>Feb 17</span>
                </div>
                <p className="resource-description">
                  Workshop cards and calendar rows reuse the same action-link style.
                </p>
                <div className="workshop-card-links">
                  <a
                    href="https://x.com/i/broadcasts/1rmxPvymkEZGN"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cal-event-link"
                  >
                    Watch
                  </a>
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cal-event-link"
                  >
                    + Google Calendar
                  </a>
                </div>
              </div>
            </div>
          </Row>

          <Row label="window chrome (taskbar + controls)">
            <div className="w-full max-w-[28em] border border-[var(--panel-accent-20)]">
              <div className="taskbar_wrap">
                <div className="taskbar_title">
                  <span className="taskbar_text">TOOLBOX.EXE</span>
                </div>
                <div className="taskbar_lines-wrap">
                  <div className="taskbar_line" />
                  <div className="taskbar_line" />
                </div>
                <div className="taskbar_button-wrap">
                  <button type="button" className="close_button" aria-label="Close">
                    <CloseIcon size={16} />
                    <span className="close-button-tooltip">Close</span>
                  </button>
                </div>
              </div>
            </div>
          </Row>
        </Section>

        <Section title="Navigation Components (In Use)" value="navigation">
          <Row label="CrtTabs (toolbox and legal panels)">
            <div className="w-full">
              <CrtTabs defaultValue="overview">
                <CrtTabs.List>
                  <CrtTabs.Trigger value="overview">Overview</CrtTabs.Trigger>
                  <CrtTabs.Trigger value="resources">Resources</CrtTabs.Trigger>
                  <CrtTabs.Trigger value="faq">FAQ</CrtTabs.Trigger>
                </CrtTabs.List>
                <CrtTabs.Content value="overview">
                  <p className="text-sub text-[0.875em]">
                    Same tab treatment used by TOOLBOX.exe and LEGAL.exe.
                  </p>
                </CrtTabs.Content>
                <CrtTabs.Content value="resources">
                  <p className="text-sub text-[0.875em]">
                    Active tabs get the accented CRT bevel state.
                  </p>
                </CrtTabs.Content>
                <CrtTabs.Content value="faq">
                  <p className="text-sub text-[0.875em]">
                    Tab switching mirrors the in-window content layout.
                  </p>
                </CrtTabs.Content>
              </CrtTabs>
            </div>
          </Row>

          <Row label="CrtAccordion (faq and nested resources)">
            <div className="w-full">
              <CrtAccordion type="single" collapsible defaultValue="faq-1">
                <CrtAccordion.Item value="faq-1">
                  <CrtAccordion.Trigger>How do I join?</CrtAccordion.Trigger>
                  <CrtAccordion.Content>
                    Connect your wallet and register through Align from the main panel.
                  </CrtAccordion.Content>
                </CrtAccordion.Item>
                <CrtAccordion.Item value="faq-2">
                  <CrtAccordion.Trigger>Do I need a Seeker?</CrtAccordion.Trigger>
                  <CrtAccordion.Content>
                    No - any Android device works for local testing during the hackathon.
                  </CrtAccordion.Content>
                </CrtAccordion.Item>
              </CrtAccordion>
            </div>
          </Row>
        </Section>

        <Section title="Hero Animation (In Use)" value="hero-animation">
          <Row label="AnimatedSubtitle (home + embed routes)">
            <AnimatedSubtitle />
          </Row>
        </Section>

        <Section title="Composable Components" value="composable">
          <Row label="Button — primary">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Primary</Button>
            <Button variant="primary" size="lg">Large</Button>
          </Row>

          <Row label="Button — secondary">
            <Button variant="secondary" size="sm">Small</Button>
            <Button variant="secondary" size="md">Secondary</Button>
            <Button variant="secondary" size="lg">Large</Button>
          </Row>

          <Row label="Button — outline">
            <Button variant="outline" size="sm">Small</Button>
            <Button variant="outline" size="md">Outline</Button>
            <Button variant="outline" size="lg">Large</Button>
          </Row>

          <Row label="Button — ghost">
            <Button variant="ghost" size="sm">Small</Button>
            <Button variant="ghost" size="md">Ghost</Button>
            <Button variant="ghost" size="lg">Large</Button>
          </Row>

          <Row label="Button — mono (gradient)">
            <Button variant="mono" size="sm">Small</Button>
            <Button variant="mono" size="md">Mono</Button>
            <Button variant="mono" size="lg">Large</Button>
          </Row>

          <Row label="Button — states">
            <Button variant="secondary" loading>Loading</Button>
            <Button variant="secondary" disabled>Disabled</Button>
            <Button variant="primary" fullWidth>Full Width</Button>
          </Row>

          <Row label="Badge — variants">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </Row>

          <Row label="Badge — sizes">
            <Badge variant="default" size="sm">SM</Badge>
            <Badge variant="default" size="md">MD</Badge>
            <Badge variant="success" size="sm">SM</Badge>
            <Badge variant="success" size="md">MD</Badge>
          </Row>

          <Row label="Card — default">
            <div className="w-full max-w-[28em]">
              <Card variant="default">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[0.875em]">All subsystems operating within normal parameters.</p>
                </CardContent>
              </Card>
            </div>
          </Row>

          <Row label="Card — elevated">
            <div className="w-full max-w-[28em]">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Diagnostics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-2">
                    <Badge variant="success">Online</Badge>
                    <Badge variant="info">v2.1.0</Badge>
                  </div>
                  <p className="text-[0.875em]">Elevated card with stronger shadow depth.</p>
                </CardContent>
              </Card>
            </div>
          </Row>

          <Row label="Card — glass">
            <div className="w-full max-w-[28em]">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Transmission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[0.875em]">Glass variant with backdrop blur and hover glow.</p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="secondary" size="sm">Decline</Button>
                    <Button variant="primary" size="sm">Accept</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Row>
        </Section>
      </CrtAccordion>
    </>
  );
}
