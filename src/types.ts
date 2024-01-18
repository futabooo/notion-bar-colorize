export interface Condition {
  workspaceId: string;
  color: Color;
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface Theme {
  topbar: Color;
  sidebar: Color;
  text: Color;
}
