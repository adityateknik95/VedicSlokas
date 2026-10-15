import { describe, expect, it } from "vitest";
import { mergeFavourites } from "@/lib/dashboard/favourites-merge";
import { isSlokaSlug, slokas } from "@/lib/slokas";

const [a, b, c] = slokas.map((s) => s.slug);

describe("mergeFavourites (device favourites into the account)", () => {
  it("unions the two lists, server order first, without duplicates", () => {
    const r = mergeFavourites([a, b], [b, c, c], isSlokaSlug);
    expect(r.merged).toEqual([a, b, c]);
    expect(r.toInsert).toEqual([c]);
  });

  it("drops junk: unknown slugs, non-strings and empty values", () => {
    const r = mergeFavourites([a], ["not-a-sloka", 42, null, "", { slug: b }, c], isSlokaSlug);
    expect(r.toInsert).toEqual([c]);
  });

  it("is idempotent: merging the same device twice inserts nothing the second time", () => {
    const first = mergeFavourites([a], [b, c], isSlokaSlug);
    const second = mergeFavourites(first.merged, [b, c], isSlokaSlug);
    expect(second.toInsert).toEqual([]);
    expect(second.merged).toEqual(first.merged);
  });

  it("handles an empty device and an empty account", () => {
    expect(mergeFavourites([], [], isSlokaSlug)).toEqual({ merged: [], toInsert: [] });
    expect(mergeFavourites([a], [], isSlokaSlug).toInsert).toEqual([]);
    expect(mergeFavourites([], [a], isSlokaSlug).toInsert).toEqual([a]);
  });

  it("also cleans junk that is somehow already on the server side", () => {
    expect(mergeFavourites([a, "ghost"], [], isSlokaSlug).merged).toEqual([a]);
  });
});
