import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { UserProvider } from "../providers/UserProvider";

export default function RootLayout() {
  return (
    <UserProvider>
      <PaperProvider>
        <Stack />
      </PaperProvider>
    </UserProvider>
  );
}
