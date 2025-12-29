import { StyleSheet, Dimensions } from 'react-native';
import { colors, gradients, theme } from '../../styles/globalStyles';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  // Screen container
  container: {
    flex: 1,
    backgroundColor: colors.primaryGradient[0],
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Header styles
  appBar: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    ...theme.typography.h2,
    color: colors.text.primary,
    opacity: 0.8,
  },
  userName: {
    ...theme.typography.h1,
    fontSize: 28,
    color: colors.white,
    marginTop: 4,
  },
  wave: {
    fontSize: 28,
  },
  
  // Profile button
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  
  // Search bar
  searchBar: {
    ...theme.glassEffect,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.text.primary,
    fontSize: 16,
    marginLeft: 10,
  },
  
  // Stats cards
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 30,
  },
  statCard: {
    ...theme.glassEffect,
    width: '30%',
    padding: 15,
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  statValue: {
    ...theme.typography.h2,
    fontSize: 22,
    marginBottom: 4,
  },
  statLabel: {
    ...theme.typography.caption,
    color: colors.text.secondary,
  },
  
  // Section header
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    ...theme.typography.h2,
    fontSize: 20,
    color: colors.text.primary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    ...theme.typography.body,
    color: colors.accent,
    marginRight: 4,
  },
  
  // Issue card
  issuesList: {
    paddingBottom: 20,
  },
  issueCard: {
    ...theme.glassEffect,
    marginBottom: 15,
    padding: 16,
    borderRadius: 16,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  issueTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  issueTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  issueDescription: {
    ...theme.typography.body,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  issueLocation: {
    ...theme.typography.caption,
    color: colors.text.muted,
    marginLeft: 4,
  },
  issueDate: {
    ...theme.typography.caption,
    color: colors.text.muted,
    marginLeft: 4,
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyAnimation: {
    width: 200,
    height: 200,
  },
  emptyStateText: {
    ...theme.typography.h2,
    fontSize: 20,
    color: colors.text.primary,
    marginTop: 20,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    ...theme.typography.body,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  
  // FAB (Floating Action Button)
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryGradient[0],
  },
  
  // Wave animation for background
  waveAnimation: {
    position: 'absolute',
    width: 1000,
    height: 1000,
    backgroundColor: 'rgba(0, 212, 255, 0.03)',
    borderRadius: 400,
    bottom: -600,
    right: -500,
  },
});
