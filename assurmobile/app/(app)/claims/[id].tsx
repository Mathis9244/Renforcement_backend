import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Chip, Switch, Text, useTheme } from "react-native-paper";
import { api, type Claim } from "../../../lib/api";
import { useUser } from "../../../providers/UserProvider";

export default function ClaimDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useUser();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    let mounted = true;
    const numericId = Number(id);
    if (!token || !numericId) return;
    api
      .getClaim(token, numericId)
      .then((res) => {
        if (!mounted) return;
        setClaim(res.claim);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.message || String(e));
      });
    return () => {
      mounted = false;
    };
  }, [id, token]);

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.error}>{error}</Text>
        <Button mode="outlined" onPress={() => router.back()}>
          Retour
        </Button>
      </View>
    );
  }

  if (!claim) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ opacity: 0.75 }}>Chargement…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall">Mon sinistre</Text>
        <Button mode="outlined" onPress={() => router.back()}>
          Retour
        </Button>
      </View>

      <Card style={{ backgroundColor: theme.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.outlineVariant }}>
        <Card.Title
          title={`Sinistre n°${claim.id}`}
          subtitle={claim.contextText}
          right={() => <Chip style={{ marginRight: 12 }}>{claim.status}</Chip>}
        />
        <Card.Content style={{ gap: 10 }}>
          <Text>Plaque : {claim.vehicleRegistration}</Text>
          <Text>Date du sinistre : {claim.accidentAt}</Text>
          <Text>Date de signalement : {claim.callAt}</Text>
          <Text>Nom conducteur : {claim.driverLastName}</Text>
          <Text>Prénom conducteur : {claim.driverFirstName}</Text>
          <Text>Responsabilité engagée :</Text>
          <Switch disabled value={Boolean(claim.liabilityAccepted)} />
          <Text>% responsabilité : {claim.liabilityPercent}</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 42, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  error: { color: "#ef4444" },
});

