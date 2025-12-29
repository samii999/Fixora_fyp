import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const InitialSplashScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [shouldShowSplash, setShouldShowSplash] = useState(null);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const [hasSeenSplash, showVerifyMsgOnLogin] = await Promise.all([
        AsyncStorage.getItem('hasSeenInitialSplash'),
        AsyncStorage.getItem('showVerifyMsgOnLogin'),
      ]);
      
      if (hasSeenSplash === 'true') {
        // User has seen splash before
        setShouldShowSplash(false);
        // If coming from signup verification flow, send to Login so message can be shown
        if (showVerifyMsgOnLogin === 'true') {
          navigation.replace('Login');
        } else {
          // Otherwise go to role selection
          navigation.replace('RoleSelection');
        }
      } else {
        // First time, show splash
        setShouldShowSplash(true);
        await AsyncStorage.setItem('hasSeenInitialSplash', 'true');
        startAnimation();
      }
    } catch (error) {
      // If error, show splash anyway
      setShouldShowSplash(true);
      startAnimation();
    }
  };

  const startAnimation = () => {
    // Small delay to ensure app is fully loaded before starting animation
    setTimeout(() => {
      // Start fade and scale animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, 100);

    // Navigate after 4.5 seconds
    setTimeout(async () => {
      try {
        const showVerifyMsgOnLogin = await AsyncStorage.getItem('showVerifyMsgOnLogin');
        if (showVerifyMsgOnLogin === 'true') {
          navigation.replace('Login');
          return;
        }
      } catch {}
      navigation.replace('RoleSelection');
    }, 4500);
  };

  // Don't render anything if we're checking or skipping
  if (shouldShowSplash === null || shouldShowSplash === false) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/icons/logo.png')}
        style={[
          styles.logo,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background for logo visibility
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.8,
    height: height * 0.4,
  },
});

export default InitialSplashScreen;
