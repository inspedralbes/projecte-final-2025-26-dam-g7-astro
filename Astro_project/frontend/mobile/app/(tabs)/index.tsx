import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAstroStore } from '../../stores/astroStore';

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAstroStore();
    const isLoggedIn = !!user;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <LinearGradient
                        colors={['#1a1a2e', '#0f0f1a']}
                        style={styles.heroGradient}
                    />

                    <View style={styles.contentWrapper}>
                        <Text style={styles.titleSmall}>BIENVENIDO AL</Text>
                        <Text style={styles.titleLarge}>PROYECTO ASTRO</Text>

                        <View style={styles.gradientLine} />

                        <Text style={styles.subtitle}>
                            Plataforma de entrenamiento visual y neurocognitivo de alto rendimiento.
                        </Text>

                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={() => router.push(isLoggedIn ? '/singleplayer' : '/register')}
                        >
                            <LinearGradient
                                colors={['#00f2ff', '#7000ff']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>
                                    {isLoggedIn ? 'CONTINUAR MISIÓN' : 'INICIAR MISIÓN'}
                                </Text>
                                <MaterialCommunityIcons
                                    name={isLoggedIn ? 'rocket' : 'rocket-launch-outline'}
                                    size={20}
                                    color="white"
                                    style={styles.buttonIcon}
                                />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Info Cards */}
                <View style={styles.infoSection}>
                    <View style={styles.infoCard}>
                        <MaterialCommunityIcons name="eye-outline" size={32} color="#00e5ff" />
                        <Text style={styles.cardTitle}>Agilidad Lectora</Text>
                        <Text style={styles.cardText}>Entrena tu decodificación cerebral para procesar información a velocidades estelares.</Text>
                    </View>

                    <View style={styles.infoCard}>
                        <MaterialCommunityIcons name="brain" size={32} color="#7000ff" />
                        <Text style={styles.cardTitle}>Neurocognición</Text>
                        <Text style={styles.cardText}>Mejora la retención y el enfoque mediante ejercicios diseñados por expertos en neurociencia.</Text>
                    </View>
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
    scrollContent: {
        flexGrow: 1,
    },
    heroSection: {
        height: 500,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        paddingHorizontal: 20,
    },
    heroGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    contentWrapper: {
        alignItems: 'center',
    },
    titleSmall: {
        color: '#bdbdbd',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 8,
    },
    titleLarge: {
        fontSize: 42,
        fontWeight: '900',
        color: 'white',
        textAlign: 'center',
        letterSpacing: 2,
    },
    gradientLine: {
        height: 4,
        width: 80,
        backgroundColor: '#00e5ff',
        marginVertical: 20,
        borderRadius: 2,
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 28,
        marginBottom: 40,
    },
    startButton: {
        width: '100%',
        height: 56,
        borderRadius: 4,
        overflow: 'hidden',
    },
    buttonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    buttonIcon: {
        marginLeft: 10,
    },
    infoSection: {
        padding: 24,
        gap: 20,
    },
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    cardText: {
        color: '#94a3b8',
        lineHeight: 22,
    },
});
