import { Platform } from 'react-native';

export async function fetchAndCacheInstruments(fetchFn: () => Promise<any[]>): Promise<any[]> {
  const data = await fetchFn();
  if (Platform.OS === 'web') return data;
  try {
    const { cacheInstruments } = require('./database');
    await cacheInstruments(data);
  } catch {}
  return data;
}

export async function fetchAndCacheChecklists(instrumentTypeId: string, fetchFn: () => Promise<any[]>): Promise<any[]> {
  const data = await fetchFn();
  if (Platform.OS === 'web') return data;
  try {
    const { cacheChecklists } = require('./database');
    await cacheChecklists(data);
  } catch {}
  return data;
}

export async function fetchAndCacheApplications(fetchFn: () => Promise<any[]>): Promise<any[]> {
  const data = await fetchFn();
  if (Platform.OS === 'web') return data;
  try {
    const { cacheApplications } = require('./database');
    await cacheApplications(data);
  } catch {}
  return data;
}
