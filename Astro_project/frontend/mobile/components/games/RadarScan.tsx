import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Modal,
    SafeAreaView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LEVELS = [
    { distractor: 'p', target: 'q', grid: 5, tunnel: 180 },
    { distractor: 'b', target: 'd', grid: 6, tunnel: 150 },
    { distractor: 'm', target: 'n', grid: 8, tunnel: 130 },
    { distractor: 'O', target: 'Q', grid: 10, tunnel: 110 },
    { distractor: 'E', target: 'F', grid: 12, tunnel: 90 }
];

interface RadarScanProps {
    onGameOver: (score: number) => void;
}

const RadarScan: React.FC<RadarScanProps> = ({ onGameOver }) => {
    const insets = useSafeAreaInsets();
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [currentLevel, setCurrentLevel] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [board, setBoard] = useState<string[]>([]);
    const [targetIndex, setTargetIndex] = useState(-1);
    const [touchPos, setTouchPos] = useState({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 });

    const config = LEVELS[Math.min(currentLevel, LEVELS.length - 1)];
    const tunnelSize = config.tunnel;

    // Timer
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setGameState('gameover');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const startGame = () => {
        setScore(0);
        setTimeLeft(60);
        setCurrentLevel(0);
        generateLevel(0);
        setGameState('playing');
    };

    const generateLevel = (levelIdx: number) => {
        const cfg = LEVELS[Math.min(levelIdx, LEVELS.length - 1)];
        const total = cfg.grid * cfg.grid;
        const newBoard = Array(total).fill(cfg.distractor);
        const targetIdx = Math.floor(Math.random() * total);
        newBoard[targetIdx] = cfg.target;
        setBoard(newBoard);
        setTargetIndex(targetIdx);
    };

    const handlePress = (index: number) => {
        if (gameState !== 'playing') return;

        if (index === targetIndex) {
            const nextLevel = currentLevel + 1;
            setScore(prev => prev + 100 + (currentLevel * 20));
            setTimeLeft(prev => Math.min(60, prev + 5));
            setCurrentLevel(nextLevel);
            generateLevel(nextLevel);
        } else {
            setTimeLeft(prev => Math.max(0, prev - 3));
            setScore(prev => Math.max(0, prev - 10));
        }
    };

    const onTouchMove = (e: any) => {
        setTouchPos({
            x: e.nativeEvent.pageX,
            y: e.nativeEvent.pageY
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: '#0f172a' }]} onStartShouldSetResponder={() => true} onResponderMove={onTouchMove}>
            <View style={[styles.hud, { paddingTop: insets.top + 10 }]}>
                <Text style={[styles.hudText, timeLeft <= 10 && styles.lowTime]}>
                    TEMPS: {timeLeft}s
                </Text>
                <View style={styles.targetIndicator}>
                    <Text style={styles.targetLabel}>OBJECTIU: {config.target}</Text>
                </View>
                <Text style={styles.hudText}>PUNTS: {score}</Text>
            </View>

            <View style={styles.boardContainer}>
                <View style={[styles.grid, { width: SCREEN_WIDTH - 20, height: SCREEN_WIDTH - 20 }]}>
                    {board.map((letter, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[
                                styles.cell,
                                { width: (SCREEN_WIDTH - 20) / config.grid, height: (SCREEN_WIDTH - 20) / config.grid }
                            ]}
                            onPress={() => handlePress(i)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.cellText, { fontSize: Math.max(12, 32 - config.grid * 1.5) }]}>{letter}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Flashlight Curtains */}
            <View style={[styles.curtain, { top: 0, left: 0, right: 0, height: touchPos.y - tunnelSize / 2 }]} pointerEvents="none" />
            <View style={[styles.curtain, { bottom: 0, left: 0, right: 0, height: SCREEN_HEIGHT - (touchPos.y + tunnelSize / 2) }]} pointerEvents="none" />
            <View style={[styles.curtain, { top: touchPos.y - tunnelSize / 2, bottom: SCREEN_HEIGHT - (touchPos.y + tunnelSize / 2), left: 0, width: touchPos.x - tunnelSize / 2 }]} pointerEvents="none" />
            <View style={[styles.curtain, { top: touchPos.y - tunnelSize / 2, bottom: SCREEN_HEIGHT - (touchPos.y + tunnelSize / 2), right: 0, width: SCREEN_WIDTH - (touchPos.x + tunnelSize / 2) }]} pointerEvents="none" />

            {/* Overlays */}
            <Modal visible={gameState === 'start'} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <MaterialCommunityIcons name="radar" size={80} color="#00e5ff" />
                        <Text style={styles.modalTitle}>ESCÀNER DE RÀDAR</Text>
                        <Text style={styles.modalDesc}>
                            Troba la lletra diferent abans que s'esgoti el temps. El teu camp de visió és limitat!
                        </Text>
                        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                            <Text style={styles.startBtnText}>INICIAR MISSIÓ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={gameState === 'gameover'} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <MaterialCommunityIcons name="trophy" size={80} color="#fbbf24" />
                        <Text style={styles.modalTitle}>MISSIÓ COMPLETADA</Text>
                        <Text style={styles.resultText}>Puntuació: {score}</Text>
                        <TouchableOpacity style={styles.startBtn} onPress={() => onGameOver(score)}>
                            <Text style={styles.startBtnText}>TORNAR AL MENÚ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    hud: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        zIndex: 50,
    },
    hudText: {
        color: '#00e5ff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    lowTime: {
        color: '#ef4444',
    },
    targetIndicator: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#00e5ff',
    },
    targetLabel: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    boardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cellText: {
        color: '#334155', // Slate-700
        fontSize: 24,
        fontWeight: 'bold',
    },
    curtain: {
        position: 'absolute',
        backgroundColor: 'rgba(11, 17, 32, 0.98)',
        zIndex: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        borderWidth: 2,
        borderColor: '#00e5ff',
    },
    modalTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: '900',
        marginTop: 16,
        textAlign: 'center',
    },
    modalDesc: {
        color: '#94a3b8',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 32,
        lineHeight: 24,
    },
    startBtn: {
        backgroundColor: '#00e5ff',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
    },
    startBtnText: {
        color: 'black',
        fontWeight: '900',
        fontSize: 16,
    },
    resultText: {
        color: '#00e5ff',
        fontSize: 32,
        fontWeight: 'bold',
        marginVertical: 20,
    }
});

export default RadarScan;
