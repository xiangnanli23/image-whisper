# Image Whisper

**Image descriptions when you ask. Accessibility preferences that travel with you.**

A Team 3 prototype from the London AI for Accessibility hackathon. Hover over a photo, focus its button with the keyboard, or tap **Describe image**. Gemini describes the actual image only after that action. Read the result or choose **Listen** for browser speech. Try the sample photos or add a JPG, PNG or WebP image up to 4 MB.

## Demo and source

- [Hosted demo](https://image-whisper-hackathon.creamjellyfish1.chatgpt.site) — owner-private; this link alone does not grant access.
- [Source repository](https://github.com/xiangnanli23/image-whisper)
- [AI for Accessibility Toolkit](https://github.com/AI-for-Accessibility-Collective/AI-for-Accessibility-Toolkit)

Reviewers can run the project using their own event credentials. The hosted demo is kept private because it uses Team 3's credentials and reads its toolkit profile. No credentials are included in this repository.

## What uses the toolkit?

This project directly uses the **official Adapter MCP SDK**, not just the event AI API:

- `createAdapterProvider`, `fromToggleAdapter`, `defineDescriptor` and `connectToToolkit` register `image-whisper` with one adaptation: `image-descriptions`.
- While the app is open, it appears under **Apps → Image Whisper** in the toolkit console. **Try On-demand image descriptions** can query, enable, disable and undo the adaptation.
- `toAbilityModel` and `renderWebSettings` translate the active profile into text size, line spacing, reduced motion, image-description availability and speech rate where specified.
- `/v1/profile/events` notifies the app of changes without a page reload.
- A missing `describeImages` preference means the connected profile has not requested the feature. The person can turn it on using the local switch or the console. Profile changes reapply the new profile's preference.
- Enabling an adaptation only makes its controls available. It never triggers AI or speech automatically.

The SDK is vendored as a tarball from toolkit commit `c31ce2b02a6ab1dc74a495987b0635d20ae67d92`. It is not assumed to be published on npm. See [third-party notices](THIRD_PARTY_NOTICES.md).

## Run locally

Use Node 22.13+ (Node 24 LTS recommended).

```bash
npm ci
cp .dev.vars.example .dev.vars
# Fill in your own credentials in .dev.vars.
npm run dev
```

Open the local address printed by the server, normally `http://127.0.0.1:5173`.

`.dev.vars` is the local Cloudflare/Vinext server configuration. All real environment files are gitignored. A toolkit token is optional: without it the app runs as a standalone image-description demo; a Gemini key is required for actual AI descriptions.

### Two different tokens

| Variable | Purpose | Where to get it |
| --- | --- | --- |
| `GEMINI_PROXY_KEY` | Pays for image descriptions through the event Gemini proxy | Event team dashboard |
| `TOOLKIT_TOKEN` | Connects the app to your toolkit account | Toolkit console → Account & tokens → default token |
| `TOOLKIT_URL` | Event toolkit service address | Set in the example file |

Gemini requests use `gemini-3.8-flash` through `https://ai4a11y.lovable.app/api/public/gemini`. Event tokens expire and depend on the shared budget. Credentials stay on the server, never in a public frontend environment variable.

## Two-minute demonstration

1. Open Image Whisper. Confirm **Connected to toolkit** and the profile name.
2. Open the toolkit console using **Open console**, and find **Image Whisper** under Apps.
3. Expand **Try On-demand image descriptions**. Switch it on, then look at the app: the Describe image buttons are available. Switch it off: the buttons disappear. No AI call happens from switching.
4. Load a profile with `describeImages: true` in its `fields.needs` (for example, an appropriate vision profile). The app follows changes automatically. A `textSize` need of `1.5` enlarges its interface text; `reduceMotion: true` removes its transitions.
5. Enable descriptions, then request a description for a sample photo. Choose **Listen**, and press Escape while focus is inside the image card to close the result.
6. Optionally add your own image. Uploading alone does not send it to Gemini. Press Describe image to request processing.

Keep the app tab open during console control. If several copies are open, the console may list several live instances; close extra copies or target a particular instance.

## Privacy and boundaries

The worker exposes a narrow same-origin bridge for this app's registration/channel and profile reads, rather than a general toolkit proxy. It strips the real toolkit credential from browser requests and only returns the preferences the app needs. Profile writes and arbitrary toolkit operations are unavailable through this bridge.

Image contents, generated descriptions, usage observations and free-text profile notes are **not sent to the toolkit** by this app. Registration declares the app and its adaptation/need metadata; the toolkit receives live control state. It may suggest registered needs through its normal proposal flow. The app never accepts profile proposals on the person's behalf.

Uploaded images remain in browser memory until the visitor explicitly asks for a description. They then travel through the demo server to the event Gemini proxy. The app does not persist images or descriptions. Sample photos load from Unsplash; fonts load from Google Fonts. Browser speech synthesis depends on the browser and selected voice; some voices may use remote processing.

Do not make a deployment with a shared toolkit default token publicly accessible. For a public demonstration, give each person their own connection or provide a separately isolated demonstration account. The current hosted deployment stays private.

## Accessibility and limitations

- Native keyboard-accessible controls, visible focus, a skip link, touch-visible actions and live description announcements.
- Reduced motion from the browser preference or toolkit profile.
- AI is always user initiated, and may be wrong. This is not a replacement for authored alt text or assistive technology.
- Sample image alt text is authored; uploaded images receive a neutral label until the person requests a description.
- Tested as a prototype, **not validated with blind or low-vision participants**. No disability-community approval is claimed.
- Event infrastructure and the toolkit are pre-alpha. The demo depends on service availability, token validity and the event AI budget.

## Validation

```bash
npx tsc --noEmit
node --test tests/*.test.mjs
npm run build
```

The toolkit's own `adapter.mjs verify --app image-whisper` has also exercised describe, targets, query, check, apply, query-after and undo against a running instance. See [validation notes](VALIDATION.md).

## Code map

- `app/page.tsx` — gallery, upload, explicit AI request, speech and toolkit status.
- `lib/toolkit-client.ts` — official SDK provider, live connection and profile event handling.
- `lib/toolkit-proxy.ts` — server-only credential and restricted toolkit transport.
- `lib/describe.ts` — image validation and Gemini vision request.
- `worker/index.ts` — API routing and Vinext page handling.
- `SUBMISSION.md` — copy-ready form answers, with team consent choices left to the team.

Licensed under Apache-2.0. Toolkit attribution is retained in `THIRD_PARTY_NOTICES.md`.
