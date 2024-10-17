import {View, ViewProps, ViewStyle} from "react-native";

type RowProps = ViewProps & {
  gap?: number;
}

const rowStyle = {
  flex: 0,
  flexDirection: 'row',
  alignItems: 'center',
} satisfies ViewStyle

const Row = ({ style, gap, ...rest }: RowProps) => {
  return (
    <View style={[rowStyle, style, gap ? { gap } : undefined]} { ...rest }></View>
  )
}

export default Row;
