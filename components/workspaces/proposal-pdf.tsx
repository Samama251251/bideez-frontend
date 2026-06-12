"use client"

import * as React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import type { ProposalResponse, ProposalSection, ProposalVendor } from "@/lib/api/types"

/* -------------------------------------------------------------------------
 * Styles
 * ------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#000000",
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 50,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    fontFamily: "Helvetica",
  },
  
  // Columns for Client / Contractor
  columnsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  column: {
    width: "45%",
  },
  colHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 10,
  },
  colText: {
    marginBottom: 4,
  },
  
  // Sections
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    marginTop: 15,
  },
  heading1: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    marginBottom: 4,
  },
  paragraph: {
    marginBottom: 10,
    fontSize: 10,
    lineHeight: 1.5,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bulletPoint: {
    width: 10,
    fontSize: 10,
  },
  listItemContent: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
  },
  
  // Table
  table: {
    display: "flex",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 20,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
    breakInside: "avoid",
  },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
  },
  
  // Footer
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#333'
  }
})

/* -------------------------------------------------------------------------
 * Markdown Parser
 * ------------------------------------------------------------------------- */

function parseInlineMarkdown(text: string) {
  // Bold parser: **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={{ fontFamily: 'Helvetica-Bold' }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

function renderMarkdownToPDF(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      // Filter out the markdown separator line, e.g. |---|---|
      const rows = tableRows.filter(row => !row.every(cell => cell.match(/^[-:\s]+$/)));
      if (rows.length > 0) {
         const headers = rows[0];
         const dataRows = rows.slice(1);
         const colWidth = `${100 / headers.length}%`;
         elements.push(
           <View style={styles.table} key={`table-${elements.length}`}>
             {/* Header row — keep together, don't split */}
             <View style={styles.tableRow} wrap={false}>
               {headers.map((h, i) => (
                 <View style={{...styles.tableCol, width: colWidth}} key={`th-${i}`}>
                   <Text style={styles.tableCellHeader}>{parseInlineMarkdown(h)}</Text>
                 </View>
               ))}
             </View>
             {dataRows.map((row, r) => (
               /* Each data row must not split across a page break */
               <View style={styles.tableRow} wrap={false} key={`row-${r}`}>
                 {row.map((cell, c) => (
                   <View style={{...styles.tableCol, width: colWidth}} key={`td-${c}`}>
                     <Text style={styles.tableCell}>{parseInlineMarkdown(cell)}</Text>
                   </View>
                 ))}
               </View>
             ))}
           </View>
         );
      }
      inTable = false;
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('|') && line.endsWith('|')) {
      inTable = true;
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    if (line === '') {
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(<Text key={`h3-${i}`} style={styles.heading3} minPresenceAhead={40}>{parseInlineMarkdown(line.replace('### ', ''))}</Text>);
    } else if (line.startsWith('## ')) {
      elements.push(<Text key={`h2-${i}`} style={styles.heading2} minPresenceAhead={50}>{parseInlineMarkdown(line.replace('## ', ''))}</Text>);
    } else if (line.startsWith('# ')) {
      elements.push(<Text key={`h1-${i}`} style={styles.heading1} minPresenceAhead={60}>{parseInlineMarkdown(line.replace('# ', ''))}</Text>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <View key={`li-${i}`} style={styles.listItem}>
          <Text style={styles.bulletPoint}>•</Text>
          <Text style={styles.listItemContent}>{parseInlineMarkdown(line.substring(2))}</Text>
        </View>
      );
    } else {
      elements.push(<Text key={`p-${i}`} style={styles.paragraph}>{parseInlineMarkdown(line)}</Text>);
    }
  }
  flushTable();

  return elements;
}

/* -------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

function effectiveContent(s: ProposalSection): string {
  return s.humanContent ?? s.content ?? ""
}

/**
 * Renders a "Label: value" line, but only when a real value exists — so the
 * exported proposal never prints a bracketed placeholder for missing data.
 */
function InfoLine({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <Text style={styles.colText}>
      {label}: {value}
    </Text>
  )
}

/* -------------------------------------------------------------------------
 * PDF Document
 * ------------------------------------------------------------------------- */

export function ProposalPDFDocument({
  proposal,
  vendor,
}: {
  proposal: ProposalResponse
  vendor?: ProposalVendor
}) {
  const deadline = proposal.deadline
    ? new Date(proposal.deadline).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "As per RFP"

  const vendorName = vendor?.name ?? null
  const documentTitle = vendorName
    ? `Bid Proposal — ${vendorName} for ${proposal.buyerName ?? "RFP Response"}`
    : `Bid Proposal — ${proposal.buyerName ?? "RFP Response"}`

  return (
    <Document
      title={documentTitle}
      author={vendorName ?? "Bideez"}
      subject="Bid Proposal"
    >
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.header}>
          Bid Proposal
        </Text>

        <View style={styles.columnsContainer}>
          <View style={styles.column}>
            <Text style={styles.colHeading}>Client</Text>
            <InfoLine label="Name" value={proposal.buyerName} />
            <Text style={{ marginTop: 15 }}>Deadline: {deadline}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.colHeading}>Contractor</Text>
            <InfoLine label="Name" value={vendorName} />
            <InfoLine label="Address" value={vendor?.address} />
            <InfoLine label="Email" value={vendor?.email} />
            <InfoLine label="Website" value={vendor?.website} />
          </View>
        </View>

        {/* Render Sections with Markdown Parsing */}
        {proposal.sections.map((section) => (
          <View key={section.id} style={{ marginBottom: 15 }}>
            {/* minPresenceAhead prevents the title from orphaning at the bottom of a page */}
            <Text style={styles.sectionTitle} minPresenceAhead={60}>
              {section.title}
            </Text>

            <View>
              {renderMarkdownToPDF(effectiveContent(section))}
            </View>
          </View>
        ))}

        <Text style={styles.pageFooter} render={({ pageNumber, totalPages }) => (
          `${vendorName ? `${vendorName} — ` : ""}Bid Proposal — Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  )
}
