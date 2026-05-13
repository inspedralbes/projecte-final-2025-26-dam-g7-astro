import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AstroLayout from '@/components/layout/AstroLayout';
import { useSocialStore } from '@/stores/socialStore';
import { useSessionStore } from '@/stores/sessionStore';
import { Colors, Fonts } from '@/constants/theme';
import i18n from '@/i18n';

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
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
    // Optionally fetch data on mount
  }, []);

  const handleSendRequest = async () => {
    if (!searchQuery.trim()) return;
    if (searchQuery === user) {
      Alert.alert(i18n.t('common.error'), i18n.t('social.err_self_request'));
      return;
    }

    setLoading(true);
    const result = await sendFriendRequest(searchQuery);
    setLoading(false);

    if (result.success) {
      Alert.alert(i18n.t('social.req_sent_title'), i18n.t('social.req_sent_msg', { name: searchQuery }));
      setSearchQuery('');
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

  return (
    <AstroLayout>
      <View style={styles.header}>
        <Text style={styles.title}>{i18n.t('social.title')}</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={i18n.t('social.search_placeholder')}
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSendRequest} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <MaterialCommunityIcons name="account-plus" size={20} color="#000" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
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
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>{i18n.t('social.tabs.requests')}</Text>
          {friendRequests.length > 0 && (
            <View style={[styles.badge, { backgroundColor: Colors.dark.error }]}>
              <Text style={styles.badgeText}>{friendRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'friends' ? (
          friends.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-group-outline" size={60} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyText}>{i18n.t('social.empty_friends')}</Text>
              <Text style={styles.emptySubtext}>{i18n.t('social.empty_friends_sub')}</Text>
            </View>
          ) : (
            friends.map((friend, idx) => (
              <View key={idx} style={styles.card}>
                <View style={styles.avatar}>
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
        ) : (
          friendRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="bell-outline" size={60} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyText}>{i18n.t('social.empty_requests')}</Text>
              <Text style={styles.emptySubtext}>{i18n.t('social.empty_requests_sub')}</Text>
            </View>
          ) : (
            friendRequests.map((req, idx) => (
              <View key={idx} style={styles.card}>
                <View style={[styles.avatar, { backgroundColor: 'rgba(255, 82, 82, 0.1)' }]}>
                  <Text style={styles.avatarText}>{req.from?.charAt(0).toUpperCase() || '?'}</Text>
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
      </ScrollView>
    </AstroLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
  },
  title: {
    color: Colors.dark.tint,
    fontFamily: Fonts.header,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 20,
    textAlign: 'center',
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
    height: 50,
  },
  searchButton: {
    backgroundColor: Colors.dark.tint,
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  tabActive: {
    borderBottomColor: Colors.dark.tint,
  },
  tabText: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: Fonts.subheader,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: Colors.dark.tint,
  },
  badge: {
    backgroundColor: Colors.dark.tint,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.2)',
  },
  avatarText: {
    color: Colors.dark.tint,
    fontSize: 20,
    fontWeight: '900',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontFamily: Fonts.body,
    fontSize: 16,
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
    fontSize: 12,
    marginTop: 2,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reqActions: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 82, 82, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
});
