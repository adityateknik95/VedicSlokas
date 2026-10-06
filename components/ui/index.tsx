import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-3 ${className}`}>
      <span aria-hidden="true" className="inline-block h-px w-6 bg-current opacity-60" />
      {children}
    </p>
  );
}

type HeadingProps = {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
  id?: string;
};

/** Small uppercase eyebrow over a large serif heading. Used above every section. */
export function SectionHeading({ eyebrow, title, lede, align = "center", as: Tag = "h2", id }: HeadingProps) {
  const center = align === "center";
  return (
    <header className={`mb-10 sm:mb-14 ${center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      <div data-reveal={Tag === "h1" ? undefined : true} className={center ? "flex justify-center" : ""}>
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      {/* An h1 is the page's main content (and usually its LCP), so it is never hidden waiting for JS. */}
      <Tag id={id} data-reveal={Tag === "h1" ? undefined : true} style={{ ["--i" as string]: 1 }} className="display mt-4 text-4xl text-ink sm:text-5xl md:text-6xl">
        {title}
      </Tag>
      {lede && (
        <p data-reveal={Tag === "h1" ? undefined : true} style={{ ["--i" as string]: 2 }} className="mt-5 text-base text-ink-muted sm:text-lg">
          {lede}
        </p>
      )}
    </header>
  );
}

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-300 ease-temple focus-visible:outline-2";
const variants = {
  primary:
    "bg-saffron text-on-saffron shadow-[0_10px_30px_-10px_var(--glow)] hover:-translate-y-0.5 hover:bg-[#f39a33] hover:shadow-[0_14px_40px_-10px_var(--glow)]",
  ghost: "border border-line text-ink hover:border-gold hover:bg-surface-2 hover:-translate-y-0.5",
} as const;

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: keyof typeof variants };

export function ButtonLink({ variant = "primary", className = "", ...props }: ButtonLinkProps) {
  return <Link {...props} className={`${base} ${variants[variant]} ${className}`} />;
}

type ButtonProps = ComponentProps<"button"> & { variant?: keyof typeof variants };

export function Button({ variant = "ghost", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} {...props} className={`${base} ${variants[variant]} ${className}`} />;
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function ThemeTag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-line px-2.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-ink-muted">
      {children}
    </span>
  );
}
