# Team 3 — submission draft

Form: https://docs.google.com/forms/d/e/1FAIpQLSd2qsLiQe3QFdreZpQxkOBoLIBJliTCE02HNpKszJSzEgJ2pA/viewform

## Team

- Event: London
- Public credit: Team 3
- Contact email: enter the team's contact email directly in the form; it is intentionally not published in this repository.
- Team roles/lived experience: team to select; none inferred.

## What did you build, and for whom?

Image Whisper is a web demo for people who are blind, have low vision, or benefit from spoken image descriptions. Hovering over, tapping, or tabbing to an image reveals a Describe image button. Only when the person asks, Gemini describes the actual image; the description can also be read aloud. Users can try sample photos or upload their own. The app uses the AI for Accessibility Toolkit's Adapter MCP SDK, appears in the developer console under Apps, supports remote on/off control, and follows relevant accessibility profile preferences. It is a prototype, with no user study yet; AI descriptions can be wrong.

## Repository or other project files

https://github.com/xiangnanli23/image-whisper

The repository includes setup instructions for reviewers using their own credentials. The hosted demo is owner-private, so its URL alone does not grant reviewers access.

## Video

Optional. No video has been recorded. Do not claim one exists. The README includes a two-minute demonstration script.

## Which AI tools did you use?

Codex for development and debugging; Gemini 3.8 Flash through the event's Gemini proxy for image descriptions; AI for Accessibility Toolkit Adapter MCP SDK and web profile renderer.

## One prompt that worked well

“When I put my cursor on an image, I can choose to let the AI describe the content of the image.”

## One thing learned — proposed wording for the team to review

A working AI feature is only one part of accessibility. We connected it to the toolkit's portable profile and live adapter controls, while keeping AI actions user-initiated and making the interface usable with keyboard and touch.

## Suggested toolkit improvement — proposed wording

A deployable web-app starter with a guided console connection, clearly separated Gemini and toolkit tokens, and a hosted Redbird address instead of a localhost default would make first-time setup easier.

## Sharing and research choices

The form's final page asks where the Collective may share the project, which institutions may study it, and whether anyone wants an interview. These require the team's own agreement. They have not been selected on the team's behalf. The form explicitly permits saying no to all sharing and still submitting.

The draft is not submitted. Review the answers and team consent choices before pressing Submit.
