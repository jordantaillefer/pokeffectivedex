import { pokemonAPI } from './api';
import type { Pokemon, PokemonSpecies, PokemonSearchResult, TeamPokemon } from '../types/pokemon';

export class PokemonService {
  // Cache des noms français
  private frenchNamesCache = new Map<number, string>();

  async searchPokemon(query: string, filters?: {
    types?: string[];
    generation?: number;
    limit?: number;
  }): Promise<PokemonSearchResult[]> {
    try {
      const results = await pokemonAPI.searchPokemon(query, filters?.limit || 20);
      
      // Apply filters (l'API retourne déjà le bon format)
      let filteredResults = results;

      if (filters?.types && filters.types.length > 0) {
        filteredResults = filteredResults.filter(pokemon =>
          pokemon.types.some(type => filters.types!.includes(type))
        );
      }

      if (filters?.generation) {
        filteredResults = filteredResults.filter(pokemon =>
          pokemon.generation === filters.generation
        );
      }

      return filteredResults;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  async getPokemonDetails(idOrName: string | number): Promise<{
    pokemon: Pokemon;
    species: PokemonSpecies;
    frenchName: string;
    effectiveness: {
      weakTo: string[];
      resistantTo: string[];
      strongAgainst: string[];
      weakAgainst: string[];
    };
  }> {
    try {
      const [pokemon, species] = await Promise.all([
        pokemonAPI.getPokemon(idOrName),
        this.getPokemonSpecies(idOrName),
      ]);

      const frenchName = this.extractFrenchName(species);
      const effectiveness = await this.calculateTypeEffectiveness(pokemon.types.map(t => t.type.name));

      return {
        pokemon,
        species,
        frenchName,
        effectiveness,
      };
    } catch (error) {
      throw new Error(`Failed to get Pokemon details: ${error}`);
    }
  }

  private async getPokemonSpecies(idOrName: string | number): Promise<PokemonSpecies> {
    return pokemonAPI.getPokemonSpecies(idOrName);
  }

  private extractFrenchName(species: PokemonSpecies): string {
    const frenchName = species.names.find(name => name.language.name === 'fr');
    return frenchName?.name || species.name;
  }

  private extractGeneration(generationName: string): number {
    const match = generationName.match(/generation-(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  private getBestSprite(pokemon: Pokemon): string | null {
    if (pokemon.sprites.other?.['official-artwork']?.front_default) {
      return pokemon.sprites.other['official-artwork'].front_default;
    }
    if (pokemon.sprites.other?.home?.front_default) {
      return pokemon.sprites.other.home.front_default;
    }
    return pokemon.sprites.front_default;
  }

  private async calculateTypeEffectiveness(types: string[]): Promise<{
    weakTo: string[];
    resistantTo: string[];
    strongAgainst: string[];
    weakAgainst: string[];
  }> {
    try {
      // Récupérer toutes les données d'efficacité de type
      const typeEffectiveness = await Promise.all(
        types.map(type => pokemonAPI.getTypeEffectiveness(type))
      );

      // Liste de tous les types possibles
      const allTypes = [
        'normal', 'fire', 'water', 'electric', 'grass', 'ice',
        'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
        'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
      ];

      // Calculer les multiplicateurs défensifs (types qui attaquent ce Pokémon)
      const defensiveMultipliers: { [attackType: string]: number } = {};
      
      for (const attackType of allTypes) {
        let multiplier = 1;
        
        // Pour chaque type de défense de ce Pokémon
        for (let i = 0; i < types.length; i++) {
          const defenseData = typeEffectiveness[i];
          
          // Vérifier l'efficacité de ce type d'attaque contre ce type de défense
          if (defenseData.double_damage_from.some(t => t.name === attackType)) {
            multiplier *= 2;
          } else if (defenseData.half_damage_from.some(t => t.name === attackType)) {
            multiplier *= 0.5;
          } else if (defenseData.no_damage_from.some(t => t.name === attackType)) {
            multiplier = 0;
          }
        }
        
        defensiveMultipliers[attackType] = multiplier;
      }
      
      // Calculer les multiplicateurs offensifs (types que ce Pokémon attaque)
      const offensiveMultipliers: { [defendType: string]: number } = {};
      
      for (const defendType of allTypes) {
        let bestMultiplier = 1;
        
        // Vérifier chaque type d'attaque de ce Pokémon
        for (let i = 0; i < types.length; i++) {
          const attackData = typeEffectiveness[i];
          let typeMultiplier = 1;
          
          if (attackData.double_damage_to.some(t => t.name === defendType)) {
            typeMultiplier = 2;
          } else if (attackData.half_damage_to.some(t => t.name === defendType)) {
            typeMultiplier = 0.5;
          } else if (attackData.no_damage_to.some(t => t.name === defendType)) {
            typeMultiplier = 0;
          }
          
          // Prendre le meilleur multiplicateur parmi nos types
          if (typeMultiplier > bestMultiplier) {
            bestMultiplier = typeMultiplier;
          }
        }
        
        offensiveMultipliers[defendType] = bestMultiplier;
      }
      
      // Classer les types selon leurs multiplicateurs
      const weakTo: string[] = [];
      const resistantTo: string[] = [];
      const strongAgainst: string[] = [];
      const weakAgainst: string[] = [];
      
      Object.entries(defensiveMultipliers).forEach(([type, multiplier]) => {
        if (multiplier > 1) {
          weakTo.push(type);
        } else if (multiplier < 1) {
          resistantTo.push(type);
        }
      });
      
      Object.entries(offensiveMultipliers).forEach(([type, multiplier]) => {
        if (multiplier > 1) {
          strongAgainst.push(type);
        } else if (multiplier < 1) {
          weakAgainst.push(type);
        }
      });

      return {
        weakTo,
        resistantTo,
        strongAgainst,
        weakAgainst,
      };
    } catch (error) {
      console.error('Failed to calculate type effectiveness:', error);
      return { weakTo: [], resistantTo: [], strongAgainst: [], weakAgainst: [] };
    }
  }

  // Conversion vers TeamPokemon
  convertToTeamPokemon(pokemon: Pokemon, species: PokemonSpecies): TeamPokemon {
    return {
      id: pokemon.id,
      name: pokemon.name,
      frenchName: this.extractFrenchName(species),
      types: pokemon.types.map(t => t.type.name),
      sprite: this.getBestSprite(pokemon),
      addedAt: new Date().toISOString(),
    };
  }

  // Recommandations basées sur l'équipe
  async getTeamRecommendations(opponentTypes: string[], team: TeamPokemon[]): Promise<{
    recommended: TeamPokemon[];
    reasons: string[];
  }> {
    const recommendations: Array<{ pokemon: TeamPokemon; effectiveness: number; reasons: string[] }> = [];

    for (const teamPokemon of team) {
      const effectiveness = await this.calculateMatchupEffectiveness(teamPokemon.types, opponentTypes);
      
      if (effectiveness.multiplier > 1) {
        recommendations.push({
          pokemon: teamPokemon,
          effectiveness: effectiveness.multiplier,
          reasons: effectiveness.reasons,
        });
      }
    }

    // Trier par efficacité
    recommendations.sort((a, b) => b.effectiveness - a.effectiveness);

    return {
      recommended: recommendations.map(r => r.pokemon),
      reasons: recommendations.flatMap(r => r.reasons),
    };
  }

  private async calculateMatchupEffectiveness(attackerTypes: string[], defenderTypes: string[]): Promise<{
    multiplier: number;
    reasons: string[];
  }> {
    let multiplier = 1;
    const reasons: string[] = [];

    try {
      for (const attackerType of attackerTypes) {
        const typeData = await pokemonAPI.getTypeEffectiveness(attackerType);
        
        for (const defenderType of defenderTypes) {
          // Double damage to
          if (typeData.double_damage_to.some(t => t.name === defenderType)) {
            multiplier *= 2;
            reasons.push(`${attackerType} est super efficace contre ${defenderType}`);
          }
          
          // Half damage to
          if (typeData.half_damage_to.some(t => t.name === defenderType)) {
            multiplier *= 0.5;
            reasons.push(`${attackerType} n'est pas très efficace contre ${defenderType}`);
          }
          
          // No damage to
          if (typeData.no_damage_to.some(t => t.name === defenderType)) {
            multiplier *= 0;
            reasons.push(`${attackerType} n'affecte pas ${defenderType}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to calculate matchup effectiveness:', error);
    }

    return { multiplier, reasons };
  }

  // Obtenir tous les types disponibles
  async getAllTypes(): Promise<string[]> {
    // Liste statique des types principaux pour éviter un appel API
    return [
      'normal', 'fire', 'water', 'electric', 'grass', 'ice',
      'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
      'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
    ];
  }
}

export const pokemonService = new PokemonService();