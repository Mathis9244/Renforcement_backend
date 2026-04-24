import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Card, Text, useTheme } from "react-native-paper";
import { api, type Claim } from "../../../lib/api";
import { useUser } from "../../../providers/UserProvider";
import { Screen } from "../../../components/Screen";
import { Notice } from "../../../components/Notice";

export default function ClaimsListScreen() {
  const router = useRouter();
  const { token } = useUser();
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    const res = await api.listClaims(token);
    setClaims(res.claims);
  }, [token]);

  useEffect(() => {
    void load().catch((e: any) => setError(e?.message || String(e)));
  }, [load]);

  const onRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setRefreshing(false);
    }
  }, [load, token]);

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        contentContainerStyle={{ gap: 12 }}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall">Sinistres</Text>
          <Button mode="contained" disabled={!token} onPress={() => router.push("/(app)/claims/new")}>
            Nouveau
          </Button>
        </View>

        {error ? <Notice tone="error">{error}</Notice> : null}
        {!claims ? <Text style={{ opacity: 0.75 }}>Chargement…</Text> : null}
        {claims?.length === 0 ? <Text style={{ opacity: 0.75 }}>Aucun sinistre pour le moment.</Text> : null}

      {claims?.map((c) => (
        <Card
          key={c.id}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Card.Title title={`Sinistre n°${c.id}`} subtitle={c.contextText} />
          <Card.Content>
            <Text variant="titleMedium">Véhicule : {c.vehicleRegistration}</Text>
            <Text variant="bodySmall" style={{ opacity: 0.8 }}>
              Soumis le : {c.accidentAt}
            </Text>
            <Text variant="bodySmall" style={{ opacity: 0.8 }}>
              Statut : {c.status}
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained-tonal"
              onPress={() => router.push({ pathname: "/(app)/claims/[id]", params: { id: String(c.id) } })}
            >
              Accéder au sinistre
            </Button>
          </Card.Actions>
        </Card>
      ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  card: { marginTop: 10, borderWidth: StyleSheet.hairlineWidth },
  error: { color: "#ef4444" },
});

