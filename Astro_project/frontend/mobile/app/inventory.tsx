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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAstroStore } from '../stores/astroStore';

export default function InventoryScreen() {
    const router = useRouter();
    const { equipItem } = useAstroStore();
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(false);

    const categories = [
        { id: 'all', name: 'Todo', icon: 'apps' },
        { id: 'skins', name: 'Skins', icon: 'palette' },
        { id: 'pets', name: 'Compañeros', icon: 'robot' },
        { id: 'trails', name: 'Rastros', icon: 'creation' },
    ];

    const [inventoryItems, setInventoryItems] = useState([
        { id: 102, name: 'Skin Cyberpunk', cat: 'skins', icon: 'robot', color: '#a855f7', equipped: false, desc: 'Aspecto robótico avanzado.' },
        { id: 103, name: 'Mascota Dron', cat: 'pets', icon: 'quadcopter', color: '#4caf50', equipped: true, desc: 'Un compañero fiel de exploración.' },
        { id: 105, name: 'Rastro Neón', cat: 'trails', icon: 'creation', color: '#00e5ff', equipped: false, desc: 'Estela de luz cian persistente.' },
        { id: 106, name: 'Fuego Estelar', cat: 'trails', icon: 'fire', color: '#f59e0b', equipped: false, desc: 'Partículas de combustión estelar.' }
    ]);

    const filteredItems = activeCategory === 'all'
        ? inventoryItems
        : inventoryItems.filter(item => item.cat === activeCategory);

    const toggleEquip = async (item: any) => {
        setLoading(true);
        const result = await equipItem(item.id, item.cat);
        setLoading(false);

        if (result.success) {
            const newItems = inventoryItems.map(i => {
                if (i.cat === item.cat) {
                    return { ...i, equipped: i.id === item.id ? !item.equipped : false };
                }
                return i;
            });
            setInventoryItems(newItems);
            Alert.alert("Éxito", `${item.name} ${item.equipped ? 'desequipado' : 'equipado'}.`);
        } else {
            Alert.alert("Error", result.message || "No se pudo cambiar el equipo.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {loading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#00e5ff" /></View>}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#00e5ff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>MI INVENTARIO</Text>
            </View>

            <View style={styles.categoryBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.categoryChip, activeCategory === cat.id && styles.activeChip]}
                            onPress={() => setActiveCategory(cat.id)}
                        >
                            <MaterialCommunityIcons
                                name={cat.icon as any}
                                size={18}
                                color={activeCategory === cat.id ? 'black' : '#94a3b8'}
                            />
                            <Text style={[styles.categoryText, activeCategory === cat.id && styles.activeText]}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.itemGrid}>
                    {filteredItems.map(item => (
                        <View key={item.id} style={styles.itemCard}>
                            <View style={[styles.iconWrapper, { backgroundColor: item.color + '20' }]}>
                                <MaterialCommunityIcons name={item.icon as any} size={40} color={item.color} />
                            </View>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemDesc}>{item.desc}</Text>

                            <TouchableOpacity
                                style={[styles.equipBtn, item.equipped && styles.equippedBtn]}
                                onPress={() => toggleEquip(item)}
                            >
                                <Text style={[styles.equipBtnText, item.equipped && styles.equippedBtnText]}>
                                    {item.equipped ? 'EQUIPADO' : 'EQUIPAR'}
                                </Text>
                            </TouchableOpacity>
                        </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    backBtn: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 2,
    },
    categoryBar: {
        paddingVertical: 16,
    },
    categoryScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        gap: 8,
    },
    activeChip: {
        backgroundColor: '#00e5ff',
        borderColor: '#00e5ff',
    },
    categoryText: {
        color: '#94a3b8',
        fontWeight: 'bold',
        fontSize: 13,
    },
    activeText: {
        color: 'black',
    },
    scrollContent: {
        padding: 20,
    },
    itemGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    itemCard: {
        width: '47%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    iconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    itemName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 4,
    },
    itemDesc: {
        color: '#94a3b8',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 20,
        height: 32,
    },
    equipBtn: {
        width: '100%',
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#00e5ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    equippedBtn: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderColor: '#4caf50',
    },
    equipBtnText: {
        color: '#00e5ff',
        fontWeight: '900',
        fontSize: 12,
    },
    equippedBtnText: {
        color: '#4caf50',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 999,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
