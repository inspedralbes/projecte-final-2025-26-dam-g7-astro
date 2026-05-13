import { StyleSheet, View, Text } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export default function MultiplayerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>MULTIPLAYER LOBBY</Text>
      <Text style={styles.subtext}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05050a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Fonts.header,
    color: '#fff',
    fontSize: 24,
    letterSpacing: 2,
  },
  subtext: {
    fontFamily: Fonts.subheader,
    color: Colors.dark.tint,
    fontSize: 16,
    marginTop: 10,
  },
});
