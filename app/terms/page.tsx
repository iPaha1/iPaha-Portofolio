// =============================================================================
// TERMS OF SERVICE PAGE
// app/terms/page.tsx
//
// Full, comprehensive terms of service covering all platform services.
// Server component with complete SEO metadata.
// =============================================================================

import type { Metadata } from "next";
import Link from "next/link";

// ── SEO ───────────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Terms of Service | Isaac Paha",
  description:
    "Legal terms and conditions governing use of isaacpaha.com games, AI tools, and services. User obligations, intellectual property, liability limits, and dispute resolution.",
  alternates: { canonical: "https://www.isaacpaha.com/terms" },
  robots: { index: true, follow: true },
};

// ── Data ──────────────────────────────────────────────────────────────────────
const LAST_UPDATED = "1 January 2026";
const EFFECTIVE = "1 January 2026";
const OPERATOR = "Isaac Paha / iPaha Ltd";
const CONTACT_EMAIL = "legal@ipahait.com";
const PLATFORM_URL = "https://www.isaacpaha.com";
const COMPANY_URL = "https://ipahait.com";

const SECTIONS = [
  {
    id: "1",
    title: "Introduction & Acceptance",
    content: `
These Terms of Service ("Terms") constitute a legally binding agreement between you ("you", "your", "user") and Isaac Paha / iPaha Ltd ("we", "us", "our", "Company") governing your access to and use of isaacpaha.com, including all games, AI tools, applications, content, and services (collectively, the "Platform").

By accessing or using the Platform in any way, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not use the Platform.

These Terms apply to all users, including visitors, registered users, and anyone else who accesses the Platform. Certain features may have additional terms and conditions, which are incorporated by reference into these Terms.

We may modify these Terms at any time. Material changes will be communicated via email or platform notification at least 14 days before taking effect. Your continued use after changes constitutes acceptance.
    `.trim(),
  },
  {
    id: "2",
    title: "Eligibility & Account Registration",
    content: `
2.1 AGE REQUIREMENTS:
    • Games (non-wagering): Minimum age 13
    • AI Tools: Minimum age 13 (parental consent required for minors)
    • Token Rush (wagering): Strictly 18+ only
    • Account creation: 13+ (minors require parental supervision)
    • By using the Platform, you confirm you meet these age requirements

2.2 ACCOUNT REGISTRATION:
    • You must provide accurate, complete, and current information
    • You are responsible for maintaining account security
    • You are liable for all activity under your account
    • Notify us immediately of unauthorized access
    • One account per person (multiple accounts may result in suspension)

2.3 ACCOUNT SUSPENSION OR TERMINATION:
We reserve the right to suspend or terminate accounts that:
    • Violate these Terms or any applicable laws
    • Are used for fraudulent, abusive, or harmful activities
    • Remain inactive for 24 months
    • Have been compromised or pose security risks
    • Are associated with cheating, botting, or exploiting bugs
    • Are used to circumvent bans or restrictions

2.4 ACCOUNT DELETION:
You may delete your account at any time through account settings. Upon deletion:
    • Personal data is removed or anonymized as described in our Privacy Policy
    • Token balances are forfeited and non-recoverable
    • Game history is anonymized
    • Content you created (comments, posts) remains but is attributed to "Deleted User"
    `.trim(),
  },
  {
    id: "3",
    title: "Games & Token Rush",
    content: `
3.1 GAME NATURE:
All games on this Platform are provided strictly for entertainment and skill-development purposes. They are not gambling products under the UK Gambling Act 2005 or equivalent legislation, as they are skill-based and do not involve staking real money directly.

3.2 TOKEN SYSTEM:
    • Tokens are virtual in-platform credits with no real-world monetary value
    • Tokens are not currency, securities, investments, or financial instruments
    • Tokens may be earned through gameplay, achievements, referrals, and events
    • Token balances may be adjusted or reset in cases of abuse, cheating, or platform changes
    • Tokens may expire after 12 months of account inactivity

3.3 TOKEN RUSH WAGERING:
    • Token Rush is a skill-based competition feature
    • Players stake virtual tokens (not real money) against each other
    • A 5% platform fee is deducted from each prize pool
    • Wagers are final once a challenge is accepted
    • We accept no responsibility for token loss through gameplay

3.4 CASH-OUT FEATURE:
    • Provided as a goodwill gesture, not a financial obligation
    • Minimum threshold: 1,000,000 tokens
    • Conversion rate: 1,000,000 tokens = £100 (indicative, subject to change)
    • Processing within 5 business days via PayPal
    • We reserve the right to refuse any cash-out request at our sole discretion
    • Users are responsible for any tax liability arising from cash-outs

3.5 FAIR PLAY & ANTI-CHEAT:
    • Active anti-cheat systems monitor all games
    • Cheating, botting, or exploiting bugs results in immediate suspension
    • Forfeiture of all token balances upon ban
    • No appeals guaranteed for cheating violations
    • Collusion with other players to manipulate outcomes is prohibited

3.6 GAME AVAILABILITY:
We do not guarantee continuous or uninterrupted availability of any game. Scheduled and unscheduled maintenance may affect availability. We reserve the right to modify, suspend, or discontinue any game at any time.
    `.trim(),
  },
  {
    id: "4",
    title: "AI Tools & Services",
    content: `
4.1 NATURE OF AI SERVICES:
Our AI tools are provided for informational and assistance purposes. They are not substitutes for professional advice in legal, financial, medical, psychological, or other regulated fields.

4.2 ACCURACY DISCLAIMER:
AI-generated outputs may contain:
    • Errors, inaccuracies, or hallucinations
    • Outdated information (models have knowledge cutoffs)
    • Biases present in training data
    • Inconsistent results based on input phrasing

You are solely responsible for verifying any critical information before relying on it.

4.3 TOKEN CONSUMPTION:
    • Premium AI features consume tokens
    • Token costs are displayed before initiating requests
    • Free tier users may experience rate limits and standard AI models
    • We reserve the right to adjust token costs with notice

4.4 ACCEPTABLE USE:
    • Do not input sensitive personal information unless required
    • Do not use AI tools for illegal or harmful purposes
    • Do not attempt to extract, reverse-engineer, or replicate AI models
    • Do not use automated scripts to bypass rate limits

4.5 DATA PROCESSING:
    • Inputs are processed by third-party AI providers (OpenAI, Anthropic)
    • We may store inputs and outputs for up to 90 days for quality improvement
    • Anonymized data may be used for model training
    • See our Privacy Policy for detailed data handling practices
    `.trim(),
  },
  {
    id: "5",
    title: "User Conduct & Prohibited Activities",
    content: `
5.1 ACCEPTABLE USE:
You agree to use the Platform responsibly, ethically, and in compliance with all applicable laws and regulations.

5.2 PROHIBITED CONDUCT includes but is not limited to:
    (a) Cheating, exploiting bugs, or gaining unfair advantage in games
    (b) Using automated scripts, bots, or macros to automate interactions
    (c) Attempting to reverse-engineer, decompile, or access server-side logic
    (d) Creating multiple accounts to circumvent restrictions or accumulate tokens
    (e) Colluding with other players to manipulate game outcomes
    (f) Uploading malicious code, viruses, or harmful files
    (g) Harassing, abusing, intimidating, or threatening others
    (h) Posting illegal, harmful, defamatory, or hateful content
    (i) Impersonating others or misrepresenting your identity
    (j) Circumventing rate limits, bans, or content moderation
    (k) Using the Platform for illegal activities or to facilitate illegal activities
    (l) Scraping, crawling, or extracting data without permission
    (m) Selling, transferring, or trading accounts or tokens
    (n) Using the Platform to generate spam or deceptive content

5.3 ENFORCEMENT:
Violation of these terms may result in:
    • Warning or temporary suspension
    • Permanent account ban
    • Forfeiture of token balances
    • Legal action where appropriate
    • Reporting to relevant authorities for illegal activities

5.4 REPORTING:
If you encounter prohibited content or conduct, please report to ${CONTACT_EMAIL} with relevant evidence.
    `.trim(),
  },
  {
    id: "6",
    title: "Intellectual Property Rights",
    content: `
6.1 OUR IP:
All content, code, designs, graphics, interfaces, game mechanics, tool functionality, branding, and materials on the Platform are the exclusive intellectual property of Isaac Paha and iPaha Ltd, protected by copyright, trademark, and other intellectual property laws.

6.2 LIMITED LICENSE:
We grant you a limited, non-exclusive, non-transferable, revocable license to:
    • Access and use the Platform for personal, non-commercial entertainment
    • Interact with games and tools as intended
    • View and interact with content for personal use

6.3 RESTRICTIONS:
You may not:
    • Copy, reproduce, distribute, or create derivative works from the Platform
    • Use our trademarks, logos, or branding without written permission
    • Sell, resell, or commercially exploit any part of the Platform
    • Use the Platform in any way not expressly authorized

6.4 USER CONTENT:
You retain ownership of content you create (comments, posts, tool inputs). By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to:
    • Display, distribute, and promote your content on the Platform
    • Store, backup, and archive your content
    • Use aggregated, anonymized content for improvement

6.5 DMCA / COPYRIGHT INFRINGEMENT:
If you believe your copyrighted work has been infringed, contact us at ${CONTACT_EMAIL} with:
    • Identification of the copyrighted work
    • Identification of the infringing material
    • Your contact information
    • A statement of good faith belief
    • A statement under penalty of perjury
    • Your physical or electronic signature
    `.trim(),
  },
  {
    id: "7",
    title: "Limitation of Liability",
    content: `
7.1 NO FINANCIAL RESPONSIBILITY:
To the maximum extent permitted by law, Isaac Paha and iPaha Ltd accept no liability for:
    • Loss of tokens through gameplay, technical errors, or any cause
    • Inaccurate, incomplete, or harmful AI-generated outputs
    • Decisions made based on AI-generated content
    • Loss of cash-out value due to rate changes or refusal
    • Loss of earnings, business opportunities, or economic advantages
    • Any indirect, consequential, special, or punitive damages

7.2 NO WARRANTY:
The Platform is provided "as is" and "as available" without warranties of any kind, express or implied, including:
    • Merchantability or fitness for a particular purpose
    • Uninterrupted, error-free, or secure access
    • Accuracy, reliability, or completeness of content
    • Freedom from viruses or harmful components

7.3 MAXIMUM LIABILITY:
Our total aggregate liability to you under these Terms shall not exceed:
    • The total amount of tokens you have purchased in the 12 months preceding the claim, or
    • £50 (fifty pounds sterling), whichever is greater

7.4 THIRD-PARTY SERVICES:
We are not responsible for:
    • Clerk authentication services
    • Stripe or PayPal payment processing
    • OpenAI, Anthropic, or other AI provider performance
    • Vercel, Neon, or Cloudflare infrastructure issues
    • Any third-party service availability or data handling

7.5 JURISDICTIONAL LIMITATIONS:
Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so the above limitations may not apply to you. In such cases, our liability is limited to the fullest extent permitted by law.
    `.trim(),
  },
  {
    id: "8",
    title: "Indemnification",
    content: `
You agree to indemnify, defend, and hold harmless Isaac Paha, iPaha Ltd, and our officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising from or related to:
    • Your use of the Platform in violation of these Terms
    • Your violation of any applicable laws or regulations
    • Your infringement of any third-party rights
    • Any content you submit or transmit through the Platform
    • Your account activities or negligence

We reserve the right to assume exclusive defense and control of any matter subject to indemnification, in which case you agree to cooperate with our defense.
    `.trim(),
  },
  {
    id: "9",
    title: "Termination & Suspension",
    content: `
9.1 TERMINATION BY YOU:
You may terminate this agreement at any time by:
    • Deleting your account through account settings
    • Ceasing use of the Platform
    • Contacting us to request account deletion

9.2 TERMINATION BY US:
We may suspend or terminate your access immediately without notice if:
    • You violate these Terms or any applicable laws
    • You engage in fraudulent, abusive, or harmful activities
    • You cheat, exploit bugs, or use bots in games
    • You circumvent bans or create multiple accounts
    • Required by law or court order
    • Your account remains inactive for 24 months

9.3 EFFECT OF TERMINATION:
Upon termination:
    • All rights granted to you terminate immediately
    • You must cease using the Platform
    • Token balances are forfeited and non-recoverable
    • Account data is handled as described in our Privacy Policy
    • Outstanding cash-out requests may be cancelled

9.4 SURVIVAL:
Sections regarding intellectual property, limitation of liability, indemnification, and dispute resolution survive termination.
    `.trim(),
  },
  {
    id: "10",
    title: "Modifications to Services & Terms",
    content: `
10.1 SERVICE CHANGES:
We reserve the right to modify, add, remove, or discontinue any:
    • Game, tool, or feature
    • Token values, costs, or conversion rates
    • Platform fees or thresholds
    • User interface or functionality

We will endeavour to provide reasonable notice for material changes but are not obligated to do so.

10.2 TERMS CHANGES:
    • We may modify these Terms at any time
    • Material changes will be communicated via email or platform notification
    • Changes take effect 14 days after notification for active users
    • Your continued use after changes constitutes acceptance
    • If you do not accept changes, you must cease using the Platform

10.3 NOTIFICATION:
We will notify you of material changes through:
    • Email to your registered address
    • Platform banner notification
    • Update to the effective date at the top of these Terms
    `.trim(),
  },
  {
    id: "11",
    title: "Governing Law & Dispute Resolution",
    content: `
11.1 GOVERNING LAW:
These Terms and any dispute arising from them shall be governed by and construed in accordance with the laws of England and Wales, without regard to conflict of law principles.

11.2 DISPUTE RESOLUTION:
Before commencing any legal proceedings, you agree to:
    • First notify us in writing at ${CONTACT_EMAIL}
    • Give us 30 days to attempt to resolve the matter amicably
    • Work in good faith to reach a resolution

11.3 JURISDICTION:
The parties agree to submit to the exclusive jurisdiction of the courts of England and Wales for the resolution of any disputes arising under or in connection with these Terms, without prejudice to any mandatory consumer protection rights you may have in your local jurisdiction.

11.4 CLASS ACTION WAIVER:
To the extent permitted by law, you agree to resolve disputes on an individual basis and waive the right to participate in class actions, class arbitrations, or representative actions.

11.5 STATUTE OF LIMITATIONS:
Any claim arising under these Terms must be filed within one year after the cause of action arises, or such claim is permanently barred.
    `.trim(),
  },
  {
    id: "12",
    title: "Severability & Waiver",
    content: `
12.1 SEVERABILITY:
If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction:
    • That provision shall be limited or eliminated to the minimum extent necessary
    • The remaining provisions shall remain in full force and effect
    • The intent of the parties is to give effect to the remaining terms

12.2 WAIVER:
Our failure to enforce any right or provision of these Terms shall not be deemed a waiver of such right or provision. Any waiver must be in writing and signed by an authorized representative of the Company.
    `.trim(),
  },
  {
    id: "13",
    title: "Force Majeure",
    content: `
We shall not be liable for any delay or failure to perform resulting from causes outside our reasonable control, including but not limited to:
    • Natural disasters, earthquakes, floods, fires
    • War, terrorism, civil unrest
    • Internet service provider failures
    • Power outages or infrastructure failures
    • Government actions or regulations
    • Cyber attacks, hacking, or security breaches
    • Third-party service provider failures
    • Strikes or labor disputes

In the event of a force majeure, our obligations are suspended for the duration of the event, and we will make reasonable efforts to resume services as soon as practicable.
    `.trim(),
  },
  {
    id: "14",
    title: "Contact Information",
    content: `
For any questions, concerns, or requests regarding these Terms:

LEGAL ENQUIRIES:
    • Email: ${CONTACT_EMAIL}
    • Response time: Within 5 business days
    • Please include: Your account email and specific details

GENERAL SUPPORT:
    • Email: support@ipahait.com
    • For: Technical issues, bug reports, feature requests

OPERATOR DETAILS:
    • Operator: ${OPERATOR}
    • Platform: ${PLATFORM_URL}
    • Company: ${COMPANY_URL}

For urgent matters, including account suspension or security concerns, please use the subject line "URGENT" in your email to ensure prompt attention.

Isaac Paha built this platform because he believes in creating things that matter — games that challenge minds, tools that solve real problems, and a space where people can learn, grow, and enjoy. Thank you for being part of this journey.
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
      {/* Warm amber nebula */}
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle,rgba(245,158,11,0.03) 0%,transparent 65%)", filter: "blur(60px)" }} />
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
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.2)",
          }}>
          <span className="text-[11px] font-black" style={{ color: "#f59e0b" }}>{id}</span>
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
                          style={{ background: "#f59e0b" }} />
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

export default function TermsPage() {
  return (
    <div className="min-h-screen relative" style={{ background: "#ffffff", fontFamily: "'Sora', system-ui, sans-serif" }}>
      <AmbientBg />

      <div className="absolute top-0 left-0 right-0 h-[2.5px]"
        style={{ background: "linear-gradient(90deg,transparent,#f59e0b 30%,#8b5cf6 70%,transparent)" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        <div className="mb-12">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-6"
            style={{ color: "#9ca3af" }}>
            <Link href="/" style={{ color: "#9ca3af", textDecoration: "none" }}>Home</Link>
            <span>/</span>
            <span style={{ color: "#f59e0b" }}>Terms</span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-[9px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-xs"
              style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.2)",
                color: "#f59e0b",
              }}>
              Legal
            </span>
            <span className="text-[10px]" style={{ color: "#9ca3af" }}>
              Last updated: {LAST_UPDATED} · Effective: {EFFECTIVE}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4"
            style={{ letterSpacing: "-0.05em", lineHeight: 1.05 }}>
            Terms of<br />
            <span style={{ background: "linear-gradient(90deg,#f59e0b,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Service
            </span>
          </h1>

          <div className="rounded-xs p-5 mt-6"
            style={{
              background: "linear-gradient(135deg,rgba(245,158,11,0.05) 0%,rgba(139,92,246,0.03) 100%)",
              border: "1px solid rgba(245,158,11,0.15)",
            }}>
            <p className="text-sm leading-relaxed" style={{ color: "#4b5563" }}>
              <span className="font-black text-gray-900">Welcome. </span>
              These terms exist to protect both you and us — to ensure a fair, enjoyable, and 
              safe environment for everyone. Whether you're here to play games, use AI tools, 
              or just explore, please read these terms carefully. They matter. And if you have 
              questions, we're just an email away. ⚖️
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
                  style={{ color: "#f59e0b" }}>
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
              Contact Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]"
              style={{ color: "#6b7280" }}>
              <div><span style={{ color: "#9ca3af" }}>Legal Enquiries:</span>{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#f59e0b" }}>{CONTACT_EMAIL}</a>
              </div>
              <div><span style={{ color: "#9ca3af" }}>General Support:</span>{" "}
                <a href="mailto:support@ipahait.com" style={{ color: "#f59e0b" }}>support@ipahait.com</a>
              </div>
              <div><span style={{ color: "#9ca3af" }}>Operator:</span> {OPERATOR}</div>
              <div><span style={{ color: "#9ca3af" }}>Platform:</span>{" "}
                <a href={PLATFORM_URL} style={{ color: "#f59e0b" }}>{PLATFORM_URL}</a>
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-2xl">⚖️</p>
            <p className="text-sm font-black text-gray-900" style={{ letterSpacing: "-0.02em" }}>
              Fair play. Clear rules. Great experience.
            </p>
            <p className="text-xs" style={{ color: "#9ca3af", lineHeight: 1.7 }}>
              These terms were written with care and transparency. We're building something good here.
            </p>
            <p className="text-[10px] mt-4" style={{ color: "#d1d5db" }}>
              © {new Date().getFullYear()} Isaac Paha / iPaha Ltd · All rights reserved ·{" "}
              <Link href="/privacy" style={{ color: "#9ca3af", textDecoration: "underline" }}>
                Privacy Policy
              </Link>
              {" "}·{" "}
              <Link href="/games-terms" style={{ color: "#9ca3af", textDecoration: "underline" }}>
                Game Terms
              </Link>
              {" "}·{" "}
              <Link href="/tools-terms" style={{ color: "#9ca3af", textDecoration: "underline" }}>
                Tools Terms
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}