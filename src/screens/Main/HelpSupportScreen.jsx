import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Linking,
  TextInput,
} from 'react-native';
import NotificationTestButton from '../../components/NotificationTestButton';

const HelpSupportScreen = ({ navigation }) => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const faqs = [
    {
      id: 1,
      question: 'How do I report an issue?',
      answer: 'To report an issue, go to the Home tab and tap the "Report Issue" button. Fill in the required details, add photos if available, and submit your report.',
    },
    {
      id: 2,
      question: 'How long does it take to resolve an issue?',
      answer: 'Resolution time depends on the severity and type of issue. Emergency issues are prioritized and typically addressed within 24-48 hours. Non-urgent issues may take 3-7 business days.',
    },
    {
      id: 3,
      question: 'Can I track the status of my report?',
      answer: 'Yes! Go to the "My Reports" tab to view all your submitted reports and their current status. You will also receive notifications when the status changes.',
    },
    {
      id: 4,
      question: 'What types of issues can I report?',
      answer: 'You can report various civic issues including potholes, broken street lights, garbage overflow, water leakage, open manholes, traffic light problems, electrical issues, and gas problems.',
    },
    {
      id: 5,
      question: 'How do I update my profile information?',
      answer: 'Go to Profile > Account Settings to update your name, phone number, address, and profile picture.',
    },
    {
      id: 6,
      question: 'Can I delete my account?',
      answer: 'Yes, you can request account deletion from Profile > Privacy & Security > Delete Account. Please note this action is permanent and cannot be undone.',
    },
    {
      id: 7,
      question: 'How do I enable/disable notifications?',
      answer: 'Go to Profile > Notification Settings to customize which notifications you want to receive.',
    },
    {
      id: 8,
      question: 'Is my data secure?',
      answer: 'Yes, we take data security seriously. All data is encrypted and stored securely. Read our Privacy Policy for more details.',
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
      subtitle: '+92-XXX-XXXXXXX',
      action: () => Linking.openURL('tel:+92XXXXXXXXXX'),
    },
    {
      id: 3,
      icon: '💬',
      title: 'Live Chat',
      subtitle: 'Available Mon-Fri, 9AM-6PM',
      action: () => Alert.alert('Live Chat', 'Live chat feature coming soon!'),
    },
    {
      id: 4,
      icon: '🌐',
      title: 'Visit Website',
      subtitle: 'www.fixora.com',
      action: () => Linking.openURL('https://www.fixora.com'),
    },
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter your feedback or question');
      return;
    }

    Alert.alert(
      'Feedback Submitted',
      'Thank you for your feedback! Our support team will respond within 24-48 hours.',
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
        {/* Notification Test Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>
          <Text style={styles.sectionDescription}>
            Having trouble receiving notifications? Test them here
          </Text>
          <NotificationTestButton />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Text style={styles.sectionDescription}>
            Choose your preferred way to reach us
          </Text>

          {contactMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={styles.contactCard}
              onPress={method.action}
            >
              <Text style={styles.contactIcon}>{method.icon}</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{method.title}</Text>
                <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {faqs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqItem}
              onPress={() => toggleFaq(faq.id)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqToggle}>
                  {expandedFaq === faq.id ? '−' : '+'}
                </Text>
              </View>
              {expandedFaq === faq.id && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Us Your Feedback</Text>
          <Text style={styles.sectionDescription}>
            Have a question or suggestion? Let us know!
          </Text>

          <TextInput
            style={styles.feedbackInput}
            value={feedbackText}
            onChangeText={setFeedbackText}
            placeholder="Type your message here..."
            placeholderTextColor="#999"
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

          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => Alert.alert('Coming Soon', 'User guide coming soon!')}
          >
            <Text style={styles.resourceIcon}>📖</Text>
            <Text style={styles.resourceText}>User Guide</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => Alert.alert('Coming Soon', 'Video tutorials coming soon!')}
          >
            <Text style={styles.resourceIcon}>🎥</Text>
            <Text style={styles.resourceText}>Video Tutorials</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => Alert.alert('Coming Soon', 'Terms of service coming soon!')}
          >
            <Text style={styles.resourceIcon}>📄</Text>
            <Text style={styles.resourceText}>Terms of Service</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => Alert.alert('Coming Soon', 'Privacy policy coming soon!')}
          >
            <Text style={styles.resourceIcon}>🔒</Text>
            <Text style={styles.resourceText}>Privacy Policy</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.infoCard}>
          <Text style={styles.appVersion}>Fixora v1.0.0</Text>
          <Text style={styles.appDescription}>
            Issue Management System
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpSupportScreen;

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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  chevron: {
    fontSize: 24,
    color: '#C7C7CC',
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  faqToggle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#007AFF',
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 120,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resourceIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  resourceText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appVersion: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 14,
    color: '#666',
  },
});
