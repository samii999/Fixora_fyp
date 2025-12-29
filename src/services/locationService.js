import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// Locations collection structure (expected):
// { id, type: 'city'|'district'|'village', name, parentId: string|null, lat?: number, lng?: number, country: 'PK' }

export async function getCities() {
  const q = query(collection(db, 'locations'), where('type', '==', 'city'), where('country', '==', 'PK'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getDistricts(cityId) {
  if (!cityId) return [];
  const q = query(collection(db, 'locations'), where('type', '==', 'district'), where('parentId', '==', cityId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getVillages(districtId) {
  if (!districtId) return [];
  const q = query(collection(db, 'locations'), where('type', '==', 'village'), where('parentId', '==', districtId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Optional helper to pick the most specific ids available from reverse geocoding or manual selection
export function buildLocationPath({ cityId, districtId, villageId }) {
  return { cityId: cityId || null, districtId: districtId || null, villageId: villageId || null };
}


