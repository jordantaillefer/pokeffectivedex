import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { usePokemonSearch, usePokemonTypes, usePokemonList } from '../hooks/usePokemon';
import type { PokemonSearchResult, PokemonPageResponse } from '../types/pokemon';

export default function SearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<number | undefined>();

  // Hooks pour les données
  const { data: types = [] } = usePokemonTypes();
  const { 
    data: searchResults = [], 
    isLoading: isSearchLoading, 
    error: searchError 
  } = usePokemonSearch(
    searchQuery, 
    {
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      generation: selectedGeneration,
      limit: 20,
    },
    searchQuery.length >= 2
  );

  // Hook pour la liste des Pokémon avec pagination
  const { 
    data: pokemonListData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isPokemonListLoading,
    error: pokemonListError
  } = usePokemonList();

  const allPokemon = pokemonListData?.pages.flatMap((page: PokemonPageResponse) => page.results) || [];
  const isLoading = searchQuery.length >= 2 ? isSearchLoading : isPokemonListLoading;
  const error = searchQuery.length >= 2 ? searchError : pokemonListError;

  const handlePokemonPress = (pokemon: PokemonSearchResult) => {
    navigation.navigate('PokemonDetail', {
      pokemonId: pokemon.id,
      pokemonName: pokemon.frenchName || pokemon.name,
    });
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedGeneration(undefined);
  };

  const renderPokemonItem = ({ item }: { item: PokemonSearchResult }) => (
    <TouchableOpacity
      style={styles.pokemonItem}
      onPress={() => handlePokemonPress(item)}
    >
      <View style={styles.pokemonImageContainer}>
        {item.sprite ? (
          <Image
            source={{ uri: item.sprite }}
            style={styles.pokemonImage}
            placeholder="🔍"
            contentFit="contain"
          />
        ) : (
          <View style={styles.pokemonImagePlaceholder}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
          </View>
        )}
      </View>
      <View style={styles.pokemonInfo}>
        <Text style={styles.pokemonName}>
          {item.frenchName || item.name}
        </Text>
        <View style={styles.typesContainer}>
          {item.types.map((type) => (
            <View key={type} style={[styles.typeChip, styles[`${type}Type` as keyof typeof styles] as any]}>
              <Text style={styles.typeText}>{type}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.pokemonGeneration}>Génération {item.generation}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar backgroundColor="#e74c3c" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un Pokémon..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedTypes.length > 0 || selectedGeneration ? (
              <TouchableOpacity style={styles.clearFilterChip} onPress={clearFilters}>
                <Text style={styles.clearFilterText}>Effacer filtres</Text>
                <Ionicons name="close" size={16} color="#e74c3c" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ) : null}
            
            {types.slice(0, 6).map((type: string) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  selectedTypes.includes(type) && styles.activeFilterChip,
                ]}
                onPress={() => toggleTypeFilter(type)}
              >
                <Text style={[
                  styles.filterText,
                  selectedTypes.includes(type) && styles.activeFilterText,
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterText}>+ Filtres</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.resultsContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={24} color="#e74c3c" />
              <Text style={styles.errorText}>Erreur lors de la recherche</Text>
            </View>
          )}
          
          {searchQuery.length >= 2 ? (
            <>
              <View style={styles.resultsHeader}>
                <Text style={styles.sectionTitle}>
                  Résultats {isLoading ? '' : `(${searchResults.length})`}
                </Text>
                {isLoading && <ActivityIndicator size="small" color="#e74c3c" />}
              </View>
              
              {searchResults.length === 0 && !isLoading && (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={48} color="#ccc" />
                  <Text style={styles.noResultsText}>Aucun Pokémon trouvé</Text>
                </View>
              )}
              
              <FlatList
                data={searchResults}
                renderItem={renderPokemonItem}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            </>
          ) : (
            <>
              <View style={styles.resultsHeader}>
                <Text style={styles.sectionTitle}>
                  Pokédex National {!isLoading && allPokemon.length > 0 && `(${allPokemon.length})`}
                </Text>
                {isLoading && <ActivityIndicator size="small" color="#e74c3c" />}
              </View>

              <View style={styles.pokemonListHint}>
                <Text style={styles.pokemonListHintText}>
                  💡 Tapez au moins 2 caractères pour rechercher par nom français ou anglais
                </Text>
              </View>

              <FlatList
                data={allPokemon}
                renderItem={renderPokemonItem}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                onEndReached={() => {
                  if (hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                  }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isFetchingNextPage ? (
                    <View style={styles.loadingMore}>
                      <ActivityIndicator size="small" color="#e74c3c" />
                      <Text style={styles.loadingMoreText}>Chargement...</Text>
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  !isLoading ? (
                    <View style={styles.noResultsContainer}>
                      <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
                      <Text style={styles.noResultsText}>Aucun Pokémon trouvé</Text>
                      <Text style={styles.noResultsSubtext}>
                        Vérifiez votre connexion internet
                      </Text>
                    </View>
                  ) : null
                }
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  filterChip: {
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  activeFilterChip: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  filterText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  activeFilterText: {
    color: '#fff',
  },
  clearFilterChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearFilterText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe6e6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginLeft: 8,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  welcomeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#ffe6e6',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    flex: 1,
  },
  startContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  startText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  pokemonListHint: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  pokemonListHintText: {
    fontSize: 14,
    color: '#e65100',
    fontWeight: '500',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  pokemonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pokemonImageContainer: {
    marginRight: 16,
  },
  pokemonImage: {
    width: 60,
    height: 60,
  },
  pokemonImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#f1f3f4',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pokemonInfo: {
    flex: 1,
  },
  pokemonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  pokemonGeneration: {
    fontSize: 12,
    color: '#999',
  },
  // Type colors (expanded list)
  normalType: { backgroundColor: '#A8A878' },
  fireType: { backgroundColor: '#F08030' },
  waterType: { backgroundColor: '#6890F0' },
  electricType: { backgroundColor: '#F8D030' },
  grassType: { backgroundColor: '#78C850' },
  iceType: { backgroundColor: '#98D8D8' },
  fightingType: { backgroundColor: '#C03028' },
  poisonType: { backgroundColor: '#A040A0' },
  groundType: { backgroundColor: '#E0C068' },
  flyingType: { backgroundColor: '#A890F0' },
  psychicType: { backgroundColor: '#F85888' },
  bugType: { backgroundColor: '#A8B820' },
  rockType: { backgroundColor: '#B8A038' },
  ghostType: { backgroundColor: '#705898' },
  dragonType: { backgroundColor: '#7038F8' },
  darkType: { backgroundColor: '#705848' },
  steelType: { backgroundColor: '#B8B8D0' },
  fairyType: { backgroundColor: '#EE99AC' },
});
