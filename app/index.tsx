import {ActivityIndicator, FlatList, Image, StyleSheet} from "react-native";
import ThemedText from "@/components/ThemedText";
import {useThemeColors} from "@/hooks/useThemeColors";
import Card from "@/components/Card";
import PokemonCard from "@/components/pokemon/PokemonCard";
import {useInfiniteFetchQuery} from "@/hooks/useFetchQuery";
import {getPokemonId} from "@/functions/pokemon";
import {InitPokemon} from "@/constants/init-pokemon";
import SearchBar from "@/components/SearchBar";
import {useState} from "react";
import Row from "@/components/Row";
import SortButton from "@/components/SortButton";
import RootView from "@/components/RootView";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8
  },
  body: {
    flex: 1,
    marginTop: 16,
  },
  gridGap: {
    gap: 8
  },
  list: {
    padding: 12
  },
  form: {
    paddingHorizontal: 12
  }
})

const Index = () => {
  const colors = useThemeColors();
  const { data, isFetching, fetchNextPage } = useInfiniteFetchQuery({ path: '/pokemon?limit=21'})
  const pokemons = data?.pages.flatMap(page => page.results.map(pokemon => ({
    name: pokemon.name,
    id: getPokemonId(pokemon.url),
  }))) ?? InitPokemon.results

  const [search, setSearch] = useState<string>('')
  const [sortKey, setSortKey] = useState<'id' | 'name'>('id')

  const filteredPokemons = [
    ...search ? pokemons.filter(pokemon => pokemon.name.includes(search.toLowerCase()) || pokemon.id.toString() === search.toLowerCase()) : pokemons
  ].sort((pokemonA, pokemonB) => (pokemonA[sortKey] < pokemonB[sortKey] ? -1 : 1));


  return (
    <RootView>
      <Row style={styles.header} gap={16}>
        <Image source={require("@/assets/images/pokeball.png")} width={24} height={24}></Image>
        <ThemedText variante={'headline'} color="grayLight">Pokédex</ThemedText>
      </Row>
      <Row gap={16} style={styles.form}>
        <SearchBar value={search} onChange={setSearch} />
        <SortButton value={sortKey} onChange={setSortKey} />
      </Row>
      <Card style={styles.body}>
        <FlatList
          data={filteredPokemons}
          numColumns={3}
          contentContainerStyle={[styles.gridGap, styles.list]}
          columnWrapperStyle={styles.gridGap}
          ListFooterComponent={
            isFetching ? <ActivityIndicator color={colors.tint} /> : null
          }
          onEndReached={() => search ? undefined : fetchNextPage()}
          renderItem={({ item }) => <PokemonCard id={item.id} nom={item.name} style={{ flex: 1 / 3 }} />}
          keyExtractor={(item) => item.id.toString()}>
        </FlatList>
      </Card>
    </RootView>
  );
}

export default Index;
