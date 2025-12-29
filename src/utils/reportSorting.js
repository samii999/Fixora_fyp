/**
 * Utility functions for sorting reports by urgency
 */

/**
 * Get urgency priority for sorting (High = 1, Medium = 2, Low = 3)
 * @param {Object} report - Report object
 * @returns {number} - Priority number (lower = higher priority)
 */
export const getUrgencyPriority = (report) => {
  const urgency = report.urgency || report.predictionMetadata?.urgency || 'Medium';
  
  switch (urgency) {
    case 'High':
      return 1;
    case 'Medium':
      return 2;
    case 'Low':
      return 3;
    default:
      return 2; // Default to Medium priority
  }
};

/**
 * Sort reports by urgency (High → Medium → Low), then by date
 * @param {Array} reports - Array of report objects
 * @returns {Array} - Sorted array
 */
export const sortReportsByUrgency = (reports) => {
  return [...reports].sort((a, b) => {
    // First, sort by urgency
    const urgencyDiff = getUrgencyPriority(a) - getUrgencyPriority(b);
    
    if (urgencyDiff !== 0) {
      return urgencyDiff;
    }
    
    // If urgency is the same, sort by date (newest first)
    const dateA = a.createdAt?.toDate?.() || new Date(0);
    const dateB = b.createdAt?.toDate?.() || new Date(0);
    return dateB - dateA;
  });
};

/**
 * Get urgency badge color
 * @param {string} urgency - Urgency level
 * @returns {string} - Color code
 */
export const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case 'High':
      return '#DC3545';
    case 'Medium':
      return '#FF9800';
    case 'Low':
      return '#28A745';
    default:
      return '#6C757D';
  }
};

/**
 * Get urgency display text with emoji
 * @param {string} urgency - Urgency level
 * @returns {string} - Display text
 */
export const getUrgencyDisplay = (urgency) => {
  switch (urgency) {
    case 'High':
      return '🔴 High';
    case 'Medium':
      return '🟠 Medium';
    case 'Low':
      return '🟢 Low';
    default:
      return '⚪ Unknown';
  }
};
