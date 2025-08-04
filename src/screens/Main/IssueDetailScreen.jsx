import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { db } from '../../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const IssueDetailScreen = () => {
  const route = useRoute();
  const { issueId } = route.params;
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssueDetails();
  }, [issueId]);

  const fetchIssueDetails = async () => {
    try {
      setLoading(true);
      const issueDoc = await getDoc(doc(db, 'reports', issueId));
      
      if (issueDoc.exists()) {
        const issueData = issueDoc.data();
        console.log('Fetched issue data:', issueData);
        setIssue({
          id: issueDoc.id,
          ...issueData
        });
      } else {
        Alert.alert('Error', 'Report not found');
      }
    } catch (error) {
      console.error('Error fetching issue details:', error);
      Alert.alert('Error', 'Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading report details...</Text>
      </View>
    );
  }

  if (!issue) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Report not found</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {issue.category || 'Issue Report'}
      </Text>

      {issue.imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: issue.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={(error) => {
              console.log('Image loading error:', error);
              console.log('Image URL:', issue.imageUrl);
            }}
            onLoad={() => console.log('Image loaded successfully:', issue.imageUrl)}
          />
          <Text style={styles.imageLabel}>📷 Issue Image</Text>
          <Text style={styles.imageUrlText}>{issue.imageUrl}</Text>
        </View>
      )}

      <Text style={styles.label}>Description:</Text>
      <Text style={styles.text}>{issue.description}</Text>

      <Text style={styles.label}>Category:</Text>
      <Text style={styles.text}>{issue.category || 'General'}</Text>

      <Text style={styles.label}>Status:</Text>
      <Text style={[styles.text, { color: getStatusColor(issue.status) }]}>
        {getStatusText(issue.status)}
      </Text>

      <Text style={styles.label}>Location:</Text>
      <Text style={styles.text}>{issue.address || 'Not available'}</Text>

      {issue.assignedTo && (
        <>
          <Text style={styles.label}>Assigned To:</Text>
          <Text style={styles.text}>{issue.assignedTo}</Text>
        </>
      )}

      <Text style={styles.label}>Reported At:</Text>
      <Text style={styles.text}>
        {issue.createdAt?.toDate?.()?.toLocaleString() || 'Unknown date'}
      </Text>
    </ScrollView>
  );
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

export default IssueDetailScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  imageContainer: {
    marginBottom: 15,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 10,
  },
  imageLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  imageUrlText: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  label: {
    fontWeight: '600',
    marginTop: 10,
    fontSize: 16,
  },
  text: {
    marginBottom: 10,
    fontSize: 16,
  },
});
