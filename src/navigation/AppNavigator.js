import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { Text } from 'react-native';
import { navigationRef } from '../services/navigationService';

// Auth Screens
import SplashScreen from '../screens/SplashScreen';
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

// Admin Screens
import DashboardScreen from '../screens/Admin/DashboardScreen';
import CreateOrganizationScreen from '../screens/Admin/CreateOrganizationScreen';
import ManageStaffScreen from '../screens/Admin/ManageStaffScreen';
import AssignPermissionsScreen from '../screens/Admin/AssignPermissionsScreen';
import AdminReportsScreen from '../screens/Admin/AdminReportsScreen';
import AdminAnalyticsScreen from '../screens/Admin/AdminAnalyticsScreen';
import AdminSettingsScreen from '../screens/Admin/AdminSettingsScreen';

// Staff Screens
import StaffProfileScreen from '../screens/Staff/StaffProfileScreen';
import JoinOrganizationScreen from '../screens/Staff/JoinOrganizationScreen';
import StatusScreen from '../screens/Staff/StatusScreen';
import StaffHomeScreen from '../screens/Staff/homescreen';
import StaffReportsScreen from '../screens/Staff/StaffReportsScreen';

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

// Staff Tab Navigator
const StaffTabNavigator = () => {
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

  // Show pending approval screen for pending staff
  if (isAuthenticated && isPendingStaff) {
    return <PendingApprovalScreen />;
  }

  // If authenticated but no role, show splash (this shouldn't happen normally)
  if (isAuthenticated && !userRole) {
    return <SplashScreen />;
  }

  // Determine which tab navigator to show based on role
  const getRoleTabs = () => {
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
        initialRouteName={isAuthenticated ? undefined : "RoleSelection"}
      >
        {!isAuthenticated ? (
          // Auth Stack - Always available
          <>
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            {getRoleTabs() && (
              <>
                {getRoleTabs()}
                {/* Common screens for all roles */}
                <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
                <Stack.Screen name="CreateOrganization" component={CreateOrganizationScreen} />
                <Stack.Screen name="AssignPermissions" component={AssignPermissionsScreen} />
                <Stack.Screen name="JoinOrganization" component={JoinOrganizationScreen} />
                {/* Admin-specific screens */}
                <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
                <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
                <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
