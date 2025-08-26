import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  PokemonDetail: {
    pokemonId: number;
    pokemonName: string;
  };
};

export type MainTabParamList = {
  Search: undefined;
  Teams: undefined;
  Recommendations: undefined;
};

export type SearchStackParamList = {
  SearchHome: undefined;
  PokemonDetail: {
    pokemonId: number;
    pokemonName: string;
  };
};

export type TeamsStackParamList = {
  TeamsHome: undefined;
  TeamDetail: {
    teamId: string;
  };
  PokemonDetail: {
    pokemonId: number;
    pokemonName: string;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}