import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  ScrollView,
  Image,
  BackHandler,
} from "react-native";
import {
  Button,
  Text,
  TextInput,
  Snackbar,
} from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const router = useRouter();
  const { signIn, signUp } = useAuth();

  // Handle Android back press → go to index page
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/");
        return true;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }, [])
  );

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      showSnackbar("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Passwords must be at least 6 characters long.");
      showSnackbar("Passwords must be at least 6 characters long.");
      return;
    }

    setError(null);

    try {
      if (isSignUp) {
        const error = await signUp(email, password);
        if (error) {
          setError(error);
          showSnackbar(error);
          return;
        }
        showSnackbar("Account created successfully!");
      } else {
        const error = await signIn(email, password);
        if (error) {
          setError(error);
          showSnackbar(error);
          return;
        }
        showSnackbar("Logged in successfully!");
        router.replace("/");
      }
    } catch (err) {
      showSnackbar("An unexpected error occurred");
    }
  };

  const handleSwitchMode = () => {
    setIsSignUp((prev) => !prev);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Background image flipped vertically at the bottom */}
      <Image
        source={require("../assets/images/bg.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <View style={styles.container}>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: "Dismiss",
            onPress: () => setSnackbarVisible(false),
          }}
          style={styles.snackbar}
          wrapperStyle={styles.snackbarWrapper}
        >
          <Text style={{ color: "white" }}>{snackbarMessage}</Text>
        </Snackbar>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <Text style={styles.title} variant="headlineMedium">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </Text>

              <TextInput
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="example@gmail.com"
                mode="outlined"
                style={styles.input}
                onChangeText={setEmail}
                value={email}
                theme={{
                  colors: {
                    text: "black",
                    placeholder: "black",
                    primary: "black",
                  },
                }}
              />

              <TextInput
                label="Password"
                autoCapitalize="none"
                mode="outlined"
                secureTextEntry
                style={styles.input}
                onChangeText={setPassword}
                value={password}
                theme={{
                  colors: {
                    text: "black",
                    placeholder: "black",
                    primary: "black",
                  },
                }}
              />

              {error && (
                <Text style={{ color: "white", marginBottom: 16 }}>{error}</Text>
              )}

              <Button
                mode="contained"
                style={styles.button}
                onPress={handleAuth}
                labelStyle={[styles.buttonLabel, { color: "#c0c0c0" }]}
              >
                {isSignUp ? "Sign Up" : "Sign In"}
              </Button>

              <Button
                mode="text"
                onPress={handleSwitchMode}
                style={styles.switchModeButton}
                labelStyle={[styles.switchModeButtonLabel, { color: "#c0c0c0" }]}
              >
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Sign Up"}
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 400,
    zIndex: 0,
    transform: [{ scaleY: -1 }],
  },
  container: {
    flex: 1,
    backgroundColor: "#030014",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
    color: "#d7d7db",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "#2d60c4",
    marginTop: 8,
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
  },
  switchModeButton: {
    marginTop: 16,
  },
  switchModeButtonLabel: {
    fontSize: 14,
  },
  snackbar: {
    backgroundColor: "#2d60c4",
    marginTop: Platform.OS === "ios" ? 40 : 20,
  },
  snackbarWrapper: {
    top: 0,
    zIndex: 100,
  },
});
