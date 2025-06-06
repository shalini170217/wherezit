import { Stack } from "expo-router";
import "./global.css";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

function AuthRedirector({ children }: { children: React.ReactNode }) {
  const { user, isLoadingUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoadingUser) return;

    const inAuthGroup = segments[0] === "auth";
    const inProtectedGroup = segments[0] === "(protected)"; // Example protected group

    if (!user && inProtectedGroup) {
      // Redirect to index if trying to access protected routes
      router.replace("/");
    } else if (user && inAuthGroup) {
      // Redirect away from auth if logged in
      router.replace("/");
    }
  }, [user, isLoadingUser, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthRedirector>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          {/* Add other screens here */}
        </Stack>
      </AuthRedirector>
    </AuthProvider>
  );
}