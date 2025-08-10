import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { getCorrectedImageUrl } from '../../utils/imageUrlFixer';
import BlueHeader from '../../components/layout/Header';

const StaffProvedReportsScreen = () => {
  const navigation = useNavigation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffProvedReports();
  }, []);

  const fetchStaffProvedReports = async () => {
    try {
      setLoading(true);
      // Get admin's organization ID
      const userDoc = await getDoc(doc(db, 'users', 'admin'));
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
        // Filter for staff-proved reports
        const staffProved = reportsList.filter(r => r.status === 'staff_proved' && r.status !== 'resolved');
        setReports(staffProved);
      }
    } catch (error) {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const renderReportItem = ({ item }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigation.navigate('IssueDetail', { issueId: item.id })}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{item.category || 'Issue Report'}</Text>
        <Text style={styles.reportStatus}>{item.status}</Text>
      </View>
      <Text style={styles.reportDescription} numberOfLines={2}>{item.description || 'No description provided'}</Text>
      {(item.imageUrls || item.imageUrl) && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getCorrectedImageUrl(item.imageUrls ? item.imageUrls[0] : item.imageUrl) }}
            style={styles.reportImage}
            resizeMode="cover"
          />
        </View>
      )}
      <Text style={styles.reportDate}>{item.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <BlueHeader title="Staff-Proved Reports" subtitle="Reports with staff proof, awaiting review" />
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#666', marginTop: 40 }}>No staff-proved reports found.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  reportStatus: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  imageContainer: {
    marginVertical: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  reportImage: {
    width: '100%',
    height: 80,
    borderRadius: 6,
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
});

export default StaffProvedReportsScreen;
