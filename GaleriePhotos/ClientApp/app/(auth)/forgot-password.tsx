import { useCallback, useState } from "react";
import { Text, View, TextInput, Button, StyleSheet } from "react-native";
import { useAuthenticationStore } from "@/stores/authentication";
import { useRouter } from "expo-router";

function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const auth = useAuthenticationStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    await auth.forgotPassword(email);
    setLoading(false);
    router.push({
      pathname: "/(auth)/reset-password",
      params: { email },
    });
  }, [auth, email, router]);
  return (
    <View>
      <Text style={styles.title}>Mot-de-passe oublié</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <Button title="Envoyer" onPress={onSubmit} disabled={loading} />
    </View>
  );
}
export default ForgotPasswordScreen;
const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: "bold",
    margin: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 10,
    padding: 10,
    margin: 10,
  },
});
