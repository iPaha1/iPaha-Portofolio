// =============================================================================
// PRIVACY POLICY PAGE
// app/privacy/page.tsx
//
// Full, comprehensive privacy policy covering all platform services.
// Server component with complete SEO metadata.
// =============================================================================

import type { Metadata } from "next";
import Link from "next/link";

// ── SEO ───────────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Privacy Policy | Isaac Paha",
  description:
    "How Isaac Paha and iPaha Ltd collect, use, and protect your personal data across games, AI tools, and services. Your privacy rights and data practices explained.",
  alternates: { canonical: "https://www.isaacpaha.com/privacy" },
  robots: { index: true, follow: true },
};

// ── Data ──────────────────────────────────────────────────────────────────────
const LAST_UPDATED = "1 January 2026";
const EFFECTIVE = "1 January 2026";
const OPERATOR = "Isaac Paha / iPaha Ltd";
const CONTACT_EMAIL = "privacy@ipahait.com";
const DPO_EMAIL = "dpo@ipahait.com";
const PLATFORM_URL = "https://www.isaacpaha.com";
const COMPANY_URL = "https://ipaha.co.uk";

const SECTIONS = [
  {
    id: "1",
    title: "Introduction & Commitment",
    content: `
This Privacy Policy explains how Isaac Paha and iPaha Ltd ("we", "us", "our") collect, use, disclose, and protect your personal information when you use our website, games, AI tools, and related services ("Platform").

We are committed to protecting your privacy and handling your data in an open and transparent manner. This platform was built with a genuine respect for your privacy — your data belongs to you, and we only collect what's necessary to provide and improve our services.

By using the Platform, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with any part of this policy, please do not use our services.

We comply with:
    • UK General Data Protection Regulation (UK GDPR)
    • Data Protection Act 2018
    • EU General Data Protection Regulation (EU GDPR) for users in the European Union
    • California Consumer Privacy Act (CCPA) for California residents
    • Other applicable privacy laws worldwide
    `.trim(),
  },
  {
    id: "2",
    title: "Data Controller Information",
    content: `
Data Controller:    ${OPERATOR}
Legal Entity:       iPaha Ltd
Registered Address: England and Wales
Contact Email:      ${CONTACT_EMAIL}
Data Protection Officer: ${DPO_EMAIL}

If you have any questions about how we handle your personal data, please contact our Data Protection Officer at ${DPO_EMAIL}. We aim to respond to all privacy enquiries within 30 days.
    `.trim(),
  },
  {
    id: "3",
    title: "What Personal Data We Collect",
    content: `
We collect different types of personal data depending on how you interact with our Platform:

3.1 ACCOUNT DATA (when you register):
    • Name (first and last)
    • Email address
    • Username
    • Password (hashed and encrypted)
    • Profile picture (if uploaded)
    • Account creation date and last login time
    • Authentication provider information (if using Clerk)

3.2 USAGE DATA (automatically collected):
    • IP address and approximate location (city/country level)
    • Browser type and version
    • Operating system
    • Device information
    • Pages visited and time spent
    • Referral source (how you found us)
    • Clickstream data
    • Features used and frequency of use

3.3 GAME DATA:
    • Game scores and statistics
    • Token balances and transaction history
    • Game participation records
    • Achievement data
    • Multiplayer match history
    • Leaderboard entries
    • Game settings and preferences

3.4 AI TOOL DATA:
    • Input text, prompts, and queries
    • Generated outputs
    • Tool usage frequency and patterns
    • Feedback provided on tool outputs
    • Token consumption records
    • Uploaded files (temporarily for processing)

3.5 COMMUNICATION DATA:
    • Messages sent through contact forms
    • Support ticket content
    • Feedback and survey responses
    • Comments on blog posts
    • Newsletter subscriptions and engagement
    • Email correspondence with our team

3.6 COOKIE DATA:
    • Session information
    • Authentication tokens
    • Preference settings
    • Analytics identifiers
    • Advertising identifiers (if applicable)

3.7 PAYMENT DATA:
    • For token purchases: processed through Stripe (we do not store full payment details)
    • Transaction amounts and dates
    • Billing information (as required by Stripe)
    • Cash-out records (PayPal email addresses)

3.8 SENSITIVE DATA:
We do not intentionally collect sensitive personal data (health information, political opinions, religious beliefs, sexual orientation, etc.). If you inadvertently provide such information in tool inputs or comments, please contact us at ${CONTACT_EMAIL} and we will remove it.
    `.trim(),
  },
  {
    id: "4",
    title: "How We Collect Your Data",
    content: `
We collect personal data through the following methods:

4.1 DIRECT INTERACTIONS:
    • When you create an account
    • When you use games or AI tools
    • When you submit contact forms or feedback
    • When you comment on articles
    • When you subscribe to newsletters
    • When you participate in surveys
    • When you request support
    • When you cash out tokens

4.2 AUTOMATED TECHNOLOGIES:
    • Cookies and similar tracking technologies
    • Server logs and analytics tools
    • Web beacons and pixels
    • Local storage and session storage
    • Performance monitoring tools

4.3 THIRD-PARTY SOURCES:
    • Clerk (authentication data)
    • Stripe (payment confirmation data)
    • PayPal (cash-out recipient data)
    • Analytics providers (aggregated usage patterns)
    • Social media (if you sign in through social accounts)
    • Referral programs (referrer information)
    `.trim(),
  },
  {
    id: "5",
    title: "Legal Basis for Processing",
    content: `
We process your personal data based on the following legal grounds:

5.1 CONTRACTUAL NECESSITY:
Processing is necessary for the performance of a contract with you, including:
    • Creating and managing your account
    • Providing games and tools you access
    • Processing token transactions
    • Enabling multiplayer features
    • Delivering cash-out payments

5.2 LEGITIMATE INTERESTS:
We process data based on our legitimate interests, balanced against your rights:
    • Improving and optimising our services
    • Preventing fraud and abuse
    • Securing the Platform against threats
    • Analyzing usage patterns to enhance user experience
    • Direct marketing (with opt-out option)
    • Conducting research and development

5.3 LEGAL OBLIGATIONS:
Processing necessary to comply with legal requirements:
    • Tax and accounting obligations
    • Responding to lawful requests from authorities
    • Fraud prevention and detection
    • Data breach notifications

5.4 CONSENT:
Where required, we obtain your explicit consent for:
    • Marketing communications
    • Non-essential cookies
    • Special category data processing
    • Data sharing with certain third parties

You have the right to withdraw consent at any time without affecting the lawfulness of processing based on consent before withdrawal.
    `.trim(),
  },
  {
    id: "6",
    title: "How We Use Your Data",
    content: `
We use your personal data for the following purposes:

6.1 SERVICE PROVISION:
    • Creating and managing your account
    • Authenticating your identity
    • Processing game actions and token transactions
    • Generating AI tool outputs
    • Saving your preferences and settings
    • Providing customer support
    • Processing cash-out requests

6.2 SERVICE IMPROVEMENT:
    • Analyzing usage patterns to improve features
    • Debugging and fixing technical issues
    • Training and improving AI models (anonymized data)
    • A/B testing new features
    • Optimising performance and load times

6.3 SECURITY AND FRAUD PREVENTION:
    • Detecting and preventing cheating in games
    • Identifying and blocking abusive behaviour
    • Monitoring for security threats
    • Enforcing terms of service
    • Investigating suspicious activities

6.4 COMMUNICATIONS:
    • Sending service updates and announcements
    • Responding to your inquiries
    • Sending newsletters (with opt-out)
    • Notifying you of important changes
    • Sending token balance alerts

6.5 MARKETING:
    • Personalising your experience
    • Showing relevant content recommendations
    • Running promotional campaigns
    • Analyzing marketing effectiveness

6.6 COMPLIANCE:
    • Meeting legal and regulatory requirements
    • Responding to legal requests
    • Maintaining records for audit purposes
    • Protecting our legal rights
    `.trim(),
  },
  {
    id: "7",
    title: "Data Retention",
    content: `
We retain your personal data for different periods depending on the type of data and purpose:

7.1 ACCOUNT DATA: Retained while your account is active. After account deletion, we retain:
    • Anonymized usage data for analytics (indefinitely)
    • Transaction records for tax purposes (7 years)
    • Fraud prevention records (3 years)
    • Limited logs for security (30 days)

7.2 GAME DATA: 
    • Game statistics and scores: retained indefinitely for leaderboards and history
    • Token transactions: retained for 7 years for financial records
    • Game participation logs: retained for 12 months
    • Anti-cheat records: retained for 24 months

7.3 AI TOOL DATA:
    • Inputs and outputs: retained for up to 90 days for quality improvement
    • Anonymized data for model training: retained indefinitely
    • Usage logs: retained for 30 days
    • Feedback data: retained for 24 months

7.4 COMMUNICATION DATA:
    • Support tickets: retained for 3 years after resolution
    • Comments: retained until account deletion
    • Newsletter data: retained until unsubscription
    • Contact form submissions: retained for 12 months

7.5 COOKIE DATA:
    • Session cookies: deleted when browser is closed
    • Persistent cookies: retained for up to 24 months
    • Analytics cookies: retained according to provider policies

7.6 ACCOUNT DELETION:
When you delete your account:
    • Personal identifiers are removed or anonymized
    • Token balances are forfeited
    • Game history is anonymized
    • AI tool inputs are deleted
    • Comments remain but are attributed to "Deleted User"
    • Transaction records are retained for legal compliance

You can request account deletion at any time through account settings or by emailing ${CONTACT_EMAIL}.
    `.trim(),
  },
  {
    id: "8",
    title: "Data Sharing & Third Parties",
    content: `
We do not sell your personal data. We share data only in the following circumstances:

8.1 SERVICE PROVIDERS:
We use trusted third-party services to operate the Platform:
    • Clerk: Authentication and user management
    • Vercel: Hosting and infrastructure
    • Neon: Database hosting
    • Stripe: Payment processing (token purchases)
    • PayPal: Cash-out payments
    • OpenAI/Anthropic: AI model providers (for tool generation)
    • Sentry: Error tracking and debugging
    • Google Analytics: Usage analytics (anonymized)
    • Cloudflare: Security and CDN services

These providers are contractually bound to protect your data and only process it according to our instructions.

8.2 LEGAL REQUIREMENTS:
We may disclose your data if required by law, court order, or government request, or to:
    • Protect our rights and property
    • Prevent fraud or abuse
    • Ensure safety and security of the Platform
    • Enforce our terms of service

8.3 BUSINESS TRANSFERS:
If we are involved in a merger, acquisition, or asset sale, your data may be transferred. We will notify you before your data becomes subject to a different privacy policy.

8.4 AGGREGATED DATA:
We may share anonymized, aggregated statistical data with partners, researchers, or publicly. This data cannot identify individual users.
    `.trim(),
  },
  {
    id: "9",
    title: "International Data Transfers",
    content: `
Your personal data may be transferred to and processed in countries outside the UK and European Economic Area (EEA), including:
    • United States (for Clerk, Vercel, OpenAI, Stripe, PayPal, Cloudflare)
    • Various cloud infrastructure locations

When transferring data internationally, we ensure appropriate safeguards are in place:
    • Standard Contractual Clauses (SCCs) approved by the European Commission
    • UK International Data Transfer Agreement (IDTA) where applicable
    • Data processing agreements with all service providers
    • Adequacy decisions for countries with equivalent protection

You can request details of these safeguards by contacting our DPO at ${DPO_EMAIL}.
    `.trim(),
  },
  {
    id: "10",
    title: "Your Privacy Rights",
    content: `
Depending on your location, you have the following rights regarding your personal data:

10.1 FOR ALL USERS:
    • Right to be informed: You have the right to know how we collect and use your data
    • Right to access: Request a copy of your personal data
    • Right to rectification: Correct inaccurate or incomplete data
    • Right to erasure: Request deletion of your data ("right to be forgotten")
    • Right to restrict processing: Limit how we use your data
    • Right to object: Object to processing based on legitimate interests
    • Right to data portability: Receive your data in a structured format

10.2 UK/EU RESIDENTS (under UK/EU GDPR):
    • Additional rights regarding automated decision-making
    • Right to lodge a complaint with your local supervisory authority
    • UK Supervisory Authority: Information Commissioner's Office (ICO) - www.ico.org.uk
    • EU Supervisory Authority: Your local Data Protection Authority

10.3 CALIFORNIA RESIDENTS (under CCPA/CPRA):
    • Right to know what personal information is collected
    • Right to delete personal information
    • Right to opt-out of sale or sharing of personal information
    • Right to non-discrimination for exercising rights
    • Right to correct inaccurate information
    • Right to limit use of sensitive personal information

10.4 EXERCISING YOUR RIGHTS:
To exercise any of these rights, please contact us at:
    • Email: ${CONTACT_EMAIL}
    • Subject: "Privacy Request - [Your Right]"
    • Provide your account email and verification details

We will respond to all requests within 30 days. Some requests may require identity verification to prevent unauthorized access to your data.
    `.trim(),
  },
  {
    id: "11",
    title: "Cookies & Tracking Technologies",
    content: `
We use cookies and similar technologies to enhance your experience:

11.1 ESSENTIAL COOKIES:
Required for the Platform to function:
    • Authentication cookies (Clerk)
    • Session management
    • Security tokens
    • Load balancing

11.2 FUNCTIONAL COOKIES:
Enable enhanced functionality:
    • Language and preference settings
    • Game state saving
    • Recently used tools
    • Dashboard customizations

11.3 ANALYTICS COOKIES:
Help us understand usage:
    • Google Analytics (anonymized)
    • Usage patterns and performance
    • Feature popularity
    • Error tracking

11.4 MARKETING COOKIES:
Used for targeted advertising (with consent):
    • Ad preferences
    • Campaign effectiveness
    • Retargeting (limited)

11.5 MANAGING COOKIES:
You can control cookies through:
    • Browser settings (block or delete)
    • Cookie consent banner on first visit
    • Privacy preferences in account settings
    • Browser extensions (like Privacy Badger)

Blocking essential cookies will prevent account login and game access.
    `.trim(),
  },
  {
    id: "12",
    title: "Children's Privacy",
    content: `
12.1 AGE LIMITS:
    • Games (non-wagering): Available to users 13+
    • AI Tools: Available to users 13+ with parental consent
    • Token Rush (wagering): Strictly 18+ only
    • Account creation: 13+ (with parental consent for minors)

12.2 VERIFICATION:
We do not knowingly collect personal data from children under 13. If we discover we have inadvertently collected such data, we will:
    • Delete it immediately
    • Notify the parent/guardian if contact details available
    • Cooperate with any investigation

12.3 PARENTAL CONTROLS:
Parents and guardians can:
    • Monitor their child's account activity
    • Request account deletion
    • Set usage limits through account settings
    • Contact us for additional controls

If you believe we have collected data from a child under 13, please contact us immediately at ${CONTACT_EMAIL}.
    `.trim(),
  },
  {
    id: "13",
    title: "Data Security",
    content: `
We implement robust security measures to protect your data:

13.1 TECHNICAL MEASURES:
    • Encryption in transit (TLS 1.3)
    • Encryption at rest (AES-256)
    • Hashing of passwords (bcrypt)
    • Regular security audits
    • Vulnerability scanning
    • Rate limiting and DDoS protection
    • Web Application Firewall (WAF)

13.2 ORGANIZATIONAL MEASURES:
    • Access controls (least privilege principle)
    • Staff security training
    • Incident response procedures
    • Regular backup systems
    • Third-party security assessments

13.3 BREACH PROCEDURES:
In the event of a data breach affecting your personal data:
    • We will notify affected users within 72 hours where legally required
    • Notify supervisory authorities as required
    • Provide guidance on protective actions
    • Investigate and implement remediation

13.4 YOUR RESPONSIBILITIES:
You play a crucial role in security:
    • Use a strong, unique password
    • Enable two-factor authentication (coming soon)
    • Log out on shared devices
    • Report suspicious activity immediately
    • Keep your email address current

No security system is 100% secure. If you have security concerns, please contact us immediately.
    `.trim(),
  },
  {
    id: "14",
    title: "AI Tools & Data Processing",
    content: `
Our AI tools have specific privacy considerations:

14.1 HOW AI PROCESSING WORKS:
    • Your inputs are sent to third-party AI providers (OpenAI, Anthropic)
    • Inputs are processed to generate outputs
    • We may store inputs and outputs for up to 90 days
    • Anonymized data may be used for model improvement

14.2 AI PROVIDER PRIVACY:
    • OpenAI: Data may be used for model improvement (with 30-day opt-out)
    • Anthropic: Data retained for 30 days, not used for training by default
    • See provider privacy policies for details

14.3 SENSITIVE DATA WARNING:
Do NOT input sensitive personal information (health, financial, identity documents) into AI tools unless explicitly required. AI outputs may contain errors and should not be relied upon for critical decisions.

14.4 DATA DELETION:
You can request deletion of your AI tool inputs by:
    • Contacting us at ${CONTACT_EMAIL}
    • Providing specific details to identify inputs
    • We will remove inputs from our systems (subject to third-party provider policies)

14.5 AI & AUTOMATED DECISION-MAKING:
We do not use AI for automated decisions that significantly affect you. All AI outputs are presented as suggestions, not decisions.
    `.trim(),
  },
  {
    id: "15",
    title: "Changes to This Privacy Policy",
    content: `
15.1 UPDATES:
We may update this Privacy Policy from time to time to reflect:
    • Changes in our practices
    • New features or services
    • Legal or regulatory requirements
    • Security improvements

15.2 NOTIFICATION:
Material changes will be notified by:
    • Email to registered users (30 days before effective date)
    • Banner notification on the Platform
    • Updated effective date at the top of this page

15.3 ACCEPTANCE:
Your continued use of the Platform after changes take effect constitutes acceptance of the updated policy. If you do not agree, you must stop using our services and delete your account.

15.4 HISTORICAL VERSIONS:
Previous versions of this Privacy Policy are available upon request by emailing ${CONTACT_EMAIL}.
    `.trim(),
  },
  {
    id: "16",
    title: "Contact Information",
    content: `
For any privacy-related questions, concerns, or requests:

PRIVACY ENQUIRIES:
    • Email: ${CONTACT_EMAIL}
    • Response time: Within 30 days
    • Please include: Your account email, nature of request, and any relevant details

DATA PROTECTION OFFICER:
    • Email: ${DPO_EMAIL}
    • For: Complex privacy issues, DPO-specific matters, formal complaints

SUPERVISORY AUTHORITY (UK):
    • Information Commissioner's Office (ICO)
    • Website: www.ico.org.uk
    • Phone: 0303 123 1113
    • Address: Wycliffe House, Water Lane, Wilmslow, SK9 5AF

SUPERVISORY AUTHORITY (EU):
    • Your local Data Protection Authority
    • See edpb.europa.eu for contact details

CALIFORNIA RESIDENTS:
    • Additional rights under CCPA/CPRA as described in Section 10

We take privacy seriously. If you're unsatisfied with our response, you have the right to lodge a complaint with your local supervisory authority.
    `.trim(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function AmbientBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.02) 1px,transparent 1px)",
        backgroundSize: "52px 52px",
      }} />
      {/* Soft blue nebula */}
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle,rgba(59,130,246,0.03) 0%,transparent 65%)", filter: "blur(60px)" }} />
      {/* Purple nebula */}
      <div className="absolute top-1/3 -left-20 w-[500px] h-[500px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle,rgba(139,92,246,0.02) 0%,transparent 65%)", filter: "blur(50px)" }} />
    </div>
  );
}

interface SectionProps {
  id: string;
  title: string;
  content: string;
}

function Section({ id, title, content }: SectionProps) {
  const paragraphs = content.split("\n\n").filter(Boolean);
  return (
    <section id={`section-${id}`} className="scroll-mt-8">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-xs flex items-center justify-center mt-0.5"
          style={{
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.2)",
          }}>
          <span className="text-[11px] font-black" style={{ color: "#3b82f6" }}>{id}</span>
        </div>
        <h2 className="text-lg font-black text-gray-900" style={{ letterSpacing: "-0.03em", lineHeight: 1.25 }}>
          {title}
        </h2>
      </div>

      <div className="ml-12 space-y-3">
        {paragraphs.map((para, i) => {
          const isSublist = para.trim().startsWith("(a)") || para.trim().startsWith("    (a)");
          if (isSublist) {
            const lines = para.split("\n").filter(Boolean);
            return (
              <div key={i} className="space-y-1.5">
                {lines.map((line, j) => {
                  const trimmed = line.trim();
                  const isItem = /^\([a-z0-9]\)/.test(trimmed);
                  return (
                    <div key={j} className="flex items-start gap-2.5">
                      {isItem && (
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: "#3b82f6" }} />
                      )}
                      <p className="text-sm leading-relaxed"
                        style={{ color: "#4b5563", marginLeft: isItem ? 0 : "1.125rem" }}>
                        {isItem ? trimmed.replace(/^\([a-z0-9]\)\s*/, "") : trimmed}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          }
          return (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "#4b5563" }}>
              {para}
            </p>
          );
        })}
      </div>

      <div className="mt-8 ml-12 h-px" style={{ background: "linear-gradient(90deg,#e5e7eb,transparent)" }} />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function PrivacyPage() {
  return (
    <div className="min-h-screen relative" style={{ background: "#ffffff", fontFamily: "'Sora', system-ui, sans-serif" }}>
      <AmbientBg />

      <div className="absolute top-0 left-0 right-0 h-[2.5px]"
        style={{ background: "linear-gradient(90deg,transparent,#3b82f6 30%,#8b5cf6 70%,transparent)" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        <div className="mb-12">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-6"
            style={{ color: "#9ca3af" }}>
            <Link href="/" style={{ color: "#9ca3af", textDecoration: "none" }}>Home</Link>
            <span>/</span>
            <span style={{ color: "#3b82f6" }}>Privacy</span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-[9px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-xs"
              style={{
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.2)",
                color: "#3b82f6",
              }}>
              Legal
            </span>
            <span className="text-[10px]" style={{ color: "#9ca3af" }}>
              Last updated: {LAST_UPDATED} · Effective: {EFFECTIVE}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4"
            style={{ letterSpacing: "-0.05em", lineHeight: 1.05 }}>
            Privacy<br />
            <span style={{ background: "linear-gradient(90deg,#3b82f6,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Policy
            </span>
          </h1>

          <div className="rounded-xs p-5 mt-6"
            style={{
              background: "linear-gradient(135deg,rgba(59,130,246,0.05) 0%,rgba(139,92,246,0.03) 100%)",
              border: "1px solid rgba(59,130,246,0.15)",
            }}>
            <p className="text-sm leading-relaxed" style={{ color: "#4b5563" }}>
              <span className="font-black text-gray-900">Your privacy matters. </span>
              This platform was built with respect for your data. We collect only what's needed 
              to provide great games and tools, we never sell your information, and you're always 
              in control. Read on to understand exactly how we handle your data, or contact us 
              directly with any questions. 🔒
            </p>
          </div>
        </div>

        {/* Table of Contents */}
        <nav className="rounded-xs p-5 mb-10"
          style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
          <p className="text-[9px] uppercase tracking-[0.2em] font-black mb-4"
            style={{ color: "#9ca3af" }}>
            Contents
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
            {SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#section-${s.id}`}
                className="flex items-center gap-2 group"
                style={{ textDecoration: "none" }}>
                <span className="text-[10px] font-black w-5 flex-shrink-0"
                  style={{ color: "#3b82f6" }}>
                  {s.id}.
                </span>
                <span className="text-[11px] font-semibold transition-colors group-hover:text-gray-900"
                  style={{ color: "#6b7280" }}>
                  {s.title}
                </span>
              </a>
            ))}
          </div>
        </nav>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map(s => (
            <Section key={s.id} id={s.id} title={s.title} content={s.content} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-14 pt-8" style={{ borderTop: "1px solid #e5e7eb" }}>

          <div className="rounded-xs p-5 mb-8"
            style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
            <p className="text-[9px] uppercase tracking-[0.2em] font-black mb-3"
              style={{ color: "#9ca3af" }}>
              Contact Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]"
              style={{ color: "#6b7280" }}>
              <div><span style={{ color: "#9ca3af" }}>Privacy Enquiries:</span>{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#3b82f6" }}>{CONTACT_EMAIL}</a>
              </div>
              <div><span style={{ color: "#9ca3af" }}>DPO Contact:</span>{" "}
                <a href={`mailto:${DPO_EMAIL}`} style={{ color: "#3b82f6" }}>{DPO_EMAIL}</a>
              </div>
              <div><span style={{ color: "#9ca3af" }}>Operator:</span> {OPERATOR}</div>
              <div><span style={{ color: "#9ca3af" }}>Platform:</span>{" "}
                <a href={PLATFORM_URL} style={{ color: "#3b82f6" }}>{PLATFORM_URL}</a>
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-2xl">🔒</p>
            <p className="text-sm font-black text-gray-900" style={{ letterSpacing: "-0.02em" }}>
              Your data, your control.
            </p>
            <p className="text-xs" style={{ color: "#9ca3af", lineHeight: 1.7 }}>
              We're committed to transparency and protecting what matters most — your privacy.
            </p>
            <p className="text-[10px] mt-4" style={{ color: "#d1d5db" }}>
              © {new Date().getFullYear()} Isaac Paha / iPaha Ltd · All rights reserved ·{" "}
              <Link href="/terms" style={{ color: "#9ca3af", textDecoration: "underline" }}>
                Terms of Service
              </Link>
              {" "}·{" "}
              <Link href="/" style={{ color: "#9ca3af", textDecoration: "underline" }}>
                Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}