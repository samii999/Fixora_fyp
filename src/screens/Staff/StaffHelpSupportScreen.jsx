import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';

const StaffHelpSupportScreen = ({ navigation }) => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const faqs = [
    {
      id: 1,
      question: 'How do I accept assigned tasks?',
      answer: 'Tasks assigned to you will appear on your home screen. Tap on the task card to view details and use the "Accept" button to start working on it.',
    },
    {
      id: 2,
      question: 'How do I update task status?',
      answer: 'Open the task from your home screen, tap on the status dropdown, and select the appropriate status (In Progress, Completed, etc.). Add notes if required.',
    },
    {
      id: 3,
      question: 'Can I request time off or leave?',
      answer: 'Currently, leave management is handled by your administrator. Please contact them directly through the contact methods below.',
    },
    {
      id: 4,
      question: 'How do I report issues with the app?',
      answer: 'Use the "Submit Feedback" form below or contact support via email. Include screenshots and detailed descriptions to help us resolve issues faster.',
    },
    {
      id: 5,
      question: 'What if I forget my password?',
      answer: 'Use the "Forgot Password" option on the login screen. You\'ll receive an email with instructions to reset your password.',
    },
  ];

  const contactMethods = [
    {
      id: 1,
      icon: '📧',
      title: 'Email Support',
      subtitle: 'support@fixora.com',
      action: () => Linking.openURL('mailto:support@fixora.com'),
    },
    {
      id: 2,
      icon: '📞',
      title: 'Phone Support',
      subtitle: '+1 (555) 123-4567',
      action: () => Linking.openURL('tel:+15551234567'),
    },
    {
      id: 3,
      icon: '💬',
      title: 'Live Chat',
      subtitle: 'Chat with us',
      action: () => Alert.alert('Coming Soon', 'Live chat feature coming soon!'),
    },
    {
      id: 4,
      icon: '🌐',
      title: 'Help Center',
      subtitle: 'Visit our website',
      action: () => Linking.openURL('https://fixora.com/help'),
    },
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      Alert.alert('Empty Feedback', 'Please enter your feedback before submitting.');
      return;
    }

    Alert.alert(
      'Feedback Submitted',
      'Thank you for your feedback! We will review it and get back to you soon.',
      [
        {
          text: 'OK',
          onPress: () => setFeedbackText(''),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Contact Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactGrid}>
            {contactMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={styles.contactCard}
                onPress={method.action}
              >
                <Text style={styles.contactIcon}>{method.icon}</Text>
                <Text style={styles.contactTitle}>{method.title}</Text>
                <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq) => (
            <View key={faq.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(faq.id)}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Text style={styles.faqIcon}>
                  {expandedFAQ === faq.id ? '−' : '+'}
                </Text>
              </TouchableOpacity>
              {expandedFAQ === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Feedback Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submit Feedback</Text>
          <Text style={styles.helperText}>
            Have suggestions or found a bug? Let us know!
          </Text>
          <TextInput
            style={styles.feedbackInput}
            value={feedbackText}
            onChangeText={setFeedbackText}
            placeholder="Type your feedback here..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitFeedback}
          >
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Resources</Text>

          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceIcon}>📖</Text>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Staff User Guide</Text>
              <Text style={styles.resourceSubtitle}>Complete guide for staff members</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceIcon}>🎥</Text>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Video Tutorials</Text>
              <Text style={styles.resourceSubtitle}>Step-by-step video guides</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceIcon}>📄</Text>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Work Guidelines</Text>
              <Text style={styles.resourceSubtitle}>Organization policies</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Fixora Staff App v1.0.0</Text>
            {'\n'}
            If you need immediate assistance, please contact your organization administrator.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StaffHelpSupportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#F8F9FA',
    flexGrow: 1,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  contactCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
  },
  contactIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    marginBottom: 12,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  faqIcon: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '300',
  },
  faqAnswer: {
    paddingBottom: 16,
    paddingRight: 24,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 120,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  resourceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resourceSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  chevron: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  infoCard: {
    backgroundColor: '#E8F0FE',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    textAlign: 'center',
  },
  infoBold: {
    fontWeight: '700',
  },
});
