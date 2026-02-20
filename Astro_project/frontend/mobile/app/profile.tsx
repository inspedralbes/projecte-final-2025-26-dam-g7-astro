import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    SafeAreaView
} from 'react-native';
import { useAstroStore } from '../stores/astroStore';
import { ACHIEVEMENTS } from '../constants/achievements';
import Medal from '../components/achievements/Medal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Mock assets path resolver for React Native
const getImageSource = (file: string | null) => {
    if (!file) return null;
    // In a real Expo project, you'd use require() or a dynamic loader.
    // For this demo, we'll assume they are in assets/images
    // Note: we might need to adjust this depending on how static assets are handled in the build
    return { uri: `https://placeholder.com/${file}` }; // Fallback or real path
};

const ProfileScreen = () => {
    const router = useRouter();
    const {
        user,
        rank,
        plan,
        selectedAchievements,
        avatar,
        mascot,
        logout
    } = useAstroStore();

    const [avatarDialog, setAvatarDialog] = useState(false);

    const getAchievement = (id: number | null) => {
        if (id === null) return null;
        return ACHIEVEMENTS.find(a => a.id === id);
    };

    const handleLogout = () => {
        logout();
        router.replace('/');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Banner Section */}
                <View style={styles.bannerContainer}>
                    <Image
                        source={require('../assets/images/fondo3.jpg')}
                        style={styles.bannerImage}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(13, 15, 20, 0.8)']}
                        style={styles.bannerOverlay}
                    />
                </View>

                {/* Profile Header Overlap */}
                <View style={styles.headerOverlap}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarCircle}>
                            {/* We use a fallback if the local require is tricky with dynamic names */}
                            <Image
                                source={require('../assets/images/Astronauta_blanc.jpg')}
                                style={styles.avatarImage}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.editAvatarBtn}
                            onPress={() => setAvatarDialog(true)}
                        >
                            <MaterialCommunityIcons name="camera" size={20} color="#00e5ff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* User Info Section */}
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user || 'Explorador'}</Text>
                    <View style={styles.rankRow}>
                        <View style={styles.rankChip}>
                            <Text style={styles.rankText}>{rank || 'Cadete Estelar'}</Text>
                        </View>
                        <Text style={styles.levelText}>• Nivel 1</Text>
                        <View style={[styles.statusDot, user ? styles.online : styles.offline]} />
                        <Text style={styles.statusText}>{user ? 'En órbita' : 'En base'}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>PLAN ACTUAL</Text>
                        <Text style={[styles.statValue, { color: '#00e5ff' }]}>{plan || 'INDIVIDUAL_FREE'}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>MISIÓN</Text>
                        <Text style={styles.statValue}>EXPLORACIÓN</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>SISTEMA</Text>
                        <Text style={styles.statValue}>ASTRO-V1</Text>
                    </View>
                </View>

                {/* Achievements Section */}
                <View style={styles.achievementsHeader}>
                    <Text style={styles.sectionTitle}>LOGROS ACTIVOS</Text>
                </View>
                <View style={styles.achievementsRow}>
                    {selectedAchievements.map((id, index) => {
                        const achievement = getAchievement(id);
                        return (
                            <TouchableOpacity key={index} style={styles.achievementBox}>
                                {achievement ? (
                                    <Medal
                                        type={achievement.type as any}
                                        icon={achievement.icon}
                                        scale={0.4}
                                        iconSize={48}
                                    />
                                ) : (
                                    <MaterialCommunityIcons name="plus" size={32} color="#424242" />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Actions Grid */}
                <View style={styles.actionsGrid}>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Text style={styles.btnText}>INVENTARIO</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Text style={styles.btnText}>CAMBIAR PLAN</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.logoutBtn]}
                        onPress={handleLogout}
                    >
                        <Text style={styles.btnText}>CERRAR SESIÓN Y SALIR</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    bannerContainer: {
        height: 180,
        width: '100%',
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        opacity: 0.7,
    },
    bannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    headerOverlap: {
        marginTop: -70,
        paddingHorizontal: 20,
        alignItems: 'flex-start',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 6,
        borderColor: '#0d0f14',
        backgroundColor: 'white',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: '140%',
        height: '140%',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1a1d26',
        borderWidth: 3,
        borderColor: '#0d0f14',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    userInfo: {
        paddingHorizontal: 24,
        marginTop: 16,
    },
    userName: {
        fontSize: 32,
        fontWeight: '900',
        color: 'white',
        textTransform: 'capitalize',
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    rankChip: {
        backgroundColor: '#00e5ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    rankText: {
        color: 'black',
        fontSize: 12,
        fontWeight: 'bold',
    },
    levelText: {
        color: '#bdbdbd',
        fontSize: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 4,
    },
    online: {
        backgroundColor: '#4caf50',
        shadowColor: '#4caf50',
        shadowRadius: 4,
        elevation: 4,
    },
    offline: {
        backgroundColor: '#f44336',
    },
    statusText: {
        color: '#757575',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 24,
        marginVertical: 24,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#616161',
        letterSpacing: 1,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#e0e0e0',
        marginTop: 4,
    },
    achievementsHeader: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#bdbdbd',
        letterSpacing: 1,
    },
    achievementsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 32,
    },
    achievementBox: {
        flex: 1,
        height: 120,
        backgroundColor: '#1a1d26',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionsGrid: {
        paddingHorizontal: 24,
        gap: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        height: 48,
        backgroundColor: '#212121',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutBtn: {
        backgroundColor: '#c62828',
        marginTop: 8,
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default ProfileScreen;
