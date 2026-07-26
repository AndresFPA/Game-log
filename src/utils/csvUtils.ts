import { GameEntry, CompletionStatus, Grade } from '../types';
import { INITIAL_GAMES } from '../data/initialGames';

const STORAGE_KEY = 'streamlit_game_tracker_data_v1';

/**
 * Escapes a string for safe inclusion in a CSV file.
 */
function escapeCsvValue(val: string | number | boolean | undefined): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts GameEntry[] into a CSV string formatted for download.
 */
export function exportToCsvString(games: GameEntry[]): string {
  const headers = [
    'id',
    'title',
    'platform',
    'status',
    'grade',
    'beatenDate',
    'hoursPlayed',
    'genre',
    'coverUrl',
    'releaseYear',
    'synopsis',
    'favorite',
    'createdAt'
  ];

  const rows = games.map(g => [
    escapeCsvValue(g.id),
    escapeCsvValue(g.title),
    escapeCsvValue(g.platform),
    escapeCsvValue(g.status),
    escapeCsvValue(g.grade),
    escapeCsvValue(g.beatenDate),
    escapeCsvValue(g.hoursPlayed),
    escapeCsvValue(g.genre),
    escapeCsvValue(g.coverUrl || ''),
    escapeCsvValue(g.releaseYear || ''),
    escapeCsvValue(g.synopsis || ''),
    escapeCsvValue(g.favorite ? 'TRUE' : 'FALSE'),
    escapeCsvValue(g.createdAt)
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Triggers a browser download of the CSV file.
 */
export function downloadCsvFile(games: GameEntry[], filename = 'game_backlog.csv') {
  const csvContent = exportToCsvString(games);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse a raw CSV text string back into GameEntry[].
 */
export function parseCsvStringToGames(csvText: string): GameEntry[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && csvText[i + 1] === '\n') {
        i++; // skip \r\n
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length <= 1) return [];

  // Parse helper for row cells split by comma respecting quotes
  const parseRow = (rowStr: string): string[] => {
    const cells: string[] = [];
    let cell = '';
    let inside = false;

    for (let i = 0; i < rowStr.length; i++) {
      const c = rowStr[i];
      if (c === '"') {
        if (inside && rowStr[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inside = !inside;
        }
      } else if (c === ',' && !inside) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const headerLine = lines[0].toLowerCase();
  const headers = parseRow(headerLine);

  const getIdx = (name: string) => headers.findIndex(h => h.replace(/["']/g, '') === name.toLowerCase());

  const idIdx = getIdx('id');
  const titleIdx = getIdx('title');
  const platformIdx = getIdx('platform');
  const statusIdx = getIdx('status');
  const gradeIdx = getIdx('grade');
  const beatenDateIdx = getIdx('beatendate');
  const hoursIdx = getIdx('hoursplayed');
  const genreIdx = getIdx('genre');
  const coverUrlIdx = getIdx('coverurl');
  const releaseYearIdx = getIdx('releaseyear');
  const synopsisIdx = getIdx('synopsis');
  const favoriteIdx = getIdx('favorite');
  const createdAtIdx = getIdx('createdat');

  const parsedGames: GameEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (!row || row.length === 0 || !row[0]) continue;

    const getValue = (idx: number, fallback = '') => (idx !== -1 && row[idx] !== undefined ? row[idx] : fallback);

    const title = getValue(titleIdx);
    if (!title) continue;

    const rawStatus = getValue(statusIdx, 'Not Started');
    const validStatuses: CompletionStatus[] = ['Not Started', 'In Progress', 'Completed', 'Mastered', 'Dropped', 'Wishlist'];
    const status: CompletionStatus = validStatuses.includes(rawStatus as CompletionStatus)
      ? (rawStatus as CompletionStatus)
      : 'Not Started';

    const rawGrade = getValue(gradeIdx, 'Unrated');
    const validGrades: Grade[] = ['S', 'A', 'B', 'C', 'D', 'F', 'Unrated'];
    const grade: Grade = validGrades.includes(rawGrade.toUpperCase() as Grade)
      ? (rawGrade.toUpperCase() as Grade)
      : 'Unrated';

    const rawHours = parseFloat(getValue(hoursIdx, '0'));
    const hoursPlayed = isNaN(rawHours) ? 0 : rawHours;

    const rawFav = getValue(favoriteIdx, 'false').toLowerCase();
    const favorite = rawFav === 'true' || rawFav === '1' || rawFav === 'yes';

    parsedGames.push({
      id: getValue(idIdx, `imported-${Date.now()}-${i}`),
      title,
      platform: getValue(platformIdx, 'PC / Steam'),
      status,
      grade,
      beatenDate: getValue(beatenDateIdx, ''),
      hoursPlayed,
      genre: getValue(genreIdx, 'General'),
      coverUrl: getValue(coverUrlIdx, ''),
      releaseYear: getValue(releaseYearIdx, ''),
      synopsis: getValue(synopsisIdx, ''),
      favorite,
      createdAt: getValue(createdAtIdx, new Date().toISOString())
    });
  }

  return parsedGames;
}

/**
 * Load saved games from localStorage or default to INITIAL_GAMES
 */
export function loadGamesFromStorage(): GameEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading games from localStorage', err);
  }
  return INITIAL_GAMES;
}

/**
 * Save games to localStorage
 */
export function saveGamesToStorage(games: GameEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch (err) {
    console.error('Error saving games to localStorage', err);
  }
}

/**
 * Clear localStorage and reset to defaults
 */
export function resetGamesToDefault(): GameEntry[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error resetting games', err);
  }
  return INITIAL_GAMES;
}
