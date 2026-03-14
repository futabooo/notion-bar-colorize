import { DARK_THEME, LIGHT_THEME } from "./consts";
import { adjustColorForReadability, getAccessibleTextColor, getContrastRatio } from "./color-utils";
import { Color, Condition } from "./types";

const currentWorkspaceID = () => {
  const url = new URL(window.location.href);
  const pathParts = url.pathname.split("/");
  return pathParts[1];
};

const findCondition = (workspaceId: string): Promise<Condition | null> => {
  var defaultSetting = {
    notionBarColorizeConditions: [],
  };
  return new Promise<Condition | null>((resolve) => {
    chrome.storage.sync.get(defaultSetting, (items) => {
      const conditions = items.notionBarColorizeConditions as Array<Condition>;
      for (var i = 0; i < conditions.length; i++) {
        var condition = conditions[i];
        if (workspaceId.match(condition.workspaceId)) {
          resolve(condition);
          return;
        }
      }
      resolve(null);
    });
  });
};

const parseRgb = (str: string): Color | null => {
  const m = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return m ? { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) } : null;
};

// コンテナのデフォルト色を設定し、各子要素の元の色を背景に対して個別に調整する
const applyAdjustedTextColors = (container: HTMLElement, bgColor: Color, overrideColor?: Color) => {
  if (overrideColor) {
    // 手動指定がある場合は一律適用
    container.style.setProperty(
      "color",
      `rgb(${overrideColor.r}, ${overrideColor.g}, ${overrideColor.b})`,
      "important"
    );
    return;
  }

  // デフォルト色をコンテナに設定（!important なし → 子の CSS ルールが上書き可能）
  const defaultColor = getAccessibleTextColor(bgColor);
  container.style.color = `rgb(${defaultColor.r}, ${defaultColor.g}, ${defaultColor.b})`;
  const inheritedColorStr = window.getComputedStyle(container).color;

  // 各子要素を走査し、独自の color を持つ要素を調整
  container.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const computedColor = window.getComputedStyle(el).color;
    if (computedColor !== inheritedColorStr) {
      const original = parseRgb(computedColor);
      if (original) {
        const adjusted = adjustColorForReadability(original, bgColor);
        el.style.setProperty(
          "color",
          `rgb(${adjusted.r}, ${adjusted.g}, ${adjusted.b})`,
          "important"
        );
      }
    }
  });

  // graphics-symbol アイコンの fill を個別に調整
  container.querySelectorAll<SVGElement>("[role='graphics-symbol']").forEach((svg) => {
    const computedFill = window.getComputedStyle(svg).fill;
    const original = parseRgb(computedFill);
    if (!original) return;
    if (getContrastRatio(original, bgColor) >= 3.0) return; // アイコンは 3:1 基準

    const adjusted = adjustColorForReadability(original, bgColor);
    svg.style.setProperty(
      "fill",
      `rgb(${adjusted.r}, ${adjusted.g}, ${adjusted.b})`,
      "important"
    );
  });
};

const changeTopbarColor = async () => {
  const bar = document.querySelector<HTMLDivElement>(".notion-topbar");
  if (bar) {
    const workspace = currentWorkspaceID();
    const condition = await findCondition(workspace);
    if (condition) {
      const { color, textColor } = condition;
      bar.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
      applyAdjustedTextColors(bar, color, textColor);
    } else {
      // 設定がない場合はデフォルトの色に戻す
      const isDark = document.body.classList.contains("dark");
      const theme = isDark ? DARK_THEME : LIGHT_THEME;
      bar.style.backgroundColor = `rgb(${theme.topbar.r}, ${theme.topbar.g}, ${theme.topbar.b})`;
      applyAdjustedTextColors(bar, theme.topbar, theme.text);
    }
  }
};

const changeSidebarColor = async () => {
  const bar = document.querySelector<HTMLDivElement>(".notion-sidebar");
  if (bar) {
    const workspace = currentWorkspaceID();
    const condition = await findCondition(workspace);
    if (condition) {
      const { color, textColor } = condition;
      const rgbStr = `rgb(${color.r}, ${color.g}, ${color.b})`;
      bar.style.backgroundColor = rgbStr;

      // sidebarを常に非表示としている場合の対応
      let child = bar.children[1] as HTMLDivElement;
      child.style.backgroundColor = rgbStr;

      applyAdjustedTextColors(bar, color, textColor);
    } else {
      // 設定がない場合はデフォルトの色に戻す
      const isDark = document.body.classList.contains("dark");
      const theme = isDark ? DARK_THEME : LIGHT_THEME;
      const rgbStr = `rgb(${theme.topbar.r}, ${theme.topbar.g}, ${theme.topbar.b})`;
      bar.style.backgroundColor = rgbStr;
      // sidebarを常に非表示としている場合の対応
      let firstChild = bar.children[0] as HTMLDivElement;
      firstChild.style.backgroundColor = rgbStr;
      applyAdjustedTextColors(bar, theme.topbar, theme.text);
    }
  }
};

const changePeekTopbarColor = async () => {
  const bar = document.querySelector<HTMLDivElement>(".peek-top-hover-area ");
  if (bar) {
    const anchor = bar.querySelector<HTMLAnchorElement>("a");
    if (!anchor?.href) {
      // workspaceのURLが取得できないときは何もしない
      return;
    }
    const url = new URL(anchor.href);
    const pathParts = url.pathname.split("/");
    const workspace = pathParts[1];
    const condition = await findCondition(workspace);
    if (condition) {
      const { color, textColor } = condition;
      bar.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
      applyAdjustedTextColors(bar, color, textColor);
    } else {
      // 設定がない場合はデフォルトの色に戻す
      const isDark = document.body.classList.contains("dark");
      const theme = isDark ? DARK_THEME : LIGHT_THEME;
      bar.style.backgroundColor = `rgb(${theme.topbar.r}, ${theme.topbar.g}, ${theme.topbar.b})`;
      applyAdjustedTextColors(bar, theme.topbar, theme.text);
    }
  }
};

// メッセージを受け取ったときに色を変更
chrome.runtime.onMessage.addListener(() => {
  changeTopbarColor();
  changeSidebarColor();
  changePeekTopbarColor();
});

changeTopbarColor();
changeSidebarColor();
changePeekTopbarColor();

// Notion は React SPA のため初回実行後に動的レンダリングされる要素に対応する
// サイドバー内に新要素が追加されたとき（notion-outliner-* など）に色調整を再適用する
let debounceTimer: number | null = null;
const observer = new MutationObserver((mutations) => {
  const hasOutlinerChange = mutations.some((m) =>
    Array.from(m.addedNodes).some(
      (n) =>
        n instanceof HTMLElement &&
        (n.classList.contains("notion-outliner-recents-header") ||
          n.querySelector?.(".notion-outliner-recents-header") !== null)
    )
  );
  if (!hasOutlinerChange) return;

  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    changeSidebarColor();
    debounceTimer = null;
  }, 100);
});

const sidebarRoot = document.querySelector(".notion-sidebar");
if (sidebarRoot) {
  observer.observe(sidebarRoot, { childList: true, subtree: true });
}
