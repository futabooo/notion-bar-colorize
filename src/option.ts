import { RgbStringColorPicker } from "vanilla-colorful/rgb-string-color-picker.js";
import { Condition } from "./types";

const addCondition = (condition: Condition | null) => {
  let table = document.getElementById("conditions");
  let conditionRow = document.createElement("tr");
  conditionRow.className = "condition";

  let workspaceIdCell = document.createElement("td");
  let workspaceIdInput = document.createElement("input");
  workspaceIdInput.type = "text";
  workspaceIdInput.placeholder = "Workspace ID";
  workspaceIdInput.className = "workspace-id";
  workspaceIdCell.appendChild(workspaceIdInput);

  let colorCell = document.createElement("td");
  let colorInput = document.createElement("input");
  colorInput.type = "text";
  colorInput.className = "color";
  colorCell.appendChild(colorInput);

  let removeCell = document.createElement("td");
  let removeLink = document.createElement("a");
  removeLink.href = "#";
  removeLink.id = "remove";
  removeLink.textContent = "remove";
  removeCell.appendChild(removeLink);

  conditionRow.appendChild(workspaceIdCell);
  conditionRow.appendChild(colorCell);
  conditionRow.appendChild(removeCell);

  let colorRgb = "rgb(32, 100, 227)";
  if (condition) {
    (workspaceIdInput as HTMLInputElement).value = condition.workspaceId;

    colorRgb =
      "rgb(" +
      condition.color.r +
      ", " +
      condition.color.g +
      ", " +
      condition.color.b +
      ")";
    (colorInput as HTMLInputElement).style.backgroundColor = colorRgb;
    (colorInput as HTMLInputElement).value = colorRgb;
  }

  table?.appendChild(conditionRow);

  setChangeColorPickerVisibilityListeners(colorInput);

  removeLink.addEventListener("click", (event: Event) => {
    event.preventDefault();
    conditionRow.remove();
  });
};

const addEmptyCondition = () => {
  addCondition(null);
};

const setChangeColorPickerVisibilityListeners = (
  colorInput: HTMLInputElement
) => {
  let colorPicker = new RgbStringColorPicker();
  colorPicker.style.position = "absolute";

  // colorInputにフォーカスが当たったときにcolorPickerを表示
  colorInput.addEventListener("focus", () => {
    let rect = colorInput.getBoundingClientRect();
    colorPicker.style.top = `${rect.bottom}px`;
    colorPicker.style.left = `${rect.left}px`;
    colorPicker.style.removeProperty("display");
    document.body.appendChild(colorPicker);

    colorPicker.addEventListener("color-changed", (event) => {
      colorInput.style.backgroundColor = event.detail.value;
      colorInput.value = event.detail.value;
    });
  });

  // colorInputとcolorPickerの間でフォーカスが移動するときに
  // colorPickerが非表示にならないようにするためのタイマー
  let blurTimeout: number | null = null;
  // colorInputからフォーカスが外れたときにcolorPickerを非表示
  colorInput.addEventListener("blur", () => {
    blurTimeout = window.setTimeout(() => {
      colorPicker.remove();
    }, 100);
  });
  // colorPickerにフォーカスが当たったときにタイマーをクリア
  colorPicker.addEventListener("focus", () => {
    if (blurTimeout !== null) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }
  });

  // colorPickerからフォーカスが外れたときにcolorPickerを非表示
  colorPicker.addEventListener("blur", () => {
    colorPicker.remove();
  });
};

const saveConditions = () => {
  let conditions: Condition[] = [];
  let conditionElements = document.querySelectorAll(".condition");

  conditionElements.forEach((elem: Element) => {
    let id = (elem.querySelector(".workspace-id") as HTMLInputElement)?.value;
    let color = (elem.querySelector(".color") as HTMLInputElement)?.value;
    let colorParts = color?.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

    if (id && colorParts) {
      conditions.push({
        workspaceId: id,
        color: {
          r: parseInt(colorParts[1]),
          g: parseInt(colorParts[2]),
          b: parseInt(colorParts[3]),
        },
      });
    }
  });

  let setting = {
    notionBarColorizeConditions: conditions,
  };
  console.log("save setting: ", setting);

  chrome.storage.sync.set(setting, function () {
    console.log("saved!");
    let container = document.getElementById("container");
    let message = document.createElement("span");
    message.textContent = "saved!";
    container?.appendChild(message);
    setTimeout(function () {
      message.remove();
    }, 1000);
  });
};

(() => {
  document.getElementById("save")?.addEventListener("click", (_) => {
    console.log("save");
    saveConditions();
  });
  document.getElementById("add")?.addEventListener("click", (_) => {
    console.log("add");
    addEmptyCondition();
  });

  const defaultSetting = {
    notionBarColorizeConditions: [],
  };

  chrome.storage.sync.get(defaultSetting, (setting: any) => {
    console.log("get setting: ", setting);
    const conditions = setting.notionBarColorizeConditions;
    if (conditions.length === 0) {
      addEmptyCondition();
      return;
    }

    conditions.forEach((condition: any) => {
      addCondition(condition);
    });
  });
})();
