import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { Text, Alert } from 'react-native';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { navigationRef } from '../services/navigationService';

// Auth Screens
import SplashScreen from '../screens/SplashScreen';
import InitialSplashScreen from '../screens/InitialSplashScreen';
import RoleSelectionScreen from '../screens/Auth/RoleSelectionScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import PendingApprovalScreen from '../screens/Auth/PendingApprovalScreen';

// Main Screens
import HomeScreen from '../screens/Main/HomeScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import ReportIssueScreen from '../screens/Main/ReportIssueScreen';
import IssueDetailScreen from '../screens/Main/IssueDetailScreen';
import MyReportsScreen from '../screens/Main/MyReportsScreen';
import AccountSettingsScreen from '../screens/Main/AccountSettingsScreen';
import PrivacySecurityScreen from '../screens/Main/PrivacySecurityScreen';
import HelpSupportScreen from '../screens/Main/HelpSupportScreen';
import NotificationSettingsScreen from '../screens/Main/NotificationSettingsScreen';

// Admin Screens
import DashboardScreen from '../screens/Admin/DashboardScreen';
import CreateOrganizationScreen from '../screens/Admin/CreateOrganizationScreen';
import ManageStaffScreen from '../screens/Admin/ManageStaffScreen';
import AssignPermissionsScreen from '../screens/Admin/AssignPermissionsScreen';
import AdminReportsScreen from '../screens/Admin/AdminReportsScreen';
import AdminAnalyticsScreen from '../screens/Admin/AdminAnalyticsScreen';
import StaffProvedReportsScreen from '../screens/Admin/StaffProvedReportsScreen';
import OrganizationSettingsScreen from '../screens/Admin/OrganizationSettingsScreen';
import FeedbackDashboard from '../screens/Admin/FeedbackDashboard';
import AdminAccountSettingsScreen from '../screens/Admin/AdminAccountSettingsScreen';
import AdminPrivacySecurityScreen from '../screens/Admin/AdminPrivacySecurityScreen';
import AdminHelpSupportScreen from '../screens/Admin/AdminHelpSupportScreen';
import AdminNotificationSettingsScreen from '../screens/Admin/AdminNotificationSettingsScreen';

// Staff Screens
import StaffProfileScreen from '../screens/Staff/StaffProfileScreen';
import JoinOrganizationScreen from '../screens/Staff/JoinOrganizationScreen';
import StatusScreen from '../screens/Staff/StatusScreen';
import StaffHomeScreen from '../screens/Staff/homescreen';
import StaffReportsScreen from '../screens/Staff/StaffReportsScreen';
import StaffAccountSettingsScreen from '../screens/Staff/StaffAccountSettingsScreen';
import StaffPrivacySecurityScreen from '../screens/Staff/StaffPrivacySecurityScreen';
import StaffHelpSupportScreen from '../screens/Staff/StaffHelpSupportScreen';
import StaffNotificationSettingsScreen from '../screens/Staff/StaffNotificationSettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main User Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="ReportIssue" 
        component={ReportIssueScreen}
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📝</Text>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Require organization selection on Home before reporting
            e.preventDefault();
            Alert.alert(
              'Select Organization',
              'Please select an organization first on the Home screen, then tap Report.'
            );
            navigation.navigate('Home');
          },
        })}
      />
      <Tab.Screen 
        name="MyReports" 
        component={MyReportsScreen}
        options={{
          tabBarLabel: 'My Reports',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Admin Tab Navigator
const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
      initialRouteName="Dashboard"
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="AdminReports" 
        component={AdminReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📄</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="ManageStaff" 
        component={ManageStaffScreen}
        options={{
          tabBarLabel: 'Staff',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👥</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="StaffProvedReports" 
        component={StaffProvedReportsScreen}
        options={{
          tabBarLabel: 'Staff-Proved',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>✅</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="AdminProfile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Pending Staff Tab Navigator (Limited Access)
const PendingStaffTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF9500',
        tabBarInactiveTintColor: '#8E8E93',
      }}
      initialRouteName="Status"
    >
      <Tab.Screen 
        name="Status" 
        component={StatusScreen}
        options={{
          tabBarLabel: 'Status',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="StaffProfile" 
        component={StaffProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Staff Tab Navigator
const StaffTabNavigator = () => {
  const { user } = useAuth();
  const [newAssignmentsCount, setNewAssignmentsCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    // Real-time listener for new assignments
    const reportsQuery = query(collection(db, 'reports'));
    
    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const allReports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter reports assigned to this staff member with 'assigned' status
      const newAssignments = allReports.filter(report => {
        const isAssignedToMe = report.assignedStaffIds && 
                              Array.isArray(report.assignedStaffIds) && 
                              report.assignedStaffIds.includes(user.uid);
        const isNewAssignment = report.status === 'assigned';
        return isAssignedToMe && isNewAssignment;
      });
      
      setNewAssignmentsCount(newAssignments.length);
    }, (error) => {
      console.error('Error listening to reports:', error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
      initialRouteName="Home"
    >
      <Tab.Screen 
        name="Home" 
        component={StaffHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Status" 
        component={StatusScreen}
        options={{
          tabBarLabel: 'Status',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={StaffReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📄</Text>
          ),
          tabBarBadge: newAssignmentsCount > 0 ? newAssignmentsCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#FF3B30' },
        }}
      />
      <Tab.Screen 
        name="StaffProfile" 
        component={StaffProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { loading, isAuthenticated, userRole, isPendingStaff, roleDetermined } = useAuth();

  // Show splash until both auth and role determination are complete
  if (loading || !roleDetermined) {
    return <SplashScreen />;
  }

  // If authenticated but no role, show splash (this shouldn't happen normally)
  if (isAuthenticated && !userRole && !isPendingStaff) {
    return <SplashScreen />;
  }

  // Determine which tab navigator to show based on role and status
  const getRoleTabs = () => {
    // Show pending staff tabs if user is pending approval
    if (isPendingStaff) {
      return <Stack.Screen name="PendingStaffTabs" component={PendingStaffTabNavigator} />;
    }
    
    switch (userRole) {
      case 'admin':
        return <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />;
      case 'staff':
        return <Stack.Screen name="StaffTabs" component={StaffTabNavigator} />;
      case 'user':
        return <Stack.Screen name="MainTabs" component={MainTabNavigator} />;
      default:
        // If we reach here, something is wrong - show splash
        return null;
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={isAuthenticated ? undefined : "InitialSplash"}
      >
        {!isAuthenticated ? (
          // Auth Stack - Always available
          <>
            <Stack.Screen 
              name="InitialSplash" 
              component={InitialSplashScreen}
              options={{ headerShown: false, animationEnabled: false }}
            />
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen} 
              options={{ headerShown: false }} 
            />
            {/* Register staff status screen for direct navigation after signup */}
            <Stack.Screen name="StatusScreen" component={StatusScreen} />
          </>
        ) : (
          <>
            {getRoleTabs() && (
              <>
                {getRoleTabs()}
                {/* Common screens for all roles */}
                <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
                <Stack.Screen name="CreateOrganization" component={CreateOrganizationScreen} options={{ headerShown: true, title: 'Create Organization' }} />
                <Stack.Screen name="AssignPermissions" component={AssignPermissionsScreen} options={{ headerShown: true, title: 'Manage Permissions' }} />
                <Stack.Screen name="JoinOrganization" component={JoinOrganizationScreen} />
                {/* Admin-specific screens */}
                <Stack.Screen name="AdminReports" component={AdminReportsScreen} options={{ headerShown: true, title: 'Issue Reports' }} />
                <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} options={{ headerShown: true, title: 'Analytics' }} />
                <Stack.Screen name="FeedbackDashboard" component={FeedbackDashboard} options={{ headerShown: false, title: 'Feedback & Ratings' }} />
                <Stack.Screen name="OrganizationSettings" component={OrganizationSettingsScreen} options={{ headerShown: true, title: 'Organization Settings', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }} />
                {/* Admin Settings Screens */}
                <Stack.Screen name="AdminAccountSettings" component={AdminAccountSettingsScreen} options={{ headerShown: true, title: 'Account Settings', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }} />
                <Stack.Screen name="AdminPrivacySecurity" component={AdminPrivacySecurityScreen} options={{ headerShown: true, title: 'Privacy & Security', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }} />
                <Stack.Screen name="AdminHelpSupport" component={AdminHelpSupportScreen} options={{ headerShown: true, title: 'Help & Support', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }} />
                <Stack.Screen name="AdminNotificationSettings" component={AdminNotificationSettingsScreen} options={{ headerShown: true, title: 'Notification Settings', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }} />
                {/* User Settings Screens */}
                <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} options={{ headerShown: true, title: 'Account Settings', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }} />
                <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} options={{ headerShown: true, title: 'Privacy & Security', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }} />
                <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ headerShown: true, title: 'Help & Support', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }} />
                <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerShown: true, title: 'Notification Settings', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }} />
                {/* Staff Settings Screens */}
                <Stack.Screen name="StaffAccountSettings" component={StaffAccountSettingsScreen} options={{ headerShown: true, title: 'Account Settings', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }} />
                <Stack.Screen name="StaffPrivacySecurity" component={StaffPrivacySecurityScreen} options={{ headerShown: true, title: 'Privacy & Security', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }} />
                <Stack.Screen name="StaffHelpSupport" component={StaffHelpSupportScreen} options={{ headerShown: true, title: 'Help & Support', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }} />
                <Stack.Screen name="StaffNotificationSettings" component={StaffNotificationSettingsScreen} options={{ headerShown: true, title: 'Notification Settings', headerStyle: { backgroundColor: '#007AFF' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }} />
                {/* Staff-specific (can also register StatusScreen at stack level, just in case) */}
                <Stack.Screen name="StatusScreen" component={StatusScreen} />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 
