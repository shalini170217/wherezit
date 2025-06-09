import React, { createContext, useContext, useEffect, useState } from "react";
import { ID, Models } from "react-native-appwrite";
import { account } from "./appwrite";
import { router } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  isLoadingUser: boolean;
  isAppReady: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<Models.User<Models.Preferences> | null>; // Updated return type
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [isAppReady, setIsAppReady] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        // Load user session
        const session = await account.get();
        if (isMounted) {
          setUser(session);
          console.log("✅ User session loaded");
        }
      } catch (error: any) {
        if (isMounted) {
          console.log("⚠️ No active session:", error.message);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
          setIsAppReady(true);
          await SplashScreen.hideAsync();
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshUser = async (): Promise<Models.User<Models.Preferences> | null> => {
    setIsLoadingUser(true);
    try {
      const session = await account.get();
      setUser(session);
      return session;
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setIsLoadingUser(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoadingUser(true);
    try {
      await account.create(ID.unique(), email, password);
      const error = await signIn(email, password);
      if (error) throw new Error(error);
      return null;
    } catch (error) {
      console.error("Sign up error:", error);
      return error instanceof Error ? error.message : "An unknown error occurred during sign up.";
    } finally {
      setIsLoadingUser(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoadingUser(true);
    try {
      // Clear any existing session first
      try {
        await account.deleteSession("current");
      } catch (error) {
        console.log("No active session to delete");
      }

      await account.createEmailPasswordSession(email, password);
      const session = await account.get();
      setUser(session);
      return null;
    } catch (error) {
      console.error("Sign in error:", error);
      return error instanceof Error ? error.message : "An unknown error occurred during sign in.";
    } finally {
      setIsLoadingUser(false);
    }
  };

  const signOut = async () => {
    setIsLoadingUser(true);
    try {
      await account.deleteSession("current");
      setUser(null);
      router.replace("/auth");
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if sign out fails, clear local user state
      setUser(null);
      router.replace("/auth");
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Don't render children until app is ready
  if (!isAppReady) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        isLoadingUser, 
        isAppReady,
        signUp, 
        signIn, 
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}