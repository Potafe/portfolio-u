import { readFileSync } from "node:fs";
import { join } from "node:path";

// My public Gist ID containing resume.sty
const GIST_ID = "c27c6564e62bf57436eb4bdacf3fa70b";

interface GistFile {
  filename: string;
  raw_url: string;
}

interface GistResponse {
  files: Record<string, GistFile>;
}

/**
 * Returns the raw LaTeX resume source.
 *
 * Priority order:
 *  1. `RESUME_URL` env var — explicit raw URL (GitHub Gist, S3, Dropbox, etc.)
 *  2. Public Gist API — auto-discovers the latest raw URL for `resume.sty`
 *     from the Gist with ID `GIST_ID` so the site stays current without a
 *     re-deploy whenever the Gist is updated.
 *  3. Bundled `src/data/resume.sty` — local fallback for dev / offline use.
 */
export async function fetchLatexSource(): Promise<string> {
  // 1. Explicit override
  const remoteUrl = process.env.RESUME_URL;
  if (remoteUrl) {
    const res = await fetch(remoteUrl, { next: { revalidate: 60 } });
    if (!res.ok) {
      throw new Error(
        `Failed to fetch resume from RESUME_URL: ${res.status} ${res.statusText}`,
      );
    }
    return res.text();
  }

  // 2. Auto-discover from public Gist API
  try {
    const apiRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "portfolio-u",
        // Inject a token if available to avoid rate-limit (60 req/hr unauthenticated)
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      next: { revalidate: 60 },
    });

    if (apiRes.ok) {
      const gist = (await apiRes.json()) as GistResponse;
      const styFile = gist.files["resume.sty"];
      if (styFile?.raw_url) {
        const rawRes = await fetch(styFile.raw_url, {
          next: { revalidate: 60 },
        });
        if (rawRes.ok) return rawRes.text();
      }
    }
  } catch {
    // Fall through to local file on any network error
  }

  // 3. Local bundled file
  const filePath = join(process.cwd(), "src", "data", "resume.sty");
  return readFileSync(filePath, "utf8");
}
