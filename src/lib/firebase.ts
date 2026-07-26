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
export const ensureAuth = (): Promise<User> => {
  return new Promise((resolve, reject) => {
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
          reject(err);
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
    console.error('Firestore games subscription error:', err);
    if (onError) onError(err);
  });
};

// Seed default initial games
export const seedInitialGames = async () => {
  const batch = writeBatch(db);
  for (const game of INITIAL_GAMES) {
    const gameRef = doc(db, 'games', game.id);
    batch.set(gameRef, game);
  }
  await batch.commit();
};

// Add or update a game entry in Firestore
export const saveGameToFirestore = async (game: GameEntry) => {
  const gameRef = doc(db, 'games', game.id);
  await setDoc(gameRef, game, { merge: true });
};

// Delete a game entry from Firestore
export const deleteGameFromFirestore = async (gameId: string) => {
  const gameRef = doc(db, 'games', gameId);
  await deleteDoc(gameRef);
};

// Reset all games back to default in Firestore
export const resetGamesInFirestore = async () => {
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
};

// Subscribe to passcode setting
export const subscribeToPasscode = (
  onData: (passcode: string) => void
) => {
  const passcodeDocRef = doc(db, 'settings', 'passcode');
  return onSnapshot(passcodeDocRef, (docSnap) => {
    if (docSnap.exists() && docSnap.data().passcode) {
      onData(docSnap.data().passcode);
    } else {
      onData('1234');
    }
  });
};

// Save passcode setting to Firestore
export const savePasscodeToFirestore = async (passcode: string) => {
  const passcodeDocRef = doc(db, 'settings', 'passcode');
  await setDoc(passcodeDocRef, { passcode }, { merge: true });
};
