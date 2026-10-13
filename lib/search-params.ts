/** First value of a Next.js search param (which may be a string, an array or missing). */
export function param(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
