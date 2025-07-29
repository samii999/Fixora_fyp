import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';

const StatusScreen = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const docRef = doc(db, 'staff_requests', user.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        setStatus(snap.data().status);
      } else {
        setStatus('No request found');
      }
    } catch (err) {
      console.error('Error fetching status:', err);
      setStatus('Error loading status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#28A745';
      case 'rejected':
        return '#FF3B30';
      case 'pending':
        return '#FF9500';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending Review';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Request Status</Text>
        <Text style={styles.subtitle}>Your organization join request</Text>
      </View>
      
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Status:</Text>
        <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
          {getStatusText(status)}
        </Text>
        
        {status === 'approved' && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              🎉 Congratulations! Your request has been approved. You can now access staff features.
            </Text>
          </View>
        )}
        
        {status === 'rejected' && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              ❌ Your request was not approved. Please contact the organization administrator for more information.
            </Text>
          </View>
        )}
        
        {status === 'pending' && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              ⏳ Your request is currently under review. You will be notified once a decision is made.
            </Text>
          </View>
        )}
        
        {status === 'No request found' && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              📝 You haven't submitted a request to join an organization yet.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default StatusScreen;

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
  statusCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  messageContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
});
