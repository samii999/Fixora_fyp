import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import BlueHeader from '../../components/layout/Header';

const StaffHomeScreen = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignedReports: 0,
    inProgressReports: 0,
    completedReports: 0,
    totalReports: 0
  });
  const [organizationName, setOrganizationName] = useState('');
  const [organizationLogo, setOrganizationLogo] = useState(null);
  const [teamName, setTeamName] = useState('');
  const navigation = useNavigation();
  const { user, userRole } = useAuth();

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const userDocRef = doc(db, 'users', currentUser.uid);
        const snapshot = await getDoc(userDocRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          setStatus(data.status || 'pending');
          
          // Fetch organization name and logo if exists
          if (data.organizationId) {
            const orgDoc = await getDoc(doc(db, 'organizations', data.organizationId));
            if (orgDoc.exists()) {
              setOrganizationName(orgDoc.data()?.name || '');
              setOrganizationLogo(orgDoc.data()?.logo || null);
            }
          }
          
          // Set team name if exists
          if (data.teamName) {
            setTeamName(data.teamName);
          }
          
          // If user is active, fetch their stats
          if (data.status === 'active') {
            await fetchStaffStats();
          }
        } else {
          setStatus('not_found');
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStatus();
  }, []);

  const fetchStaffStats = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Fetch all reports and filter for this staff member
      const reportsQuery = query(collection(db, 'reports'));
      const snapshot = await getDocs(reportsQuery);
      const allReports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter reports assigned to this staff member
      const assignedReports = allReports.filter(report => {
        // Support both new multi-staff assignment and old single assignment
        if (report.assignedStaffIds && Array.isArray(report.assignedStaffIds)) {
          return report.assignedStaffIds.includes(currentUser.uid);
        }
        // Fallback to old single assignment for backwards compatibility
        return report.organizationAssigned === currentUser.uid;
      });
      
      const assignedCount = assignedReports.length;
      const inProgressCount = assignedReports.filter(r => r.status === 'in_progress').length;
      const completedCount = assignedReports.filter(r => r.status === 'resolved').length;
      
      setStats({
        assignedReports: assignedCount,
        inProgressReports: inProgressCount,
        completedReports: completedCount,
        totalReports: assignedCount
      });
    } catch (error) {
      console.error('Error fetching staff stats:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.statusText}>Loading your status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status !== 'active') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.waiting}>⏳ Waiting for Organization Approval</Text>
          <Text style={styles.statusText}>Please wait until the admin approves your request.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const quickActions = [
    {
      title: 'View Reports',
      icon: '📋',
      onPress: () => navigation.navigate('Reports'),
      color: '#007AFF'
    },
    {
      title: 'Status View',
      icon: '📊',
      onPress: () => navigation.navigate('Status'),
      color: '#28A745'
    },
    {
      title: 'Profile',
      icon: '👤',
      onPress: () => navigation.navigate('StaffProfile'),
      color: '#FF9500'
    },
    {
      title: 'Home',
      icon: '🏠',
      onPress: () => navigation.navigate('Home'),
      color: '#5856D6'
    }
  ];

  const dashboardItems = [
    {
      title: 'Assigned Reports',
      subtitle: `${stats.assignedReports} reports assigned to you`,
      icon: '📋',
      onPress: () => navigation.navigate('Reports'),
      color: '#007AFF'
    },
    {
      title: 'In Progress',
      subtitle: `${stats.inProgressReports} reports currently being worked on`,
      icon: '⚡',
      onPress: () => navigation.navigate('Reports'),
      color: '#FF9500'
    },
    {
      title: 'Completed',
      subtitle: `${stats.completedReports} reports successfully resolved`,
      icon: '✅',
      onPress: () => navigation.navigate('Reports'),
      color: '#28A745'
    },
    {
      title: 'Status Overview',
      subtitle: 'View detailed status information',
      icon: '📊',
      onPress: () => navigation.navigate('Status'),
      color: '#5856D6'
    },
    {
      title: 'Profile Settings',
      subtitle: 'Manage your account and preferences',
      icon: '👤',
      onPress: () => navigation.navigate('StaffProfile'),
      color: '#6C5CE7'
    },
    {
      title: 'Home Dashboard',
      subtitle: 'Return to main dashboard view',
      icon: '🏠',
      onPress: () => navigation.navigate('Home'),
      color: '#FF6B6B'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <BlueHeader title="Staff Dashboard" subtitle="Manage your assigned tasks" />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeText}>
                Welcome back, {user?.email || 'Staff Member'}!
              </Text>
              <Text style={styles.roleText}>Role: {userRole}</Text>
              {organizationName && (
                <Text style={styles.orgText}>Organization: {organizationName}</Text>
              )}
              {teamName && (
                <View style={styles.teamBadgeContainer}>
                  <Text style={styles.teamBadgeText}>👥 Team: {teamName}</Text>
                </View>
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
          <Text style={styles.sectionTitle}>Your Work Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.assignedReports}</Text>
              <Text style={styles.statLabel}>Assigned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.inProgressReports}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.completedReports}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalReports}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
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
          <Text style={styles.sectionTitle}>Staff Tools</Text>
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
          <Text style={styles.infoTitle}>Staff Quick Tips:</Text>
          <Text style={styles.infoText}>
            • Check assigned reports regularly for new tasks{'\n'}
            • Update report status as you work on them{'\n'}
            • Use the map view to plan your route efficiently{'\n'}
            • Complete reports promptly to maintain good performance{'\n'}
            • Contact admin if you need assistance with any task
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StaffHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fef9c3',
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
    alignItems: 'flex-start',
    gap: 12,
  },
  orgLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  teamBadgeContainer: {
    backgroundColor: '#28A745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  teamBadgeText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
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
    width: '45%',
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
    width: '45%',
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
  waiting: {
    fontSize: 20,
    color: '#ca8a04',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
});
