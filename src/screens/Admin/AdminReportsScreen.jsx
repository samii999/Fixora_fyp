import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, getDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

const AdminReportsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, resolved
  const [availableStaff, setAvailableStaff] = useState([]);
  const [showStaffAssignment, setShowStaffAssignment] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
    fetchAvailableStaff();
  }, []);

  const fetchAvailableStaff = async () => {
    try {
      // Get admin's organization ID
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const organizationId = userDoc.data()?.organizationId;

      if (organizationId) {
        // Get organization document to find staff members
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          const staffIds = orgData.staffIds || [];
          
          // Fetch staff details
          const staffPromises = staffIds.map(async (staffId) => {
            const staffDoc = await getDoc(doc(db, 'users', staffId));
            if (staffDoc.exists()) {
              const staffData = staffDoc.data();
              return {
                uid: staffId,
                name: staffData.name || staffData.email,
                email: staffData.email,
                status: staffData.status
              };
            }
            return null;
          });
          
          const staffList = (await Promise.all(staffPromises)).filter(staff => staff !== null);
          setAvailableStaff(staffList);
        }
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Get admin's organization ID
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const organizationId = userDoc.data()?.organizationId;

      if (organizationId) {
        const reportsQuery = query(
          collection(db, 'reports'),
          where('organizationId', '==', organizationId)
        );
        const snapshot = await getDocs(reportsQuery);
        const reportsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReports(reportsList);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

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

  const handleStaffAssignment = async (reportId, staffId, staffName) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        organizationAssigned: staffId,
        assignedTo: staffName,
        assignedAt: new Date(),
        assignedBy: user.uid,
        status: 'assigned'
      });
      
      // Update local state
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId 
            ? { 
                ...report, 
                organizationAssigned: staffId,
                assignedTo: staffName,
                status: 'assigned'
              }
            : report
        )
      );
      
      setShowStaffAssignment(false);
      setSelectedReport(null);
      Alert.alert('Success', `Report assigned to ${staffName}`);
    } catch (error) {
      console.error('Error assigning report:', error);
      Alert.alert('Error', 'Failed to assign report');
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
          {item.title || 'Issue Report'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.reportDescription} numberOfLines={2}>
        {item.description || 'No description provided'}
      </Text>
      
      <View style={styles.reportMeta}>
        <Text style={styles.reportDate}>
          {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
        </Text>
        <Text style={styles.reportCategory}>
          {item.category || 'General'}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        {item.status === 'pending' && (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
              onPress={() => {
                setSelectedReport(item);
                setShowStaffAssignment(true);
              }}
            >
              <Text style={styles.actionButtonText}>Assign Staff</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
              onPress={() => handleStatusUpdate(item.id, 'in_progress')}
            >
              <Text style={styles.actionButtonText}>Start Work</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#28A745' }]}
              onPress={() => handleStatusUpdate(item.id, 'resolved')}
            >
              <Text style={styles.actionButtonText}>Resolve</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status === 'assigned' && (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
              onPress={() => handleStatusUpdate(item.id, 'in_progress')}
            >
              <Text style={styles.actionButtonText}>Start Work</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status === 'in_progress' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#28A745' }]}
            onPress={() => handleStatusUpdate(item.id, 'resolved')}
          >
            <Text style={styles.actionButtonText}>Mark Resolved</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
          onPress={() => handleDeleteReport(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Issue Reports</Text>
        <Text style={styles.subtitle}>Manage organization reports</Text>
      </View>

             {/* Filter Tabs */}
       <View style={styles.filterContainer}>
         <TouchableOpacity 
           style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
           onPress={() => setFilter('all')}
         >
           <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
             All ({reports.length})
           </Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={[styles.filterTab, filter === 'pending' && styles.activeFilterTab]}
           onPress={() => setFilter('pending')}
         >
           <Text style={[styles.filterText, filter === 'pending' && styles.activeFilterText]}>
             Pending ({reports.filter(r => r.status === 'pending').length})
           </Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={[styles.filterTab, filter === 'resolved' && styles.activeFilterTab]}
           onPress={() => setFilter('resolved')}
         >
           <Text style={[styles.filterText, filter === 'resolved' && styles.activeFilterText]}>
             Resolved ({reports.filter(r => r.status === 'resolved').length})
           </Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={[styles.filterTab, filter === 'withdrawn' && styles.activeFilterTab]}
           onPress={() => setFilter('withdrawn')}
         >
           <Text style={[styles.filterText, filter === 'withdrawn' && styles.activeFilterText]}>
             Withdrawn ({reports.filter(r => r.status === 'withdrawn').length})
           </Text>
         </TouchableOpacity>
       </View>

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
                ? 'No reports have been submitted yet'
                : `No ${filter} reports found`
              }
            </Text>
          </View>
        }
      />

      {/* Staff Assignment Modal */}
      {showStaffAssignment && selectedReport && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Report to Staff</Text>
            <Text style={styles.modalSubtitle}>
              Select a staff member to assign this report:
            </Text>
            
            <FlatList
              data={availableStaff}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.staffItem}
                  onPress={() => handleStaffAssignment(selectedReport.id, item.uid, item.name)}
                >
                  <Text style={styles.staffName}>{item.name}</Text>
                  <Text style={styles.staffEmail}>{item.email}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.noStaffText}>No staff members available</Text>
              }
            />
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowStaffAssignment(false);
                setSelectedReport(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default AdminReportsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  reportCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: 12,
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
  reportCategory: {
    fontSize: 12,
    color: '#999',
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
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  staffItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  staffEmail: {
    fontSize: 14,
    color: '#666',
  },
  noStaffText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
}); 