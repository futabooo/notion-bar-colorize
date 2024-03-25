import { RgbStringColorPicker } from "vanilla-colorful/rgb-string-color-picker.js";
import { Condition } from "./types";

const addCondition = (condition: Condition | null) => {
  const table = document.getElementById("conditions");
  const conditionRow = document.createElement("tr");
  conditionRow.className = "condition";

  const workspaceIdCell = document.createElement("td");
  const workspaceIdInput = createWorkspaceIdInput();
  workspaceIdCell.appendChild(workspaceIdInput);

  const colorCell = document.createElement("td");
  const colorInput = createColorInput();
  colorCell.appendChild(colorInput);

  const removeCell = document.createElement("td");
  const removeButton = createRemoveButton();
  removeCell.appendChild(removeButton);

  conditionRow.appendChild(workspaceIdCell);
  conditionRow.appendChild(colorCell);
  conditionRow.appendChild(removeCell);

  if (condition) {
    (workspaceIdInput as HTMLInputElement).value = condition.workspaceId;
    const colorRgb =
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

  removeButton.addEventListener("click", (event: Event) => {
    event.preventDefault();
    conditionRow.remove();
  });
};

const createWorkspaceIdInput = (): HTMLInputElement => {
  const workspaceIdInput = document.createElement("input");
  workspaceIdInput.type = "text";
  workspaceIdInput.placeholder = "Workspace ID";
  workspaceIdInput.classList.add(
    "workspace-id",
    "input",
    "input-sm",
    "bg-neutral",
    "text-neutral-content"
  );
  return workspaceIdInput;
};

const createColorInput = (): HTMLInputElement => {
  const colorInput = document.createElement("input");
  colorInput.type = "text";
  colorInput.placeholder = "Color";
  colorInput.classList.add(
    "color",
    "input",
    "input-sm",
    "bg-neutral",
    "text-neutral-content"
  );
  return colorInput;
};

const createRemoveButton = (): HTMLButtonElement => {
  const button = document.createElement("button");
  button.id = "remove";

  // DaisyUIのクラスを追加
  button.classList.add("btn", "btn-sm", "btn-square");

  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  `;

  return button;
};

const createAlert = (): HTMLDivElement => {
  const alert = document.createElement("div");
  alert.role = "alert";
  alert.className = "alert alert-success text-base mt-3 flex";
  alert.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span>saved!</span>
  `;
  return alert;
};

const addEmptyCondition = () => {
  addCondition(null);
};

const setChangeColorPickerVisibilityListeners = (
  colorInput: HTMLInputElement
) => {
  const colorPicker = new RgbStringColorPicker();
  colorPicker.style.position = "absolute";

  // colorInputにフォーカスが当たったときにcolorPickerを表示
  colorInput.addEventListener("focus", () => {
    const rect = colorInput.getBoundingClientRect();
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
  const conditions: Condition[] = [];
  const conditionElements = document.querySelectorAll(".condition");

  conditionElements.forEach((elem: Element) => {
    const id = (elem.querySelector(".workspace-id") as HTMLInputElement)?.value;
    const color = (elem.querySelector(".color") as HTMLInputElement)?.value;
    const colorParts = color?.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

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

  const setting = {
    notionBarColorizeConditions: conditions,
  };
  console.log("save setting: ", setting);

  chrome.storage.sync.set(setting, function () {
    console.log("saved!");

    // アラートを表示
    const container = document.getElementById("container");
    const alert = createAlert();
    container?.appendChild(alert);

    setTimeout(function () {
      alert.remove();
    }, 1500);
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
