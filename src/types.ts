export type CompletionStatus = 
  | 'Not Started'
  | 'In Progress'
  | 'Completed'
  | 'Mastered'
  | 'Dropped'
  | 'Wishlist';

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F' | 'Unrated';

export interface GameEntry {
  id: string;
  title: string;
  platform: string;
  status: CompletionStatus;
  grade: Grade;
  beatenDate: string; // YYYY-MM-DD or empty string
  hoursPlayed: number;
  genre: string;
  coverUrl?: string; // High-res game box art / poster cover URL
  releaseYear?: string; // e.g. "2024" or "Oct 2023"
  synopsis?: string; // General info / synopsis / summary of the game
  notes?: string;
  favorite: boolean;
  createdAt: string; // ISO date string
}

export type SortField = 'title' | 'platform' | 'status' | 'grade' | 'beatenDate' | 'hoursPlayed' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export type AppTheme = 'crimson' | 'violet' | 'midnight';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  subtitle: string;
  accentHex: string;
  accentSecondaryHex: string;
  bgHex: string;
  cardHex: string;
  borderHex: string;
  swatchColors: [string, string, string];
}

export const THEME_CONFIGS: Record<AppTheme, ThemeConfig> = {
  crimson: {
    id: 'crimson',
    name: 'Crimson Velvet',
    subtitle: 'Coral & Crimson on Dark Plum',
    accentHex: '#EE4540',
    accentSecondaryHex: '#C72C41',
    bgHex: '#100612',
    cardHex: '#160A18',
    borderHex: '#510A32',
    swatchColors: ['#EE4540', '#C72C41', '#100612']
  },
  violet: {
    id: 'violet',
    name: 'Cyber Violet',
    subtitle: 'Indigo & Purple on Slate',
    accentHex: '#6366F1',
    accentSecondaryHex: '#8B5CF6',
    bgHex: '#020617',
    cardHex: '#0F172A',
    borderHex: '#1E293B',
    swatchColors: ['#6366F1', '#8B5CF6', '#020617']
  },
  midnight: {
    id: 'midnight',
    name: 'Obsidian Midnight',
    subtitle: 'Black, White, Gray & Dark Blue',
    accentHex: '#2563EB',
    accentSecondaryHex: '#3B82F6',
    bgHex: '#090A0F',
    cardHex: '#11131F',
    borderHex: '#1E2338',
    swatchColors: ['#2563EB', '#64748B', '#090A0F']
  }
};

export const PLATFORM_OPTIONS = [
  'PC / Steam',
  'PlayStation 5',
  'PlayStation 4',
  'Xbox Series X|S',
  'Xbox One',
  'Nintendo Switch',
  'Steam Deck',
  'Nintendo 3DS / DS',
  'Retro / Classic',
  'Mobile / iOS / Android',
  'Other'
];

export const STATUS_OPTIONS: CompletionStatus[] = [
  'In Progress',
  'Completed',
  'Mastered',
  'Not Started',
  'Wishlist',
  'Dropped'
];

export const GRADE_OPTIONS: Grade[] = [
  'S',
  'A',
  'B',
  'C',
  'D',
  'F',
  'Unrated'
];

export const GENRE_OPTIONS = [
  'Action RPG',
  'JRPG',
  'Adventure / Exploration',
  'FPS / Shooter',
  'Platformer / Metroidvania',
  'Strategy / Simulation',
  'Roguelike / Roguelite',
  'Puzzle / Cozy',
  'Survival / Crafting',
  'Horror',
  'Racing / Sports',
  'Fighting',
  'Visual Novel / Narrative'
];
