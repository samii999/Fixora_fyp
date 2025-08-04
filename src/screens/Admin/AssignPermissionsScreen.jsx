import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { db, auth } from '../../config/firebaseConfig';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const AssignPermissionsScreen = () => {
  const [staffRequests, setStaffRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStaffRequests();
  }, []);

  const fetchStaffRequests = async () => {
    try {
      setLoading(true);
      // Get admin's organization ID
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const adminOrgId = userDoc.data()?.organizationId;
      
      if (!adminOrgId) {
        Alert.alert('Error', 'No organization found. Please create an organization first.');
        return;
      }

      // Fetch staff requests for this organization
      const q = query(
        collection(db, 'staff_requests'),
        where('organizationId', '==', adminOrgId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaffRequests(requests);
    } catch (error) {
      console.error('Error fetching staff requests:', error);
      Alert.alert('Error', 'Failed to load staff requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, staffUid) => {
    try {
      // Get admin's organization ID
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const adminOrgId = userDoc.data()?.organizationId;

      // Update staff request status
      await setDoc(doc(db, 'staff_requests', requestId), {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: user.uid
      }, { merge: true });

      // Update user role and organization
      await setDoc(doc(db, 'users', staffUid), {
        role: 'staff',
        organizationId: adminOrgId,
        status: 'active',
        permissions: {
          viewIssues: true,
          updateIssues: false,
          deleteIssues: false,
          manageStaff: false
        }
      }, { merge: true });

      // Update organization document - add to staffIds array
      const orgRef = doc(db, 'organizations', adminOrgId);
      const orgDoc = await getDoc(orgRef);
      if (orgDoc.exists()) {
        const orgData = orgDoc.data();
        const updatedStaffIds = [...(orgData.staffIds || []), staffUid];
        await updateDoc(orgRef, { staffIds: updatedStaffIds });
      }

      Alert.alert('Success', 'Staff member approved successfully!');
      fetchStaffRequests(); // Refresh the list
    } catch (error) {
      console.error('Approve staff error:', error);
      Alert.alert('Error', 'Failed to approve staff member.');
    }
  };

  const handleReject = async (requestId) => {
    Alert.alert('Confirm Rejection', 'Reject this staff request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await setDoc(doc(db, 'staff_requests', requestId), {
              status: 'rejected',
              rejectedAt: new Date(),
              rejectedBy: user.uid
            }, { merge: true });
            
            Alert.alert('Success', 'Staff request rejected.');
            fetchStaffRequests(); // Refresh the list
          } catch (error) {
            console.error('Reject staff error:', error);
            Alert.alert('Error', 'Failed to reject request.');
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading staff requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff Requests</Text>
        <Text style={styles.subtitle}>{staffRequests.length} pending request(s)</Text>
      </View>
      
      {staffRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pending requests</Text>
          <Text style={styles.emptySubtext}>Staff join requests will appear here</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {staffRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestEmail}>{request.email}</Text>
                <Text style={styles.requestDate}>
                  {new Date(request.createdAt?.seconds * 1000).toLocaleDateString()}
                </Text>
                {request.position && (
                  <Text style={styles.requestPosition}>Position: {request.position}</Text>
                )}
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.approveButton}
                  onPress={() => handleApprove(request.id, request.uid)}
                >
                  <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.rejectButton}
                  onPress={() => handleReject(request.id)}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
};

export default AssignPermissionsScreen;

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
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  requestCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    marginBottom: 16,
  },
  requestEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  requestPosition: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#28A745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
