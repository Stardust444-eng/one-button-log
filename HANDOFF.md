# Handoff: One-Button Log

This file is for a developer who will host the app and ship it to the App Store and Google Play. Do not treat the current tree as a store build. It is a working web prototype.

## What the app does

One-Button Log is a shared household board of big buttons. Parents, caregivers, and pet sitters open one link in the browser. One tap logs “I just did this.” Everyone with the link sees who did it and how long ago, for example `2h 14m ago · Mom`.

There is no account, no install step, and no ad. A board is identified by an unguessable id in the URL. A second, separate id is a view-only link for a sitter or a vet: they can see the board and cannot log.

Buttons can have a minimum wait. Until that wait ends, the button shows a countdown such as `OK to give again tomorrow at 12:54 am` and `in 5h 46m`. After the wait, plus a short grace period, the button shows `Due`.

The name on each tap is chosen on that device (`Who are you?`) and stored only in that browser. It is not an account.

The homepage opens a sample board named Maple House. Those names and taps are made-up demo data and the board is labeled Demo. Do not present Maple House as a real family.

## Tech stack

- Next.js 16.4.5 (App Router, Turbopack in dev) and React 19.3
- TypeScript
- Tailwind CSS 4, with the shadcn/ui style `base-nova` on Base UI (`Button`, `Input`, `Label`, `Dialog`)
- QR codes drawn in the browser with the `qrcode` package (no external QR service)
- Fonts: Fraunces and Nunito Sans via `next/font/google` (fetched at build time and self-hosted; no runtime call to Google)
- Persistence: Node.js built-in `node:sqlite` (`DatabaseSync`). Requires Node.js 22 or newer. This module is still marked experimental by Node.
- Tests: `tsx` and `node:test`
- Dev and start scripts bind `0.0.0.0:3847`

There is no database server, no auth provider, no analytics SDK, and no paid API.

## Screens and routes

| Route | What the person sees |
| --- | --- |
| `/` | Landing. “Create a board” and “Try the demo board”. |
| `/new` | Name the board and pick a template: Fed the dog, Meds, Diaper, Water plants, or Custom. |
| `/b/[id]` | First visit on a logging link: “Who are you?” (Mom, Dad, Alex, Sam, or a typed name). After a name is saved, the board: big tap targets, `ago · name`, countdown or Due, toast undo, hold-to-undo, add a button. View-only links skip the name picker and cannot tap. |
| `/b/[id]/history/[buttonId]` | Taps for one button (time and person), “About every …” when there are two or more taps, edit who/when, remove a tap, edit the wait, remove the button. |
| `/b/[id]/share` | Household link, copy button, fridge QR, view-only link and QR. A view-only visitor only sees their own link. |
| (not a route) | Unknown URLs use `app/not-found.tsx`. Unexpected render errors use `app/error.tsx`. |

The name picker is not its own URL. It replaces the board until `localStorage` has a name. The storage key is `one-button-log.who`.

Other devices see new taps because the board polls `GET /api/boards/[id]` about every 4 seconds. There are no WebSockets.

### HTTP API

All responses are JSON. Write operations require the household id. The view id returns 403 on writes and the payload does not include the household id.

- `POST /api/boards` body `{ name, templateId }` creates a board and returns `{ id, viewId }`.
- `GET /api/boards/[id]` works for either id. Returns `{ board }` with `role` `edit` or `view`.
- `POST /api/boards/[id]/taps` body `{ buttonId, by }`.
- `PATCH /api/boards/[id]/taps/[tapId]` body `{ by, at }`.
- `DELETE /api/boards/[id]/taps/[tapId]`.
- `POST /api/boards/[id]/buttons` body `{ label, intervalHours }`.
- `PATCH /api/boards/[id]/buttons/[buttonId]` body `{ label, intervalHours }`.
- `DELETE /api/boards/[id]/buttons/[buttonId]`.
- `POST /api/boards/[id]/reset` restores Maple House sample taps. Only the demo board’s household id accepts this.

Demo ids are hardcoded and public (they are not secrets):

- Household: `demo-maple-7f3c9a2e1b64`
- View-only: `demo-maple-view-6c1e8d4a9b`

An empty database recreates Maple House on startup. Real boards use 128-bit ids (`crypto.randomBytes(16)` as base64url).

## Install, run, test, build

Requirements: Node.js 22 or newer, npm.

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3847 . The dev server must allow that host (`allowedDevOrigins` in `next.config.ts`). If the page stays on “Opening the board…”, the dev client did not hydrate; confirm the origin is allowed and restart `npm run dev`.

```bash
npm test          # store and time-formatting tests; no server required
npm run lint
npx tsc --noEmit
npm run build
npm start         # next start on 0.0.0.0:3847
```

`npm test` sets its own temporary database and does not touch `data/one-button-log.sqlite`.

The production script hardcodes port 3847. To use another port without editing the script, run `npx next start -H 0.0.0.0 -p <port>` after `npm run build`.

Tailwind is applied through the Turbopack CSS rule in `next.config.ts`. `npm run dev` uses Turbopack. A plain webpack dev server will serve the page without those utility styles. Keep Turbopack for local dev, or add a PostCSS Tailwind pipeline before switching bundlers.

## Env vars and secrets

Names only. This prototype has no secret values, API keys, or `.env` file.

| Name | Required | What it is |
| --- | --- | --- |
| `ONE_BUTTON_DB` | No | Filesystem path of the SQLite file. If unset, the app uses `data/one-button-log.sqlite` under the process working directory. |

There is nothing to rotate. Do not invent API keys. The link id is the only access control. Anyone who has the household URL can log taps.

The SQLite file, its `-wal` / `-shm` sidecars, and `data/` are gitignored. Do not commit them. They can contain names people typed while trying the app.

## What is implemented, stubbed, or missing

Implemented, not stubbed:

- Create board from the five templates, including an empty Custom board
- Name remembered on the device
- Tap to log, toast undo, long-press undo
- Minimum-wait countdown and Due state
- Per-button history, edit who and when, delete a tap, change the wait, delete the button
- Copy links and locally generated QR codes
- View-only link that cannot write
- Labeled Maple House demo and “Reset demo taps”
- Loading, missing-link, and request-error states

Not in this tree (absent, not fake stand-ins):

- Push notifications, email, SMS, or reminders
- Accounts, passwords, sessions, or server-side identity
- A service worker. `app/manifest.ts` and Apple web-app meta tags exist so a phone browser can Add to Home Screen. That is not an App Store binary.
- Store icons, splash screens, a bundle id, signing, Capacitor or Cordova config, or store listing copy
- A privacy policy or terms page
- Multi-instance sync. `node:sqlite` is opened in-process. Two Node processes writing one file are not supported. Serverless hosts that freeze the disk will lose boards.
- Rate limiting, abuse controls, or deletion of a whole board except demo reset
- Custom URL scheme or universal links
- Offline logging. A failed request shows an error and reloads.

## Ship it to the App Store and Google Play

The product only works if every phone talks to the same server. Do not wrap a localhost build and do not `output: "export"` the Next app into the binary. The API and SQLite have to stay on a host. The store apps should be native shells that open that hosted origin.

### 1. Host the backend first

1. Provision one Node.js 22 machine or container with a persistent disk. A single long-running process is the supported shape (a small VM, Fly machine, Railway service, or similar). Do not put SQLite on ephemeral serverless disk.
2. Clone this repo, `npm ci`, `npm run build`.
3. Set `ONE_BUTTON_DB` to a path on the persistent disk.
4. Run `npx next start -H 0.0.0.0 -p <port>` behind HTTPS. Terminate TLS at the proxy. Browsers need HTTPS for a reliable clipboard on the share page, and both stores expect HTTPS.
5. Confirm `GET /` and `GET /api/boards/demo-maple-7f3c9a2e1b64` over the public HTTPS origin. Create a real board and open the household URL and the view-only URL on two devices.
6. Keep Maple House labeled Demo, or remove the seed before production if a public sample board is not wanted. The ids above will keep working on every fresh database until the seed code changes.
7. Plan backups of the SQLite file (including the WAL). There is no export UI.
8. Add a short public privacy-policy URL on that same host before store submission. The app does not have this page yet. The policy must say, in plain language: the server stores the board name, button labels, the display name someone types, and tap times; the name is also saved on the device; there is no account; anyone with the link can read the board; the household link can change it; data is not sold; there is no ad SDK and no analytics SDK in this repo. Because meds and diaper buttons exist, say the app is a household log, not medical advice and not a medical device.

### 2. Wrap the hosted site with Capacitor

Do this only after step 1 has a stable HTTPS origin.

1. Use a developer-owned bundle id, the same reverse-DNS string on both stores, for example a domain you control. Do not ship `com.example.*`.
2. From a clean working copy: `npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android` (current Capacitor 6 or 7; match the versions the CLI installs together).
3. `npx cap init "One-Button Log" <bundle-id> --web-dir <a-small-local-www-dir>`.
4. Point the shell at the hosted app. In `capacitor.config.ts`, set `server.url` to the HTTPS origin and `server.cleartext` to false. Android must not allow cleartext. iOS ATS should stay at the default (HTTPS only).
5. `npx cap add ios` and `npx cap add android`.
6. Set the display name to “One-Button Log” and the splash background to `#f3efe4` (the web theme color). Status bar content should be dark on that cream background.
7. Do not request camera, location, photos, microphone, contacts, or tracking. The web app does not use them. Copy-to-clipboard uses the web clipboard API inside the WebView.
8. `npx cap sync`, then open Xcode and Android Studio from `npx cap open ios` and `npx cap open android`.

A Trusted Web Activity can replace the Android shell later. It still needs the same HTTPS host, Digital Asset Links, and a Play listing. iOS still needs a binary; Apple will not take a bookmark as an App Store app.

### 3. Icons and splash

What exists today is not enough for the stores:

- `app/icon.svg` — simple green rounded mark
- `app/favicon.ico` — browser favicon
- `app/manifest.ts` — web manifest pointing at the SVG only

Build a 1024×1024 PNG master from that mark (no transparency for the App Store icon; Android adaptive icon needs a foreground and a background, background `#f3efe4`). Then generate:

- iOS: App Store 1024 PNG, and the Xcode `AppIcon` set (Capacitor’s `@capacitor/assets` can generate from the 1024 master)
- Android: Play Console 512 PNG, `mipmap` launcher icons, adaptive icon XML
- Splash: cream `#f3efe4` full screen with the wordmark, not a spinner. Generate with `@capacitor/assets` (`splash.png` plus `splash-dark.png` if you support dark; this UI is light-only, so a single light splash is enough)
- Store screenshots: phone-sized captures of landing, the board (`ago · name` and the countdown), history, and share/QR. Use a production HTTPS build so the QR encodes the real origin, not `127.0.0.1`

### 4. iOS App Store

1. Apple Developer Program account. Create an App Store Connect app with the bundle id from step 2.
2. In Xcode, set the team, a unique version (`0.1.0` matches `package.json`) and build number, and an iPhone target. iPad can run the phone layout; the web column is `max-w-md`.
3. Archive, upload with Xcode or `xcodebuild` / Transporter. Include the privacy manifest. This app does not track and does not use required-reason APIs beyond what the system WebView already does; confirm that against the Xcode privacy report before upload.
4. App Privacy questionnaire: data is not used to track. User content (names people type, and timestamps) is stored on your server and is not linked to an Apple ID. No crash SDK and no advertising.
5. Age rating: no restricted content. The listing may mention household meds and diaper changes. Do not claim dosage advice.
6. Category suggestion: Lifestyle or Productivity.
7. Review notes: no login exists; the link is the access control. Give the reviewer the demo URL on your host (`/b/demo-maple-7f3c9a2e1b64`) and say the data is sample data. Explain that holding a button undoes the last tap and that the view-only link cannot log.
8. Screenshots for the sizes App Store Connect currently requires (at least the 6.7-inch iPhone set), a subtitle, a description, keywords, support URL, and the privacy-policy URL from step 1.
9. Export compliance: HTTPS only, no custom cryptography beyond the platform.

### 5. Google Play

1. Play Console account. Create the app with the same application id.
2. Build an Android App Bundle (`./gradlew bundleRelease` in `android/`) signed with your upload key. Enroll in Play App Signing.
3. Target the current Play API level. Capacitor’s Android template must be bumped if Play rejects it.
4. Store listing: short description, full description, 512 icon, 1024×500 feature graphic, phone screenshots, a support email, and the same privacy-policy URL.
5. Data safety form: users can type a display name; the server stores that name, button labels, and tap times; data is not sold and not used for ads; data is collected because the household board is the product; the view-only link is access control, not an account. No approximate location, no financial info.
6. Content rating questionnaire: no violence, no user-generated public social feed. Boards are private by unguessable link, not a public directory.
7. Internal testing track first. Confirm two devices share one board through the hosted origin, then promote.

### 6. Order of work

1. Privacy-policy page on the HTTPS host.
2. Persistent Node host and `ONE_BUTTON_DB`.
3. Production smoke test of create, tap, undo, history, share QR, and view-only 403.
4. 1024 icon master, splash, Capacitor shell pointed at that origin.
5. App Store Connect and Play Console listings, using the same screenshots and the same policy URL.
6. TestFlight and Play internal testing, then review.

Do not submit a binary that still loads `http://127.0.0.1:3847`.
