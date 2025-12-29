# Navigation Setup for Fixora

## Overview
The navigation system is set up with React Navigation v7 and includes:
- Authentication flow
- Role-based navigation (User, Admin, Staff)
- Tab navigation for each role
- Stack navigation for detailed screens

## Navigation Structure

### Authentication Flow
```
RoleSelection → Login/Signup → Role-based Dashboard
```

### User Navigation (Main User)
```
MainTabs (Tab Navigator)
├── Home
├── ReportIssue
└── Profile

Stack Screens:
└── IssueDetail
```

### Admin Navigation
```
AdminTabs (Tab Navigator)
├── Dashboard
├── ManageStaff
└── AdminProfile

Stack Screens:
├── CreateOrganization
├── AssignPermissions
└── IssueDetail
```

### Staff Navigation
```
StaffTabs (Tab Navigator)
├── Status
└── StaffProfile

Stack Screens:
├── JoinOrganization
└── IssueDetail
```

## Key Components

### 1. AuthContext (`src/context/AuthContext.js`)
Manages authentication state and user role:
- `user`: Current Firebase user
- `userRole`: User role (user, admin, staff)
- `loading`: Loading state
- `isAuthenticated`: Boolean for auth status
- `isAdmin`, `isStaff`, `isUser`: Role checkers

### 2. AppNavigator (`src/navigation/AppNavigator.js`)
Main navigation component that:
- Shows splash screen while loading
- Routes to auth screens if not authenticated
- Shows role-specific navigation if authenticated

### 3. Navigation Service (`src/services/navigationService.js`)
Provides navigation utilities:
- `navigate(name, params)`: Navigate to screen
- `goBack()`: Go back to previous screen
- `reset(name, params)`: Reset navigation stack
- Specific helpers: `navigateToIssueDetail()`, `navigateToLogin()`, etc.

## Usage Examples

### In Components
```javascript
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const navigation = useNavigation();
  const { user, userRole, isAuthenticated } = useAuth();

  const handlePress = () => {
    navigation.navigate('IssueDetail', { issueId: '123' });
  };

  return (
    // Your component JSX
  );
};
```

### Using Navigation Service
```javascript
import { navigate, navigateToIssueDetail } from '../services/navigationService';

// Navigate to specific screen
navigate('IssueDetail', { issueId: '123' });

// Use helper function
navigateToIssueDetail('123');
```

### Role-based Rendering
```javascript
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { isAdmin, isStaff, isUser } = useAuth();

  return (
    <View>
      {isAdmin && <AdminOnlyComponent />}
      {isStaff && <StaffOnlyComponent />}
      {isUser && <UserOnlyComponent />}
    </View>
  );
};
```

## Navigation Props

### Route Parameters
```javascript
// Navigate with parameters
navigation.navigate('IssueDetail', { 
  issueId: '123',
  title: 'Issue Title' 
});

// Access parameters in component
const IssueDetailScreen = ({ route }) => {
  const { issueId, title } = route.params;
  // Use parameters
};
```

### Navigation Options
```javascript
// Set navigation options
navigation.setOptions({
  title: 'Custom Title',
  headerRight: () => <CustomButton />
});
```

## Tab Navigation Icons
The tab navigators use emoji icons for simplicity. You can replace these with proper icon libraries like:
- `@expo/vector-icons`
- `react-native-vector-icons`

## Adding New Screens

1. Create the screen component in the appropriate directory
2. Add the screen to the appropriate navigator in `AppNavigator.js`
3. Update the navigation service if needed
4. Test navigation flow

## Authentication Flow
1. App starts → Shows splash screen
2. AuthContext loads → Checks Firebase auth state
3. If not authenticated → Shows auth stack (RoleSelection, Login, Signup)
4. If authenticated → Shows role-based navigation based on user role

## Error Handling
- Navigation service includes null checks for navigation ref
- AuthContext handles Firebase errors gracefully
- Loading states prevent navigation before auth is ready 