import { cacheInstruments, getCachedInstruments, cacheChecklists, getCachedChecklists, cacheApplications, getCachedApplications } from './database';

export async function fetchAndCacheInstruments(fetchFn: () => Promise<any[]>): Promise<any[]> {
  try {
    const data = await fetchFn();
    await cacheInstruments(data);
    return data;
  } catch {
    const cached = await getCachedInstruments();
    if (cached.length > 0) return cached;
    throw new Error('No data available offline');
  }
}

export async function fetchAndCacheChecklists(instrumentTypeId: string, fetchFn: () => Promise<any[]>): Promise<any[]> {
  try {
    const data = await fetchFn();
    await cacheChecklists(data);
    return data;
  } catch {
    const cached = await getCachedChecklists(instrumentTypeId);
    if (cached.length > 0) return cached;
    throw new Error('No checklist data available offline');
  }
}

export async function fetchAndCacheApplications(fetchFn: () => Promise<any[]>): Promise<any[]> {
  try {
    const data = await fetchFn();
    await cacheApplications(data);
    return data;
  } catch {
    const cached = await getCachedApplications();
    if (cached.length > 0) return cached;
    throw new Error('No data available offline');
  }
}
