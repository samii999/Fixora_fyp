import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Image,
  Modal
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getOrganizationFeedbackStats, getStaffFeedback } from '../../services/feedbackService';
import { getCorrectedImageUrl } from '../../utils/imageUrlFixer';
import BlueHeader from '../../components/layout/Header';

const FeedbackDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, positive, negative
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);

  useEffect(() => {
    fetchFeedbackData();
  }, []);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      
      // Get organization ID
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const orgId = userDoc.data()?.organizationId;
      setOrganizationId(orgId);

      if (!orgId) {
        console.log('No organization ID found');
        setLoading(false);
        return;
      }

      // Fetch feedback statistics
      const statistics = await getOrganizationFeedbackStats(orgId);
      setStats(statistics);

      // Fetch all feedback requests for this organization
      const feedbackQuery = query(
        collection(db, 'feedbackRequests'),
        where('organizationId', '==', orgId),
        where('status', '==', 'completed')
      );

      const snapshot = await getDocs(feedbackQuery);
      const feedbackData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        submittedAt: docSnap.data().submittedAt?.toDate(),
        createdAt: docSnap.data().createdAt?.toDate()
      }));

      // Sort by submission date (newest first)
      feedbackData.sort((a, b) => {
        if (!a.submittedAt) return 1;
        if (!b.submittedAt) return -1;
        return b.submittedAt.getTime() - a.submittedAt.getTime();
      });

      setFeedbacks(feedbackData);

      // Fetch staff list for reference
      const orgDoc = await getDoc(doc(db, 'organizations', orgId));
      if (orgDoc.exists()) {
        const orgData = orgDoc.data();
        const staffIds = orgData.staffIds || [];
        
        const staffPromises = staffIds.map(async (staffId) => {
          const staffDoc = await getDoc(doc(db, 'users', staffId));
          if (staffDoc.exists()) {
            return {
              uid: staffId,
              name: staffDoc.data().name || staffDoc.data().email,
              email: staffDoc.data().email
            };
          }
          return null;
        });
        
        const staff = (await Promise.all(staffPromises)).filter(s => s !== null);
        setStaffList(staff);
      }

      // Fetch teams
      const teamsQuery = query(
        collection(db, 'teams'),
        where('organizationId', '==', orgId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      const teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeamsList(teams);

    } catch (error) {
      console.error('Error fetching feedback data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStaffName = (staffIds) => {
    if (!staffIds || staffIds.length === 0) return 'Unassigned';
    const names = staffIds.map(id => {
      const staff = staffList.find(s => s.uid === id);
      return staff ? staff.name : 'Unknown';
    });
    return names.join(', ');
  };

  const getTeamName = (teamId) => {
    if (!teamId) return null;
    const team = teamsList.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  const renderStars = (rating) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} style={styles.starIcon}>
            {star <= rating ? '⭐' : '☆'}
          </Text>
        ))}
      </View>
    );
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return '#28A745';
    if (rating >= 3) return '#FFC107';
    return '#FF3B30';
  };

  const getRatingLabel = (rating) => {
    if (rating === 5) return 'Excellent';
    if (rating === 4) return 'Very Good';
    if (rating === 3) return 'Good';
    if (rating === 2) return 'Fair';
    return 'Poor';
  };

  const filteredFeedbacks = feedbacks.filter(fb => {
    if (filter === 'all') return true;
    if (filter === 'positive') return fb.rating >= 4;
    if (filter === 'negative') return fb.rating <= 2;
    return true;
  });

  const renderFeedbackCard = ({ item }) => (
    <TouchableOpacity
      style={styles.feedbackCard}
      onPress={() => {
        setSelectedFeedback(item);
        setShowDetailModal(true);
      }}
    >
      <View style={styles.feedbackHeader}>
        <View style={styles.feedbackTitleRow}>
          <Text style={styles.feedbackCategory}>{item.reportCategory}</Text>
          <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(item.rating) }]}>
            <Text style={styles.ratingBadgeText}>{item.rating} ⭐</Text>
          </View>
        </View>
        <Text style={styles.feedbackDate}>
          {item.submittedAt?.toLocaleDateString()} at {item.submittedAt?.toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.feedbackMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Resolution:</Text>
          <View style={[
            styles.resolutionBadge,
            { backgroundColor: item.isResolved ? '#28A745' : '#FF3B30' }
          ]}>
            <Text style={styles.resolutionText}>
              {item.isResolved ? '✓ Fixed' : '✗ Not Fixed'}
            </Text>
          </View>
        </View>

        {item.assignedStaffIds && item.assignedStaffIds.length > 0 && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Staff:</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {getStaffName(item.assignedStaffIds)}
            </Text>
          </View>
        )}

        {item.assignedTeamId && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Team:</Text>
            <Text style={styles.metaValue}>{getTeamName(item.assignedTeamId)}</Text>
          </View>
        )}
      </View>

      {item.comment && (
        <Text style={styles.feedbackComment} numberOfLines={2}>
          "{item.comment}"
        </Text>
      )}

      {item.wouldRecommend !== undefined && (
        <View style={styles.recommendRow}>
          <Text style={styles.recommendLabel}>Would Recommend:</Text>
          <Text style={[
            styles.recommendValue,
            { color: item.wouldRecommend ? '#28A745' : '#FF9500' }
          ]}>
            {item.wouldRecommend ? '👍 Yes' : '👎 No'}
          </Text>
        </View>
      )}

      <View style={styles.locationRow}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText} numberOfLines={1}>
          {item.reportLocation || 'Unknown location'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => {
    if (!selectedFeedback) return null;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Feedback Details</Text>
                <TouchableOpacity
                  onPress={() => setShowDetailModal(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Rating */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Rating</Text>
                {renderStars(selectedFeedback.rating)}
                <Text style={[
                  styles.ratingLabelText,
                  { color: getRatingColor(selectedFeedback.rating) }
                ]}>
                  {getRatingLabel(selectedFeedback.rating)}
                </Text>
              </View>

              {/* Report Info */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Report Category</Text>
                <Text style={styles.detailValue}>{selectedFeedback.reportCategory}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{selectedFeedback.reportLocation}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Original Description</Text>
                <Text style={styles.detailValue}>{selectedFeedback.reportDescription}</Text>
              </View>

              {/* Resolution Status */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Problem Fixed?</Text>
                <View style={[
                  styles.resolutionBadgeLarge,
                  { backgroundColor: selectedFeedback.isResolved ? '#28A745' : '#FF3B30' }
                ]}>
                  <Text style={styles.resolutionTextLarge}>
                    {selectedFeedback.isResolved ? '✓ Yes, Fixed' : '✗ No, Not Fixed'}
                  </Text>
                </View>
              </View>

              {/* Comment */}
              {selectedFeedback.comment && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>User Comment</Text>
                  <View style={styles.commentBox}>
                    <Text style={styles.commentText}>{selectedFeedback.comment}</Text>
                  </View>
                </View>
              )}

              {/* Additional Images */}
              {selectedFeedback.additionalImages && selectedFeedback.additionalImages.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>
                    Additional Photos ({selectedFeedback.additionalImages.length})
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.imagesRow}>
                      {selectedFeedback.additionalImages.map((imgUrl, index) => (
                        <Image
                          key={index}
                          source={{ uri: getCorrectedImageUrl(imgUrl) }}
                          style={styles.feedbackImage}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Recommendation */}
              {selectedFeedback.wouldRecommend !== undefined && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Would Recommend Service?</Text>
                  <Text style={[
                    styles.recommendValueLarge,
                    { color: selectedFeedback.wouldRecommend ? '#28A745' : '#FF9500' }
                  ]}>
                    {selectedFeedback.wouldRecommend ? '👍 Yes' : '👎 No'}
                  </Text>
                </View>
              )}

              {/* Staff/Team Info */}
              {selectedFeedback.assignedStaffIds && selectedFeedback.assignedStaffIds.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Assigned Staff</Text>
                  <Text style={styles.detailValue}>
                    {getStaffName(selectedFeedback.assignedStaffIds)}
                  </Text>
                </View>
              )}

              {selectedFeedback.assignedTeamId && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Assigned Team</Text>
                  <Text style={styles.detailValue}>
                    {getTeamName(selectedFeedback.assignedTeamId)}
                  </Text>
                </View>
              )}

              {/* Timestamps */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Submitted At</Text>
                <Text style={styles.detailValue}>
                  {selectedFeedback.submittedAt?.toLocaleString()}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <BlueHeader title="Feedback Dashboard" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading feedback...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlueHeader title="Feedback Dashboard" showBackButton />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Statistics Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Organization Performance</Text>
            
            <View style={styles.statsGrid}>
              {/* Average Rating */}
              <View style={[styles.statCard, styles.statCardLarge]}>
                <Text style={styles.statLabel}>Average Rating</Text>
                <View style={styles.ratingDisplay}>
                  <Text style={styles.statValueLarge}>{stats.averageRating}</Text>
                  <Text style={styles.statUnit}>/ 5.0</Text>
                </View>
                {renderStars(Math.round(stats.averageRating))}
                <Text style={styles.statSubtext}>
                  Based on {stats.totalFeedbacks} reviews
                </Text>
              </View>

              {/* Resolution Rate */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Resolution Rate</Text>
                <Text style={[styles.statValue, { color: '#28A745' }]}>
                  {stats.resolutionRate}%
                </Text>
                <Text style={styles.statSubtext}>
                  {stats.resolvedCount} of {stats.totalFeedbacks}
                </Text>
              </View>

              {/* Recommendation Rate */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Would Recommend</Text>
                <Text style={[styles.statValue, { color: '#007AFF' }]}>
                  {stats.recommendationRate}%
                </Text>
                <Text style={styles.statSubtext}>Customer satisfaction</Text>
              </View>

              {/* Total Feedbacks */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Feedbacks</Text>
                <Text style={styles.statValue}>{stats.totalFeedbacks}</Text>
                <Text style={styles.statSubtext}>All time</Text>
              </View>

              {/* Not Resolved */}
              {stats.notResolvedCount > 0 && (
                <View style={[styles.statCard, { backgroundColor: '#FFF3CD' }]}>
                  <Text style={styles.statLabel}>Needs Attention</Text>
                  <Text style={[styles.statValue, { color: '#FF3B30' }]}>
                    {stats.notResolvedCount}
                  </Text>
                  <Text style={styles.statSubtext}>Reports not resolved</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <Text style={styles.sectionTitle}>User Feedback</Text>
          <View style={styles.filterTabs}>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
                All ({feedbacks.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'positive' && styles.activeFilterTab]}
              onPress={() => setFilter('positive')}
            >
              <Text style={[styles.filterText, filter === 'positive' && styles.activeFilterText]}>
                Positive ({feedbacks.filter(f => f.rating >= 4).length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, filter === 'negative' && styles.activeFilterTab]}
              onPress={() => setFilter('negative')}
            >
              <Text style={[styles.filterText, filter === 'negative' && styles.activeFilterText]}>
                Negative ({feedbacks.filter(f => f.rating <= 2).length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feedback List */}
        <View style={styles.feedbackListContainer}>
          {filteredFeedbacks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No feedback yet</Text>
              <Text style={styles.emptySubtext}>
                Feedback will appear here once users rate resolved reports
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredFeedbacks}
              renderItem={renderFeedbackCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.feedbackList}
            />
          )}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      {renderDetailModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardLarge: {
    minWidth: '100%',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  statValueLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statUnit: {
    fontSize: 24,
    color: '#999',
    marginLeft: 4,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  starIcon: {
    fontSize: 20,
    marginRight: 2,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E5E5',
  },
  activeFilterTab: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },
  feedbackListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  feedbackList: {
    gap: 12,
  },
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackHeader: {
    marginBottom: 12,
  },
  feedbackTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedbackCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  feedbackDate: {
    fontSize: 12,
    color: '#999',
  },
  feedbackMeta: {
    marginBottom: 12,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  resolutionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resolutionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  feedbackComment: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 20,
  },
  recommendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  recommendValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#007AFF',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  ratingLabelText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  resolutionBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  resolutionTextLarge: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commentBox: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  commentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  feedbackImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  recommendValueLarge: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FeedbackDashboard;
