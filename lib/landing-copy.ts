import type { Theme } from "./types";

/**
 * Every word on the landing page, in one place so it can be edited without touching
 * components. All of this is original copy, never presented as scripture: verses come
 * only from data/slokas.json. House style: short lines, no exclamation marks, no em
 * dashes or hyphens, warm and plain.
 */

export const META = {
  title: "VedicSlokas: From the universe, to you",
  description:
    "A journey from the cosmos to the self through the oldest words humanity has. Read Sanskrit slokas with meanings, word by word, and find a verse for how you feel today.",
  ogAlt: "VedicSlokas: From the universe, to you",
};

export const HERO = {
  eyebrow: "Sanskrit slokas, word by word.",
  titleLead: "From the universe,",
  titleTail: "to",
  titleEmphasis: "you.",
  lede: "The oldest words humanity has, still asking who you are. Read one. Sit with it. Carry it into your day.",
  /** Bṛhadāraṇyaka Upaniṣad 1.3.28, the first two lines of the Pavamāna mantra in data/slokas.json. */
  verseDevanagari: "असतो मा सद्गमय । तमसो मा ज्योतिर्गमय ॥",
  verseIast: "asato mā sad gamaya · tamaso mā jyotir gamaya",
  primary: "Begin your journey",
  primarySignedIn: "Go to your dashboard",
  secondary: "Explore slokas",
  scrollCue: "Scroll to fall inward",
  pauseMotion: "Pause motion",
  playMotion: "Play motion",
};

export type DescentScene = {
  key: "cosmos" | "star" | "earth" | "nature" | "body" | "self";
  /** Sanskrit name (IAST) and its Devanagari. */
  name: string;
  devanagari: string;
  /** Plain English gloss for the rail. */
  gloss: string;
  /** The huge caption that fades through. */
  caption: string;
  /** Describes the still shown in the static version (no WebGL, or reduced motion). */
  alt: string;
};

export type ImageCredit = { what: string; who: string; href: string; licence: string };

export const DESCENT_COPY = {
  eyebrow: "The descent",
  title: "From the cosmos to the self",
  railTop: "Brahmāṇḍa · the cosmos",
  railBottom: "Piṇḍa · the individual",
  closing: "What is vast outside is vast within. That is where the slokas begin.",
  loading: "Gathering starlight",
  creditsTitle: "Image credits",
  credits: [
    { what: "Milky Way panorama", who: "ESO/S. Brunier", href: "https://www.eso.org/public/images/eso0932a/", licence: "CC BY 4.0" },
    { what: "Whirlpool Galaxy", who: "NASA, ESA, S. Beckwith (STScI) and the Hubble Heritage Team", href: "https://esahubble.org/images/heic0506a/", licence: "CC BY 4.0" },
    { what: "Earth and Sun maps", who: "Solar System Scope, from NASA imagery", href: "https://www.solarsystemscope.com/textures/", licence: "CC BY 4.0" },
    { what: "Mountain river at dawn", who: "K on Pexels", href: "https://www.pexels.com/photo/sun-rising-over-river-running-through-mountain-valley-23848552/", licence: "Pexels licence" },
    { what: "Silhouette at sunrise", who: "David Kanigan on Pexels", href: "https://www.pexels.com/photo/silhouette-watching-sunrise-at-cove-island-park-29558902/", licence: "Pexels licence" },
    { what: "Hands holding a candle", who: "Vladimir Srajber on Pexels", href: "https://www.pexels.com/photo/close-up-photo-of-a-lighted-candle-11161478/", licence: "Pexels licence" },
  ] satisfies ImageCredit[],
  scenes: [
    { key: "cosmos", name: "Brahmāṇḍa", devanagari: "ब्रह्माण्ड", gloss: "the cosmos", caption: "Everything that is.", alt: "The Whirlpool Galaxy against a field of stars" },
    { key: "star", name: "Sūrya", devanagari: "सूर्य", gloss: "a star", caption: "One star among billions.", alt: "The Sun blazing among the stars" },
    { key: "earth", name: "Pṛthvī", devanagari: "पृथ्वी", gloss: "the earth", caption: "One small blue world.", alt: "The Earth, half in daylight, seen from space" },
    { key: "nature", name: "Prakṛti", devanagari: "प्रकृति", gloss: "nature", caption: "Rivers. Mountains. Mornings.", alt: "Sunrise over a river winding through a mountain valley" },
    { key: "body", name: "Śarīra", devanagari: "शरीर", gloss: "the body", caption: "And then, one of you.", alt: "A person sitting in silhouette against the rising sun" },
    { key: "self", name: "Ātman", devanagari: "आत्मन्", gloss: "the self", caption: "The same light, within.", alt: "Hands holding a lit candle close, glowing gold in the dark" },
  ] satisfies DescentScene[],
};

export type ElementCopy = {
  key: "space" | "air" | "fire" | "water" | "earth";
  name: string;
  devanagari: string;
  english: string;
  theme: Theme;
  quality: string;
  line: string;
};

export const ELEMENTS_COPY = {
  eyebrow: "Pañcabhūta · the five elements",
  title: "What you are made of",
  lede: "Five elements build the world, and they build you too. Each one holds a quality worth growing.",
  open: "Open",
  close: "Close",
  more: (quality: string) => `More verses on ${quality.toLowerCase()}`,
  items: [
    { key: "space", name: "Ākāśa", devanagari: "आकाश", english: "Space", theme: "knowledge", quality: "Knowledge", line: "Space makes room for everything. A clear mind makes room to learn." },
    { key: "air", name: "Vāyu", devanagari: "वायु", english: "Air", theme: "focus", quality: "Focus", line: "Breath steadies a restless mind. Follow it and you find your focus." },
    { key: "fire", name: "Agni", devanagari: "अग्नि", english: "Fire", theme: "courage", quality: "Courage", line: "Fire never asks permission to rise. Neither should you." },
    { key: "water", name: "Jala", devanagari: "जल", english: "Water", theme: "peace", quality: "Peace", line: "Water finds its level without a fight. So can you." },
    { key: "earth", name: "Pṛthvī", devanagari: "पृथ्वी", english: "Earth", theme: "gratitude", quality: "Gratitude", line: "The ground holds you up every single day. Notice it, and say thank you." },
  ] satisfies ElementCopy[],
};

export const MOOD_COPY = {
  eyebrow: "Find your verse",
  title: "How are you feeling right now?",
  lede: "Pick one. We will find a verse for this moment.",
  legend: "Choose how you feel",
  options: {
    courage: "I need courage",
    peace: "I want some peace",
    knowledge: "I feel curious",
    devotion: "I feel devoted",
    focus: "I need focus",
    gratitude: "I feel grateful",
  } satisfies Record<Theme, string>,
  empty: "Your verse will appear here.",
  another: "Another one",
  readFull: "Read the full sloka",
  storyImage: "Story image",
  storyDialogTitle: "Share it as a story",
  closeDialog: "Close",
  announce: (feeling: string, title: string) => `${feeling}. Here is a verse: ${title}.`,
};

export const STREAMS_COPY = {
  eyebrow: "Four streams, one source",
  title: "Where the verses flow from",
  lede: "Hymns, quiet dialogues, a conversation on a battlefield and songs of praise. Different rivers, the same water.",
  explore: (source: string) => `Explore ${source}`,
  count: (n: number) => `${n} ${n === 1 ? "sloka" : "slokas"}`,
};

export const YOUR_SPACE_COPY = {
  eyebrow: "Your space",
  title: "A quiet corner that is yours",
  lede: "A free account keeps your favorites on every device, remembers your progress and greets you with a new sloka each day.",
  points: ["Favorites saved across your devices", "Your reading progress, kept", "A fresh sloka every morning"],
  previewLabel: "Preview with sample data",
  previewCaption: "A preview of your space, shown with sample data",
  previewToday: "Today's sloka",
  previewSaved: "Saved",
  previewProgress: "Your progress",
  previewProgressValue: "6 of 20 read",
  previewSurprise: "Surprise me",
  previewGreeting: "Namaste, friend",
  cta: "Create your free account",
  ctaSignedIn: "Go to your dashboard",
  teaserBadge: "Coming soon",
  teaserTitle: "Live classes and complete notes",
  teaserBody: "Coming soon. Create a free account to be first in line.",
};

export const FINAL_COPY = {
  title: "Return to yourself.",
  lede: "It takes a minute, and there is no password to remember.",
  primary: "Create your free account",
  primarySignedIn: "Go to your dashboard",
  secondary: "I already have an account",
  secondarySignedIn: "Explore the library",
};
