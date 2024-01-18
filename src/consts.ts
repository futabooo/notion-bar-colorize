import { Theme } from "./types";

export const STORAGE_KEY = "notionBarColorizeConditions";

export const LIGHT_THEME: Theme = {
  topbar: {
    r: 255,
    g: 255,
    b: 255,
  },
  sidebar: {
    r: 251,
    g: 251,
    b: 250,
  },
  text: {
    r: 55,
    g: 53,
    b: 47,
  },
};

export const DARK_THEME: Theme = {
  topbar: {
    r: 25,
    g: 25,
    b: 25,
  },
  sidebar: {
    r: 37,
    g: 37,
    b: 37,
  },
  text: {
    r: 255,
    g: 255,
    b: 255,
  },
};
