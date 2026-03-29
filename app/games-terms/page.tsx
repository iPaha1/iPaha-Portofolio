// =============================================================================
// GAMES TERMS PAGE
// app/games-terms/page.tsx
//
// Full, comprehensive games terms page.
// Server component with complete SEO metadata.
// =============================================================================

import type { Metadata } from "next";
import Link from "next/link";

// ── SEO ───────────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Game Terms & Conditions | Isaac Paha",
  description:
    "Full terms and conditions governing all games, Token Rush wagering, token system, cashouts, and fair play on isaacpaha.com. Read before playing.",
  alternates: { canonical: "https://www.isaacpaha.com/games-terms" },
  robots: { index: true, follow: true },
};

// ── Data ──────────────────────────────────────────────────────────────────────
const LAST_UPDATED  = "1 January 2025";
const EFFECTIVE     = "1 January 2025";
const OPERATOR      = "Isaac Paha / iPaha Ltd";
const CONTACT_EMAIL = "legal@ipahait.com";
const PLATFORM_URL  = "https://www.isaacpaha.com";
const COMPANY_URL   = "https://ipahait.com";

const SECTIONS = [
  {
    id:    "1",
    title: "Introduction & Spirit of These Terms",
    content: `
These Terms & Conditions ("Terms") govern your use of all games, mini-games, wagering features, 
token systems, and related entertainment services ("Games") available on isaacpaha.com 
("the Platform"), operated by Isaac Paha and iPaha Ltd ("we", "us", "our").

These Games were created with a genuinely pure heart — to entertain, challenge human minds, 
and bring joy to people from every corner of the world. There is absolutely no intent to cause 
financial harm, distress, addiction, or any negative outcome. Every game mechanic, every token, 
every feature has been built as an expression of creativity and passion for enriching human 
experience through play.

By accessing or using any game on this Platform, you confirm that you have read, understood, 
and agree to be bound by these Terms in full. If you do not agree, you must not participate 
in any game feature.
    `.trim(),
  },
  {
    id:    "2",
    title: "Eligibility",
    content: `
2.1 You must be at least 18 years of age, or the age of legal majority in your jurisdiction 
(whichever is higher), to participate in any Token Rush wagering feature or cash-out facility.

2.2 Non-wagering games (solo mini-games, multiplayer practice modes) are available to users 
aged 13 and above, subject to parental consent where required by applicable law.

2.3 By creating an account and playing, you represent and warrant that:
    (a) You are of legal age in your jurisdiction to participate in skill-based entertainment;
    (b) Participation is legal in your country, state, or region;
    (c) You are not accessing the Platform from a jurisdiction where such participation is prohibited;
    (d) You are acting on your own behalf and not on behalf of any third party.

2.4 We reserve the right to request age verification at any time. Failure to provide satisfactory 
verification will result in account suspension pending review.
    `.trim(),
  },
  {
    id:    "3",
    title: "Nature of Games & Entertainment Purpose",
    content: `
3.1 All games on this Platform are provided strictly for entertainment and skill-development 
purposes. They are not gambling products under the UK Gambling Act 2005 or equivalent legislation 
in any jurisdiction, as they are skill-based and do not involve any staking of real money directly.

3.2 Tokens awarded, earned, or wagered within games are virtual in-platform credits only. 
They are not currency, securities, investments, or financial instruments of any kind.

3.3 The Token Rush wagering arena operates as a skill-based competition feature where players 
stake virtual tokens (not real money) against each other. Any cash-out facility is provided 
as a goodwill gesture at the operator's sole discretion and does not constitute a financial 
obligation or enforceable contract for payment.

3.4 We make no representation that any particular game outcome can be predicted, guaranteed, 
or relied upon. Outcomes may be influenced by server conditions, network latency, player skill, 
random elements, and other factors outside our control.

3.5 These games should never be treated as a source of income, investment vehicle, or 
substitute for professional financial, psychological, or legal advice.
    `.trim(),
  },
  {
    id:    "4",
    title: "Token System",
    content: `
4.1 VIRTUAL NATURE: Tokens are virtual in-platform credits with no inherent real-world monetary 
value unless explicitly stated as part of a goodwill cash-out offer. Tokens cannot be transferred 
between accounts, sold, exchanged for real money outside the Platform's cash-out feature, or 
used for any purpose outside this Platform.

4.2 EARNING TOKENS: Tokens may be earned through gameplay, achievements, streaks, referrals, 
and platform events. Token rewards are subject to change, withdrawal, or modification at any 
time without prior notice.

4.3 WAGERING TOKENS: When you participate in Token Rush or any wagering game mode, you 
authorise the Platform to deduct the stated wager amount from your token wallet. This 
deduction occurs at the point of creating or accepting a challenge and is non-refundable 
once a match has begun.

4.4 TOKEN LOSS: You acknowledge and accept that you may lose all wagered tokens in any 
game. Token loss through gameplay is an intended and expected outcome of competitive games. 
We accept no responsibility for token loss resulting from gameplay outcomes, technical errors, 
network interruptions, or any other cause.

4.5 PLATFORM FEE: A platform fee of 5% is deducted from the total prize pool of each 
Token Rush match. This fee is non-negotiable and non-refundable. It covers platform 
maintenance, anti-cheat systems, and server infrastructure.

4.6 WALLET RESET: We reserve the right to reset token balances in exceptional circumstances 
including but not limited to: suspected cheating, exploitation of bugs, account compromise, 
platform migration, or discontinuation of services. We will endeavour to provide reasonable 
notice where possible.

4.7 EXPIRY: Tokens may expire if an account remains inactive for 12 consecutive months. 
Users will be notified by email 30 days before expiry where email contact details are available.
    `.trim(),
  },
  {
    id:    "5",
    title: "Cash-Out Feature",
    content: `
5.1 GOODWILL ONLY: The cash-out facility (conversion of tokens to GBP/USD/EU via PayPal) is 
provided entirely as a goodwill reward at our sole discretion. It does not constitute a 
financial obligation, contractual promise, or enforceable right to payment.

5.2 MINIMUM THRESHOLD: Cash-out requests require a minimum balance of 1,000,000 tokens. 
This threshold may be changed at any time with reasonable notice.

5.3 CONVERSION RATE: The current indicative rate is 1,000,000 tokens = $100 GBP. This 
rate is not guaranteed and may be adjusted at any time. The rate applicable at the time 
of request submission will be displayed in the cash-out interface.

5.4 PROCESSING TIME: Cash-out requests are processed manually within 5 business days 
from submission. We do not guarantee any specific processing timeline.

5.5 PAYMENT METHOD: Cash-outs are currently processed via PayPal to the email address 
provided at the time of request. We are not responsible for PayPal's processing times, 
fees, or any issues with the PayPal service. Users are responsible for ensuring their 
PayPal account is active and able to receive payments.

5.6 VERIFICATION: We reserve the right to request identity verification before processing 
any cash-out. Requests may be declined if verification cannot be satisfactorily completed.

5.7 REFUSAL: We reserve the right to refuse any cash-out request at our sole discretion, 
including where we suspect a breach of these Terms, fraudulent activity, or any other 
concern. Refused tokens will be returned to the user's wallet unless the refusal is due 
to a terms violation, in which case forfeiture may apply.

5.8 TAX: Users are solely responsible for any tax liability arising from cash-out payments 
in their jurisdiction. We do not provide tax advice and make no representations regarding 
tax treatment.
    `.trim(),
  },
  {
    id:    "6",
    title: "Fair Play & Anti-Cheat",
    content: `
6.1 You agree to participate in all games honestly, fairly, and in the spirit in which they 
were designed. Any attempt to gain an unfair advantage is strictly prohibited.

6.2 PROHIBITED CONDUCT includes but is not limited to:
    (a) Using automated scripts, bots, macros, or any software to automate gameplay;
    (b) Exploiting software bugs, glitches, or unintended mechanics for personal gain;
    (c) Reverse-engineering, decompiling, or attempting to access server-side game logic;
    (d) Colluding with other players to manipulate game outcomes;
    (e) Creating multiple accounts to circumvent restrictions or accumulate tokens unfairly;
    (f) Manipulating network traffic, API responses, or client-side data;
    (g) Sharing accounts with other users for the purpose of competitive advantage;
    (h) Any form of harassment, abuse, or intimidation toward other players.

6.3 ANTI-CHEAT SYSTEMS: Active anti-cheat mechanisms operate on all games at all times. 
These include server-side move validation, cryptographic hashing of game states, 
behavioural analysis, and rate limiting. We reserve the right to improve, modify, or 
expand these systems without notice.

6.4 CONSEQUENCES: Detection of cheating or prohibited conduct will result in immediate 
account suspension, forfeiture of all token balances, and permanent ban at our discretion. 
No appeal is guaranteed and no refund or compensation will be provided.

6.5 REPORTING: If you suspect another player of cheating, you may report this to 
legal@ipahait.com with supporting evidence. We will investigate in good faith but 
cannot guarantee any specific outcome.
    `.trim(),
  },
  {
    id:    "7",
    title: "Limitation of Liability & Disclaimer",
    content: `
7.1 NO FINANCIAL RESPONSIBILITY: Isaac Paha and iPaha Ltd accept absolutely no 
financial responsibility or legal liability for:
    (a) Loss of tokens through gameplay, including wagering losses;
    (b) Loss of tokens due to technical errors, server failures, or data corruption;
    (c) Loss of cash-out value due to rate changes or cash-out refusals;
    (d) Any indirect, consequential, special, or punitive financial losses;
    (e) Loss of earnings, business opportunities, or economic advantages.

7.2 NO WARRANTY: The Platform and all Games are provided "as is" and "as available" 
without any warranty of any kind, express or implied, including warranties of 
merchantability, fitness for a particular purpose, or non-infringement.

7.3 AVAILABILITY: We do not guarantee continuous or uninterrupted availability of any 
game, feature, or service. Scheduled and unscheduled maintenance may result in 
temporary or permanent unavailability.

7.4 ACCURACY: We do not warrant that game information, token balances, leaderboard 
data, or any other platform data will be error-free, complete, or up to date at all times.

7.5 THIRD-PARTY SERVICES: We are not responsible for the availability, accuracy, 
security, or performance of third-party services including but not limited to PayPal, 
Clerk authentication, or any CDN or cloud infrastructure provider.

7.6 MAXIMUM LIABILITY: To the maximum extent permitted by applicable law, our total 
aggregate liability to you under or in connection with these Terms shall not exceed 
$50 (fifty pounds sterling) or the total amount of cash-outs you have successfully 
received in the 12 months preceding the claim, whichever is greater.

7.7 MENTAL HEALTH: If you find that gaming is causing you stress, anxiety, distress, 
or any negative mental health impact, please stop playing immediately and seek 
appropriate professional support. These games are meant to be enjoyed, not endured.
    `.trim(),
  },
  {
    id:    "8",
    title: "Intellectual Property",
    content: `
8.1 All game concepts, mechanics, code, graphics, sound design, branding, names 
("Neural Dominance", "Phantom Grid", "Echo Chamber", "Cipher Duel", "Gravity Mind", 
"Token Rush"), and associated materials are the exclusive intellectual property of 
Isaac Paha and iPaha Ltd.

8.2 You are granted a limited, non-exclusive, non-transferable, revocable licence 
to access and use the Games for personal, non-commercial entertainment only.

8.3 You may not copy, reproduce, distribute, create derivative works from, publicly 
perform, publicly display, or commercially exploit any part of the Platform or Games 
without our express written consent.

8.4 The game names listed in clause 8.1 may not be used in any commercial context, 
as part of a competing product or service, or in any way that could cause confusion 
as to the origin of any goods or services.
    `.trim(),
  },
  {
    id:    "9",
    title: "User Accounts & Privacy",
    content: `
9.1 Your account is personal to you. You are responsible for maintaining the 
confidentiality of your login credentials and for all activity that occurs under your account.

9.2 You must notify us immediately at ${CONTACT_EMAIL} if you suspect any unauthorised 
use of your account.

9.3 We reserve the right to suspend or terminate accounts that:
    (a) Violate any provision of these Terms;
    (b) Are inactive for more than 24 months;
    (c) Are associated with fraudulent, abusive, or illegal activity;
    (d) Have been compromised and pose a security risk.

9.4 PRIVACY: Your personal data is processed in accordance with our Privacy Policy 
available at ${PLATFORM_URL}/privacy. By using the Platform, you consent to such 
processing and warrant that all data you provide is accurate.

9.5 GAME DATA: We collect and store gameplay data including scores, game history, 
wagering records, and behavioural patterns for the purposes of anti-cheat enforcement, 
leaderboard management, and platform improvement. This data may be retained for up 
to 7 years from your last active session.
    `.trim(),
  },
  {
    id:    "10",
    title: "Responsible Gaming",
    content: `
10.1 These games are designed for enjoyment. We strongly encourage all users to:
    (a) Set personal time limits for gameplay sessions;
    (b) Take regular breaks and maintain a healthy balance with other life activities;
    (c) Never play when tired, intoxicated, emotionally distressed, or in financial difficulty;
    (d) Never treat token wagering as a financial strategy or income source;
    (e) Seek help immediately if gaming causes negative impacts on relationships, 
        mental health, or daily functioning.

10.2 If you feel your engagement with games is becoming compulsive or harmful, 
you may request a self-exclusion by emailing ${CONTACT_EMAIL}. We will action 
all self-exclusion requests within 48 hours.

10.3 Resources for support:
    — GamCare: www.gamcare.org.uk / 0808 8020 133
    — BeGambleAware: www.begambleaware.org
    — Mind (mental health): www.mind.org.uk / 0300 123 3393

10.4 We sincerely care about your wellbeing. These resources are provided not because 
we believe our platform causes harm, but because we recognise that any engaging 
activity requires mindful participation.
    `.trim(),
  },
  {
    id:    "11",
    title: "Modifications to Terms & Services",
    content: `
11.1 We reserve the right to modify, amend, or replace these Terms at any time. 
Material changes will be communicated via the Platform interface and/or email 
(where available) at least 14 days before taking effect for active users.

11.2 Your continued use of the Platform after changes take effect constitutes 
acceptance of the revised Terms. If you do not accept the changes, you must 
cease using the Platform.

11.3 We reserve the right to modify, add, remove, or discontinue any game, 
feature, or service at any time without liability. We will endeavour to provide 
reasonable notice for significant changes but are not obligated to do so.

11.4 Token values, cash-out rates, wager minimums/maximums, platform fees, and 
any other quantitative parameters may be changed at any time. Changes will be 
reflected in the Platform interface and are effective immediately unless stated otherwise.
    `.trim(),
  },
  {
    id:    "12",
    title: "Governing Law & Dispute Resolution",
    content: `
12.1 These Terms and any dispute arising from them shall be governed by and 
construed in accordance with the laws of England and Wales.

12.2 The parties agree to submit to the exclusive jurisdiction of the courts 
of England and Wales for the resolution of any disputes arising under or in 
connection with these Terms, without prejudice to any mandatory consumer 
protection rights you may have in your local jurisdiction.

12.3 Before commencing any legal proceedings, you agree to first notify us 
in writing at ${CONTACT_EMAIL} and give us 30 days to attempt to resolve 
the matter amicably.

12.4 Nothing in these Terms shall exclude or limit any statutory rights you 
may have as a consumer that cannot be excluded or limited under applicable law.
    `.trim(),
  },
  {
    id:    "13",
    title: "Contact & Operator Information",
    content: `
Operator:          ${OPERATOR}
Platform:          ${PLATFORM_URL}
Company website:   ${COMPANY_URL}
Legal enquiries:   ${CONTACT_EMAIL}
General support:   support@ipahait.com

For any questions, concerns, reports, or feedback regarding these Terms or 
the Games, please contact us at ${CONTACT_EMAIL}. We aim to respond to 
all legal and compliance enquiries within 5 business days.

Isaac Paha built this platform because he loves games, loves people, and 
believes that challenging your mind should be one of life's great joys. 
Every line of code was written with that spirit. Thank you for playing.
    `.trim(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function AmbientBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.011) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.011) 1px,transparent 1px)",
        backgroundSize: "52px 52px",
      }} />
      {/* Amber nebula */}
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full opacity-30"
        style={{ background: "radial-gradient(circle,rgba(245,158,11,0.06) 0%,transparent 65%)", filter: "blur(60px)" }} />
      {/* Purple nebula */}
      <div className="absolute top-1/3 -left-20 w-[500px] h-[500px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 65%)", filter: "blur(50px)" }} />
    </div>
  );
}

interface SectionProps {
  id:      string;
  title:   string;
  content: string;
}

function Section({ id, title, content }: SectionProps) {
  const paragraphs = content.split("\n\n").filter(Boolean);
  return (
    <section id={`section-${id}`} className="scroll-mt-8">
      {/* Section header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-xs flex items-center justify-center mt-0.5"
          style={{
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.22)",
          }}>
          <span className="text-[11px] font-black" style={{ color: "#f59e0b" }}>{id}</span>
        </div>
        <h2 className="text-lg font-black text-white" style={{ letterSpacing: "-0.03em", lineHeight: 1.25 }}>
          {title}
        </h2>
      </div>

      {/* Content */}
      <div className="ml-12 space-y-3">
        {paragraphs.map((para, i) => {
          const isSublist = para.trim().startsWith("(a)") || para.trim().startsWith("    (a)");
          if (isSublist) {
            const lines = para.split("\n").filter(Boolean);
            return (
              <div key={i} className="space-y-1.5">
                {lines.map((line, j) => {
                  const trimmed = line.trim();
                  const isItem  = /^\([a-z]\)/.test(trimmed);
                  return (
                    <div key={j} className="flex items-start gap-2.5">
                      {isItem && (
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: "rgba(245,158,11,0.5)" }} />
                      )}
                      <p className="text-sm leading-relaxed"
                        style={{ color: "rgba(255,255,255,0.52)", marginLeft: isItem ? 0 : "1.125rem" }}>
                        {isItem ? trimmed.replace(/^\([a-z]\)\s*/, "") : trimmed}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          }
          return (
            <p key={i} className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.52)" }}>
              {para}
            </p>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mt-8 ml-12 h-px"
        style={{ background: "linear-gradient(90deg,rgba(245,158,11,0.15),transparent)" }} />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function GamesTermsPage() {
  return (
    <div className="min-h-screen relative"
      style={{ background: "#04040c", fontFamily: "'Sora', system-ui, sans-serif" }}>
      <AmbientBg />

      {/* ── Top accent ── */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px]"
        style={{ background: "linear-gradient(90deg,transparent,#f59e0b 30%,#a855f7 70%,transparent)" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        {/* ── Hero header ── */}
        <div className="mb-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-6"
            style={{ color: "rgba(255,255,255,0.25)" }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>Home</Link>
            <span>/</span>
            <Link href="/games" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>Games</Link>
            <span>/</span>
            <span style={{ color: "#f59e0b" }}>Terms</span>
          </div>

          {/* Top label */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[9px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-xs"
              style={{
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.25)",
                color: "#f59e0b",
              }}>
              Legal
            </span>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>
              Last updated: {LAST_UPDATED} · Effective: {EFFECTIVE}
            </span>
          </div>

          {/* Main title */}
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4"
            style={{ letterSpacing: "-0.05em", lineHeight: 1.05 }}>
            Game Terms &amp;<br />
            <span style={{ background: "linear-gradient(90deg,#f59e0b,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Conditions
            </span>
          </h1>

          {/* Heart statement */}
          <div className="rounded-xs p-5 mt-6"
            style={{
              background: "linear-gradient(135deg,rgba(245,158,11,0.07) 0%,rgba(168,85,247,0.05) 100%)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="font-black text-white">A note from Isaac: </span>
              These games were made with a genuinely pure heart — to challenge minds, spark joy, 
              and connect people through play. From Asia to Australia, Africa to America — every 
              game mechanic was designed to entertain and enrich. This document exists not to 
              impose restrictions, but to be transparent about how this platform works and to 
              protect both you and us. Please read it, ask questions, and play freely. ❤️
            </p>
          </div>
        </div>

        {/* ── Table of contents ── */}
        <nav className="rounded-xs p-5 mb-10"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[9px] uppercase tracking-[0.2em] font-black mb-4"
            style={{ color: "rgba(255,255,255,0.25)" }}>
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
                  style={{ color: "rgba(245,158,11,0.6)" }}>
                  {s.id}.
                </span>
                <span className="text-[11px] font-semibold transition-colors"
                  style={{ color: "rgba(255,255,255,0.4)" }}>
                  {s.title}
                </span>
              </a>
            ))}
          </div>
        </nav>

        {/* ── Sections ── */}
        <div className="space-y-10">
          {SECTIONS.map(s => (
            <Section key={s.id} id={s.id} title={s.title} content={s.content} />
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="mt-14 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>

          {/* Operator info box */}
          <div className="rounded-xs p-5 mb-8"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)" }}>
            <p className="text-[9px] uppercase tracking-[0.2em] font-black mb-3"
              style={{ color: "rgba(255,255,255,0.22)" }}>
              Operator Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]"
              style={{ color: "rgba(255,255,255,0.45)" }}>
              <div><span style={{ color: "rgba(255,255,255,0.25)" }}>Operator:</span> {OPERATOR}</div>
              <div><span style={{ color: "rgba(255,255,255,0.25)" }}>Platform:</span>{" "}
                <a href={PLATFORM_URL} style={{ color: "#6366f1" }}>{PLATFORM_URL}</a>
              </div>
              <div><span style={{ color: "rgba(255,255,255,0.25)" }}>Legal email:</span>{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#6366f1" }}>{CONTACT_EMAIL}</a>
              </div>
              <div><span style={{ color: "rgba(255,255,255,0.25)" }}>Company:</span>{" "}
                <a href={COMPANY_URL} style={{ color: "#6366f1" }}>{COMPANY_URL}</a>
              </div>
            </div>
          </div>

          {/* Closing message */}
          <div className="text-center space-y-2">
            <p className="text-2xl">❤️</p>
            <p className="text-sm font-black text-white" style={{ letterSpacing: "-0.02em" }}>
              Thank you for being here.
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)", lineHeight: 1.7 }}>
              These games exist because of people like you — curious, competitive, alive.<br />
              Play hard. Play fair. Enjoy every round.
            </p>
            <p className="text-[10px] mt-4" style={{ color: "rgba(255,255,255,0.18)" }}>
              © {new Date().getFullYear()} Isaac Paha / iPaha Ltd · All rights reserved ·{" "}
              <Link href="/privacy" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "underline" }}>
                Privacy Policy
              </Link>
              {" "}·{" "}
              <Link href="/games" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "underline" }}>
                Back to Games
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}