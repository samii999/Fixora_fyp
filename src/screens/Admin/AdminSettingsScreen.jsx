import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const AdminSettingsScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage organization settings</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={styles.settingCard}
          onPress={() => navigation.navigate('OrganizationSettings')}
          activeOpacity={0.7}
        >
          <View style={styles.settingIcon}>
            <Text style={styles.settingIconText}>🏢</Text>
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Organization Categories</Text>
            <Text style={styles.settingDescription}>
              Manage which problem types your organization handles
            </Text>
          </View>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            More settings options will be added here in future updates
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingIconText: {
    fontSize: 24,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  settingChevron: {
    fontSize: 28,
    color: '#C7C7CC',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0066CC',
    lineHeight: 20,
  },
});