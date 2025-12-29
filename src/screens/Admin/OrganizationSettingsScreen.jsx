import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { db } from '../../config/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { supabase } from '../../config/supabaseConfig';
import { useAuth } from '../../context/AuthContext';
import { API_CONFIG, formatCategoryName } from '../../config/apiConfig';
import * as ImagePicker from 'expo-image-picker';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/supabaseConfig';

const OrganizationSettingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [organizationId, setOrganizationId] = useState(null);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationLogo, setOrganizationLogo] = useState(null);
  const [originalLogo, setOriginalLogo] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [originalCategories, setOriginalCategories] = useState([]);

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      
      // Get user's organization ID
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const orgId = userData?.organizationId;
      
      if (!orgId) {
        Alert.alert('Error', 'You do not have an organization assigned.');
        navigation.goBack();
        return;
      }
      
      setOrganizationId(orgId);
      
      // Get organization data
      const orgDoc = await getDoc(doc(db, 'organizations', orgId));
      if (orgDoc.exists()) {
        const orgData = orgDoc.data();
        setOrganizationName(orgData.name || 'Organization');
        const logo = orgData.logo || null;
        setOrganizationLogo(logo);
        setOriginalLogo(logo);
        const categories = orgData.categories || [];
        setSelectedCategories(categories);
        setOriginalCategories(categories);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      Alert.alert('Error', 'Failed to load organization settings');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadLogo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadLogo = async (uri) => {
    try {
      setUploading(true);
      
      // Create unique filename
      const fileName = `${organizationId}_${Date.now()}.jpg`;
      const filePath = `organizationLogos/${fileName}`;
      
      // Use FormData for upload (React Native compatible)
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: 'image/jpeg',
      });
      
      // Upload to Supabase Storage using fetch API
      const endpoint = `${SUPABASE_URL}/storage/v1/object/reports/${encodeURIComponent(filePath)}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      if (!response.ok) {
        let message = `Upload failed with status ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson?.message) message = errJson.message;
        } catch {}
        throw new Error(message);
      }
      
      // Get public URL
      const { data } = supabase.storage.from('reports').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      
      // Update local state
      setOrganizationLogo(publicUrl);
      setOriginalLogo(publicUrl);
      
      // Save to Firestore immediately
      await updateDoc(doc(db, 'organizations', organizationId), {
        logo: publicUrl,
        updatedAt: new Date()
      });

      Alert.alert('Success', 'Logo uploaded and saved successfully!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      Alert.alert('Error', error.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };


  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Check if categories or logo changed
      const categoriesChanged = JSON.stringify(selectedCategories.sort()) !== 
                                JSON.stringify(originalCategories.sort());
      const logoChanged = organizationLogo !== originalLogo;
      
      if (!categoriesChanged && !logoChanged) {
        Alert.alert('No Changes', 'No changes were made to save.');
        return;
      }
      
      // Update organization
      const updateData = {
        updatedAt: new Date(),
      };
      
      if (categoriesChanged) {
        updateData.categories = selectedCategories;
      }
      
      if (logoChanged) {
        updateData.logo = organizationLogo;
      }
      
      await updateDoc(doc(db, 'organizations', organizationId), updateData);
      
      setOriginalCategories(selectedCategories);
      setOriginalLogo(organizationLogo);
      
      Alert.alert(
        'Success',
        'Organization settings updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating organization:', error);
      Alert.alert('Error', 'Failed to update organization settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    } else {
      setSelectedCategories(prev => [...prev, category]);
    }
  };

  const selectAllCategories = () => {
    setSelectedCategories([...API_CONFIG.IMAGE_CATEGORIES]);
  };

  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasChanges = JSON.stringify(selectedCategories.sort()) !== 
                     JSON.stringify(originalCategories.sort()) ||
                     organizationLogo !== originalLogo;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Organization Settings</Text>
          <Text style={styles.orgName}>{organizationName}</Text>
        </View>

        {/* Logo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization Logo</Text>
          <Text style={styles.helperText}>
            Upload your organization's logo to display on reports and communications
          </Text>

          <View style={styles.logoContainer}>
            {organizationLogo ? (
              <Image source={{ uri: organizationLogo }} style={styles.logoImage} />
            ) : (
              <View style={styles.placeholderLogo}>
                <Text style={styles.placeholderText}>🏢</Text>
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Text style={styles.uploadButtonText}>
              {uploading ? 'Uploading...' : organizationLogo ? 'Change Logo' : 'Upload Logo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Problem Categories</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity onPress={selectAllCategories} style={styles.quickButton}>
                <Text style={styles.quickButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearAllCategories} style={styles.quickButton}>
                <Text style={styles.quickButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.helperText}>
            Select which problem types your organization handles. Leave empty to accept all types.
          </Text>

          <View style={styles.categoriesGrid}>
            {API_CONFIG.IMAGE_CATEGORIES.map(cat => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  onPress={() => toggleCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                    {isSelected && '✓ '}
                    {formatCategoryName(cat)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.statusBox}>
            {selectedCategories.length === 0 ? (
              <View style={styles.statusWarning}>
                <Text style={styles.statusIcon}>ℹ️</Text>
                <Text style={styles.statusText}>
                  No categories selected - organization will accept ALL problem types
                </Text>
              </View>
            ) : (
              <View style={styles.statusSuccess}>
                <Text style={styles.statusIcon}>✓</Text>
                <Text style={styles.statusText}>
                  {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrganizationSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orgName: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F0F2F5',
  },
  quickButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    backgroundColor: '#fff',
  },
  categoryChipSelected: {
    backgroundColor: '#E8F0FE',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#333',
  },
  categoryChipTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  statusBox: {
    marginTop: 8,
  },
  statusWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  statusSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#28A745',
  },
  statusIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E1E5E9',
  },
  placeholderLogo: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E1E5E9',
  },
  placeholderText: {
    fontSize: 48,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -60,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
