import { DARK_THEME, LIGHT_THEME } from "./consts";
import {
  adjustColorForReadability,
  getAccessibleTextColor,
  getContrastRatio,
  parseCssColor,
} from "./color-utils";
import { Color, Condition } from "./types";

// URL の pathname からワークスペース ID を取り出す
// 旧: https://www.notion.so/<workspace>/<page>
// 新: https://app.notion.com/p/<workspace>/<page>
const workspaceIDFromPathname = (pathname: string) => {
  const pathParts = pathname.split("/").filter((p) => p !== "");
  if (pathParts[0] === "p") {
    return pathParts[1] ?? "";
  }
  return pathParts[0] ?? "";
};

const currentWorkspaceID = () => {
  const url = new URL(window.location.href);
  return workspaceIDFromPathname(url.pathname);
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

// 以前の調整をクリアする
const clearAdjustedStyles = (container: HTMLElement) => {
  container.querySelectorAll<HTMLElement>("[data-original-color]").forEach((el) => {
    el.style.removeProperty("color");
    el.removeAttribute("data-original-color");
  });
  container.querySelectorAll<SVGElement>("[data-original-fill]").forEach((svg) => {
    svg.style.removeProperty("fill");
    svg.removeAttribute("data-original-fill");
  });
};

// コンテナのデフォルト色を設定し、各子要素の元の色を背景に対して個別に調整する
const applyAdjustedTextColors = (container: HTMLElement, bgColor: Color, overrideColor?: Color) => {
  // 前回の調整をクリアしてからスタイルを適用
  clearAdjustedStyles(container);

  if (overrideColor) {
    // 手動指定がある場合は一律適用
    container.style.setProperty(
      "color",
      `rgb(${overrideColor.r}, ${overrideColor.g}, ${overrideColor.b})`,
      "important"
    );
    return;
  }

  // デフォルト色をコンテナに設定
  // !important はコンテナ自身に対する Notion のルールに勝つためで、
  // 独自の color ルールを持つ子要素には影響しない（子は下で個別に調整する）
  const defaultColor = getAccessibleTextColor(bgColor);
  container.style.setProperty(
    "color",
    `rgb(${defaultColor.r}, ${defaultColor.g}, ${defaultColor.b})`,
    "important"
  );
  const inheritedColorStr = window.getComputedStyle(container).color;

  // 各子要素を走査し、独自の color を持つ要素を調整
  container.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const computedColor = window.getComputedStyle(el).color;
    if (computedColor !== inheritedColorStr) {
      // 元の色を data 属性に保存（再実行時のドリフト防止）
      if (!el.hasAttribute("data-original-color")) {
        el.setAttribute("data-original-color", computedColor);
      }
      const originalStr = el.getAttribute("data-original-color")!;
      const original = parseCssColor(originalStr, bgColor);
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
    if (!svg.hasAttribute("data-original-fill")) {
      svg.setAttribute("data-original-fill", computedFill);
    }
    const originalStr = svg.getAttribute("data-original-fill")!;
    const original = parseCssColor(originalStr, bgColor);
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
      applyAdjustedTextColors(bar, color, textColor);

      // sidebarを常に非表示としている場合の対応（旧UIでは children[1] が本体）
      // 新UIでは子要素の構成が異なるため存在チェックを行う
      const child = bar.children[1] as HTMLElement | undefined;
      if (child) child.style.backgroundColor = rgbStr;
    } else {
      // 設定がない場合はデフォルトの色に戻す
      const isDark = document.body.classList.contains("dark");
      const theme = isDark ? DARK_THEME : LIGHT_THEME;
      const rgbStr = `rgb(${theme.sidebar.r}, ${theme.sidebar.g}, ${theme.sidebar.b})`;
      bar.style.backgroundColor = rgbStr;
      applyAdjustedTextColors(bar, theme.sidebar, theme.text);
      // sidebarを常に非表示としている場合の対応
      const firstChild = bar.children[0] as HTMLElement | undefined;
      if (firstChild) firstChild.style.backgroundColor = rgbStr;
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
    const workspace = workspaceIDFromPathname(url.pathname);
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

// Notion は React SPA のため、content script 実行時点では .notion-sidebar 等が
// まだ存在しないことがある。document 全体を監視し、バー配下に要素が追加されたら
// 色調整を再適用する（バー自体が後から生成されるケースも拾える）
const BAR_SELECTOR = ".notion-sidebar, .notion-topbar, .peek-top-hover-area";
let debounceTimer: number | null = null;
const observer = new MutationObserver((mutations) => {
  const affectsBar = mutations.some((m) =>
    Array.from(m.addedNodes).some(
      (n) =>
        n instanceof HTMLElement &&
        (n.closest(BAR_SELECTOR) !== null || n.querySelector(BAR_SELECTOR) !== null)
    )
  );
  if (!affectsBar) return;

  if (debounceTimer !== null) clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    changeTopbarColor();
    changeSidebarColor();
    changePeekTopbarColor();
    debounceTimer = null;
  }, 200);
});
observer.observe(document.documentElement, { childList: true, subtree: true });
