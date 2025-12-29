import { db } from '../config/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { createFeedbackRequest } from '../services/feedbackService';

/**
 * Backfill feedback requests for existing resolved reports
 * Run this once to create feedback requests for reports resolved before feedback system was implemented
 */
export const backfillFeedbackRequests = async () => {
  try {
    console.log('🔄 Starting feedback backfill...');
    
    // Get all resolved reports
    const reportsQuery = query(
      collection(db, 'reports'),
      where('status', '==', 'resolved')
    );
    
    const snapshot = await getDocs(reportsQuery);
    console.log(`📊 Found ${snapshot.docs.length} resolved reports`);
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const reportDoc of snapshot.docs) {
      const reportData = reportDoc.data();
      const reportId = reportDoc.id;
      
      try {
        // Check if feedback request already exists
        const feedbackQuery = query(
          collection(db, 'feedbackRequests'),
          where('reportId', '==', reportId)
        );
        const feedbackSnapshot = await getDocs(feedbackQuery);
        
        if (!feedbackSnapshot.empty) {
          console.log(`⏭️ Skipping ${reportId} - feedback request already exists`);
          skipped++;
          continue;
        }
        
        // Check if report has userId
        if (!reportData.userId) {
          console.log(`⚠️ Skipping ${reportId} - no userId`);
          skipped++;
          continue;
        }
        
        // Create feedback request
        const result = await createFeedbackRequest(reportId, reportData.userId, reportData);
        
        if (result.success) {
          console.log(`✅ Created feedback request for ${reportId}`);
          created++;
        } else {
          console.log(`❌ Failed to create feedback for ${reportId}`);
          errors++;
        }
        
      } catch (error) {
        console.error(`Error processing report ${reportId}:`, error);
        errors++;
      }
    }
    
    console.log('\n📈 Backfill Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️ Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📊 Total: ${snapshot.docs.length}`);
    
    return {
      success: true,
      created,
      skipped,
      errors,
      total: snapshot.docs.length
    };
    
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Backfill for a specific organization
 */
export const backfillFeedbackForOrganization = async (organizationId) => {
  try {
    console.log(`🔄 Starting feedback backfill for organization: ${organizationId}`);
    
    const reportsQuery = query(
      collection(db, 'reports'),
      where('organizationId', '==', organizationId),
      where('status', '==', 'resolved')
    );
    
    const snapshot = await getDocs(reportsQuery);
    console.log(`📊 Found ${snapshot.docs.length} resolved reports for this organization`);
    
    let created = 0;
    let skipped = 0;
    
    for (const reportDoc of snapshot.docs) {
      const reportData = reportDoc.data();
      const reportId = reportDoc.id;
      
      // Check if feedback request already exists
      const feedbackQuery = query(
        collection(db, 'feedbackRequests'),
        where('reportId', '==', reportId)
      );
      const feedbackSnapshot = await getDocs(feedbackQuery);
      
      if (feedbackSnapshot.empty && reportData.userId) {
        await createFeedbackRequest(reportId, reportData.userId, reportData);
        created++;
        console.log(`✅ Created feedback for ${reportId}`);
      } else {
        skipped++;
      }
    }
    
    console.log(`\n✅ Backfill complete: ${created} created, ${skipped} skipped`);
    
    return { created, skipped };
    
  } catch (error) {
    console.error('Backfill error:', error);
    throw error;
  }
};
