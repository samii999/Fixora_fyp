import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import { uploadToSupabase } from '../../api/supabase';
import { getAddressFromCoords, getCoordsFromAddress } from '../../api/nominatim';
import { db } from '../../config/firebaseConfig';
import { addDoc, collection, getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

const ReportForm = ({ userId }) => {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [region, setRegion] = useState({
    latitude: 31.5204, // Default to Lahore coordinates
    longitude: 74.3587,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Pick Image
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        quality: 0.6,
        allowsEditing: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Search for address and set location
  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) {
      Alert.alert('Enter Address', 'Please enter an address to search.');
      return;
    }
    setSearching(true);
    try {
      const coords = await getCoordsFromAddress(searchAddress);
      if (coords) {
        setLocation(coords);
        setAddress(searchAddress);
        setRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        Alert.alert('Not Found', 'Could not find location for the entered address.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search address.');
    } finally {
      setSearching(false);
    }
  };

  // Handle map marker press
  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({ latitude, longitude });
    // Reverse geocode to get address
    getAddressFromCoords(latitude, longitude).then(addr => {
      setAddress(addr);
    });
  };

  // Generate unique report ID
  const generateReportId = () => {
    return `RPT_${Date.now()}`;
  };

  // Get user's organization ID
  const getUserOrganization = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      return userDoc.data()?.organizationId || '';
    } catch (error) {
      console.error('Error fetching user organization:', error);
      return '';
    }
  };

  // Submit Report
  const handleSubmit = async () => {
    if (!image) {
      Alert.alert('Missing Image', 'Please select an image of the issue.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please describe the issue.');
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert('Description Too Short', 'Please provide a more detailed description (at least 10 characters).');
      return;
    }

    if (!location) {
      Alert.alert('Missing Location', 'Please select a location on the map or search for an address.');
      return;
    }

    if (!category.trim()) {
      Alert.alert('Missing Category', 'Please select a category for the issue.');
      return;
    }

    setLoading(true);
    try {
      // Upload image to Supabase
      const imageUrl = await uploadToSupabase(image.uri, 'reports');
      
      // Get user's organization
      const organizationId = await getUserOrganization();
      
      // Create report data matching database structure
      const reportData = {
        userId: user.uid,
        reportId: generateReportId(),
        category: category.trim(),
        description: description.trim(),
        imageUrl,
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        address: address,
        organizationId: organizationId,
        organizationAssigned: '', // Will be assigned by admin
        status: 'pending',
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'reports'), reportData);
      
      Alert.alert('Success', 'Report submitted successfully!');
      setImage(null);
      setDescription('');
      setCategory('');
      setLocation(null);
      setAddress('');
      setSearchAddress('');
    } catch (err) {
      console.error('Submit error:', err);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Water Leakage',
    'Electricity Issue',
    'Road Damage',
    'Street Light',
    'Garbage Collection',
    'Drainage Problem',
    'Traffic Signal',
    'Other'
  ];

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <Text style={styles.label}>Issue Category *</Text>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                category === cat && styles.categoryButtonSelected
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[
                styles.categoryButtonText,
                category === cat && styles.categoryButtonTextSelected
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Issue Description *</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe the issue in detail..."
          multiline
          value={description}
          onChangeText={setDescription}
          maxLength={500}
        />
        <Text style={styles.charCount}>{description.length}/500</Text>

        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>📷 Pick Image *</Text>
        </TouchableOpacity>
        
        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image.uri }} style={styles.image} />
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => setImage(null)}
            >
              <Text style={styles.removeButtonText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Location Section */}
        <Text style={styles.label}>Location *</Text>
        
        {/* Address Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.input, { flex: 1, minHeight: 40 }]}
            placeholder="Search address or location..."
            value={searchAddress}
            onChangeText={setSearchAddress}
          />
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={handleAddressSearch} 
            disabled={searching}
          >
            <Text style={styles.searchButtonText}>
              {searching ? 'Searching...' : 'Search'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onPress={handleMapPress}
          >
            {location && (
              <Marker
                coordinate={location}
                title="Selected Location"
                description={address}
              />
            )}
          </MapView>
        </View>

        {address ? (
          <Text style={styles.location}>📍 {address}</Text>
        ) : (
          <Text style={styles.location}>Tap on map to select location</Text>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Submitting report...</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              (!image || !description.trim() || !location || !category.trim()) && styles.submitButtonDisabled
            ]} 
            onPress={handleSubmit}
            disabled={!image || !description.trim() || !location || !category.trim() || loading}
          >
            <Text style={styles.submitButtonText}>Submit Report</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: { 
    gap: 12, 
    padding: 16,
    paddingBottom: 40, // Add extra padding at bottom for submit button
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600',
    color: '#333'
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  categoryButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#666',
  },
  categoryButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    minHeight: 100,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: -8
  },
  imageButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  imageContainer: {
    position: 'relative'
  },
  image: { 
    width: '100%', 
    height: 200, 
    borderRadius: 10, 
    marginVertical: 10 
  },
  removeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchButton: {
    backgroundColor: '#28A745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  map: {
    flex: 1,
  },
  location: { 
    fontStyle: 'italic', 
    marginVertical: 5,
    color: '#666'
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    color: '#666'
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default ReportForm;
