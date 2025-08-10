import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const StaffHomeScreen = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userDocRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userDocRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          setStatus(data.status || 'pending');
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.statusText}>Loading your status...</Text>
      </View>
    );
  }

  if (status !== 'active') {
    return (
      <View style={styles.center}>
        <Text style={styles.waiting}>⏳ Waiting for Organization Approval</Text>
        <Text style={styles.statusText}>Please wait until the admin approves your request.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>👷 Welcome, Staff Member!</Text>

      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('StaffProfile')}
      >
        <Text style={styles.cardText}>👤 View Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('AssignedReports')}
      >
        <Text style={styles.cardText}>📋 View Assigned Reports</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('StaffMapView')}
      >
        <Text style={styles.cardText}>🗺️ Map View</Text>
      </TouchableOpacity>
    </View>
  );
};

export default StaffHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 20,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fef9c3',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#1e3a8a',
  },
  card: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 4,
  },
  cardText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
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
