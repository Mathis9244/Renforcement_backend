import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Snackbar, Text, TextInput, useTheme } from "react-native-paper";
import { api, type Approval } from "../../../lib/api";
import { useUser } from "../../../providers/UserProvider";

export default function ApprovalsScreen() {
  const { token } = useUser();
  const [approvals, setApprovals] = useState<Approval[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const theme = useTheme();

  const [approvalId, setApprovalId] = useState("1");
  const [decision, setDecision] = useState<string>("approved");

  async function refresh() {
    if (!token) return;
    setError(null);
    try {
      const res = await api.listPendingApprovals(token);
      setApprovals(res.approvals);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function decide() {
    if (!token) return;
    setError(null);
    const id = Number(approvalId);
    if (!id) return setError("Approval ID invalide");
    const normalized = decision.trim() === "rejected" ? "rejected" : "approved";
    try {
      await api.decideApproval(token, id, normalized as any);
      await refresh();
      setSnack("Décision envoyée");
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall">Approvals</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button mode="contained" disabled={!token} onPress={refresh}>
            Rafraîchir
          </Button>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <Card.Title title="En attente" />
        <Card.Content style={{ gap: 8 }}>
          {!approvals ? <Text style={{ opacity: 0.75 }}>Chargement…</Text> : null}
          {approvals?.length === 0 ? <Text style={{ opacity: 0.75 }}>Aucune approval en attente.</Text> : null}
          {approvals?.map((a) => (
            <View key={a.id} style={styles.row}>
              <Text style={{ flex: 1 }}>
                #{a.id} — caseFile {a.caseFileId} — {a.status}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Décider" subtitle="PATCH /api/v1/approvals/{id}/decide" />
        <Card.Content style={{ gap: 10 }}>
          <TextInput label="Approval ID" value={approvalId} onChangeText={setApprovalId} keyboardType="number-pad" />
          <TextInput
            label="Decision (approved|rejected)"
            value={decision}
            onChangeText={setDecision}
          />
          <Button mode="contained" disabled={!token} onPress={decide}>
            Envoyer
          </Button>
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

