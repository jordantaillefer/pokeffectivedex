import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { 
  useTeams, 
  useCreateTeam, 
  useDeleteTeam, 
  useSetMainTeam, 
  useRemovePokemonFromTeam 
} from '../hooks/usePokemon';
import type { Team, TeamPokemon } from '../types/pokemon';
import { translateType } from '../utils/typeTranslations';

export default function TeamsScreen() {
  const navigation = useNavigation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  // Hooks pour les données
  const { data: teams = [] } = useTeams();
  const createTeamMutation = useCreateTeam();
  const deleteTeamMutation = useDeleteTeam();
  const setMainTeamMutation = useSetMainTeam();
  const removePokemonMutation = useRemovePokemonFromTeam();

  const handlePokemonPress = (pokemon: TeamPokemon) => {
    navigation.navigate('PokemonDetail', {
      pokemonId: pokemon.id,
      pokemonName: pokemon.frenchName || pokemon.name,
    });
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom pour l\'équipe');
      return;
    }

    try {
      await createTeamMutation.mutateAsync({
        name: newTeamName.trim(),
        isMain: teams.length === 0, // Première équipe = principale
      });
      setNewTeamName('');
      setShowCreateModal(false);
      Alert.alert('Succès', 'Équipe créée avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer l\'équipe');
    }
  };

  const handleDeleteTeam = (team: Team) => {
    Alert.alert(
      'Supprimer l\'équipe',
      `Êtes-vous sûr de vouloir supprimer "${team.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTeamMutation.mutateAsync(team.id);
              Alert.alert('Succès', 'Équipe supprimée');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'équipe');
            }
          },
        },
      ]
    );
  };

  const handleSetMainTeam = async (teamId: string) => {
    try {
      await setMainTeamMutation.mutateAsync(teamId);
      Alert.alert('Succès', 'Équipe principale mise à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de définir l\'équipe principale');
    }
  };

  const handleRemovePokemon = (teamId: string, pokemonId: number, pokemonName: string) => {
    Alert.alert(
      'Retirer du Pokémon',
      `Voulez-vous retirer ${pokemonName} de l\'équipe ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await removePokemonMutation.mutateAsync({ teamId, pokemonId });
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de retirer le Pokémon');
            }
          },
        },
      ]
    );
  };

  const renderPokemonSlot = (pokemon: any, index: number, teamId: string) => {
    if (pokemon) {
      return (
        <View key={pokemon.id} style={styles.pokemonSlot}>
          <TouchableOpacity
            style={styles.pokemonSlotContent}
            onPress={() => handlePokemonPress(pokemon)}
            onLongPress={() => handleRemovePokemon(teamId, pokemon.id, pokemon.frenchName || pokemon.name)}
          >
            {pokemon.sprite ? (
              <Image
                source={{ uri: pokemon.sprite }}
                style={styles.pokemonSlotImage}
                placeholder="🔍"
                contentFit="contain"
              />
            ) : (
              <View style={styles.pokemonImagePlaceholder}>
                <Ionicons name="image-outline" size={20} color="#ccc" />
              </View>
            )}
            <Text style={styles.pokemonSlotName} numberOfLines={1}>
              {pokemon.frenchName || pokemon.name}
            </Text>
            <View style={styles.pokemonSlotTypes}>
              {pokemon.types?.slice(0, 2).map((type: string) => (
                <View key={type} style={[styles.miniTypeChip, styles[`${type}Type` as keyof typeof styles] as any]}>
                  <Text style={styles.miniTypeText}>{translateType(type)}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemovePokemon(teamId, pokemon.id, pokemon.frenchName || pokemon.name)}
          >
            <Ionicons name="close-circle" size={16} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View key={`empty-${index}`} style={[styles.pokemonSlot, styles.emptySlot]}>
        <View style={styles.pokemonImagePlaceholder}>
          <Ionicons name="add-outline" size={20} color="#ccc" />
        </View>
        <Text style={styles.emptySlotText}>Vide</Text>
      </View>
    );
  };

  return (
    <>
      <StatusBar backgroundColor="#e74c3c" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes Équipes</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.teamsContainer}>
          {teams.map((team: Team) => (
            <View key={team.id} style={styles.teamCard}>
              <View style={styles.teamHeader}>
                <View style={styles.teamTitleContainer}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  {team.isMain && (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>Principale</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.teamMenuButton}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.pokemonGrid}>
                {Array.from({ length: 6 }, (_, index) => 
                  renderPokemonSlot(team.pokemon[index], index, team.id)
                )}
              </View>

              <View style={styles.teamFooter}>
                <Text style={styles.teamInfo}>
                  {team.pokemon.length}/6 Pokémon • Créée le {new Date(team.createdAt).toLocaleDateString('fr-FR')}
                </Text>
                <View style={styles.teamActions}>
                  {!team.isMain && (
                    <TouchableOpacity 
                      style={styles.setMainButton}
                      onPress={() => handleSetMainTeam(team.id)}
                    >
                      <Text style={styles.setMainButtonText}>Définir comme principale</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteTeam(team)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.createTeamCard} onPress={() => setShowCreateModal(true)}>
            <Ionicons name="add-circle-outline" size={48} color="#e74c3c" />
            <Text style={styles.createTeamText}>Créer une nouvelle équipe</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Créer une nouvelle équipe</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Nom de l'équipe"
                value={newTeamName}
                onChangeText={setNewTeamName}
                placeholderTextColor="#999"
                autoFocus
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setNewTeamName('');
                    setShowCreateModal(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleCreateTeam}
                  disabled={createTeamMutation.isPending}
                >
                  {createTeamMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Créer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#e74c3c',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamsContainer: {
    flex: 1,
    padding: 16,
  },
  teamCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  teamTitleContainer: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mainBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  mainBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  teamMenuButton: {
    padding: 4,
  },
  pokemonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pokemonSlot: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    marginBottom: 8,
    position: 'relative',
  },
  pokemonSlotContent: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlot: {
    borderWidth: 2,
    borderColor: '#e1e1e1',
    borderStyle: 'dashed',
  },
  pokemonImagePlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  pokemonSlotName: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  emptySlotText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  teamFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamInfo: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  viewTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewTeamButtonText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
    marginRight: 4,
  },
  createTeamCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e1e1e1',
    borderStyle: 'dashed',
  },
  createTeamText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  pokemonSlotImage: {
    width: 40,
    height: 40,
    marginBottom: 4,
  },
  teamActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setMainButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  setMainButtonText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  confirmButton: {
    backgroundColor: '#e74c3c',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  pokemonSlotTypes: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  miniTypeChip: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginHorizontal: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  miniTypeText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '500',
    textTransform: 'capitalize',
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
