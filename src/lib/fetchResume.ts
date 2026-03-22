import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Returns the raw LaTeX resume source.
 *
 * When the `RESUME_URL` environment variable is set, the source is fetched
 * from that URL (GitHub Gist, S3, Dropbox, etc.) so the site can be updated
 * without a re-deploy.  Otherwise the bundled `src/data/resume.sty` is read
 * from disk.
 */
export async function fetchLatexSource(): Promise<string> {
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
  const filePath = join(process.cwd(), "src", "data", "resume.sty");
  return readFileSync(filePath, "utf8");
}
