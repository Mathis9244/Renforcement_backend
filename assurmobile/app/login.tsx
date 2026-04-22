import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Button, Text, TextInput } from "react-native-paper";
import { useUser } from "../providers/UserProvider";

export default function LoginScreen() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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

          <View style={styles.form}>
            <TextInput
              mode="outlined"
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              mode="outlined"
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
              right={
                <TextInput.Icon
                  icon={isPasswordVisible ? "eye-off" : "eye"}
                  onPress={() => setIsPasswordVisible((v: boolean) => !v)}
                />
              }
              textContentType="password"
            />
            <Button
              mode="contained"
              disabled={!canSubmit}
              onPress={async () => {
                await signIn({ username, password });
                router.replace("/(app)");
              }}
            >
              Se connecter
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
  form: { marginTop: 24, gap: 12 },
});

