import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Modal,
    Platform,
    ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WORDS = [
    { word: 'NAU', hint: 'Vehicle espacial' },
    { word: 'ASTRE', hint: 'Cos celeste' },
    { word: 'PLANETA', hint: 'Orbita al voltant d\'una estrella' },
    { word: 'GALAXIA', hint: 'Conjunt immens d\'estrelles' },
    { word: 'COET', hint: 'Propulsió a raig' },
    { word: 'LLUNA', hint: 'Satèl·lit natural' },
    { word: 'ORBITA', hint: 'Trajectòria al voltant d\'un cos' },
    { word: 'COMETA', hint: 'Cos amb cua brillant' },
    { word: 'NEBULOSA', hint: 'Núvol de gas i pols a l\'espai' },
    { word: 'SUPERNOVA', hint: 'Explosió final d\'una estrella' },
    { word: 'SOL', hint: 'L\'estrella del nostre sistema' },
    { word: 'MART', hint: 'El planeta vermell' },
    { word: 'LLUM', hint: 'Viatja molt ràpid per l\'espai' },
    { word: 'OVNI', hint: 'Objecte Volador No Identificat' },
    { word: 'CODI', hint: 'Instruccions per a un programa' },
    { word: 'DADES', hint: 'Informació que processa la IA' },
    { word: 'XIP', hint: 'Cervell de silici d\'un ordinador' },
    { word: 'WIFI', hint: 'Connexió sense cables' },
    { word: 'GAT', hint: 'Felí domèstic' },
    { word: 'GOS', hint: 'El millor amic de l\'home' },
    { word: 'BOSC', hint: 'Lloc ple d\'arbres' },
    { word: 'POMA', hint: 'Fruita vermella o verda' },
    { word: 'PA', hint: 'Aliment bàsic de farina' },
    { word: 'ANY', hint: '365 dies' },
    { word: 'MES', hint: 'Part d\'un any' }
];

interface WordConstructionProps {
    onGameOver: (score: number) => void;
}

const WordConstruction: React.FC<WordConstructionProps> = ({ onGameOver }) => {
    const insets = useSafeAreaInsets();
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = 5;

    const [currentWordObj, setCurrentWordObj] = useState(WORDS[0]);
    const [pool, setPool] = useState<{ id: number, letter: string }[]>([]);
    const [selection, setSelection] = useState<{ id: number, letter: string }[]>([]);

    const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' | null }>({ message: '', type: null });

    const startGame = () => {
        setScore(0);
        setLevel(1);
        setCurrentStep(0);
        loadNewWord();
        setGameState('playing');
    };

    const loadNewWord = () => {
        const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        setCurrentWordObj(randomWord);

        // Scramble letters
        const letters = randomWord.word.split('').map((l, i) => ({ id: Math.random() + i, letter: l }));
        for (let i = letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [letters[i], letters[j]] = [letters[j], letters[i]];
        }

        setPool(letters);
        setSelection([]);
        setFeedback({ message: '', type: null });
    };

    const addToSelection = (item: { id: number, letter: string }) => {
        setSelection([...selection, item]);
        setPool(pool.filter(p => p.id !== item.id));
    };

    const removeFromSelection = (item: { id: number, letter: string }) => {
        setPool([...pool, item]);
        setSelection(selection.filter(s => s.id !== item.id));
    };

    const checkAnswer = () => {
        const guess = selection.map(s => s.letter).join('').toUpperCase();
        const correct = currentWordObj.word.toUpperCase();

        if (guess === correct) {
            setFeedback({ message: 'Correcte! Bloc afegit.', type: 'success' });
            setScore(prev => prev + 100 + (level * 10));
            const nextStep = currentStep + 1;

            if (nextStep >= totalSteps) {
                setTimeout(() => setGameState('gameover'), 1000);
            } else {
                setCurrentStep(nextStep);
                setTimeout(loadNewWord, 1000);
            }
        } else {
            setFeedback({ message: 'Error estructural! Torna-ho a intentar.', type: 'error' });
            setScore(prev => Math.max(0, prev - 20));
        }
    };

    const resetPool = () => {
        setPool([...pool, ...selection]);
        setSelection([]);
        setFeedback({ message: '', type: null });
    };

    return (
        <View style={[styles.container, { backgroundColor: '#0f172a' }]}>
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 10) }]}>
                <View>
                    <Text style={styles.levelText}>NIVELL {level}</Text>
                    <Text style={styles.scoreText}>PUNTUACIÓ: {score}</Text>
                </View>
                <View style={styles.progressContainer}>
                    <Text style={styles.progressLabel}>BASE: {currentStep}/{totalSteps}</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={[styles.gameArea, { paddingBottom: insets.bottom + 40 }]}>
                <Text style={styles.hintTitle}>PISTA:</Text>
                <Text style={styles.hintValue}>{currentWordObj.hint}</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ESTRUCTURA ACTUAL:</Text>
                    <View style={styles.selectionRow}>
                        {selection.length === 0 && <Text style={styles.placeholder}>TOCA LLETRES PER CONSTRUIR</Text>}
                        {selection.map((item, i) => (
                            <TouchableOpacity key={item.id} style={styles.chip} onPress={() => removeFromSelection(item)}>
                                <Text style={styles.chipText}>{item.letter}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>PECES DISPONIBLES:</Text>
                    <View style={styles.poolRow}>
                        {pool.map((item) => (
                            <TouchableOpacity key={item.id} style={[styles.chip, styles.poolChip]} onPress={() => addToSelection(item)}>
                                <Text style={styles.chipText}>{item.letter}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {feedback.message !== '' && (
                    <View style={[styles.alert, feedback.type === 'success' ? styles.successAlert : styles.errorAlert]}>
                        <Text style={styles.alertText}>{feedback.message}</Text>
                    </View>
                )}

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.buildBtn} onPress={checkAnswer} disabled={selection.length === 0}>
                        <Text style={styles.buildBtnText}>CONSTRUIR BLOC</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.resetBtn} onPress={resetPool}>
                        <Text style={styles.resetBtnText}>BARREJAR DE NOU</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={gameState === 'start'} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <MaterialCommunityIcons name="crane" size={80} color="#00e5ff" />
                        <Text style={styles.modalTitle}>CONSTRUCCIÓ DE PARAULES</Text>
                        <Text style={styles.modalDesc}>
                            Ordena les lletres per formar paraules i construir la base espacial.
                        </Text>
                        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                            <Text style={styles.startBtnText}>COMENÇAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={gameState === 'gameover'} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <MaterialCommunityIcons name="trophy" size={80} color="#fbbf24" />
                        <Text style={styles.modalTitle}>BASE COMPLETADA!</Text>
                        <Text style={styles.resultText}>Punts: {score}</Text>
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
    header: {
        padding: 20,
        backgroundColor: '#1e1b4b',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#312e81',
    },
    levelText: {
        color: '#00e5ff',
        fontSize: 18,
        fontWeight: '900',
    },
    scoreText: {
        color: '#94a3b8',
        fontSize: 14,
    },
    progressContainer: {
        alignItems: 'flex-end',
    },
    progressLabel: {
        color: 'white',
        fontSize: 12,
        marginBottom: 4,
    },
    progressBar: {
        width: 120,
        height: 8,
        backgroundColor: '#374151',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#22c55e',
    },
    gameArea: {
        padding: 20,
        alignItems: 'center',
    },
    hintTitle: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
    },
    hintValue: {
        color: '#00e5ff',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 30,
    },
    section: {
        width: '100%',
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    sectionLabel: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    selectionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        minHeight: 60,
        alignItems: 'center',
    },
    poolRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    chip: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#00e5ff',
        borderRadius: 8,
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5,
    },
    poolChip: {
        backgroundColor: 'rgba(0, 229, 255, 0.1)',
    },
    chipText: {
        color: '#00e5ff',
        fontSize: 24,
        fontWeight: '900',
    },
    placeholder: {
        color: '#475569',
        fontStyle: 'italic',
        fontSize: 12,
    },
    actions: {
        width: '100%',
        marginTop: 20,
    },
    buildBtn: {
        backgroundColor: '#00e5ff',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    buildBtnText: {
        color: 'black',
        fontWeight: '900',
        fontSize: 16,
    },
    resetBtn: {
        borderWidth: 1,
        borderColor: '#475569',
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resetBtnText: {
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    alert: {
        width: '100%',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    successAlert: {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
    },
    errorAlert: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    alertText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    modalContent: {
        backgroundColor: '#0f172a',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        borderWidth: 2,
        borderColor: '#00e5ff',
    },
    modalTitle: {
        color: 'white',
        fontSize: 22,
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
        paddingHorizontal: 50,
        paddingVertical: 18,
        borderRadius: 30,
    },
    startBtnText: {
        color: 'black',
        fontWeight: '900',
        fontSize: 18,
    },
    resultText: {
        color: '#00e5ff',
        fontSize: 32,
        fontWeight: 'bold',
        marginVertical: 20,
    }
});

export default WordConstruction;
