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
