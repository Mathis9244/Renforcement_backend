import { Redirect, Stack } from "expo-router";
import { useUser } from "../../providers/UserProvider";

export default function AppLayout() {
  const { isAuthenticated } = useUser();

  if (!isAuthenticated) return <Redirect href="/login" />;

  return <Stack />;
}

