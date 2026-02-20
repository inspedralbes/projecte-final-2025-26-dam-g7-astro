import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useAstroStore } from '../stores/astroStore';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Step = 'initial' | 'individual-options' | 'group-options' | 'create-group' | 'join-group';

export default function PlansScreen() {
    const router = useRouter();
    const { plan, updatePlan, user } = useAstroStore();
    const [step, setStep] = useState<Step>('initial');
    const [loading, setLoading] = useState(false);

    // Group Forms State
    const [groupName, setGroupName] = useState('');
    const [groupSecret, setGroupSecret] = useState('');
    const [joinUser, setJoinUser] = useState('');
    const [joinPass, setJoinPass] = useState('');

    const handleSelectPlan = async (planId: string) => {
        setLoading(true);
        const result = await updatePlan(planId);
        setLoading(false);
        if (result.success) {
            Alert.alert("Éxito", `Plan actualizado a ${planId}`);
            router.back();
        } else {
            Alert.alert("Error", result.message || "No se pudo actualizar el plan");
        }
    };

    const handleCreateGroup = () => {
        if (!groupName || !groupSecret) {
            Alert.alert("Error", "Completa todos los campos");
            return;
        }
        // Logic for group creation would go here (similar to web)
        Alert.alert("Grupo Creado", `Grupo ${groupName} listo para la misión.`);
        handleSelectPlan('GROUP_PLAN');
    };

    const handleJoinGroup = () => {
        if (!joinUser || !joinPass) {
            Alert.alert("Error", "Credenciales de grupo requeridas");
            return;
        }
        // Logic for group joining would go here
        Alert.alert("Conectado", "Te has unido al escuadrón.");
        handleSelectPlan('GROUP_PLAN');
    };

    const renderHeader = (title: string, subtitle: string) => (
        <View style={styles.sectionHeader}>
            <TouchableOpacity onPress={() => step === 'initial' ? router.back() : setStep('initial')} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
    );

    const renderInitial = () => (
        <View style={styles.optionsContainer}>
            {renderHeader("SELECCIÓN DE PLAN", "¿Cómo deseas realizar tu entrenamiento?")}
            <TouchableOpacity style={styles.modeCard} onPress={() => setStep('individual-options')}>
                <LinearGradient colors={['rgba(0, 229, 255, 0.2)', 'transparent']} style={styles.cardGradient} />
                <MaterialCommunityIcons name="account" size={48} color="#00e5ff" />
                <Text style={styles.modeTitle}>Individual</Text>
                <Text style={styles.modeDesc}>Entrenamiento personalizado de alta intensidad.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modeCard} onPress={() => setStep('group-options')}>
                <LinearGradient colors={['rgba(112, 0, 255, 0.2)', 'transparent']} style={styles.cardGradient} />
                <MaterialCommunityIcons name="account-group" size={48} color="#7000ff" />
                <Text style={styles.modeTitle}>Multijugador</Text>
                <Text style={styles.modeDesc}>Entrena con tu equipo y compite por el ranking.</Text>
            </TouchableOpacity>
        </View>
    );

    const renderIndividualOptions = () => (
        <View style={styles.optionsContainer}>
            {renderHeader("PLAN INDIVIDUAL", "Elige tu nivel de acceso")}
            <TouchableOpacity style={styles.planCard} onPress={() => handleSelectPlan('INDIVIDUAL_FREE')}>
                <View style={styles.planInfo}>
                    <Text style={styles.planName}>INDIVIDUAL FREE</Text>
                    <Text style={styles.planPrice}>0€/mes</Text>
                </View>
                {plan === 'INDIVIDUAL_FREE' && <MaterialCommunityIcons name="check-circle" size={24} color="#00e5ff" />}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.planCard, styles.premiumCard]} onPress={() => handleSelectPlan('INDIVIDUAL_PRO')}>
                <LinearGradient colors={['rgba(0, 242, 255, 0.4)', 'rgba(112, 0, 255, 0.4)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premiumOverlay} />
                <View style={styles.planInfo}>
                    <Text style={[styles.planName, { color: 'white' }]}>INDIVIDUAL PRO</Text>
                    <Text style={styles.planPrice}>9.99€/mes</Text>
                </View>
                {plan === 'INDIVIDUAL_PRO' && <MaterialCommunityIcons name="check-circle" size={24} color="white" />}
            </TouchableOpacity>
        </View>
    );

    const renderGroupOptions = () => (
        <View style={styles.optionsContainer}>
            {renderHeader("PLAN GRUPAL", "¿Tienes ya un escuadrón?")}
            <TouchableOpacity style={styles.modeCard} onPress={() => setStep('create-group')}>
                <MaterialCommunityIcons name="plus-circle-outline" size={40} color="#00e5ff" />
                <Text style={styles.modeTitle}>Crear Nuevo Grupo</Text>
                <Text style={styles.modeDesc}>Lidera tu propia facción de entrenamiento.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modeCard} onPress={() => setStep('join-group')}>
                <MaterialCommunityIcons name="login-variant" size={40} color="#7000ff" />
                <Text style={styles.modeTitle}>Unirse a Grupo</Text>
                <Text style={styles.modeDesc}>Conéctate con un equipo ya existente.</Text>
            </TouchableOpacity>
        </View>
    );

    const renderCreateGroup = () => (
        <View style={styles.optionsContainer}>
            {renderHeader("CREAR GRUPO", "Configura tu equipo de élite")}
            <View style={styles.formOff}>
                <TextInput
                    style={styles.input}
                    placeholder="Nombre del Grupo"
                    placeholderTextColor="#64748b"
                    value={groupName}
                    onChangeText={setGroupName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Contraseña del Grupo"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                    value={groupSecret}
                    onChangeText={setGroupSecret}
                />
                <TouchableOpacity style={styles.submitBtn} onPress={handleCreateGroup}>
                    <Text style={styles.submitBtnText}>INICIAR ESCUADRÓN</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderJoinGroup = () => (
        <View style={styles.optionsContainer}>
            {renderHeader("UNIRSE AL GRUPO", "Ingresa las credenciales del equipo")}
            <View style={styles.formOff}>
                <TextInput
                    style={styles.input}
                    placeholder="ID del Grupo / Usuario"
                    placeholderTextColor="#64748b"
                    value={joinUser}
                    onChangeText={setJoinUser}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                    value={joinPass}
                    onChangeText={setJoinPass}
                />
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#7000ff' }]} onPress={handleJoinGroup}>
                    <Text style={styles.submitBtnText}>CONECTAR CON EL EQUIPO</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#00e5ff" /></View>}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {step === 'initial' && renderInitial()}
                {step === 'individual-options' && renderIndividualOptions()}
                {step === 'group-options' && renderGroupOptions()}
                {step === 'create-group' && renderCreateGroup()}
                {step === 'join-group' && renderJoinGroup()}
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
        padding: 24,
        flexGrow: 1,
    },
    sectionHeader: {
        marginBottom: 40,
        marginTop: 10,
    },
    backBtn: {
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 2,
    },
    headerSubtitle: {
        color: '#94a3b8',
        fontSize: 16,
        marginTop: 8,
    },
    optionsContainer: {
        flex: 1,
    },
    modeCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 32,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    cardGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    modeTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 16,
    },
    modeDesc: {
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    planCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    premiumCard: {
        borderColor: 'rgba(0, 229, 255, 0.3)',
        overflow: 'hidden',
    },
    premiumOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    planInfo: {
        flex: 1,
    },
    planName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#00e5ff',
        letterSpacing: 1,
    },
    planPrice: {
        color: '#94a3b8',
        marginTop: 4,
    },
    formOff: {
        gap: 16,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 20,
        color: 'white',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    submitBtn: {
        height: 56,
        backgroundColor: '#00e5ff',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    submitBtnText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 999,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
