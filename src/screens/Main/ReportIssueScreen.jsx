import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import ReportForm from '../../components/form/ReportForm';
import { useAuth } from '../../context/AuthContext'; // Fixed import path
import BlueHeader from '../../components/layout/Header';

const ReportIssueScreen = () => {
  const { user } = useAuth(); // Replace with your own auth logic or pass userId as prop

  return (
    <SafeAreaView style={styles.safe}>
      <BlueHeader title="Report an Issue" />
      <View style={styles.container}>
        <Text style={styles.title}>🛠️ Report an Issue</Text>
        <ReportForm userId={user?.uid} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
});

export default ReportIssueScreen;
