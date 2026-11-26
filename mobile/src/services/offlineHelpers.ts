import { Platform } from 'react-native';

/**
 * Read-through cache helpers: try the server first, fall back to the local SQLite
 * copy when the device is offline or the request fails.
 */
async function readThrough<T>(
  fetchFn: () => Promise<T[]>,
  cacheFn: (data: T[]) => Promise<void>,
  readFn: () => Promise<T[]>,
  label: string
): Promise<T[]> {
  try {
    const data = await fetchFn();
    if (Platform.OS !== 'web') {
      try {
        await cacheFn(data);
      } catch (error) {
        console.warn(`Could not cache ${label}`, error);
      }
    }
    return data;
  } catch (error) {
    if (Platform.OS === 'web') throw error;
    try {
      const cached = await readFn();
      if (cached.length) return cached;
    } catch (cacheError) {
      console.warn(`Could not read cached ${label}`, cacheError);
    }
    throw error;
  }
}

export function fetchAndCacheInstruments(fetchFn: () => Promise<any[]>): Promise<any[]> {
  return readThrough(
    fetchFn,
    (data) => import('./database').then(({ cacheInstruments }) => cacheInstruments(data)),
    () => import('./database').then(({ getCachedInstruments }) => getCachedInstruments()),
    'instruments'
  );
}

export function fetchAndCacheApplications(fetchFn: () => Promise<any[]>): Promise<any[]> {
  return readThrough(
    fetchFn,
    (data) => import('./database').then(({ cacheApplications }) => cacheApplications(data)),
    () => import('./database').then(({ getCachedApplications }) => getCachedApplications()),
    'applications'
  );
}

export function fetchAndCacheChecklists(
  instrumentTypeId: string,
  fetchFn: () => Promise<any[]>
): Promise<any[]> {
  return readThrough(
    fetchFn,
    (data) => import('./database').then(({ cacheChecklists }) => cacheChecklists(data)),
    () => import('./database').then(({ getCachedChecklists }) => getCachedChecklists(instrumentTypeId)),
    'checklists'
  );
}
