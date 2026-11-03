# One-Button Log

A shared household board of big buttons. One tap logs “I just did this.” Everyone with the link sees who did it, and how long ago.

No account. No install. No ads. Boards are identified by an unguessable id in the URL.

## Run it

You need Node.js 22 or newer. The API uses Node’s built-in SQLite (`node:sqlite`).

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

`npm test` checks the time copy and the board store. `npm run lint` runs ESLint.

## What’s in the app

1. **Create a board.** Name it and start from Fed the dog, Meds, Diaper, Water plants, or Custom.
2. **Who are you?** The first visit on a logging link asks for a name. It is saved only in this browser.
3. **Board.** Each button shows `2h 14m ago · Mom`. If the button has a minimum wait, it also shows `OK to give again at 6:10 pm`. Tap to log. A toast can undo that tap, and holding the button undoes the last one.
4. **History.** Every tap for that button, with who and when. You can edit or remove a tap, change the wait, or remove the button.
5. **Share.** Copy the household link, show a QR code for the fridge, and copy a separate view-only link for a sitter.

The homepage links to **Maple House**, a demo board. The names and taps there are made-up sample data, and the board is labeled Demo. Reset demo taps puts that sample data back.

Real boards are stored in `data/one-button-log.sqlite`. That file is created on first run and is not committed. Anyone with the household link can log. Anyone with the view-only link can look and cannot log. There is no password.

## Not in this prototype

- Push notifications, reminders, or email
- Accounts, avatars, or a phone-number login
- Sync beyond this one running app and its SQLite file
- Hosting. This runs on your machine. Do not publish the demo link as if it were a private household.
