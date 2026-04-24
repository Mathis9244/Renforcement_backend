import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Snackbar, Text, TextInput, useTheme } from "react-native-paper";
import { api, type CaseFile } from "../../../lib/api";
import { useUser } from "../../../providers/UserProvider";

export default function CaseFilesScreen() {
  const { token } = useUser();
  const [caseFiles, setCaseFiles] = useState<CaseFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const theme = useTheme();

  const [caseId, setCaseId] = useState("1");
  const [toState, setToState] = useState("EXPERTISE_EN_ATTENTE");
  const [comment, setComment] = useState("test");
  const [expertisePlannedAt, setExpertisePlannedAt] = useState(new Date().toISOString());
  const [expertiseDoneAt, setExpertiseDoneAt] = useState(new Date().toISOString());
  const [expertiseReportUrl, setExpertiseReportUrl] = useState("https://example.com/expert.pdf");
  const [expertiseDiagnostic, setExpertiseDiagnostic] = useState<string>("reparable");

  const payload = useMemo(() => {
    return {
      toState,
      comment: comment.trim().length ? comment : undefined,
      expertisePlannedAt: toState === "EXPERTISE_PLANIFIEE" ? expertisePlannedAt : undefined,
      expertiseDoneAt: toState === "EXPERTISE_REALISEE" ? expertiseDoneAt : undefined,
      expertiseReportUrl: toState === "EXPERTISE_REALISEE" ? expertiseReportUrl : undefined,
      expertiseDiagnostic: toState === "EXPERTISE_REALISEE" && expertiseDiagnostic.trim().length ? expertiseDiagnostic.trim() : undefined,
    };
  }, [toState, comment, expertisePlannedAt, expertiseDoneAt, expertiseReportUrl, expertiseDiagnostic]);

  async function refresh() {
    if (!token) return;
    setError(null);
    try {
      const res = await api.listCaseFiles(token);
      setCaseFiles(res.caseFiles);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function transition() {
    if (!token) return;
    setError(null);
    const id = Number(caseId);
    if (!id) return setError("Case ID invalide");
    try {
      await api.transitionCaseFile(token, id, payload);
      await refresh();
      setSnack("Transition envoyée");
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
        <Text variant="headlineSmall">Dossiers</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button mode="contained" disabled={!token} onPress={refresh}>
            Rafraîchir
          </Button>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <Card.Title title="Liste" />
        <Card.Content style={{ gap: 8 }}>
          {!caseFiles ? <Text style={{ opacity: 0.75 }}>Chargement…</Text> : null}
          {caseFiles?.length === 0 ? <Text style={{ opacity: 0.75 }}>Aucun dossier pour le moment.</Text> : null}
          {caseFiles?.map((c) => (
            <View key={c.id} style={styles.row}>
              <Text style={{ flex: 1 }}>
                #{c.id} — {c.caseNumber} — {c.currentState}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Transition dossier" subtitle="Comme dans le front (case-files/{id}/transition)" />
        <Card.Content style={{ gap: 10 }}>
          <TextInput label="Case ID" value={caseId} onChangeText={setCaseId} keyboardType="number-pad" />
          <TextInput label="toState" value={toState} onChangeText={setToState} />
          <TextInput label="comment" value={comment} onChangeText={setComment} />

          <Text variant="bodySmall" style={{ opacity: 0.75 }}>
            Si `toState` = EXPERTISE_PLANIFIEE, envoie `expertisePlannedAt`. Si `toState` = EXPERTISE_REALISEE, envoie les
            champs d’expertise.
          </Text>

          <TextInput label="expertisePlannedAt (ISO)" value={expertisePlannedAt} onChangeText={setExpertisePlannedAt} />
          <TextInput label="expertiseDoneAt (ISO)" value={expertiseDoneAt} onChangeText={setExpertiseDoneAt} />
          <TextInput label="expertiseReportUrl" value={expertiseReportUrl} onChangeText={setExpertiseReportUrl} />
          <TextInput
            label="expertiseDiagnostic (reparable|total_loss)"
            value={expertiseDiagnostic}
            onChangeText={setExpertiseDiagnostic}
          />

          <Button mode="contained" disabled={!token} onPress={transition}>
            Transition
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

