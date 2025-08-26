export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  other?: {
    'official-artwork'?: {
      front_default: string | null;
    };
    home?: {
      front_default: string | null;
    };
  };
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: PokemonType[];
  sprites: PokemonSprites;
  stats: PokemonStat[];
  species: {
    name: string;
    url: string;
  };
}

export interface PokemonSpecies {
  id: number;
  name: string;
  names: Array<{
    language: {
      name: string;
    };
    name: string;
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: {
      name: string;
    };
  }>;
  generation: {
    name: string;
    url: string;
  };
}

export interface TypeEffectiveness {
  double_damage_from: Array<{ name: string; url: string }>;
  double_damage_to: Array<{ name: string; url: string }>;
  half_damage_from: Array<{ name: string; url: string }>;
  half_damage_to: Array<{ name: string; url: string }>;
  no_damage_from: Array<{ name: string; url: string }>;
  no_damage_to: Array<{ name: string; url: string }>;
}

export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonSearchResult {
  id: number;
  name: string;
  frenchName?: string;
  types: string[];
  sprite: string | null;
  generation: number;
}

// Types pour l'équipe
export interface TeamPokemon {
  id: number;
  name: string;
  frenchName?: string;
  types: string[];
  sprite: string | null;
  addedAt: string;
}

export interface Team {
  id: string;
  name: string;
  pokemon: TeamPokemon[];
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
}

// Types pour les recommandations
export interface BattleRecommendation {
  pokemon: TeamPokemon;
  effectiveness: number; // multiplicateur d'efficacité
  reasons: string[];
}

// Types pour la pagination des Pokémon
export interface PokemonPageResult {
  id: number;
  name: string;
  frenchName: string;
  types: string[];
  sprite: string | null;
  generation: number;
}

export interface PokemonPageResponse {
  results: PokemonPageResult[];
  hasMore: boolean;
  total: number;
}