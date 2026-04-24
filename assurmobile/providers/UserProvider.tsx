import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, type ApiUser } from "../lib/api";

export type UserSession = {
  token: string;
  user: ApiUser;
};

type UserContextValue = {
  session: UserSession | null;
  isAuthenticated: boolean;
  signIn: (params: { username: string; password: string }) => Promise<void>;
  signOut: () => void;
  token: string | null;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);
const STORAGE_KEY = "assurmoi.session.v1";

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within <UserProvider />");
  return ctx;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        setSession(JSON.parse(raw) as UserSession);
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    })();
  }, []);

  const value = useMemo<UserContextValue>(() => {
    return {
      session,
      isAuthenticated: Boolean(session?.token),
      token: session?.token ?? null,
      async signIn({ username, password }) {
        const res = await api.login(username, password);
        if (!res.token || !res.user) throw new Error(res.message || "Login failed");
        const next: UserSession = { token: res.token, user: res.user };
        setSession(next);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
      signOut() {
        setSession(null);
        void AsyncStorage.removeItem(STORAGE_KEY);
      },
    };
  }, [session]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

