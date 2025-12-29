import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Switch, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../../config/firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import BlueHeader from '../../components/layout/Header';

const ManageStaffScreen = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showTeamsList, setShowTeamsList] = useState(false);
  const [showAssignToTeam, setShowAssignToTeam] = useState(false);
  const [selectedStaffForTeam, setSelectedStaffForTeam] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      fetchStaff();
      fetchTeams();
    }, [])
  );

  const fetchStaff = async () => {
    try {
      setLoading(true);
      // Get admin's organization ID from user data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const adminOrgId = userDoc.data()?.organizationId;
      
      if (!adminOrgId) {
        Alert.alert('Error', 'No organization found. Please create an organization first.');
        return;
      }

      const q = query(
        collection(db, 'users'), 
        where('organizationId', '==', adminOrgId), 
        where('role', '==', 'staff')
      );
      const snapshot = await getDocs(q);
      const staffList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(staff => staff.status !== 'removed'); // Exclude removed staff
      setStaff(staffList);
    } catch (error) {
      console.error('Error fetching staff:', error);
      Alert.alert('Error', 'Failed to load staff members.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const adminOrgId = userDoc.data()?.organizationId;
      
      if (!adminOrgId) return;

      const teamsQuery = query(
        collection(db, 'teams'),
        where('organizationId', '==', adminOrgId)
      );
      const snapshot = await getDocs(teamsQuery);
      const teamsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(teamsList);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const adminOrgId = userDoc.data()?.organizationId;

      await addDoc(collection(db, 'teams'), {
        name: newTeamName.trim(),
        description: newTeamDescription.trim(),
        organizationId: adminOrgId,
        members: [],
        createdBy: user.uid,
        createdAt: new Date(),
        isAvailable: true, // Track if team is available for assignments
        currentAssignments: [] // Track active work assignments
      });

      Alert.alert('Success', 'Team created successfully!');
      setNewTeamName('');
      setNewTeamDescription('');
      setShowCreateTeam(false);
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      Alert.alert('Error', 'Failed to create team');
    }
  };

  const handleAssignStaffToTeam = async (teamId) => {
    if (!selectedStaffForTeam) return;

    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamDoc = await getDoc(teamRef);
      const teamData = teamDoc.data();
      
      // Add staff member to team
      const updatedMembers = [...(teamData.members || []), {
        uid: selectedStaffForTeam.id,
        name: selectedStaffForTeam.name || selectedStaffForTeam.email,
        email: selectedStaffForTeam.email,
        addedAt: new Date()
      }];

      await updateDoc(teamRef, { members: updatedMembers });

      // Update staff document with team info
      await updateDoc(doc(db, 'users', selectedStaffForTeam.id), {
        teamId: teamId,
        teamName: teamData.name
      });

      Alert.alert('Success', 'Staff member assigned to team!');
      setShowAssignToTeam(false);
      setSelectedStaffForTeam(null);
      fetchStaff();
      fetchTeams();
    } catch (error) {
      console.error('Error assigning staff to team:', error);
      Alert.alert('Error', 'Failed to assign staff to team');
    }
  };

  const handleRemoveFromTeam = async (staffId, teamId) => {
    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamDoc = await getDoc(teamRef);
      const teamData = teamDoc.data();
      
      // Remove staff member from team
      const updatedMembers = teamData.members.filter(m => m.uid !== staffId);
      await updateDoc(teamRef, { members: updatedMembers });

      // Update staff document
      await updateDoc(doc(db, 'users', staffId), {
        teamId: null,
        teamName: null
      });

      Alert.alert('Success', 'Staff member removed from team!');
      fetchStaff();
      fetchTeams();
    } catch (error) {
      console.error('Error removing staff from team:', error);
      Alert.alert('Error', 'Failed to remove staff from team');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this team? All team members will be unassigned.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const teamDoc = await getDoc(doc(db, 'teams', teamId));
              const teamData = teamDoc.data();
              
              // Remove team from all members
              if (teamData.members) {
                for (const member of teamData.members) {
                  await updateDoc(doc(db, 'users', member.uid), {
                    teamId: null,
                    teamName: null
                  });
                }
              }

              await deleteDoc(doc(db, 'teams', teamId));
              Alert.alert('Success', 'Team deleted successfully');
              fetchTeams();
              fetchStaff();
            } catch (error) {
              console.error('Error deleting team:', error);
              Alert.alert('Error', 'Failed to delete team');
            }
          }
        }
      ]
    );
  };

  const handlePermissionToggle = async (uid, key, current) => {
    try {
      const userRef = doc(db, 'users', uid);
      const staffMember = staff.find(s => s.id === uid);
      const newPermissions = { ...staffMember.permissions, [key]: !current };
      await updateDoc(userRef, { permissions: newPermissions });
      fetchStaff(); // refresh UI
    } catch (err) {
      console.error('Permission toggle error:', err);
      Alert.alert('Error', 'Failed to update permissions.');
    }
  };

  const handleRemove = async (uid) => {
    Alert.alert("Confirm Removal", "Remove this staff member from the organization?", [
      { text: "Cancel", style: 'cancel' },
      {
        text: "Remove", 
        style: 'destructive',
        onPress: async () => {
          try {
            // Get admin's organization ID
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const adminOrgId = userDoc.data()?.organizationId;
            
            // Update user to remove from organization
            await updateDoc(doc(db, "users", uid), {
              organizationId: null,
              permissions: {},
              status: 'removed'
            });

            // Update organization document - remove from staffIds array
            const orgRef = doc(db, 'organizations', adminOrgId);
            const orgDoc = await getDoc(orgRef);
            if (orgDoc.exists()) {
              const orgData = orgDoc.data();
              const updatedStaffIds = orgData.staffIds.filter(staffId => staffId !== uid);
              await updateDoc(orgRef, { staffIds: updatedStaffIds });
            }

            fetchStaff();
            Alert.alert('Success', 'Staff member removed successfully.');
          } catch (error) {
            console.error('Remove staff error:', error);
            Alert.alert('Error', 'Failed to remove staff member.');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.staffHeader}>
        <Text style={styles.name}>{item.name || item.email || 'Unnamed'}</Text>
        <Text style={styles.email}>{item.email}</Text>
        {item.position && (
          <Text style={styles.position}>Position: {item.position}</Text>
        )}
        <Text style={styles.status}>Status: {item.status || 'active'}</Text>
        {item.teamName && (
          <View style={styles.teamBadge}>
            <Text style={styles.teamBadgeText}>Team: {item.teamName}</Text>
          </View>
        )}
      </View>

      <View style={styles.permissionsSection}>
        <Text style={styles.sectionTitle}>Permissions:</Text>
        {Object.entries(item.permissions || {}).map(([key, val]) => (
          <View key={key} style={styles.switchRow}>
            <Text style={styles.permissionText}>{key}</Text>
            <Switch
              value={val}
              onValueChange={() => handlePermissionToggle(item.id, key, val)}
              trackColor={{ false: '#E1E5E9', true: '#007AFF' }}
            />
          </View>
        ))}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.teamButton} 
          onPress={() => {
            setSelectedStaffForTeam(item);
            setShowAssignToTeam(true);
          }}
        >
          <Text style={styles.teamButtonText}>{item.teamId ? 'Change Team' : 'Assign to Team'}</Text>
        </TouchableOpacity>
        
        {item.teamId && (
          <TouchableOpacity 
            style={styles.removeTeamButton} 
            onPress={() => handleRemoveFromTeam(item.id, item.teamId)}
          >
            <Text style={styles.removeTeamButtonText}>Remove from Team</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={() => handleRemove(item.id)}
        >
          <Text style={styles.removeButtonText}>Remove Staff</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading staff members...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlueHeader title="Manage Staff" subtitle={`${staff.length} staff member(s) • ${teams.length} team(s)`} />
      
      <View style={styles.headerButtons}>
        <TouchableOpacity 
          style={styles.createTeamButton}
          onPress={() => setShowCreateTeam(true)}
        >
          <Text style={styles.createTeamButtonText}>➕ Create Team</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.viewTeamsButton}
          onPress={() => setShowTeamsList(true)}
        >
          <Text style={styles.viewTeamsButtonText}>👥 View Teams ({teams.length})</Text>
        </TouchableOpacity>
      </View>
      
      {staff.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No staff members found</Text>
          <Text style={styles.emptySubtext}>Staff members will appear here once they join your organization</Text>
        </View>
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      {/* Create Team Modal */}
      <Modal
        visible={showCreateTeam}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateTeam(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Team</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Team Name (e.g., Emergency Team)"
              value={newTeamName}
              onChangeText={setNewTeamName}
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (Optional)"
              value={newTeamDescription}
              onChangeText={setNewTeamDescription}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleCreateTeam}
              >
                <Text style={styles.createButtonText}>Create Team</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateTeam(false);
                  setNewTeamName('');
                  setNewTeamDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* View Teams Modal */}
      <Modal
        visible={showTeamsList}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowTeamsList(false)}
      >
        <SafeAreaView style={styles.container}>
          <BlueHeader title="Teams" subtitle={`${teams.length} team(s)`} />
          
          <ScrollView style={styles.teamsContainer}>
            {teams.map(team => (
              <View key={team.id} style={styles.teamCard}>
                <View style={styles.teamHeader}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  {team.description && (
                    <Text style={styles.teamDescription}>{team.description}</Text>
                  )}
                  <View style={styles.teamStatus}>
                    <Text style={[styles.teamStatusText, team.isAvailable ? styles.availableText : styles.busyText]}>
                      {team.isAvailable ? '✅ Available' : '⚠️ Busy'}
                    </Text>
                    <Text style={styles.teamMemberCount}>
                      👥 {team.members?.length || 0} member(s)
                    </Text>
                  </View>
                </View>
                
                {team.members && team.members.length > 0 && (
                  <View style={styles.membersSection}>
                    <Text style={styles.membersSectionTitle}>Members:</Text>
                    {team.members.map((member, idx) => (
                      <View key={idx} style={styles.memberItem}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <TouchableOpacity
                          style={styles.removeMemberButton}
                          onPress={() => handleRemoveFromTeam(member.uid, team.id)}
                        >
                          <Text style={styles.removeMemberButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.deleteTeamButton}
                  onPress={() => handleDeleteTeam(team.id)}
                >
                  <Text style={styles.deleteTeamButtonText}>Delete Team</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {teams.length === 0 && (
              <View style={styles.emptyTeamsContainer}>
                <Text style={styles.emptyTeamsText}>No teams created yet</Text>
                <Text style={styles.emptyTeamsSubtext}>Create a team to get started</Text>
              </View>
            )}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.closeModalButton}
            onPress={() => setShowTeamsList(false)}
          >
            <Text style={styles.closeModalButtonText}>Close</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
      
      {/* Assign to Team Modal */}
      <Modal
        visible={showAssignToTeam}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssignToTeam(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign to Team</Text>
            {selectedStaffForTeam && (
              <Text style={styles.modalSubtitle}>
                Select a team for {selectedStaffForTeam.name || selectedStaffForTeam.email}
              </Text>
            )}
            
            <ScrollView style={styles.teamsList}>
              {teams.map(team => (
                <TouchableOpacity
                  key={team.id}
                  style={styles.teamSelectItem}
                  onPress={() => handleAssignStaffToTeam(team.id)}
                >
                  <View>
                    <Text style={styles.teamSelectName}>{team.name}</Text>
                    <Text style={styles.teamSelectInfo}>
                      {team.members?.length || 0} member(s) • {team.isAvailable ? 'Available' : 'Busy'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              {teams.length === 0 && (
                <Text style={styles.noTeamsText}>No teams available. Create a team first.</Text>
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setShowAssignToTeam(false);
                setSelectedStaffForTeam(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ManageStaffScreen;

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
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  staffHeader: {
    marginBottom: 16,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  position: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  permissionsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  permissionText: {
    fontSize: 16,
    color: '#333',
  },
  actionButtons: {
    gap: 8,
  },
  teamButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  teamButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removeTeamButton: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  removeTeamButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  teamBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  teamBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  createTeamButton: {
    flex: 1,
    backgroundColor: '#28A745',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  createTeamButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewTeamsButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewTeamsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    gap: 12,
  },
  createButton: {
    backgroundColor: '#28A745',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6C757D',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  teamsContainer: {
    flex: 1,
    padding: 16,
  },
  teamCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamHeader: {
    marginBottom: 12,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  teamStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  teamStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  availableText: {
    color: '#28A745',
  },
  busyText: {
    color: '#FF9500',
  },
  teamMemberCount: {
    fontSize: 14,
    color: '#666',
  },
  membersSection: {
    borderTopWidth: 1,
    borderTopColor: '#E1E5E9',
    paddingTop: 12,
    marginTop: 12,
  },
  membersSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memberName: {
    fontSize: 14,
    color: '#333',
  },
  removeMemberButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeMemberButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteTeamButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteTeamButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTeamsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTeamsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyTeamsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  closeModalButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  teamsList: {
    maxHeight: 300,
  },
  teamSelectItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  teamSelectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  teamSelectInfo: {
    fontSize: 12,
    color: '#666',
  },
  noTeamsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    padding: 20,
  },
});
