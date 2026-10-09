// ============================================================================
// @ipaha/email-templates
// React-email components, rendered to HTML and sent via Resend from
// apps/api. Import individual templates (for sending) or shared building
// blocks (for composing new templates).
// ============================================================================

// Shared building blocks — used when authoring new templates
export { EmailLayout, brand } from "./components/EmailLayout";
export { EmailHeader } from "./components/EmailHeader";
export { EmailFooter } from "./components/EmailFooter";
export { EmailButton } from "./components/EmailButton";

// Transactional templates — Phase 1
export { default as WelcomeClientEmail } from "./transactional/welcome-client";
export type { WelcomeClientEmailProps } from "./transactional/welcome-client";

// Transactional templates — Phase 2
export { default as TicketCreatedEmail } from "./transactional/ticket-created";
export type { TicketCreatedEmailProps } from "./transactional/ticket-created";

export { default as TicketReplyEmail } from "./transactional/ticket-reply";
export type { TicketReplyEmailProps } from "./transactional/ticket-reply";

export { default as MilestoneUpdateEmail } from "./transactional/milestone-update";
export type { MilestoneUpdateEmailProps } from "./transactional/milestone-update";

// Transactional templates — Phase 3
export { default as InvoiceIssuedEmail } from "./transactional/invoice-issued";
export type { InvoiceIssuedEmailProps } from "./transactional/invoice-issued";

export { default as PaymentReceiptEmail } from "./transactional/payment-receipt";
export type { PaymentReceiptEmailProps } from "./transactional/payment-receipt";

export { default as PaymentFailedEmail } from "./transactional/payment-failed";
export type { PaymentFailedEmailProps } from "./transactional/payment-failed";

export { default as SubscriptionOfferEmail } from "./transactional/subscription-offer";
export type { SubscriptionOfferEmailProps } from "./transactional/subscription-offer";

// Transactional templates — Phase 4
export { default as QuoteReadyEmail } from "./transactional/quote-ready";
export type { QuoteReadyEmailProps } from "./transactional/quote-ready";

// Compaign templates — Phase 5
export { default as CampaignBaseEmail } from "./marketing/campaign-base";
export type { CampaignBaseEmailProps } from "./marketing/campaign-base";


export { default as ClientInviteEmail } from "./transactional/client-invite";
export type { ClientInviteEmailProps } from "./transactional/client-invite";

export { default as PortalVerificationCodeEmail } from "./transactional/portal-verification-code";
export type { PortalVerificationCodeEmailProps } from "./transactional/portal-verification-code";

