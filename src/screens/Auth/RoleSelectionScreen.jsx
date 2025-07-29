// src/screens/Auth/RoleSelectionScreen.jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const RoleSelectionScreen = () => {
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Go directly to login page with the selected role
    navigation.navigate('Login', { role });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Role</Text>
      <Text style={styles.subtitle}>Choose how you'll use Fixora</Text>

      {['User', 'Staff', 'Admin'].map((role) => (
        <TouchableOpacity
          key={role}
          style={[styles.button, selectedRole === role && styles.selected]}
          onPress={() => handleRoleSelect(role)}
        >
          <Text style={styles.buttonText}>{role}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    padding: 20
  },
  title: { 
    fontSize: 28, 
    marginBottom: 10, 
    fontWeight: 'bold',
    color: '#333'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    color: '#666',
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    marginVertical: 12,
    width: '80%',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selected: {
    backgroundColor: '#0056CC',
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18,
    fontWeight: '600'
  },
});

export default RoleSelectionScreen;
