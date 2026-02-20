import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Modal,
    ActivityIndicator,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAstroStore } from '../../stores/astroStore';

export default function SingleplayerScreen() {
    const { registerCompletedGame, user } = useAstroStore();
    const [selectedMission, setSelectedMission] = useState<any>(null);
    const [isGameActive, setIsGameActive] = useState(false);
    const [reporting, setReporting] = useState(false);

    const missions = [
        {
            id: 1,
            title: 'Decodificación Rápida',
            key: 'decodificacion',
            desc: 'Entrena tu velocidad de procesamiento visual.',
            icon: 'brain',
            difficulty: 'Fácil',
            color: '#00e5ff'
        },
        {
            id: 2,
            title: 'Escaneo Estelar',
            key: 'escaneo',
            desc: 'Localiza patrones en campos de asteroides.',
            icon: 'radar',
            difficulty: 'Media',
            color: '#fbbf24'
        },
        {
            id: 3,
            title: 'Memoria Cuántica',
            key: 'memoria',
            desc: 'Memoriza secuencias de salto hiperespacial.',
            icon: 'fountain-pen-tip',
            difficulty: 'Difícil',
            color: '#ef4444'
        }
    ];

    const startRandomMission = () => {
        const random = missions[Math.floor(Math.random() * missions.length)];
        handleStartMission(random);
    };

    const handleStartMission = (mission: any) => {
        setSelectedMission(mission);
        setIsGameActive(true);
    };

    const finishGame = async (score: number) => {
        if (!user) return;
        setReporting(true);
        const result = await registerCompletedGame(selectedMission.key, score);
        setReporting(false);
        setIsGameActive(false);

        if (result.success) {
            Alert.alert(
                "¡Misión Completada!",
                `Has obtenido ${score} puntos y ${result.data?.coinsEarned || 50} coins.`
            );
        } else {
            Alert.alert("Error de Sincronización", "No se pudo reportar el resultado a la flota.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>CENTRO DE ENTRENAMIENTO</Text>
                    <Text style={styles.headerSubtitle}>Selecciona tu próxima misión, tripulante.</Text>
                </View>

                {/* Random Mission Button */}
                <TouchableOpacity style={styles.randomBtn} onPress={startRandomMission}>
                    <LinearGradient
                        colors={['#00e5ff', '#2979ff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.randomGradient}
                    >
                        <MaterialCommunityIcons name="star-four-points" size={24} color="black" />
                        <Text style={styles.randomText}>MISIÓN ALEATORIA</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.missionList}>
                    {missions.map((mission) => (
                        <TouchableOpacity
                            key={mission.id}
                            style={styles.missionCard}
                            onPress={() => handleStartMission(mission)}
                        >
                            <View style={[styles.iconBox, { backgroundColor: mission.color + '20' }]}>
                                <MaterialCommunityIcons name={mission.icon as any} size={32} color={mission.color} />
                            </View>

                            <View style={styles.missionInfo}>
                                <View style={styles.missionHeader}>
                                    <Text style={styles.missionTitle}>{mission.title}</Text>
                                    <View style={[styles.difficultyBadge, { borderColor: mission.color }]}>
                                        <Text style={[styles.difficultyText, { color: mission.color }]}>{mission.difficulty}</Text>
                                    </View>
                                </View>
                                <Text style={styles.missionDesc}>{mission.desc}</Text>

                                <View style={styles.missionFooter}>
                                    <View style={styles.statItem}>
                                        <MaterialCommunityIcons name="timer-outline" size={14} color="#94a3b8" />
                                        <Text style={styles.statText}>2 min</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <MaterialCommunityIcons name="currency-usd" size={14} color="#fbbf24" />
                                        <Text style={styles.statText}>+50 coins</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Global Progress Placeholder */}
                <View style={styles.progressSection}>
                    <Text style={styles.sectionTitle}>PROGRESO DE ENTRENAMIENTO</Text>
                    <View style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Capacidad Cognitiva</Text>
                            <Text style={styles.progressValue}>65%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: '65%' }]} />
                        </View>
                        <Text style={styles.progressFooter}>+5% desde la última sincronización</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Game Simulation Modal */}
            <Modal visible={isGameActive} animationType="slide">
                <SafeAreaView style={styles.gameContainer}>
                    <LinearGradient colors={['#0f172a', '#000814']} style={StyleSheet.absoluteFill} />

                    <View style={styles.gameHeader}>
                        <Text style={styles.gameTitle}>{selectedMission?.title}</Text>
                        <TouchableOpacity onPress={() => setIsGameActive(false)} style={styles.closeBtn}>
                            <MaterialCommunityIcons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.gameBody}>
                        <MaterialCommunityIcons
                            name={selectedMission?.icon as any}
                            size={100}
                            color={selectedMission?.color}
                        />
                        <Text style={styles.gameInstruction}>Simulando entrenamiento...</Text>
                        <Text style={styles.gameSubText}>En una versión final, aquí se cargaría el mini-juego interactivo.</Text>

                        <TouchableOpacity
                            style={[styles.finishBtn, { backgroundColor: selectedMission?.color }]}
                            onPress={() => finishGame(Math.floor(Math.random() * 500) + 500)}
                            disabled={reporting}
                        >
                            {reporting ? (
                                <ActivityIndicator color="black" />
                            ) : (
                                <Text style={styles.finishBtnText}>COMPLETAR MISIÓN</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        marginBottom: 32,
        marginTop: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 2,
    },
    headerSubtitle: {
        color: '#94a3b8',
        fontSize: 14,
        marginTop: 8,
    },
    randomBtn: {
        marginBottom: 32,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#00e5ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    randomGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 12,
    },
    randomText: {
        color: 'black',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    missionList: {
        gap: 16,
    },
    missionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    missionInfo: {
        flex: 1,
    },
    missionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    missionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    difficultyBadge: {
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    difficultyText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    missionDesc: {
        color: '#94a3b8',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
    },
    missionFooter: {
        flexDirection: 'row',
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        color: '#94a3b8',
        fontSize: 12,
    },
    progressSection: {
        marginTop: 40,
    },
    sectionTitle: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 16,
    },
    progressCard: {
        backgroundColor: 'rgba(0, 229, 255, 0.05)',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(0, 229, 255, 0.1)',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    progressLabel: {
        color: 'white',
        fontWeight: 'bold',
    },
    progressValue: {
        color: '#00e5ff',
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#00e5ff',
    },
    progressFooter: {
        color: '#4caf50',
        fontSize: 12,
        marginTop: 12,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    gameContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    gameHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
    },
    gameTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '900',
    },
    closeBtn: {
        padding: 4,
    },
    gameBody: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    gameInstruction: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 32,
        textAlign: 'center',
    },
    gameSubText: {
        color: '#94a3b8',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 24,
    },
    finishBtn: {
        marginTop: 60,
        paddingHorizontal: 40,
        paddingVertical: 18,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
    },
    finishBtnText: {
        color: 'black',
        fontWeight: '900',
        fontSize: 16,
    },
});
