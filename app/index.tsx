import { Text, View, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  
  return (
    <View style={{ flex: 1, backgroundColor: "#030014" }}>
      {/* Background images */}
      <Image 
        source={require('../assets/images/bg.png')}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: 0
        }}
        resizeMode="cover"
      />
      
      <Image
        source={require('../assets/images/bg.png')}
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: 400,
          zIndex: 0,
          transform: [{ scaleY: -1 }],
        }}
        resizeMode="cover"
      />

      {/* Content */}
      <View style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center",
        zIndex: 10,
        paddingTop: 45
      }}>
        <Text style={{ 
          color: "#a8a8a7", 
          fontSize: 48, 
          fontWeight: "bold",
          letterSpacing: 1
        }}>
          Wherezit
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/auth")}
          style={{
            marginTop: 20,
            backgroundColor: "#3e4ec7",
            paddingVertical: 16,
            paddingHorizontal: 40,
            borderRadius: 30,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 8,
          }}
        >
          <Text style={{
            color: "#a8a8a7",
            fontSize: 20,
            fontWeight: "bold",
            letterSpacing: 1,
          }}>
            Get Started
          </Text>
        </TouchableOpacity>

        <Image
          source={require('../assets/images/search-137.png')}
          style={{
            marginTop: 20,
            width: 150,
            height: 150,
            resizeMode: "contain",
          }}
        />
      </View>
    </View>
  );
}