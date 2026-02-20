import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ACHIEVEMENTS } from '../constants/achievements';
import Medal from '../components/achievements/Medal';

export default function AchievementsScreen() {
    const router = useRouter();

    // Demo: Mark 1 and 3 as unlocked
    const unlockedIds = [1, 3];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#00e5ff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>LOGROS DE LA FLOTA</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.grid}>
                    {ACHIEVEMENTS.map(achievement => {
                        const isUnlocked = unlockedIds.includes(achievement.id);
                        return (
                            <View key={achievement.id} style={[styles.card, !isUnlocked && styles.lockedCard]}>
                                <View style={styles.medalWrapper}>
                                    <Medal
                                        type={achievement.type as any}
                                        icon={achievement.icon}
                                        locked={!isUnlocked}
                                        scale={0.5}
                                    />
                                </View>
                                <View style={styles.info}>
                                    <Text style={[styles.title, !isUnlocked && styles.lockedText]}>{achievement.title}</Text>
                                    <Text style={styles.desc}>{achievement.description}</Text>
                                    {!isUnlocked && (
                                        <View style={styles.lockedBadge}>
                                            <MaterialCommunityIcons name="lock" size={12} color="#64748b" />
                                            <Text style={styles.lockedBadgeText}>BLOQUEADO</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    backBtn: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 2,
    },
    scrollContent: {
        padding: 20,
    },
    grid: {
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    lockedCard: {
        opacity: 0.6,
    },
    medalWrapper: {
        width: 60,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        overflow: 'hidden',
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    lockedText: {
        color: '#94a3b8',
    },
    desc: {
        color: '#64748b',
        fontSize: 13,
        lineHeight: 18,
    },
    lockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    lockedBadgeText: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
