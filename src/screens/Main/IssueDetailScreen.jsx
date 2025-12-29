import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { db } from '../../config/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { checkImageUrl, getCorrectedImageUrl } from '../../utils/imageUrlFixer';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToStorage } from '../../services/issueService';
import MapView, { Marker } from 'react-native-maps';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { getDuplicateStats, getRelatedReports } from '../../services/duplicateDetectionService';
import { notifyAdminsProofUploaded, notifyUserReportResolved } from '../../services/notificationService';

const IssueDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { issueId } = route.params;
  const { user, userRole } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [proofDescription, setProofDescription] = useState('');
  const [proofImages, setProofImages] = useState([]);
  const [duplicateStats, setDuplicateStats] = useState(null);
  const [relatedReports, setRelatedReports] = useState([]);

  useEffect(() => {
    fetchIssueDetails();
  }, [issueId]);

  const fetchIssueDetails = async () => {
    try {
      setLoading(true);
      const issueDoc = await getDoc(doc(db, 'reports', issueId));
      if (issueDoc.exists()) {
        const issueData = issueDoc.data();
        setIssue({ id: issueDoc.id, ...issueData });
        
        // Fetch duplicate information
        const stats = await getDuplicateStats(issueId);
        setDuplicateStats(stats);
        
        // Fetch related reports if any
        const related = await getRelatedReports(issueId);
        setRelatedReports(related);
      } else {
        Alert.alert('Error', 'Report not found');
      }
    } catch (error) {
      console.error('Error loading report details:', error);
      Alert.alert('Error', 'Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProofImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permissions are required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProofImages([...proofImages, ...result.assets.map(a => a.uri)]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select images.');
    }
  };

  const handleProofUpload = async () => {
    try {
      if (!proofDescription.trim()) {
        Alert.alert('Description Required', 'Please enter a description for your proof of work.');
        return;
      }
      if (proofImages.length === 0) {
        Alert.alert('Image Required', 'Please add at least one image as proof.');
        return;
      }
      setUploading(true);
      const uploadedUrls = [];
      for (const uri of proofImages) {
        const url = await uploadImageToStorage(uri);
        uploadedUrls.push(url);
      }
      // Get staff member name from assignedStaff array if available
      const staffMember = issue.assignedStaff?.find(s => s.uid === user.uid);
      const staffName = staffMember?.name || user.email;
      
      const newProofs = uploadedUrls.map(url => ({
        imageUrl: url,
        description: proofDescription,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.uid,
        uploadedByName: staffName,
      }));
      const newProofImages = [...(issue.proofImages || []), ...newProofs];
      await updateDoc(doc(db, 'reports', issueId), { proofImages: newProofImages, status: 'staff_proved' });
      setIssue({ ...issue, proofImages: newProofImages, status: 'staff_proved' });
      setProofDescription('');
      setProofImages([]);
      
      // Send notification to admins
      if (issue.organizationId) {
        console.log('🔔 Sending notification to admins about proof upload...');
        notifyAdminsProofUploaded(
          issueId,
          issue.organizationId,
          staffName,
          issue.category || 'Issue',
          user.uid  // Pass current user ID (the staff who uploaded)
        ).catch(err => {
          console.error('Failed to send proof notification:', err);
        });
      }
      
      // Navigate back to staff reports screen after successful upload
      Alert.alert(
        'Success', 
        'Proof of work uploaded! The admin has been notified.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to Staff tab's Reports screen
              navigation.navigate('StaffTabs', { screen: 'Reports' });
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to upload proof of work.');
    } finally {
      setUploading(false);
    }
  };

  const handleMarkResolved = async () => {
    // Additional safety check: Ensure proof exists
    if (!issue.proofImages || !Array.isArray(issue.proofImages) || issue.proofImages.length === 0) {
      Alert.alert(
        'Cannot Resolve', 
        'Staff must upload proof of work before this report can be marked as resolved.'
      );
      return;
    }
    
    try {
      await updateDoc(doc(db, 'reports', issueId), { status: 'resolved' });
      setIssue({ ...issue, status: 'resolved' });
      
      // Send notification to user who submitted the report
      if (issue.userId) {
        console.log('🔔 Sending notification to user about report resolution...');
        notifyUserReportResolved(
          issue.userId,
          issueId,
          issue.category || 'Issue',
          issue.address || 'Unknown location',
          user.uid  // Pass current user ID (the admin who resolved)
        ).catch(err => {
          console.error('Failed to send resolution notification:', err);
        });
      }
      
      Alert.alert('Success', 'Report marked as resolved.');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as resolved.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading report details...</Text>
      </View>
    );
  }

  if (!issue) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Report not found</Text>
      </View>
    );
  }

  // Staff can upload proof if assigned and not resolved
  // Support both multi-staff and old single assignment
  const isAssignedToMe = issue.assignedStaffIds && Array.isArray(issue.assignedStaffIds) 
    ? issue.assignedStaffIds.includes(user.uid)
    : issue.organizationAssigned === user.uid;
  
  const canUploadProof = userRole === 'staff' && isAssignedToMe && (issue.status === 'in_progress' || issue.status === 'assigned');
  
  // Only show Mark as Resolved if admin, report has staff proof, and not resolved
  const canMarkResolved = userRole === 'admin' && Array.isArray(issue.proofImages) && issue.proofImages.length > 0 && issue.status !== 'resolved';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* BlueHeader is already used in parent screens, so skip here if not present */}
        <Text style={styles.title}>{issue.category || 'Issue Report'}</Text>

        {/* AI Classification Info */}
        {issue.classificationMetadata && (
          <View style={styles.classificationCard}>
            <View style={styles.classificationHeader}>
              <Text style={styles.classificationIcon}>🤖</Text>
              <Text style={styles.classificationHeaderText}>AI Classification</Text>
            </View>
            <View style={styles.classificationContent}>
              <View style={styles.classificationRow}>
                <Text style={styles.classificationLabel}>Problem Type:</Text>
                <Text style={styles.classificationValue}>
                  {issue.classificationMetadata.categoryDisplay || issue.category}
                </Text>
              </View>
              <View style={styles.classificationRow}>
                <Text style={styles.classificationLabel}>Confidence:</Text>
                <Text style={[
                  styles.classificationConfidence,
                  issue.classificationMetadata.confidence >= 0.9 ? styles.confidenceHigh :
                  issue.classificationMetadata.confidence >= 0.8 ? styles.confidenceMedium :
                  styles.confidenceLow
                ]}>
                  {(issue.classificationMetadata.confidence * 100).toFixed(1)}%
                </Text>
              </View>
              {issue.classificationMetadata.imageCount && (
                <Text style={styles.classificationNote}>
                  ✓ {issue.classificationMetadata.imageCount} image{issue.classificationMetadata.imageCount > 1 ? 's' : ''} analyzed
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Map for this report's location */}
        {issue.location && issue.location.latitude && issue.location.longitude && (
          <View>
            <View style={{ height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: issue.location.latitude,
                  longitude: issue.location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: issue.location.latitude,
                    longitude: issue.location.longitude,
                  }}
                  title={issue.category || 'Issue'}
                  description={issue.address || ''}
                />
              </MapView>
            </View>
            {/* Display address in written form */}
            {issue.address && (
              <View style={styles.addressContainer}>
                <Text style={styles.addressLabel}>📍 Location Address:</Text>
                <Text style={styles.addressText}>{issue.address}</Text>
              </View>
            )}
          </View>
        )}

        {(issue.imageUrls || issue.imageUrl) && (
          <View style={styles.imagesContainer}>
            <Text style={styles.imageLabel}>📷 Issue Images</Text>
            {(issue.imageUrls || [issue.imageUrl]).map((imageUrl, index) => {
              const correctedUrl = getCorrectedImageUrl(imageUrl);
              return (
                <View key={index} style={styles.imageContainer}>
                  <Image
                    source={{ uri: correctedUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* Proof of Work Section */}
        {issue.proofImages && issue.proofImages.length > 0 && (
          <View style={styles.imagesContainer}>
            <Text style={styles.imageLabel}>🛠️ Proof of Work ({issue.proofImages.length})</Text>
            {issue.proofImages.map((proof, idx) => (
              <View key={idx} style={styles.proofCard}>
                <Image
                  source={{ uri: getCorrectedImageUrl(proof.imageUrl || proof) }}
                  style={styles.image}
                  resizeMode="cover"
                />
                {proof.uploadedByName && (
                  <Text style={styles.proofUploader}>
                    👤 Uploaded by: {proof.uploadedByName}
                  </Text>
                )}
                {proof.description && (
                  <Text style={styles.proofDescription}>{proof.description}</Text>
                )}
                {proof.uploadedAt && (
                  <Text style={styles.proofTimestamp}>
                    📅 {new Date(proof.uploadedAt).toLocaleString()}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.label}>Description:</Text>
        <Text style={styles.text}>{issue.description}</Text>

        <Text style={styles.label}>Category:</Text>
        <Text style={styles.text}>{issue.category || 'General'}</Text>

        <Text style={styles.label}>Status:</Text>
        <Text style={[styles.text, { color: getStatusColor(issue.status) }]}>
          {getStatusText(issue.status)}
        </Text>

        {/* Admin Note for Staff */}
        {issue.adminNote && userRole === 'staff' && (
          <View style={styles.adminNoteContainer}>
            <Text style={styles.adminNoteLabel}>📋 Admin Instructions:</Text>
            <Text style={styles.adminNoteText}>{issue.adminNote}</Text>
          </View>
        )}

        {/* Staff Proof Upload Button */}
        {canUploadProof && (
          <View style={{ marginTop: 15 }}>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
                fontSize: 16,
              }}
              placeholder="Describe the work you did..."
              value={proofDescription}
              onChangeText={setProofDescription}
              editable={!uploading}
              multiline
            />
            <TouchableOpacity
              style={{
                backgroundColor: '#F0F8FF',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#E3F2FD',
              }}
              onPress={handleAddProofImage}
              disabled={uploading}
            >
              <Text style={{ color: '#007AFF', fontWeight: '600' }}>Add Images</Text>
            </TouchableOpacity>
            {/* Show selected images */}
            {proofImages.length > 0 && (
              <ScrollView horizontal style={{ marginBottom: 10 }}>
                {proofImages.map((uri, idx) => (
                  <Image
                    key={idx}
                    source={{ uri }}
                    style={{ width: 80, height: 80, borderRadius: 8, marginRight: 8 }}
                  />
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.proofButton} onPress={handleProofUpload} disabled={uploading}>
              <Text style={styles.proofButtonText}>{uploading ? 'Uploading...' : 'Upload Proof of Work'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Admin Mark as Resolved Button */}
        {canMarkResolved && (
          <TouchableOpacity style={styles.resolveButton} onPress={handleMarkResolved}>
            <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return '#FF9500';
    case 'assigned':
      return '#9C27B0';
    case 'in_progress':
      return '#007AFF';
    case 'resolved':
      return '#28A745';
    case 'rejected':
      return '#FF3B30';
    case 'withdrawn':
      return '#8E8E93';
    default:
      return '#666';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'assigned':
      return 'Assigned';
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    case 'rejected':
      return 'Rejected';
    case 'withdrawn':
      return 'Withdrawn';
    default:
      return status;
  }
};

export default IssueDetailScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  imagesContainer: {
    marginBottom: 15,
  },
  imageContainer: {
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 10,
  },
  imageLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 10,
    color: '#999',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  imageUrlText: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  label: {
    fontWeight: '600',
    marginTop: 10,
    fontSize: 16,
  },
  text: {
    marginBottom: 10,
    fontSize: 16,
  },
  proofButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  proofButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resolveButton: {
    backgroundColor: '#28A745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  resolveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  adminNoteContainer: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFE9A8',
  },
  adminNoteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 6,
  },
  adminNoteText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  proofCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  proofUploader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
    marginBottom: 4,
  },
  proofDescription: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#333',
    marginTop: 4,
    lineHeight: 20,
  },
  proofTimestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  classificationCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  classificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  classificationIcon: {
    fontSize: 20,
  },
  classificationHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  classificationContent: {
    paddingLeft: 28,
  },
  classificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  classificationLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  classificationValue: {
    fontSize: 15,
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
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
