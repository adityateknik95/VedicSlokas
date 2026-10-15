/** Google photo when there is one, otherwise initials on a soft gold disc. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts.slice(0, 1);
  return letters.map((p) => Array.from(p)[0]?.toUpperCase() ?? "").join("") || "•";
}

export function Avatar({ name, image, size }: { name: string; image: string | null; size: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "h-16 w-16 text-xl" : size === "md" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs";
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt="" referrerPolicy="no-referrer" className={`${dim} shrink-0 rounded-full border border-line object-cover`} />
    );
  }
  return (
    <span aria-hidden="true" className={`${dim} grid shrink-0 place-items-center rounded-full border border-gold/50 bg-[radial-gradient(circle_at_30%_30%,rgb(232_137_28/0.35),rgb(201_162_75/0.12))] font-semibold text-ink`}>
      {initialsOf(name)}
    </span>
  );
}
