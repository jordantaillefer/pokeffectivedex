import {StyleSheet, Text, View, ViewProps} from "react-native";
import {Shadows} from "@/constants/shadows";
import {useThemeColors} from "@/hooks/useThemeColors";

type CardProps = ViewProps & {}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    ...Shadows.dp2,
  }
})

const Card = ({ style, ...rest}: CardProps) => {
  const colors = useThemeColors()
  return (
    <View style={[styles.container, { backgroundColor: colors.grayWhite}, style]} {...rest}></View>
  )
}

export default Card;
