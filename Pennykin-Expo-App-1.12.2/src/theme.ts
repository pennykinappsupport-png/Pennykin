import { DynamicColorIOS, Platform, type ColorValue } from "react-native";

export function adaptiveColor(light: string, dark: string): ColorValue {
  return Platform.OS === "ios" ? DynamicColorIOS({ light, dark }) : light;
}

export const colors = {
  background: adaptiveColor("#FFF9F2", "#17131F"),
  surface: adaptiveColor("#FFFFFF", "#231E2B"),
  primary: adaptiveColor("#5C46D3", "#B9ADFF"),
  primaryStrong: adaptiveColor("#5138C5", "#6850D5"),
  primarySoft: adaptiveColor("#EEEAFE", "#31284B"),
  secondary: adaptiveColor("#E97850", "#FFAA88"),
  green: adaptiveColor("#247F5D", "#73D5AE"),
  greenSoft: adaptiveColor("#E8F8F1", "#19372E"),
  yellow: adaptiveColor("#C88D13", "#F4C95D"),
  red: adaptiveColor("#C14F56", "#FF9297"),
  redStrong: adaptiveColor("#B83F49", "#A93643"),
  orangeSoft: adaptiveColor("#FFF3E8", "#3B2925"),
  yellowSoft: adaptiveColor("#FFF5DE", "#3A311F"),
  purpleSoft: adaptiveColor("#F2EEFF", "#2B2442"),
  purpleBorder: adaptiveColor("#D8D0FF", "#625785"),
  yellowBorder: adaptiveColor("#ECD49F", "#74623D"),
  text: adaptiveColor("#28243A", "#F7F3FF"),
  muted: adaptiveColor("#6F687E", "#C3BBCD"),
  border: adaptiveColor("#E3DAD2", "#4A4252"),
  track: adaptiveColor("#EEE9E3", "#3A3440"),
  onPrimary: "#FFFFFF",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32
};
