import { useCallback, useState } from "react";
import {
  TextInput,
  Button,
  ScrollView,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { useAuthenticationStore } from "@/stores/authentication";
import { Link } from "expo-router";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const authenticationStore = useAuthenticationStore();
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    setLoading(true);
    const signInResponse = await authenticationStore.authenticate(
      email,
      password
    );
    setLoading(false);
    if (!signInResponse) {
      Alert.alert("Error", "Failed to sign in");
      return;
    }
  }, [email, password, authenticationStore]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, padding: 8 }}
    >
      <Text style={{ fontSize: 32, fontWeight: "bold", margin: 10 }}>
        Sign In
      </Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        inputMode="email"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      <Button title="Sign in" onPress={handleLogin} disabled={loading} />
      <Link href="/(auth)/sign-up" asChild>
        <Text style={{ textAlign: "center" }}>Sign up</Text>
      </Link>
      <Link href="/(auth)/forgot-password" asChild>
        <Text style={{ textAlign: "center", marginTop: 10 }}>
          Forgot Password?
        </Text>
      </Link>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 10,
    padding: 10,
    margin: 10,
  },
});
