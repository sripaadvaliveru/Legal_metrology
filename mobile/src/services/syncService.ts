import { Platform } from 'react-native';
import api from './api';

/**
 * Replays queued field-verification changes once connectivity returns.
 * Failed items get an attempt counter and are skipped after 5 failures so a
 * single permanently-invalid request cannot block the rest of the queue.
 */
export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  if (Platform.OS === 'web') return { synced: 0, failed: 0 };

  try {
    const { getPendingSyncItems, markSynced, recordSyncFailure, clearSyncedItems } = require('./database');
    const items = await getPendingSyncItems();
    let synced = 0;
    let failed = 0;

    for (const item of items) {
      try {
        const body = JSON.parse(item.body);
        const config = { headers: { 'Content-Type': 'application/json' }, timeout: 15000 };

        if (item.operation === 'evidence') {
          // Photos must be uploaded as multipart first, then linked to the inspection.
          const formData = new FormData();
          formData.append('file', {
            uri: body.localUri,
            name: body.name || 'photo.jpg',
            type: body.type || 'image/jpeg',
          } as any);
          const uploaded = await api.post('/evidence/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000,
          });
          await api.post(item.endpoint, { url: uploaded.data.url }, config);
        } else if (item.method === 'POST') {
          await api.post(item.endpoint, body, config);
        } else if (item.method === 'PUT') {
          await api.put(item.endpoint, body, config);
        } else if (item.method === 'PATCH') {
          await api.patch(item.endpoint, body, config);
        }

        await markSynced(item.id);
        synced++;
      } catch (error) {
        await recordSyncFailure(item.id);
        failed++;
      }
    }

    if (synced > 0) {
      await clearSyncedItems();
    }

    return { synced, failed };
  } catch {
    return { synced: 0, failed: 0 };
  }
}

async function enqueue(operation: string, endpoint: string, method: string, body: any) {
  if (Platform.OS === 'web') return;
  const { addToSyncQueue } = require('./database');
  await addToSyncQueue(operation, endpoint, method, body);
}

export function queueMeasurements(inspectionId: string, readings: any[], checklistId?: string) {
  return enqueue('measurements', `/inspections/${inspectionId}/measurements`, 'POST', { readings, checklistId });
}

export function queueEvidenceUrl(inspectionId: string, url: string) {
  return enqueue('evidence-url', `/inspections/${inspectionId}/evidence`, 'POST', { url });
}

export function queueEvidenceCapture(
  inspectionId: string,
  photo: { localUri: string; name: string; type: string }
) {
  return enqueue('evidence', `/inspections/${inspectionId}/evidence`, 'POST', photo);
}

export function queueGpsUpdate(inspectionId: string, latitude: number, longitude: number) {
  return enqueue('gps', `/inspections/${inspectionId}/gps`, 'POST', { latitude, longitude });
}

export function queueInspectionSubmission(inspectionId: string, result: string, remarks?: string) {
  return enqueue('submission', `/inspections/${inspectionId}/submit`, 'POST', { result, remarks });
}
