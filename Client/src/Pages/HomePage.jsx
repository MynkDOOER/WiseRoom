import { useEffect, useState } from "react";
import { UserButton, useAuth } from "@clerk/clerk-react";
import { syncUser } from "../api/users";

export default function HomePage() {
  const { getToken, userId } = useAuth();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function prepareAccount() {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        if (!token) throw new Error("Your session expired. Please sign in again.");

        const user = await syncUser(token, controller.signal);
        if (!controller.signal.aborted) setResult({ userId, user });
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({
            userId,
            error: error instanceof TypeError
              ? "Cannot reach the server. Check that it is running and try again."
              : error.message,
          });
        }
      }
    }

    prepareAccount();
    return () => controller.abort();
  }, [getToken, userId, attempt]);

  // Never show another account's name while the active Clerk user changes.
  const current = result?.userId === userId ? result : null;

  function retry() {
    setResult(null);
    setAttempt(value => value + 1);
  }

  return (
    <main style={{ maxWidth: "720px", margin: "60px auto", padding: "24px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>WiseRoom</h1>
        <UserButton />
      </header>
      {current?.error ? (
        <div role="alert">
          <p>{current.error}</p>
          <button onClick={retry}>Try again</button>
        </div>
      ) : current?.user ? (
        <>
          <h2>Welcome{current.user.displayName ? `, ${current.user.displayName}` : ""}!</h2>
          <p>Your account is ready. Rooms and chat are coming next.</p>
        </>
      ) : (
        <p role="status">Preparing your account…</p>
      )}
    </main>
  );
}
