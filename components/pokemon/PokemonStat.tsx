import {StyleSheet, View, ViewProps} from "react-native";
import Row from "@/components/Row";
import ThemedText from "@/components/ThemedText";
import {useThemeColors} from "@/hooks/useThemeColors";
import Animated, {useAnimatedStyle, useSharedValue, withSpring} from "react-native-reanimated";
import {useEffect} from "react";

type PokemonStatProps = ViewProps & {
  name: string,
  value: number,
  color: string,
}

const styles = StyleSheet.create({
  root: {

  },
  name: {
    width: 40,
    paddingRight: 8,
    borderStyle: 'solid',
    borderRightWidth: 1,
  },
  value: {
    width: 23
  },
  bar: {
    flex: 1,
    borderRadius: 20,
    height: 4,
    overflow: "hidden",
  },
  barInner: {
    height: 4
  },
  barBackground: {
    height: 4,
    opacity: 0.24
  },
})

const PokemonStat = ({ color, name, value, style, ...rest }: PokemonStatProps) => {
  const colors = useThemeColors()

  const sharedValue = useSharedValue(value)

  const barInnerStyle = useAnimatedStyle(() => {
    return {
      flex: sharedValue.value
    }
  })

  const barBackgroundStyle = useAnimatedStyle(() => {
    return {
      flex: 255 - sharedValue.value
    }
  })

  useEffect(() => {
    sharedValue.value = withSpring(value)
  }, [value]);

  return (
    <Row style={[style, styles.root]} {...rest} gap={8}>
      <View style={[styles.name, { borderColor: colors.grayLight }]}>
        <ThemedText variante={'subtitle3'} style={{ color }}>{ name }</ThemedText>
      </View>
      <View style={styles.value}>
        <ThemedText>{ value.toString().padStart(3, '0') }</ThemedText>
      </View>
      <Row style={styles.bar}>
        <Animated.View style={[styles.barInner, { backgroundColor: color }, barInnerStyle]} />
        <Animated.View style={[styles.barBackground, { backgroundColor: color }, barBackgroundStyle]} />
      </Row>
    </Row>
  )
}

export default PokemonStat;
