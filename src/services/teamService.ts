import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Team, TeamPokemon } from '../types/pokemon';

const TEAMS_STORAGE_KEY = 'pokeffectivedex_teams';
const MAX_POKEMON_PER_TEAM = 6;

export class TeamService {
  async getAllTeams(): Promise<Team[]> {
    try {
      const teamsJson = await AsyncStorage.getItem(TEAMS_STORAGE_KEY);
      if (!teamsJson) return [];
      
      const teams: Team[] = JSON.parse(teamsJson);
      return teams.sort((a, b) => {
        // Équipe principale en premier, puis par date de création
        if (a.isMain && !b.isMain) return -1;
        if (!a.isMain && b.isMain) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (error) {
      console.error('Failed to load teams:', error);
      return [];
    }
  }

  async getTeamById(teamId: string): Promise<Team | null> {
    const teams = await this.getAllTeams();
    return teams.find(team => team.id === teamId) || null;
  }

  async getMainTeam(): Promise<Team | null> {
    const teams = await this.getAllTeams();
    return teams.find(team => team.isMain) || null;
  }

  async createTeam(name: string, isMain = false): Promise<Team> {
    const teams = await this.getAllTeams();
    
    // Si c'est l'équipe principale, désactiver les autres équipes principales
    if (isMain) {
      teams.forEach(team => {
        if (team.isMain) team.isMain = false;
      });
    }

    const newTeam: Team = {
      id: this.generateId(),
      name,
      pokemon: [],
      isMain,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    teams.push(newTeam);
    await this.saveTeams(teams);
    
    return newTeam;
  }

  async updateTeam(teamId: string, updates: Partial<Omit<Team, 'id' | 'createdAt'>>): Promise<Team | null> {
    const teams = await this.getAllTeams();
    const teamIndex = teams.findIndex(team => team.id === teamId);
    
    if (teamIndex === -1) return null;

    // Si on change l'équipe principale, désactiver les autres
    if (updates.isMain) {
      teams.forEach((team, index) => {
        if (index !== teamIndex && team.isMain) {
          team.isMain = false;
        }
      });
    }

    teams[teamIndex] = {
      ...teams[teamIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveTeams(teams);
    return teams[teamIndex];
  }

  async deleteTeam(teamId: string): Promise<boolean> {
    const teams = await this.getAllTeams();
    const filteredTeams = teams.filter(team => team.id !== teamId);
    
    if (filteredTeams.length === teams.length) {
      return false; // Team not found
    }

    await this.saveTeams(filteredTeams);
    return true;
  }

  async addPokemonToTeam(teamId: string, pokemon: TeamPokemon): Promise<Team | null> {
    const teams = await this.getAllTeams();
    const teamIndex = teams.findIndex(team => team.id === teamId);
    
    if (teamIndex === -1) return null;

    const team = teams[teamIndex];
    
    // Vérifier si l'équipe est pleine
    if (team.pokemon.length >= MAX_POKEMON_PER_TEAM) {
      throw new Error(`L'équipe ne peut contenir que ${MAX_POKEMON_PER_TEAM} Pokémon maximum`);
    }

    // Vérifier si le Pokémon est déjà dans l'équipe
    if (team.pokemon.some(p => p.id === pokemon.id)) {
      throw new Error('Ce Pokémon est déjà dans l\'équipe');
    }

    team.pokemon.push(pokemon);
    team.updatedAt = new Date().toISOString();
    
    await this.saveTeams(teams);
    return team;
  }

  async removePokemonFromTeam(teamId: string, pokemonId: number): Promise<Team | null> {
    const teams = await this.getAllTeams();
    const teamIndex = teams.findIndex(team => team.id === teamId);
    
    if (teamIndex === -1) return null;

    const team = teams[teamIndex];
    team.pokemon = team.pokemon.filter(p => p.id !== pokemonId);
    team.updatedAt = new Date().toISOString();
    
    await this.saveTeams(teams);
    return team;
  }

  async setMainTeam(teamId: string): Promise<boolean> {
    const teams = await this.getAllTeams();
    let teamFound = false;

    teams.forEach(team => {
      if (team.id === teamId) {
        team.isMain = true;
        team.updatedAt = new Date().toISOString();
        teamFound = true;
      } else if (team.isMain) {
        team.isMain = false;
        team.updatedAt = new Date().toISOString();
      }
    });

    if (teamFound) {
      await this.saveTeams(teams);
    }

    return teamFound;
  }

  // Méthodes utilitaires pour l'équipe principale
  async addPokemonToMainTeam(pokemon: TeamPokemon): Promise<Team> {
    let mainTeam = await this.getMainTeam();
    
    if (!mainTeam) {
      mainTeam = await this.createTeam('Mon Équipe Principale', true);
    }

    const updatedTeam = await this.addPokemonToTeam(mainTeam.id, pokemon);
    if (!updatedTeam) {
      throw new Error('Impossible d\'ajouter le Pokémon à l\'équipe principale');
    }

    return updatedTeam;
  }

  async removePokemonFromMainTeam(pokemonId: number): Promise<Team | null> {
    const mainTeam = await this.getMainTeam();
    if (!mainTeam) return null;

    return this.removePokemonFromTeam(mainTeam.id, pokemonId);
  }

  // Statistiques
  async getTeamStats(): Promise<{
    totalTeams: number;
    totalPokemon: number;
    averagePokemonPerTeam: number;
    mainTeamSize: number;
  }> {
    const teams = await this.getAllTeams();
    const totalPokemon = teams.reduce((sum, team) => sum + team.pokemon.length, 0);
    const mainTeam = teams.find(team => team.isMain);

    return {
      totalTeams: teams.length,
      totalPokemon,
      averagePokemonPerTeam: teams.length > 0 ? totalPokemon / teams.length : 0,
      mainTeamSize: mainTeam ? mainTeam.pokemon.length : 0,
    };
  }

  // Import/Export
  async exportTeams(): Promise<string> {
    const teams = await this.getAllTeams();
    return JSON.stringify(teams, null, 2);
  }

  async importTeams(teamsJson: string): Promise<void> {
    try {
      const teams: Team[] = JSON.parse(teamsJson);
      
      // Validation basique
      if (!Array.isArray(teams)) {
        throw new Error('Format invalide');
      }

      // Fusionner avec les équipes existantes
      const existingTeams = await this.getAllTeams();
      const mergedTeams = [...existingTeams];

      teams.forEach(importedTeam => {
        // Générer un nouvel ID si une équipe avec le même ID existe déjà
        if (mergedTeams.some(t => t.id === importedTeam.id)) {
          importedTeam.id = this.generateId();
        }
        
        // Si l'équipe importée est marquée comme principale, désactiver les autres
        if (importedTeam.isMain) {
          mergedTeams.forEach(team => {
            team.isMain = false;
          });
        }
        
        mergedTeams.push(importedTeam);
      });

      await this.saveTeams(mergedTeams);
    } catch (error) {
      throw new Error('Impossible d\'importer les équipes: format invalide');
    }
  }

  async clearAllTeams(): Promise<void> {
    await AsyncStorage.removeItem(TEAMS_STORAGE_KEY);
  }

  private async saveTeams(teams: Team[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    } catch (error) {
      console.error('Failed to save teams:', error);
      throw new Error('Impossible de sauvegarder les équipes');
    }
  }

  private generateId(): string {
    return `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const teamService = new TeamService();