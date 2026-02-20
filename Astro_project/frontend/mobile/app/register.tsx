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

export default function RegisterScreen() {
    const router = useRouter();
    const { registerTripulante } = useAstroStore();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async () => {
        if (!username || !password || !confirmPassword) {
            setError('Todos los campos son obligatorios');
            return;
        }

        if (password !== confirmPassword) {
            setError('Los códigos no coinciden');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await registerTripulante({ username, password });
            if (result.success) {
                router.replace('/login');
            } else {
                setError(result.message || 'Error al procesar el alta');
            }
        } catch (e) {
            setError('Error crítico: No se ha podido contactar con la base');
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
                        <Text style={styles.backButtonText}>ABORTAR / VOLVER A BASE</Text>
                    </TouchableOpacity>

                    <View style={styles.content}>
                        <View style={styles.header}>
                            <MaterialCommunityIcons name="shield-account-outline" size={64} color="#00e5ff" />
                            <Text style={styles.logoTitle}>ALISTAMIENTO</Text>
                            <View style={styles.headerBadge}>
                                <Text style={styles.badgeText}>NUEVO TRIPULANTE ASTRO</Text>
                            </View>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>IDENTIFICACIÓN</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialCommunityIcons name="account-box-outline" size={20} color="#00e5ff" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="NOMBRE DE USUARIO (TU ID)"
                                        placeholderTextColor="#475569"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </View>
                                <Text style={styles.helperText}>*Este será tu nombre visible en la misión</Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>CREDENCIALES</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialCommunityIcons name="lock-outline" size={20} color="#00e5ff" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="CONTRASEÑA"
                                        placeholderTextColor="#475569"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>VERIFICACIÓN</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialCommunityIcons name="lock-check-outline" size={20} color="#00e5ff" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="CONFIRMAR CONTRASEÑA"
                                        placeholderTextColor="#475569"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
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
                                style={styles.registerButton}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#00f2ff', '#00b4ff']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.registerGradient}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons name="rocket-launch" size={20} color="black" style={{ marginRight: 10 }} />
                                            <Text style={styles.registerButtonText}>INICIAR PROTOCOLO DE ALTA</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity onPress={() => router.push('/login')}>
                                <Text style={styles.footerLink}>¿YA TIENES ID? ACCEDER</Text>
                            </TouchableOpacity>
                            <Text style={styles.coordText}>COORDENADAS: <Text style={styles.coordValue}>SECTOR-7G</Text></Text>
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
        marginBottom: 30,
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
        marginBottom: 30,
    },
    logoTitle: {
        fontSize: 36,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 4,
        marginTop: 10,
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
        gap: 16,
    },
    inputGroup: {
        gap: 6,
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
    helperText: {
        color: '#64748b',
        fontSize: 10,
        fontStyle: 'italic',
        marginLeft: 4,
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
        marginTop: 8,
    },
    errorText: {
        color: '#f87171',
        fontWeight: 'bold',
        marginLeft: 10,
    },
    registerButton: {
        height: 64,
        marginTop: 20,
        overflow: 'hidden',
    },
    registerGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerButtonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 30,
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
    coordText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
    },
    coordValue: {
        color: '#00e5ff',
    },
});
