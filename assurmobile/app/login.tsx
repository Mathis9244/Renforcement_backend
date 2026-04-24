import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { useUser } from "../providers/UserProvider";
import { ApiError, getBaseUrl } from "../lib/api";

export default function LoginScreen() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin123!");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn } = useUser();

  const canSubmit = useMemo(() => {
    return username.trim().length > 0 && password.length > 0;
  }, [username, password]);

  return (
    <>
      <Stack.Screen options={{ title: "Connexion" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.screen}
      >
        <View style={styles.container}>
          <Text variant="headlineMedium" style={styles.title}>
            AssurMoi
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Connecte-toi pour continuer
          </Text>

          <Text variant="bodySmall" style={styles.hint}>
            Compte de démo: <Text style={styles.bold}>admin</Text> / <Text style={styles.bold}>Admin123!</Text>
          </Text>
          <Text variant="bodySmall" style={styles.apiHint}>
            API: <Text style={styles.bold}>{getBaseUrl()}</Text>
          </Text>
          {Platform.OS === "ios" && getBaseUrl().includes("localhost") ? (
            <Text variant="bodySmall" style={styles.apiHint}>
              iPhone: définis <Text style={styles.bold}>EXPO_PUBLIC_API_BASE_URL</Text> vers l’IP de ton PC (ex{" "}
              <Text style={styles.bold}>http://10.18.72.114:3000</Text>)
            </Text>
          ) : null}

          <View style={styles.form}>
            <TextInput
              mode="outlined"
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
            />
            <TextInput
              mode="outlined"
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
              editable={!busy}
              right={
                <TextInput.Icon
                  icon={isPasswordVisible ? "eye-off" : "eye"}
                  onPress={() => setIsPasswordVisible((v: boolean) => !v)}
                />
              }
              textContentType="password"
            />
            <HelperText type="error" visible={Boolean(error)}>
              {error || " "}
            </HelperText>
            <Button
              mode="contained"
              disabled={!canSubmit || busy}
              onPress={async () => {
                setBusy(true);
                setError(null);
                try {
                  await signIn({ username, password });
                  router.replace("/(app)/claims");
                } catch (e: any) {
                  const msg = e instanceof ApiError ? `${e.status} — ${e.message}` : e?.message || String(e);
                  setError(msg);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Connexion…" : "Se connecter"}
            </Button>
            <Button mode="text" onPress={() => router.push("/forgot-password")}>
              Mot de passe oublié ?
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  title: { fontWeight: "700" },
  subtitle: { marginTop: 6, opacity: 0.75 },
  hint: { marginTop: 10, opacity: 0.85 },
  apiHint: { marginTop: 6, opacity: 0.7 },
  bold: { fontWeight: "700" },
  form: { marginTop: 24, gap: 12 },
});

