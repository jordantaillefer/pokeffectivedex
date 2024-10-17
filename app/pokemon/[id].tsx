import {StyleSheet, Image, Pressable, View} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {Audio} from 'expo-av';
import RootView from "@/components/RootView";
import Row from "@/components/Row";
import ThemedText from "@/components/ThemedText";
import {useFetchQuery} from "@/hooks/useFetchQuery";
import {Colors} from "@/constants/colors";
import {useThemeColors} from "@/hooks/useThemeColors";
import {formatSize, formatWeight, getPokemonArtwork, INITIAL_STATS} from "@/functions/pokemon";
import Card from "@/components/Card";
import PokemonType from "@/components/pokemon/PokemonType";
import PokemonSpec from "@/components/pokemon/PokemonSpec";
import PokemonStat from "@/components/pokemon/PokemonStat";
import { useState} from "react";

const styles = StyleSheet.create({
  header: {
    margin: 20,
    justifyContent: 'space-between'
  },
  pokeball: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  imageRow: {
    top: -140,
    position: 'absolute',
    zIndex: 2,
    justifyContent: 'space-between',
    left: 0,
    right: 0,
    paddingHorizontal: 20
  },
  artwork: {},
  card: {
    marginTop: 144,
    paddingHorizontal: 20,
    paddingTop: 56,
    gap: 16,
    alignItems: 'center',
    paddingBottom: 20
  }
})

const statShortName = (name: string): string => {
  return name
    .replaceAll('special', 'S')
    .replaceAll('-', '')
    .replaceAll('attack', 'ATK')
    .replaceAll('defense', 'DEF')
    .replaceAll('speed', 'SPD')
    .toUpperCase()
}

export const Pokemon = () => {
  const params = useLocalSearchParams<{ id: string }>()
  const colors = useThemeColors()

  const [id, setId] = useState(parseInt(params.id, 10))
  const { data: pokemon } = useFetchQuery({path: '/pokemon/[id]', params: {id: id }})
  const {data: pokemonSpecies} = useFetchQuery({path: '/pokemon-species/[id]', params: {id}})
  const bio = pokemonSpecies?.flavor_text_entries
    ?.find(({language}) => language.name === 'en')
    ?.flavor_text.replaceAll("\n", ". ").replaceAll('\f', ' ');

  const stats = pokemon?.stats ?? INITIAL_STATS

  const mainType = pokemon?.types?.[0].type.name;

  const colorType = mainType ? Colors.type[mainType] : colors.tint

  const types = pokemon?.types ?? []

  const onImagePress = async () => {
    const cry = pokemon?.cries.latest;
    if (!cry) {
      return;
    }

    console.log(cry)

    const {sound} = await Audio.Sound.createAsync({
      uri: 'TO be defined'
    }, {
      shouldPlay: true
    })
    await sound.playAsync();
  }

  const onPrevious = () => {
    router.replace({
      pathname: '/pokemon/[id]',
      params: {
        id: Math.max(id - 1, 1)
      }
    })
  }

  const onNext = () => {
    router.replace({
      pathname: '/pokemon/[id]',
      params: {
        id: Math.min(id + 1, 151)
      }
    })
  }

  const isFirst = id === 1
  const isLast = id === 151

  return (
    <RootView backgroundColor={colorType}>
      <View>
        <Image source={require('@/assets/images/pokeball-big.png')} style={styles.pokeball} width={208} height={208}/>
        <Row style={styles.header}>
          <Pressable onPress={router.back}>
            <Row>
              <Image source={require('@/assets/images/arrow_back.png')} width={32} height={32}/>
              <ThemedText variante={'headline'} color={'grayWhite'}
                          style={{textTransform: 'capitalize'}}>{pokemon?.name}</ThemedText>
            </Row>
          </Pressable>
          <ThemedText variante={'subtitle2'} color={'grayWhite'}>#{id.toString().padStart(3, "0")}</ThemedText>
        </Row>
        <Card style={styles.card}>
          <Row style={styles.imageRow}>
            {
              isFirst ? (
                <View style={{width: 24, height: 24}}/>
              ) : (
                <Pressable onPress={onPrevious}>
                  <Image
                    source={require('@/assets/images/chevron_left.png')}
                    width={24}
                    height={24}
                  />
                </Pressable>
              )
            }
            <Pressable onPress={onImagePress}>
              <Image
                style={styles.artwork}
                source={{uri: getPokemonArtwork(id)}}
                width={200}
                height={200}
              />
            </Pressable>
            {
              isLast ? (
                <View style={{width: 24, height: 24}}/>
              ) : (
                <Pressable onPress={onNext}>
                  <Image
                    source={require('@/assets/images/chevron_right.png')}
                    width={24}
                    height={24}
                  />
                </Pressable>
              )
            }
          </Row>

          <Row gap={16} style={{height: 20}}>
            {
              types.map(type => <PokemonType name={type.type.name} key={type.type.name}/>)
            }
          </Row>
          {/* About */}
          <ThemedText variante={'subtitle1'} style={{color: colorType}}>
            About
          </ThemedText>
          <Row>
            <PokemonSpec
              style={{borderStyle: 'solid', borderRightWidth: 1, borderColor: colors.grayLight}}
              title={formatWeight(pokemon?.weight)}
              description={"Weight"}
              image={require('@/assets/images/weight.png')}
            />
            <PokemonSpec
              style={{borderStyle: 'solid', borderRightWidth: 1, borderColor: colors.grayLight}}
              title={formatSize(pokemon?.height)}
              description={"Size"} image={require('@/assets/images/straighten.png')}
            />
            <PokemonSpec
              title={pokemon?.moves.slice(0, 2).map(move => move.move.name).join("\n")}
              description={"Moves"}
            />
          </Row>
          <ThemedText>{bio}</ThemedText>
          { /* Stats */}
          <ThemedText variante={'subtitle1'} style={{color: colorType}}>
            Base stats
          </ThemedText>
          <View style={{alignSelf: 'stretch'}}>
            {
              stats.map(stat => (
                <PokemonStat key={stat.stat.name} name={statShortName(stat.stat.name)} value={stat.base_stat}
                             color={colorType}/>
              ))
            }
          </View>
        </Card>
      </View>
    </RootView>
  )
}

export default Pokemon;
