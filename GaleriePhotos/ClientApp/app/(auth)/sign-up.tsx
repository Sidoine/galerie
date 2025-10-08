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

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const authenticationStore = useAuthenticationStore();
  const [loading, setLoading] = useState(false);

  const handleSignUp = useCallback(async () => {
    setLoading(true);
    const signUpResponse = await authenticationStore.register(email, password);
    setLoading(false);
    if (!signUpResponse) {
      Alert.alert("Error", "Failed to sign up");
      return;
    }
  }, [email, password, authenticationStore]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, padding: 8 }}
    >
      <Text style={{ fontSize: 32, fontWeight: "bold", margin: 10 }}>
        Sign Up
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
      <Button title="Sign up" onPress={handleSignUp} disabled={loading} />
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
