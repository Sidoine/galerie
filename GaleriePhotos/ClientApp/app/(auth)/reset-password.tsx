import { useCallback, useState } from "react";
import {
  TextInput,
  Button,
  ScrollView,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthenticationStore } from "@/stores/authentication";

export default function ResetPassword() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuthenticationStore();
  const router = useRouter();

  const handleReset = useCallback(async () => {
    if (!email || !code || !password) {
      Alert.alert("Erreur", "Tous les champs sont obligatoires");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    const ok = await auth.resetPassword(email, code, password);
    setLoading(false);
    if (!ok) {
      Alert.alert(
        "Erreur",
        "Impossible de réinitialiser le mot de passe. Vérifiez le code."
      );
      return;
    }
    Alert.alert("Succès", "Mot de passe réinitialisé", [
      {
        text: "OK",
        onPress: () => router.replace("/(auth)/sign-in"),
      },
    ]);
  }, [email, code, password, confirmPassword, auth, router]);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.root}>
      <Text style={styles.title}>Réinitialiser le mot de passe</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        inputMode="email"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Code de récupération"
        value={code}
        onChangeText={setCode}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Nouveau mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        placeholder="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Réinitialiser" onPress={handleReset} disabled={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 8 },
  title: { fontSize: 32, fontWeight: "bold", margin: 10 },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 10,
    padding: 10,
    margin: 10,
  },
});
