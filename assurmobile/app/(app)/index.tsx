import { Button, Text } from "react-native-paper";
import { View } from "react-native";
import { useUser } from "../../providers/UserProvider";

export default function AppHome() {
  const { session, signOut } = useUser();

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 48, gap: 12 }}>
      <Text variant="headlineSmall">Bienvenue</Text>
      <Text variant="bodyMedium">{session?.user?.username}</Text>
      <Button mode="outlined" onPress={signOut}>
        Se déconnecter
      </Button>
    </View>
  );
}

