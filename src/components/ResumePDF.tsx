/**
 * ResumePDF.tsx
 *
 * Renders the parsed Resume object as a PDF that closely mirrors the LaTeX
 * template: letterpaper, ~10.9pt base, Times-Roman (closest to Computer
 * Modern available in PDF without embedding), ruled section headers, and
 * tabular subheadings.
 *
 * Uses @react-pdf/renderer so it works in Next.js API routes (no browser /
 * Chromium required).
 */

import path from "node:path";
import { Page, Text, View, Link, StyleSheet, Font } from "@react-pdf/renderer";
import type { Resume } from "@/types/resume.types";

const tinosRoot = path.resolve(
  process.cwd(),
  "node_modules/@expo-google-fonts/tinos",
);

// ─── Fonts ────────────────────────────────────────────────────────────────
Font.register({
  family: "Times",
  fonts: [
    {
      src: path.join(tinosRoot, "400Regular", "Tinos_400Regular.ttf"),
      fontWeight: "normal",
    },
    {
      src: path.join(tinosRoot, "700Bold", "Tinos_700Bold.ttf"),
      fontWeight: "bold",
    },
    {
      src: path.join(
        tinosRoot,
        "400Regular_Italic",
        "Tinos_400Regular_Italic.ttf",
      ),
      fontStyle: "italic",
    },
    {
      src: path.join(tinosRoot, "700Bold_Italic", "Tinos_700Bold_Italic.ttf"),
      fontWeight: "bold",
      fontStyle: "italic",
    },
  ],
});

// ─── Dimensions (LaTeX letterpaper + ~0.5in side margins, -1in top) ──────
const PX_PT = 1; // react-pdf uses pt natively
const PAGE_H = 792 * PX_PT;
const PAGE_W = 612 * PX_PT;
const MARGIN_H = 36 * PX_PT; // ~0.5in
const MARGIN_V_TOP = 25 * PX_PT;
const MARGIN_V_BOT = 22 * PX_PT;

const BASE = 9.8; // pt — slightly reduced to fit on one page
const SMALL = 8.5;
const TINY = 7.8;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times",
    fontSize: BASE,
    paddingTop: MARGIN_V_TOP,
    paddingBottom: MARGIN_V_BOT,
    paddingHorizontal: MARGIN_H,
    color: "#000",
    lineHeight: 1.1,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  headerName: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  headerLinks: {
    textAlign: "center",
    fontSize: SMALL,
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 0,
    marginBottom: 1,
  },
  headerLinkText: {
    color: "#000",
    textDecoration: "none",
  },
  headerSep: {
    marginHorizontal: 5,
    color: "#555",
  },

  // ── Section ─────────────────────────────────────────────────────────────
  section: { marginTop: 5 },
  sectionTitle: {
    fontSize: BASE + 0.8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
    paddingBottom: 1,
    borderBottomWidth: 0.8,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
  },

  // ── Subheading (role / company row) ─────────────────────────────────────
  subheading: { marginBottom: 2, marginTop: 2 },
  subheadingRow1: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  subheadingRole: { fontWeight: "bold", fontSize: BASE },
  subheadingDate: { fontSize: SMALL, fontStyle: "italic" },
  subheadingRow2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  subheadingOrg: { fontSize: SMALL, fontStyle: "italic" },
  subheadingLoc: { fontSize: SMALL, fontStyle: "italic" },

  // ── Bullet list ──────────────────────────────────────────────────────────
  bulletList: { paddingLeft: 10, marginBottom: 0 },
  bulletRow: { flexDirection: "row", marginBottom: 1 },
  bulletDot: { width: 10, fontSize: SMALL, marginTop: 0.5 },
  bulletText: { flex: 1, fontSize: SMALL, lineHeight: 1.15 },

  // ── Project heading ──────────────────────────────────────────────────────
  projRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 1,
    marginTop: 2,
  },
  projTitle: { fontWeight: "bold", fontSize: BASE },
  projTech: { fontStyle: "italic", fontSize: TINY },
  projDate: { fontSize: SMALL, fontStyle: "italic" },

  // ── Skills ───────────────────────────────────────────────────────────────
  skillRow: { flexDirection: "row", marginBottom: 1.5 },
  skillCat: { fontWeight: "bold", fontSize: SMALL },
  skillItems: { flex: 1, fontSize: SMALL },
});

// ─── Helpers ──────────────────────────────────────────────────────────────

function Bullet({ text }: Readonly<{ text: string }>) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function SectionTitle({ children }: Readonly<{ children: string }>) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

interface Props {
  resume: Resume;
}

/**
 * ResumePDFPages
 *
 * Renders the parsed Resume as a single PDF Page.
 * The caller (download route) wraps this in a <Document> element
 * before passing to renderToBuffer.
 */
export default function ResumePDFPages({ resume }: Readonly<Props>) {
  const {
    contact,
    education,
    experience,
    projects,
    skills,
    extracurriculars = [],
  } = resume;

  return (
    <Page size={[PAGE_W, PAGE_H]} style={styles.page}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <Text style={styles.headerName}>{contact.name}</Text>
      <View style={styles.headerLinks}>
        {contact.links.map((link, i) => (
          <Text key={link.url} style={{ fontSize: SMALL }}>
            {i > 0 && <Text style={styles.headerSep}> | </Text>}
            <Link src={link.url} style={styles.headerLinkText}>
              {link.label}
            </Link>
          </Text>
        ))}
        {contact.phone && (
          <Text style={{ fontSize: SMALL }}>
            <Text style={styles.headerSep}> | </Text>
            {contact.phone}
          </Text>
        )}
      </View>

      {/* ── Education ──────────────────────────────────────────────── */}
      {education.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>Education</SectionTitle>
          {education.map((ed) => (
            <View key={ed.institution} style={styles.subheading}>
              <View style={styles.subheadingRow1}>
                <Text style={styles.subheadingRole}>{ed.institution}</Text>
                <Text style={styles.subheadingDate}>
                  {ed.period.start} – {ed.period.end}
                </Text>
              </View>
              <View style={styles.subheadingRow2}>
                <Text style={styles.subheadingOrg}>
                  {ed.degree}
                  {ed.field ? `, ${ed.field}` : ""}
                  {ed.gpa ? `  ·  GPA: ${ed.gpa.display ?? ed.gpa.value}` : ""}
                  {ed.honours && ed.honours.length > 0
                    ? `  ·  ${ed.honours.join(", ")}`
                    : ""}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Experience ─────────────────────────────────────────────── */}
      {experience.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>Experience</SectionTitle>
          {experience.map((exp) => (
            <View key={`${exp.company}-${exp.period.start}`}>
              <View style={styles.subheading}>
                <View style={styles.subheadingRow1}>
                  <Text style={styles.subheadingRole}>{exp.role}</Text>
                  <Text style={styles.subheadingDate}>
                    {exp.period.start} – {exp.period.end}
                  </Text>
                </View>
                <View style={styles.subheadingRow2}>
                  <Text style={styles.subheadingOrg}>{exp.company}</Text>
                  {exp.location ? (
                    <Text style={styles.subheadingLoc}>{exp.location}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.bulletList}>
                {exp.bullets.map((b) => (
                  <Bullet key={b.slice(0, 50)} text={b} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Projects ───────────────────────────────────────────────── */}
      {projects.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>Projects</SectionTitle>
          {projects.map((proj) => (
            <View key={proj.title}>
              <View style={styles.projRow}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 3,
                  }}
                >
                  {proj.repoUrl ? (
                    <Link
                      src={proj.repoUrl}
                      style={{
                        ...styles.projTitle,
                        textDecoration: "none",
                        color: "#000",
                      }}
                    >
                      {proj.title}
                    </Link>
                  ) : (
                    <Text style={styles.projTitle}>{proj.title}</Text>
                  )}
                  {proj.techStack.length > 0 && (
                    <Text style={styles.projTech}>
                      {" "}
                      | {proj.techStack.join(", ")}
                    </Text>
                  )}
                </View>
                <Text style={styles.projDate}>
                  {proj.period.start}
                  {proj.period.end && proj.period.end !== proj.period.start
                    ? ` – ${proj.period.end}`
                    : ""}
                </Text>
              </View>
              <View style={styles.bulletList}>
                {proj.bullets.map((b) => (
                  <Bullet key={b.slice(0, 50)} text={b} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Skills ─────────────────────────────────────────────────── */}
      {skills.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>Technical Skills</SectionTitle>
          <View style={{ paddingLeft: 4 }}>
            {skills.map((sk) => (
              <View key={sk.category} style={styles.skillRow}>
                <Text style={styles.skillCat}>{sk.category}: </Text>
                <Text style={styles.skillItems}>{sk.skills.join(", ")}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Extracurriculars ───────────────────────────────────────── */}
      {extracurriculars.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>Extra-Curricular Activities</SectionTitle>
          {extracurriculars.map((act) => (
            <View key={`${act.organisation}-${act.period.start}`}>
              <View style={styles.subheading}>
                <View style={styles.subheadingRow1}>
                  <Text style={styles.subheadingRole}>{act.role}</Text>
                  <Text style={styles.subheadingDate}>
                    {act.period.start}
                    {act.period.end && act.period.end !== act.period.start
                      ? ` – ${act.period.end}`
                      : ""}
                  </Text>
                </View>
                <View style={styles.subheadingRow2}>
                  <Text style={styles.subheadingOrg}>{act.organisation}</Text>
                  {act.location ? (
                    <Text style={styles.subheadingLoc}>{act.location}</Text>
                  ) : null}
                </View>
              </View>
              {act.bullets.length > 0 && (
                <View style={styles.bulletList}>
                  {act.bullets.map((b) => (
                    <Bullet key={b.slice(0, 50)} text={b} />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </Page>
  );
}
