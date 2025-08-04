import React from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      {/* Full Screen Logo */}
      <Image 
        source={require('../../assets/icon.png')} 
        style={styles.fullScreenLogo}
        resizeMode="contain"
      />
      
      {/* Loading Indicator at bottom */}
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenLogo: {
    width: width,
    height: height,
    position: 'absolute',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
});

export default SplashScreen;
