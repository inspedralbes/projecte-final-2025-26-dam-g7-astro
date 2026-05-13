import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSessionStore } from '../../stores/sessionStore';
import { Colors, Fonts } from '../../constants/theme';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const login = useSessionStore((state) => state.loginTripulante);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor, rellena todos los campos');
      return;
    }

    setIsLoading(true);
    const result = await login({ username, password });
    setIsLoading(false);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Error de acceso', result.message || 'Credenciales incorrectas');
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a3a', '#05050a']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.title}>ASTRO</Text>
          <Text style={styles.subtitle}>SYSTEM OS v2.0</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="USUARIO"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="CONTRASEÑA"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'INICIANDO SESIÓN...' : 'ENTRAR AL SISTEMA'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/auth/register')}
            style={styles.link}
          >
            <Text style={styles.linkText}>¿NUEVO TRIPULANTE? REGÍSTRATE</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontFamily: Fonts.header,
    fontSize: 48,
    color: '#fff',
    letterSpacing: 5,
  },
  subtitle: {
    fontFamily: Fonts.subheader,
    fontSize: 14,
    color: Colors.dark.tint,
    letterSpacing: 4,
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  input: {
    color: '#fff',
    fontFamily: Fonts.subheader,
    fontSize: 18,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: Colors.dark.tint,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    fontFamily: Fonts.subheader,
    color: '#05050a',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  link: {
    marginTop: 25,
    alignItems: 'center',
  },
  linkText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Fonts.subheader,
    fontSize: 14,
    letterSpacing: 1,
  },
});
