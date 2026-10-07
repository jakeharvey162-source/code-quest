import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { setDataOwner } from "../lib/local-data";
const AuthContext = createContext<{
  user: User | null;
  recovery: boolean;
  error: string;
}>({ user: null, recovery: false, error: "" });
export const useAuth = () => useContext(AuthContext);
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({
    user: null as User | null,
    recovery: false,
    error: "",
    ready: !supabase,
  });
  useEffect(() => {
    if (!supabase) {
      setDataOwner(null);
      return;
    }
    let active = true,
      events = 0;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      events++;
      setDataOwner(session?.user.id || null);
      setState((previous) => ({
        user: session?.user || null,
        ready: true,
        error: "",
        recovery:
          event === "PASSWORD_RECOVERY" ||
          (event !== "SIGNED_OUT" && previous.recovery),
      }));
      if (event === "PASSWORD_RECOVERY") location.hash = "account";
    });
    const observed = events;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || observed !== events) return;
        setDataOwner(data.session?.user.id || null);
        setState({
          user: data.session?.user || null,
          ready: true,
          recovery: false,
          error: error?.message || "",
        });
      })
      .catch(() => {
        if (!active || observed !== events) return;
        setDataOwner(null);
        setState({
          user: null,
          ready: true,
          recovery: false,
          error: "Account service could not load. Local learning is available.",
        });
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  if (!state.ready)
    return (
      <section className="page" role="status">
        Opening your learning profile…
      </section>
    );
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
