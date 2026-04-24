import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Divider, HelperText, Snackbar, Text, TextInput, useTheme } from "react-native-paper";
import { api } from "../../../lib/api";
import { useUser } from "../../../providers/UserProvider";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { PaperSelect } from "react-native-paper-select";

export default function NewClaimScreen() {
  const router = useRouter();
  const { token } = useUser();
  const theme = useTheme();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const [vehicleRegistration, setVehicleRegistration] = useState("AA-123-AA");
  const [driverFirstName, setDriverFirstName] = useState("Jean");
  const [driverLastName, setDriverLastName] = useState("Dupont");
  const [callAt, setCallAt] = useState(new Date().toISOString());
  const [accidentAt, setAccidentAt] = useState(new Date(Date.now() - 30 * 60 * 1000).toISOString());
  const [contextText, setContextText] = useState("Test via mobile");
  const [liabilityAccepted, setLiabilityAccepted] = useState<string>("false");
  const [liabilityPercent, setLiabilityPercent] = useState<string>("0");

  const [claimId, setClaimId] = useState<string>("");
  const [docType, setDocType] = useState("attestation_assurance");
  const [fileUrl, setFileUrl] = useState("https://example.com/a.pdf");
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; type?: string } | null>(null);
  const [scenario, setScenario] = useState<string>("reparable");

  const effectiveLiabilityPercent = useMemo(() => {
    if (liabilityAccepted !== "true") return 0;
    const n = Number(liabilityPercent);
    return Number.isFinite(n) ? n : 0;
  }, [liabilityAccepted, liabilityPercent]);

  const canCreate = useMemo(() => {
    return (
      Boolean(token) &&
      vehicleRegistration.trim().length > 0 &&
      driverFirstName.trim().length > 0 &&
      driverLastName.trim().length > 0 &&
      callAt.trim().length > 0 &&
      accidentAt.trim().length > 0 &&
      contextText.trim().length > 0
    );
  }, [token, vehicleRegistration, driverFirstName, driverLastName, callAt, accidentAt, contextText]);

  async function create() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.createClaim(token, {
        vehicleRegistration,
        driverFirstName,
        driverLastName,
        driverIsInsured: true,
        callAt,
        accidentAt,
        contextText,
        liabilityAccepted: liabilityAccepted === "true",
        liabilityPercent: effectiveLiabilityPercent,
      } as any);
      setClaimId(String(res.claim.id));
      setSnack(`Sinistre créé (#${res.claim.id})`);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function addDoc() {
    if (!token) return;
    const id = Number(claimId);
    if (!id) return setError("Claim ID invalide");
    setBusy(true);
    setError(null);
    try {
      if (pickedFile) {
        await api.addDocument(token, id, { docType, file: pickedFile });
      } else {
        if (!fileUrl.trim().length) throw new Error("fileUrl requis si aucun fichier n’est sélectionné");
        await api.addDocument(token, id, { docType, fileUrl: fileUrl.trim() });
      }
      setSnack("Document ajouté");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function pickDocument() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset?.uri) return;
      setPickedFile({
        uri: asset.uri,
        name: asset.name || "document",
        type: asset.mimeType || undefined,
      });
      setFileUrl(asset.uri);
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function complete() {
    if (!token) return;
    const id = Number(claimId);
    if (!id) return setError("Claim ID invalide");
    setBusy(true);
    setError(null);
    try {
      const normalized = scenario.trim() === "total_loss" ? "total_loss" : "reparable";
      await api.completeClaim(token, id, { scenario: normalized as any });
      setSnack("Dossier créé (sinistre complété)");
      router.replace("/(app)/case-files");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall">Nouveau sinistre</Text>
        <Button mode="outlined" onPress={() => router.back()} disabled={busy}>
          Fermer
        </Button>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <Card.Title title="Créer (draft)" subtitle="POST /api/v1/claims" />
        <Card.Content style={{ gap: 10 }}>
          <TextInput label="Immatriculation" value={vehicleRegistration} onChangeText={setVehicleRegistration} />
          <TextInput label="Prénom conducteur" value={driverFirstName} onChangeText={setDriverFirstName} />
          <TextInput label="Nom conducteur" value={driverLastName} onChangeText={setDriverLastName} />
          <TextInput label="callAt (ISO)" value={callAt} onChangeText={setCallAt} />
          <TextInput label="accidentAt (ISO)" value={accidentAt} onChangeText={setAccidentAt} />
          <TextInput label="Contexte" value={contextText} onChangeText={setContextText} />
          <TextInput
            label="Responsabilité engagée ? (true|false)"
            value={liabilityAccepted}
            onChangeText={setLiabilityAccepted}
          />
          <TextInput
            label="% responsabilité (0|50|100)"
            value={liabilityPercent}
            onChangeText={setLiabilityPercent}
            keyboardType="number-pad"
          />
          <HelperText type="info" visible>
            Astuce: tu peux laisser certains champs vides, mais pour créer le sinistre il faut au minimum les champs
            principaux (immat, conducteur, dates, contexte).
          </HelperText>
          <Button mode="contained" disabled={!canCreate || busy} onPress={create}>
            {busy ? "Création…" : "Créer"}
          </Button>
          {claimId ? (
            <Text style={{ opacity: 0.75 }} variant="bodySmall">
              Claim ID: {claimId}
            </Text>
          ) : null}
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Documents" subtitle="POST /api/v1/claims/{claimId}/documents" />
        <Card.Content style={{ gap: 10 }}>
          <TextInput label="Claim ID" value={claimId} onChangeText={setClaimId} keyboardType="number-pad" />
          <Divider />
          <PaperSelect
            label="Type de document"
            value={docType}
            onSelection={(v: any) => setDocType(v?.selectedList?.[0]?.value ?? docType)}
            arrayList={[
              { _id: "attestation_assurance", value: "attestation_assurance" },
              { _id: "carte_grise", value: "carte_grise" },
              { _id: "piece_identite_conducteur", value: "piece_identite_conducteur" },
              { _id: "other", value: "other" },
            ]}
            selectedArrayList={[{ _id: docType, value: docType }]}
            multiEnable={false}
            hideSearchBox
          />
          <TextInput label="fileUrl (ou URI locale)" value={fileUrl} onChangeText={setFileUrl} />
          <Button mode="outlined" disabled={busy} onPress={pickDocument}>
            Choisir un fichier (DocumentPicker)
          </Button>
          {pickedFile ? (
            <Text variant="bodySmall" style={{ opacity: 0.75 }}>
              Fichier sélectionné: {pickedFile.name}
            </Text>
          ) : null}
          <Button mode="contained-tonal" disabled={!token || busy} onPress={addDoc}>
            Ajouter le document
          </Button>
          <Text variant="bodySmall" style={{ opacity: 0.75 }}>
            docType: attestation_assurance | carte_grise | piece_identite_conducteur | other
          </Text>
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Compléter (créer dossier)" subtitle="POST /api/v1/claims/{id}/complete" />
        <Card.Content style={{ gap: 10 }}>
          <TextInput
            label="scenario (reparable|total_loss)"
            value={scenario}
            onChangeText={setScenario}
          />
          <Button mode="contained" disabled={!token || busy || !claimId.trim().length} onPress={complete}>
            {busy ? "Envoi…" : "Compléter"}
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
});

