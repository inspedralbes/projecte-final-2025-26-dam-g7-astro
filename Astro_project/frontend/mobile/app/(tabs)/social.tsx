import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AstroLayout from '@/components/layout/AstroLayout';
import { useSocialStore } from '@/stores/socialStore';
import { useSessionStore } from '@/stores/sessionStore';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/i18n';

const PAGE_SIZE = 10;

function getRankClass(level = 1) {
  if (level <= 10) return styles.rankTier1;
  if (level <= 30) return styles.rankTier2;
  if (level <= 60) return styles.rankTier3;
  if (level <= 100) return styles.rankTier4;
  if (level <= 130) return styles.rankTier5;
  return styles.rankTier6;
}

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const user = useSessionStore((state) => state.user);
  const { 
    friends, 
    friendRequests, 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest,
    fetchAllUsers,
    explorers
  } = useSocialStore();

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const handleSendRequest = async (targetUser?: string) => {
    const nameToRequest = targetUser || searchQuery;
    if (!nameToRequest.trim()) return;
    if (nameToRequest === user) {
      Alert.alert(i18n.t('common.error'), i18n.t('social.err_self_request'));
      return;
    }

    setLoading(true);
    const result = await sendFriendRequest(nameToRequest);
    setLoading(false);

    if (result.success) {
      Alert.alert(i18n.t('social.req_sent_title'), i18n.t('social.req_sent_msg', { name: nameToRequest }));
      if (!targetUser) setSearchQuery('');
    } else {
      Alert.alert(i18n.t('common.error'), result.message || i18n.t('common.error'));
    }
  };

  const handleAccept = async (name: string) => {
    const result = await acceptFriendRequest(name);
    if (!result.success) {
      Alert.alert(i18n.t('common.error'), result.message || i18n.t('common.error'));
    }
  };

  const handleReject = async (name: string) => {
    const result = await rejectFriendRequest(name);
    if (!result.success) {
      Alert.alert(i18n.t('common.error'), result.message || i18n.t('common.error'));
    }
  };

  const filteredExplorers = useMemo(() => {
    const all = explorers || [];
    let potential = all.filter(e => e.user !== user && !friends.some(f => f.username === e.user));
    
    if (searchQuery && activeTab === 'explore') {
      const q = searchQuery.toLowerCase();
      potential = potential.filter(p => p.user.toLowerCase().includes(q));
    }
    
    return potential;
  }, [explorers, user, friends, searchQuery, activeTab]);

  const paginatedExplorers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredExplorers.slice(start, start + PAGE_SIZE);
  }, [filteredExplorers, currentPage]);

  const totalPages = Math.ceil(filteredExplorers.length / PAGE_SIZE);

  return (
    <AstroLayout>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => { setActiveTab('friends'); setSearchQuery(''); }}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>{i18n.t('social.tabs.friends')}</Text>
          {friends.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{friends.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => { setActiveTab('requests'); setSearchQuery(''); }}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>{i18n.t('social.tabs.requests')}</Text>
          {friendRequests.length > 0 && (
            <View style={[styles.badge, { backgroundColor: Colors.dark.error }]}>
              <Text style={styles.badgeText}>{friendRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'explore' && styles.tabActive]}
          onPress={() => { setActiveTab('explore'); setSearchQuery(''); setCurrentPage(1); }}
        >
          <Text style={[styles.tabText, activeTab === 'explore' && styles.tabTextActive]}>{i18n.t('social.tabs.explore')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={i18n.t('social.search_placeholder')}
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={searchQuery}
            onChangeText={(text) => { setSearchQuery(text); setCurrentPage(1); }}
            autoCapitalize="none"
          />
          {activeTab !== 'explore' && (
            <TouchableOpacity style={styles.searchButton} onPress={() => handleSendRequest()} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <MaterialCommunityIcons name="account-plus" size={20} color="#000" />
              )}
            </TouchableOpacity>
          )}
          {activeTab === 'explore' && searchQuery !== '' && (
            <TouchableOpacity style={styles.clearButton} onPress={() => { setSearchQuery(''); setCurrentPage(1); }}>
              <MaterialCommunityIcons name="close-circle" size={20} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'friends' && (
          friends.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-group-outline" size={60} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyText}>{i18n.t('social.empty_friends')}</Text>
              <Text style={styles.emptySubtext}>{i18n.t('social.empty_friends_sub')}</Text>
            </View>
          ) : (
            friends.map((friend, idx) => (
              <View key={idx} style={styles.card}>
                <View style={[styles.avatar, getRankClass(friend.level)]}>
                  <Text style={styles.avatarText}>{friend.username?.charAt(0).toUpperCase() || '?'}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{friend.username}</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: friend.online ? '#4caf50' : '#757575' }]} />
                    <Text style={styles.statusText}>{friend.online ? 'Online' : 'Offline'}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialCommunityIcons name="chat-outline" size={20} color={Colors.dark.tint} />
                </TouchableOpacity>
              </View>
            ))
          )
        )}

        {activeTab === 'requests' && (
          friendRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="bell-outline" size={60} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyText}>{i18n.t('social.empty_requests')}</Text>
              <Text style={styles.emptySubtext}>{i18n.t('social.empty_requests_sub')}</Text>
            </View>
          ) : (
            friendRequests.map((req, idx) => (
              <View key={idx} style={styles.card}>
                <View style={[styles.avatar, { backgroundColor: 'rgba(255, 82, 82, 0.1)', borderColor: 'rgba(255, 82, 82, 0.3)' }]}>
                  <Text style={[styles.avatarText, { color: Colors.dark.error }]}>{req.from?.charAt(0).toUpperCase() || '?'}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{req.from}</Text>
                  <Text style={styles.reqSub}>{i18n.t('social.req_wants_friend')}</Text>
                </View>
                <View style={styles.reqActions}>
                  <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(req.from)}>
                    <MaterialCommunityIcons name="check" size={20} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(req.from)}>
                    <MaterialCommunityIcons name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}

        {activeTab === 'explore' && (
          paginatedExplorers.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="radar" size={60} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyText}>{i18n.t('social.empty_explore')}</Text>
            </View>
          ) : (
            <>
              {paginatedExplorers.map((explorer, idx) => (
                <View key={idx} style={styles.card}>
                  <View style={[styles.avatar, getRankClass(explorer.level)]}>
                    <Text style={styles.avatarText}>{explorer.user?.charAt(0).toUpperCase() || '?'}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{explorer.user}</Text>
                    <Text style={styles.statusText}>Level {explorer.level || 1}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.recruitButton} 
                    onPress={() => handleSendRequest(explorer.user)}
                  >
                    <Text style={styles.recruitText}>{i18n.t('social.recruit')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {totalPages > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity 
                    style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                    onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={24} color={currentPage === 1 ? 'rgba(255,255,255,0.2)' : Colors.dark.tint} />
                    <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>{i18n.t('social.pagination.prev')}</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.pageInfo}>
                    {currentPage} / {totalPages}
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                    onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <Text style={[styles.pageButtonText, currentPage === totalPages && styles.pageButtonTextDisabled]}>{i18n.t('social.pagination.next')}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={currentPage === totalPages ? 'rgba(255,255,255,0.2)' : Colors.dark.tint} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )
        )}
      </ScrollView>
    </AstroLayout>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabActive: {
    borderBottomColor: Colors.dark.tint,
  },
  tabText: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: Fonts.subheader,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: Colors.dark.tint,
  },
  badge: {
    backgroundColor: Colors.dark.tint,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    paddingLeft: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontFamily: Fonts.body,
    fontSize: 14,
    height: 46,
  },
  searchButton: {
    backgroundColor: Colors.dark.tint,
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    padding: 10,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#fff',
    fontFamily: Fonts.header,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.2)',
  },
  avatarText: {
    color: Colors.dark.tint,
    fontSize: 18,
    fontWeight: '900',
  },
  rankTier1: { backgroundColor: 'rgba(144, 164, 174, 0.1)', borderColor: '#90a4ae' },
  rankTier2: { backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: '#4caf50' },
  rankTier3: { backgroundColor: 'rgba(33, 150, 243, 0.1)', borderColor: '#2196f3' },
  rankTier4: { backgroundColor: 'rgba(156, 39, 176, 0.1)', borderColor: '#9c27b0' },
  rankTier5: { backgroundColor: 'rgba(255, 152, 0, 0.1)', borderColor: '#ff9800' },
  rankTier6: { backgroundColor: 'rgba(244, 67, 54, 0.1)', borderColor: '#f44336' },
  info: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontFamily: Fonts.body,
    fontSize: 15,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  reqSub: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginTop: 2,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recruitButton: {
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.tint,
  },
  recruitText: {
    color: Colors.dark.tint,
    fontFamily: Fonts.subheader,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  reqActions: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.dark.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 82, 82, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 30,
    gap: 20,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 10,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    color: Colors.dark.tint,
    fontFamily: Fonts.subheader,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pageButtonTextDisabled: {
    color: 'rgba(255,255,255,0.2)',
  },
  pageInfo: {
    color: '#fff',
    fontFamily: Fonts.body,
    fontSize: 14,
    fontWeight: '700',
  },
});
