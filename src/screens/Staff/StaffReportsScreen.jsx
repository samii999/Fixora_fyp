import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ActivityIndicator,
  Alert,
  Image,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getCorrectedImageUrl } from '../../utils/imageUrlFixer';
import MapView, { Marker, Callout } from 'react-native-maps';
import BlueHeader from '../../components/layout/Header';
import { sortReportsByUrgency, getUrgencyDisplay, getUrgencyColor } from '../../utils/reportSorting';

const StaffReportsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, assigned, in_progress, resolved

  useEffect(() => {
    let unsubscribe = null;
    
    const setupListener = () => {
      try {
        setLoading(true);
        
        // Set up real-time listener for all reports
        const reportsQuery = query(collection(db, 'reports'));
        
        unsubscribe = onSnapshot(
          reportsQuery,
          (snapshot) => {
            const allReports = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            // Filter reports assigned to this staff member
            const assignedReports = allReports.filter(report => {
              // Support both new multi-staff assignment and old single assignment
              if (report.assignedStaffIds && Array.isArray(report.assignedStaffIds)) {
                return report.assignedStaffIds.includes(user.uid);
              }
              // Fallback to old single assignment for backwards compatibility
              return report.organizationAssigned === user.uid;
            });
            
            // Sort by urgency (High → Medium → Low), then by date
            const sortedReports = sortReportsByUrgency(assignedReports);
            
            setReports(sortedReports);
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching assigned reports:', error);
            Alert.alert('Error', 'Failed to load assigned reports');
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

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: user.uid
      });
      
      // Update local state
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId 
            ? { ...report, status: newStatus }
            : report
        )
      );
      
      Alert.alert('Success', `Report marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating report status:', error);
      Alert.alert('Error', 'Failed to update report status');
    }
  };

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

  // Staff cannot delete reports - only admins can delete
  // This function is removed for staff

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  const renderReportItem = ({ item }) => (
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
        </View>
      </View>
      
      <Text style={styles.reportDescription} numberOfLines={2}>
        {item.description || 'No description provided'}
      </Text>
      
      {/* Display assigned staff members if multiple */}
      {item.assignedStaff && item.assignedStaff.length > 1 && (
        <View style={styles.teamContainer}>
          <Text style={styles.teamLabel}>Team Members:</Text>
          <View style={styles.teamList}>
            {item.assignedStaff.map((staff, index) => (
              <View key={staff.uid} style={styles.teamChip}>
                <Text style={styles.teamChipText}>{staff.name}</Text>
              </View>
            ))}
          </View>
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

      <Text style={styles.reportAddress}>
        📍 {item.address || 'Location not specified'}
      </Text>

      <View style={styles.actionButtons}>
        {item.status === 'assigned' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
            onPress={() => handleStatusUpdate(item.id, 'in_progress')}
          >
            <Text style={styles.actionButtonText}>Start Work</Text>
          </TouchableOpacity>
        )}
        {item.status === 'in_progress' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#28A745' }]}
            onPress={() => navigation.navigate('IssueDetail', { issueId: item.id })}
          >
            <Text style={styles.actionButtonText}>Upload Proof</Text>
          </TouchableOpacity>
        )}
        {/* Show proof status if uploaded */}
        {item.proofImages && item.proofImages.length > 0 && (
          <View style={styles.proofBadge}>
            <Text style={styles.proofBadgeText}>✓ Proof Uploaded</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading assigned reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlueHeader title="Assigned Reports" subtitle="Manage your assigned issues" />

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
          style={[styles.filterTab, filter === 'assigned' && styles.activeFilterTab]}
          onPress={() => setFilter('assigned')}
        >
          <Text style={[styles.filterText, filter === 'assigned' && styles.activeFilterText]} numberOfLines={1}>
            Assigned ({reports.filter(r => r.status === 'assigned').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'in_progress' && styles.activeFilterTab]}
          onPress={() => setFilter('in_progress')}
        >
          <Text style={[styles.filterText, filter === 'in_progress' && styles.activeFilterText]} numberOfLines={1}>
            In Progress ({reports.filter(r => r.status === 'in_progress').length})
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

      <View style={{ flex: 1 }}>
        <FlatList
          data={filteredReports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No reports assigned</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'all' 
                  ? 'You don\'t have any assigned reports yet'
                  : `No ${filter} reports found`
                }
              </Text>
            </View>
          }
        />
      </View>
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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
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
    marginBottom: 8,
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
  reportAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
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
  teamContainer: {
    marginVertical: 8,
    padding: 8,
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  teamList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  teamChip: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  teamChipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  proofBadge: {
    flex: 1,
    backgroundColor: '#28A745',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  proofBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StaffReportsScreen;