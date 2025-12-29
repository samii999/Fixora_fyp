import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { notifyAdminsNewReport } from './notificationService';

/**
 * Create a feedback request when a report is marked as resolved
 * @param {string} reportId - ID of the resolved report
 * @param {string} userId - ID of the user who created the report
 * @param {Object} reportData - Report data for context
 */
export const createFeedbackRequest = async (reportId, userId, reportData) => {
  try {
    const feedbackData = {
      reportId: reportId,
      userId: userId,
      reportCategory: reportData.category || 'General',
      reportDescription: reportData.description || '',
      reportLocation: reportData.address || '',
      organizationId: reportData.organizationId || '',
      assignedStaffIds: reportData.assignedStaffIds || [],
      assignedTeamId: reportData.assignedTeamId || null,
      resolvedAt: new Date(),
      status: 'pending', // pending, completed, expired
      notificationSent: true,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    const docRef = await addDoc(collection(db, 'feedbackRequests'), feedbackData);
    
    // Update the report with feedback request ID
    await updateDoc(doc(db, 'reports', reportId), {
      feedbackRequestId: docRef.id,
      feedbackStatus: 'pending',
      feedbackRequestedAt: new Date()
    });

    return { success: true, feedbackRequestId: docRef.id };
  } catch (error) {
    console.error('Error creating feedback request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Submit user feedback for a resolved report
 * @param {string} feedbackRequestId - ID of the feedback request
 * @param {string} reportId - ID of the report
 * @param {Object} feedbackData - Feedback data from user
 * @param {boolean} shouldResubmit - Whether to resubmit the issue as a new report
 */
export const submitFeedback = async (feedbackRequestId, reportId, feedbackData, shouldResubmit = false) => {
  try {
    const {
      isResolved,
      rating,
      comment,
      additionalImages,
      wouldRecommend
    } = feedbackData;

    // Update feedback request
    await updateDoc(doc(db, 'feedbackRequests', feedbackRequestId), {
      status: 'completed',
      isResolved: isResolved,
      rating: rating,
      comment: comment || '',
      additionalImages: additionalImages || [],
      wouldRecommend: wouldRecommend,
      submittedAt: new Date()
    });

    // Update report with feedback
    const reportUpdate = {
      feedbackStatus: 'completed',
      feedbackReceived: true,
      feedbackReceivedAt: new Date(),
      userVerifiedResolved: isResolved,
      userRating: rating,
      userComment: comment || ''
    };

    // If user says it's NOT resolved, change status back
    if (!isResolved) {
      reportUpdate.status = 'needs_rework';
      reportUpdate.needsReworkAt = new Date();
      reportUpdate.needsReworkReason = comment || 'User reported issue not resolved';
      
      // If user chose to resubmit, create a new report
      if (shouldResubmit) {
        const originalReport = await getDoc(doc(db, 'reports', reportId));
        if (originalReport.exists()) {
          const newReportId = await resubmitReport(originalReport.data(), reportId, comment, additionalImages);
          reportUpdate.resubmittedAsReportId = newReportId;
          reportUpdate.resubmittedAt = new Date();
        }
      }
    } else {
      reportUpdate.status = 'verified_resolved';
      reportUpdate.verifiedAt = new Date();
    }

    await updateDoc(doc(db, 'reports', reportId), reportUpdate);

    return { success: true, isResolved, shouldResubmit };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Resubmit a report as a new issue when user is not satisfied
 * @param {Object} originalReportData - Original report data
 * @param {string} originalReportId - Original report ID
 * @param {string} userComment - User's feedback comment explaining what's wrong
 * @param {Array} additionalImages - New images showing the issue
 * @returns {Promise<string>} - New report ID
 */
export const resubmitReport = async (originalReportData, originalReportId, userComment, additionalImages = []) => {
  try {
    // Create new report based on original
    const newReportData = {
      // Copy original report data
      userId: originalReportData.userId,
      description: `${originalReportData.description}\n\n⚠️ RESUBMITTED: ${userComment}`,
      location: originalReportData.location,
      address: originalReportData.address,
      category: originalReportData.category,
      urgency: originalReportData.urgency,
      organizationId: originalReportData.organizationId,
      
      // Combine original images with new feedback images
      imageUrls: [...(originalReportData.imageUrls || []), ...additionalImages],
      
      // New report metadata
      status: 'pending',
      createdAt: new Date(),
      isResubmission: true,
      originalReportId: originalReportId,
      resubmissionReason: userComment,
      
      // Copy prediction metadata if exists
      predictionMetadata: originalReportData.predictionMetadata,
      classificationResult: originalReportData.classificationResult,
      
      // Reset assignment-related fields
      assignedStaffIds: [],
      assignedStaff: [],
      assignedTo: null,
      proofImages: []
    };

    const docRef = await addDoc(collection(db, 'reports'), newReportData);
    
    // Notify admins about the resubmitted report
    if (originalReportData.organizationId) {
      notifyAdminsNewReport(
        docRef.id,
        originalReportData.organizationId,
        originalReportData.category || 'Issue',
        originalReportData.urgency || 'Medium',
        originalReportData.userId
      ).catch(err => {
        console.error('Failed to notify admins about resubmission:', err);
      });
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error resubmitting report:', error);
    throw error;
  }
};

/**
 * Get pending feedback requests for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of pending feedback requests
 */
export const getPendingFeedbackRequests = async (userId) => {
  try {
    // Query only by userId to avoid composite index requirement
    const q = query(
      collection(db, 'feedbackRequests'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const requests = [];
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      // Filter by status in JavaScript
      if (data.status !== 'pending') {
        continue;
      }
      
      // Check if expired
      const now = new Date();
      const expiresAt = data.expiresAt?.toDate();
      
      if (expiresAt && expiresAt < now) {
        // Mark as expired
        await updateDoc(doc(db, 'feedbackRequests', docSnap.id), {
          status: 'expired',
          expiredAt: new Date()
        });
        continue;
      }
      
      requests.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        expiresAt: data.expiresAt?.toDate(),
        resolvedAt: data.resolvedAt?.toDate()
      });
    }
    
    // Sort by createdAt in JavaScript (most recent first)
    requests.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    return requests;
  } catch (error) {
    console.error('Error getting pending feedback requests:', error);
    return [];
  }
};

/**
 * Get feedback statistics for an organization
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Object>} - Feedback statistics
 */
export const getOrganizationFeedbackStats = async (organizationId) => {
  try {
    // Query only by organizationId to avoid composite index
    const q = query(
      collection(db, 'feedbackRequests'),
      where('organizationId', '==', organizationId)
    );
    
    const snapshot = await getDocs(q);
    
    let totalFeedbacks = 0;
    let totalRating = 0;
    let resolvedCount = 0;
    let notResolvedCount = 0;
    let wouldRecommendCount = 0;
    
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      
      // Filter by completed status in JavaScript
      if (data.status !== 'completed') {
        return;
      }
      
      totalFeedbacks++;
      
      if (data.rating) {
        totalRating += data.rating;
      }
      
      if (data.isResolved) {
        resolvedCount++;
      } else {
        notResolvedCount++;
      }
      
      if (data.wouldRecommend) {
        wouldRecommendCount++;
      }
    });
    
    return {
      totalFeedbacks,
      averageRating: totalFeedbacks > 0 ? (totalRating / totalFeedbacks).toFixed(1) : 0,
      resolvedCount,
      notResolvedCount,
      resolutionRate: totalFeedbacks > 0 ? ((resolvedCount / totalFeedbacks) * 100).toFixed(1) : 0,
      recommendationRate: totalFeedbacks > 0 ? ((wouldRecommendCount / totalFeedbacks) * 100).toFixed(1) : 0
    };
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    return {
      totalFeedbacks: 0,
      averageRating: 0,
      resolvedCount: 0,
      notResolvedCount: 0,
      resolutionRate: 0,
      recommendationRate: 0
    };
  }
};

/**
 * Get feedback for a specific report
 * @param {string} reportId - Report ID
 * @returns {Promise<Object|null>} - Feedback data or null
 */
export const getReportFeedback = async (reportId) => {
  try {
    // Query only by reportId to avoid composite index
    const q = query(
      collection(db, 'feedbackRequests'),
      where('reportId', '==', reportId)
    );
    
    const snapshot = await getDocs(q);
    
    // Filter by completed status in JavaScript
    const completedDocs = snapshot.docs.filter(doc => doc.data().status === 'completed');
    
    if (completedDocs.length === 0) {
      return null;
    }
    
    const docSnap = completedDocs[0];
    return {
      id: docSnap.id,
      ...docSnap.data(),
      submittedAt: docSnap.data().submittedAt?.toDate()
    };
  } catch (error) {
    console.error('Error getting report feedback:', error);
    return null;
  }
};

/**
 * Get all feedback for staff/team performance review
 * @param {string} staffId - Staff member ID (optional)
 * @param {string} teamId - Team ID (optional)
 * @returns {Promise<Array>} - Array of feedback
 */
export const getStaffFeedback = async (staffId = null, teamId = null) => {
  try {
    let q;
    
    if (staffId) {
      // Query only by assignedStaffIds to avoid composite index
      q = query(
        collection(db, 'feedbackRequests'),
        where('assignedStaffIds', 'array-contains', staffId)
      );
    } else if (teamId) {
      // Query only by assignedTeamId to avoid composite index
      q = query(
        collection(db, 'feedbackRequests'),
        where('assignedTeamId', '==', teamId)
      );
    } else {
      return [];
    }
    
    const snapshot = await getDocs(q);
    
    // Filter by completed status and sort in JavaScript
    const feedback = snapshot.docs
      .filter(doc => doc.data().status === 'completed')
      .map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        submittedAt: docSnap.data().submittedAt?.toDate()
      }))
      .sort((a, b) => {
        if (!a.submittedAt) return 1;
        if (!b.submittedAt) return -1;
        return b.submittedAt.getTime() - a.submittedAt.getTime();
      });
    
    return feedback;
  } catch (error) {
    console.error('Error getting staff feedback:', error);
    return [];
  }
};

/**
 * Send reminder for pending feedback (called by cron job or on app open)
 * @param {string} userId - User ID
 */
export const checkAndRemindPendingFeedback = async (userId) => {
  try {
    const pendingRequests = await getPendingFeedbackRequests(userId);
    
    // Return count of pending requests for notification badge
    return {
      count: pendingRequests.length,
      requests: pendingRequests
    };
  } catch (error) {
    console.error('Error checking pending feedback:', error);
    return { count: 0, requests: [] };
  }
};
