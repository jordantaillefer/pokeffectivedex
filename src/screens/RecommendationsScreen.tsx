import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { useTeamRecommendations, useTeams, usePokemonTypes } from '../hooks/usePokemon';
import type { TeamPokemon } from '../types/pokemon';

export default function RecommendationsScreen() {
  const navigation = useNavigation();
  const [selectedOpponentTypes, setSelectedOpponentTypes] = useState<string[]>([]);
  
  // Hooks pour les données
  const { data: teams = [] } = useTeams();
  const { data: types = [] } = usePokemonTypes();
  const mainTeam = teams.find(team => team.isMain);
  
  const { 
    data: recommendations,
    isLoading,
    error
  } = useTeamRecommendations(
    selectedOpponentTypes,
    selectedOpponentTypes.length > 0
  );

  const handlePokemonPress = (pokemon: TeamPokemon) => {
    navigation.navigate('PokemonDetail', {
      pokemonId: pokemon.id,
      pokemonName: pokemon.frenchName || pokemon.name,
    });
  };

  const toggleOpponentType = (type: string) => {
    setSelectedOpponentTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearOpponentTypes = () => {
    setSelectedOpponentTypes([]);
  };

  const renderRecommendationItem = ({ item }: { item: TeamPokemon }) => (
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
      </View>
      <View style={styles.recommendationBadge}>
        <Ionicons name="thumbs-up" size={16} color="#27ae60" />
        <Text style={styles.recommendationText}>Recommandé</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar backgroundColor="#e74c3c" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recommandations</Text>
          <Text style={styles.headerSubtitle}>
            Choisissez les types de l'adversaire pour obtenir des recommandations
          </Text>
        </View>

        <View style={styles.opponentTypesContainer}>
          <Text style={styles.sectionTitle}>Types de l'adversaire</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typesScroll}>
            {selectedOpponentTypes.length > 0 && (
              <TouchableOpacity style={styles.clearTypesChip} onPress={clearOpponentTypes}>
                <Text style={styles.clearTypesText}>Effacer</Text>
                <Ionicons name="close" size={16} color="#e74c3c" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
            
            {types.map((type: string) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeFilterChip,
                  selectedOpponentTypes.includes(type) && styles.activeTypeFilterChip,
                ]}
                onPress={() => toggleOpponentType(type)}
              >
                <Text style={[
                  styles.typeFilterText,
                  selectedOpponentTypes.includes(type) && styles.activeTypeFilterText,
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.resultsContainer}>
          {!mainTeam ? (
            <View style={styles.noTeamContainer}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.noTeamText}>Aucune équipe principale</Text>
              <Text style={styles.noTeamSubtext}>
                Créez une équipe et définissez-la comme principale pour obtenir des recommandations
              </Text>
              <TouchableOpacity 
                style={styles.createTeamButton}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Teams' })}
              >
                <Text style={styles.createTeamButtonText}>Créer une équipe</Text>
              </TouchableOpacity>
            </View>
          ) : selectedOpponentTypes.length === 0 ? (
            <View style={styles.selectTypesContainer}>
              <Ionicons name="finger-print-outline" size={48} color="#ccc" />
              <Text style={styles.selectTypesText}>Sélectionnez des types</Text>
              <Text style={styles.selectTypesSubtext}>
                Choisissez les types de Pokémon adverses pour voir quels Pokémon de votre équipe sont recommandés
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>
                  Pokémon recommandés de votre équipe
                </Text>
                {isLoading && <ActivityIndicator size="small" color="#e74c3c" />}
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="warning-outline" size={24} color="#e74c3c" />
                  <Text style={styles.errorText}>Erreur lors du chargement</Text>
                </View>
              )}

              {recommendations && recommendations.recommended.length === 0 && !isLoading ? (
                <View style={styles.noRecommendationsContainer}>
                  <Ionicons name="sad-outline" size={48} color="#ccc" />
                  <Text style={styles.noRecommendationsText}>Aucune recommandation</Text>
                  <Text style={styles.noRecommendationsSubtext}>
                    Aucun Pokémon de votre équipe n'est particulièrement efficace contre ces types
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={recommendations?.recommended || []}
                  renderItem={renderRecommendationItem}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              )}

              {recommendations && recommendations.reasons.length > 0 && (
                <View style={styles.reasonsContainer}>
                  <Text style={styles.reasonsTitle}>Raisons</Text>
                  {recommendations.reasons.map((reason, index) => (
                    <View key={index} style={styles.reasonItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
                      <Text style={styles.reasonText}>{reason}</Text>
                    </View>
                  ))}
                </View>
              )}
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
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  opponentTypesContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  typesScroll: {
    flexDirection: 'row',
  },
  clearTypesChip: {
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
  clearTypesText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '500',
  },
  typeFilterChip: {
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  activeTypeFilterChip: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  typeFilterText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  activeTypeFilterText: {
    color: '#fff',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  noTeamContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noTeamText: {
    fontSize: 20,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  noTeamSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  createTeamButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  createTeamButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  selectTypesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  selectTypesText: {
    fontSize: 20,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  selectTypesSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
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
  noRecommendationsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noRecommendationsText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  noRecommendationsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
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
    width: 50,
    height: 50,
  },
  pokemonImagePlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: '#f1f3f4',
    borderRadius: 25,
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
  recommendationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendationText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '500',
    marginLeft: 4,
  },
  reasonsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  reasonsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  // Type colors
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