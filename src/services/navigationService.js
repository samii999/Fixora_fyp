import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const navigate = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};

export const goBack = () => {
  if (navigationRef.isReady()) {
    navigationRef.goBack();
  }
};

export const reset = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name, params }],
    });
  }
};

// Navigation helpers for specific screens
export const navigateToIssueDetail = (issueId) => {
  navigate('IssueDetail', { issueId });
};

export const navigateToLogin = () => {
  reset('Login');
};

export const navigateToRoleSelection = () => {
  reset('RoleSelection');
};

export const navigateToHome = () => {
  reset('MainTabs');
};

export const navigateToAdminDashboard = () => {
  reset('AdminTabs');
};

export const navigateToStaffStatus = () => {
  reset('StaffTabs');
}; 