import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Button, Text, TextInput } from "react-native-paper";
import { api } from "../lib/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const canSubmit = useMemo(() => token.trim().length > 5 && newPassword.length >= 8, [token, newPassword]);

  async function submit() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await api.resetPassword(token.trim(), newPassword);
      setOk(res.message || "Mot de passe mis à jour");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Reset password" }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
        <View style={styles.container}>
          <Text variant="titleLarge">Nouveau mot de passe</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {ok ? <Text style={styles.ok}>{ok}</Text> : null}

          <View style={styles.form}>
            <TextInput mode="outlined" label="Token" value={token} onChangeText={setToken} autoCapitalize="none" />
            <TextInput
              mode="outlined"
              label="Nouveau mot de passe (8+)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Button mode="contained" disabled={!canSubmit || busy} onPress={submit}>
              Mettre à jour
            </Button>
            <Button mode="text" onPress={() => router.replace("/login")} disabled={busy}>
              Retour login
            </Button>
          </View>
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
  ok: { color: "#22c55e" },
});

