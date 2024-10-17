import {Image, ImageSourcePropType, StyleSheet, View, ViewProps} from "react-native";
import Row from "@/components/Row";
import ThemedText from "@/components/ThemedText";

type PokemonSpecProps = ViewProps & {
  title?: string,
  description?: string,
  image?: ImageSourcePropType
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 4,
    alignItems: 'center',
  },
  row: {
    height: 32,
    alignItems: 'center',
  }
})

const PokemonSpec = ({ title, description, image, style, ...rest }: PokemonSpecProps) => {
  return (
    <View style={[style, styles.root]} {...rest}>
      <Row style={styles.row}>
        {
          image ? (
            <Image source={image} width={16} height={16} />
          ) : null
        }
        <ThemedText>{title}</ThemedText>
      </Row>
      <ThemedText variante='caption' color={'grayMedium'}>{description}</ThemedText>
    </View>
  )
}

export default PokemonSpec;
