import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { db, auth } from '../../config/firebaseConfig';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

const CreateOrganizationScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !slug) {
      Alert.alert("Missing Fields", "Name and slug are required.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create organization
      const docRef = await addDoc(collection(db, 'organizations'), {
        name,
        slug,
        category,
        createdBy: auth.currentUser.uid,
        createdAt: new Date(),
      });

      // 2. Update current user with role + org ID
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        role: 'admin',
        organizationId: docRef.id,
      });

      Alert.alert("Success", "Organization created successfully!");
      navigation.navigate("AdminTabs");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Organization</Text>
        <Text style={styles.subtitle}>Set up your organization for issue management</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Organization Name *</Text>
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder="e.g. WASA" 
          />

          <Text style={styles.label}>Organization Slug *</Text>
          <TextInput 
            style={styles.input} 
            value={slug} 
            onChangeText={setSlug} 
            placeholder="e.g. wasa-001" 
          />

          <Text style={styles.label}>Category (optional)</Text>
          <TextInput 
            style={styles.input} 
            value={category} 
            onChangeText={setCategory} 
            placeholder="e.g. Water Services" 
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating...' : 'Create Organization'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CreateOrganizationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E5E9',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
