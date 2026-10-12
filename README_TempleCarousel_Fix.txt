Temple carousel update

Changes included:
- Fixed Padmavathi image path to /temples/padmavathi.jpg.
- Standardized the four temple image filenames.
- Upscaled the four supplied temple photos with high-quality resampling and gentle sharpening for better carousel display.
- Enabled Next.js image optimization for the carousel.

Run locally:
1. Extract this ZIP.
2. Open a terminal in the VedicSlokas folder.
3. Run: npm install
4. Run: npm run dev
5. Open http://localhost:3000

Note: Upscaling improves display dimensions but cannot add photographic detail that was not present in the original images. For the best true-HD result, replace these supplied photos with original high-resolution temple photographs.

Follow-up (merged into the main project):
- The carousel now uses the upscaled /temples/padmavathi.jpg; the unused padmavathi.jpeg was removed.
- Photos are shown whole at close to their natural size over a blurred fill, instead of being
  stretched across the wide frame (which doubled their size and cropped them).
- Auto-advance is off for visitors who prefer reduced motion, pauses on hover, keyboard focus,
  touch, when scrolled off-screen or in a background tab, and has a pause/play button.
- Images load lazily so they never slow down the first screen.
