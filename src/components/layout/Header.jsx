import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BlueHeader = ({ title, subtitle }) => (
  <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#007AFF',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#E3F2FD',
  },
});

export default BlueHeader;
