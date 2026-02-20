import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    Modal,
    FlatList
} from 'react-native';
import { useAstroStore } from '../../stores/astroStore';
import { ACHIEVEMENTS } from '../../constants/achievements';
import Medal from '../../components/achievements/Medal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const avatarOptions = [
    { label: 'Blanc', file: 'Astronauta_blanc.jpg', require: null },
    { label: 'Groc', file: 'Astronauta_groc.jpg', require: null },
    { label: 'Lila', file: 'Astronauta_lila.jpg', require: null },
    { label: 'Negre', file: 'Astronauta_negre.jpg', require: null },
    { label: 'Taronja', file: 'Astronauta_taronja.jpg', require: null },
    { label: 'Verd', file: 'Astronauta_verd.jpg', require: null },
    { label: 'Vermell', file: 'Astronauta_vermell.jpg', require: null }
];

const mascotOptions = [
    { label: 'Balena', file: 'Balena_alien.jpg', require: null },
    { label: 'Alien', file: 'Mascota_alien2.jpg', require: null },
    { label: 'Dron', file: 'Mascota_dron.jpg', require: null },
    { label: 'Pop', file: 'Pop_alien.jpg', require: null }
];

const ProfileScreen = () => {
    const router = useRouter();
    const {
        user,
        rank,
        plan,
        selectedAchievements,
        avatar,
        mascot,
        logout,
        updateAvatar,
        updateMascot,
        updateAchievements
    } = useAstroStore();

    const [avatarDialog, setAvatarDialog] = useState(false);
    const [mascotDialog, setMascotDialog] = useState(false);
    const [selectionDialog, setSelectionDialog] = useState(false);
    const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);

    const getAchievement = (id: number | null) => {
        if (id === null) return null;
        return ACHIEVEMENTS.find((a: any) => a.id === id);
    };

    const currentAvatarSource = useMemo(() => {
        const option = avatarOptions.find(o => o.file === avatar);
        return option ? option.require : avatarOptions[0].require;
    }, [avatar]);

    const currentMascotSource = useMemo(() => {
        if (!mascot) return null;
        const option = mascotOptions.find(o => o.file === mascot);
        return option ? option.require : null;
    }, [mascot]);

    const handleSelectAchievement = async (achievementId: number | null) => {
        if (currentSlotIndex === null) return;

        let newSelection = [...selectedAchievements];
        // Remove duplicate if exists in another slot
        if (achievementId !== null) {
            const existingIndex = newSelection.findIndex(id => id !== null && Number(id) === achievementId);
            if (existingIndex !== -1) {
                newSelection[existingIndex] = null;
            }
        }
        newSelection[currentSlotIndex] = achievementId;

        await updateAchievements(newSelection);
        setSelectionDialog(false);
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
                    {/* Banner Image Removed */}
                    <LinearGradient
                        colors={['transparent', 'rgba(13, 15, 20, 1)']}
                        style={styles.bannerOverlay}
                    />
                </View>

                {/* Profile Header Overlap */}
                <View style={styles.headerOverlap}>
                    <View style={styles.avatarOverlapContainer}>
                        <View style={styles.mainAvatarBox}>
                            <View style={styles.avatarCircle}>
                                <Image source={currentAvatarSource} style={styles.avatarImage} />
                            </View>
                            <TouchableOpacity
                                style={styles.editAvatarBtn}
                                onPress={() => setAvatarDialog(true)}
                            >
                                <MaterialCommunityIcons name="camera" size={20} color="#00e5ff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.mascotOverlapBox}>
                            {currentMascotSource ? (
                                <TouchableOpacity onPress={() => setMascotDialog(true)}>
                                    <View style={styles.mascotBadgeBig}>
                                        <Image source={currentMascotSource} style={styles.mascotImage} />
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.btnAddMascot}
                                    onPress={() => setMascotDialog(true)}
                                >
                                    <MaterialCommunityIcons name="paw" size={24} color="#7000ff" />
                                </TouchableOpacity>
                            )}
                        </View>
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
                    <TouchableOpacity onPress={() => router.push('/achievements')}>
                        <Text style={styles.viewMoreText}>VER TODOS</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.achievementsRow}>
                    {selectedAchievements.map((id: number | null, index: number) => {
                        const achievement = getAchievement(id);
                        return (
                            <TouchableOpacity
                                key={index}
                                style={styles.achievementBox}
                                onPress={() => {
                                    setCurrentSlotIndex(index);
                                    setSelectionDialog(true);
                                }}
                            >
                                {achievement ? (
                                    <Medal
                                        type={achievement.type as any}
                                        icon={achievement.icon}
                                        scale={0.5}
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
                        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/inventory')}>
                            <Text style={styles.btnText}>INVENTARIO</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/plans')}>
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

            {/* Dialogs */}
            <SelectionModal
                visible={avatarDialog}
                onClose={() => setAvatarDialog(false)}
                title="Traje de Astronauta"
                data={avatarOptions}
                current={avatar}
                onSelect={(file: string) => {
                    updateAvatar(file);
                    setAvatarDialog(false);
                }}
            />

            <SelectionModal
                visible={mascotDialog}
                onClose={() => setMascotDialog(false)}
                title="Compañero de Misión"
                data={mascotOptions}
                current={mascot}
                onSelect={(file: string | null) => {
                    updateMascot(file);
                    setMascotDialog(false);
                }}
                allowNone
            />

            {/* Achievement Selection Modal */}
            <Modal visible={selectionDialog} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Logro</Text>
                            <TouchableOpacity onPress={() => setSelectionDialog(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={ACHIEVEMENTS}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => {
                                const isSelected = selectedAchievements.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        style={[styles.achievementListItem, isSelected && styles.selectedItem]}
                                        onPress={() => handleSelectAchievement(item.id)}
                                    >
                                        <View style={styles.medalSmall}>
                                            <Medal type={item.type as any} icon={item.icon} scale={0.3} iconSize={48} />
                                        </View>
                                        <View style={styles.achievementInfo}>
                                            <Text style={styles.achievementTitle}>{item.title}</Text>
                                            <Text style={styles.achievementDesc}>{item.description}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            ListFooterComponent={
                                <TouchableOpacity
                                    style={styles.achievementListItem}
                                    onPress={() => handleSelectAchievement(null)}
                                >
                                    <MaterialCommunityIcons name="delete-outline" size={24} color="#ef4444" />
                                    <Text style={[styles.achievementTitle, { color: '#ef4444', marginLeft: 12 }]}>Quitar Logro</Text>
                                </TouchableOpacity>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const SelectionModal = ({ visible, onClose, title, data, current, onSelect, allowNone = false }: any) => (
    <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <MaterialCommunityIcons name="close" size={24} color="white" />
                    </TouchableOpacity>
                </View>
                <View style={styles.grid}>
                    {data.map((item: any) => (
                        <TouchableOpacity
                            key={item.file}
                            style={styles.gridItem}
                            onPress={() => onSelect(item.file)}
                        >
                            <View style={[styles.optionCircle, current === item.file && styles.activeOption]}>
                                <Image source={item.require} style={styles.optionImage} />
                            </View>
                            <Text style={styles.optionLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                    {allowNone && (
                        <TouchableOpacity
                            style={styles.gridItem}
                            onPress={() => onSelect(null)}
                        >
                            <View style={[styles.optionCircle, styles.noneCircle, current === null && styles.activeOption]}>
                                <MaterialCommunityIcons name="close" size={32} color="#616161" />
                            </View>
                            <Text style={styles.optionLabel}>Ninguno</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    </Modal>
);

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
        backgroundColor: '#1a1d26',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        opacity: 0.6,
    },
    bannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    headerOverlap: {
        marginTop: -70,
        paddingHorizontal: 24,
    },
    avatarOverlapContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 16,
    },
    mainAvatarBox: {
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
    mascotOverlapBox: {
        marginBottom: 5,
    },
    mascotBadgeBig: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 5,
        borderColor: '#0d0f14',
        backgroundColor: 'white',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mascotImage: {
        width: '140%',
        height: '140%',
    },
    btnAddMascot: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(112, 0, 255, 0.1)',
        borderWidth: 2,
        borderColor: '#0d0f14',
        justifyContent: 'center',
        alignItems: 'center',
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
        backgroundColor: 'rgba(255,255,255,0.05)',
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
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#bdbdbd',
        letterSpacing: 1,
    },
    viewMoreText: {
        color: '#00e5ff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    achievementsHeader: {
        paddingHorizontal: 24,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        backgroundColor: '#1a1b1e',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#0d0f14',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    gridItem: {
        width: (width - 80) / 3,
        alignItems: 'center',
        marginBottom: 16,
    },
    optionCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'white',
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: 'transparent',
    },
    activeOption: {
        borderColor: '#00e5ff',
    },
    optionImage: {
        width: '100%',
        height: '100%',
    },
    optionLabel: {
        color: '#bdbdbd',
        fontSize: 12,
        marginTop: 8,
        textAlign: 'center',
    },
    noneCircle: {
        backgroundColor: '#1a1d26',
        justifyContent: 'center',
        alignItems: 'center',
    },
    achievementListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedItem: {
        borderColor: '#00e5ff30',
        backgroundColor: 'rgba(0, 229, 255, 0.05)',
    },
    medalSmall: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    achievementInfo: {
        flex: 1,
        marginLeft: 16,
    },
    achievementTitle: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    achievementDesc: {
        color: '#757575',
        fontSize: 12,
        marginTop: 2,
    }
});

export default ProfileScreen;
