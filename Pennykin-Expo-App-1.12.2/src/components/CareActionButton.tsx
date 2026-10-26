import React, { useEffect, useRef } from "react";
import { Animated, Pressable, type StyleProp, type ViewStyle } from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
// Feedback starts on press-in, before any database work or resource wait.
export function CareActionButton({ children, disabled, onPress, style }: {
  children: React.ReactNode; disabled: boolean; onPress: () => void; style: StyleProp<ViewStyle>;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const motion = useRef<Animated.CompositeAnimation | null>(null);
  const spring = (toValue: number) => {
    motion.current?.stop();
    motion.current = Animated.spring(scale, {toValue, damping:10, stiffness:300, mass:.5, useNativeDriver:true});
    motion.current.start();
  };
  useEffect(() => {
    if(disabled) spring(1);
    return () => { motion.current?.stop(); };
  }, [disabled]);
  return <AnimatedPressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled}
    onPress={onPress} onPressIn={()=>spring(.92)} onPressOut={()=>spring(1)}
    style={[style,{transform:[{scale}]}]}>{children}</AnimatedPressable>;
}
