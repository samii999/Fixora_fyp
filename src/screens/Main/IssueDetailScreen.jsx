import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';

const IssueDetailScreen = () => {
  const route = useRoute();
  const { issue } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{issue.title}</Text>

      {issue.imageUrl && (
        <Image
          source={{ uri: issue.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <Text style={styles.label}>Description:</Text>
      <Text style={styles.text}>{issue.description}</Text>

      <Text style={styles.label}>Location:</Text>
      <Text style={styles.text}>{issue.address || 'Not available'}</Text>

      <Text style={styles.label}>Reported At:</Text>
      <Text style={styles.text}>{new Date(issue.createdAt?.seconds * 1000).toLocaleString()}</Text>
    </ScrollView>
  );
};

export default IssueDetailScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginBottom: 15,
  },
  label: {
    fontWeight: '600',
    marginTop: 10,
  },
  text: {
    marginBottom: 10,
    fontSize: 16,
  },
});
