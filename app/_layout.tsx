import { Stack } from "expo-router";
import "./global.css";
import { AuthProvider } from "@/lib/auth-context";
import { SplashScreen } from 'expo-router'; // Add this import
import { useEffect ,useState} from 'react';

SplashScreen.preventAutoHideAsync(); // Prevent splash screen from hiding immediately

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Perform any async initialization here
    const prepare = async () => {
      try {
        // You can add any async initialization here
        await new Promise(resolve => setTimeout(resolve, 500)); // Example delay
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  if (!isReady) {
    return null; // Or a loading component
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        {/* Add all your screens here */}
      </Stack>
    </AuthProvider>
  );
}