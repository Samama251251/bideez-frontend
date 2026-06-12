"use client"

import * as React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"
import type { ProposalResponse, ProposalSection } from "@/lib/api/types"

/* -------------------------------------------------------------------------
 * Styles
 * ------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.6,
    color: "#1a1a1a",
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 60,
  },

  // Cover page
  coverPage: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
    paddingTop: 120,
    paddingBottom: 56,
    paddingHorizontal: 60,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  coverBadge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  coverTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 28,
    color: "#0f172a",
    lineHeight: 1.3,
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 40,
  },
  coverDivider: {
    borderBottomWidth: 2,
    borderBottomColor: "#e2e8f0",
    marginBottom: 32,
  },
  coverMetaRow: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 8,
  },
  coverMetaLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#6b7280",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  coverMetaValue: {
    fontSize: 11,
    color: "#0f172a",
  },
  coverFooter: {
    position: "absolute",
    bottom: 48,
    left: 60,
    right: 60,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  coverFooterText: {
    fontSize: 8,
    color: "#94a3b8",
  },

  // TOC
  tocTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 20,
  },
  tocRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tocLabel: {
    fontSize: 10,
    color: "#334155",
  },
  tocDots: {
    flex: 1,
    marginHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomStyle: "dotted",
    borderBottomColor: "#cbd5e1",
    marginBottom: 3,
  },
  tocPage: {
    fontSize: 9,
    color: "#94a3b8",
  },

  // Section pages
  sectionHeader: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#e2e8f0",
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    color: "#0f172a",
    lineHeight: 1.2,
  },
  sectionBody: {
    fontSize: 10,
    lineHeight: 1.7,
    color: "#334155",
  },
  placeholderBanner: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 9,
    color: "#92400e",
    fontFamily: "Helvetica-Bold",
  },

  // Page footer
  footer: {
    position: "absolute",
    bottom: 32,
    left: 60,
    right: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
})

/* -------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

function effectiveContent(s: ProposalSection): string {
  return s.humanContent ?? s.content ?? ""
}

const SECTION_NUMBERS: Record<string, number> = {
  cover_letter: 1,
  executive_summary: 2,
  compliance_matrix: 3,
  company_overview: 4,
  technical_approach: 5,
  past_performance: 6,
  team_qualifications: 7,
  pricing: 8,
  terms: 9,
}

/* -------------------------------------------------------------------------
 * PDF Document
 * ------------------------------------------------------------------------- */

export function ProposalPDFDocument({ proposal }: { proposal: ProposalResponse }) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const deadline = proposal.deadline
    ? new Date(proposal.deadline).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "As per RFP"

  return (
    <Document
      title={`Bid Proposal — ${proposal.buyerName ?? "RFP Response"}`}
      author="Bideez"
      subject="Bid Proposal"
    >
      {/* ---- Cover Page ------------------------------------------------ */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverBadge}>Bid Proposal · Confidential</Text>
        <Text style={styles.coverTitle}>
          {proposal.buyerName
            ? `Response to ${proposal.buyerName}`
            : "Bid Proposal"}
        </Text>
        <Text style={styles.coverSubtitle}>
          {proposal.projectOverview?.slice(0, 120) ?? "Comprehensive bid proposal prepared in response to your RFP."}
        </Text>

        <View style={styles.coverDivider} />

        <View style={styles.coverMetaRow}>
          <View>
            <Text style={styles.coverMetaLabel}>Submitted To</Text>
            <Text style={styles.coverMetaValue}>{proposal.buyerName ?? "The Buyer"}</Text>
          </View>
          <View>
            <Text style={styles.coverMetaLabel}>Date Prepared</Text>
            <Text style={styles.coverMetaValue}>{today}</Text>
          </View>
          <View>
            <Text style={styles.coverMetaLabel}>Submission Deadline</Text>
            <Text style={styles.coverMetaValue}>{deadline}</Text>
          </View>
        </View>

        <View style={styles.coverFooter}>
          <Text style={styles.coverFooterText}>Confidential · Generated by Bideez</Text>
          <Text style={styles.coverFooterText}>{today}</Text>
        </View>
      </Page>

      {/* ---- Table of Contents ----------------------------------------- */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.tocTitle}>Table of Contents</Text>
        {proposal.sections.map((s) => (
          <View key={s.id} style={styles.tocRow}>
            <Text style={styles.tocLabel}>
              {SECTION_NUMBERS[s.sectionType]}. {s.title}
            </Text>
            <View style={styles.tocDots} />
          </View>
        ))}

        <Footer buyerName={proposal.buyerName} />
      </Page>

      {/* ---- Section Pages --------------------------------------------- */}
      {proposal.sections.map((section) => (
        <Page key={section.id} size="A4" style={styles.page}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              Section {SECTION_NUMBERS[section.sectionType]}
            </Text>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>

          {section.isPlaceholder && (
            <View style={styles.placeholderBanner}>
              <Text style={styles.placeholderText}>
                ⚠ This section requires human input before final submission.
              </Text>
            </View>
          )}

          <Text style={styles.sectionBody}>
            {effectiveContent(section) || "(No content)"}
          </Text>

          <Footer buyerName={proposal.buyerName} />
        </Page>
      ))}
    </Document>
  )
}

function Footer({ buyerName }: { buyerName: string | null }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        Bid Proposal {buyerName ? `— ${buyerName}` : ""} · Confidential
      </Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  )
}
