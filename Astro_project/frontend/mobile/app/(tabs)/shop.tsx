import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAstroStore } from '../../stores/astroStore';
import LuckyWheel from '../../components/shop/LuckyWheel';

export default function ShopScreen() {
    const { coins, purchaseItem } = useAstroStore();
    const [loading, setLoading] = useState(false);

    const basicItems = [
        { id: 1, name: 'Pack de Vidas', price: 200, icon: 'heart-multiple', color: '#ef4444', desc: 'Recupera 5 vidas inmediatamente.' },
        { id: 2, name: 'Congelar Racha', price: 500, icon: 'snowflake', color: '#00e5ff', desc: 'Protege tu racha un día.' },
        { id: 3, name: 'Escudo Base', price: 350, icon: 'shield-check', color: '#10b981', desc: 'Protección contra drones.' },
        { id: 4, name: 'Radar de Bonus', price: 400, icon: 'radar', color: '#f59e0b', desc: 'Detecta premios cercanos.' },
    ];

    const premiumItems = [
        { id: 101, name: 'Pin Comandante', price: 2500, icon: 'medal', color: '#fbbf24', desc: 'Insignia dorada de rango.' },
        { id: 102, name: 'Skin Cyberpunk', price: 5000, icon: 'robot', color: '#a855f7', desc: 'Aspecto robótico avanzado.' },
        { id: 103, name: 'Mascota Dron', price: 7500, icon: 'drone', color: '#00e5ff', desc: 'Acompañante de reconocimiento.' },
        { id: 104, name: 'Efecto Estelar', price: 10000, icon: 'auto-fix', color: '#ec4899', desc: 'Trail de partículas neón.' },
    ];

    const handlePurchase = async (item: any) => {
        if (coins < item.price) {
            Alert.alert("Fondos insuficientes", "Necesitas más coins para esta misión.");
            return;
        }

        Alert.alert(
            "Confirmar Adquisición",
            `¿Deseas canjear ${item.price} coins por ${item.name}?`,
            [
                { text: "Abortar", style: "cancel" },
                {
                    text: "Confirmar",
                    onPress: async () => {
                        setLoading(true);
                        const result = await purchaseItem(item.id, item.price);
                        setLoading(false);
                        if (result.success) {
                            Alert.alert("Éxito", `${item.name} añadido a tu inventario.`);
                        } else {
                            Alert.alert("Error", result.message || "Error en el sistema de pagos.");
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#00e5ff" />
                </View>
            )}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>BAZAR ESPACIAL</Text>
                    <View style={styles.balanceTag}>
                        <Text style={styles.balanceText}>{coins}</Text>
                        <MaterialCommunityIcons name="currency-usd" size={16} color="#fbbf24" />
                    </View>
                </View>

                {/* Lucky Wheel Section */}
                <Text style={styles.sectionTitle}>SUERTE DIARIA</Text>
                <LuckyWheel />

                <Text style={styles.sectionTitle}>SUMINISTROS BÁSICOS</Text>
                <View style={styles.itemGrid}>
                    {basicItems.map(item => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.itemCard}
                            onPress={() => handlePurchase(item)}
                        >
                            <View style={[styles.itemIconBox, { backgroundColor: item.color + '20' }]}>
                                <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
                            </View>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemDesc}>{item.desc}</Text>
                            <View style={styles.priceTag}>
                                <Text style={styles.priceText}>{item.price}</Text>
                                <MaterialCommunityIcons name="currency-usd" size={14} color="#fbbf24" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>COLECCIÓN DE ÉLITE</Text>
                <View style={styles.itemGrid}>
                    {premiumItems.map(item => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.itemCard, styles.premiumBorder]}
                            onPress={() => handlePurchase(item)}
                        >
                            <View style={[styles.itemIconBox, { backgroundColor: item.color + '20' }]}>
                                <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
                            </View>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemDesc}>{item.desc}</Text>
                            <View style={styles.priceTag}>
                                <Text style={styles.priceText}>{item.price}</Text>
                                <MaterialCommunityIcons name="currency-usd" size={14} color="#fbbf24" />
                            </View>
                        </TouchableOpacity>
                    ))}
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
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#00e5ff',
        letterSpacing: 2,
    },
    balanceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    balanceText: {
        color: '#fbbf24',
        fontWeight: 'bold',
        marginRight: 4,
    },
    sectionTitle: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 20,
    },
    itemGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 40,
    },
    itemCard: {
        width: '47%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    premiumBorder: {
        borderColor: 'rgba(251, 191, 36, 0.3)',
        borderWidth: 1.5,
    },
    itemIconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 4,
    },
    itemDesc: {
        color: '#64748b',
        fontSize: 10,
        textAlign: 'center',
        marginBottom: 12,
        height: 30,
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priceText: {
        color: '#fbbf24',
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 2,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 999,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
