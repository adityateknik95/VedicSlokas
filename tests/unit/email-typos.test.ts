import { describe, expect, it } from "vitest";
import { suggestEmail } from "@/lib/email-typos";

describe("suggestEmail", () => {
  it.each([
    ["asha@gmial.com", "asha@gmail.com"],
    ["asha@gmai.com", "asha@gmail.com"],
    ["asha@gamil.com", "asha@gmail.com"],
    ["asha@gmail.con", "asha@gmail.com"],
    ["asha@gmail.co", "asha@gmail.com"],
    ["asha@hotmial.com", "asha@hotmail.com"],
    ["asha@yahooo.com", "asha@yahoo.com"],
    ["asha@outlok.com", "asha@outlook.com"],
    ["Asha.Rao@GMIAL.COM", "Asha.Rao@gmail.com"],
  ])("suggests a fix for %s", (input, expected) => {
    expect(suggestEmail(input)).toBe(expected);
  });

  it.each(["asha@gmail.com", "asha@yahoo.co.in", "asha@rediffmail.com", "asha@iitm.ac.in", "asha@company.io", "asha@vedicslokas.com", "no-at-sign", "asha@", "@gmail.com"])(
    "leaves %s alone",
    (input) => {
      expect(suggestEmail(input)).toBeNull();
    },
  );
});
