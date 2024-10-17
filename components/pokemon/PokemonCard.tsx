import {Image, Pressable, StyleSheet, View, ViewStyle} from "react-native";
import Card from "@/components/Card";
import ThemedText from "@/components/ThemedText";
import {useThemeColors} from "@/hooks/useThemeColors";
import {Link} from "expo-router";
import {getPokemonArtwork} from "@/functions/pokemon";

type PokemonCardProps = {
  style?: ViewStyle;
  nom: string;
  id: number;
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    alignItems: 'center',
    padding: 4
  },
  id: {
    alignSelf: 'flex-end',
  },
  shadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    borderRadius: 7,
    zIndex: -1
  }
})

const PokemonCard = ({style, id, nom}: PokemonCardProps) => {
  const colors = useThemeColors()

  return (
    <Link href={{ pathname: '/pokemon/[id]', params: { id }}} asChild>
      <Pressable style={style}>
        <Card style={styles.card}>
          <ThemedText variante='caption' color='grayMedium' style={styles.id}>#{ id.toString().padStart(3, '0')}</ThemedText>
          <Image source={{ uri: getPokemonArtwork(id) }}
                 width={72}
                 height={72} />
          <ThemedText>{ nom }</ThemedText>
          <View style={[styles.shadow, { backgroundColor: colors.grayBackground }]} />
        </Card>
      </Pressable>
    </Link>
  )
}

export default PokemonCard
