import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Snackbar, Text, TextInput, useTheme } from "react-native-paper";
import { api, type AuditLog } from "../../../lib/api";
import { useUser } from "../../../providers/UserProvider";

export default function AuditScreen() {
  const { token } = useUser();
  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState("50");
  const [snack, setSnack] = useState<string | null>(null);
  const theme = useTheme();

  async function load() {
    if (!token) return;
    setError(null);
    try {
      const res = await api.listAuditLogs(token, Number(limit) || 50);
      setLogs(res.logs);
      setSnack("Audit chargé");
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall">Audit</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button mode="contained" disabled={!token} onPress={load}>
            Charger
          </Button>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <Card.Title title="Logs" subtitle="GET /api/v1/audit/logs" />
        <Card.Content style={{ gap: 10 }}>
          <TextInput label="limit" value={limit} onChangeText={setLimit} keyboardType="number-pad" />
          {!logs ? <Text style={{ opacity: 0.75 }}>Chargement…</Text> : null}
          {logs?.length === 0 ? <Text style={{ opacity: 0.75 }}>Aucun log.</Text> : null}
          {logs?.map((l) => (
            <View key={l.id} style={styles.row}>
              <Text style={{ flex: 1 }}>
                #{l.id} — {l.action} — {l.entityType}:{l.entityId}
              </Text>
              <Text style={{ opacity: 0.7 }} variant="bodySmall">
                {l.createdAt}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

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
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
});

