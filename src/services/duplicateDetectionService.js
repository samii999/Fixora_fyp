import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// Haversine formula to calculate distance between two coordinates in meters
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check for duplicate reports within a specified radius
 * @param {number} latitude - Latitude of the new report
 * @param {number} longitude - Longitude of the new report
 * @param {string} category - Category of the report (optional filter)
 * @param {number} radiusMeters - Search radius in meters (default: 100m)
 * @param {string} organizationId - Organization ID (optional filter)
 * @returns {Promise<Object>} - { isDuplicate: boolean, originalReport: Object|null, distance: number|null }
 */
export const checkForDuplicates = async (latitude, longitude, category = null, radiusMeters = 100, organizationId = null) => {
  try {
    // Query for pending or assigned reports in the same organization
    let queryConstraints = [
      where('status', 'in', ['pending', 'assigned', 'in_progress'])
    ];

    // Add organization filter if provided
    if (organizationId) {
      queryConstraints.push(where('organizationId', '==', organizationId));
    }

    // Add category filter if provided for better matching
    if (category) {
      queryConstraints.push(where('categorySlug', '==', category));
    }

    const reportsQuery = query(collection(db, 'reports'), ...queryConstraints);
    const snapshot = await getDocs(reportsQuery);

    let closestReport = null;
    let minDistance = Infinity;

    // Check each report for proximity
    snapshot.docs.forEach(docSnap => {
      const report = docSnap.data();
      
      if (report.location && report.location.latitude && report.location.longitude) {
        const distance = calculateDistance(
          latitude,
          longitude,
          report.location.latitude,
          report.location.longitude
        );

        // If within radius and closer than previous matches
        if (distance <= radiusMeters && distance < minDistance) {
          minDistance = distance;
          closestReport = {
            id: docSnap.id,
            ...report,
            distance: distance
          };
        }
      }
    });

    if (closestReport) {
      return {
        isDuplicate: true,
        originalReport: closestReport,
        distance: minDistance,
        distanceText: minDistance < 10 ? 'same location' : `${Math.round(minDistance)}m away`
      };
    }

    return {
      isDuplicate: false,
      originalReport: null,
      distance: null,
      distanceText: null
    };
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return {
      isDuplicate: false,
      originalReport: null,
      distance: null,
      distanceText: null,
      error: error.message
    };
  }
};

/**
 * Link a duplicate report to the original report
 * @param {string} duplicateReportId - ID of the duplicate report
 * @param {string} originalReportId - ID of the original report
 * @param {number} distance - Distance between reports in meters
 */
export const linkDuplicateReports = async (duplicateReportId, originalReportId, distance) => {
  try {
    const duplicateRef = doc(db, 'reports', duplicateReportId);
    const originalRef = doc(db, 'reports', originalReportId);

    // Get original report to update its duplicate count
    const originalDoc = await getDoc(originalRef);
    const originalData = originalDoc.data();
    const currentDuplicates = originalData.duplicateReports || [];
    const duplicateCount = originalData.duplicateCount || 0;

    // Update the duplicate report
    await updateDoc(duplicateRef, {
      isDuplicate: true,
      originalReportId: originalReportId,
      duplicateDistance: distance,
      linkedAt: new Date()
    });

    // Update the original report with duplicate information
    await updateDoc(originalRef, {
      duplicateReports: [...currentDuplicates, {
        reportId: duplicateReportId,
        distance: distance,
        linkedAt: new Date()
      }],
      duplicateCount: duplicateCount + 1,
      lastDuplicateAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error linking duplicate reports:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all reports related to an original report (including duplicates)
 * @param {string} reportId - ID of the report
 * @returns {Promise<Array>} - Array of related report IDs and details
 */
export const getRelatedReports = async (reportId) => {
  try {
    const reportDoc = await getDoc(doc(db, 'reports', reportId));
    if (!reportDoc.exists()) {
      return [];
    }

    const reportData = reportDoc.data();
    const relatedReports = [];

    // If this is a duplicate, get the original and other duplicates
    if (reportData.isDuplicate && reportData.originalReportId) {
      const originalDoc = await getDoc(doc(db, 'reports', reportData.originalReportId));
      if (originalDoc.exists()) {
        relatedReports.push({
          id: originalDoc.id,
          ...originalDoc.data(),
          isOriginal: true
        });

        // Get other duplicates from the original report
        const originalData = originalDoc.data();
        if (originalData.duplicateReports) {
          for (const dup of originalData.duplicateReports) {
            if (dup.reportId !== reportId) {
              const dupDoc = await getDoc(doc(db, 'reports', dup.reportId));
              if (dupDoc.exists()) {
                relatedReports.push({
                  id: dupDoc.id,
                  ...dupDoc.data(),
                  isDuplicate: true
                });
              }
            }
          }
        }
      }
    } else {
      // This is an original report, get its duplicates
      if (reportData.duplicateReports) {
        for (const dup of reportData.duplicateReports) {
          const dupDoc = await getDoc(doc(db, 'reports', dup.reportId));
          if (dupDoc.exists()) {
            relatedReports.push({
              id: dupDoc.id,
              ...dupDoc.data(),
              isDuplicate: true,
              distance: dup.distance
            });
          }
        }
      }
    }

    return relatedReports;
  } catch (error) {
    console.error('Error getting related reports:', error);
    return [];
  }
};

/**
 * Merge images from duplicate reports into the original report
 * @param {string} originalReportId - ID of the original report
 * @param {string} duplicateReportId - ID of the duplicate report
 */
export const mergeReportImages = async (originalReportId, duplicateReportId) => {
  try {
    const originalRef = doc(db, 'reports', originalReportId);
    const duplicateRef = doc(db, 'reports', duplicateReportId);

    const [originalDoc, duplicateDoc] = await Promise.all([
      getDoc(originalRef),
      getDoc(duplicateRef)
    ]);

    if (!originalDoc.exists() || !duplicateDoc.exists()) {
      return { success: false, error: 'Report not found' };
    }

    const originalData = originalDoc.data();
    const duplicateData = duplicateDoc.data();

    // Merge image URLs, avoiding duplicates
    const originalImages = originalData.imageUrls || [originalData.imageUrl];
    const duplicateImages = duplicateData.imageUrls || [duplicateData.imageUrl];
    const mergedImages = [...new Set([...originalImages, ...duplicateImages])];

    // Update original report with merged images
    await updateDoc(originalRef, {
      imageUrls: mergedImages,
      imageUrl: mergedImages[0], // Update main image to first one
      mergedImagesAt: new Date()
    });

    return { success: true, mergedCount: mergedImages.length };
  } catch (error) {
    console.error('Error merging report images:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync status updates to all users who reported the same issue
 * @param {string} reportId - ID of the report being updated
 * @param {string} newStatus - New status to apply
 * @returns {Promise<Object>} - Result object
 */
export const syncStatusToLinkedUsers = async (reportId, newStatus) => {
  try {
    const reportDoc = await getDoc(doc(db, 'reports', reportId));
    if (!reportDoc.exists()) {
      return { success: false, error: 'Report not found' };
    }

    const reportData = reportDoc.data();
    const reportedByUsers = reportData.reportedByUsers || [reportData.userId];
    
    // Find all reports from the same users at the same location
    if (reportedByUsers.length > 1) {
      // Query all reports from these users
      const reportsQuery = query(collection(db, 'reports'));
      const snapshot = await getDocs(reportsQuery);
      
      const reportsToUpdate = [];
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        // Check if this report shares any users and is at same location (using reportedByUsers array)
        if (docSnap.id !== reportId && 
            data.reportedByUsers && 
            data.reportedByUsers.some(userId => reportedByUsers.includes(userId)) &&
            data.location && reportData.location &&
            calculateDistance(
              data.location.latitude,
              data.location.longitude,
              reportData.location.latitude,
              reportData.location.longitude
            ) < 100) { // Within 100m radius
          reportsToUpdate.push(docSnap.id);
        }
      });
      
      // Update all linked reports with the new status
      const updatePromises = reportsToUpdate.map(id => 
        updateDoc(doc(db, 'reports', id), {
          status: newStatus,
          syncedAt: new Date(),
          syncedFrom: reportId
        })
      );
      
      await Promise.all(updatePromises);
      
      console.log(`✅ Synced status to ${reportsToUpdate.length} linked reports`);
      return { success: true, updatedCount: reportsToUpdate.length };
    }
    
    return { success: true, updatedCount: 0 };
  } catch (error) {
    console.error('Error syncing status to linked users:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get duplicate statistics for a report
 * @param {string} reportId - ID of the report
 * @returns {Promise<Object>} - Statistics object
 */
export const getDuplicateStats = async (reportId) => {
  try {
    const reportDoc = await getDoc(doc(db, 'reports', reportId));
    if (!reportDoc.exists()) {
      return null;
    }

    const reportData = reportDoc.data();

    if (reportData.isDuplicate && reportData.originalReportId) {
      // This is a duplicate, get stats from original
      const originalDoc = await getDoc(doc(db, 'reports', reportData.originalReportId));
      if (originalDoc.exists()) {
        const originalData = originalDoc.data();
        return {
          isDuplicate: true,
          isOriginal: false,
          originalReportId: reportData.originalReportId,
          totalDuplicates: originalData.duplicateCount || 0,
          distance: reportData.duplicateDistance || 0
        };
      }
    } else {
      // This is an original report
      return {
        isDuplicate: false,
        isOriginal: true,
        totalDuplicates: reportData.duplicateCount || 0,
        duplicateReports: reportData.duplicateReports || []
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting duplicate stats:', error);
    return null;
  }
};
