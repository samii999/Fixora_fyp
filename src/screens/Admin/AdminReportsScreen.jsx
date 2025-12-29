import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, getDoc, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getCorrectedImageUrl } from '../../utils/imageUrlFixer';
import MapView, { Marker, Callout } from 'react-native-maps';
import BlueHeader from '../../components/layout/Header';
import { sortReportsByUrgency, getUrgencyDisplay, getUrgencyColor } from '../../utils/reportSorting';
import { createFeedbackRequest } from '../../services/feedbackService';
import { notifyStaffAssignment, notifyUserReportResolved } from '../../services/notificationService';
import { syncStatusToLinkedUsers } from '../../services/duplicateDetectionService';

const AdminReportsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, needs_review, resolved
  const [availableStaff, setAvailableStaff] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [showStaffAssignment, setShowStaffAssignment] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [assignmentType, setAssignmentType] = useState('individual'); // 'individual' or 'team'

  useEffect(() => {
    let unsubscribe = null;
    
    const setupListener = async () => {
      try {
        // Get admin's organization ID first
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const organizationId = userDoc.data()?.organizationId;

        if (organizationId) {
          const reportsQuery = query(
            collection(db, 'reports'),
            where('organizationId', '==', organizationId)
          );
          
          // Set up real-time listener
          unsubscribe = onSnapshot(
            reportsQuery,
            (snapshot) => {
              const reportsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              // Sort by urgency (High → Medium → Low), then by date
              const sortedReports = sortReportsByUrgency(reportsList);
              setReports(sortedReports);
              setLoading(false);
            },
            (error) => {
              console.error('Error fetching reports:', error);
              Alert.alert('Error', 'Failed to load reports');
              setLoading(false);
            }
          );
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error setting up reports listener:', error);
        setLoading(false);
      }
    };
    
    setupListener();
    fetchAvailableStaff();
    fetchAvailableTeams();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const fetchAvailableStaff = async () => {
    try {
      // Get admin's organization ID
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const organizationId = userDoc.data()?.organizationId;

      if (organizationId) {
        // Get organization document to find staff members
        const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          const staffIds = orgData.staffIds || [];
          
          // Fetch staff details with busy status
          const staffPromises = staffIds.map(async (staffId) => {
            const staffDoc = await getDoc(doc(db, 'users', staffId));
            if (staffDoc.exists()) {
              const staffData = staffDoc.data();
              
              // Check if staff has active assignments
              const reportsQuery = query(collection(db, 'reports'));
              const reportsSnapshot = await getDocs(reportsQuery);
              const activeAssignments = reportsSnapshot.docs.filter(doc => {
                const data = doc.data();
                return data.assignedStaffIds?.includes(staffId) && 
                       (data.status === 'assigned' || data.status === 'in_progress');
              });
              
              return {
                uid: staffId,
                name: staffData.name || staffData.email,
                email: staffData.email,
                status: staffData.status,
                teamId: staffData.teamId,
                teamName: staffData.teamName,
                isBusy: activeAssignments.length > 0,
                activeAssignments: activeAssignments.length
              };
            }
            return null;
          });
          
          const staffList = (await Promise.all(staffPromises)).filter(staff => staff !== null);
          setAvailableStaff(staffList);
        }
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchAvailableTeams = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const organizationId = userDoc.data()?.organizationId;

      if (organizationId) {
        const teamsQuery = query(
          collection(db, 'teams'),
          where('organizationId', '==', organizationId)
        );
        const snapshot = await getDocs(teamsQuery);
        
        // Check team busy status
        const teamsWithStatus = await Promise.all(
          snapshot.docs.map(async (teamDoc) => {
            const teamData = teamDoc.data();
            const activeAssignments = teamData.currentAssignments?.filter(
              a => a.status === 'assigned' || a.status === 'in_progress'
            ) || [];
            
            return {
              id: teamDoc.id,
              ...teamData,
              isBusy: activeAssignments.length > 0,
              activeAssignmentCount: activeAssignments.length
            };
          })
        );
        
        setAvailableTeams(teamsWithStatus);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    // Prevent admin from marking as resolved without staff proof
    if (newStatus === 'resolved') {
      const report = reports.find(r => r.id === reportId);
      if (!report.proofImages || !Array.isArray(report.proofImages) || report.proofImages.length === 0) {
        Alert.alert(
          'Cannot Resolve', 
          'Staff must upload proof of work before this report can be marked as resolved.'
        );
        return;
      }
    }
    
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: user.uid
      });
      
      // Sync status to linked reports (reports from same users)
      syncStatusToLinkedUsers(reportId, newStatus).catch(err => {
        console.error('Failed to sync status to linked reports:', err);
      });
      
      // Update local state
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId 
            ? { ...report, status: newStatus }
            : report
        )
      );
      
      // Create feedback request if marking as resolved
      if (newStatus === 'resolved') {
        const report = reports.find(r => r.id === reportId);
        if (report && report.userId) {
          console.log('📝 Creating feedback request for resolved report...');
          const feedbackResult = await createFeedbackRequest(reportId, report.userId, report);
          
          // Send notification to user who submitted the report
          console.log('🔔 Sending notification to user about report resolution...');
          notifyUserReportResolved(
            report.userId,
            reportId,
            report.category || 'Issue',
            report.address || 'Unknown location',
            user.uid  // Pass current user ID (the admin who resolved)
          ).catch(err => {
            console.error('Failed to send resolution notification:', err);
          });
          
          if (feedbackResult.success) {
            console.log('✅ Feedback request created successfully');
            Alert.alert(
              'Success', 
              'Report marked as resolved. User will receive a notification to provide feedback.'
            );
          } else {
            Alert.alert('Success', `Report marked as ${newStatus}`);
          }
        } else {
          Alert.alert('Success', `Report marked as ${newStatus}`);
        }
      } else {
        Alert.alert('Success', `Report marked as ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      Alert.alert('Error', 'Failed to update report status');
    }
  };

  const toggleStaffSelection = (staffId) => {
    setSelectedStaffIds(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };
  
  const handleTeamSelection = (teamId) => {
    setSelectedTeamId(teamId);
  };

  const handleAssignment = async () => {
    if (assignmentType === 'individual' && selectedStaffIds.length === 0) {
      Alert.alert('Error', 'Please select at least one staff member');
      return;
    }
    
    if (assignmentType === 'team' && !selectedTeamId) {
      Alert.alert('Error', 'Please select a team');
      return;
    }

    try {
      let assignmentData = {
        assignedAt: new Date(),
        assignedBy: user.uid,
        status: 'assigned',
        assignmentType: assignmentType
      };
      
      if (assignmentType === 'individual') {
        // Check if any selected staff is busy
        const busyStaff = availableStaff.filter(
          staff => selectedStaffIds.includes(staff.uid) && staff.isBusy
        );
        
        if (busyStaff.length > 0) {
          const busyNames = busyStaff.map(s => s.name).join(', ');
          const shouldContinue = await new Promise((resolve) => {
            Alert.alert(
              'Staff Already Busy',
              `${busyNames} ${busyStaff.length === 1 ? 'is' : 'are'} already assigned to other work. Do you want to assign this work anyway?`,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Assign Anyway', onPress: () => resolve(true) }
              ]
            );
          });
          
          if (!shouldContinue) return;
        }
        
        const assignedStaffList = availableStaff
          .filter(staff => selectedStaffIds.includes(staff.uid))
          .map(staff => ({
            uid: staff.uid,
            name: staff.name,
            email: staff.email
          }));

        assignmentData = {
          ...assignmentData,
          assignedStaff: assignedStaffList,
          assignedStaffIds: selectedStaffIds,
          assignedTo: assignedStaffList.map(s => s.name).join(', ')
        };
      } else if (assignmentType === 'team') {
        const selectedTeam = availableTeams.find(t => t.id === selectedTeamId);
        
        // Check if team is busy
        if (selectedTeam.isBusy) {
          const shouldContinue = await new Promise((resolve) => {
            Alert.alert(
              'Team Already Busy',
              `${selectedTeam.name} is already assigned to ${selectedTeam.activeAssignmentCount} active work(s). Do you want to assign this work anyway?`,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Choose Another Team', onPress: () => resolve(false) },
                { text: 'Assign Anyway', onPress: () => resolve(true) }
              ]
            );
          });
          
          if (!shouldContinue) return;
        }
        
        assignmentData = {
          ...assignmentData,
          assignedTeamId: selectedTeamId,
          assignedTeamName: selectedTeam.name,
          assignedTo: `Team: ${selectedTeam.name}`,
          assignedStaffIds: selectedTeam.members?.map(m => m.uid) || []
        };
        
        // Update team's current assignments
        const teamRef = doc(db, 'teams', selectedTeamId);
        const currentAssignments = selectedTeam.currentAssignments || [];
        await updateDoc(teamRef, {
          currentAssignments: [...currentAssignments, {
            reportId: selectedReport.id,
            assignedAt: new Date(),
            status: 'assigned'
          }],
          isAvailable: false
        });
      }
      
      // Add admin note if provided
      if (adminNote.trim()) {
        assignmentData.adminNote = adminNote.trim();
      }
      
      await updateDoc(doc(db, 'reports', selectedReport.id), assignmentData);
      
      // Update local state
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === selectedReport.id 
            ? { ...report, ...assignmentData }
            : report
        )
      );
      
      setShowStaffAssignment(false);
      setSelectedReport(null);
      setAdminNote('');
      setSelectedStaffIds([]);
      setSelectedTeamId(null);
      setAssignmentType('individual');
      
      // Refresh data
      fetchAvailableStaff();
      fetchAvailableTeams();
      
      const assignedTo = assignmentType === 'individual' 
        ? `${selectedStaffIds.length} staff member(s)`
        : availableTeams.find(t => t.id === selectedTeamId)?.name;
      
      // Send notification to assigned staff
      console.log('🔔 Sending notification to assigned staff...');
      notifyStaffAssignment(
        selectedReport.id,
        assignmentData.assignedStaffIds,
        selectedReport.category || 'Issue',
        selectedReport.address || 'Unknown location',
        user.uid  // Pass current user ID (the admin who assigned)
      ).catch(err => {
        console.error('Failed to send staff notification:', err);
      });
      
      Alert.alert('Success', `Report assigned to ${assignedTo}`);
    } catch (error) {
      console.error('Error assigning report:', error);
      Alert.alert('Error', 'Failed to assign report');
    }
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

  const handleDeleteReport = async (reportId) => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'reports', reportId));
              // Remove from local state
              setReports(prevReports => 
                prevReports.filter(report => report.id !== reportId)
              );
              Alert.alert('Success', 'Report deleted successfully');
            } catch (error) {
              console.error('Error deleting report:', error);
              Alert.alert('Error', 'Failed to delete report');
            }
          },
        },
      ]
    );
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'needs_review') {
      return Array.isArray(report.proofImages) && report.proofImages.length > 0 && report.status !== 'resolved';
    }
    return report.status === filter;
  });

  const renderReportItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.reportCard}
      onPress={() => navigation.navigate('IssueDetail', { issueId: item.id })}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>
          {item.title || 'Issue Report'}
        </Text>
        <View style={styles.badgesContainer}>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency || item.predictionMetadata?.urgency || 'Medium') }]}>
            <Text style={styles.urgencyText}>{getUrgencyDisplay(item.urgency || item.predictionMetadata?.urgency || 'Medium')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          {item.duplicateCount > 0 && !item.isDuplicate && (
            <View style={styles.duplicateBadge}>
              <Text style={styles.duplicateBadgeText}>🔁 +{item.duplicateCount} duplicate{item.duplicateCount > 1 ? 's' : ''}</Text>
            </View>
          )}
          {item.isDuplicate && (
            <View style={styles.duplicateLinkBadge}>
              <Text style={styles.duplicateLinkBadgeText}>🔗 Duplicate</Text>
            </View>
          )}
          {item.isResubmission && (
            <View style={styles.resubmissionBadge}>
              <Text style={styles.resubmissionBadgeText}>🔄 Resubmitted</Text>
            </View>
          )}
        </View>
      </View>
      
      <Text style={styles.reportDescription} numberOfLines={2}>
        {item.description || 'No description provided'}
      </Text>
      
      {/* Show multiple reporters if available */}
      {item.reporterCount && item.reporterCount > 1 && (
        <View style={styles.multipleReportersNote}>
          <Text style={styles.multipleReportersText}>
            👥 {item.reporterCount} people reported this issue
          </Text>
        </View>
      )}
      
      {/* Show resubmission reason if available */}
      {item.isResubmission && item.resubmissionReason && (
        <View style={styles.resubmissionNote}>
          <Text style={styles.resubmissionNoteLabel}>⚠️ Resubmission Reason:</Text>
          <Text style={styles.resubmissionNoteText}>{item.resubmissionReason}</Text>
        </View>
      )}
      
      {/* Display assigned staff if any */}
      {item.assignedStaff && item.assignedStaff.length > 0 && (
        <View style={styles.assignedStaffContainer}>
          <Text style={styles.assignedStaffLabel}>Assigned to:</Text>
          <View style={styles.assignedStaffList}>
            {item.assignedStaff.map((staff, index) => (
              <View key={staff.uid} style={styles.staffChip}>
                <Text style={styles.staffChipText}>{staff.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Display first image if available */}
      {(item.imageUrls || item.imageUrl) && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getCorrectedImageUrl(item.imageUrls ? item.imageUrls[0] : item.imageUrl) }}
            style={styles.reportImage}
            resizeMode="cover"
          />
        </View>
      )}
      
      <View style={styles.reportMeta}>
        <Text style={styles.reportDate}>
          {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
        </Text>
        <Text style={styles.reportCategory}>
          {item.category || 'General'}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        {item.status === 'pending' && (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
              onPress={() => {
                setSelectedReport(item);
                setShowStaffAssignment(true);
              }}
            >
              <Text style={styles.actionButtonText}>Assign Staff</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
              onPress={() => handleStatusUpdate(item.id, 'in_progress')}
            >
              <Text style={styles.actionButtonText}>Start Work</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#28A745' }]}
              onPress={() => handleStatusUpdate(item.id, 'resolved')}
            >
              <Text style={styles.actionButtonText}>Resolve</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status === 'assigned' && (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
              onPress={() => handleStatusUpdate(item.id, 'in_progress')}
            >
              <Text style={styles.actionButtonText}>Start Work</Text>
            </TouchableOpacity>
          </>
        )}
        {item.status === 'in_progress' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#28A745' }]}
            onPress={() => handleStatusUpdate(item.id, 'resolved')}
          >
            <Text style={styles.actionButtonText}>Mark Resolved</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
          onPress={() => handleDeleteReport(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlueHeader title="Issue Reports" subtitle="Manage organization reports" />

             {/* Filter Tabs */}
       <ScrollView 
         horizontal 
         showsHorizontalScrollIndicator={false}
         style={styles.filterContainer}
         contentContainerStyle={styles.filterContentContainer}
       >
         <TouchableOpacity 
           style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
           onPress={() => setFilter('all')}
         >
           <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]} numberOfLines={1}>
             All ({reports.length})
           </Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={[styles.filterTab, filter === 'pending' && styles.activeFilterTab]}
           onPress={() => setFilter('pending')}
         >
           <Text style={[styles.filterText, filter === 'pending' && styles.activeFilterText]} numberOfLines={1}>
             Pending ({reports.filter(r => r.status === 'pending').length})
           </Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={[styles.filterTab, filter === 'needs_review' && styles.activeFilterTab]}
           onPress={() => setFilter('needs_review')}
         >
           <Text style={[styles.filterText, filter === 'needs_review' && styles.activeFilterText]} numberOfLines={1}>
             Staff-Proved ({reports.filter(r => Array.isArray(r.proofImages) && r.proofImages.length > 0 && r.status !== 'resolved').length})
           </Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={[styles.filterTab, filter === 'resolved' && styles.activeFilterTab]}
           onPress={() => setFilter('resolved')}
         >
           <Text style={[styles.filterText, filter === 'resolved' && styles.activeFilterText]} numberOfLines={1}>
             Resolved ({reports.filter(r => r.status === 'resolved').length})
           </Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={[styles.filterTab, filter === 'withdrawn' && styles.activeFilterTab]}
           onPress={() => setFilter('withdrawn')}
         >
           <Text style={[styles.filterText, filter === 'withdrawn' && styles.activeFilterText]} numberOfLines={1}>
             Withdrawn ({reports.filter(r => r.status === 'withdrawn').length})
           </Text>
         </TouchableOpacity>
       </ScrollView>

      <View style={{ flex: 1 }}>
        <FlatList
          data={filteredReports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No reports found</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'all' 
                  ? 'No reports have been submitted yet'
                  : `No ${filter} reports found`
                }
              </Text>
            </View>
          }
        />
      </View>

      {/* Staff Assignment Modal */}
      {showStaffAssignment && selectedReport && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Report</Text>
            
            {/* Assignment Type Selector */}
            <View style={styles.assignmentTypeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, assignmentType === 'individual' && styles.activeTypeButton]}
                onPress={() => setAssignmentType('individual')}
              >
                <Text style={[styles.typeButtonText, assignmentType === 'individual' && styles.activeTypeButtonText]}>
                  👤 Individual Staff
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, assignmentType === 'team' && styles.activeTypeButton]}
                onPress={() => setAssignmentType('team')}
              >
                <Text style={[styles.typeButtonText, assignmentType === 'team' && styles.activeTypeButtonText]}>
                  👥 Team
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Admin Note Input */}
            <Text style={styles.label}>Admin Note (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Add any special instructions or notes..."
              multiline
              numberOfLines={3}
              value={adminNote}
              onChangeText={setAdminNote}
              placeholderTextColor="#999"
            />
            
            {assignmentType === 'individual' ? (
              <>
                <Text style={styles.modalSubtitle}>
                  Select staff members to assign:
                </Text>
                <FlatList
                  data={availableStaff}
                  keyExtractor={(item) => item.uid}
                  renderItem={({ item }) => {
                    const isSelected = selectedStaffIds.includes(item.uid);
                    return (
                      <TouchableOpacity
                        style={[styles.staffItem, isSelected && styles.selectedStaffItem]}
                        onPress={() => toggleStaffSelection(item.uid)}
                      >
                        <View style={styles.staffInfo}>
                          <Text style={styles.staffName}>{item.name}</Text>
                          <Text style={styles.staffEmail}>{item.email}</Text>
                          {item.teamName && (
                            <Text style={styles.staffTeam}>Team: {item.teamName}</Text>
                          )}
                          {item.isBusy && (
                            <View style={styles.busyBadge}>
                              <Text style={styles.busyBadgeText}>⚠️ Busy ({item.activeAssignments} active)</Text>
                            </View>
                          )}
                        </View>
                        <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <Text style={styles.noStaffText}>No staff members available</Text>
                  }
                />
              </>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>
                  Select a team to assign:
                </Text>
                <FlatList
                  data={availableTeams}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const isSelected = selectedTeamId === item.id;
                    return (
                      <TouchableOpacity
                        style={[styles.staffItem, isSelected && styles.selectedStaffItem]}
                        onPress={() => handleTeamSelection(item.id)}
                      >
                        <View style={styles.staffInfo}>
                          <Text style={styles.staffName}>{item.name}</Text>
                          <Text style={styles.staffEmail}>
                            {item.members?.length || 0} member(s)
                          </Text>
                          {item.description && (
                            <Text style={styles.teamDescriptionSmall}>{item.description}</Text>
                          )}
                          {item.isBusy && (
                            <View style={styles.busyBadge}>
                              <Text style={styles.busyBadgeText}>
                                ⚠️ Busy ({item.activeAssignmentCount} active work)
                              </Text>
                            </View>
                          )}
                          {!item.isBusy && (
                            <View style={styles.availableBadge}>
                              <Text style={styles.availableBadgeText}>✅ Available</Text>
                            </View>
                          )}
                        </View>
                        <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <Text style={styles.noStaffText}>No teams available. Create a team in Manage Staff.</Text>
                  }
                />
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.assignButton, 
                  (assignmentType === 'individual' ? selectedStaffIds.length === 0 : !selectedTeamId) && styles.disabledButton
                ]}
                onPress={handleAssignment}
                disabled={assignmentType === 'individual' ? selectedStaffIds.length === 0 : !selectedTeamId}
              >
                <Text style={styles.assignButtonText}>
                  {assignmentType === 'individual' 
                    ? `Assign to ${selectedStaffIds.length} Staff` 
                    : 'Assign to Team'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowStaffAssignment(false);
                  setSelectedReport(null);
                  setAdminNote('');
                  setSelectedStaffIds([]);
                  setSelectedTeamId(null);
                  setAssignmentType('individual');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
    maxHeight: 50,
  },
  filterContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 85,
    backgroundColor: '#F0F0F0',
  },
  activeFilterTab: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  reportCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  badgesContainer: {
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
  reportCategory: {
    fontSize: 12,
    color: '#999',
  },
  imageContainer: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  reportImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  staffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  staffEmail: {
    fontSize: 14,
    color: '#666',
  },
  noStaffText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  // Multi-staff assignment styles
  staffInfo: {
    flex: 1,
  },
  selectedStaffItem: {
    backgroundColor: '#E3F2FD',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtons: {
    marginTop: 16,
    gap: 12,
  },
  assignButton: {
    padding: 14,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#B0B0B0',
    opacity: 0.6,
  },
  assignButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  assignedStaffContainer: {
    marginVertical: 8,
    padding: 8,
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
  },
  assignedStaffLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  assignedStaffList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  staffChip: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  staffChipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  assignmentTypeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTypeButton: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTypeButtonText: {
    color: '#fff',
  },
  staffTeam: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  teamDescriptionSmall: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  busyBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  busyBadgeText: {
    fontSize: 11,
    color: '#856404',
    fontWeight: '600',
  },
  availableBadge: {
    backgroundColor: '#D4EDDA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  availableBadgeText: {
    fontSize: 11,
    color: '#155724',
    fontWeight: '600',
  },
  duplicateBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 6,
  },
  duplicateBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  duplicateLinkBadge: {
    backgroundColor: '#6C757D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 6,
  },
  duplicateLinkBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  resubmissionBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 6,
  },
  resubmissionBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  resubmissionNote: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  resubmissionNoteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  resubmissionNoteText: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
  },
  multipleReportersNote: {
    backgroundColor: '#E8F4FD',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  multipleReportersText: {
    fontSize: 12,
    color: '#0056B3',
    fontWeight: '600',
  },
});

export default AdminReportsScreen;