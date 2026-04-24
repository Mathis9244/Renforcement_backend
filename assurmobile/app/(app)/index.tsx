import { Button, Card, Divider, Text } from "react-native-paper";
import { View } from "react-native";
import { useUser } from "../../providers/UserProvider";
import { ApiError, api } from "../../lib/api";
import { useState } from "react";
import { useRouter } from "expo-router";

export default function AppHome() {
  const { session, signOut, token } = useUser();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<any>(null);
  const router = useRouter();
  const role = session?.user?.role;

  async function run<T>(fn: () => Promise<T>) {
    setBusy(true);
    setError(null);
    try {
      const out = await fn();
      setLast(out);
      return out;
    } catch (e: any) {
      const msg = e instanceof ApiError ? `${e.status} — ${e.message}` : e?.message || String(e);
      setError(msg);
      setLast(e instanceof ApiError ? e.payload : null);
      throw e;
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 48, gap: 12 }}>
      <View style={{ gap: 4 }}>
        <Text variant="headlineSmall">AssurMoi</Text>
        <Text variant="bodyMedium" style={{ opacity: 0.8 }}>
          {session?.user?.username} — {role}
        </Text>
      </View>
      <Button mode="outlined" onPress={signOut}>
        Se déconnecter
      </Button>

      <Card>
        <Card.Title title="Fonctionnalités (comme assurmoifront)" />
        <Card.Content>
          {error ? <Text style={{ color: "#ef4444" }}>{error}</Text> : null}
          <Divider style={{ marginVertical: 8 }} />
          <Button
            mode="contained"
            disabled={!token}
            onPress={() => router.push("/(app)/claims")}
          >
            Sinistres
          </Button>
          <Button
            mode="contained-tonal"
            disabled={!token}
            onPress={() => router.push("/(app)/case-files")}
          >
            Dossiers
          </Button>
          <Button
            mode="contained-tonal"
            disabled={!token}
            onPress={() => router.push("/(app)/approvals")}
          >
            Approvals
          </Button>
          <Button
            mode="contained-tonal"
            disabled={!token}
            onPress={() => router.push("/(app)/audit")}
          >
            Audit
          </Button>
          {role === "admin" ? (
            <Button mode="contained-tonal" disabled={!token} onPress={() => router.push("/(app)/users")}>
              Utilisateurs (admin)
            </Button>
          ) : null}
          <Divider style={{ marginVertical: 8 }} />
          <Button mode="outlined" disabled={busy || !token} onPress={() => run(() => api.listClaims(token!))}>
            Tester l’API (listClaims)
          </Button>
          <Text variant="bodySmall" style={{ opacity: 0.75 }}>
            Dernière réponse: {last ? JSON.stringify(last).slice(0, 500) : "(vide)"}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

