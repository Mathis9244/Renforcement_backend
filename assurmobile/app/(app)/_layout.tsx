import { Redirect, Tabs } from "expo-router";
import { useUser } from "../../providers/UserProvider";
import { IconButton, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function AppLayout() {
  const { isAuthenticated, session } = useUser();
  const theme = useTheme();
  const isAdmin = session?.user?.role === "admin";

  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={({ navigation }) => ({
        headerShown: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.outlineVariant,
        },
        headerStyle: { backgroundColor: theme.colors.background },
        headerTitleStyle: { color: theme.colors.onBackground },
        headerTintColor: theme.colors.onBackground,
        headerLeft: () =>
          navigation.canGoBack() ? (
            <IconButton
              icon="arrow-left"
              iconColor={theme.colors.onBackground}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Retour"
            />
          ) : null,
      })}
    >
      <Tabs.Screen
        name="claims"
        options={{
          title: "Sinistres",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="car" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="case-files"
        options={{
          title: "Dossiers",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="folder-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: "Approvals",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="check-decagram-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="audit"
        options={{
          title: "Audit",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="clipboard-text-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Utilisateurs",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}

