/**
 * App state — saved locations and the one-time unlock flag. Persisted to the
 * device via AsyncStorage (no account, no backend). Saved locations and the
 * multi-day planner are gated behind `isUnlocked` (see the unlock gate).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Geo } from './types';

export type SavedLocation = Geo & { id: string };

type StoreState = {
  saved: SavedLocation[];
  /** Selected saved-location id, or null for the device's current location. */
  selectedId: string | null;
  /** One-time purchase unlocked? Gates saved locations + the planner. */
  isUnlocked: boolean;
  /** Has the user seen the first-run onboarding? */
  hasOnboarded: boolean;
  /** Hydration flag so the UI can wait for persisted state. */
  _hydrated: boolean;

  addLocation: (g: Geo) => void;
  removeLocation: (id: string) => void;
  selectLocation: (id: string | null) => void;
  unlock: () => void;
  completeOnboarding: () => void;
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      saved: [],
      selectedId: null,
      isUnlocked: false,
      hasOnboarded: false,
      _hydrated: false,

      addLocation: (g) =>
        set((s) => ({ saved: [...s.saved, { ...g, id: `${Date.now()}` }] })),
      removeLocation: (id) =>
        set((s) => ({
          saved: s.saved.filter((l) => l.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),
      selectLocation: (id) => set({ selectedId: id }),
      unlock: () => set({ isUnlocked: true }),
      completeOnboarding: () => set({ hasOnboarded: true }),
    }),
    {
      name: 'go-dark-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        saved: s.saved,
        selectedId: s.selectedId,
        isUnlocked: s.isUnlocked,
        hasOnboarded: s.hasOnboarded,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true;
      },
    },
  ),
);
