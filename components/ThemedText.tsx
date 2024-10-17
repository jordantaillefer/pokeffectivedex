import {TextProps, Text, StyleSheet} from "react-native";
import {Colors} from "@/constants/colors";
import {useThemeColors} from "@/hooks/useThemeColors";

const styles = StyleSheet.create({
  body3: {
    fontSize: 10,
    lineHeight: 16,
  },
  headline: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 8,
    lineHeight: 12,
  },
  subtitle1: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: 'bold',
  },
  subtitle2: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 'bold',
  },
  subtitle3: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: 'bold',
  },
})

type ThemedTextProps = TextProps & {
  variante?: keyof typeof styles,
  color?: keyof typeof Colors["light"],
}

const ThemedText = ({ color, variante, style,...rest}: ThemedTextProps) => {
  const colors = useThemeColors()
  return <Text style={[styles[variante ?? 'body3'], {color: colors[color ?? "grayDark"]}, style]} {...rest}></Text>
}

export default ThemedText;
