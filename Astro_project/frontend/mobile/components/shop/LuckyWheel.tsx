import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions,
    Alert,
    Easing
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAstroStore } from '../../stores/astroStore';

const { width } = Dimensions.get('window');

const WHEEL_ITEMS = [
    { id: 0, icon: 'heart', color: '#FF5252', label: 'Vida' },
    { id: 1, icon: 'decagram', color: '#9C27B0', label: 'Bonus' },
    { id: 2, icon: 'ninja', color: '#2196F3', label: 'Skin' },
    { id: 3, icon: 'currency-usd', color: '#FFC107', label: 'Coins' },
    { id: 4, icon: 'emoticon-sad', color: '#795548', label: 'Nada' }
];

const LuckyWheel = () => {
    const { spinWheel, user } = useAstroStore();
    const [isSpinning, setIsSpinning] = useState(false);
    const rotation = useRef(new Animated.Value(0)).current;

    const spin = async () => {
        if (isSpinning || !user) return;
        setIsSpinning(true);

        const result = await spinWheel();

        if (result.success && result.prize) {
            const winnerIndex = WHEEL_ITEMS.findIndex(i => i.id === result.prize.id);
            const degreePerItem = 360 / WHEEL_ITEMS.length;

            // Calculate target angle to land on the winner (aligned at top/pointer)
            const targetAngle = 360 - (winnerIndex * degreePerItem) - (degreePerItem / 2);
            const extraSpins = 5;
            const finalValue = extraSpins * 360 + targetAngle;

            Animated.timing(rotation, {
                toValue: finalValue,
                duration: 4000,
                easing: Easing.bezier(0.1, 0, 0.2, 1),
                useNativeDriver: true,
            }).start(() => {
                setIsSpinning(false);
                // Reset to small value to keep current position visually but allow next spin
                rotation.setValue(targetAngle);
                Alert.alert("¡Premio!", `Has ganado: ${WHEEL_ITEMS[winnerIndex].label}`);
            });
        } else {
            setIsSpinning(false);
            Alert.alert("Error", result.message || "No se pudo girar la rueda");
        }
    };

    const spinStyle = {
        transform: [
            {
                rotate: rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                }),
            },
        ],
    };

    return (
        <View style={styles.container}>
            <View style={styles.pointer}>
                <MaterialCommunityIcons name="triangle" size={30} color="#FF5252" style={{ transform: [{ rotate: '180deg' }] }} />
            </View>

            <View style={styles.wheelContainer}>
                <Animated.View style={[styles.wheel, spinStyle]}>
                    {WHEEL_ITEMS.map((item, index) => {
                        const deg = 360 / WHEEL_ITEMS.length;
                        const rotate = index * deg;
                        return (
                            <View
                                key={item.id}
                                style={[
                                    styles.segment,
                                    {
                                        backgroundColor: item.color,
                                        transform: [
                                            { rotate: `${rotate}deg` },
                                            { skewY: `${90 - deg}deg` } // Approximation for segments
                                        ],
                                    },
                                ]}
                            />
                        );
                    })}
                    {/* Icons overlay */}
                    {WHEEL_ITEMS.map((item, index) => {
                        const deg = 360 / WHEEL_ITEMS.length;
                        const rotate = index * deg + (deg / 2);
                        return (
                            <View
                                key={`icon-${item.id}`}
                                style={[
                                    styles.iconBox,
                                    { transform: [{ rotate: `${rotate}deg` }, { translateY: -100 }] }
                                ]}
                            >
                                <MaterialCommunityIcons name={item.icon as any} size={32} color="white" />
                            </View>
                        );
                    })}
                </Animated.View>
                <View style={styles.centerHub} />
            </View>

            <TouchableOpacity
                style={[styles.spinBtn, isSpinning && styles.disabledBtn]}
                onPress={spin}
                disabled={isSpinning}
            >
                <Text style={styles.spinText}>GIRAR (50 COINS)</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 20,
    },
    pointer: {
        zIndex: 10,
        marginBottom: -10,
    },
    wheelContainer: {
        width: 280,
        height: 280,
        borderRadius: 140,
        borderWidth: 8,
        borderColor: 'white',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#1e293b',
    },
    wheel: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    segment: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 1000,
        height: 1000,
        marginTop: -500,
        marginLeft: 0,
        transformOrigin: '0% 0%',
    },
    iconBox: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 40,
        height: 40,
        marginLeft: -20,
        marginTop: -20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerHub: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'white',
        marginLeft: -10,
        marginTop: -10,
        zIndex: 5,
    },
    spinBtn: {
        marginTop: 32,
        backgroundColor: '#fbbf24',
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 30,
        elevation: 6,
    },
    disabledBtn: {
        backgroundColor: '#d1d5db',
    },
    spinText: {
        color: 'black',
        fontWeight: '900',
        fontSize: 16,
    }
});

export default LuckyWheel;
