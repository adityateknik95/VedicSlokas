export const site = {
  name: "VedicSlokas",
  tagline: "Ancient verses, lit for a new generation.",
  description:
    "A home for Sanskrit slokas from the Vedas, Upaniṣads, Bhagavad Gītā and beloved stotras: Devanagari, transliteration, word-by-word meaning and translation, made for young readers.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
};
