import {StyleSheet, ViewProps} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useThemeColors} from "@/hooks/useThemeColors";
import Animated, {
  Easing,
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import {useEffect} from "react";

type RootViewProps = ViewProps & {
  backgroundColor?: string
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 4,
  }
})

const RootView = ({ backgroundColor, style, ...rest }: RootViewProps) => {
  const colors = useThemeColors();
  const progress = useSharedValue(0)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [colors.tint, backgroundColor ?? colors.tint]
      )
    }
  }, [backgroundColor])

  useEffect(() => {
    if (backgroundColor) {
      progress.value = 0
      progress.value = withTiming(1, {
        duration: 700,
        easing: Easing.out(Easing.quad),
        reduceMotion: ReduceMotion.System
      })
    }
  }, [backgroundColor]);

  if (!backgroundColor) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.tint}, style]} {...rest} />
    )
  }

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle, style]}>
      <SafeAreaView style={styles.container}  { ...rest }></SafeAreaView>
    </Animated.View>
  )


}

export default RootView;
