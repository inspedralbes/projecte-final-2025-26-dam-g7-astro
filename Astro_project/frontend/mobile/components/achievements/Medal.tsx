import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MedalProps {
    type: 'gold' | 'silver' | 'bronze';
    icon: string;
    locked?: boolean;
    scale?: number;
    iconSize?: number;
}

const Medal: React.FC<MedalProps> = ({
    type = 'bronze',
    icon = 'star',
    locked = false,
    scale = 1,
    iconSize = 48
}) => {
    const gradients = {
        gold: ['#ffd700', '#b8860b'],
        silver: ['#e0e0e0', '#757575'],
        bronze: ['#cd7f32', '#8b4513'],
    };

    const ribbonGradients = {
        gold: ['#d32f2f', '#b71c1c'],
        silver: ['#1976d2', '#0d47a1'],
        bronze: ['#388e3c', '#1b5e20'],
    };

    const ribbonBorder = {
        gold: '#ffeb3b',
        silver: '#90caf9',
        bronze: '#a5d6a7',
    };

    return (
        <View style={[
            styles.container,
            { transform: [{ scale }] },
            locked && styles.locked
        ]}>
            {/* Ribbon */}
            <View style={styles.ribbonWrapper}>
                <LinearGradient
                    colors={ribbonGradients[type] as any}
                    style={[styles.ribbon, { borderTopColor: ribbonBorder[type] }]}
                />
            </View>

            {/* Medal Body */}
            <LinearGradient
                colors={gradients[type] as any}
                style={styles.medalBody}
            >
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.4)', 'transparent', 'rgba(255, 255, 255, 0.1)'] as any}
                    style={styles.shine}
                />
                <View style={styles.content}>
                    <MaterialCommunityIcons
                        name={locked ? 'lock' : (icon as any)}
                        size={iconSize}
                        color={locked ? '#e0e0e0' : 'white'}
                    />
                </View>
                <View style={styles.border} />
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 140,
        height: 180,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 40,
    },
    locked: {
        opacity: 0.6,
    },
    ribbonWrapper: {
        position: 'absolute',
        top: 0,
        width: 60,
        height: 100,
        zIndex: 1,
        overflow: 'hidden',
    },
    ribbon: {
        width: '100%',
        height: '100%',
        borderTopWidth: 5,
    },
    medalBody: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
    },
    shine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 70,
        zIndex: 4,
    },
    content: {
        zIndex: 3,
    },
    border: {
        position: 'absolute',
        top: -5,
        left: -5,
        right: -5,
        bottom: -5,
        borderRadius: 75,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
});

export default Medal;
