import {TextInput, Image, ViewStyle, StyleSheet} from "react-native";
import Row from "@/components/Row";
import {useThemeColors} from "@/hooks/useThemeColors";

type SearchBarProps = {
  value: string,
  onChange: (value: string) => void,
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    borderRadius: 16,
    height: 32,
    paddingHorizontal: 12
  },
  input: {
    flex: 1,
    height: 16,
    fontSize: 10,
    lineHeight: 16,
  }
})

const SearchBar = ({ value, onChange }: SearchBarProps) => {
  const colors = useThemeColors()
  return (
    <Row gap={8} style={[styles.wrapper, { backgroundColor: colors.grayWhite }]}>
      <Image source={require('../assets/images/search.png')} width={16} height={16} />
      <TextInput style={styles.input} onChangeText={onChange} value={value}/>
    </Row>
  )
}

export default SearchBar
