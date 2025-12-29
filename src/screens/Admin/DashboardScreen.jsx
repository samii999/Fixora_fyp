import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import BlueHeader from '../../components/layout/Header';
import { getOrganizationFeedbackStats } from '../../services/feedbackService';

const AdminDashboardScreen = () => {
  const navigation = useNavigation();
  const { user, userRole } = useAuth();
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    totalStaff: 0,
    pendingRequests: 0,
    averageRating: 0,
    totalFeedbacks: 0
  });
  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationLogo, setOrganizationLogo] = useState(null);

  // Refresh stats whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardStats();
    }, [])
  );

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Get admin's organization ID
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const organizationId = userDoc.data()?.organizationId;

      if (organizationId) {
        // Fetch organization name and logo
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (orgDoc.exists()) {
          setOrganizationName(orgDoc.data()?.name || '');
          setOrganizationLogo(orgDoc.data()?.logo || null);
        }
        
        // Fetch reports for this organization
        const reportsQuery = query(
          collection(db, 'reports'),
          where('organizationId', '==', organizationId)
        );
        const reportsSnapshot = await getDocs(reportsQuery);
        const totalReports = reportsSnapshot.size;
        
        // Count pending reports
        const pendingReports = reportsSnapshot.docs.filter(
          doc => doc.data().status === 'pending'
        ).length;

        // Fetch staff members (only active ones)
        const staffQuery = query(
          collection(db, 'users'),
          where('organizationId', '==', organizationId),
          where('role', '==', 'staff')
        );
        const staffSnapshot = await getDocs(staffQuery);
        // Filter out removed staff
        const totalStaff = staffSnapshot.docs.filter(
          doc => doc.data().status !== 'removed'
        ).length;

        // Fetch pending staff requests
        const requestsQuery = query(
          collection(db, 'staff_requests'),
          where('organizationId', '==', organizationId),
          where('status', '==', 'pending')
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        const pendingRequests = requestsSnapshot.size;

        // Fetch feedback stats
        const feedbackStats = await getOrganizationFeedbackStats(organizationId);

        setStats({
          totalReports,
          pendingReports,
          totalStaff,
          pendingRequests,
          averageRating: feedbackStats.averageRating || 0,
          totalFeedbacks: feedbackStats.totalFeedbacks || 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardItems = [
    {
      title: 'Create Organization',
      subtitle: 'Set up your organization',
      icon: '🏢',
      onPress: () => navigation.navigate('CreateOrganization'),
      color: '#007AFF'
    },
    {
      title: 'Manage Staff',
      subtitle: `View and manage ${stats.totalStaff} staff members`,
      icon: '👥',
      onPress: () => navigation.navigate('ManageStaff'),
      color: '#28A745'
    },
    {
      title: 'Staff Requests',
      subtitle: `${stats.pendingRequests} pending requests to review`,
      icon: '📋',
      onPress: () => navigation.navigate('AssignPermissions'),
      color: '#FF9500'
    },
    {
      title: 'Issue Reports',
      subtitle: `${stats.pendingReports} pending out of ${stats.totalReports} total`,
      icon: '📊',
      onPress: () => navigation.navigate('AdminReports'),
      color: '#5856D6'
    },
    {
      title: 'Feedback & Ratings',
      subtitle: `${stats.averageRating}/5.0 rating from ${stats.totalFeedbacks} reviews`,
      icon: '⭐',
      onPress: () => navigation.navigate('FeedbackDashboard'),
      color: '#FF9500'
    },
  ];

  const quickActions = [
    {
      title: 'Approve Requests',
      icon: '✅',
      onPress: () => navigation.navigate('AssignPermissions'),
      color: '#28A745'
    },
    {
      title: 'View Reports',
      icon: '📋',
      onPress: () => navigation.navigate('AdminReports'),
      color: '#007AFF'
    },
    {
      title: 'Add Staff',
      icon: '➕',
      onPress: () => navigation.navigate('ManageStaff'),
      color: '#FF9500'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <BlueHeader title="Admin Dashboard" subtitle="Manage your organization" />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeText}>
                Welcome back, {user?.email || 'Admin'}!
              </Text>
              <Text style={styles.roleText}>Role: {userRole}</Text>
              {organizationName && (
                <Text style={styles.orgText}>Organization: {organizationName}</Text>
              )}
            </View>
            {organizationLogo && (
              <Image
                source={{ uri: organizationLogo }}
                style={styles.orgLogo}
                resizeMode="contain"
              />
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Quick Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalReports}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.pendingReports}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalStaff}</Text>
              <Text style={styles.statLabel}>Staff Members</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.pendingRequests}</Text>
              <Text style={styles.statLabel}>Requests</Text>
            </View>
            {stats.totalFeedbacks > 0 && (
              <View style={[styles.statCard, { backgroundColor: '#FFF9E6' }]}>
                <Text style={[styles.statNumber, { color: '#FF9500' }]}>
                  {stats.averageRating} ⭐
                </Text>
                <Text style={styles.statLabel}>Avg Rating</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickActionItem, { backgroundColor: action.color }]}
                onPress={action.onPress}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Main Dashboard Items */}
        <View style={styles.dashboardGrid}>
          <Text style={styles.sectionTitle}>Admin Tools</Text>
          {dashboardItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dashboardItem, { borderLeftColor: item.color }]}
              onPress={item.onPress}
            >
              <Text style={styles.itemIcon}>{item.icon}</Text>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.infoCard, { marginBottom: 32 }]}>
          <Text style={styles.infoTitle}>Admin Quick Tips:</Text>
          <Text style={styles.infoText}>
            • Create an organization first to get started{'\n'}
            • Approve staff requests to build your team{'\n'}
            • Monitor and manage issue reports{'\n'}
            • Manage permissions for staff members
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboardScreen;

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
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  welcomeCard: {
    backgroundColor: '#fff',
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
    color: '#333',
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    color: '#666',
  },
  orgText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 4,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orgLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  dashboardGrid: {
    marginBottom: 20,
  },
  dashboardItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  statCard: {
    width: '45%', // Adjust as needed for two columns
    backgroundColor: '#E0E0E0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  quickActionsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  quickActionItem: {
    width: '45%', // Adjust as needed for two columns
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  quickActionIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  dashboardGrid: {
    marginBottom: 20,
  },
  dashboardItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
