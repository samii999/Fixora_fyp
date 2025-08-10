// src/screens/Auth/RoleSelectionScreen.jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window'); // Get screen width

const RoleSelectionScreen = () => {
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    navigation.navigate('Login', { role: role.toLowerCase() });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Blue Shape */}
      <View style={{ position: 'absolute', top: 0, width: '100%' }}>
        <Svg height="200" width="100%" viewBox="0 0 1440 320">
          <Path
            fill="#3B82F6"
            d="M0,128L60,144C120,160,240,192,360,181.3C480,171,600,117,720,96C840,75,960,85,1080,106.7C1200,128,1320,160,1380,176L1440,192L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
          />
        </Svg>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>Choose how you'll use Fixora</Text>

        {['User', 'Staff', 'Admin'].map((role) => (
          <TouchableOpacity
            key={role}
            onPress={() => handleRoleSelect(role)}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <LinearGradient
              colors={
                selectedRole === role
                  ? ['#2563EB', '#1E3A8A']
                  : ['#3B82F6', '#1E3A8A']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.button,
                { width: width - 40 }, // Full screen minus padding
                selectedRole === role && styles.selected
              ]}
            >
              <Text style={styles.buttonText}>{role}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20, // so buttons have margin from screen edge
    paddingTop: 50,
  },
  title: { 
    fontSize: 30, 
    marginBottom: 8, 
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    marginBottom: 50,
    color: '#CBD5E1',
    textAlign: 'center',
  },
  button: {
    paddingVertical: 18,
    marginVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selected: {
    opacity: 0.9,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 20,
    fontWeight: '700'
  },
});

export default RoleSelectionScreen;
