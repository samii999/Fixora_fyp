import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = userData.role;
            const status = userData.status;
            
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
          } else {
            setUserRole(null);
            setUserStatus(null);
            setRoleDetermined(true);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
          setUserStatus(null);
          setRoleDetermined(true);
          setLoading(false);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserStatus(null);
        setRoleDetermined(true);
        setLoading(false);
      }
    });

    return unsubscribe;
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
