import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Switch, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const ManageStaffScreen = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      // Get admin's organization ID from user data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const adminOrgId = userDoc.data()?.organizationId;
      
      if (!adminOrgId) {
        Alert.alert('Error', 'No organization found. Please create an organization first.');
        return;
      }

      const q = query(
        collection(db, 'users'), 
        where('organizationId', '==', adminOrgId), 
        where('role', '==', 'staff')
      );
      const snapshot = await getDocs(q);
      const staffList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaff(staffList);
    } catch (error) {
      console.error('Error fetching staff:', error);
      Alert.alert('Error', 'Failed to load staff members.');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = async (uid, key, current) => {
    try {
      const userRef = doc(db, 'users', uid);
      const staffMember = staff.find(s => s.id === uid);
      const newPermissions = { ...staffMember.permissions, [key]: !current };
      await updateDoc(userRef, { permissions: newPermissions });
      fetchStaff(); // refresh UI
    } catch (err) {
      Alert.alert('Error', 'Failed to update permissions.');
    }
  };

  const handleRemove = async (uid) => {
    Alert.alert("Confirm Removal", "Remove this staff member from the organization?", [
      { text: "Cancel", style: 'cancel' },
      {
        text: "Remove", 
        style: 'destructive',
        onPress: async () => {
          try {
            await updateDoc(doc(db, "users", uid), {
              organizationId: null,
              permissions: {},
            });
            fetchStaff();
            Alert.alert('Success', 'Staff member removed successfully.');
          } catch (error) {
            Alert.alert('Error', 'Failed to remove staff member.');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.staffHeader}>
        <Text style={styles.name}>{item.name || item.email || 'Unnamed'}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>

      <View style={styles.permissionsSection}>
        <Text style={styles.sectionTitle}>Permissions:</Text>
        {Object.entries(item.permissions || {}).map(([key, val]) => (
          <View key={key} style={styles.switchRow}>
            <Text style={styles.permissionText}>{key}</Text>
            <Switch
              value={val}
              onValueChange={() => handlePermissionToggle(item.id, key, val)}
              trackColor={{ false: '#E1E5E9', true: '#007AFF' }}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.removeButton} 
        onPress={() => handleRemove(item.id)}
      >
        <Text style={styles.removeButtonText}>Remove Staff</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading staff members...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Staff</Text>
        <Text style={styles.subtitle}>{staff.length} staff member(s)</Text>
      </View>
      
      {staff.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No staff members found</Text>
          <Text style={styles.emptySubtext}>Staff members will appear here once they join your organization</Text>
        </View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

export default ManageStaffScreen;

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  staffHeader: {
    marginBottom: 16,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  permissionsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  permissionText: {
    fontSize: 16,
    color: '#333',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
