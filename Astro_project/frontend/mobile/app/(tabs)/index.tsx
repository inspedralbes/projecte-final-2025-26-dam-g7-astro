import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AstroLayout from '@/components/layout/AstroLayout';
import { Colors, Fonts } from '@/constants/theme';
import { useSessionStore } from '@/stores/sessionStore';
import { useProgressStore } from '@/stores/progressStore';
import i18n from '@/i18n';

export default function HomeScreen() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const clearSession = useSessionStore((state) => state.clearSession);
  const { xp, level, streak } = useProgressStore();

  return (
    <AstroLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcome}>{i18n.t('home.welcome')}</Text>
          <Text style={styles.username}>{user?.toUpperCase() || i18n.t('home.guest')}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{i18n.t('home.level')}</Text>
            <Text style={styles.statValue}>{level}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{i18n.t('home.streak')}</Text>
            <Text style={styles.statValue}>{streak} {i18n.t('home.days')}</Text>
          </View>
        </View>

        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/inventory')}>
            <View style={styles.menuIconBox}>
              <MaterialCommunityIcons name="archive" size={24} color={Colors.dark.tint} />
            </View>
            <Text style={styles.menuLabel}>{i18n.t('home.inventory')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/achievements')}>
            <View style={styles.menuIconBox}>
              <MaterialCommunityIcons name="trophy" size={24} color={Colors.dark.tint} />
            </View>
            <Text style={styles.menuLabel}>{i18n.t('home.achievements')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => clearSession()}>
          <MaterialCommunityIcons name="power" size={18} color="#ff5252" />
          <Text style={styles.logoutText}>{i18n.t('home.logout')}</Text>
        </TouchableOpacity>
      </View>
    </AstroLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcome: {
    fontFamily: Fonts.subheader,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    letterSpacing: 4,
  },
  username: {
    fontFamily: Fonts.header,
    color: '#fff',
    fontSize: 32,
    marginTop: 8,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 242, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 40,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    width: 150,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: Fonts.subheader,
    color: Colors.dark.tint,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '800',
  },
  statValue: {
    fontFamily: Fonts.header,
    color: '#fff',
    fontSize: 24,
    marginTop: 5,
  },
  menuGrid: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  menuItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  menuIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 242, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    color: '#fff',
    fontFamily: Fonts.subheader,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  logoutBtn: {
    marginTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 15,
  },
  logoutText: {
    fontFamily: Fonts.subheader,
    color: '#ff5252',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '800',
  },
});
