import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ScrollView, ActivityIndicator, Image } from 'react-native';
import { db, auth } from '../../config/firebaseConfig';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { supabase } from '../../config/supabaseConfig';
import { getCities, getDistricts, getVillages } from '../../services/locationService';
import MapView, { Marker } from 'react-native-maps';
import { getAddressFromCoords, getCoordsFromAddress } from '../../api/nominatim';
import { API_CONFIG, formatCategoryName } from '../../config/apiConfig';
import * as ImagePicker from 'expo-image-picker';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/supabaseConfig';

const CreateOrganizationScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [orgType, setOrgType] = useState('Municipality');
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
  const [selectedVillageId, setSelectedVillageId] = useState(null);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [isVillageOpen, setIsVillageOpen] = useState(false);

  // Map & search state
  const [region, setRegion] = useState({
    latitude: 31.5204,
    longitude: 74.3587,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [markerLocation, setMarkerLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [logo, setLogo] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await getCities();
        setCities(list);
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedCityId) {
        setDistricts([]);
        setSelectedDistrictId(null);
        setVillages([]);
        setSelectedVillageId(null);
        setIsDistrictOpen(false);
        setIsVillageOpen(false);
        return;
      }
      const list = await getDistricts(selectedCityId);
      setDistricts(list);
      setSelectedDistrictId(null);
      setVillages([]);
      setSelectedVillageId(null);
      setIsDistrictOpen(true);
      setIsVillageOpen(false);
    })();
  }, [selectedCityId]);

  useEffect(() => {
    (async () => {
      if (!selectedDistrictId) {
        setVillages([]);
        setSelectedVillageId(null);
        setIsVillageOpen(false);
        return;
      }
      const list = await getVillages(selectedDistrictId);
      setVillages(list);
      setSelectedVillageId(null);
      setIsVillageOpen(true);
    })();
  }, [selectedDistrictId]);

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerLocation({ latitude, longitude });
    getAddressFromCoords(latitude, longitude).then(addr => {
      setAddress(addr);
      // Try to auto-detect city from address text
      trySelectCityFromAddress(addr);
    });
  };

  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) {
      Alert.alert('Enter Address', 'Please enter an address to search.');
      return;
    }
    setSearching(true);
    try {
      const coords = await getCoordsFromAddress(searchAddress);
      if (coords) {
        setRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
        setMarkerLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setAddress(searchAddress);
        trySelectCityFromAddress(searchAddress);
      } else {
        Alert.alert('Not Found', 'Could not find location for the entered address.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to search address.');
    } finally {
      setSearching(false);
    }
  };

  // Attempt to infer city from free-text address
  const trySelectCityFromAddress = (addrText) => {
    if (!addrText || !Array.isArray(cities) || cities.length === 0) return;
    const lower = addrText.toLowerCase();
    const match = cities.find(c => lower.includes(String(c.name || '').toLowerCase()));
    if (match) {
      setSelectedCityId(match.id);
    }
  };

  const pickLogo = async () => {
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
        setLogo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadLogo = async (orgId) => {
    if (!logo) return null;
    
    try {
      setUploadingLogo(true);
      
      // Create unique filename
      const fileName = `${orgId}_${Date.now()}.jpg`;
      const filePath = `organizationLogos/${fileName}`;
      
      // Use FormData for upload (React Native compatible)
      const formData = new FormData();
      formData.append('file', {
        uri: logo,
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
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    } finally {
      setUploadingLogo(false);
    }
  };


  const handleCreate = async () => {
    if (!name) {
      Alert.alert("Missing Fields", "Organization name is required.");
      return;
    }
    if (!markerLocation) {
      Alert.alert("Pin Location", "Search or tap the map to pin the organization's location.");
      return;
    }

    setLoading(true);
    try {
      // Get current user data
      const currentUser = auth.currentUser;
      
      // Check if admin already has an organization
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const existingOrgId = userDoc.data()?.organizationId;
      
      if (existingOrgId) {
        Alert.alert(
          "Already Has Organization",
          "You can only create one organization. You already manage an organization."
        );
        setLoading(false);
        return;
      }
      const slugBase = `org_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
      const orgId = slugBase;

      // We no longer store coverage arrays; proximity search will be used.

      const geo = { lat: markerLocation.latitude, lng: markerLocation.longitude };

      // Upload logo if selected
      let logoURL = null;
      if (logo) {
        try {
          logoURL = await uploadLogo(orgId);
        } catch (error) {
          console.error('Logo upload failed:', error);
          // Continue without logo
        }
      }

      const organizationData = {
        name: name.trim(),
        type: orgType,
        createdAt: new Date(),
        createdBy: currentUser.uid,
        adminIds: [currentUser.uid],
        staffIds: [],
        categories: selectedCategories, // Categories selected during creation (empty = all)
        geo,
        address: address || '',
        ...(logoURL && { logo: logoURL }),
      };

      await setDoc(doc(db, 'organizations', orgId), organizationData);

      // Link admin to organization (preserving existing fields)
      await updateDoc(doc(db, 'users', currentUser.uid), {
        role: 'admin',
        organizationId: orgId,
      });

      Alert.alert("Success", "Organization created successfully!");
      navigation.navigate("AdminTabs");
    } catch (err) {
      console.error('Create organization error:', err);
      Alert.alert("Error", err.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Organization</Text>
        <Text style={styles.subtitle}>Set up your organization for issue management</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Organization Name *</Text>
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder="Official Name of the Organization" 
          />

          <Text style={styles.label}>Organization Type *</Text>
          <View style={styles.typeRow}>
            {['Municipality','NGO / Non-profit','Private Company','Community / Local Body'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.typeButton, orgType === t && styles.typeButtonSelected]}
                onPress={() => setOrgType(t)}
              >
                <Text style={[styles.typeButtonText, orgType === t && styles.typeButtonTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Organization Logo</Text>
          <Text style={styles.helperText}>Upload your organization's logo (optional)</Text>
          
          <View style={styles.logoSection}>
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logoPreview} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoPlaceholderText}>🏢</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.uploadLogoButton}
              onPress={pickLogo}
              disabled={uploadingLogo}
            >
              <Text style={styles.uploadLogoButtonText}>
                {uploadingLogo ? 'Uploading...' : logo ? 'Change Logo' : 'Select Logo'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 8 }]}>Problem Categories</Text>
          <Text style={styles.helperText}>Select which problem types your organization handles (leave empty to accept all).</Text>
          
          <View style={styles.chipRow}>
            {API_CONFIG.IMAGE_CATEGORIES.map(cat => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => {
                    if (isSelected) {
                      setSelectedCategories(prev => prev.filter(c => c !== cat));
                    } else {
                      setSelectedCategories(prev => [...prev, cat]);
                    }
                  }}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {formatCategoryName(cat)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedCategories.length > 0 && (
            <Text style={styles.infoText}>
              ✓ Selected {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'}
            </Text>
          )}
          {selectedCategories.length === 0 && (
            <Text style={styles.warningText}>
              ℹ️ No categories selected - will accept ALL problem types
            </Text>
          )}

          <Text style={[styles.label, { marginTop: 16 }]}>Coverage Location *</Text>
          <Text style={styles.helperText}>Select city, then district and village if applicable.</Text>

          <Text style={styles.smallTitle}>City</Text>
          <View style={styles.chipRow}>
            {cities.map(c => (
              <TouchableOpacity key={c.id} style={[styles.chip, selectedCityId===c.id && styles.chipSelected]} onPress={()=>setSelectedCityId(c.id)}>
                <Text style={[styles.chipText, selectedCityId===c.id && styles.chipTextSelected]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedCityId ? (
            <>
              <Text style={styles.smallTitle}>District</Text>
              <View style={styles.chipRow}>
                {districts.map(d => (
                  <TouchableOpacity key={d.id} style={[styles.chip, selectedDistrictId===d.id && styles.chipSelected]} onPress={()=>setSelectedDistrictId(d.id)}>
                    <Text style={[styles.chipText, selectedDistrictId===d.id && styles.chipTextSelected]}>{d.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          {selectedDistrictId ? (
            <>
              <Text style={styles.smallTitle}>Village (optional)</Text>
              <View style={styles.chipRow}>
                {villages.map(v => (
                  <TouchableOpacity key={v.id} style={[styles.chip, selectedVillageId===v.id && styles.chipSelected]} onPress={()=>setSelectedVillageId(v.id)}>
                    <Text style={[styles.chipText, selectedVillageId===v.id && styles.chipTextSelected]}>{v.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          <Text style={[styles.label, { marginTop: 8 }]}>Headquarters Location</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={searchAddress}
              onChangeText={setSearchAddress}
              placeholder="Search address or place..."
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleAddressSearch} disabled={searching}>
              <Text style={styles.searchButtonText}>{searching ? 'Searching...' : 'Search'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mapContainer}>
            <MapView style={styles.map} region={region} onPress={handleMapPress}>
              {markerLocation && (
                <Marker coordinate={markerLocation} title="HQ Location" description={address} />
              )}
            </MapView>
          </View>
          {address ? (
            <Text style={styles.addressText}>📍 {address}</Text>
          ) : (
            <Text style={styles.helperText}>Tap on the map to place a pin.</Text>
          )}

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
      </ScrollView>
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
    flexGrow: 1,
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
    marginBottom: 8,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  smallTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 4,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  typeButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    backgroundColor: '#fff',
  },
  typeButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#EEF4FF',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#333',
  },
  typeButtonTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#E8F0FE',
    borderColor: '#A7C1F9',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  chipTextSelected: {
    color: '#1A73E8',
    fontWeight: '600',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  dropdownLabel: {
    fontSize: 14,
    color: '#333',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  dropdownListStatic: {
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  searchButton: {
    backgroundColor: '#28A745',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    height: 220,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E5E9',
    marginBottom: 6,
  },
  map: {
    flex: 1,
  },
  addressText: {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 8,
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
  infoText: {
    fontSize: 13,
    color: '#28A745',
    marginTop: 4,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#FF9800',
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  logoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E1E5E9',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E1E5E9',
  },
  logoPlaceholderText: {
    fontSize: 32,
  },
  uploadLogoButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadLogoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
