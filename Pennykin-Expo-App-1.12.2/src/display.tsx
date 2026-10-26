import React, { createContext, useContext } from "react";
import { StyleSheet, Text as NativeText, TextInput as NativeTextInput, type TextInputProps, type TextProps } from "react-native";

const DisplayContext = createContext({ largeText: false });

export function DisplayProvider({ children, largeText }: { children: React.ReactNode; largeText: boolean }) {
  return <DisplayContext.Provider value={{ largeText }}>{children}</DisplayContext.Provider>;
}

export function AppText({ allowFontScaling = true, style, ...props }: TextProps) {
  const { largeText } = useContext(DisplayContext);
  const flattened = StyleSheet.flatten(style);
  const fontSize = typeof flattened?.fontSize === "number" ? flattened.fontSize : 14;
  const lineHeight = typeof flattened?.lineHeight === "number" ? flattened.lineHeight : undefined;
  const largeStyle = largeText
    ? {
        fontSize: Math.round(fontSize * 1.18),
        lineHeight: lineHeight ? Math.round(lineHeight * 1.18) : undefined,
      }
    : null;

  return <NativeText allowFontScaling={allowFontScaling} style={[style, largeStyle]} {...props} />;
}

export function AppTextInput({ allowFontScaling = true, style, ...props }: TextInputProps) {
  const { largeText } = useContext(DisplayContext);
  const flattened = StyleSheet.flatten(style);
  const fontSize = typeof flattened?.fontSize === "number" ? flattened.fontSize : 14;
  const largeStyle = largeText ? { fontSize: Math.round(fontSize * 1.18) } : null;

  return <NativeTextInput allowFontScaling={allowFontScaling} style={[style, largeStyle]} {...props} />;
}
