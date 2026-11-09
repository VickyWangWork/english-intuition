# English Intuition (Home Screen app)

A personal English dictionary and recall trainer that installs on your iPhone Home Screen, runs full-screen and works offline.

## Put it online (GitHub Pages, free)
1. On github.com, create a new **public** repository, e.g. `english-intuition`.
2. Click **Add file → Upload files**, drag in everything from this folder (including the `fonts` folder), then **Commit changes**.
3. Go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. After a minute your app is at `https://<your-username>.github.io/english-intuition/`.

Your words and your AI key are never uploaded: they stay on your phone. The repository only holds the app's code.

## Install on your iPhone
1. Open the address in **Safari**.
2. Tap **Share → Add to Home Screen → Add**.
3. Open it from the new **Intuition** icon.

## Turn on AI look-ups
1. Get a free key at https://aistudio.google.com/apikey (Google Gemini), or use a Claude API key from https://console.anthropic.com.
2. In the app, tap **More → AI settings**, paste the key and tap **Save and test**.

## Move words from the Claude version
1. In the Claude version, open **More → Export backup** and save the file to Files.
2. In this app, open **More → Import → Choose a backup file**.

## Updating
Upload changed files to the repository. When you change anything, also change `VERSION` at the top of `sw.js` so phones fetch the new copy. Close and reopen the app twice to pick it up.

## Notes
- Shortcuts and links open Safari, not the Home Screen app, and the two keep separate words. Look words up from the app icon.
- If your iPhone runs very low on storage, iOS can clear a web app's data. Export a backup now and then.
- Fonts: Charis SIL and Instrument Sans, SIL Open Font License (see `fonts/`).

## Test the AI service
Open `compare.html` (e.g. `https://vickywangwork.github.io/english-intuition/compare.html`) to run 10 test words through Gemini, and Claude if you add a key, using the app's own instructions. It checks British IPA against a reference, the plain-English meaning, examples and practice questions, and times each look-up.
