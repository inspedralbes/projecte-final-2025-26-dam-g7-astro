import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Modal,
    SafeAreaView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ROSCO_DATA = [
    { char: 'A', question: "Cos rocallós més petit que un planeta que orbita al voltant del Sol.", answer: "ASTEROIDE" },
    { char: 'C', question: "Astre de gel i pols que quan s'apropa al Sol forma una cua lluminosa.", answer: "COMETA" },
    { char: 'E', question: "Esfera de gas gegant que emet la seva pròpia llum i calor.", answer: "ESTRELLA" },
    { char: 'G', question: "Sistema enorme d'estrelles, gas i pols units per la gravetat.", answer: "GALAXIA" },
    { char: 'L', question: "L'únic satèl·lit natural de la Terra.", answer: "LLUNA" },
    { char: 'M', question: "Fragment de roca espacial que arriba a terra sense cremar-se del tot.", answer: "METEORIT" },
    { char: 'N', question: "Núvol gegant de gas i pols on sovint neixen noves estrelles.", answer: "NEBULOSA" },
    { char: 'O', question: "Trajectòria corba que descriu un objecte al voltant d'un altre a l'espai.", answer: "ORBITA" },
    { char: 'P', question: "Cos celest que orbita una estrella i té prou massa per ser esfèric.", answer: "PLANETA" },
    { char: 'S', question: "L'estrella central del nostre sistema planetari.", answer: "SOL" },
    { char: 'T', question: "Instrument que permet observar objectes llunyans a l'espai.", answer: "TELESCOPI" },
    { char: 'U', question: "Tot el que existeix: matèria, energia, espai i temps.", answer: "UNIVERS" }
];

interface SpelledRoscoProps {
    onGameOver: (score: number) => void;
}

const SpelledRosco: React.FC<SpelledRoscoProps> = ({ onGameOver }) => {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(180);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [letters, setLetters] = useState<any[]>([]);
    const [userInput, setUserInput] = useState('');

    useEffect(() => {
        setLetters(ROSCO_DATA.map(l => ({ ...l, status: 'pending' })));
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && gameState === 'playing') {
            setGameState('gameover');
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const startGame = () => {
        setTimeLeft(180);
        setScore(0);
        setCurrentIndex(0);
        setLetters(ROSCO_DATA.map(l => ({ ...l, status: 'pending' })));
        setGameState('playing');
    };

    const checkAnswer = () => {
        const correct = letters[currentIndex].answer.toUpperCase();
        const guess = userInput.toUpperCase().trim();

        const newLetters = [...letters];
        if (guess === correct) {
            newLetters[currentIndex].status = 'correct';
            setScore(prev => prev + 100);
        } else {
            newLetters[currentIndex].status = 'incorrect';
        }
        setLetters(newLetters);
        setUserInput('');
        advanceTurn(newLetters);
    };

    const pasapalabra = () => {
        setUserInput('');
        advanceTurn(letters);
    };

    const advanceTurn = (currentLetters: any[]) => {
        let nextIdx = -1;
        // Search next pending
        for (let i = currentIndex + 1; i < currentLetters.length; i++) {
            if (currentLetters[i].status === 'pending') { nextIdx = i; break; }
        }
        if (nextIdx === -1) {
            for (let i = 0; i < currentIndex; i++) {
                if (currentLetters[i].status === 'pending') { nextIdx = i; break; }
            }
        }

        if (nextIdx !== -1) {
            setCurrentIndex(nextIdx);
        } else {
            setGameState('gameover');
        }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const renderRosco = () => {
        const total = letters.length;
        const radius = 130;
        const center = 150;

        return (
            <View style={styles.roscoContainer}>
                <View style={styles.roscoCircle}>
                    {letters.map((l, i) => {
                        const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
                        const x = radius * Math.cos(angle);
                        const y = radius * Math.sin(angle);

                        return (
                            <View
                                key={l.char}
                                style={[
                                    styles.bubble,
                                    l.status === 'correct' && styles.bubbleCorrect,
                                    l.status === 'incorrect' && styles.bubbleIncorrect,
                                    i === currentIndex && styles.bubbleCurrent,
                                    { left: center + x - 18, top: center + y - 18 }
                                ]}
                            >
                                <Text style={[styles.bubbleText, i === currentIndex && { color: 'black' }]}>{l.char}</Text>
                            </View>
                        );
                    })}
                    <View style={styles.roscoCenter}>
                        <Text style={styles.centerChar}>{letters[currentIndex]?.char}</Text>
                        <Text style={styles.centerLabel}>ESTÀS AQUÍ</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.score}>PUNTS: {score}</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {renderRosco()}

                    <View style={styles.questionCard}>
                        <Text style={styles.questionLabel}>DEFINICIÓ:</Text>
                        <Text style={styles.questionText}>{letters[currentIndex]?.question}</Text>

                        <TextInput
                            style={styles.input}
                            value={userInput}
                            onChangeText={setUserInput}
                            placeholder="ESCRIU LA PARAULA..."
                            placeholderTextColor="#475569"
                            autoCapitalize="characters"
                            onSubmitEditing={checkAnswer}
                            autoFocus
                        />

                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.confirmBtn} onPress={checkAnswer} disabled={!userInput}>
                                <Text style={styles.confirmBtnText}>ENVIAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.pasaBtn} onPress={pasapalabra}>
                                <Text style={styles.pasaBtnText}>PASAPALABRA</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                <Modal visible={gameState === 'start'} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <MaterialCommunityIcons name="circle-slice-8" size={80} color="#00e5ff" />
                            <Text style={styles.modalTitle}>PASAPALABRA ESTEL·LAR</Text>
                            <Text style={styles.modalDesc}>Completa el rosco de paraules espacials abans que s'esgoti el temps.</Text>
                            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                                <Text style={styles.startBtnText}>INICIAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal visible={gameState === 'gameover'} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <MaterialCommunityIcons name="finance" size={80} color="#fbbf24" />
                            <Text style={styles.modalTitle}>ROSCO FINALITZAT</Text>
                            <Text style={styles.resultText}>Punts Final: {score}</Text>
                            <TouchableOpacity style={styles.startBtn} onPress={() => onGameOver(score)}>
                                <Text style={styles.startBtnText}>FINALITZAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0b0f19' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
    timer: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    score: { color: '#fbbf24', fontSize: 18, fontWeight: 'bold' },
    scrollContent: { alignItems: 'center', paddingBottom: 40 },
    roscoContainer: { width: 300, height: 300, marginVertical: 20 },
    roscoCircle: { width: 300, height: 300, position: 'relative' },
    bubble: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: '#1e40af', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    bubbleCorrect: { backgroundColor: '#15803d' },
    bubbleIncorrect: { backgroundColor: '#b91c1c' },
    bubbleCurrent: { backgroundColor: '#00e5ff', transform: [{ scale: 1.2 }], zIndex: 10 },
    bubbleText: { color: 'white', fontWeight: 'bold' },
    roscoCenter: { position: 'absolute', top: 100, left: 100, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0, 229, 255, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#00e5ff' },
    centerChar: { color: 'white', fontSize: 32, fontWeight: '900' },
    centerLabel: { color: '#00e5ff', fontSize: 8, fontWeight: 'bold' },
    questionCard: { width: SCREEN_WIDTH - 40, backgroundColor: '#1e293b', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#334155' },
    questionLabel: { color: '#00e5ff', fontSize: 10, fontWeight: 'bold', marginBottom: 8 },
    questionText: { color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 24, lineHeight: 26 },
    input: { backgroundColor: '#0f172a', borderRadius: 12, padding: 16, color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', borderWidth: 1, borderColor: '#334155' },
    btnRow: { flexDirection: 'row', gap: 12 },
    confirmBtn: { flex: 2, backgroundColor: '#00e5ff', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    confirmBtnText: { color: 'black', fontWeight: 'bold' },
    pasaBtn: { flex: 1, borderWidth: 1, borderColor: '#f97316', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    pasaBtnText: { color: '#f97316', fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    modalContent: { backgroundColor: '#1e293b', borderRadius: 32, padding: 32, alignItems: 'center', width: '100%', borderWidth: 2, borderColor: '#00e5ff' },
    modalTitle: { color: 'white', fontSize: 24, fontWeight: '900', marginTop: 16, textAlign: 'center' },
    modalDesc: { color: '#94a3b8', fontSize: 16, textAlign: 'center', marginTop: 12, marginBottom: 32 },
    startBtn: { backgroundColor: '#00e5ff', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30 },
    startBtnText: { color: 'black', fontWeight: 'bold' },
    resultText: { color: '#00e5ff', fontSize: 32, fontWeight: 'bold', marginVertical: 20 }
});

export default SpelledRosco;
