export const getPokemonId = (url: string): number => {
  return parseInt(url.split('/').at(-2)!, 10)
}

export const getPokemonArtwork = (id: number | string): string => {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

export const formatWeight = (weight?: number): string => {
  return weight ? (weight / 10).toString().replace('.', ',')  + "kg": "--"
}

export const formatSize = (size?: number): string => {
  return size ? (size / 10).toString().replace('.', ',') + "m" : "--"
}

export const INITIAL_STATS = [
  {
    "base_stat": 1,
    "stat": {
      "name": "hp",
    }
  },
  {
    "base_stat": 1,
    "stat": {
      "name": "attack",
    }
  },
  {
    "base_stat": 1,
    "stat": {
      "name": "defense",
    }
  },
  {
    "base_stat": 1,
    "stat": {
      "name": "special-attack",
    }
  },
  {
    "base_stat": 1,
    "stat": {
      "name": "special-defense",
    }
  },
  {
    "base_stat": 1,
    "stat": {
      "name": "speed",
    }
  }
]
