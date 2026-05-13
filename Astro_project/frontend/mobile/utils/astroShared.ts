import Constants from 'expo-constants';
import { useSessionStore } from '../stores/sessionStore';

// In Expo, we can use extra constants from app.json or environment variables
// Detect host IP for development (avoids 'localhost' errors on physical mobile devices)
const debuggerHost = Constants.expoConfig?.hostUri;
const hostIp = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

// Prefer local server in development, use extra.apiUrl for production/staging
const rawApiBaseUrl = (__DEV__ || !Constants.expoConfig?.extra?.apiUrl)
  ? `http://${hostIp}:3000`
  : Constants.expoConfig.extra.apiUrl;
export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export const IS_PRODUCTION = !(__DEV__);

export const buildApiUrl = (path: string) => {
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }
  return `${API_BASE_URL}/${path}`;
};

export async function requestJson(path: string, options: RequestInit = {}) {
  try {
    // Inject token if available
    const token = useSessionStore.getState().token;
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    const response = await fetch(buildApiUrl(path), options);
    const text = await response.text();

    if (!text) {
      return { response, data: {} };
    }

    try {
      return { response, data: JSON.parse(text) };
    } catch {
      return { response, data: { message: text } };
    }
  } catch (error) {
    console.error(`❌ API Request Error (${path}):`, error);
    throw error;
  }
}

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const STORAGE_KEYS = Object.freeze({
  user: 'astro_user',
  plan: 'astro_plan',
  rank: 'astro_rank',
  token: 'astro_token',
  role: 'astro_role',
  avatar: 'astro_avatar',
  lastActivity: 'astro_last_activity',
});
