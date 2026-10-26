/**
 * Folds IAST and everyday spellings onto one form, so "shiva", "śiva" and
 * "siva" all match, and "krishna" matches "kṛṣṇa". No data, so it is safe in the browser.
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’‘|-]/g, " ")
    .replace(/sh/g, "s")
    .replace(/ch/g, "c")
    .replace(/ri/g, "r")
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/w/g, "v")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every term of the query appears somewhere in the haystack. */
export const matchesAll = (haystack: string, query: string) => {
  const terms = normalize(query).split(" ").filter(Boolean);
  return terms.every((t) => haystack.includes(t));
};
