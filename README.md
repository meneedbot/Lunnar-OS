# lunnaros

A browser desktop environment ("LunaarOS V2").

## The URL

The address is the repository's name, so the URL is only as good as the repo name.
Renaming this repository from `Lunnar-OS` to `lunnaros` makes it:

- https://meneedbot.github.io/lunnaros/ (GitHub Pages)
- https://raw.githack.com/meneedbot/lunnaros/main/index.html (straight from `main`)

GitHub redirects the old links, so nothing already shared breaks.

**Settings** > **General** > **Repository name**: `lunnaros` > **Rename**.

A domain of your own (`lunnaros.com`, `lunnaros.app`) works too: add a `CNAME` file
at the repo root holding exactly that hostname, and point a CNAME DNS record at
`meneedbot.github.io`. Nothing else changes.

## Live

| What | URL |
| --- | --- |
| LunaarOS | https://raw.githack.com/meneedbot/lunnaros/main/index.html |

It serves straight from the `main` branch, so it is current about a minute after a
push and needs no setup.

GitHub Pages is the automatic deployment target. It needs switching on once:

1. Repository **Settings** > **Pages**
2. **Build and deployment** > **Source**: `GitHub Actions`

After that every push to `main` deploys by itself to
https://meneedbot.github.io/lunnaros/ . Until then the deploy job reports a notice
("GitHub Pages is off") instead of failing, because GitHub's built-in token is not
allowed to create the Pages site.

## Layout

The stylesheet and the bundled app data are split into small files; the scripts
stay whole, because cutting a script apart cannot be verified without running it:

- `index.html` - the OS markup: boot and lock screens, desktop, dock, dialogs.
- `css/parts/*.css` - all of the styling, one rule per file, linked in order.
- `js/parts/data/*.js` - the bundled app HTML and the base64 wallpapers, one file
  per app and per wallpaper (large), filling the same two globals as before.
- `js/core.js` - the desktop: windows, dock, wallpapers, clock, media panel.
- `js/accounts.js` - lock-screen login and the optional shared database.
- `js/game-fix.js` - loads games/apps into iframes with CDN fallbacks.
- `js/touch.js` - touch detection and the mobile layout.

`tools/split.mjs` turns a single-file build back into `css/os.css` and
`js/*.js`; `tools/modularize.mjs` then cuts the stylesheet and the data into the
parts above and rewrites `index.html`. Both refuse to write anything unless the
pieces join back into the file they came from, so a bad split can never reach the
site. `tools/modularized.json` marks the split as done: once it exists, edit the
parts, not `css/os.css` or `js/data.js` (`modularize.mjs --force` rebuilds from
them again, discarding edits to the parts).

Loading hundreds of files instead of a few costs more round trips, which is slower
on a slow machine, not faster - the browser has to fetch and parse each one. CSS
rules kept whole and in order do render exactly as they did together.
