import {useColorScheme} from "react-native";
import {Colors} from "@/constants/colors";

export const useThemeColors = () => {
  const theme = useColorScheme() ?? "light"
  return Colors[theme];
}
