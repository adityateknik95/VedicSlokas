import { describe, expect, it } from "vitest";
import { pickSurprise, type SurpriseCandidate } from "@/lib/dashboard/surprise";

const lib: SurpriseCandidate[] = [
  { slug: "a", themes: ["peace"] },
  { slug: "b", themes: ["courage"] },
  { slug: "c", themes: ["peace", "focus"] },
  { slug: "d", themes: ["devotion"] },
  { slug: "e", themes: ["knowledge"] },
  { slug: "f", themes: ["gratitude"] },
  { slug: "g", themes: ["courage", "focus"] },
];

/** Deterministic random sequence. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

const tally = (n: number, input: Omit<Parameters<typeof pickSurprise>[0], "random">) => {
  const counts = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const slug = pickSurprise({ ...input, random: () => (i + 0.5) / n })!;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return counts;
};

describe("pickSurprise", () => {
  it("returns null only when there is nothing to pick", () => {
    expect(pickSurprise({ candidates: [], viewed: new Set(), recent: [], interests: [] })).toBeNull();
  });

  it("never repeats one of the last five while anything else is available", () => {
    const recent = ["a", "b", "c", "d", "e"];
    for (let r = 0; r < 1; r += 0.01) {
      const pick = pickSurprise({ candidates: lib, viewed: new Set(), recent, interests: [], random: () => r });
      expect(["f", "g"]).toContain(pick);
    }
  });

  it("only looks at the last five picks, not older ones", () => {
    const recent = ["a", "b", "c", "d", "e", "f"];
    const counts = tally(1000, { candidates: lib, viewed: new Set(), recent, interests: [] });
    expect(counts.get("f")).toBeGreaterThan(0);
  });

  it("strongly prefers slokas the student has not opened", () => {
    const viewed = new Set(["a", "b", "c", "d", "e", "f"]);
    const counts = tally(1000, { candidates: lib, viewed, recent: [], interests: [] });
    // g is 1 of 7, but unseen weighs 4x: 4 / (6 + 4) = 40% of picks.
    expect(counts.get("g")).toBeGreaterThan(350);
    expect(counts.get("g")).toBeLessThan(450);
  });

  it("gently favours the student's interests", () => {
    const counts = tally(1400, { candidates: lib, viewed: new Set(), recent: [], interests: ["peace"] });
    expect(counts.get("a")!).toBeGreaterThan(counts.get("b")!);
    expect(counts.get("c")!).toBeGreaterThan(counts.get("d")!);
    // Gently: a non-interest sloka still comes up.
    expect(counts.get("d")).toBeGreaterThan(0);
  });

  it("falls back gracefully when everything has been seen", () => {
    const viewed = new Set(lib.map((c) => c.slug));
    const counts = tally(700, { candidates: lib, viewed, recent: [], interests: [] });
    expect(counts.size).toBe(lib.length);
  });

  it("with a library smaller than the window, avoids only the latest pick", () => {
    const tiny = lib.slice(0, 3);
    for (let r = 0; r < 1; r += 0.05) {
      expect(pickSurprise({ candidates: tiny, viewed: new Set(), recent: ["a", "b", "c"], interests: [], random: () => r })).not.toBe("a");
    }
  });

  it("returns the only sloka when there is just one", () => {
    expect(pickSurprise({ candidates: [lib[0]], viewed: new Set(["a"]), recent: ["a"], interests: [], random: seq(0.9) })).toBe("a");
  });

  it("is safe against a random source that returns exactly 1", () => {
    expect(pickSurprise({ candidates: lib, viewed: new Set(), recent: [], interests: [], random: () => 1 })).toBe("g");
  });
});
