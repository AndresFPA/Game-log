import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GameEntry } from '../types';
import { INITIAL_GAMES } from '../data/initialGames';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Ensure user is authenticated (using anonymous auth so no login screen is forced)
export const ensureAuth = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          unsubscribe();
          resolve(cred.user);
        } catch (err) {
          console.warn('Firebase anonymous auth warning (e.g. domain restriction on host):', err);
          unsubscribe();
          resolve(null);
        }
      }
    });
  });
};

// Real-time listener for games collection
export const subscribeToGames = (
  onData: (games: GameEntry[]) => void,
  onError?: (err: Error) => void
) => {
  const gamesRef = collection(db, 'games');
  return onSnapshot(gamesRef, async (snapshot) => {
    if (snapshot.empty) {
      try {
        await seedInitialGames();
      } catch (e) {
        console.error('Error seeding initial games:', e);
      }
      return;
    }

    const gamesList: GameEntry[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      gamesList.push({
        id: docSnap.id,
        title: data.title || '',
        platform: data.platform || 'Other',
        status: data.status || 'Not Started',
        grade: data.grade || 'Unrated',
        beatenDate: data.beatenDate || '',
        hoursPlayed: Number(data.hoursPlayed) || 0,
        genre: data.genre || 'Other',
        coverUrl: data.coverUrl || '',
        releaseYear: data.releaseYear || '',
        synopsis: data.synopsis || '',
        notes: data.notes || '',
        favorite: !!data.favorite,
        createdAt: data.createdAt || new Date().toISOString()
      });
    });

    // Sort by createdAt descending
    gamesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    onData(gamesList);
  }, (err) => {
    console.warn('Firestore games subscription warning:', err);
    if (onError) onError(err);
  });
};

// Seed default initial games
export const seedInitialGames = async () => {
  try {
    const batch = writeBatch(db);
    for (const game of INITIAL_GAMES) {
      const gameRef = doc(db, 'games', game.id);
      batch.set(gameRef, game);
    }
    await batch.commit();
  } catch (e) {
    console.warn('Firestore seedInitialGames failed:', e);
  }
};

// Add or update a game entry in Firestore
export const saveGameToFirestore = async (game: GameEntry) => {
  try {
    const gameRef = doc(db, 'games', game.id);
    await setDoc(gameRef, game, { merge: true });
  } catch (e) {
    console.warn('Firestore saveGameToFirestore failed:', e);
  }
};

// Delete a game entry from Firestore
export const deleteGameFromFirestore = async (gameId: string) => {
  try {
    const gameRef = doc(db, 'games', gameId);
    await deleteDoc(gameRef);
  } catch (e) {
    console.warn('Firestore deleteGameFromFirestore failed:', e);
  }
};

// Reset all games back to default in Firestore
export const resetGamesInFirestore = async () => {
  try {
    const gamesRef = collection(db, 'games');
    const snapshot = await getDocs(gamesRef);
    const batch = writeBatch(db);
    
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    
    for (const game of INITIAL_GAMES) {
      const gameRef = doc(db, 'games', game.id);
      batch.set(gameRef, game);
    }
    
    await batch.commit();
  } catch (e) {
    console.warn('Firestore resetGamesInFirestore failed:', e);
  }
};

// Subscribe to passcode setting
export const subscribeToPasscode = (
  onData: (passcode: string) => void
) => {
  try {
    const passcodeDocRef = doc(db, 'settings', 'passcode');
    return onSnapshot(passcodeDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().passcode) {
        onData(docSnap.data().passcode);
      } else {
        onData('1234');
      }
    }, (err) => {
      console.warn('Firestore passcode subscription warning:', err);
    });
  } catch (e) {
    console.warn('Firestore subscribeToPasscode error:', e);
    return () => {};
  }
};

// Save passcode setting to Firestore
export const savePasscodeToFirestore = async (passcode: string) => {
  try {
    const passcodeDocRef = doc(db, 'settings', 'passcode');
    await setDoc(passcodeDocRef, { passcode }, { merge: true });
  } catch (e) {
    console.warn('Firestore savePasscodeToFirestore failed:', e);
  }
};
