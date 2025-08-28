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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFilteredPokemon, usePokemonTypes } from '../hooks/usePokemon';
import type { PokemonSearchResult } from '../types/pokemon';
import { translateType } from '../utils/typeTranslations';

export default function SearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<number | undefined>();

  // Hooks pour les données
  const { data: types = [] } = usePokemonTypes();
  const { 
    data: filteredPokemon = [], 
    isLoading, 
    error 
  } = useFilteredPokemon(
    searchQuery, 
    {
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      generation: selectedGeneration,
      limit: 100, // Augmenté pour voir plus de résultats
    }
  );

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

  const handleGenerationPress = (generation: number) => {
    setSelectedGeneration(prev => prev === generation ? undefined : generation);
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
        {item.frenchName && item.frenchName !== item.name && (
          <Text style={styles.pokemonEnglishName}>
            {item.name}
          </Text>
        )}
        <View style={styles.typesContainer}>
          {item.types.map((type) => (
            <View key={type} style={[styles.typeChip, styles[`${type}Type` as keyof typeof styles] as any]}>
              <Text style={styles.typeText}>{translateType(type)}</Text>
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
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
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

        {/* Filtres par génération */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedGeneration && (
              <TouchableOpacity style={styles.clearFilterChip} onPress={() => setSelectedGeneration(undefined)}>
                <Text style={styles.clearFilterText}>Effacer génération</Text>
                <Ionicons name="close" size={16} color="#e74c3c" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
            
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((gen) => (
              <TouchableOpacity
                key={`gen-${gen}`}
                style={[
                  styles.filterChip,
                  selectedGeneration === gen && styles.activeFilterChip,
                ]}
                onPress={() => handleGenerationPress(gen)}
              >
                <Text style={[
                  styles.filterText,
                  selectedGeneration === gen && styles.activeFilterText,
                ]}>
                  Gen {gen}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Filtres par types */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedTypes.length > 0 && (
              <TouchableOpacity style={styles.clearFilterChip} onPress={() => setSelectedTypes([])}>
                <Text style={styles.clearFilterText}>Effacer types</Text>
                <Ionicons name="close" size={16} color="#e74c3c" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
            
            {types.map((type: string) => (
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
                  {translateType(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.resultsContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={24} color="#e74c3c" />
              <Text style={styles.errorText}>Erreur lors du chargement</Text>
            </View>
          )}
          
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery.trim() || selectedTypes.length > 0 || selectedGeneration
                ? `Résultats ${!isLoading ? `(${filteredPokemon.length})` : ''}`
                : 'Pokédex National'
              }
            </Text>
            {isLoading && <ActivityIndicator size="small" color="#e74c3c" />}
          </View>

          {!searchQuery.trim() && selectedTypes.length === 0 && !selectedGeneration && (
            <View style={styles.pokemonListHint}>
              <Text style={styles.pokemonListHintText}>
                💡 Utilisez la recherche ou les filtres pour explorer les Pokémon
              </Text>
            </View>
          )}

          {filteredPokemon.length === 0 && !isLoading && (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.noResultsText}>Aucun Pokémon trouvé</Text>
              <Text style={styles.noResultsSubtext}>
                Essayez de modifier vos filtres ou votre recherche
              </Text>
            </View>
          )}
          
          <FlatList
            data={filteredPokemon}
            renderItem={renderPokemonItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
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
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  pokemonEnglishName: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
    fontStyle: 'italic',
    textTransform: 'lowercase',
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
