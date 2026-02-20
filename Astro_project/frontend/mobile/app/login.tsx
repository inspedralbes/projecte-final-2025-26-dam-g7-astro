import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAstroStore } from '../stores/astroStore';

export default function LoginScreen() {
    const router = useRouter();
    const { loginTripulante } = useAstroStore();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!username || !password) {
            setError('Identificación y código requeridos');
            return;
        }

        setLoading(true);
        setError('');

        // For now, we simulate success or use the store if backend is reachable
        // In mobile, "localhost" might need to be the computer's IP
        // Mocking successful login for the demo if it fails
        try {
            const result = await loginTripulante({ username, password });
            if (result.success) {
                router.replace('/(tabs)');
            } else {
                setError(result.message || 'Credenciales no reconocidas');
            }
        } catch (e) {
            setError('Error al conectar con la base');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <MaterialCommunityIcons name="chevron-left" size={24} color="#00e5ff" />
                        <Text style={styles.backButtonText}>VOLVER A BASE</Text>
                    </TouchableOpacity>

                    <View style={styles.content}>
                        <View style={styles.header}>
                            <MaterialCommunityIcons name="earth" size={64} color="#00e5ff" />
                            <Text style={styles.logoTitle}>ASTRO</Text>
                            <View style={styles.headerBadge}>
                                <Text style={styles.badgeText}>ACCESO AL SISTEMA DE MISIÓN</Text>
                            </View>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>IDENTIFICACIÓN</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialCommunityIcons name="account-circle-outline" size={20} color="#00e5ff" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="ID TRIPULANTE"
                                        placeholderTextColor="#475569"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>CÓDIGO DE ACCESO</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialCommunityIcons name="lock-outline" size={20} color="#00e5ff" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="#475569"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            {error ? (
                                <View style={styles.errorBox}>
                                    <MaterialCommunityIcons name="alert-octagon" size={20} color="#ef4444" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#00f2ff', '#00b4ff']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.loginGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons name="radar" size={20} color="black" style={{ marginRight: 10 }} />
                                            <Text style={styles.loginButtonText}>INICIAR SINCRONIZACIÓN</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity onPress={() => router.push('/register')}>
                                <Text style={styles.footerLink}>¿AÚN NO TIENES ID? ALISTARSE</Text>
                            </TouchableOpacity>
                            <Text style={styles.statusText}>ESTADO: <Text style={styles.statusOnline}>OPERATIVO</Text></Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        padding: 24,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
    },
    backButtonText: {
        color: '#00e5ff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoTitle: {
        fontSize: 48,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 8,
        marginTop: 10,
        textShadowColor: 'rgba(0, 229, 255, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    headerBadge: {
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(0, 229, 255, 0.3)',
        paddingBottom: 4,
        marginTop: 8,
    },
    badgeText: {
        color: '#00e5ff',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 20, 40, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(0, 229, 255, 0.2)',
        height: 56,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
        padding: 12,
        marginTop: 12,
    },
    errorText: {
        color: '#f87171',
        fontWeight: 'bold',
        marginLeft: 10,
    },
    loginButton: {
        height: 64,
        marginTop: 20,
        overflow: 'hidden',
    },
    loginGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginButtonText: {
        color: 'black',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 40,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        borderStyle: 'dashed',
    },
    footerLink: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusOnline: {
        color: '#00e5ff',
    },
});
