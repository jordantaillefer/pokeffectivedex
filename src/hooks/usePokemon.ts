import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { pokemonService } from '../services/pokemonService';
import { teamService } from '../services/teamService';
import { pokemonAPI } from '../services/api';
import type { PokemonSearchResult, Team, TeamPokemon, PokemonPageResponse } from '../types/pokemon';

// Keys pour React Query
export const pokemonKeys = {
  all: ['pokemon'] as const,
  list: () => ['pokemon', 'list'] as const,
  search: (query: string, filters?: any) => ['pokemon', 'search', query, filters] as const,
  detail: (id: string | number) => ['pokemon', 'detail', id] as const,
  types: () => ['pokemon', 'types'] as const,
};

export const teamKeys = {
  all: ['teams'] as const,
  team: (id: string) => ['teams', id] as const,
  main: () => ['teams', 'main'] as const,
  stats: () => ['teams', 'stats'] as const,
};

// Hook pour la liste infinie des Pokémon
export function usePokemonList() {
  return useInfiniteQuery({
    queryKey: pokemonKeys.list(),
    queryFn: ({ pageParam = 0 }: { pageParam: number }) => pokemonAPI.getPokemonPage(20, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: PokemonPageResponse, pages: PokemonPageResponse[]) => {
      if (!lastPage.hasMore) return undefined;
      return pages.length * 20; // offset pour la page suivante
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hooks pour la recherche Pokémon
export function usePokemonSearch(
  query: string,
  filters?: {
    types?: string[];
    generation?: number;
    limit?: number;
  },
  enabled = true
) {
  return useQuery({
    queryKey: pokemonKeys.search(query, filters),
    queryFn: () => pokemonService.searchPokemon(query, filters),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePokemonDetail(id: string | number) {
  return useQuery({
    queryKey: pokemonKeys.detail(id),
    queryFn: () => pokemonService.getPokemonDetails(id),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function usePokemonTypes() {
  return useQuery({
    queryKey: pokemonKeys.types(),
    queryFn: () => pokemonService.getAllTypes(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Hooks pour les équipes
export function useTeams() {
  return useQuery({
    queryKey: teamKeys.all,
    queryFn: () => teamService.getAllTeams(),
    staleTime: 1000 * 10, // 10 seconds
  });
}

export function useTeam(teamId: string) {
  return useQuery({
    queryKey: teamKeys.team(teamId),
    queryFn: () => teamService.getTeamById(teamId),
    staleTime: 1000 * 10, // 10 seconds
  });
}

export function useMainTeam() {
  return useQuery({
    queryKey: teamKeys.main(),
    queryFn: () => teamService.getMainTeam(),
    staleTime: 1000 * 10, // 10 seconds
  });
}

export function useTeamStats() {
  return useQuery({
    queryKey: teamKeys.stats(),
    queryFn: () => teamService.getTeamStats(),
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Hooks pour les recommandations
export function useTeamRecommendations(
  opponentTypes: string[],
  enabled = true
) {
  const { data: mainTeam } = useMainTeam();
  
  return useQuery({
    queryKey: ['recommendations', opponentTypes, mainTeam?.id],
    queryFn: async () => {
      if (!mainTeam || mainTeam.pokemon.length === 0) {
        return { recommended: [], reasons: [] };
      }
      return pokemonService.getTeamRecommendations(opponentTypes, mainTeam.pokemon);
    },
    enabled: enabled && !!mainTeam && opponentTypes.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Mutations pour les équipes
export function useCreateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ name, isMain }: { name: string; isMain?: boolean }) =>
      teamService.createTeam(name, isMain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      queryClient.invalidateQueries({ queryKey: teamKeys.main() });
      queryClient.invalidateQueries({ queryKey: teamKeys.stats() });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      teamId, 
      updates 
    }: { 
      teamId: string; 
      updates: Partial<Omit<Team, 'id' | 'createdAt'>>; 
    }) =>
      teamService.updateTeam(teamId, updates),
    onSuccess: (updatedTeam) => {
      if (updatedTeam) {
        queryClient.invalidateQueries({ queryKey: teamKeys.all });
        queryClient.invalidateQueries({ queryKey: teamKeys.team(updatedTeam.id) });
        if (updatedTeam.isMain) {
          queryClient.invalidateQueries({ queryKey: teamKeys.main() });
        }
      }
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (teamId: string) => teamService.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      queryClient.invalidateQueries({ queryKey: teamKeys.main() });
      queryClient.invalidateQueries({ queryKey: teamKeys.stats() });
    },
  });
}

export function useAddPokemonToTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ teamId, pokemon }: { teamId: string; pokemon: TeamPokemon }) =>
      teamService.addPokemonToTeam(teamId, pokemon),
    onSuccess: (updatedTeam) => {
      if (updatedTeam) {
        queryClient.invalidateQueries({ queryKey: teamKeys.all });
        queryClient.invalidateQueries({ queryKey: teamKeys.team(updatedTeam.id) });
        if (updatedTeam.isMain) {
          queryClient.invalidateQueries({ queryKey: teamKeys.main() });
        }
        queryClient.invalidateQueries({ queryKey: teamKeys.stats() });
      }
    },
  });
}

export function useRemovePokemonFromTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ teamId, pokemonId }: { teamId: string; pokemonId: number }) =>
      teamService.removePokemonFromTeam(teamId, pokemonId),
    onSuccess: (updatedTeam) => {
      if (updatedTeam) {
        queryClient.invalidateQueries({ queryKey: teamKeys.all });
        queryClient.invalidateQueries({ queryKey: teamKeys.team(updatedTeam.id) });
        if (updatedTeam.isMain) {
          queryClient.invalidateQueries({ queryKey: teamKeys.main() });
        }
        queryClient.invalidateQueries({ queryKey: teamKeys.stats() });
      }
    },
  });
}

export function useAddPokemonToMainTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (pokemon: TeamPokemon) => teamService.addPokemonToMainTeam(pokemon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      queryClient.invalidateQueries({ queryKey: teamKeys.main() });
      queryClient.invalidateQueries({ queryKey: teamKeys.stats() });
    },
  });
}

export function useSetMainTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (teamId: string) => teamService.setMainTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      queryClient.invalidateQueries({ queryKey: teamKeys.main() });
    },
  });
}