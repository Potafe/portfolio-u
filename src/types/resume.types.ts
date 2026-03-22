// ============================================================
//  Resume Data Types
//  Designed to capture every field in a LaTeX-based resume
//  and power an auto-populated portfolio site.
// ============================================================

// ----------------------------
//  Primitives & Shared Types
// ----------------------------

export interface DateRange {
  /** ISO-8601 date string, human label ("Jan 2025"), or "Present" */
  start: string;
  /** ISO date string, or "Present" for ongoing roles */
  end: string;
}

export interface Link {
  label: string;
  url: string;
  /** FontAwesome icon name, e.g. "github", "linkedin", "envelope" */
  icon?: string;
}

// ----------------------------
//  Header / Contact
// ----------------------------

export interface ContactInfo {
  name: string;
  phone?: string;
  email?: string;
  links: Link[];
  /** Optional one-liner tagline / summary shown on portfolio */
  summary?: string;
}

// ----------------------------
//  Education
// ----------------------------

export interface EducationEntry {
  institution: string;
  location?: string;
  degree: string;
  /** e.g. "Electronics and Communication", "Computer Science" */
  field?: string;
  period: DateRange;
  gpa?: {
    value: number;
    scale: number; // e.g. 10.0 or 4.0
    display: string; // "9.54/10.0"
  };
  /** Honours, awards, distinctions — e.g. "Gold Medalist", "Summa Cum Laude" */
  honours?: string[];
  /** Relevant coursework, minor, concentration */
  notes?: string[];
}

// ----------------------------
//  Experience
// ----------------------------

export interface ExperienceEntry {
  company: string;
  companyUrl?: string;
  location?: string;
  role: string;
  period: DateRange;
  /** Markdown / plain-text bullet points */
  bullets: string[];
  /** Tags extracted from bullets for skill matching */
  tags?: string[];
  /** "full-time" | "internship" | "apprentice" | "contract" | "freelance" */
  type?: "full-time" | "internship" | "apprentice" | "contract" | "freelance";
}

// ----------------------------
//  Projects
// ----------------------------

export interface ProjectLink {
  label: string; // "GitHub", "Demo", "Paper"
  url: string;
  icon?: string;
}

export interface ProjectEntry {
  title: string;
  period: DateRange;
  /** Primary repository or demo URL (legacy convenience field) */
  repoUrl?: string;
  links?: ProjectLink[];
  techStack: string[];
  bullets: string[];
  /** Optional longer description for portfolio page */
  description?: string;
  /** Featured project shown prominently on portfolio */
  featured?: boolean;
  /** Cover / thumbnail image path or URL */
  image?: string;
}

// ----------------------------
//  Skills
// ----------------------------

export interface SkillCategory {
  /** "Languages", "Frameworks", "DevSecOps", "AI/ML & DBs", "Other" */
  category: string;
  skills: string[];
}

export type SkillsSection = SkillCategory[];

// ----------------------------
//  Extracurriculars / Activities
// ----------------------------

export interface ActivityEntry {
  role: string;
  organisation: string;
  location?: string;
  period: DateRange;
  bullets: string[];
}

// ----------------------------
//  Optional Sections
//  (certifications, publications, awards — extend as needed)
// ----------------------------

export interface Certification {
  title: string;
  issuer: string;
  date?: string;
  credentialUrl?: string;
  credentialId?: string;
}

export interface Publication {
  title: string;
  authors: string[];
  venue: string;
  date?: string;
  url?: string;
  doi?: string;
}

export interface Award {
  title: string;
  issuer?: string;
  date?: string;
  description?: string;
}

export interface VolunteerEntry {
  role: string;
  organisation: string;
  period: DateRange;
  bullets: string[];
}

// ----------------------------
//  Root Resume Type
// ----------------------------

export interface Resume {
  /** Metadata about the resume file / version itself */
  meta?: {
    version?: string;
    lastUpdated?: string;
    /** "en", "hi", etc. */
    language?: string;
    sourceFile?: string; // e.g. "resume.tex"
  };

  contact: ContactInfo;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: SkillsSection;
  extracurriculars?: ActivityEntry[];

  // Optional extended sections
  certifications?: Certification[];
  publications?: Publication[];
  awards?: Award[];
  volunteering?: VolunteerEntry[];
}

// ----------------------------
//  Portfolio-Specific Extras
//  (derived / enriched data, not in the raw LaTeX)
// ----------------------------

/** Flat list of all unique technologies mentioned anywhere in the resume */
export type TechCloud = string[];

/** Summary stats useful for a portfolio "at a glance" section */
export interface ResumeSummaryStats {
  yearsOfExperience: number;
  numberOfProjects: number;
  numberOfCompanies: number;
  topSkills: string[];
  latestRole: Pick<ExperienceEntry, "role" | "company" | "period">;
}

/** The full enriched payload a portfolio site would consume */
export interface PortfolioData {
  resume: Resume;
  techCloud?: TechCloud;
  stats?: ResumeSummaryStats;
}
