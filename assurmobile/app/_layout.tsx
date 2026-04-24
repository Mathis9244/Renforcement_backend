import { Stack } from "expo-router";
import { PaperProvider, MD3DarkTheme, type MD3Theme } from "react-native-paper";
import { UserProvider } from "../providers/UserProvider";
import { StatusBar } from "expo-status-bar";

const theme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#4f46e5", // front: indigo
    secondary: "#8b5cf6",
    background: "#0b1020", // front: dark bg
    surface: "rgba(255,255,255,0.04)", // front card bg
    surfaceVariant: "rgba(0,0,0,0.25)",
    outline: "rgba(255,255,255,0.14)",
    outlineVariant: "rgba(255,255,255,0.12)",
    onBackground: "#ffffff",
    onSurface: "#ffffff",
    onSurfaceVariant: "rgba(255,255,255,0.8)",
    error: "#ef4444",
  },
  roundness: 14,
};

export default function RootLayout() {
  return (
    <UserProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background as any },
            headerTintColor: theme.colors.onBackground as any,
            headerTitleStyle: { color: theme.colors.onBackground as any },
          }}
        />
      </PaperProvider>
    </UserProvider>
  );
}
