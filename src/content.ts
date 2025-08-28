import { DARK_THEME, LIGHT_THEME } from "./consts";
import { Color, Condition } from "./types";

const currentWorkspaceID = () => {
  const url = new URL(window.location.href);
  const pathParts = url.pathname.split("/");
  return pathParts[1];
};

const findWorkspaceColor = (workspaceId: string): Promise<Color | null> => {
  var defaultSetting = {
    notionBarColorizeConditions: [],
  };
  return new Promise<Color | null>((resolve) => {
    chrome.storage.sync.get(defaultSetting, (items) => {
      const conditions = items.notionBarColorizeConditions as Array<Condition>;
      for (var i = 0; i < conditions.length; i++) {
        var condition = conditions[i];
        if (workspaceId.match(condition.workspaceId)) {
          resolve(condition.color);
          return;
        }
      }
      resolve(null);
    });
  });
};

const changeTopbarColor = async () => {
  const bar = document.querySelector<HTMLDivElement>(".notion-topbar");
  if (bar) {
    const workspace = currentWorkspaceID();
    const workspaceColor = await findWorkspaceColor(workspace);
    var rgbStr;
    if (workspaceColor) {
      rgbStr = `rgb(${workspaceColor.r}, ${workspaceColor.g}, ${workspaceColor.b})`;
      bar.style.backgroundColor = rgbStr;
    } else {
      // 設定がない場合はデフォルトの色に戻す
      const isDark = document.body.classList.contains("dark");
      let rgbStr = isDark
        ? `rgb(${DARK_THEME.topbar.r}, ${DARK_THEME.topbar.g}, ${DARK_THEME.topbar.b})`
        : `rgb(${LIGHT_THEME.topbar.r}, ${LIGHT_THEME.topbar.g}, ${LIGHT_THEME.topbar.b})`;
      bar.style.backgroundColor = rgbStr;
    }
  }
};

const changeSidebarColor = async () => {
  const bar = document.querySelector<HTMLDivElement>(".notion-sidebar");
  if (bar) {
    const workspace = currentWorkspaceID();
    const workspaceColor = await findWorkspaceColor(workspace);
    var rgbStr;
    if (workspaceColor) {
      rgbStr = `rgb(${workspaceColor.r}, ${workspaceColor.g}, ${workspaceColor.b})`;
      bar.style.backgroundColor = rgbStr;

      // sidebarを常に非表示としている場合の対応
      let child = bar.children[1] as HTMLDivElement;
      child.style.backgroundColor = rgbStr;
    } else {
      // 設定がない場合はデフォルトの色に戻す
      const isDark = document.body.classList.contains("dark");
      let rgbStr = isDark
        ? `rgb(${DARK_THEME.topbar.r}, ${DARK_THEME.topbar.g}, ${DARK_THEME.topbar.b})`
        : `rgb(${LIGHT_THEME.topbar.r}, ${LIGHT_THEME.topbar.g}, ${LIGHT_THEME.topbar.b})`;
      bar.style.backgroundColor = rgbStr;
      // sidebarを常に非表示としている場合の対応
      let firstChild = bar.children[0] as HTMLDivElement;
      firstChild.style.backgroundColor = rgbStr;
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
    const workspaceColor = await findWorkspaceColor(workspace);
    var rgbStr;
    if (workspaceColor) {
      rgbStr = `rgb(${workspaceColor.r}, ${workspaceColor.g}, ${workspaceColor.b})`;
      bar.style.backgroundColor = rgbStr;
    } else {
      // 設定がない場合はデフォルトの色に戻す
      const isDark = document.body.classList.contains("dark");
      let rgbStr = isDark
        ? `rgb(${DARK_THEME.topbar.r}, ${DARK_THEME.topbar.g}, ${DARK_THEME.topbar.b})`
        : `rgb(${LIGHT_THEME.topbar.r}, ${LIGHT_THEME.topbar.g}, ${LIGHT_THEME.topbar.b})`;
      bar.style.backgroundColor = rgbStr;
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
