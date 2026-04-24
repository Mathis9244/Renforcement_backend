import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import { PaperSelect } from "react-native-paper-select";
import { api, type Role } from "../../../lib/api";
import { useUser } from "../../../providers/UserProvider";
import { useRouter } from "expo-router";

export default function NewUserScreen() {
  const router = useRouter();
  const { token } = useUser();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [role, setRole] = useState<Role>("charge_clientele");

  const canSubmit = useMemo(() => username.trim().length > 0 && password.length >= 8, [username, password]);

  async function submit() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await api.createUser(token, {
        username: username.trim(),
        password,
        email: email.trim() ? email.trim() : null,
        firstname: firstname.trim() ? firstname.trim() : null,
        lastname: lastname.trim() ? lastname.trim() : null,
        role,
        isActive: true,
      });
      router.replace("/(app)/users");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall">Créer un utilisateur</Text>
        <Button mode="outlined" onPress={() => router.back()} disabled={busy}>
          Retour
        </Button>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <Card.Title title="Admin" subtitle="POST /user" />
        <Card.Content style={{ gap: 10 }}>
          <TextInput label="username" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextInput label="password (8+)" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
          <TextInput label="email" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <TextInput label="firstname" value={firstname} onChangeText={setFirstname} />
          <TextInput label="lastname" value={lastname} onChangeText={setLastname} />
          <PaperSelect
            label="role"
            value={role}
            onSelection={(v: any) => setRole((v?.selectedList?.[0]?.value as Role) ?? role)}
            arrayList={[
              { _id: "admin", value: "admin" },
              { _id: "gestionnaire_portefeuille", value: "gestionnaire_portefeuille" },
              { _id: "charge_suivi", value: "charge_suivi" },
              { _id: "charge_clientele", value: "charge_clientele" },
              { _id: "assure", value: "assure" },
            ]}
            selectedArrayList={[{ _id: role, value: role }]}
            multiEnable={false}
            hideSearchBox
          />
          <Button mode="contained" disabled={!token || busy || !canSubmit} onPress={submit}>
            Créer
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 42, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  error: { color: "#ef4444" },
});

