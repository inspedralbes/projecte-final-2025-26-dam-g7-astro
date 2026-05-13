import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { requestJson } from '../../utils/astroShared';
import { Colors, Fonts } from '../../constants/theme';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor, rellena todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const { response, data } = await requestJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: username,
          email,
          pass: password,
        }),
      });

      if (response.ok) {
        Alert.alert('¡Éxito!', 'Registro completado. Ahora puedes iniciar sesión.', [
          { text: 'OK', onPress: () => router.replace('/auth/login') }
        ]);
      } else {
        Alert.alert('Error de registro', data.message || 'No se pudo completar el registro');
      }
    } catch (error) {
      Alert.alert('Error', 'Problema de conexión con el servidor');
    } finally {
      setIsLoading(false);
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Text style={styles.title}>ASTRO</Text>
            <Text style={styles.subtitle}>NUEVO TRIPULANTE</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="NOMBRE DE USUARIO"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="EMAIL"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
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

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="CONFIRMAR CONTRASEÑA"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'PROCESANDO...' : 'REGISTRARSE'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.link}
            >
              <Text style={styles.linkText}>¿YA TIENES CUENTA? INICIA SESIÓN</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: Fonts.header,
    fontSize: 40,
    color: '#fff',
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: Fonts.subheader,
    fontSize: 14,
    color: Colors.dark.tint,
    letterSpacing: 3,
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
    marginBottom: 15,
    height: 55,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  input: {
    color: '#fff',
    fontFamily: Fonts.subheader,
    fontSize: 16,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: Colors.dark.secondary || '#7000ff',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontFamily: Fonts.subheader,
    color: '#fff',
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
