import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// Expected organization structure (minimum used by queries):
// { name, type, categories?: string[], coverage?: { cityIds?: string[], districtIds?: string[], villageIds?: string[] } }

// Haversine distance in km
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function findOrganizationsNear({ latitude, longitude, maxKm = 50 }) {
  const orgsCol = collection(db, 'organizations');
  const snap = await getDocs(orgsCol);
  const withGeo = [];
  snap.forEach(docSnap => {
    const data = docSnap.data();
    
    // Only include organizations with admins (handle both adminIds and adminIDs)
    const adminList = data.adminIds || data.adminIDs || [];
    
    // Strictly check: must be an array, must have length > 0, and all items must be valid
    const hasAdmins = Array.isArray(adminList) && adminList.length > 0 && 
                      adminList.every(item => {
                        if (typeof item === 'string') return item !== null && item !== undefined && item !== '';
                        if (typeof item === 'object') return item && item.name;
                        return false;
                      });
    if (!hasAdmins) return; // Skip organizations without admins
    
    const lat = data?.geo?.lat;
    const lng = data?.geo?.lng;
    if (typeof lat === 'number' && typeof lng === 'number') {
      const distanceKm = haversineKm(latitude, longitude, lat, lng);
      if (distanceKm <= maxKm) withGeo.push({ id: docSnap.id, distanceKm, ...data });
    }
  });
  withGeo.sort((a, b) => a.distanceKm - b.distanceKm);
  return withGeo;
}

export async function getAllOrganizationsWithAdmin() {
  const orgsCol = collection(db, 'organizations');
  const snap = await getDocs(orgsCol);
  const results = [];
  for (const d of snap.docs) {
    const data = d.data();
    
    // Only include organizations that have at least one admin (handle both adminIds and adminIDs)
    const adminList = data.adminIds || data.adminIDs || [];
    
    // Strictly check: must be an array, must have length > 0, and all items must be valid
    const hasAdmins = Array.isArray(adminList) && adminList.length > 0 && 
                      adminList.every(item => {
                        if (typeof item === 'string') return item !== null && item !== undefined && item !== '';
                        if (typeof item === 'object') return item && item.name;
                        return false;
                      });
    
    if (!hasAdmins) {
      continue; // Skip organizations without admins
    }
    
    let adminName = '';
    const firstAdminUid = adminList[0];
    
    // Handle both string UIDs and object structures
    if (typeof firstAdminUid === 'string') {
      // New format: adminIds contains user IDs
      try {
        const u = await getDoc(doc(db, 'users', firstAdminUid));
        adminName = u.exists() ? (u.data()?.name || u.data()?.email || '') : '';
      } catch {}
    } else if (typeof firstAdminUid === 'object' && firstAdminUid?.name) {
      // Old format: adminIDs contains objects with name
      adminName = firstAdminUid.name;
    }
    results.push({ id: d.id, adminName, ...data });
  }
  return results;
}


