import api from './api';
import { getPendingSyncItems, markSynced, clearSyncedItems } from './database';

export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  const items = await getPendingSyncItems();
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const body = JSON.parse(item.body);
      const config = { headers: { 'Content-Type': 'application/json' }, timeout: 15000 };

      if (item.method === 'POST') {
        await api.post(item.endpoint, body, config);
      } else if (item.method === 'PUT') {
        await api.put(item.endpoint, body, config);
      } else if (item.method === 'PATCH') {
        await api.patch(item.endpoint, body, config);
      }

      await markSynced(item.id);
      synced++;
    } catch {
      failed++;
    }
  }

  if (synced > 0) {
    await clearSyncedItems();
  }

  return { synced, failed };
}

export async function queueMeasurements(inspectionId: string, readings: any[], checklistId?: string) {
  const body = { readings, checklistId };
  const endpoint = `/inspections/${inspectionId}/measurements`;
  await addToSyncQueue('measurements', endpoint, 'POST', body);
}

export async function queueEvidenceUpload(inspectionId: string, url: string) {
  const body = { url };
  const endpoint = `/inspections/${inspectionId}/evidence`;
  await addToSyncQueue('evidence', endpoint, 'POST', body);
}

export async function queueGpsUpdate(inspectionId: string, latitude: number, longitude: number) {
  const body = { latitude, longitude };
  const endpoint = `/inspections/${inspectionId}/gps`;
  await addToSyncQueue('gps', endpoint, 'POST', body);
}

// Re-export from database
import { addToSyncQueue } from './database';
