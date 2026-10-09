import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout, brand } from "../components/EmailLayout";
import { EmailButton } from "../components/EmailButton";

export interface MilestoneUpdateEmailProps {
  projectName: string;
  milestoneTitle: string;
  newStatus: string;
  portalUrl: string;
}

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
};

const STATUS_MESSAGES: Record<string, string> = {
  IN_PROGRESS: "Work has started on this stage of your project.",
  IN_REVIEW: "This stage is ready for review.",
  COMPLETED: "This stage is now complete — nice progress.",
  BLOCKED: "This stage is currently blocked. We'll be in touch with details.",
  NOT_STARTED: "This stage is queued up next.",
};

/**
 * Sent whenever a milestone's status changes — the core "track your
 * project progress" promise made real. Fired from the milestone PATCH
 * route in apps/api whenever status actually changes.
 */
export default function MilestoneUpdateEmail({
  projectName = "Your Project",
  milestoneTitle = "",
  newStatus = "IN_PROGRESS",
  portalUrl = "https://account.ipaha.co.uk/projects",
}: MilestoneUpdateEmailProps) {
  return (
    <EmailLayout previewText={`Update on ${projectName}: ${milestoneTitle}`}>
      <Heading style={headingStyle}>Project Update</Heading>

      <Text style={bodyTextStyle}>
        <strong>{projectName}</strong> — {milestoneTitle}
      </Text>

      <Text style={statusBadgeStyle}>{STATUS_LABELS[newStatus] ?? newStatus}</Text>

      <Text style={bodyTextStyle}>
        {STATUS_MESSAGES[newStatus] ??
          "There's an update on your project — take a look."}
      </Text>

      <EmailButton href={portalUrl}>View Project Progress</EmailButton>
    </EmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
  fontFamily: brand.fontHeading,
  fontWeight: 700,
  fontSize: "22px",
  color: brand.text,
  margin: "0 0 16px 0",
};

const bodyTextStyle: React.CSSProperties = {
  fontFamily: brand.fontBody,
  fontSize: "14px",
  lineHeight: "22px",
  color: brand.textSecondary,
  margin: "0 0 12px 0",
};

const statusBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  fontFamily: brand.fontBody,
  fontWeight: 600,
  fontSize: "12px",
  color: brand.text,
  backgroundColor: brand.accent,
  borderRadius: "4px",
  padding: "4px 12px",
  margin: "0 0 16px 0",
};
