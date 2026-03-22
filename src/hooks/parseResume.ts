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
  return s.replace(/^\{|\}$/g, "").trim();
}

/** Remove common LaTeX markup and return clean plain text */
function cleanLatex(s: string): string {
  return s
    .replace(/\\textbf\{([^}]*)\}/g, "$1") // \textbf{x} → x
    .replace(/\\textit\{([^}]*)\}/g, "$1") // \textit{x} → x
    .replace(/\\emph\{([^}]*)\}/g, "$1") // \emph{x}   → x
    .replace(/\\small\{([^}]*)\}/g, "$1")
    .replace(/\\footnotesize\\emph\{([^}]*)\}/g, "$1")
    .replace(/\\underline\{([^}]*)\}/g, "$1")
    .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, "$1") // \href{url}{label} → label
    .replace(/\\faIcon\{[^}]*\}/g, "")
    .replace(/\$\|?\$/g, "")
    .replace(/\\\\/g, "")
    .replace(/\\vspace\{[^}]*\}/g, "")
    .replace(/\\hspace\{[^}]*\}/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Extract a URL from \href{URL}{label} or \projectlink{URL}.
 * Returns undefined when no href is found.
 */
function extractUrl(s: string): string | undefined {
  const m = s.match(/\\href\{([^}]+)\}/) ?? s.match(/\\projectlink\{([^}]+)\}/);
  return m?.[1];
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
    // skip whitespace / newlines between args
    while (i < src.length && /[\s\n]/.test(src.charAt(i))) i++;
    if (i >= src.length || src.charAt(i) !== "{") break;
    // walk to matching closing brace (handles nesting)
    let depth = 0;
    const start = i;
    while (i < src.length) {
      const ch = src.charAt(i);
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }
      i++;
    }
    args.push(src.slice(start, i)); // includes outer braces
  }
  return [args, i];
}

/** Remove the outer { } from every element of the args array */
function stripAllBraces(args: string[]): string[] {
  return args.map(stripBraces);
}

/** Convert "Aug 2025 – Present" or "2021 - 2025" into a DateRange */
function parseDateRange(raw: string): DateRange {
  const cleaned = raw.replace(/[–—]/g, "-").trim();
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
  const centerMatch = src.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/);
  const block = centerMatch ? (centerMatch[1] ?? src) : src;

  // Name: \textbf{\Huge \scshape Name Name}
  const nameMatch = block.match(/\\scshape\s+(.*?)\s*\\\\/);
  const name = nameMatch ? cleanLatex(nameMatch[1] ?? "") : "Unknown";

  // Phone: \href{tel:...}{label}
  const phoneMatch = block.match(/\\href\{tel:([^}]+)\}/);
  const phone = phoneMatch?.[1] ?? "";

  // Email
  const emailMatch = block.match(/\\href\{mailto:([^}]+)\}/);
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
    const [args] = parseArgs(block, m.index + "\\resumeItem".length, 1);
    const arg = args[0];
    if (arg) bullets.push(cleanLatex(stripBraces(arg)));
  }
  return bullets;
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

    // Parse GPA: "GPA: 9.54/10.0" or similar
    let gpa: EducationEntry["gpa"] | undefined;
    const gpaMatch = extra?.match(/([\d.]+)\/([\d.]+)/);
    if (gpaMatch) {
      const gpaValue = gpaMatch[1] ?? "";
      const gpaScale = gpaMatch[2] ?? "";
      gpa = {
        value: parseFloat(gpaValue),
        scale: parseFloat(gpaScale),
        display: `${gpaValue}/${gpaScale}`,
      };
    }

    // Honours: bold tokens after GPA, e.g. \textbf{Gold Medalist}
    const honours: string[] = [];
    const honourRe = /\\textbf\{([^}]+)\}/g;
    for (const hm of (extra ?? "").matchAll(honourRe)) {
      const h = hm[1];
      if (h && !h.match(/[\d.]/)) honours.push(h);
    }

    // Find bullets belonging to this entry
    const nextSubheading = block.indexOf("\\resumeSubheading", m.index + 1);
    const slice = block.slice(
      afterArgs,
      nextSubheading === -1 ? undefined : nextSubheading,
    );

    const degreeClean = cleanLatex(degree ?? "");
    const degreeMatch = degreeClean.match(/^(.+?),\s*(.+)$/);

    entries.push({
      institution: cleanLatex(institution ?? ""),
      degree: degreeMatch
        ? (degreeMatch[1]?.trim() ?? degreeClean)
        : degreeClean,
      ...(degreeMatch?.[2] ? { field: degreeMatch[2].trim() } : {}),
      period: parseDateRange(cleanLatex(period ?? "")),
      ...(gpa !== undefined ? { gpa } : {}),
      ...(honours.length ? { honours } : {}),
      ...(extractBullets(slice).length ? { notes: extractBullets(slice) } : {}),
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
      start + "\\resumeSubheading".length,
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
      start + "\\resumeProjectHeading".length,
      2,
    );
    const [titleBlock, periodRaw] = stripAllBraces(rawArgs);

    const titleBlockStr = titleBlock ?? "";
    // Title: first \textbf{...}
    const titleMatch = titleBlockStr.match(/\\textbf\{([^}]+)\}/);
    const title = titleMatch
      ? (titleMatch[1] ?? cleanLatex(titleBlockStr))
      : cleanLatex(titleBlockStr);

    // Repo URL from \projectlink{url} or \href{url}{...}
    const repoUrl = extractUrl(titleBlockStr);

    // Tech stack: inside \emph{...}
    const techMatch = titleBlockStr.match(/\\emph\{([^}]+)\}/);
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
      start + "\\resumeSubheading".length,
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
  const src = latexSource.replace(/%.*$/gm, "").replace(/\r\n/g, "\n");

  // Extract the \begin{document}...\end{document} body
  const docMatch = src.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
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
  return [...set].sort();
}

/** Calculate high-level summary stats for a portfolio hero section */
export function buildSummaryStats(resume: Resume): ResumeSummaryStats {
  // Years of experience from earliest job start to now
  const allStarts = resume.experience.map((e) =>
    new Date(e.period.start).getFullYear(),
  );
  const earliest = Math.min(...allStarts.filter((y) => !isNaN(y)));
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
