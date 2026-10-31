import { existsSync } from "node:fs";
import path from "node:path";

/** Whether a recitation file really exists, checked when the page is built. Recordings are still to come. */
export function hasRecitation(audio: string): boolean {
  return existsSync(path.join(process.cwd(), "public", audio));
}
