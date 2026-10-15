"use client";

import { useEffect, useState } from "react";

export function greetingFor(hour: number): string {
  if (hour < 5) return "A quiet night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "A quiet night";
}

/**
 * Greets by the student's own local time. The server renders a first guess (from their saved
 * timezone); the browser corrects it after hydration. One line, so nothing moves.
 */
export function Greeting({ firstName, serverHour }: { firstName: string; serverHour: number }) {
  const [hour, setHour] = useState(serverHour);
  useEffect(() => setHour(new Date().getHours()), []);
  return (
    <h1 className="display text-4xl leading-tight text-ink sm:text-5xl">
      <span className="block truncate">
        {greetingFor(hour)}, <span className="text-accent">{firstName}</span>
      </span>
    </h1>
  );
}
