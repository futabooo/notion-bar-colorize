export interface Condition {
  workspaceId: string;
  color: Color;
  textColor?: Color;
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
