import "server-only";
import { cache } from "react";
import { getEntitlements } from "@/lib/entitlements";
import { requireUser } from "@/lib/session";
import { getPrefs, listFavourites, listInterest, loadStudentState } from "./data";

/**
 * Per-request loaders for dashboard pages. `cache` means every section on a page shares one
 * set of queries (fetched in parallel), however many sections ask.
 */
export const studentState = cache((userId: string) => loadStudentState(userId));
export const entitlementsFor = cache((userId: string) => getEntitlements(userId));
export const prefsFor = cache((userId: string) => getPrefs(userId));
export const favouritesFor = cache((userId: string) => listFavourites(userId));
export const interestFor = cache((userId: string) => listInterest(userId));

/** The signed-in student, or a redirect to log in that returns to `returnTo`. */
export const dashboardUser = cache(async (returnTo: string) => (await requireUser(returnTo)).user);
