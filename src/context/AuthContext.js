import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotifications } from '../services/notificationService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleDetermined, setRoleDetermined] = useState(false);

  useEffect(() => {
    let unsubscribeFromUser = null;

    const unsubscribeFromAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Set up real-time listener for user document
        unsubscribeFromUser = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          async (userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const role = userData.role;
              const status = userData.status;

              const explicitlyUnverified = userData.emailVerified === false || userData.verified === false;
              if (explicitlyUnverified) {
                if (firebaseUser.emailVerified) {
                  try {
                    await updateDoc(doc(db, 'users', firebaseUser.uid), { emailVerified: true, verified: true });
                  } catch (err) {
                    console.error('Failed to sync verification flags', err);
                  }
                } else {
                  // Allow pending staff to remain signed in so they see Pending tabs
                  if (role === 'staff' && status === 'pending') {
                    // Skip auto sign-out; proceed to set status/role below
                  } else {
                    // Check if a one-time suppression is active (set during signup to allow showing the alert)
                    let suppress = false;
                    try {
                      const v = await AsyncStorage.getItem('suppressAutoSignOutOnce');
                      suppress = v === 'true';
                    } catch {}

                    if (suppress) {
                      // Do not sign out yet; keep user out of app by not setting role
                      setUserRole(null);
                      setUserStatus(null);
                      setRoleDetermined(true);
                      setLoading(false);
                      return;
                    }

                    signOut(auth).catch((err) => console.error('Failed to sign out unverified user', err));
                    setUserRole(null);
                    setUserStatus(null);
                    setRoleDetermined(true);
                    setLoading(false);
                    return;
                  }
                }
              }
              
              // Set status first
              setUserStatus(status);
              
              // For staff users, check if they're approved
              if (role === 'staff' && status === 'pending') {
                // Staff is pending approval, don't set role yet
                setUserRole(null);
              } else {
                setUserRole(role);
              }
              
              // Mark that role determination is complete
              setRoleDetermined(true);
              setLoading(false);
              
              // Register for push notifications
              registerForPushNotifications(firebaseUser.uid).catch(err => {
                console.log('Failed to register push notifications:', err);
              });
            } else {
              setUserRole(null);
              setUserStatus(null);
              setRoleDetermined(true);
              setLoading(false);
            }
          },
          (error) => {
            console.error('Error fetching user role:', error);
            setUserRole(null);
            setUserStatus(null);
            setRoleDetermined(true);
            setLoading(false);
          }
        );
      } else {
        // User signed out
        if (unsubscribeFromUser) {
          unsubscribeFromUser();
        }
        setUser(null);
        setUserRole(null);
        setUserStatus(null);
        setRoleDetermined(true);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromUser) {
        unsubscribeFromUser();
      }
    };
  }, []);

  const value = {
    user,
    userRole,
    userStatus,
    loading,
    roleDetermined,
    isAuthenticated: !!user,
    isAdmin: userRole === 'admin',
    isStaff: userRole === 'staff',
    isUser: userRole === 'user',
    isPendingStaff: !userRole && userStatus === 'pending',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
