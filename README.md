# Image Whisper

An accessible image-description demo. Hover over a photo, tab to its button, or tap **Describe image**. Gemini describes the actual image only after that action. Read the description or use **Listen** for browser speech. **More detail** requests a longer description; **Add your own image** accepts JPG, PNG and WebP files up to 4 MB.

## Run locally

Requires Node 22.13+ and dependencies installed with `npm ci`.

Put `GEMINI_PROXY_KEY=your-event-token` in `.dev.vars` (Wrangler's local server secrets). Keep `.env` and `.dev.vars` out of Git. Run `npm run dev` and open the printed local URL.

## AI and privacy

The server calls the event Gemini proxy using `gemini-3.8-flash`. The credential never enters the browser bundle. Uploaded images remain in browser memory until the visitor requests a description; the image is then sent via the server to Gemini. The app does not persist uploads or descriptions. Sample photos load from Unsplash. Listen uses browser speech synthesis, whose voice availability and processing depend on the browser. AI can make mistakes.

The hosted demo is owner-private. Configure `GEMINI_PROXY_KEY` as a Sites runtime secret. It is not included in source or deployment archives.

This is a standalone demonstration of an accessibility adaptation. It does not yet connect to the toolkit's profile or adapter registry.

## Check

`npx tsc --noEmit`

`node --test tests/describe.test.mjs`

`npm run build`
