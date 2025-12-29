import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Alert,
  Image,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getCorrectedImageUrl } from '../../utils/imageUrlFixer';
import { sortReportsByUrgency, getUrgencyDisplay, getUrgencyColor } from '../../utils/reportSorting';
import { getPendingFeedbackRequests, createFeedbackRequest } from '../../services/feedbackService';
import FeedbackModal from '../../components/feedback/FeedbackModal';
import BlueHeader from '../../components/layout/Header';

const MyReportsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, resolved
  const [pendingFeedback, setPendingFeedback] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedbackRequest, setSelectedFeedbackRequest] = useState(null);

  // Function to refresh pending feedback requests
  const refreshPendingFeedback = async () => {
    try {
      const feedbackRequests = await getPendingFeedbackRequests(user.uid);
      setPendingFeedback(feedbackRequests);
    } catch (error) {
      console.error('Error refreshing feedback requests:', error);
    }
  };

  useEffect(() => {
    let unsubscribe = null;
    
    const setupListener = () => {
      try {
        setLoading(true);
        
        // Set up real-time listener for all reports
        const reportsQuery = query(collection(db, 'reports'));
        
        unsubscribe = onSnapshot(
          reportsQuery,
          async (snapshot) => {
            const allReports = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Filter reports by this user
            const userReports = allReports.filter(report => 
              report.userId === user.uid
            );
            
            // Sort by urgency (High → Medium → Low), then by date
            const sortedReports = sortReportsByUrgency(userReports);
            
            setReports(sortedReports);
            
            // Fetch pending feedback requests
            try {
              const feedbackRequests = await getPendingFeedbackRequests(user.uid);
              setPendingFeedback(feedbackRequests);
              
              // Auto-create feedback requests for resolved reports without them
              const resolvedReports = userReports.filter(r => r.status === 'resolved');
              for (const report of resolvedReports) {
                const hasFeedback = feedbackRequests.some(fb => fb.reportId === report.id);
                
                // If resolved report has no feedback request, create one
                if (!hasFeedback && !report.feedbackReceived) {
                  console.log(`📝 Auto-creating feedback request for report ${report.id}`);
                  const result = await createFeedbackRequest(report.id, user.uid, report);
                  if (result.success) {
                    console.log(`✅ Feedback request created for ${report.id}`);
                    // Refresh feedback requests
                    const updatedFeedback = await getPendingFeedbackRequests(user.uid);
                    setPendingFeedback(updatedFeedback);
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching feedback requests:', error);
            }
            
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching reports:', error);
            Alert.alert('Error', 'Failed to load your reports');
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error setting up reports listener:', error);
        setLoading(false);
      }
    };
    
    setupListener();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user.uid]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'assigned':
        return '#9C27B0';
      case 'in_progress':
        return '#007AFF';
      case 'resolved':
        return '#28A745';
      case 'rejected':
        return '#FF3B30';
      case 'withdrawn':
        return '#8E8E93';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'assigned':
        return 'Assigned';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'rejected':
        return 'Rejected';
      case 'withdrawn':
        return 'Withdrawn';
      default:
        return status;
    }
  };

  const handleWithdrawReport = async (reportId) => {
    Alert.alert(
      'Withdraw Report',
      'Are you sure you want to withdraw this report? This will mark it as withdrawn and notify the admin.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update report status to withdrawn instead of deleting
              await updateDoc(doc(db, 'reports', reportId), {
                status: 'withdrawn',
                withdrawnAt: new Date(),
                withdrawnBy: user.uid
              });
              
              // Update local state
              setReports(prevReports => 
                prevReports.map(report => 
                  report.id === reportId 
                    ? { ...report, status: 'withdrawn' }
                    : report
                )
              );
              Alert.alert('Success', 'Report withdrawn successfully');
            } catch (error) {
              console.error('Error withdrawing report:', error);
              Alert.alert('Error', 'Failed to withdraw report');
            }
          },
        },
      ]
    );
  };

  const handleDeleteReport = async (reportId) => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'reports', reportId));
              // Remove from local state
              setReports(prevReports => 
                prevReports.filter(report => report.id !== reportId)
              );
              Alert.alert('Success', 'Report deleted successfully');
            } catch (error) {
              console.error('Error deleting report:', error);
              Alert.alert('Error', 'Failed to delete report');
            }
          },
        },
      ]
    );
  };

  const handleResubmitReport = async (reportId) => {
    Alert.alert(
      'Resubmit Report',
      'Are you sure you want to resubmit this report? It will be sent back for review.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Resubmit',
          style: 'default',
          onPress: async () => {
            try {
              // Update report status to pending and reset withdrawn fields
              await updateDoc(doc(db, 'reports', reportId), {
                status: 'pending',
                withdrawnAt: null,
                withdrawnBy: null,
                resubmittedAt: new Date()
              });
              
              // Update local state
              setReports(prevReports => 
                prevReports.map(report => 
                  report.id === reportId 
                    ? { ...report, status: 'pending', withdrawnAt: null, withdrawnBy: null }
                    : report
                )
              );
              Alert.alert('Success', 'Report resubmitted successfully');
            } catch (error) {
              console.error('Error resubmitting report:', error);
              Alert.alert('Error', 'Failed to resubmit report');
            }
          },
        },
      ]
    );
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  // Helper function to find feedback request for a report
  const getFeedbackRequestForReport = (reportId) => {
    return pendingFeedback.find(fb => fb.reportId === reportId);
  };

  const renderReportItem = ({ item }) => {
    const feedbackRequest = getFeedbackRequestForReport(item.id);
    const hasPendingFeedback = item.status === 'resolved' && feedbackRequest;
    
    return (
    <TouchableOpacity 
      style={styles.reportCard}
      onPress={() => navigation.navigate('IssueDetail', { issueId: item.id })}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>
          {item.category || 'Issue Report'}
        </Text>
        <View style={styles.badgesContainer}>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency || item.predictionMetadata?.urgency || 'Medium') }]}>
            <Text style={styles.urgencyText}>{getUrgencyDisplay(item.urgency || item.predictionMetadata?.urgency || 'Medium')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          {/* Feedback status badge */}
          {hasPendingFeedback && (
            <View style={[styles.statusBadge, { backgroundColor: '#FF9500' }]}>
              <Text style={styles.statusText}>⏰ Feedback Due</Text>
            </View>
          )}
          {item.status === 'resolved' && item.feedbackReceived && (
            <View style={[styles.statusBadge, { backgroundColor: '#34C759' }]}>
              <Text style={styles.statusText}>✓ Rated</Text>
            </View>
          )}
        </View>
      </View>
      
      <Text style={styles.reportDescription} numberOfLines={2}>
        {item.description || 'No description provided'}
      </Text>
      
      {/* Show if multiple people reported this */}
      {item.reporterCount && item.reporterCount > 1 && (
        <View style={styles.multipleReportersNote}>
          <Text style={styles.multipleReportersText}>
            👥 {item.reporterCount} people (including you) reported this issue
          </Text>
        </View>
      )}
      
      {/* Display first image if available */}
      {(item.imageUrls || item.imageUrl) && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getCorrectedImageUrl(item.imageUrls ? item.imageUrls[0] : item.imageUrl) }}
            style={styles.reportImage}
            resizeMode="cover"
          />
        </View>
      )}
      
      <View style={styles.reportMeta}>
        <Text style={styles.reportDate}>
          {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
        </Text>
        <Text style={styles.reportCategory}>
          {item.category || 'General'}
        </Text>
      </View>

      {item.assignedTo && (
        <View style={styles.assignedInfo}>
          <Text style={styles.assignedLabel}>Assigned to:</Text>
          <Text style={styles.assignedName}>{item.assignedTo}</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        {/* Withdraw button for pending, assigned, in_progress */}
        {['pending', 'assigned', 'in_progress'].includes(item.status) && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#FF9500' }]}
            onPress={() => handleWithdrawReport(item.id)}
          >
            <Text style={styles.actionButtonText}>Withdraw</Text>
          </TouchableOpacity>
        )}
        
        {/* Delete button for pending, assigned, in_progress, rejected, withdrawn */}
        {['pending', 'assigned', 'in_progress', 'rejected', 'withdrawn'].includes(item.status) && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
            onPress={() => handleDeleteReport(item.id)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
        
        {/* Resubmit button for withdrawn reports */}
        {item.status === 'withdrawn' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#28A745' }]}
            onPress={() => handleResubmitReport(item.id)}
          >
            <Text style={styles.actionButtonText}>Resubmit</Text>
          </TouchableOpacity>
        )}
        
        {/* Provide Feedback button for resolved reports */}
        {hasPendingFeedback && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.feedbackButton]}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedFeedbackRequest(feedbackRequest);
              setShowFeedbackModal(true);
            }}
          >
            <Text style={styles.actionButtonText}>📝 Provide Feedback</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlueHeader title="My Reports" subtitle="Track your submitted issues" />

             {/* Filter Tabs */}
       <ScrollView 
         horizontal 
         showsHorizontalScrollIndicator={false}
         style={styles.filterContainer}
         contentContainerStyle={styles.filterContentContainer}
       >
         <TouchableOpacity 
           style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
           onPress={() => setFilter('all')}
         >
           <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]} numberOfLines={1}>
             All ({reports.length})
           </Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={[styles.filterTab, filter === 'pending' && styles.activeFilterTab]}
           onPress={() => setFilter('pending')}
         >
           <Text style={[styles.filterText, filter === 'pending' && styles.activeFilterText]} numberOfLines={1}>
             Pending ({reports.filter(r => r.status === 'pending').length})
           </Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={[styles.filterTab, filter === 'resolved' && styles.activeFilterTab]}
           onPress={() => setFilter('resolved')}
         >
           <Text style={[styles.filterText, filter === 'resolved' && styles.activeFilterText]} numberOfLines={1}>
             Resolved ({reports.filter(r => r.status === 'resolved').length})
           </Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={[styles.filterTab, filter === 'withdrawn' && styles.activeFilterTab]}
           onPress={() => setFilter('withdrawn')}
         >
           <Text style={[styles.filterText, filter === 'withdrawn' && styles.activeFilterText]} numberOfLines={1}>
             Withdrawn ({reports.filter(r => r.status === 'withdrawn').length})
           </Text>
         </TouchableOpacity>
       </ScrollView>

      {/* Feedback Request Banner */}
      {pendingFeedback.length > 0 && (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackBannerTitle}>
            📝 Feedback Needed ({pendingFeedback.length})
          </Text>
          <Text style={styles.feedbackBannerText}>
            We've resolved your report{pendingFeedback.length > 1 ? 's' : ''}. Please let us know how we did!
          </Text>
          <TouchableOpacity
            style={styles.feedbackBannerButton}
            onPress={() => {
              setSelectedFeedbackRequest(pendingFeedback[0]);
              setShowFeedbackModal(true);
            }}
          >
            <Text style={styles.feedbackBannerButtonText}>
              Provide Feedback
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredReports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' 
                ? 'You haven\'t submitted any reports yet'
                : `No ${filter} reports found`
              }
            </Text>
          </View>
        }
      />

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedFeedbackRequest(null);
        }}
        feedbackRequest={selectedFeedbackRequest}
        onSubmitSuccess={() => {
          refreshPendingFeedback(); // Refresh the feedback list
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxHeight: 50,
  },
  filterContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 85,
    backgroundColor: '#F0F0F0',
  },
  activeFilterTab: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 11,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
  reportCategory: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  imageContainer: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  reportImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  assignedInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  assignedLabel: {
    fontSize: 12,
    color: '#666',
  },
  assignedName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackButton: {
    backgroundColor: '#007AFF',
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
  feedbackBanner: {
    backgroundColor: '#FFF3CD',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  feedbackBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  feedbackBannerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  feedbackBannerButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  feedbackBannerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  multipleReportersNote: {
    backgroundColor: '#E8F4FD',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  multipleReportersText: {
    fontSize: 12,
    color: '#0056B3',
    fontWeight: '600',
  },
});

export default MyReportsScreen; 