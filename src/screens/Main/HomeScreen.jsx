import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Image, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getCorrectedImageUrl } from '../../utils/imageUrlFixer';
import BlueHeader from '../../components/layout/Header';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user, userRole } = useAuth();
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecentReports();
  }, []);

  // Refresh reports when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRecentReports();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchRecentReports = async () => {
    try {
      setLoading(true);
      
      // Fetch all reports and filter in JavaScript to avoid index issues
      const reportsQuery = query(collection(db, 'reports'));
      const snapshot = await getDocs(reportsQuery);
      const allReports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter reports by this user and sort by createdAt
      const userReports = allReports
        .filter(report => report.userId === user.uid)
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        })
        .slice(0, 3); // Get only the 3 most recent
      
      setRecentReports(userReports);
    } catch (error) {
      console.error('Error fetching recent reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecentIssuesPress = () => {
    navigation.navigate('MyReports');
  };

  const handleReportPress = (reportId) => {
    navigation.navigate('IssueDetail', { issueId: reportId });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentReports();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <BlueHeader title="Fixora" subtitle="Issue Management System" />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.displayName || user?.name || user?.email?.split('@')[0] || 'User'}!
          </Text>
          <Text style={styles.roleText}>Role: {userRole}</Text>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('ReportIssue')}
          >
            <Text style={styles.actionButtonText}>📝 Report New Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleRecentIssuesPress}
          >
            <Text style={styles.actionButtonText}>📋 View All Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionButtonText}>👤 View Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Reports Section */}
        <View style={styles.recentReports}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading recent reports...</Text>
            </View>
          ) : recentReports.length > 0 ? (
            recentReports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => handleReportPress(report.id)}
              >
                <View style={styles.reportHeader}>
                  <Text style={styles.reportTitle}>
                    {report.category || 'Issue Report'}
                  </Text>
                  <Text style={[styles.reportStatus, { color: getStatusColor(report.status) }]}>
                    {getStatusText(report.status)}
                  </Text>
                </View>
                <Text style={styles.reportDescription} numberOfLines={2}>
                  {report.description || 'No description provided'}
                </Text>
                
                {/* Display first image if available */}
                {(report.imageUrls || report.imageUrl) && (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: getCorrectedImageUrl(report.imageUrls ? report.imageUrls[0] : report.imageUrl) }}
                      style={styles.reportImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
                
                <Text style={styles.reportDate}>
                  {report.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noReportsText}>No recent reports found</Text>
          )}
        </View>
      </ScrollView>
    </View>
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

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerSafeArea: {
    backgroundColor: '#007AFF',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    color: '#666666',
  },
  quickActions: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  recentReports: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  reportCard: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
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
  noReportsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});
