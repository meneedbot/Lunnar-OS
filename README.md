# Lunnar-OS

A browser desktop environment ("LunaarOS V2").

## Live

| What | URL |
| --- | --- |
| LunaarOS | https://raw.githack.com/meneedbot/Lunnar-OS/main/index.html |

It serves straight from the `main` branch, so it is current about a minute
after a push and needs no setup.

GitHub Pages is the automatic deployment target. It needs switching on once:

1. Repository **Settings** > **Pages**
2. **Build and deployment** > **Source**: `GitHub Actions`

After that every push to `main` deploys by itself to
https://meneedbot.github.io/Lunnar-OS/ . Until then the deploy job reports
a notice ("GitHub Pages is off") instead of failing, because GitHub's built-in
token is not allowed to create the Pages site.

## Layout

- `index.html` - the OS markup: boot and lock screens, desktop, dock, dialogs.
- `css/os.css` - all of the styling.
- `js/core.js` - the desktop: windows, dock, wallpapers, clock, media panel.
- `js/accounts.js` - lock-screen login and the optional shared database.
- `js/game-fix.js` - loads games/apps into iframes with CDN fallbacks.
- `js/touch.js` - touch detection and the mobile layout.
- `js/data.js` - the bundled app HTML and the base64 wallpapers (large).
- `tools/split.mjs` - splits a single-file build back into the files above.
- `.github/workflows/` - `split.yml` regenerates the split, `pages.yml` deploys.
