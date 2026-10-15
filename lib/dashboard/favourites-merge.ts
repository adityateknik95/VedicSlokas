/**
 * Merging a device's saved favourites (localStorage) into an account.
 * Union, no duplicates, junk dropped, server order kept first. Running it again with the
 * same input inserts nothing, so it is safe on every sign in and in every open tab.
 */
export function mergeFavourites(
  server: readonly string[],
  local: readonly unknown[],
  isValid: (slug: unknown) => slug is string,
): { merged: string[]; toInsert: string[] } {
  const merged = [...new Set(server.filter(isValid))];
  const have = new Set(merged);
  const toInsert: string[] = [];
  for (const slug of local) {
    if (isValid(slug) && !have.has(slug)) {
      have.add(slug);
      toInsert.push(slug);
      merged.push(slug);
    }
  }
  return { merged, toInsert };
}
