import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Animated,
  TextInput,
  Dimensions,
  StatusBar,
  SafeAreaView,
  StyleSheet,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import { useAuth } from '../../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import globalStyles from '../../../styles/globalStyles';

// Destructure frequently used styles and theme variables
const { 
  colors, 
  gradients, 
  typography, 
  spacing, 
  radius,
  glassEffect,
  ...styles 
} = globalStyles;

const HomeScreen = ({ navigation }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const fabPulse = useRef(new Animated.Value(0)).current;
  
  // Header animation
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [160, 100],
    extrapolate: 'clamp',
  });
  
  const headerTitleSize = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [32, 24],
    extrapolate: 'clamp',
  });

  // Fetch issues from Firestore
  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const issuesRef = collection(db, 'issues');
      const q = query(
        issuesRef,
        where('reportedBy', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const issuesList = [];
      querySnapshot.forEach((doc) => {
        issuesList.push({ id: doc.id, ...doc.data() });
      });
      
      setIssues(issuesList);
      
      // Trigger animations after data loads
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Start pulsing animation for FAB
      Animated.loop(
        Animated.sequence([
          Animated.timing(fabPulse, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(fabPulse, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
    } catch (error) {
      console.error('Error fetching issues:', error);
      alert('Failed to fetch issues. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.uid]);

  // Fetch issues on focus
  useFocusEffect(
    useCallback(() => {
      fetchIssues();
      
      // Start pulsing animation for FAB
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(fabPulse, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(fabPulse, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      
      pulse.start();
      return () => pulse.stop();
    }, [fetchIssues])
  );

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchIssues();
  }, [fetchIssues]);

  // Get status color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return colors.status.pending;
      case 'in_progress':
        return colors.status.in_progress;
      case 'resolved':
        return colors.status.resolved;
      case 'rejected':
        return colors.status.rejected;
      default:
        return colors.status.default;
    }
  };

  // Get status display text
  const getStatusText = (status) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render issue card
  const renderIssueCard = ({ item, index }) => {
    const inputRange = [-1, 0, 100 * index, 100 * (index + 3.5)];
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0],
    });
    
    return (
      <Animated.View 
        style={[
          componentStyles.issueCard,
          { 
            opacity: fadeAnim,
            transform: [{ scale }],
            marginBottom: index === issues.length - 1 ? 100 : spacing.md,
          }
        ]}
      >
        <View style={componentStyles.issueHeader}>
          <Text style={componentStyles.issueTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={componentStyles.statusBadge(item.status)}>
            <Text style={componentStyles.statusText(item.status)}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        
        {item.description && (
          <Text style={componentStyles.issueDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={componentStyles.issueFooter}>
          <Text style={componentStyles.dateText}>
            {new Date(item.createdAt?.toDate()).toLocaleDateString()}
          </Text>
          <TouchableOpacity 
            style={componentStyles.viewButton}
            onPress={() => navigation.navigate('IssueDetails', { issueId: item.id })}
          >
            <Text style={componentStyles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={componentStyles.emptyContainer}>
      <LottieView
        source={require('../../../../assets/animations/empty.json')}
        autoPlay
        loop
        style={componentStyles.emptyIllustration}
      />
      <Text style={componentStyles.emptyTitle}>No Issues Found</Text>
      <Text style={componentStyles.emptyText}>
        You haven't reported any issues yet. Tap the + button to report one.
      </Text>
      <TouchableOpacity 
        style={componentStyles.emptyButton}
        onPress={() => navigation.navigate('ReportIssue')}
      >
        <Text style={componentStyles.emptyButtonText}>Report an Issue</Text>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (loading && issues.length === 0) {
    return (
      <View style={componentStyles.loadingContainer}>
        <LottieView
          source={require('../../../../assets/animations/loading.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.md }]}>
          Loading your issues...
        </Text>
      </View>
    );
  }

  // Calculate pulse animation for FAB
  const pulse = fabPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primaryGradient[0] }}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Gradient Background */}
      <LinearGradient
        colors={gradients.primary}
        style={[StyleSheet.absoluteFill, { opacity: 0.9 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          componentStyles.header,
          { 
            height: headerHeight,
            paddingTop: StatusBar.currentHeight || spacing.xl,
          }
        ]}
      >
        <View style={componentStyles.headerContent}>
          <View>
            <Text style={[typography.caption, { color: colors.text.muted }]}>
              Welcome back,
            </Text>
            <Animated.Text 
              style={[
                typography.h1, 
                { 
                  fontSize: headerTitleSize, 
                  lineHeight: headerTitleSize,
                  marginTop: spacing.xs,
                  color: colors.text.primary,
                }
              ]}
              numberOfLines={1}
            >
              {user?.displayName || 'User'}
            </Animated.Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')}
            style={componentStyles.avatarContainer}
          >
            <Image 
              source={{ uri: user?.photoURL || 'https://i.pravatar.cc/150?img=32' }} 
              style={componentStyles.avatar}
            />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={componentStyles.searchContainer}>
          <Feather name="search" size={20} color={colors.text.muted} style={componentStyles.searchIcon} />
          <TextInput
            style={componentStyles.searchInput}
            placeholder="Search issues..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </Animated.View>
      
      {/* Stats Cards */}
      <View style={componentStyles.statsContainer}>
        <View style={componentStyles.statCard}>
          <Text style={componentStyles.statValue}>{issues.length}</Text>
          <Text style={componentStyles.statLabel}>Total Issues</Text>
        </View>
        <View style={componentStyles.statCard}>
          <Text style={componentStyles.statValue}>
            {issues.filter(issue => issue.status === 'resolved').length}
          </Text>
          <Text style={componentStyles.statLabel}>Resolved</Text>
        </View>
      </View>
      
      {/* Issues List */}
      <Animated.FlatList
        data={issues}
        renderItem={renderIssueCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={componentStyles.listContent}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <Text style={[typography.h2, { marginBottom: spacing.lg, marginTop: spacing.sm }]}>
            Recent Issues
          </Text>
        }
        ListEmptyComponent={renderEmptyState}
      />
      
      {/* Floating Action Button */}
      <Animated.View 
        style={[
          componentStyles.fabContainer,
          {
            transform: [{ scale: fabScale }],
          }
        ]}
      >
        <Animated.View 
          style={[
            componentStyles.fabPulse,
            {
              transform: [{ scale: pulse }],
              opacity: fabPulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 0],
              }),
            }
          ]} 
        />
        <TouchableOpacity 
          style={componentStyles.fab}
          onPress={() => navigation.navigate('ReportIssue')}
          activeOpacity={0.8}
          onPressIn={() => {
            Animated.spring(fabScale, {
              toValue: 0.9,
              useNativeDriver: true,
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(fabScale, {
              toValue: 1,
              useNativeDriver: true,
            }).start();
          }}
        >
          <LinearGradient
            colors={gradients.accent}
            style={componentStyles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="plus" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

// Component-specific styles
const componentStyles = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryGradient[0],
  },
  
  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 32, 39, 0.8)',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
    paddingVertical: spacing.sm,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.xl,
    marginBottom: spacing.lg,
    zIndex: 5,
  },
  statCard: {
    ...glassEffect,
    width: '48%',
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  statValue: {
    ...typography.h1,
    fontSize: 32,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  
  // List
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: 100,
  },
  
  // Issue Card
  issueCard: {
    ...glassEffect,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  issueTitle: {
    ...typography.h2,
    fontSize: 18,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  issueDescription: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  viewButtonText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  statusBadge: (status) => ({
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.pill,
    backgroundColor: getStatusColor(status) + '20',
    borderWidth: 1,
    borderColor: getStatusColor(status) + '40',
  }),
  statusText: (status) => ({
    ...typography.caption,
    color: getStatusColor(status),
    fontWeight: '600',
  }),
  dateText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyIllustration: {
    width: 200,
    height: 200,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    ...glassEffect,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  emptyButtonText: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  
  // FAB
  fabContainer: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPulse: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.accent,
    opacity: 0.6,
  },
});

// Helper function to get status color (moved outside to be used in styles)
const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return '#FFC107';
    case 'in_progress':
      return '#00d4ff';
    case 'resolved':
      return '#4CAF50';
    case 'rejected':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
};

export default HomeScreen;
