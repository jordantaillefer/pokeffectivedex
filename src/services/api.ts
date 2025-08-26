import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Pokemon, PokemonSpecies, TypeEffectiveness, PokemonPageResponse, PokemonPageResult } from '../types/pokemon';

const API_BASE_URL = 'https://pokeapi.co/api/v2';
const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

class PokemonAPI {
  private cache = new Map<string, { data: any; timestamp: number }>();

  async get<T>(endpoint: string, useCache = true): Promise<T> {
    const cacheKey = endpoint;
    
    if (useCache) {
      // Check memory cache first
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
        return cached.data;
      }

      // Check AsyncStorage cache
      try {
        const stored = await AsyncStorage.getItem(`api_cache_${cacheKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
            this.cache.set(cacheKey, parsed);
            return parsed.data;
          }
        }
      } catch (error) {
        console.warn('Cache read error:', error);
      }
    }

    // Fetch from API
    try {
      const response = await axios.get<T>(`${API_BASE_URL}${endpoint}`);
      const data = response.data;

      if (useCache) {
        const cacheEntry = { data, timestamp: Date.now() };
        this.cache.set(cacheKey, cacheEntry);
        
        // Store in AsyncStorage
        try {
          await AsyncStorage.setItem(
            `api_cache_${cacheKey}`,
            JSON.stringify(cacheEntry)
          );
        } catch (error) {
          console.warn('Cache write error:', error);
        }
      }

      return data;
    } catch (error) {
      throw new Error(`API request failed: ${error}`);
    }
  }

  async getPokemon(idOrName: string | number): Promise<Pokemon> {
    return this.get<Pokemon>(`/pokemon/${idOrName}`);
  }

  async getPokemonSpecies(idOrName: string | number): Promise<PokemonSpecies> {
    return this.get<PokemonSpecies>(`/pokemon-species/${idOrName}`);
  }

  async getTypeEffectiveness(type: string): Promise<TypeEffectiveness> {
    const typeData = await this.get<{ damage_relations: TypeEffectiveness }>(`/type/${type}`);
    return typeData.damage_relations;
  }

  async getPokemonList(limit = 1000, offset = 0): Promise<{ results: Array<{ name: string; url: string }>; count: number; next: string | null; previous: string | null }> {
    return this.get<{ results: Array<{ name: string; url: string }>; count: number; next: string | null; previous: string | null }>(`/pokemon?limit=${limit}&offset=${offset}`);
  }

  async getPokemonPage(limit = 20, offset = 0): Promise<PokemonPageResponse> {
    const listResponse = await this.getPokemonList(limit, offset);
    
    const pokemonPromises = listResponse.results.map(async (pokemon) => {
      const id = this.extractIdFromUrl(pokemon.url);
      try {
        const [pokemonData, species] = await Promise.all([
          this.getPokemon(id),
          this.getPokemonSpecies(id)
        ]);
        
        const frenchName = species.names.find(name => name.language.name === 'fr')?.name || pokemonData.name;
        const sprite = this.getBestSpriteFromPokemon(pokemonData);
        const generation = this.extractGenerationNumber(species.generation.name);
        
        return {
          id: pokemonData.id,
          name: pokemonData.name,
          frenchName,
          types: pokemonData.types.map(t => t.type.name),
          sprite,
          generation,
        };
      } catch (error) {
        console.warn(`Failed to load Pokemon ${pokemon.name}:`, error);
        return null;
      }
    });

    const results = (await Promise.all(pokemonPromises)).filter(Boolean) as PokemonPageResult[];
    
    return {
      results,
      hasMore: !!listResponse.next,
      total: listResponse.count,
    };
  }

  async searchPokemon(query: string, limit = 20): Promise<PokemonPageResult[]> {
    // Pour la recherche, on utilise un cache de tous les Pokémon
    const cacheKey = 'all_pokemon_cache';
    let allPokemonData = this.cache.get(cacheKey)?.data;
    
    if (!allPokemonData) {
      // Charger TOUS les Pokémon (il y en a environ 1025 actuellement)
      console.log('Chargement de tous les Pokémon pour la première fois...');
      const allPokemon = await this.getPokemonList(2000); // Large buffer pour futurs Pokémon
      
      const pokemonPromises = allPokemon.results.map(async (pokemon) => {
        const id = this.extractIdFromUrl(pokemon.url);
        try {
          const [pokemonData, species] = await Promise.all([
            this.getPokemon(id),
            this.getPokemonSpecies(id)
          ]);
          
          const frenchName = species.names.find(name => name.language.name === 'fr')?.name || pokemonData.name;
          const sprite = this.getBestSpriteFromPokemon(pokemonData);
          const generation = this.extractGenerationNumber(species.generation.name);
          
          return {
            id: pokemonData.id,
            name: pokemonData.name,
            frenchName,
            types: pokemonData.types.map(t => t.type.name),
            sprite,
            generation,
          };
        } catch (error) {
          console.warn(`Failed to load Pokemon ${pokemon.name}:`, error);
          return null;
        }
      });

      allPokemonData = (await Promise.all(pokemonPromises)).filter(Boolean);
      console.log(`Chargé ${allPokemonData.length} Pokémon au total`);
      
      // Cache les données pour 24 heures
      this.cache.set(cacheKey, { data: allPokemonData, timestamp: Date.now() });
      
      // Sauvegarder aussi dans AsyncStorage pour persister entre les sessions
      try {
        await AsyncStorage.setItem(
          `api_cache_${cacheKey}`,
          JSON.stringify({ data: allPokemonData, timestamp: Date.now() })
        );
      } catch (error) {
        console.warn('Failed to cache all Pokemon data:', error);
      }
    }
    
    // Filtrage par nom français ET anglais
    const queryLower = query.toLowerCase();
    const filtered = (allPokemonData as PokemonPageResult[]).filter(pokemon => 
      pokemon.name.toLowerCase().includes(queryLower) ||
      pokemon.frenchName.toLowerCase().includes(queryLower)
    );
    
    return filtered.slice(0, limit);
  }

  private extractIdFromUrl(url: string): number {
    const match = url.match(/\/(\d+)\/$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private getBestSpriteFromPokemon(pokemon: Pokemon): string | null {
    if (pokemon.sprites.other?.['official-artwork']?.front_default) {
      return pokemon.sprites.other['official-artwork'].front_default;
    }
    if (pokemon.sprites.other?.home?.front_default) {
      return pokemon.sprites.other.home.front_default;
    }
    return pokemon.sprites.front_default;
  }

  private extractGenerationNumber(generationName: string): number {
    const romanToNumber: { [key: string]: number } = {
      'i': 1,
      'ii': 2,
      'iii': 3,
      'iv': 4,
      'v': 5,
      'vi': 6,
      'vii': 7,
      'viii': 8,
      'ix': 9
    };

    const match = generationName.match(/generation-([ivx]+)/);
    if (match) {
      return romanToNumber[match[1]] || 1;
    }
    
    // Fallback pour les chiffres arabes si jamais l'API changeait
    const numberMatch = generationName.match(/generation-(\d+)/);
    return numberMatch ? parseInt(numberMatch[1], 10) : 1;
  }

  async preloadAllPokemon(): Promise<void> {
    try {
      // Déclencher le chargement de tous les Pokémon sans attendre le résultat
      // Cela va populer le cache pour les recherches futures
      this.searchPokemon('', 0); // Query vide pour déclencher le chargement du cache
    } catch (error) {
      console.warn('Preload failed:', error);
    }
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('api_cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }
}

export const pokemonAPI = new PokemonAPI();