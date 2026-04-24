import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Snackbar, Text, useTheme } from "react-native-paper";
import { api, type ApiUser } from "../../../lib/api";
import { useUser } from "../../../providers/UserProvider";
import { useRouter } from "expo-router";

export default function UsersScreen() {
  const router = useRouter();
  const { token, session } = useUser();
  const [users, setUsers] = useState<ApiUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const theme = useTheme();

  async function refresh() {
    if (!token) return;
    setError(null);
    try {
      const res = await api.listUsers(token);
      setUsers(res.users);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function deactivate(id: number) {
    if (!token) return;
    setError(null);
    try {
      await api.deactivateUser(token, id);
      await refresh();
      setSnack("Utilisateur désactivé");
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const isAdmin = session?.user?.role === "admin";

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall">Utilisateurs</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {isAdmin ? (
            <Button mode="contained" disabled={!token} onPress={() => router.push("/(app)/users/new")}>
              Créer
            </Button>
          ) : null}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <Card.Title title="Liste" subtitle="GET /user" />
        <Card.Content style={{ gap: 8 }}>
          {!users ? <Text style={{ opacity: 0.75 }}>Chargement…</Text> : null}
          {users?.length === 0 ? <Text style={{ opacity: 0.75 }}>Aucun utilisateur.</Text> : null}
          {users?.map((u) => (
            <View key={u.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text>
                  #{u.id} — {u.username} — {u.role}
                </Text>
                <Text variant="bodySmall" style={{ opacity: 0.75 }}>
                  actif: {String(u.isActive)} — 2FA: {String(u.twoFactorEnabled)}
                </Text>
              </View>
              {isAdmin ? (
                <Button mode="text" onPress={() => deactivate(u.id)} disabled={!u.isActive}>
                  Désactiver
                </Button>
              ) : null}
            </View>
          ))}
        </Card.Content>
      </Card>

      <Button mode="outlined" disabled={!token} onPress={refresh}>
        Rafraîchir
      </Button>

      <Snackbar visible={Boolean(snack)} onDismiss={() => setSnack(null)} duration={2500}>
        {snack || ""}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 42, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  error: { color: "#ef4444" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
});

