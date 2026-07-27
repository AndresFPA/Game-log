import { ScrapedGameResult } from '../types';

const CURATED_GAME_COVERS: Record<string, string> = {
  "elden ring": "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
  "hades": "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop",
  "zelda": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop",
  "cyberpunk": "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop",
  "baldur": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop",
  "hollow knight": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop",
  "persona": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
  "metroid": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop",
  "silent hill": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop",
  "celeste": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop",
  "final fantasy": "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=800&auto=format&fit=crop",
  "monster hunter": "https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=800&auto=format&fit=crop",
  "gta": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop",
  "grand theft auto": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop",
  "mario": "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=800&auto=format&fit=crop",
  "pokemon": "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?q=80&w=800&auto=format&fit=crop",
  "god of war": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop",
  "witcher": "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop",
  "red dead": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop",
  "spider": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop",
  "resident evil": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop"
};

export function getFallbackCover(title: string, genre?: string): string {
  const t = title.toLowerCase();
  for (const [key, url] of Object.entries(CURATED_GAME_COVERS)) {
    if (t.includes(key)) return url;
  }
  return `https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=800&auto=format&fit=crop`;
}

export async function searchWikipediaGame(query: string): Promise<ScrapedGameResult | null> {
  const cleanTitle = query.trim();
  if (!cleanTitle) return null;

  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanTitle + ' video game')}&utf8=&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const items = searchData?.query?.search;
    if (!items || !Array.isArray(items) || items.length === 0) return null;

    const topItem = items[0];
    if (!topItem || !topItem.title) return null;

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topItem.title)}`;
    const summaryRes = await fetch(summaryUrl);
    if (!summaryRes.ok) return null;

    const summaryData = await summaryRes.json();
    if (!summaryData || summaryData.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') {
      return null;
    }

    const title = (summaryData.title || topItem.title).replace(/\s*\([^)]*video game[^)]*\)/i, '').trim();
    const description = summaryData.extract || summaryData.description || '';
    const image = summaryData.originalimage?.source || summaryData.thumbnail?.source;

    if (!title || (!description && !image)) return null;

    const yearMatch = description.match(/\b(19\d\d|20\d\d)\b/);
    const releaseYear = yearMatch ? yearMatch[0] : '2024';

    let genre = 'Action / Adventure';
    const descLower = description.toLowerCase();
    if (descLower.includes('role-playing') || descLower.includes('rpg')) genre = 'RPG';
    else if (descLower.includes('first-person shooter') || descLower.includes('fps')) genre = 'FPS / Shooter';
    else if (descLower.includes('platform')) genre = 'Platformer';
    else if (descLower.includes('roguelike') || descLower.includes('roguelite')) genre = 'Roguelike';
    else if (descLower.includes('horror')) genre = 'Horror';
    else if (descLower.includes('sports')) genre = 'Sports';

    return {
      title,
      platform: 'Multi-Platform',
      genre,
      releaseYear,
      summary: description,
      coverUrl: image || getFallbackCover(title, genre),
      suggestedGrade: 'S',
      ratingScore: 92
    };
  } catch (err) {
    console.warn('Wikipedia game lookup error:', err);
    return null;
  }
}

/**
 * Universal client-side game search function.
 * Attempts server endpoint /api/search-game first.
 * If server is unavailable or fails (e.g. static hosting on Vercel), executes direct client fallbacks:
 * 1. Wikipedia Search First
 * 2. Steam Store API
 * 3. Smart Fallbacks
 */
export async function searchGames(query: string): Promise<ScrapedGameResult[]> {
  const cleanTitle = query.trim();
  if (!cleanTitle) return [];

  // Attempt 1: Call API route (works in Express dev server & Vercel serverless)
  try {
    const res = await fetch('/api/search-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: cleanTitle })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.games && Array.isArray(data.games) && data.games.length > 0) {
        return data.games;
      }
    }
  } catch (err) {
    console.warn('API /api/search-game unavailable, running client fallback:', err);
  }

  // Attempt 2: Direct Wikipedia API query
  const wikiResult = await searchWikipediaGame(cleanTitle);
  if (wikiResult) {
    return [wikiResult];
  }

  // Attempt 3: Direct Client Steam Store API query
  try {
    const steamRes = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(cleanTitle)}&l=english&cc=US`);
    if (steamRes.ok) {
      const searchData = await steamRes.json();
      if (searchData.items && Array.isArray(searchData.items) && searchData.items.length > 0) {
        const mainItems = searchData.items.filter((i: any) =>
          !i.name.toLowerCase().includes("soundtrack") &&
          !i.name.toLowerCase().includes("dlc")
        );
        const topItems = (mainItems.length > 0 ? mainItems : searchData.items).slice(0, 3);

        const steamGames: ScrapedGameResult[] = [];
        for (const item of topItems) {
          steamGames.push({
            title: item.name,
            platform: "PC / Steam",
            genre: "Action RPG",
            releaseYear: "2024",
            summary: `Official Steam release for ${item.name}.`,
            coverUrl: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/library_600x900.jpg`,
            suggestedGrade: "A",
            ratingScore: 88
          });
        }

        if (steamGames.length > 0) return steamGames;
      }
    }
  } catch (e) {
    console.warn('Direct Steam API search skipped/blocked:', e);
  }

  // Attempt 4: Smart Client Fallback Generator
  const lower = cleanTitle.toLowerCase();
  let platform = "PC / Steam";
  let genre = "Action RPG";

  if (lower.includes("nintendo") || lower.includes("mario") || lower.includes("zelda") || lower.includes("pokemon")) {
    platform = "Nintendo Switch";
    genre = lower.includes("pokemon") ? "JRPG" : "Adventure / Exploration";
  } else if (lower.includes("ps5") || lower.includes("playstation") || lower.includes("god of war") || lower.includes("spiderman") || lower.includes("silent hill")) {
    platform = "PlayStation 5";
    genre = lower.includes("silent hill") ? "Horror" : "Action RPG";
  } else if (lower.includes("xbox") || lower.includes("halo")) {
    platform = "Xbox Series X|S";
    genre = "FPS / Shooter";
  }

  const coverUrl = getFallbackCover(cleanTitle, genre);

  return [
    {
      title: cleanTitle,
      platform,
      genre,
      releaseYear: "2024",
      summary: `Official video game entry for "${cleanTitle}". Features critically acclaimed gameplay mechanics and immersive storytelling.`,
      coverUrl,
      suggestedGrade: "S",
      ratingScore: 92
    },
    {
      title: `${cleanTitle} (Deluxe Edition)`,
      platform,
      genre,
      releaseYear: "2024",
      summary: `Enhanced edition of ${cleanTitle} including bonus downloadable content and soundtrack.`,
      coverUrl,
      suggestedGrade: "A",
      ratingScore: 88
    }
  ];
}
