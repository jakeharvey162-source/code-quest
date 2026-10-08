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
    let recoveryIntent =
      new URLSearchParams(location.search).get("auth") === "recovery";
    const timeout = window.setTimeout(() => {
      if (!active || events) return;
      setDataOwner(null);
      setState({
        user: null,
        recovery: false,
        ready: true,
        error:
          "The account connection timed out. Guest learning is available; your account profile remains saved separately.",
      });
    }, 8000);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      window.clearTimeout(timeout);
      if (event === "USER_UPDATED" || event === "SIGNED_OUT") {
        recoveryIntent = false;
        const url = new URL(location.href);
        url.searchParams.delete("auth");
        history.replaceState(null, "", url);
      }
      events++;
      setDataOwner(session?.user.id || null);
      setState((previous) => ({
        user: session?.user || null,
        ready: true,
        error: "",
        recovery:
          event === "PASSWORD_RECOVERY" ||
          (event !== "SIGNED_OUT" &&
            event !== "USER_UPDATED" &&
            (previous.recovery || (!!session && recoveryIntent))),
      }));
      if (event === "PASSWORD_RECOVERY") location.hash = "account";
    });
    const observed = events;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || observed !== events) return;
        window.clearTimeout(timeout);
        setDataOwner(data.session?.user.id || null);
        setState({
          user: data.session?.user || null,
          ready: true,
          recovery: !!data.session && recoveryIntent,
          error: error?.message || "",
        });
      })
      .catch(() => {
        if (!active || observed !== events) return;
        window.clearTimeout(timeout);
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
      window.clearTimeout(timeout);
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
