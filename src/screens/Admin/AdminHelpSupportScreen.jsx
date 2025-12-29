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

const AdminHelpSupportScreen = ({ navigation }) => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const faqs = [
    {
      id: 1,
      question: 'How do I add staff members to my organization?',
      answer: 'Go to Manage Staff screen from your profile. Staff members can join by entering your organization code in the Join Organization screen, and you can approve them from the pending requests section.',
    },
    {
      id: 2,
      question: 'How do I assign tasks to staff members?',
      answer: 'View any issue report, tap on it to see details, and use the "Assign to Staff" option. You can select available staff members and they will be notified of the assignment.',
    },
    {
      id: 3,
      question: 'How can I view organization analytics?',
      answer: 'Navigate to Analytics from your profile menu. You can view statistics on resolved issues, response times, staff performance, and user satisfaction ratings.',
    },
    {
      id: 4,
      question: 'How do I manage organization categories?',
      answer: 'Go to Organization Settings and select the problem categories your organization handles. This helps in filtering and assigning relevant issues.',
    },
    {
      id: 5,
      question: 'Can I export reports and data?',
      answer: 'Yes! Go to Analytics or Reports screen and use the export function. You can export data as CSV or PDF for further analysis or record-keeping.',
    },
    {
      id: 6,
      question: 'How do I manage staff permissions?',
      answer: 'Use the Manage Permissions screen from your profile. You can set different permission levels for staff members, controlling what they can view and edit.',
    },
  ];

  const contactMethods = [
    {
      id: 1,
      icon: '📧',
      title: 'Admin Support',
      subtitle: 'admin@fixora.com',
      action: () => Linking.openURL('mailto:admin@fixora.com'),
    },
    {
      id: 2,
      icon: '📞',
      title: 'Priority Support',
      subtitle: '+1 (555) 987-6543',
      action: () => Linking.openURL('tel:+15559876543'),
    },
    {
      id: 3,
      icon: '💬',
      title: 'Live Chat',
      subtitle: 'Chat with support',
      action: () => Alert.alert('Coming Soon', 'Live chat feature coming soon!'),
    },
    {
      id: 4,
      icon: '🌐',
      title: 'Admin Portal',
      subtitle: 'Visit admin portal',
      action: () => Linking.openURL('https://fixora.com/admin'),
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
      'Thank you for your feedback! As an admin, your insights help us improve the platform for everyone.',
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
          <Text style={styles.sectionTitle}>Admin Support</Text>
          <Text style={styles.helperText}>
            Get priority support for organization management
          </Text>
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
          <Text style={styles.sectionTitle}>Admin FAQs</Text>
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
          <Text style={styles.sectionTitle}>Submit Admin Feedback</Text>
          <Text style={styles.helperText}>
            Share your experience managing the organization or suggest improvements
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
          <Text style={styles.sectionTitle}>Admin Resources</Text>

          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceIcon}>📖</Text>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Admin Guide</Text>
              <Text style={styles.resourceSubtitle}>Complete organization management guide</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceIcon}>🎥</Text>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Video Tutorials</Text>
              <Text style={styles.resourceSubtitle}>Learn advanced features</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceIcon}>📊</Text>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Best Practices</Text>
              <Text style={styles.resourceSubtitle}>Tips for effective management</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceIcon}>📄</Text>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Admin Policies</Text>
              <Text style={styles.resourceSubtitle}>Guidelines and regulations</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Fixora Admin v1.0.0</Text>
            {'\n'}
            For urgent organization issues, contact priority support for immediate assistance.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminHelpSupportScreen;

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
