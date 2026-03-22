/**
 * LaTeX Resume Parser
 *
 * Parses the custom-command LaTeX resume format into the `Resume` type.
 * Supports the following custom commands used in the template:
 *   \resumeSubheading, \resumeProjectHeading, \resumeItem,
 *   \resumeSubHeadingListStart/End, \resumeItemListStart/End
 *
 * Usage:
 *   import { parseLatexResume } from "./resumeParser";
 *   const resume = parseLatexResume(fs.readFileSync("resume.tex", "utf8"));
 */

import type {
  Resume,
  ContactInfo,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  SkillsSection,
  ActivityEntry,
  DateRange,
  Link,
  TechCloud,
  ResumeSummaryStats,
} from "@/types/resume.types";

// ─────────────────────────────────────────────
//  Tiny Utilities
// ─────────────────────────────────────────────

/** Strip outer braces from a LaTeX argument: {foo} → foo */
function stripBraces(s: string): string {
  return s.replaceAll(/^\{|\}$/g, "").trim();
}

/** Remove common LaTeX markup and return clean plain text */
function cleanLatex(s: string): string {
  return s
    .replaceAll(/\\textbf\{([^}]*)\}/g, "$1") // \textbf{x} → x
    .replaceAll(/\\textit\{([^}]*)\}/g, "$1") // \textit{x} → x
    .replaceAll(/\\emph\{([^}]*)\}/g, "$1") // \emph{x}   → x
    .replaceAll(/\\small\{([^}]*)\}/g, "$1")
    .replaceAll(/\\footnotesize\\emph\{([^}]*)\}/g, "$1")
    .replaceAll(/\\underline\{([^}]*)\}/g, "$1")
    .replaceAll(/\\href\{[^}]*\}\{([^}]*)\}/g, "$1") // \href{url}{label} → label
    .replaceAll(/\\faIcon\{[^}]*\}/g, "")
    .replaceAll(/\$\|?\$/g, "")
    .replaceAll(String.raw`\\`, "")
    .replaceAll(/\\vspace\{[^}]*\}/g, "")
    .replaceAll(/\\hspace\{[^}]*\}/g, "")
    .replaceAll(/\s{2,}/g, " ")
    .trim();
}

/**
 * Extract a URL from \href{URL}{label} or \projectlink{URL}.
 * Returns undefined when no href is found.
 */
function extractUrl(s: string): string | undefined {
  const m = /\\href\{([^}]+)\}/.exec(s) ?? /\\projectlink\{([^}]+)\}/.exec(s);
  return m?.[1];
}

/** Walk from an opening `{` to its matching `}` and return the index after `}`. */
function walkToMatchingBrace(src: string, openIdx: number): number {
  let depth = 0;
  let i = openIdx;
  while (i < src.length) {
    const ch = src.charAt(i);
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
    i++;
  }
  return i;
}

/**
 * Parse up to N brace-delimited arguments starting at `pos` in `src`.
 * Returns [args[], endIndex].
 */
function parseArgs(
  src: string,
  pos: number,
  count: number,
): [string[], number] {
  const args: string[] = [];
  let i = pos;
  while (args.length < count && i < src.length) {
    while (i < src.length && /\s/.test(src.charAt(i))) i++;
    if (i >= src.length || src.charAt(i) !== "{") break;
    const start = i;
    i = walkToMatchingBrace(src, start);
    args.push(src.slice(start, i));
  }
  return [args, i];
}

/** Remove the outer { } from every element of the args array */
function stripAllBraces(args: string[]): string[] {
  return args.map(stripBraces);
}

/** Convert "Aug 2025 – Present" or "2021 - 2025" into a DateRange */
function parseDateRange(raw: string): DateRange {
  const cleaned = raw.replaceAll("–", "-").replaceAll("—", "-").trim();
  const parts = cleaned.split("-").map((p) => p.trim());
  return {
    start: parts[0] ?? "",
    end: parts[1] ?? "Present",
  };
}

// ─────────────────────────────────────────────
//  Section Splitter
// ─────────────────────────────────────────────

/** Split the document body into named LaTeX sections */
function splitSections(src: string): Map<string, string> {
  const sectionRe = /\\section\{([^}]+)\}/g;
  const sections = new Map<string, string>();
  const matches = [...src.matchAll(sectionRe)];

  for (let idx = 0; idx < matches.length; idx++) {
    const m = matches[idx];
    if (!m) continue;
    const name = (m[1] ?? "").trim().toLowerCase();
    const start = (m.index ?? 0) + m[0].length;
    const nextMatch = matches[idx + 1];
    const end = nextMatch?.index ?? src.length;
    sections.set(name, src.slice(start, end));
  }
  return sections;
}

// ─────────────────────────────────────────────
//  Contact / Heading Parser
// ─────────────────────────────────────────────

function parseContact(src: string): ContactInfo {
  // \begin{center} ... \end{center} block
  const centerMatch = /\\begin\{center\}([\s\S]*?)\\end\{center\}/.exec(src);
  const block = centerMatch ? (centerMatch[1] ?? src) : src;

  // Name: \textbf{\Huge \scshape Name Name}
  const nameMatch = /\\scshape\s([^\\]*)\\\\/.exec(block);
  const name = nameMatch
    ? (() => {
        let s = cleanLatex((nameMatch[1] ?? "").trimEnd());
        // Strip trailing } characters without a regex to avoid any
        // super-linear backtracking flagged by static analysis tools.
        while (s.endsWith("}")) s = s.slice(0, -1);
        return s.trim();
      })()
    : "Unknown";

  // Phone: \href{tel:...}{label}
  const phoneMatch = /\\href\{tel:([^}]+)\}/.exec(block);
  const phone = phoneMatch?.[1] ?? "";

  // Email
  const emailMatch = /\\href\{mailto:([^}]+)\}/.exec(block);
  const email = emailMatch?.[1] ?? "";

  // All links: \faIcon{icon}\href{url}{label}
  const links: Link[] = [];
  const linkRe =
    /\\faIcon\{([^}]+)\}\\href\{([^}]+)\}\{\\underline\{([^}]+)\}\}/g;
  for (const m of block.matchAll(linkRe)) {
    const icon = m[1];
    const url = m[2];
    const label = m[3];
    if (icon && url && label) {
      links.push({ label, url, icon });
    }
  }

  return {
    name,
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
    links,
  };
}

// ─────────────────────────────────────────────
//  \resumeItem bullet extractor
// ─────────────────────────────────────────────

function extractBullets(block: string): string[] {
  const bullets: string[] = [];
  const re = /\\resumeItem\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const [args] = parseArgs(
      block,
      m.index + String.raw`\resumeItem`.length,
      1,
    );
    const arg = args[0];
    if (arg) bullets.push(cleanLatex(stripBraces(arg)));
  }
  return bullets;
}

// ─────────────────────────────────────────────
//  Education Parser helpers
// ─────────────────────────────────────────────

function parseGpaFromExtra(
  extra: string | undefined,
): EducationEntry["gpa"] | undefined {
  if (!extra) return undefined;

  const parts = extra.split("/");
  if (parts.length !== 2) return undefined;

  const valueStr = (parts[0] ?? "").trim();
  const scaleStr = (parts[1] ?? "").trim();

  const isValid = (s: string) => /^\d+(\.\d+)?$/.test(s);

  if (!isValid(valueStr) || !isValid(scaleStr)) return undefined;

  return {
    value: Number.parseFloat(valueStr),
    scale: Number.parseFloat(scaleStr),
    display: `${valueStr}/${scaleStr}`,
  };
}

function parseHonoursFromExtra(extra: string | undefined): string[] {
  if (!extra) return [];
  const honours: string[] = [];
  const re = /\\textbf\{([^}]+)\}/g;
  for (const m of extra.matchAll(re)) {
    const h = m[1];
    if (h === undefined) continue;
    if (/\d/.test(h)) continue;
    honours.push(h);
  }
  return honours;
}

function parseDegreeAndField(degreeClean: string): {
  degree: string;
  field?: string;
} {
  const idx = degreeClean.indexOf(",");

  if (idx === -1) {
    return { degree: degreeClean };
  }

  const degree = degreeClean.slice(0, idx).trim();
  const field = degreeClean.slice(idx + 1).trim();

  return field ? { degree, field } : { degree };
}

// ─────────────────────────────────────────────
//  Education Parser
// ─────────────────────────────────────────────

function parseEducation(block: string): EducationEntry[] {
  const entries: EducationEntry[] = [];
  const re = /\\resumeSubheading/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(block)) !== null) {
    const [rawArgs, afterArgs] = parseArgs(block, m.index + m[0].length, 4);
    const [institution, period, degree, extra] = stripAllBraces(rawArgs);

    const gpa = parseGpaFromExtra(extra);
    const honours = parseHonoursFromExtra(extra);
    const nextSubheading = block.indexOf(
      String.raw`\resumeSubheading`,
      m.index + 1,
    );
    const slice = block.slice(
      afterArgs,
      nextSubheading === -1 ? undefined : nextSubheading,
    );

    const degreeClean = cleanLatex(degree ?? "");
    const { degree: parsedDegree, field } = parseDegreeAndField(degreeClean);
    const notes = extractBullets(slice);

    entries.push({
      institution: cleanLatex(institution ?? ""),
      degree: parsedDegree,
      ...(field ? { field } : {}),
      period: parseDateRange(cleanLatex(period ?? "")),
      ...(gpa ? { gpa } : {}),
      ...(honours.length ? { honours } : {}),
      ...(notes.length ? { notes } : {}),
    });
  }
  return entries;
}

// ─────────────────────────────────────────────
//  Experience Parser
// ─────────────────────────────────────────────

function parseExperience(block: string): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  const positions: number[] = [];
  const re = /\\resumeSubheading/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) positions.push(m.index);

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i]!; // safe: i < positions.length
    const end = positions[i + 1] ?? block.length;
    const [rawArgs, afterArgs] = parseArgs(
      block,
      start + String.raw`\resumeSubheading`.length,
      4,
    );
    const [role, period, company, location] = stripAllBraces(rawArgs);

    const slice = block.slice(afterArgs, end);
    const bullets = extractBullets(slice);

    // Derive type from role keyword
    const roleClean = cleanLatex(role ?? "").toLowerCase();
    let type: ExperienceEntry["type"] = "full-time";
    if (roleClean.includes("intern")) type = "internship";
    else if (roleClean.includes("apprentice")) type = "apprentice";
    else if (roleClean.includes("contract")) type = "contract";
    else if (roleClean.includes("freelance")) type = "freelance";

    entries.push({
      role: cleanLatex(role ?? ""),
      company: cleanLatex(company ?? ""),
      ...(location ? { location: cleanLatex(location) } : {}),
      period: parseDateRange(cleanLatex(period ?? "")),
      bullets,
      type,
    });
  }
  return entries;
}

// ─────────────────────────────────────────────
//  Projects Parser
// ─────────────────────────────────────────────

function parseProjects(block: string): ProjectEntry[] {
  const entries: ProjectEntry[] = [];
  const positions: number[] = [];
  const re = /\\resumeProjectHeading/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) positions.push(m.index);

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i]!; // safe: i < positions.length
    const end = positions[i + 1] ?? block.length;
    const [rawArgs, afterArgs] = parseArgs(
      block,
      start + String.raw`\resumeProjectHeading`.length,
      2,
    );
    const [titleBlock, periodRaw] = stripAllBraces(rawArgs);

    const titleBlockStr = titleBlock ?? "";
    // Title: first \textbf{...}
    const titleMatch = /\\textbf\{([^}]+)\}/.exec(titleBlockStr);
    const title = titleMatch
      ? (titleMatch[1] ?? cleanLatex(titleBlockStr))
      : cleanLatex(titleBlockStr);

    // Repo URL from \projectlink{url} or \href{url}{...}
    const repoUrl = extractUrl(titleBlockStr);

    // Tech stack: inside \emph{...}
    const techMatch = /\\emph\{([^}]+)\}/.exec(titleBlockStr);
    const techStack: string[] = techMatch?.[1]
      ? techMatch[1]
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const slice = block.slice(afterArgs, end);
    const bullets = extractBullets(slice);

    entries.push({
      title,
      ...(repoUrl ? { repoUrl } : {}),
      period: parseDateRange(cleanLatex(periodRaw ?? "")),
      techStack,
      bullets,
    });
  }
  return entries;
}

// ─────────────────────────────────────────────
//  Skills Parser
// ─────────────────────────────────────────────

function parseSkills(block: string): SkillsSection {
  // Each line: \textbf{Category}{: skill1, skill2, ...}
  const categories: SkillsSection = [];
  const re = /\\textbf\{([^}]+)\}\{([^}]+)\}/g;
  for (const m of block.matchAll(re)) {
    const cat = m[1];
    const skillsRaw = m[2];
    if (!cat || !skillsRaw) continue;
    const category = cat.trim();
    const skills = skillsRaw
      .replace(/^:\s*/, "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    categories.push({ category, skills });
  }
  return categories;
}

// ─────────────────────────────────────────────
//  Extracurriculars Parser
// ─────────────────────────────────────────────

function parseExtracurriculars(block: string): ActivityEntry[] {
  const entries: ActivityEntry[] = [];
  const positions: number[] = [];
  const re = /\\resumeSubheading/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) positions.push(m.index);

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i]!; // safe: i < positions.length
    const end = positions[i + 1] ?? block.length;
    const [rawArgs, afterArgs] = parseArgs(
      block,
      start + String.raw`\resumeSubheading`.length,
      4,
    );
    const [role, period, organisation, location] = stripAllBraces(rawArgs);

    const slice = block.slice(afterArgs, end);
    const bullets = extractBullets(slice);

    entries.push({
      role: cleanLatex(role ?? ""),
      organisation: cleanLatex(organisation ?? ""),
      ...(location ? { location: cleanLatex(location) } : {}),
      period: parseDateRange(cleanLatex(period ?? "")),
      bullets,
    });
  }
  return entries;
}

// ─────────────────────────────────────────────
//  Main Entry Point
// ─────────────────────────────────────────────

/**
 * Parse a LaTeX resume source string and return a structured `Resume` object.
 *
 * @param latexSource - Raw content of the .tex file as a string
 * @returns Resume
 */
export function parseLatexResume(latexSource: string): Resume {
  // Strip comments
  const src = latexSource.replaceAll(/%[^\n]*/gm, "").replaceAll("\r\n", "\n");

  // Extract the \begin{document}...\end{document} body
  const docMatch = /\\begin\{document\}([\s\S]*?)\\end\{document\}/.exec(src);
  const body = docMatch ? (docMatch[1] ?? src) : src;

  // Parse contact from the \begin{center} block
  const contact = parseContact(body);

  // Split into named sections
  const sections = splitSections(body);

  const education = parseEducation(sections.get("education") ?? "");
  const experience = parseExperience(sections.get("experience") ?? "");
  const projects = parseProjects(sections.get("projects") ?? "");
  const skills = parseSkills(sections.get("skills") ?? "");
  const extracurriculars = parseExtracurriculars(
    sections.get("extracurriculars") ?? "",
  );

  return {
    meta: {
      sourceFile: "resume.tex",
      lastUpdated: new Date().toISOString().split("T")[0] ?? "",
      language: "en",
    },
    contact,
    education,
    experience,
    projects,
    skills,
    extracurriculars,
  };
}

// ─────────────────────────────────────────────
//  Bonus: Portfolio enrichment helpers
// ─────────────────────────────────────────────

/** Collect every unique technology mentioned in skills, projects, and experience */
export function buildTechCloud(resume: Resume): TechCloud {
  const set = new Set<string>();

  // From skills section
  for (const cat of resume.skills) {
    for (const s of cat.skills) set.add(s);
  }
  // From project tech stacks
  for (const p of resume.projects) {
    for (const t of p.techStack) set.add(t);
  }
  // Bold-ish tool names from experience bullets (heuristic: CamelCase or ALL_CAPS words)
  for (const exp of resume.experience) {
    for (const b of exp.bullets) {
      const tokens = b.match(/\b[A-Z][a-zA-Z0-9.+#_-]{2,}\b/g) ?? [];
      tokens.forEach((t) => set.add(t));
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Calculate high-level summary stats for a portfolio hero section */
export function buildSummaryStats(resume: Resume): ResumeSummaryStats {
  // Years of experience from earliest job start to now
  const allStarts = resume.experience.map((e) =>
    new Date(e.period.start).getFullYear(),
  );
  const earliest = Math.min(...allStarts.filter((y) => !Number.isNaN(y)));
  const yearsOfExperience = new Date().getFullYear() - earliest;

  const companies = new Set(resume.experience.map((e) => e.company));

  // Top skills = first category with most entries
  const topCat = [...resume.skills].sort(
    (a, b) => b.skills.length - a.skills.length,
  )[0];
  const topSkills = topCat?.skills.slice(0, 6) ?? [];

  // Latest role = most recent experience entry
  const latestRole = resume.experience[0];
  if (!latestRole) {
    return {
      yearsOfExperience,
      numberOfProjects: resume.projects.length,
      numberOfCompanies: companies.size,
      topSkills,
      latestRole: { role: "", company: "", period: { start: "", end: "" } },
    };
  }

  return {
    yearsOfExperience,
    numberOfProjects: resume.projects.length,
    numberOfCompanies: companies.size,
    topSkills,
    latestRole: {
      role: latestRole.role,
      company: latestRole.company,
      period: latestRole.period,
    },
  };
}
