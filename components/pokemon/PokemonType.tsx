import {Colors} from "@/constants/colors";
import {StyleSheet, View} from "react-native";
import ThemedText from "@/components/ThemedText";

type PokemonTypeProps = {
  name: keyof typeof Colors.type
}

const styles = StyleSheet.create({
  container: {
    flex: 0,
    height: 20,
    paddingHorizontal: 8,
    borderRadius: 8,
  }
})

const PokemonType = ({ name }: PokemonTypeProps) => {
  return (
    <View style={[styles.container, { backgroundColor: Colors.type[name]}]}>
      <ThemedText color={"grayWhite"} variante={"subtitle3"} style={{ textTransform: 'capitalize' }}>{ name }</ThemedText>
    </View>
  )
}

export default PokemonType
