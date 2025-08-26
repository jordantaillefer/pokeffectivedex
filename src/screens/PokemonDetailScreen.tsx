import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { usePokemonDetail, useTeamRecommendations, useAddPokemonToMainTeam } from '../hooks/usePokemon';
import { pokemonService } from '../services/pokemonService';

type RouteParams = {
  pokemonId: number;
  pokemonName: string;
};

export default function PokemonDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { pokemonId, pokemonName } = route.params as RouteParams;

  // Hooks pour les données
  const { 
    data: pokemonData, 
    isLoading, 
    error 
  } = usePokemonDetail(pokemonId);
  
  const { 
    data: recommendations 
  } = useTeamRecommendations(
    pokemonData?.pokemon.types.map(t => t.type.name) || [],
    !!pokemonData
  );

  const addToTeamMutation = useAddPokemonToMainTeam();

  const handleAddToTeam = async () => {
    if (!pokemonData) return;

    try {
      const teamPokemon = pokemonService.convertToTeamPokemon(
        pokemonData.pokemon, 
        pokemonData.species
      );
      
      await addToTeamMutation.mutateAsync(teamPokemon);
      Alert.alert(
        'Succès !',
        `${pokemonData.frenchName} a été ajouté à votre équipe principale.`
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Impossible d\'ajouter le Pokémon à l\'équipe'
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#e74c3c" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !pokemonData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#e74c3c" barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>
            Impossible de charger les données du Pokémon
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { pokemon, frenchName, effectiveness } = pokemonData;
  
  const typeColors: { [key: string]: string[] } = {
    normal: ['#A8A878', '#9C9C63'],
    fire: ['#F08030', '#DD6610'],
    water: ['#6890F0', '#4F75D0'],
    electric: ['#F8D030', '#F0C814'],
    grass: ['#78C850', '#5CA935'],
    ice: ['#98D8D8', '#7CC5C5'],
    fighting: ['#C03028', '#A2241C'],
    poison: ['#A040A0', '#85348F'],
    ground: ['#E0C068', '#D4A54C'],
    flying: ['#A890F0', '#8E7CE8'],
    psychic: ['#F85888', '#F73B6C'],
    bug: ['#A8B820', '#8FA013'],
    rock: ['#B8A038', '#A08B28'],
    ghost: ['#705898', '#5A4A7A'],
    dragon: ['#7038F8', '#5528E8'],
    dark: ['#705848', '#5A493A'],
    steel: ['#B8B8D0', '#A8A8C0'],
    fairy: ['#EE99AC', '#E67A9A'],
  };

  const getTypeColor = (type: string) => typeColors[type] || ['#95a5a6', '#7f8c8d'];

  const getTypeBackgroundColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC',
    };
    return colors[type] || '#95a5a6';
  };

  const getStatName = (statName: string) => {
    const statNames: { [key: string]: string } = {
      'hp': 'PV',
      'attack': 'Attaque',
      'defense': 'Défense',
      'special-attack': 'Att. Spé.',
      'special-defense': 'Déf. Spé.',
      'speed': 'Vitesse',
    };
    return statNames[statName] || statName;
  };

  const renderStatBar = (stat: any) => {
    const percentage = (stat.base_stat / 255) * 100;
    return (
      <View key={stat.stat.name} style={styles.statRow}>
        <Text style={styles.statName}>{getStatName(stat.stat.name)}</Text>
        <Text style={styles.statValue}>{stat.base_stat}</Text>
        <View style={styles.statBarContainer}>
          <View style={[styles.statBar, { width: `${percentage}%` }]} />
        </View>
      </View>
    );
  };

  const renderEffectivenessSection = (title: string, types: string[]) => (
    <View style={styles.effectivenessSection}>
      <Text style={styles.effectivenessTitle}>{title}</Text>
      <View style={styles.typesRow}>
        {types.length === 0 ? (
          <Text style={styles.noTypesText}>Aucun</Text>
        ) : (
          types.map((type) => (
            <View key={type} style={[styles.typeChip, { backgroundColor: getTypeBackgroundColor(type) }]}>
              <Text style={styles.typeText}>{type}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );

  const getBestSprite = () => {
    if (pokemon.sprites.other?.['official-artwork']?.front_default) {
      return pokemon.sprites.other['official-artwork'].front_default;
    }
    if (pokemon.sprites.other?.home?.front_default) {
      return pokemon.sprites.other.home.front_default;
    }
    return pokemon.sprites.front_default;
  };

  return (
    <>
      <StatusBar backgroundColor="#e74c3c" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={getTypeColor(pokemon.types[0].type.name) as [string, string]}
          style={styles.header}
        >
          <View style={styles.pokemonImageContainer}>
            {getBestSprite() ? (
              <Image
                source={{ uri: getBestSprite() || undefined }}
                style={styles.pokemonImage}
                placeholder="🔍"
                contentFit="contain"
              />
            ) : (
              <View style={styles.pokemonImagePlaceholder}>
                <Ionicons name="image-outline" size={80} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.pokemonName}>{frenchName}</Text>
          <Text style={styles.pokemonId}>#{pokemon.id.toString().padStart(3, '0')}</Text>
          
          <View style={styles.typesContainer}>
            {pokemon.types.map((typeInfo: any) => (
              <View key={typeInfo.type.name} style={styles.typeChipHeader}>
                <Text style={styles.typeTextHeader}>{typeInfo.type.name}</Text>
              </View>
            ))}
          </View>

          <View style={styles.basicInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Taille</Text>
              <Text style={styles.infoValue}>{(pokemon.height / 10).toFixed(1)}m</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Poids</Text>
              <Text style={styles.infoValue}>{(pokemon.weight / 10).toFixed(1)}kg</Text>
            </View>
          </View>
        </LinearGradient>


        <ScrollView style={styles.content}>
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Statistiques de base</Text>
            {pokemon.stats.map(renderStatBar)}
            
            <View style={styles.totalStatsContainer}>
              <Text style={styles.totalStatsText}>
                Total: {pokemon.stats.reduce((sum: number, stat: any) => sum + stat.base_stat, 0)}
              </Text>
            </View>
          </View>

          <View style={styles.effectivenessContainer}>
            <Text style={styles.sectionTitle}>Table d'efficacité</Text>
              
              {renderEffectivenessSection(
                'Faible contre (reçoit 2x dégâts)',
                effectiveness.weakTo
              )}
              
              {renderEffectivenessSection(
                'Résiste à (reçoit 0.5x dégâts)',
                effectiveness.resistantTo
              )}
              
              {renderEffectivenessSection(
                'Fort contre (inflige 2x dégâts)',
                effectiveness.strongAgainst
              )}
              
              {renderEffectivenessSection(
                'Peu efficace contre (inflige 0.5x dégâts)',
                effectiveness.weakAgainst
              )}

              <View style={styles.recommendationSection}>
                <Text style={styles.sectionTitle}>Pokémon conseillés de votre équipe</Text>
                {recommendations && recommendations.recommended.length > 0 ? (
                  <View>
                    {recommendations.recommended.slice(0, 3).map((recommendedPokemon: any) => (
                      <View key={recommendedPokemon.id} style={styles.recommendationCard}>
                        <View style={styles.recommendationPokemon}>
                          <Text style={styles.recommendationPokemonName}>
                            {recommendedPokemon.frenchName || recommendedPokemon.name}
                          </Text>
                          <View style={styles.recommendationTypes}>
                            {recommendedPokemon.types.map((type: string) => (
                              <View key={type} style={[styles.typeChip, { backgroundColor: '#666' }]}>
                                <Text style={styles.typeText}>{type}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                        <Ionicons name="arrow-forward" size={20} color="#27ae60" />
                      </View>
                    ))}
                    {recommendations.reasons.length > 0 && (
                      <View style={styles.reasonsContainer}>
                        <Text style={styles.reasonsTitle}>Pourquoi ces Pokémon ?</Text>
                        {recommendations.reasons.slice(0, 2).map((reason: string, index: number) => (
                          <Text key={index} style={styles.reasonText}>• {reason}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.recommendationCard}>
                    <Ionicons name="bulb-outline" size={24} color="#f39c12" />
                    <Text style={styles.recommendationText}>
                      Aucune recommandation pour le moment. Ajoutez des Pokémon à votre équipe !
                    </Text>
                  </View>
                )}
              </View>
            </View>
        </ScrollView>

        <View style={styles.actionButton}>
          <TouchableOpacity 
            style={[
              styles.addToTeamButton,
              addToTeamMutation.isPending && styles.addToTeamButtonDisabled
            ]}
            onPress={handleAddToTeam}
            disabled={addToTeamMutation.isPending}
          >
            {addToTeamMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="add-circle" size={24} color="#fff" />
            )}
            <Text style={styles.addToTeamText}>
              {addToTeamMutation.isPending ? 'Ajout en cours...' : 'Ajouter à l\'équipe'}
            </Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    paddingTop: 40,
  },
  pokemonImageContainer: {
    marginBottom: 16,
  },
  pokemonImage: {
    width: 120,
    height: 120,
  },
  pokemonImagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pokemonName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  pokemonId: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  typesContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeChipHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  typeTextHeader: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  basicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#e74c3c',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  totalStatsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  totalStatsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statName: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    width: 40,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  statBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
    marginLeft: 12,
  },
  statBar: {
    height: '100%',
    backgroundColor: '#e74c3c',
    borderRadius: 4,
  },
  effectivenessContainer: {},
  effectivenessSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  effectivenessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  noTypesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  recommendationSection: {
    marginTop: 16,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  recommendationPokemon: {
    flex: 1,
  },
  recommendationPokemonName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  recommendationTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reasonsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  actionButton: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  addToTeamButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addToTeamButtonDisabled: {
    backgroundColor: '#95a5a6',
    opacity: 0.7,
  },
  addToTeamText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
