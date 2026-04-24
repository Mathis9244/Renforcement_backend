import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Button, Text, TextInput } from "react-native-paper";
import { api } from "../lib/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 3 && email.includes("@"), [email]);

  async function submit() {
    setBusy(true);
    setError(null);
    setResetToken(null);
    try {
      const res = await api.forgotPassword(email.trim());
      // En dev, l'API renvoie un resetToken (cf. OpenAPI). On l’affiche pour faciliter les tests.
      setResetToken(res.resetToken ?? null);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Mot de passe oublié" }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
        <View style={styles.container}>
          <Text variant="titleLarge">Réinitialiser le mot de passe</Text>
          <Text style={{ opacity: 0.75 }}>
            Saisis ton e-mail. En environnement de dev, un token est renvoyé et peut être collé dans l’étape suivante.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.form}>
            <TextInput mode="outlined" label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <Button mode="contained" disabled={!canSubmit || busy} onPress={submit}>
              Envoyer
            </Button>
            <Button mode="text" onPress={() => router.back()} disabled={busy}>
              Retour
            </Button>
          </View>

          {resetToken ? (
            <View style={{ marginTop: 18, gap: 10 }}>
              <Text variant="bodyMedium">
                Token (dev): <Text style={{ fontWeight: "700" }}>{resetToken}</Text>
              </Text>
              <Button
                mode="contained-tonal"
                onPress={() => router.push({ pathname: "/reset-password", params: { token: resetToken } })}
              >
                Continuer (reset)
              </Button>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 48, gap: 10 },
  form: { marginTop: 14, gap: 12 },
  error: { color: "#ef4444" },
});

