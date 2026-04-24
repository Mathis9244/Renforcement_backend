import { Redirect } from "expo-router";
import { useUser } from "../providers/UserProvider";

export default function Index() {
  const { isAuthenticated } = useUser();
  // Like the web front: land on "Sinistres" after login.
  return <Redirect href={isAuthenticated ? "/(app)/claims" : "/login"} />;
}
