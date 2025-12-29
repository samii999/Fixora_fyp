import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { getCorrectedImageUrl } from '../../utils/imageUrlFixer';
import { useAuth } from '../../context/AuthContext';
import BlueHeader from '../../components/layout/Header';
import { sortReportsByUrgency, getUrgencyDisplay, getUrgencyColor } from '../../utils/reportSorting';

const StaffProvedReportsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffProvedReports();
    
    // Refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchStaffProvedReports();
    });

    return unsubscribe;
  }, []);

  const fetchStaffProvedReports = async () => {
    try {
      setLoading(true);
      // Get admin's organization ID using current user
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
        
        // Filter for reports with proofImages
        const reportsWithProof = reportsList.filter(report => 
          report.proofImages && Array.isArray(report.proofImages) && report.proofImages.length > 0
        );
        
        // Sort by urgency (High → Medium → Low), then by date
        const sortedReports = sortReportsByUrgency(reportsWithProof);
        
        setReports(sortedReports);
      }
    } catch (error) {
      console.error('Error fetching staff proved reports:', error);
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
        <View style={styles.badgesContainer}>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency || item.predictionMetadata?.urgency || 'Medium') }]}>
            <Text style={styles.urgencyText}>{getUrgencyDisplay(item.urgency || item.predictionMetadata?.urgency || 'Medium')}</Text>
          </View>
          <Text style={styles.reportStatus}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.reportDescription} numberOfLines={2}>{item.description || 'No description provided'}</Text>
      
      {/* Show proof information */}
      {item.proofImages && item.proofImages.length > 0 && (
        <View style={styles.proofContainer}>
          <Text style={styles.proofLabel}>📷 Staff Proof Available ({item.proofImages.length} image{item.proofImages.length > 1 ? 's' : ''})</Text>
          <Text style={styles.proofDescription} numberOfLines={2}>
            {item.proofImages[item.proofImages.length - 1]?.description || 'No description'}
          </Text>
        </View>
      )}
      
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
  proofContainer: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  proofLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  proofDescription: {
    fontSize: 13,
    color: '#065F46',
    fontStyle: 'italic',
  },
});

export default StaffProvedReportsScreen;
