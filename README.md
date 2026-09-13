# Notion Bar Colorize

Browser extension for changing Notion topbar and sidebar color

## option screen

<img src="https://github.com/futabooo/notion-bar-colorize/blob/images/images/option-light.png?raw=true" width="320">　　　　
<img src="https://github.com/futabooo/notion-bar-colorize/blob/images/images/option-dark.png?raw=true" width="320">


## sample
<img src="https://github.com/futabooo/notion-bar-colorize/blob/images/images/notion-blue.png?raw=true" width="700">

<img src="https://github.com/futabooo/notion-bar-colorize/blob/images/images/notion-green.png?raw=truee" width="700">

<br>

# Install

## Chrome Web Store

[Notion Bar Colorize](https://chromewebstore.google.com/detail/notion-bar-colorize/mhgeheokbgcnefpafddmifnhgmhnnpfe?hl=en&authuser=0)

## Load unpacked

1. Clone this repository.
2. Run `npm install` to install the dependencies.
3. Run `npm run build` to build the project.
4. Load the `dist` folder into Chrome in `chrome://extensions/`.

or

1. Download notion-bar-colorize.zip from [Releases](https://github.com/futabooo/notion-bar-colorize/releases)
2. Unzip the file
3. Load the `dist` folder into Chrome in `chrome://extensions/`.

# Error reporting (optional)

The extension can send its own runtime errors to [Sentry](https://sentry.io/). Reporting is **disabled by default**: it is compiled in only when `VITE_SENTRY_DSN` is set at build time.

```bash
cp .env.example .env   # then set VITE_SENTRY_DSN
npm run build
```

Only errors thrown by the extension's own code are reported (error name, message, stack trace, and which internal operation failed). Errors from Notion's page, page URLs, page contents, and workspace IDs are never sent. Content scripts and the options page forward errors to the background service worker, which is the only component that talks to Sentry.

# License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.