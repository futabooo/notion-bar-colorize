---
name: load-extension
description: Use this skill when the user wants to test or debug a Chrome extension using chrome-devtools-mcp, or when they ask how to load an extension into the MCP-controlled Chrome browser. Trigger phrases include "拡張機能をインストール", "load extension", "chrome extensionをテスト", "MCPでextensionを使う", or when trying to test a built Chrome extension dist folder.
---

# Chrome MCP で拡張機能を有効にして起動する

chrome-devtools-mcp が起動する Chrome はデフォルトで `--disable-extensions` フラグが付いており、拡張機能を直接ロードできない。代わりに以下の手順で対応する。

## 手順

### Step 1: 拡張機能つきの Chrome を別プロセスで起動

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9223 \
  --user-data-dir=/tmp/chrome-ext-test \
  --load-extension=/path/to/your/dist \
  --no-first-run \
  --no-default-browser-check \
  "https://example.com" &
```

- `--remote-debugging-port` は MCP が使用している 9222 と被らないよう 9223 などを使う
- `--user-data-dir` は一時ディレクトリを指定（既存プロファイルと分離するため）
- `--load-extension` に `dist/` などのビルド済みフォルダのパスを指定

### Step 2: Chrome が起動したことを確認

```bash
curl -s http://localhost:9223/json/version | python3 -c "import sys,json; print(json.load(sys.stdin).get('Browser',''))"
```

### Step 3: Playwright でその Chrome に接続してテスト

```javascript
const { chromium } = require('@playwright/test');

const browser = await chromium.connectOverCDP('http://localhost:9223');
const contexts = browser.contexts();

// 拡張機能IDを確認
const extPage = await contexts[0].newPage();
await extPage.goto('chrome://extensions/');
await extPage.evaluate(() =>
  new Promise(r => chrome.developerPrivate.updateProfileConfiguration(
    { inDeveloperMode: true }, r
  ))
);
const exts = await extPage.evaluate(() =>
  new Promise(r => chrome.developerPrivate.getExtensionsInfo({}, r))
);
console.log(exts.map(e => ({ id: e.id, name: e.name, state: e.state })));
await extPage.close();
```

### Step 4: 拡張機能の設定を行い対象ページをリロード

```javascript
const extId = 'YOUR_EXTENSION_ID';

// chrome.storage に設定を書き込む
const optPage = await contexts[0].newPage();
await optPage.goto(`chrome-extension://${extId}/src/option.html`);
await optPage.evaluate(() =>
  new Promise(r => chrome.storage.sync.set({ /* 条件 */ }, r))
);
await optPage.close();

// 対象ページをリロードして拡張機能の動作を確認
const targetPage = contexts[0].pages().find(p => p.url().includes('target-site.com'));
await targetPage.reload();
await targetPage.waitForTimeout(5000);
await targetPage.screenshot({ path: '/tmp/result.png' });
```

## 拡張機能のリロード（コード変更後）

ビルド後に拡張機能だけリロードすれば Chrome の再起動は不要:

```javascript
const extPage = await contexts[0].newPage();
await extPage.goto('chrome://extensions/');
await extPage.evaluate(id =>
  new Promise(r => chrome.developerPrivate.reload(id, {}, r)), extId
);
await extPage.waitForTimeout(1500);
await extPage.close();
```

## 注意事項

- `--user-data-dir` を毎回同じパスにすると前回の状態が残る（`chrome.storage.sync` の値も保持される）
- 毎回クリーンな状態でテストしたい場合は `/tmp/chrome-ext-test-$(date +%s)` のようにユニークなパスを使う
- Playwright (`@playwright/test`) が `node_modules` に入っていることが前提
