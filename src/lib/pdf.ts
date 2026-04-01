// ============================================================================
// PDF Report Generation — Server-side only (@react-pdf/renderer)
// ============================================================================

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ============================================================================
// INSIDE brand colors
// ============================================================================

const COLORS = {
  blue: "#00548c",
  pink: "#e31b58",
  cyan: "#6bebf4",
  purple: "#8883f0",
  yellow: "#ffe289",
  white: "#ffffff",
  black: "#1a1a1a",
  gray: "#6b7280",
  lightGray: "#f3f4f6",
  green: "#16a34a",
  greenBg: "#dcfce7",
  pinkBg: "#fce7f3",
} as const;

// ============================================================================
// Types
// ============================================================================

export interface PDFGapItem {
  key: string;
  label: string;
  current: number;
  target: number;
  delta: number;
}

export interface PDFTrainingProvider {
  name: string;
  type: string;
  detail: string;
}

export interface PDFTrainingModule {
  title: string;
  content: string;
  providers: PDFTrainingProvider[];
}

export interface PDFReportProps {
  candidateName: string;
  candidateEmail: string;
  roleLabel: string;
  overallScore: number;
  avgPrereq: number;
  avgOpenstack: number;
  prereqStatus: { text: string };
  openstackStatus: { text: string };
  prereqRecommendation: string;
  openstackRecommendation: string;
  gapAnalysis: PDFGapItem[];
  trainingModules: PDFTrainingModule[];
  generatedAt: string;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: COLORS.black,
  },

  // Header page
  headerPage: {
    fontFamily: "Helvetica",
    padding: 40,
    color: COLORS.black,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  logoBanner: {
    backgroundColor: COLORS.blue,
    width: 220,
    height: 60,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    borderRadius: 4,
  },
  logoText: {
    color: COLORS.white,
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLORS.blue,
    textAlign: "center",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 40,
  },
  headerInfoBlock: {
    marginTop: 20,
    padding: 20,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    width: "80%",
  },
  headerInfoRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  headerInfoLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    width: 120,
    color: COLORS.gray,
  },
  headerInfoValue: {
    fontSize: 10,
    color: COLORS.black,
  },

  // Section titles
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLORS.blue,
    marginBottom: 12,
    marginTop: 8,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.cyan,
    paddingBottom: 4,
  },
  subSectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.blue,
    marginBottom: 6,
    marginTop: 10,
  },

  // Score section
  overallScoreContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  overallScoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: COLORS.blue,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  overallScoreValue: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: COLORS.blue,
  },
  overallScoreLabel: {
    fontSize: 10,
    color: COLORS.gray,
  },

  // Two-column summary boxes
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: COLORS.lightGray,
  },
  summaryBoxTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.blue,
    marginBottom: 6,
  },
  summaryBoxScore: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLORS.black,
    marginBottom: 4,
  },
  summaryBoxStatus: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.pink,
    marginBottom: 2,
  },

  // Recommendation blocks
  recommendationBlock: {
    backgroundColor: "#f0f9ff",
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.blue,
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: COLORS.black,
  },

  // Gap analysis table
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.blue,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    color: COLORS.white,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableRowAlt: {
    backgroundColor: COLORS.lightGray,
  },
  tableCell: {
    fontSize: 9,
  },
  colCompetence: { width: "45%" },
  colLevel: { width: "15%", textAlign: "center" },
  colTarget: { width: "15%", textAlign: "center" },
  colGap: { width: "25%", textAlign: "center" },

  // Gap badges
  gapMet: {
    color: COLORS.green,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  gapNotMet: {
    color: COLORS.pink,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },

  // Training modules
  moduleCard: {
    marginBottom: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
  },
  moduleTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.purple,
    marginBottom: 4,
  },
  moduleContent: {
    fontSize: 9,
    lineHeight: 1.4,
    color: COLORS.gray,
    marginBottom: 8,
  },
  providerTable: {
    marginTop: 4,
  },
  providerHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.purple,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  providerHeaderCell: {
    color: COLORS.white,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  providerRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  providerCell: {
    fontSize: 8,
  },
  colProviderName: { width: "35%" },
  colProviderType: { width: "25%" },
  colProviderDetail: { width: "40%" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.gray,
  },
});

// ============================================================================
// Sub-components
// ============================================================================

function PageFooter({ generatedAt }: { generatedAt: string }) {
  return React.createElement(
    View,
    { style: styles.footer, fixed: true },
    React.createElement(
      Text,
      { style: styles.footerText },
      "Genere par INSIDE Academy \u2022 Matrice de competence V2.0"
    ),
    React.createElement(Text, { style: styles.footerText }, generatedAt)
  );
}

function GapRow({
  item,
  index,
}: {
  item: PDFGapItem;
  index: number;
}) {
  const isAlt = index % 2 === 1;
  const isMet = item.delta === 0;

  return React.createElement(
    View,
    { style: [styles.tableRow, isAlt ? styles.tableRowAlt : {}] },
    React.createElement(
      Text,
      { style: [styles.tableCell, styles.colCompetence] },
      item.label
    ),
    React.createElement(
      Text,
      { style: [styles.tableCell, styles.colLevel] },
      String(item.current)
    ),
    React.createElement(
      Text,
      { style: [styles.tableCell, styles.colTarget] },
      String(item.target)
    ),
    React.createElement(
      Text,
      {
        style: [
          styles.colGap,
          isMet ? styles.gapMet : styles.gapNotMet,
        ],
      },
      isMet ? "OK" : `-${item.delta}`
    )
  );
}

// ============================================================================
// Main PDF Document
// ============================================================================

export function AssessmentPDFDocument(props: PDFReportProps): React.JSX.Element {
  const {
    candidateName,
    candidateEmail,
    roleLabel,
    overallScore,
    avgPrereq,
    avgOpenstack,
    prereqStatus,
    openstackStatus,
    prereqRecommendation,
    openstackRecommendation,
    gapAnalysis,
    trainingModules,
    generatedAt,
  } = props;

  // Split gap analysis into prerequisite and openstack sections
  const prereqKeys = new Set([
    "linux_sys",
    "linux_troubleshoot",
    "net_l2_l3",
    "net_sdn",
    "virt_kvm",
  ]);
  const prereqGaps = gapAnalysis.filter((g) => prereqKeys.has(g.key));
  const openstackGaps = gapAnalysis.filter((g) => !prereqKeys.has(g.key));

  // ── Page 1: Header ──────────────────────────────────────────────────────
  const headerPage = React.createElement(
    Page,
    { size: "A4", style: styles.headerPage },
    // Logo placeholder
    React.createElement(
      View,
      { style: styles.logoBanner },
      React.createElement(Text, { style: styles.logoText }, "INSIDE")
    ),
    // Title
    React.createElement(
      Text,
      { style: styles.headerTitle },
      "Rapport d\u2019Audit de Comp\u00e9tences"
    ),
    React.createElement(
      Text,
      { style: styles.headerSubtitle },
      "OpenStack \u2014 \u00c9valuation & Recommandations"
    ),
    // Info block
    React.createElement(
      View,
      { style: styles.headerInfoBlock },
      React.createElement(
        View,
        { style: styles.headerInfoRow },
        React.createElement(
          Text,
          { style: styles.headerInfoLabel },
          "Candidat :"
        ),
        React.createElement(
          Text,
          { style: styles.headerInfoValue },
          candidateName
        )
      ),
      React.createElement(
        View,
        { style: styles.headerInfoRow },
        React.createElement(
          Text,
          { style: styles.headerInfoLabel },
          "Email :"
        ),
        React.createElement(
          Text,
          { style: styles.headerInfoValue },
          candidateEmail
        )
      ),
      React.createElement(
        View,
        { style: styles.headerInfoRow },
        React.createElement(
          Text,
          { style: styles.headerInfoLabel },
          "Profil cible :"
        ),
        React.createElement(
          Text,
          { style: styles.headerInfoValue },
          roleLabel
        )
      ),
      React.createElement(
        View,
        { style: styles.headerInfoRow },
        React.createElement(
          Text,
          { style: styles.headerInfoLabel },
          "Date :"
        ),
        React.createElement(
          Text,
          { style: styles.headerInfoValue },
          generatedAt
        )
      )
    )
  );

  // ── Page 2: Summary ─────────────────────────────────────────────────────
  const summaryPage = React.createElement(
    Page,
    { size: "A4", style: styles.page },
    // Section title
    React.createElement(
      Text,
      { style: styles.sectionTitle },
      "1. Synth\u00e8se G\u00e9n\u00e9rale"
    ),
    // Overall score
    React.createElement(
      View,
      { style: styles.overallScoreContainer },
      React.createElement(
        View,
        { style: styles.overallScoreCircle },
        React.createElement(
          Text,
          { style: styles.overallScoreValue },
          `${overallScore}%`
        )
      ),
      React.createElement(
        Text,
        { style: styles.overallScoreLabel },
        "Score Global de Conformit\u00e9"
      )
    ),
    // Two summary boxes
    React.createElement(
      View,
      { style: styles.summaryRow },
      // Prereq box
      React.createElement(
        View,
        { style: styles.summaryBox },
        React.createElement(
          Text,
          { style: styles.summaryBoxTitle },
          "Pr\u00e9requis"
        ),
        React.createElement(
          Text,
          { style: styles.summaryBoxScore },
          `${avgPrereq} / 4`
        ),
        React.createElement(
          Text,
          { style: styles.summaryBoxStatus },
          prereqStatus.text
        )
      ),
      // OpenStack box
      React.createElement(
        View,
        { style: styles.summaryBox },
        React.createElement(
          Text,
          { style: styles.summaryBoxTitle },
          "OpenStack"
        ),
        React.createElement(
          Text,
          { style: styles.summaryBoxScore },
          `${avgOpenstack} / 4`
        ),
        React.createElement(
          Text,
          { style: styles.summaryBoxStatus },
          openstackStatus.text
        )
      )
    ),
    // Recommendations
    React.createElement(
      Text,
      { style: styles.subSectionTitle },
      "Recommandation Pr\u00e9requis"
    ),
    React.createElement(
      View,
      { style: styles.recommendationBlock },
      React.createElement(
        Text,
        { style: styles.recommendationText },
        prereqRecommendation
      )
    ),
    React.createElement(
      Text,
      { style: styles.subSectionTitle },
      "Recommandation OpenStack"
    ),
    React.createElement(
      View,
      { style: styles.recommendationBlock },
      React.createElement(
        Text,
        { style: styles.recommendationText },
        openstackRecommendation
      )
    ),
    React.createElement(PageFooter, { generatedAt })
  );

  // ── Page 3: Gap Analysis ────────────────────────────────────────────────
  const gapTableHeader = React.createElement(
    View,
    { style: styles.tableHeader },
    React.createElement(
      Text,
      { style: [styles.tableHeaderCell, styles.colCompetence] },
      "Comp\u00e9tence"
    ),
    React.createElement(
      Text,
      { style: [styles.tableHeaderCell, styles.colLevel] },
      "Niveau Actuel"
    ),
    React.createElement(
      Text,
      { style: [styles.tableHeaderCell, styles.colTarget] },
      "Cible"
    ),
    React.createElement(
      Text,
      { style: [styles.tableHeaderCell, styles.colGap] },
      "\u00c9cart"
    )
  );

  const gapPage = React.createElement(
    Page,
    { size: "A4", style: styles.page },
    React.createElement(
      Text,
      { style: styles.sectionTitle },
      "2. Analyse des \u00c9carts"
    ),
    // Part 1 — Prerequisites
    React.createElement(
      Text,
      { style: styles.subSectionTitle },
      "Partie 1 \u2014 Pr\u00e9requis"
    ),
    React.createElement(
      View,
      { style: styles.table },
      gapTableHeader,
      ...prereqGaps.map((item, i) =>
        React.createElement(GapRow, { key: item.key, item, index: i })
      )
    ),
    // Part 2 — OpenStack
    React.createElement(
      Text,
      { style: styles.subSectionTitle },
      "Partie 2 \u2014 OpenStack"
    ),
    React.createElement(
      View,
      { style: styles.table },
      React.createElement(
        View,
        { style: styles.tableHeader },
        React.createElement(
          Text,
          { style: [styles.tableHeaderCell, styles.colCompetence] },
          "Comp\u00e9tence"
        ),
        React.createElement(
          Text,
          { style: [styles.tableHeaderCell, styles.colLevel] },
          "Niveau Actuel"
        ),
        React.createElement(
          Text,
          { style: [styles.tableHeaderCell, styles.colTarget] },
          "Cible"
        ),
        React.createElement(
          Text,
          { style: [styles.tableHeaderCell, styles.colGap] },
          "\u00c9cart"
        )
      ),
      ...openstackGaps.map((item, i) =>
        React.createElement(GapRow, { key: item.key, item, index: i })
      )
    ),
    React.createElement(PageFooter, { generatedAt })
  );

  // ── Page 4+: Training Recommendations ───────────────────────────────────
  const trainingPage = React.createElement(
    Page,
    { size: "A4", style: styles.page, wrap: true },
    React.createElement(
      Text,
      { style: styles.sectionTitle },
      "3. Modules de Formation Recommand\u00e9s"
    ),
    ...trainingModules.map((mod) =>
      React.createElement(
        View,
        { key: mod.title, style: styles.moduleCard, wrap: false },
        React.createElement(Text, { style: styles.moduleTitle }, mod.title),
        React.createElement(
          Text,
          { style: styles.moduleContent },
          mod.content
        ),
        // Providers sub-table
        mod.providers.length > 0
          ? React.createElement(
              View,
              { style: styles.providerTable },
              React.createElement(
                View,
                { style: styles.providerHeader },
                React.createElement(
                  Text,
                  {
                    style: [
                      styles.providerHeaderCell,
                      styles.colProviderName,
                    ],
                  },
                  "Fournisseur"
                ),
                React.createElement(
                  Text,
                  {
                    style: [
                      styles.providerHeaderCell,
                      styles.colProviderType,
                    ],
                  },
                  "Type"
                ),
                React.createElement(
                  Text,
                  {
                    style: [
                      styles.providerHeaderCell,
                      styles.colProviderDetail,
                    ],
                  },
                  "D\u00e9tail"
                )
              ),
              ...mod.providers.map((p, pi) =>
                React.createElement(
                  View,
                  { key: `${mod.title}-p-${pi}`, style: styles.providerRow },
                  React.createElement(
                    Text,
                    { style: [styles.providerCell, styles.colProviderName] },
                    p.name
                  ),
                  React.createElement(
                    Text,
                    { style: [styles.providerCell, styles.colProviderType] },
                    p.type
                  ),
                  React.createElement(
                    Text,
                    { style: [styles.providerCell, styles.colProviderDetail] },
                    p.detail
                  )
                )
              )
            )
          : null
      )
    ),
    React.createElement(PageFooter, { generatedAt })
  );

  // ── Assemble document ───────────────────────────────────────────────────
  return React.createElement(
    Document,
    {
      title: `Rapport Audit - ${candidateName}`,
      author: "INSIDE Academy",
      subject: "Audit de Competences OpenStack",
    },
    headerPage,
    summaryPage,
    gapPage,
    trainingPage
  );
}
