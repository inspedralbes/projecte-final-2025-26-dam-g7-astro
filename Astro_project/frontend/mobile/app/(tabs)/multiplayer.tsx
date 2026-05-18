import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, RefreshControl, Alert } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { useSessionStore } from '@/stores/sessionStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import i18n from '@/i18n';
import { AstroButton } from '@/components/ui/AstroButton';
import { AstroCard } from '@/components/ui/AstroCard';
import AstroLayout from '@/components/layout/AstroLayout';
import { SpelledRosco } from '@/components/games/SpelledRosco';
import { RadarScan } from '@/components/games/RadarScan';
import { RadioSignal } from '@/components/games/RadioSignal';
import { RhymeSquad } from '@/components/games/RhymeSquad';
import { SyllableQuest } from '@/components/games/SyllableQuest';
import { SymmetryBreaker } from '@/components/games/SymmetryBreaker';

export default function MultiplayerScreen() {
  const { 
    isConnected, 
    connect, 
    availableRooms, 
    fetchAvailableRooms, 
    createRoom, 
    joinRoom, 
    room,
    leaveRoom,
    startMatch,
    submitRoundResult,
    returnToLobby
  } = useMultiplayerStore();
  
  const userRaw = useSessionStore((state) => state.user);
  const user = (typeof userRaw === 'object' && userRaw !== null) ? (userRaw.username || userRaw.user || userRaw.name) : userRaw;
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    connect();
    fetchAvailableRooms();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAvailableRooms();
    setRefreshing(false);
  };

  const handleCreateRoom = () => {
    if (user) {
      createRoom(user, true, 4, { mode: 'RACE' });
    }
  };

  const handleGameExit = (reward: number) => {
    submitRoundResult();
  };

  const getPlayerName = (p: any): string => {
    if (!p) return 'Astronauta';
    if (typeof p === 'string') return p;
    if (typeof p === 'object') {
      return String(p.username || p.user || p.name || 'Astronauta');
    }
    return String(p);
  };

  const renderGame = () => {
    if (!room) return null;
    const currentGame = String(room.gameConfig?.currentGame || '');

    switch (currentGame) {
      case 'SpelledRosco':
        return <SpelledRosco isMultiplayer onExit={handleGameExit} />;
      case 'RadarScan':
        return <RadarScan isMultiplayer onExit={handleGameExit} />;
      case 'RadioSignal':
        return <RadioSignal isMultiplayer onExit={handleGameExit} />;
      case 'RhymeSquad':
        return <RhymeSquad isMultiplayer onExit={handleGameExit} />;
      case 'SyllableQuest':
        return <SyllableQuest isMultiplayer onExit={handleGameExit} />;
      case 'SymmetryBreaker':
        return <SymmetryBreaker isMultiplayer onExit={handleGameExit} />;
      default:
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Preparant joc: {currentGame}...</Text>
          </View>
        );
    }
  };

  if (room) {
    if (room.status === 'PLAYING') {
      return renderGame();
    }

    if (room.status === 'FINISHED') {
      return (
        <AstroLayout>
          <View style={styles.finishedContainer}>
            <MaterialCommunityIcons name="flag-variant" size={60} color={Colors.dark.tint} />
            <Text style={styles.title}>MISIÓN FINALIZADA</Text>
            <AstroButton 
              label="VOLVER AL LOBBY" 
              onPress={returnToLobby} 
              variant="glow"
              style={styles.actionBtn}
            />
          </View>
        </AstroLayout>
      );
    }

    return (
      <AstroLayout>
        <View style={styles.header}>
          <Text style={styles.title}>SALA DE CONTROL</Text>
          <Text style={styles.roomId}>ID: {String(room.id)}</Text>
        </View>

        <ScrollView style={styles.content}>
          <AstroCard title="TRIPULACIÓ">
            {(room.players || []).map((p, idx) => (
              <View key={idx} style={styles.playerItem}>
                <MaterialCommunityIcons name="account" size={20} color={Colors.dark.tint} />
                <Text style={styles.playerName}>{getPlayerName(p)}</Text>
                {idx === 0 && <Text style={styles.hostBadge}>HOST</Text>}
              </View>
            ))}
          </AstroCard>

          <View style={styles.actions}>
            {getPlayerName(room.players?.[0]) === user && (
              <AstroButton 
                label="INICIAR MISSIÓ" 
                onPress={startMatch} 
                variant="glow"
                style={styles.actionBtn}
              />
            )}
            <AstroButton 
              label="ABANDONAR" 
              onPress={leaveRoom} 
              variant="outline"
              style={styles.actionBtn}
            />
          </View>
        </ScrollView>
      </AstroLayout>
    );
  }

  return (
    <AstroLayout>
      <View style={styles.header}>
        <Text style={styles.title}>MULTIJUGADOR</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#00ff88' : '#ff5252' }]} />
          <Text style={styles.statusText}>{isConnected ? 'ONLINE' : 'OFFLINE'}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.tint} />}
      >
        <View style={styles.mainActions}>
          <AstroButton 
            label="CREAR NOVA SALA" 
            onPress={handleCreateRoom} 
            icon="plus-circle"
            variant="glow"
          />
        </View>

        <Text style={styles.sectionTitle}>SALES DISPONIBLES</Text>
        
        {(availableRooms || []).length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="antenna" size={48} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyText}>No s'han trobat sales actives</Text>
          </View>
        ) : (
          availableRooms.map((r, rIdx) => (
            <Pressable key={String(r.id || rIdx)} onPress={() => joinRoom(r.id)} style={styles.roomCard}>
              <View style={styles.roomInfo}>
                <Text style={styles.roomHost}>{getPlayerName(r.players?.[0])}'s Mission</Text>
                <Text style={styles.roomPlayers}>
                  {Number(r.players?.length || 0)} / {Number(r.maxPlayers || 4)} Astronautes
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.dark.tint} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </AstroLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontFamily: Fonts.header,
    color: '#fff',
    fontSize: 20,
    letterSpacing: 2,
  },
  roomId: {
    fontFamily: Fonts.subheader,
    color: Colors.dark.tint,
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontFamily: Fonts.subheader,
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mainActions: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontFamily: Fonts.header,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 15,
    letterSpacing: 1.5,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  roomInfo: {
    flex: 1,
  },
  roomHost: {
    fontFamily: Fonts.subheader,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  roomPlayers: {
    fontFamily: Fonts.body,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: Fonts.body,
    color: 'rgba(255,255,255,0.2)',
    marginTop: 15,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  playerName: {
    fontFamily: Fonts.subheader,
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  hostBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.dark.tint,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actions: {
    marginTop: 20,
    gap: 12,
  },
  actionBtn: {
    width: '100%',
  },
  finishedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  }
});