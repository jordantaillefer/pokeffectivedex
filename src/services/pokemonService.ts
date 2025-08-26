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
      const typeEffectiveness = await Promise.all(
        types.map(type => pokemonAPI.getTypeEffectiveness(type))
      );

      const effectiveness = {
        weakTo: new Set<string>(),
        resistantTo: new Set<string>(),
        strongAgainst: new Set<string>(),
        weakAgainst: new Set<string>(),
      };

      typeEffectiveness.forEach(typeData => {
        // Faible contre (reçoit des dégâts doublés)
        typeData.double_damage_from.forEach(type => effectiveness.weakTo.add(type.name));
        
        // Résiste à (reçoit des dégâts réduits)
        typeData.half_damage_from.forEach(type => effectiveness.resistantTo.add(type.name));
        
        // Immunisé (no damage)
        typeData.no_damage_from.forEach(type => effectiveness.resistantTo.add(type.name));
        
        // Fort contre (inflige des dégâts doublés)
        typeData.double_damage_to.forEach(type => effectiveness.strongAgainst.add(type.name));
        
        // Faible contre (inflige des dégâts réduits)
        typeData.half_damage_to.forEach(type => effectiveness.weakAgainst.add(type.name));
        
        // Inefficace contre (no damage)
        typeData.no_damage_to.forEach(type => effectiveness.weakAgainst.add(type.name));
      });

      return {
        weakTo: Array.from(effectiveness.weakTo),
        resistantTo: Array.from(effectiveness.resistantTo),
        strongAgainst: Array.from(effectiveness.strongAgainst),
        weakAgainst: Array.from(effectiveness.weakAgainst),
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