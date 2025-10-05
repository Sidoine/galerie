import { useCallback, useState } from "react";
import { Text, View, TextInput, Button, StyleSheet } from "react-native";
import { useAuthenticationStore } from "@/stores/authentication";
import { useRouter } from "expo-router";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const auth = useAuthenticationStore();
  const router = useRouter();

  const onSubmit = useCallback(async () => {
    await auth.forgotPassword(email);
    router.push("/(auth)/sign-in");
  }, [auth, email, router]);
  return (
    <View>
      <Text style={styles.title}>Forgot Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <Button title="Submit" onPress={onSubmit} />
    </View>
  );
}
export default ForgotPassword;
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
