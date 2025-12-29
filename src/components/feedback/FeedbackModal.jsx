import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { submitFeedback } from '../../services/feedbackService';
import { uploadImageToStorage } from '../../services/issueService';

const FeedbackModal = ({ visible, onClose, feedbackRequest, onSubmitSuccess }) => {
  const [isResolved, setIsResolved] = useState(null); // true/false/null
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [shouldResubmit, setShouldResubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (isResolved === null) {
      Alert.alert('Required', 'Please indicate if the problem was fixed');
      return;
    }

    if (rating === 0) {
      Alert.alert('Required', 'Please provide a rating');
      return;
    }

    setSubmitting(true);
    try {
      // Upload additional images if any
      let uploadedImageUrls = [];
      if (additionalImages.length > 0) {
        uploadedImageUrls = await Promise.all(
          additionalImages.map(img => uploadImageToStorage(img.uri))
        );
      }

      // Submit feedback
      const result = await submitFeedback(
        feedbackRequest.id,
        feedbackRequest.reportId,
        {
          isResolved,
          rating,
          comment: comment.trim(),
          additionalImages: uploadedImageUrls,
          wouldRecommend
        },
        shouldResubmit
      );

      if (result.success) {
        const message = isResolved 
          ? 'Your feedback has been submitted successfully. Thank you for helping us improve!'
          : shouldResubmit
          ? 'A new report has been created and our team has been notified. We\'ll address this issue promptly.'
          : 'We\'ve received your feedback. Our team will review and address this issue.';
        
        Alert.alert(
          'Thank You!',
          message,
          [{ text: 'OK', onPress: () => {
            onSubmitSuccess?.();
            onClose();
          }}]
        );
      } else {
        Alert.alert('Error', 'Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll permissions are required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAdditionalImages([...additionalImages, result.assets[0]]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Text style={styles.starText}>
              {star <= rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!feedbackRequest) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>📝 Feedback Request</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reportInfo}>
              <Text style={styles.reportInfoLabel}>Report Details:</Text>
              <Text style={styles.reportInfoText}>{feedbackRequest.reportCategory}</Text>
              <Text style={styles.reportInfoLocation}>{feedbackRequest.reportLocation}</Text>
              <Text style={styles.reportInfoDescription} numberOfLines={2}>
                {feedbackRequest.reportDescription}
              </Text>
            </View>

            {/* Resolution Question */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Was the problem fixed? *</Text>
              <View style={styles.resolutionButtons}>
                <TouchableOpacity
                  style={[
                    styles.resolutionButton,
                    isResolved === true && styles.resolutionButtonYes
                  ]}
                  onPress={() => setIsResolved(true)}
                >
                  <Text style={[
                    styles.resolutionButtonText,
                    isResolved === true && styles.resolutionButtonTextSelected
                  ]}>
                    ✓ Yes, Fixed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.resolutionButton,
                    isResolved === false && styles.resolutionButtonNo
                  ]}
                  onPress={() => setIsResolved(false)}
                >
                  <Text style={[
                    styles.resolutionButtonText,
                    isResolved === false && styles.resolutionButtonTextSelected
                  ]}>
                    ✗ Not Fixed
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Rate the {isResolved ? 'resolution quality' : 'response'} *
              </Text>
              {renderStars()}
              <Text style={styles.ratingLabel}>
                {rating === 0 && 'Tap to rate'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </Text>
            </View>

            {/* Comment */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Additional Comments {isResolved === false && '(Please explain what\'s wrong)'}
              </Text>
              <TextInput
                style={styles.commentInput}
                placeholder={
                  isResolved === false
                    ? "Please describe what still needs to be fixed..."
                    : "Any additional feedback or suggestions..."
                }
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>

            {/* Resubmit Option */}
            {isResolved === false && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Would you like to resubmit this issue?</Text>
                <Text style={styles.helperText}>
                  Create a new report so our team can address the problem again
                </Text>
                <TouchableOpacity
                  style={[
                    styles.resubmitCheckbox,
                    shouldResubmit && styles.resubmitCheckboxChecked
                  ]}
                  onPress={() => setShouldResubmit(!shouldResubmit)}
                >
                  <View style={styles.checkboxBox}>
                    {shouldResubmit && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.resubmitCheckboxText}>
                    Yes, resubmit this issue as a new report
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Additional Images */}
            {isResolved === false && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Add Photos (Optional)</Text>
                <Text style={styles.helperText}>
                  Show us what still needs to be fixed
                </Text>
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={handleAddImage}
                >
                  <Text style={styles.addImageButtonText}>
                    📷 Add Photo ({additionalImages.length})
                  </Text>
                </TouchableOpacity>
                {additionalImages.length > 0 && (
                  <View style={styles.imagesContainer}>
                    {additionalImages.map((img, index) => (
                      <View key={index} style={styles.imageWrapper}>
                        <Image source={{ uri: img.uri }} style={styles.image} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() =>
                            setAdditionalImages(additionalImages.filter((_, i) => i !== index))
                          }
                        >
                          <Text style={styles.removeImageButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Recommendation */}
            {isResolved === true && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Would you recommend our service to others?
                </Text>
                <View style={styles.recommendButtons}>
                  <TouchableOpacity
                    style={[
                      styles.recommendButton,
                      wouldRecommend === true && styles.recommendButtonYes
                    ]}
                    onPress={() => setWouldRecommend(true)}
                  >
                    <Text style={[
                      styles.recommendButtonText,
                      wouldRecommend === true && styles.recommendButtonTextSelected
                    ]}>
                      👍 Yes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.recommendButton,
                      wouldRecommend === false && styles.recommendButtonNo
                    ]}
                    onPress={() => setWouldRecommend(false)}
                  >
                    <Text style={[
                      styles.recommendButtonText,
                      wouldRecommend === false && styles.recommendButtonTextSelected
                    ]}>
                      👎 No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isResolved === null || rating === 0 || submitting) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isResolved === null || rating === 0 || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  reportInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  reportInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  reportInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reportInfoLocation: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 2,
  },
  reportInfoDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  resolutionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resolutionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  resolutionButtonYes: {
    backgroundColor: '#28A745',
    borderColor: '#28A745',
  },
  resolutionButtonNo: {
    backgroundColor: '#DC3545',
    borderColor: '#DC3545',
  },
  resolutionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  resolutionButtonTextSelected: {
    color: '#fff',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  starText: {
    fontSize: 36,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    backgroundColor: '#F8F9FA',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  addImageButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addImageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recommendButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  recommendButtonYes: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  recommendButtonNo: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  recommendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  recommendButtonTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
  resubmitCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: '#F8F9FA',
  },
  resubmitCheckboxChecked: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FF',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxCheck: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  resubmitCheckboxText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default FeedbackModal;
