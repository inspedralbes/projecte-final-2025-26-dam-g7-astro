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
import { LinearGradient } from 'expo-linear-gradient';
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

            const targetAngle = 360 - (winnerIndex * degreePerItem) - (degreePerItem / 2);
            const currentVal = (rotation as any)._value || 0;
            const currentSpins = Math.floor(currentVal / 360);
            const extraSpins = 5;
            const finalValue = (currentSpins + extraSpins) * 360 + targetAngle;

            Animated.timing(rotation, {
                toValue: finalValue,
                duration: 4000,
                easing: Easing.bezier(0.1, 0, 0.2, 1),
                useNativeDriver: true,
            }).start(() => {
                setIsSpinning(false);
                Alert.alert("¡PREMIO!", `Has obtenido: ${WHEEL_ITEMS[winnerIndex].label.toUpperCase()}`);
            });
        } else {
            setIsSpinning(false);
            Alert.alert("ERROR", result.message || "Error de comunicación con el centro de mando");
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
            <View style={styles.pointerContainer}>
                <MaterialCommunityIcons name="map-marker" size={44} color="#FF5252" style={styles.pointerIcon} />
            </View>

            <View style={styles.wheelShadowBox}>
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
                                                { skewY: `${90 - deg}deg` }
                                            ],
                                        },
                                    ]}
                                />
                            );
                        })}
                        {WHEEL_ITEMS.map((item, index) => {
                            const deg = 360 / WHEEL_ITEMS.length;
                            const rotate = index * deg + (deg / 2);
                            return (
                                <View
                                    key={`icon-${item.id}`}
                                    style={[
                                        styles.iconBox,
                                        { transform: [{ rotate: `${rotate}deg` }, { translateY: -105 }] }
                                    ]}
                                >
                                    <View style={{ transform: [{ rotate: `-${rotate}deg` }] }}>
                                        <MaterialCommunityIcons name={item.icon as any} size={36} color="white" />
                                    </View>
                                </View>
                            );
                        })}
                    </Animated.View>
                    <View style={styles.centerHub}>
                        <View style={styles.centerInner} />
                    </View>
                </View>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.spinBtnWrapper}
                    onPress={spin}
                    disabled={isSpinning}
                >
                    <LinearGradient
                        colors={isSpinning ? ['#94a3b8', '#64748b'] : ['#fbbf24', '#f59e0b']}
                        style={styles.spinBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    >
                        <MaterialCommunityIcons name="ticket" size={24} color="black" style={{ marginRight: 8 }} />
                        <Text style={styles.spinText}>GIRAR (50 COINS)</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 32,
    },
    pointerContainer: {
        zIndex: 20,
        marginBottom: -22,
        alignItems: 'center',
    },
    pointerIcon: {
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    wheelShadowBox: {
        borderRadius: 150,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        backgroundColor: 'black',
    },
    wheelContainer: {
        width: 300,
        height: 300,
        borderRadius: 150,
        borderWidth: 8,
        borderColor: 'white',
        overflow: 'hidden',
        position: 'relative',
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
        width: 60,
        height: 60,
        marginLeft: -30,
        marginTop: -30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerHub: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        marginLeft: -20,
        marginTop: -20,
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    centerInner: {
        width: 25,
        height: 25,
        borderRadius: 12.5,
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    buttonContainer: {
        marginTop: 40,
    },
    spinBtnWrapper: {
        borderRadius: 40,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    spinBtn: {
        flexDirection: 'row',
        paddingHorizontal: 40,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinText: {
        color: 'black',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
    },
});

export default LuckyWheel;
