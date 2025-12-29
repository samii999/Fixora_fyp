import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Image, SafeAreaView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getCorrectedImageUrl } from '../../utils/imageUrlFixer';
import BlueHeader from '../../components/layout/Header';
import { getCities, getDistricts, getVillages } from '../../services/locationService';
import { sortReportsByUrgency, getUrgencyColor, getUrgencyDisplay } from '../../utils/reportSorting';
import { getAllOrganizationsWithAdmin } from '../../services/organizationService';
import { API_CONFIG, formatCategoryName } from '../../config/apiConfig';
import { getOrganizationFeedbackStats } from '../../services/feedbackService';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user, userRole } = useAuth();
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgsError, setOrgsError] = useState('');
  // Pre-report selection state
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
  const [selectedVillageId, setSelectedVillageId] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [pendingCitySearch, setPendingCitySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [allOrgs, setAllOrgs] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [orgRatings, setOrgRatings] = useState({});

  useEffect(() => {
    fetchRecentReports();
  }, []);

  // Function to fetch organization ratings
  const fetchOrganizationRatings = useCallback(async (orgsData) => {
    try {
      const ratings = {};
      await Promise.all(
        orgsData.map(async (org) => {
          try {
            const stats = await getOrganizationFeedbackStats(org.id);
            if (stats.totalFeedbacks > 0) {
              ratings[org.id] = {
                averageRating: parseFloat(stats.averageRating),
                totalFeedbacks: stats.totalFeedbacks
              };
            }
          } catch (error) {
            console.log(`Failed to fetch rating for ${org.name}`);
          }
        })
      );
      setOrgRatings(ratings);
    } catch (error) {
      console.error('Error fetching organization ratings:', error);
    }
  }, []);

  // Load all organizations once
  useEffect(() => {
    (async () => {
      try {
        setOrgsLoading(true);
        setOrgsError('');
        const data = await getAllOrganizationsWithAdmin();
        setAllOrgs(data);
        
        // Fetch ratings for all organizations
        await fetchOrganizationRatings(data);
      } catch (e) {
        setOrgsError('Failed to load organizations');
      } finally {
        setOrgsLoading(false);
      }
    })();
  }, []);

  // Load cities for area selection
  useEffect(() => {
    (async () => {
      try {
        const list = await getCities();
        setCities(list);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedCityId) {
        setDistricts([]);
        setSelectedDistrictId(null);
        setVillages([]);
        setSelectedVillageId(null);
        return;
      }
      const list = await getDistricts(selectedCityId);
      setDistricts(list);
      setSelectedDistrictId(null);
      setVillages([]);
      setSelectedVillageId(null);
    })();
  }, [selectedCityId]);

  useEffect(() => {
    (async () => {
      if (!selectedDistrictId) {
        setVillages([]);
        setSelectedVillageId(null);
        return;
      }
      const list = await getVillages(selectedDistrictId);
      setVillages(list);
      setSelectedVillageId(null);
    })();
  }, [selectedDistrictId]);

  // Pure client-side filtering from all organizations (no geocoding)
  useEffect(() => {
    const cityName = selectedCityId ? (cities.find(x=>x.id===selectedCityId)?.name || '') : '';
    const districtName = selectedDistrictId ? (districts.find(x=>x.id===selectedDistrictId)?.name || '') : '';
    const villageName = selectedVillageId ? (villages.find(x=>x.id===selectedVillageId)?.name || '') : '';
    const areaTokens = [villageName, districtName, cityName].filter(Boolean).map(s => s.toLowerCase());

    const filtered = allOrgs.filter(o => {
      // Only show organizations with admins (handle both adminIds and adminIDs)
      const adminList = o.adminIds || o.adminIDs || [];
      
      // Strictly check: must be an array, must have length > 0, and all items must be valid
      const hasAdmins = Array.isArray(adminList) && adminList.length > 0 && 
                        adminList.every(item => {
                          if (typeof item === 'string') return item !== null && item !== undefined && item !== '';
                          if (typeof item === 'object') return item && item.name;
                          return false;
                        });
      if (!hasAdmins) return false;
      
      const byCategory = !categoryFilter || (Array.isArray(o.categories) && o.categories.includes(categoryFilter));
      const addr = String(o.address || '').toLowerCase();
      const byLocationText = !locationFilter || addr.includes(locationFilter.toLowerCase());
      const byArea = areaTokens.length === 0 || areaTokens.every(tok => addr.includes(tok));
      return byCategory && byLocationText && byArea;
    });
    setOrganizations(filtered);
    if (filtered.findIndex(o => o.id === selectedOrganizationId) === -1) setSelectedOrganizationId('');
  }, [allOrgs, categoryFilter, locationFilter, selectedCityId, selectedDistrictId, selectedVillageId, cities, districts, villages]);

  // No-op fallback removed (filtering handled above)

  const filteredCities = cities.filter(c =>
    !!citySearch && c.name.toLowerCase().includes(citySearch.trim().toLowerCase())
  );

  // Refresh reports and ratings when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchRecentReports();
      // Refetch ratings to show updated feedback
      if (allOrgs.length > 0) {
        fetchOrganizationRatings(allOrgs);
      }
    });

    return unsubscribe;
  }, [navigation, allOrgs]);

  const fetchRecentReports = async () => {
    try {
      setLoading(true);
      
      // Fetch all reports and filter in JavaScript to avoid index issues
      const reportsQuery = query(collection(db, 'reports'));
      const snapshot = await getDocs(reportsQuery);
      const allReports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter reports by this user
      const userReports = allReports.filter(report => report.userId === user.uid);
      
      // Sort by urgency (High → Medium → Low), then by date
      const sortedReports = sortReportsByUrgency(userReports).slice(0, 3); // Get only the 3 most recent
      
      setRecentReports(sortedReports);
    } catch (error) {
      console.error('Error fetching recent reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecentIssuesPress = () => {
    navigation.navigate('MyReports');
  };

  const handleReportPress = (reportId) => {
    navigation.navigate('IssueDetail', { issueId: reportId });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentReports();
    // Also refresh organization ratings
    if (allOrgs.length > 0) {
      await fetchOrganizationRatings(allOrgs);
    }
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <BlueHeader title="Fixora" subtitle="Issue Management System" />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.email || 'User'}!
          </Text>
          <Text style={styles.roleText}>Role: {userRole}</Text>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          {/* Filters */}
          <Text style={{ fontSize: 14, color: '#333', marginBottom: 8 }}>Problem Category</Text>
          <View style={styles.inlineChips}>
            <TouchableOpacity
              key="all"
              style={[styles.smallChip, categoryFilter === '' && styles.smallChipSelected]}
              onPress={() => setCategoryFilter('')}
            >
              <Text style={[styles.smallChipText, categoryFilter === '' && styles.smallChipTextSelected]}>All</Text>
            </TouchableOpacity>
            {API_CONFIG.IMAGE_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.smallChip, categoryFilter === cat && styles.smallChipSelected]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text style={[styles.smallChipText, categoryFilter === cat && styles.smallChipTextSelected]}>
                  {formatCategoryName(cat)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: 14, color: '#333', marginTop: 8, marginBottom: 6 }}>Location (text search)</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.searchInput, { flex: 1 }]
              }
              placeholder="Search by address/city..."
              value={locationFilter}
              onChangeText={setLocationFilter}
              returnKeyType="search"
            />
          </View>


          {selectedCityId ? (
            <>
              <Text style={{ fontSize: 14, color: '#333', marginTop: 8, marginBottom: 6 }}>Select District</Text>
              <View style={styles.inlineChips}>
                {districts.map(d => (
                  <TouchableOpacity key={d.id} style={[styles.smallChip, selectedDistrictId===d.id && styles.smallChipSelected]} onPress={()=>setSelectedDistrictId(d.id)}>
                    <Text style={[styles.smallChipText, selectedDistrictId===d.id && styles.smallChipTextSelected]}>{d.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          {selectedDistrictId ? (
            <>
              <Text style={{ fontSize: 14, color: '#333', marginTop: 8, marginBottom: 6 }}>Select Village (optional)</Text>
              <View style={styles.inlineChips}>
                {villages.map(v => (
                  <TouchableOpacity key={v.id} style={[styles.smallChip, selectedVillageId===v.id && styles.smallChipSelected]} onPress={()=>setSelectedVillageId(v.id)}>
                    <Text style={[styles.smallChipText, selectedVillageId===v.id && styles.smallChipTextSelected]}>{v.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          {/* Organizations list */}
          <Text style={{ fontSize: 14, color: '#333', marginTop: 12, marginBottom: 6 }}>Organizations</Text>
          {organizations.length === 0 ? (
            <Text style={{ fontSize: 12, color: '#FF9800', fontStyle: 'italic', marginBottom: 8 }}>
              {(selectedCityId || selectedDistrictId || selectedVillageId || categoryFilter || locationFilter) 
                ? 'No organization found for the selected filters' 
                : 'No organizations available yet'}
            </Text>
          ) : (
            <View style={{ gap: 10, marginBottom: 8 }}>
              {organizations.map(org => (
                <TouchableOpacity
                  key={org.id}
                  style={styles.orgCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('ReportIssue', { preselected: { organizationId: org.id, cityId: selectedCityId, districtId: selectedDistrictId, villageId: selectedVillageId } })}
                >
                  <View style={styles.orgHeader}>
                    {org.logo && (
                      <Image
                        source={{ uri: org.logo }}
                        style={styles.orgCardLogo}
                        resizeMode="contain"
                      />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orgTitle} numberOfLines={1}>{org.name}</Text>
                      <Text style={styles.orgTypeText}>{org.type || 'Organization'}</Text>
                      {/* Display Rating */}
                      {orgRatings[org.id] && (
                        <View style={styles.ratingContainer}>
                          <Text style={styles.ratingText}>
                            ⭐ {orgRatings[org.id].averageRating.toFixed(1)}
                          </Text>
                          <Text style={styles.ratingCount}>
                            ({orgRatings[org.id].totalFeedbacks} reviews)
                          </Text>
                        </View>
                      )}
                    </View>
                    {typeof org.distanceKm === 'number' && (
                      <View style={styles.distanceBadge}>
                        <Text style={styles.distanceBadgeText}>{org.distanceKm.toFixed(1)} km</Text>
                      </View>
                    )}
                  </View>
                  {org.address ? (
                    <Text style={styles.orgAddress} numberOfLines={2}>📍 {org.address}</Text>
                  ) : null}
                  <View style={styles.orgFooter}>
                    <Text style={styles.orgMetaText}>
                      {Array.isArray(org.categories) && org.categories.length > 0 ? `Categories: ${org.categories.join(', ')}` : 'Accepts all categories'}
                    </Text>
                    <Text style={styles.orgChevron}>{'>'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Recent Reports Section */}
        <View style={styles.recentReports}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading recent reports...</Text>
            </View>
          ) : recentReports.length > 0 ? (
            recentReports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => handleReportPress(report.id)}
              >
                <View style={styles.reportHeader}>
                  <Text style={styles.reportTitle}>
                    {report.category || 'Issue Report'}
                  </Text>
                  <View style={styles.badgesRow}>
                    <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(report.urgency || report.predictionMetadata?.urgency || 'Medium') }]}>
                      <Text style={styles.urgencyText}>{getUrgencyDisplay(report.urgency || report.predictionMetadata?.urgency || 'Medium')}</Text>
                    </View>
                    <Text style={[styles.reportStatus, { color: getStatusColor(report.status) }]}>
                      {getStatusText(report.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reportDescription} numberOfLines={2}>
                  {report.description || 'No description provided'}
                </Text>
                
                {/* Display first image if available */}
                {(report.imageUrls || report.imageUrl) && (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: getCorrectedImageUrl(report.imageUrls ? report.imageUrls[0] : report.imageUrl) }}
                      style={styles.reportImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
                
                <Text style={styles.reportDate}>
                  {report.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noReportsText}>No recent reports found</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return '#FF9500';
    case 'assigned':
      return '#9C27B0';
    case 'in_progress':
      return '#007AFF';
    case 'resolved':
      return '#28A745';
    case 'rejected':
      return '#FF3B30';
    case 'withdrawn':
      return '#8E8E93';
    default:
      return '#666';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'assigned':
      return 'Assigned';
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    case 'rejected':
      return 'Rejected';
    case 'withdrawn':
      return 'Withdrawn';
    default:
      return status;
  }
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerSafeArea: {
    backgroundColor: '#007AFF',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  welcomeSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    color: '#666666',
  },
  quickActions: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  recentReports: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inlineChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    backgroundColor: '#fff',
  },
  smallChipSelected: {
    backgroundColor: '#E8F0FE',
    borderColor: '#A7C1F9',
  },
  smallChipText: {
    fontSize: 12,
    color: '#333',
  },
  smallChipTextSelected: {
    color: '#1A73E8',
    fontWeight: '600',
  },
  orgItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  orgItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F6FF',
  },
  orgCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  orgCardLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    backgroundColor: '#F8F9FA',
  },
  orgTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  orgTypeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9500',
  },
  ratingCount: {
    fontSize: 11,
    color: '#999',
  },
  distanceBadge: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  distanceBadgeText: {
    fontSize: 12,
    color: '#1A73E8',
    fontWeight: '600',
  },
  orgAddress: {
    fontSize: 12,
    color: '#555',
    marginBottom: 8,
  },
  orgFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orgMetaText: {
    fontSize: 12,
    color: '#777',
  },
  orgChevron: {
    fontSize: 18,
    color: '#B0B0B0',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  reportCard: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  reportStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  imageContainer: {
    marginVertical: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  reportImage: {
    width: '100%',
    height: 80,
    borderRadius: 6,
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
  noReportsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
});
 