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
import { LinearGradient } from "expo-linear-gradient"; // <-- import this

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
      {/* Container to hold image and gradient overlay */}
      <View style={styles.bottomLightContainer}>
        <Image
          source={require("../assets/images/light.jpg")}
          style={[styles.bottomLight, { transform: [{ scaleY: -1 }] }]}
          resizeMode="cover"
        />
        {/* Gradient fades from transparent at bottom to bg color at top */}
        <LinearGradient
          colors={["rgba(3,0,20,0)", "#030014"]} 
          style={styles.gradientOverlay}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
        />
      </View>

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
  bottomLightContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 100,
    zIndex: 1,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    overflow: "hidden",
  },
  bottomLight: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40, // height of gradient fade from transparent to bg color
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
    marginTop: Platform.OS === "ios" ? 40 : 30,
  },
  snackbarWrapper: {
    top: 0,
    zIndex: 100,
  },
});

