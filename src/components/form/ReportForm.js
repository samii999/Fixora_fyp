import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, Image, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Dimensions, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import { uploadImageToStorage } from '../../services/issueService';
import { getAddressFromCoords, getCoordsFromAddress } from '../../api/nominatim';
import { db } from '../../config/firebaseConfig';
import { addDoc, collection, getDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { getPrediction, getFallbackPrediction, classifyMultipleImages } from '../../services/predictionService';
import { formatCategoryName } from '../../config/apiConfig';
import { checkForDuplicates, linkDuplicateReports } from '../../services/duplicateDetectionService';
import { notifyAdminsNewReport } from '../../services/notificationService';

const { width, height } = Dimensions.get('window');

const ReportForm = ({ userId }) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [descriptionQuality, setDescriptionQuality] = useState(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [classificationResult, setClassificationResult] = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [region, setRegion] = useState({
    latitude: 31.5204, // Default to Lahore coordinates
    longitude: 74.3587,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Read organizationId from navigation params and fetch org name
  useEffect(() => {
    const preselected = route?.params?.preselected;
    if (preselected?.organizationId) {
      setSelectedOrganizationId(preselected.organizationId);
      // Fetch organization name
      (async () => {
        try {
          const orgDoc = await getDoc(doc(db, 'organizations', preselected.organizationId));
          if (orgDoc.exists()) {
            setOrganizationName(orgDoc.data()?.name || '');
          }
        } catch (error) {
          console.error('Error fetching organization:', error);
        }
      })();
    }
  }, [route?.params?.preselected]);

  // Classify images when they change
  useEffect(() => {
    const classifyImages = async () => {
      if (images.length === 0) {
        setClassificationResult(null);
        return;
      }

      setClassifying(true);
      try {
        const imageUris = images.map(img => img.uri);
        const result = await classifyMultipleImages(imageUris);
        setClassificationResult(result);
        
        // Show alerts for validation errors
        if (!result.success) {
          if (result.multipleCategories) {
            Alert.alert(
              '⚠️ Multiple Problem Types Detected',
              `Your images show different problems:\n${result.categoriesDisplay.join(', ')}\n\nPlease upload images of the same problem only.`,
              [{ text: 'OK' }]
            );
          } else if (result.belowThreshold) {
            Alert.alert(
              '⚠️ Low Confidence',
              `Image classification confidence is ${(result.minConfidence * 100).toFixed(1)}%.\n\nPlease upload clearer images (minimum 80% required).`,
              [{ text: 'OK' }]
            );
          }
        }
      } catch (error) {
        console.error('Classification error:', error);
      } finally {
        setClassifying(false);
      }
    };

    classifyImages();
  }, [images]);

  // Reset form when screen loses focus
  useFocusEffect(
    useCallback(() => {
      // This runs when screen comes into focus
      return () => {
        // This cleanup function runs when screen loses focus
        setImages([]);
        setDescription('');
        setDescriptionQuality(null);
        setLocation(null);
        setAddress('');
        setSearchAddress('');
        setClassificationResult(null);
        setSelectedOrganizationId('');
        setOrganizationName('');
        setRegion({
          latitude: 31.5204, // Default to Lahore coordinates
          longitude: 74.3587,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      };
    }, [])
  );

  // Pick Image from Gallery
  const pickImageFromGallery = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Sorry, we need camera roll permissions to select images for your report.'
        );
        return;
      }

                   const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages(prevImages => [...prevImages, result.assets[0]]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(
        'Error', 
        `Failed to pick image: ${error.message || 'Unknown error'}. Please try again.`
      );
    }
  };

  // Take Photo with Camera
  const takePhoto = async () => {
    try {
      // Request camera permissions first
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Sorry, we need camera permissions to take photos for your report.'
        );
        return;
      }

                   const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages(prevImages => [...prevImages, result.assets[0]]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(
        'Error', 
        `Failed to take photo: ${error.message || 'Unknown error'}. Please try again.`
      );
    }
  };

  // Show image picker options
  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        {
          text: 'Camera',
          onPress: takePhoto,
        },
        {
          text: 'Gallery',
          onPress: pickImageFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
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

  // Evaluate description quality for urgency detection
  const evaluateDescriptionQuality = (text) => {
    if (!text || text.length < 30) return null;
    
    const lowerText = text.toLowerCase();
    let score = 0;
    let quality = '';
    
    // Check for urgency indicators
    const urgencyKeywords = ['urgent', 'emergency', 'critical', 'immediate', 'asap', 'as soon as possible', 'dangerous', 'unsafe', 'hazardous'];
    const severityKeywords = ['flooding', 'blocked', 'broken', 'damaged', 'leaking', 'overflow', 'fire', 'sparking'];
    const impactKeywords = ['traffic', 'blocking', 'affecting', 'damage', 'injury', 'health', 'safety'];
    
    const hasUrgency = urgencyKeywords.some(keyword => lowerText.includes(keyword));
    const hasSeverity = severityKeywords.some(keyword => lowerText.includes(keyword));
    const hasImpact = impactKeywords.some(keyword => lowerText.includes(keyword));
    
    score = (hasUrgency ? 3 : 0) + (hasSeverity ? 2 : 0) + (hasImpact ? 1 : 0);
    
    if (score >= 5) {
      quality = 'excellent';
    } else if (score >= 3) {
      quality = 'good';
    } else if (score >= 1) {
      quality = 'fair';
    } else {
      quality = 'needs_improvement';
    }
    
    return { score, quality, hasUrgency, hasSeverity, hasImpact };
  };


  // Handle description change with quality evaluation
  const handleDescriptionChange = (text) => {
    setDescription(text);
    const quality = evaluateDescriptionQuality(text);
    setDescriptionQuality(quality);
  };

  // Generate unique report ID
  const generateReportId = () => {
    return `RPT_${Date.now()}`;
  };

  // Get user's organization ID (for staff users)
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
    if (images.length === 0) {
      Alert.alert('Missing Image', 'Please select at least one image of the issue.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please describe the issue.');
      return;
    }

    if (description.trim().length < 30) {
      Alert.alert(
        'Description Too Short', 
        'Please provide more details (at least 30 characters).\n\nInclude:\n• Severity of the issue\n• Location specifics\n• Safety concerns\n• Impact on surroundings'
      );
      return;
    }

    if (!location) {
      Alert.alert('Missing Location', 'Please select a location on the map or search for an address.');
      return;
    }

    // Validate image classification
    if (classifying) {
      Alert.alert('Please Wait', 'Images are being classified. Please wait a moment.');
      return;
    }

    if (!classificationResult || !classificationResult.success) {
      if (classificationResult?.multipleCategories) {
        Alert.alert(
          '❌ Cannot Submit',
          `Multiple problem types detected in your images:\n${classificationResult.categoriesDisplay.join(', ')}\n\nPlease remove images and upload only one type of problem.`
        );
        return;
      }
      
      if (classificationResult?.belowThreshold) {
        Alert.alert(
          '❌ Cannot Submit',
          `Image classification confidence is ${(classificationResult.minConfidence * 100).toFixed(1)}%.\n\nMinimum 80% confidence required. Please upload clearer, well-lit images of the problem.`
        );
        return;
      }

      Alert.alert(
        '❌ Cannot Submit',
        classificationResult?.error || 'Image classification failed. Please try again with different images.'
      );
      return;
    }

    // Validate organization category match
    if (selectedOrganizationId) {
      try {
        const orgDoc = await getDoc(doc(db, 'organizations', selectedOrganizationId));
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          const orgCategories = orgData.categories || [];
          
          // If organization has specific categories, check if AI category matches
          if (orgCategories.length > 0) {
            const aiCategory = classificationResult.category; // slug version (e.g., 'potholes')
            
            if (!orgCategories.includes(aiCategory)) {
              Alert.alert(
                '⚠️ Category Mismatch',
                `Your images show "${classificationResult.categoryDisplay}" but you selected an organization that handles:\n\n${orgCategories.map(c => formatCategoryName(c)).join(', ')}\n\nPlease either:\n• Choose a different organization, OR\n• Upload images matching the organization's categories`,
                [
                  { text: 'Change Organization', onPress: () => {} },
                  { text: 'Re-upload Images', onPress: () => setImages([]) }
                ]
              );
              return;
            }
          }
          // If orgCategories is empty, organization accepts all categories
        }
      } catch (error) {
        console.error('Error checking organization categories:', error);
      }
    }

    setLoading(true);
    try {
      // Check for duplicate reports at or near this location
      console.log('🔍 Checking for duplicate reports...');
      const duplicateCheck = await checkForDuplicates(
        location.latitude,
        location.longitude,
        classificationResult.category, // Check same category
        100, // Within 100 meters
        selectedOrganizationId
      );

      // Upload all images to Supabase Storage (no expo-file-system)
      const imageUrls = await Promise.all(
        images.map(async (image, index) => {
          return await uploadImageToStorage(image.uri);
        })
      );
      
      // Get urgency prediction automatically
      console.log('🔮 Getting urgency prediction...');
      const result = await getPrediction(description);
      let urgency = 'Medium';
      let isFallback = false;
      
      if (!result.success) {
        console.log('⚠️ API failed, using fallback');
        const fallback = getFallbackPrediction(description);
        urgency = fallback.urgency;
        isFallback = true;
      } else {
        urgency = result.urgency;
        isFallback = result.isFallback || false;
      }

      console.log('✅ Urgency determined:', urgency);

      // Create report data matching database structure
      const reportData = {
        userId: user.uid,
        reportId: generateReportId(),
        category: classificationResult.categoryDisplay, // Use predicted category from image classification
        categorySlug: classificationResult.category, // Store slug version for filtering
        description: description.trim(),
        imageUrls, // Array of image URLs
        imageUrl: imageUrls[0], // Keep first image as main image for backward compatibility
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        address: address,
        organizationId: selectedOrganizationId || '', // Use selected organization from navigation or empty
        organizationAssigned: '', // Will be assigned by admin
        status: 'pending',
        urgency: urgency,
        createdAt: new Date(),
        // Prediction metadata
        predictionMetadata: {
          urgency: urgency,
          isFallback: isFallback,
          predictedAt: new Date(),
        },
        // Image classification metadata
        classificationMetadata: {
          category: classificationResult.category,
          categoryDisplay: classificationResult.categoryDisplay,
          confidence: classificationResult.confidence,
          imageCount: classificationResult.imageCount,
          classifiedAt: new Date(),
        },
      };

      console.log('Storing report with image URLs:', imageUrls);

      let finalReportId = null;
      let isNewReport = true; // Track if we created a new report
      
      // If this is a duplicate, ask user if they want to link to existing report
      if (duplicateCheck.isDuplicate) {
        const shouldLink = await new Promise((resolve) => {
          const descPreview = duplicateCheck.originalReport.description?.substring(0, 100) || 'No description';
          const descSuffix = (duplicateCheck.originalReport.description?.length || 0) > 100 ? '...' : '';
          const status = duplicateCheck.originalReport.status || 'Unknown';
          
          Alert.alert(
            '⚠️ Similar Report Found',
            `A similar ${classificationResult.categoryDisplay} report already exists ${duplicateCheck.distanceText}.\n\n` +
            `Original Report:\n"${descPreview}${descSuffix}"\n\n` +
            `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}\n\n` +
            `Would you like to:\n• Link to existing report (recommended) - helps prioritize this issue\n• Submit as new report - creates separate report`,
            [
              {
                text: 'Link to Existing',
                onPress: () => resolve(true)
              },
              {
                text: 'Submit New Report',
                onPress: () => resolve(false)
              },
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(null)
              }
            ]
          );
        });
        
        // If user cancelled, stop submission
        if (shouldLink === null) {
          setLoading(false);
          return;
        }

        if (shouldLink) {
          // Link to existing report instead of creating new one
          console.log('🔗 Linking user to existing report...');
          const originalRef = doc(db, 'reports', duplicateCheck.originalReport.id);
          const originalDoc = await getDoc(originalRef);
          const originalData = originalDoc.data();
          
          const reportedByUsers = originalData.reportedByUsers || [originalData.userId];
          if (!reportedByUsers.includes(user.uid)) {
            reportedByUsers.push(user.uid);
            await updateDoc(originalRef, {
              reportedByUsers: reportedByUsers,
              reporterCount: reportedByUsers.length,
              lastReportedAt: new Date()
            });
          }
          
          finalReportId = duplicateCheck.originalReport.id;
          isNewReport = false; // This is linking, not a new report
          console.log('✅ Linked to existing report');
        } else {
          // Create new report and link as duplicate
          const docRef = await addDoc(collection(db, 'reports'), reportData);
          finalReportId = docRef.id;
          
          console.log('🔗 Linking duplicate reports...');
          await linkDuplicateReports(
            docRef.id,
            duplicateCheck.originalReport.id,
            duplicateCheck.distance
          );
          console.log('✅ Reports linked successfully');
          isNewReport = true; // This IS a new report, just linked to a duplicate
        }
      } else {
        // No duplicate, create new report
        const docRef = await addDoc(collection(db, 'reports'), reportData);
        finalReportId = docRef.id;
        isNewReport = true;
      }
      
      // Send notification to admins if organization is assigned AND we created a new report
      if (selectedOrganizationId && isNewReport) {
        console.log('🔔 Attempting to send notification to admins...');
        console.log('Organization ID:', selectedOrganizationId);
        console.log('Report ID:', finalReportId);
        
        try {
          await notifyAdminsNewReport(
            finalReportId,
            selectedOrganizationId,
            classificationResult.categoryDisplay,
            urgency,
            user.uid  // Pass current user ID (the reporter)
          );
          console.log('✅ Admin notification sent successfully');
        } catch (err) {
          console.error('❌ Failed to send notification to admins:', err);
          console.error('Error details:', err.message);
          // Don't fail the submission if notification fails
        }
      } else {
        if (!selectedOrganizationId) {
          console.log('ℹ️ No organization selected - skipping admin notification');
        }
        if (!isNewReport) {
          console.log('ℹ️ Linked to existing report - skipping admin notification');
        }
      }
      
      // Clear form immediately after successful submission
      setImages([]);
      setDescription('');
      setDescriptionQuality(null);
      setLocation(null);
      setAddress('');
      setSearchAddress('');
      setClassificationResult(null);
      
      Alert.alert(
        'Success', 
        'Report submitted successfully!',
        [
          {
            text: 'View My Reports',
            onPress: () => navigation.navigate('MyReports'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } catch (err) {
      console.error('Submit error:', err);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ ...styles.scrollContent, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
        {selectedOrganizationId && organizationName && (
          <View style={styles.orgBanner}>
            <Text style={styles.orgBannerIcon}>🏢</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.orgBannerLabel}>Reporting to:</Text>
              <Text style={styles.orgBannerName}>{organizationName}</Text>
            </View>
          </View>
        )}
        
        <Text style={styles.label}>Issue Description *</Text>
        <Text style={styles.helperText}>
          💡 Tip: Be specific! Include urgency level, extent of damage, and safety concerns.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Example: 🚨 URGENT - Large water main burst flooding street, traffic blocked, needs immediate attention"
          multiline
          value={description}
          onChangeText={handleDescriptionChange}
          maxLength={500}
          returnKeyType="next"
          textAlignVertical="top"
        />
        <View style={styles.descriptionFooter}>
          <Text style={styles.charCount}>{description.length}/500</Text>
          {descriptionQuality && (
            <Text style={
              descriptionQuality.quality === 'excellent' ? styles.qualityExcellent :
              descriptionQuality.quality === 'good' ? styles.qualityGood :
              descriptionQuality.quality === 'fair' ? styles.qualityFair :
              styles.qualityNeedsImprovement
            }>
              {descriptionQuality.quality === 'excellent' && '✅ Excellent'}
              {descriptionQuality.quality === 'good' && '✓ Good description'}
              {descriptionQuality.quality === 'fair' && '⚠ Fair - Add urgency level or severity'}
              {descriptionQuality.quality === 'needs_improvement' && '⚠ Needs improvement - Mention urgency/severity/impact'}
            </Text>
          )}
        </View>
        {description.length > 0 && description.length < 20 && (
          <Text style={styles.warningText}>
            ⚠️ Add more details for better urgency detection
          </Text>
        )}


        <TouchableOpacity style={styles.imageButton} onPress={showImagePickerOptions}>
          <Text style={styles.imageButtonText}>📷 Add Images * ({images.length})</Text>
        </TouchableOpacity>
        
        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            <Text style={styles.imagesLabel}>📷 Selected Images ({images.length})</Text>
            {images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.image} />
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => setImages(prevImages => prevImages.filter((_, i) => i !== index))}
                >
                  <Text style={styles.removeButtonText}>✕ Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Image Classification Results */}
        {images.length > 0 && (
          <View style={styles.classificationSection}>
            <Text style={styles.classificationTitle}>🤖 AI Image Classification</Text>
            
            {classifying && (
              <View style={styles.classifyingContainer}>
                <ActivityIndicator size="small" color="#6C5CE7" />
                <Text style={styles.classifyingText}>Analyzing images...</Text>
              </View>
            )}

            {!classifying && classificationResult && (
              <>
                {classificationResult.success ? (
                  <View style={styles.classificationSuccess}>
                    <View style={styles.classificationRow}>
                      <Text style={styles.classificationLabel}>Problem Type:</Text>
                      <Text style={styles.classificationCategory}>
                        {classificationResult.categoryDisplay}
                      </Text>
                    </View>
                    <View style={styles.classificationRow}>
                      <Text style={styles.classificationLabel}>Confidence:</Text>
                      <Text style={[
                        styles.classificationConfidence,
                        classificationResult.confidence >= 0.9 ? styles.confidenceHigh :
                        classificationResult.confidence >= 0.8 ? styles.confidenceMedium :
                        styles.confidenceLow
                      ]}>
                        {(classificationResult.confidence * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <Text style={styles.classificationNote}>
                      ✅ All images validated successfully
                    </Text>
                  </View>
                ) : (
                  <View style={styles.classificationError}>
                    <Text style={styles.classificationErrorTitle}>
                      {classificationResult.multipleCategories && '⚠️ Multiple Problem Types'}
                      {classificationResult.belowThreshold && '⚠️ Low Confidence'}
                      {!classificationResult.multipleCategories && !classificationResult.belowThreshold && '❌ Classification Failed'}
                    </Text>
                    <Text style={styles.classificationErrorText}>
                      {classificationResult.error}
                    </Text>
                    {classificationResult.multipleCategories && (
                      <Text style={styles.classificationErrorSubtext}>
                        Detected: {classificationResult.categoriesDisplay.join(', ')}
                      </Text>
                    )}
                    {classificationResult.belowThreshold && (
                      <Text style={styles.classificationErrorSubtext}>
                        Minimum 80% confidence required. Current: {(classificationResult.minConfidence * 100).toFixed(1)}%
                      </Text>
                    )}
                  </View>
                )}
              </>
            )}
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
            returnKeyType="search"
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
              (images.length === 0 || !description.trim() || !location) && styles.submitButtonDisabled
            ]} 
            onPress={handleSubmit}
            disabled={images.length === 0 || !description.trim() || !location || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Submit Report</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>ℹ️ Admin will assign this report to the appropriate organization</Text>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: { 
    gap: 12, 
    padding: 16,
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600',
    color: '#333'
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
  descriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -8,
  },
  helperText: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 8,
    fontStyle: 'italic'
  },
  warningText: {
    fontSize: 11,
    color: '#FF9800',
    marginTop: 4,
    fontStyle: 'italic'
  },
  qualityExcellent: {
    fontSize: 11,
    color: '#28A745',
    fontWeight: '600',
  },
  qualityGood: {
    fontSize: 11,
    color: '#17A2B8',
    fontWeight: '600',
  },
  qualityFair: {
    fontSize: 11,
    color: '#FFC107',
    fontWeight: '600',
  },
  qualityNeedsImprovement: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
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
  imagesContainer: {
    gap: 10,
  },
  imagesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
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
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  infoBox: {
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    fontSize: 13,
    color: '#0066CC',
    lineHeight: 18,
  },
  orgBanner: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orgBannerIcon: {
    fontSize: 32,
  },
  orgBannerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  orgBannerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28A745',
  },
  predictionSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  predictButton: {
    backgroundColor: '#6C5CE7',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  predictButtonDisabled: {
    backgroundColor: '#CCC',
  },
  predictButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  predictButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  predictionResult: {
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
    marginBottom: 8,
  },
  predictionResultFallback: {
    backgroundColor: '#FFF3E0',
    borderLeftColor: '#FF9800',
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  predictionValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '700',
  },
  urgencyHigh: {
    color: '#DC3545',
  },
  urgencyMedium: {
    color: '#FF9800',
  },
  urgencyLow: {
    color: '#28A745',
  },
  fallbackNote: {
    fontSize: 11,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 4,
  },
  predictionError: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#DC3545',
    marginBottom: 8,
  },
  predictionErrorText: {
    fontSize: 13,
    color: '#DC3545',
    fontWeight: '600',
    marginBottom: 4,
  },
  predictionErrorSubtext: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  predictionNote: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  classificationSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  classificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  classifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  classifyingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  classificationSuccess: {
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
  },
  classificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  classificationLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  classificationCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28A745',
  },
  classificationConfidence: {
    fontSize: 15,
    fontWeight: '700',
  },
  confidenceHigh: {
    color: '#28A745',
  },
  confidenceMedium: {
    color: '#FF9800',
  },
  confidenceLow: {
    color: '#DC3545',
  },
  classificationNote: {
    fontSize: 12,
    color: '#28A745',
    fontStyle: 'italic',
    marginTop: 4,
  },
  classificationError: {
    backgroundColor: '#FFEBEE',
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  classificationErrorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC3545',
    marginBottom: 6,
  },
  classificationErrorText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  classificationErrorSubtext: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
});

export default ReportForm;
