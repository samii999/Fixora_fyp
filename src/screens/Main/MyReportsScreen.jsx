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
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const MyReportsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, resolved

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      
      // Fetch all reports and filter in JavaScript to avoid index issues
      const reportsQuery = query(collection(db, 'reports'));
      const snapshot = await getDocs(reportsQuery);
      const allReports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter reports by this user
      const userReports = allReports.filter(report => 
        report.userId === user.uid
      );
      
      // Sort by createdAt in JavaScript
      userReports.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      
      setReports(userReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to load your reports');
    } finally {
      setLoading(false);
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

      {item.assignedTo && (
        <View style={styles.assignedInfo}>
          <Text style={styles.assignedLabel}>Assigned to:</Text>
          <Text style={styles.assignedName}>{item.assignedTo}</Text>
        </View>
      )}

             <View style={styles.actionButtons}>
         {item.status !== 'resolved' && (
           <TouchableOpacity 
             style={[styles.actionButton, { backgroundColor: '#FF9500' }]}
             onPress={() => handleWithdrawReport(item.id)}
           >
             <Text style={styles.actionButtonText}>Withdraw</Text>
           </TouchableOpacity>
         )}
         {item.status === 'resolved' && (
           <TouchableOpacity 
             style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
             onPress={() => handleDeleteReport(item.id)}
           >
             <Text style={styles.actionButtonText}>Delete</Text>
           </TouchableOpacity>
         )}
       </View>
    </TouchableOpacity>
  );

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
      <View style={styles.header}>
        <Text style={styles.title}>My Reports</Text>
        <Text style={styles.subtitle}>Track your submitted issues</Text>
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
                ? 'You haven\'t submitted any reports yet'
                : `No ${filter} reports found`
              }
            </Text>
          </View>
        }
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
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
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
});

export default MyReportsScreen; 