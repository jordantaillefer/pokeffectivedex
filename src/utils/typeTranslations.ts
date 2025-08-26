export const TYPE_TRANSLATIONS: { [key: string]: string } = {
  normal: 'Normal',
  fire: 'Feu',
  water: 'Eau',
  electric: 'Électrik',
  grass: 'Plante',
  ice: 'Glace',
  fighting: 'Combat',
  poison: 'Poison',
  ground: 'Sol',
  flying: 'Vol',
  psychic: 'Psy',
  bug: 'Insecte',
  rock: 'Roche',
  ghost: 'Spectre',
  dragon: 'Dragon',
  dark: 'Ténèbres',
  steel: 'Acier',
  fairy: 'Fée',
};

export function translateType(englishType: string): string {
  return TYPE_TRANSLATIONS[englishType.toLowerCase()] || englishType;
}

export function translateTypes(englishTypes: string[]): string[] {
  return englishTypes.map(translateType);
}