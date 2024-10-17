import {useInfiniteQuery, useQuery} from "@tanstack/react-query";
import {Colors} from "@/constants/colors";

export type Pokemon = {
  id: number,
  name: string,
  url: string,
  weight: number,
  height: number,
  moves: {
    move: {
      name: string,
    }
  }[],
  stats: {
    base_stat: number,
    stat: {
      name: string
    }
  }[],
  cries: {
    latest: string,
  },
  types: {
    type: {
      name: keyof typeof Colors.type,
    }
  }[]
}

type API = {
  '/pokemon?limit=21': {
    count: number,
    next: string | null,
    results: { name: string, url: string }[]
  },
  '/pokemon/[id]': Pokemon,
  '/pokemon-species/[id]': {
    flavor_text_entries: {
      flavor_text: string,
      language: {
        name: string
      }
    }[]
  }
}

const ENDPOINT = "https://pokeapi.co/api/v2"

export const useFetchQuery = <T extends keyof API>({ path, params }: { path: T, params?: Record<string, string | number>}) => {
  const localUrl = Object.entries(params ?? {}).reduce((acc, [key, value]) => acc.replaceAll(`[${key}]`, value.toString()), path as string)

  return useQuery({
    queryKey: [path],
    queryFn: async () => {
      return await fetch(ENDPOINT + localUrl, {
        headers: {
          Accept: 'application/json'
        }
      }).then(res => res.json() as Promise<API[T]>)
    }
  });
}

export const useInfiniteFetchQuery = <T extends keyof API>({ path }: { path: T }) => {
  return useInfiniteQuery({
    queryKey: [path],
    initialPageParam: ENDPOINT + path,
    queryFn: async ({ pageParam }) => {
      return await fetch(pageParam, {
        headers: {
          Accept: 'application/json'
        }
      }).then(res => res.json() as Promise<API[T]>)
    },
    getNextPageParam: (lastPage) => {
      if ("next" in lastPage) {
        return lastPage.next;
      }
      return null;
    }
  });
}
