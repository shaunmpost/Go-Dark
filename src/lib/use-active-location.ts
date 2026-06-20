/**
 * Resolves the location Go Dark is planning for: a selected saved location
 * (when unlocked), else the device's current location, else the default.
 * Shared by the Tonight screen and the Planner so they always agree.
 */
import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCATION } from '@/config/data-sources';
import { getDeviceLocation } from './location';
import { useStore } from './store';
import { Geo } from './types';

export function useActiveLocation(): Geo {
  const saved = useStore((s) => s.saved);
  const selectedId = useStore((s) => s.selectedId);
  const isUnlocked = useStore((s) => s.isUnlocked);
  const hasOnboarded = useStore((s) => s.hasOnboarded);

  const [device, setDevice] = useState<Geo | null>(null);
  useEffect(() => {
    // Hold the location prompt until onboarding has primed it.
    if (hasOnboarded) getDeviceLocation().then(setDevice).catch(() => {});
  }, [hasOnboarded]);

  return useMemo(() => {
    if (isUnlocked && selectedId) {
      const found = saved.find((l) => l.id === selectedId);
      if (found) return found;
    }
    return device ?? DEFAULT_LOCATION;
  }, [isUnlocked, selectedId, saved, device]);
}
