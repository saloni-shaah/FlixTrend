"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { Clipboard, Swords, Users } from "lucide-react";
import { db } from "@/utils/firebaseClient";
import { useAuth } from "@/context/AuthContext";

export type OnlineGameId = "chess" | "tic-tac-toe" | "snakes-and-ladders";
export type OnlinePlayer = { uid: string; name: string };
export type OnlineRoom<T> = {
  id: string;
  gameId: OnlineGameId;
  code: string;
  host: OnlinePlayer;
  guest: OnlinePlayer | null;
  state: T;
  turnUid: string;
  status: "waiting" | "active" | "finished";
  winnerUid: string | null;
};

const ROOM_COLLECTION = "online_game_rooms";
const ROOM_KEY = "flixtrend.online-game.";
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, byte => CODE_CHARS[byte % CODE_CHARS.length]).join("");
}

function playerName(displayName: string | null, email: string | null) {
  return (displayName || email?.split("@")[0] || "Player").slice(0, 32);
}

function parseRoom<T>(id: string, value: Record<string, unknown>): OnlineRoom<T> | null {
  if (typeof value.code !== "string" || typeof value.gameId !== "string" ||
    typeof value.turnUid !== "string" || typeof value.status !== "string" ||
    !value.host || typeof value.host !== "object" ||
    typeof (value.host as Record<string, unknown>).uid !== "string" ||
    typeof (value.host as Record<string, unknown>).name !== "string" ||
    !value.state || typeof value.state !== "object") return null;
  const guest = value.guest;
  if (guest !== null && (!guest || typeof guest !== "object" ||
    typeof (guest as Record<string, unknown>).uid !== "string" ||
    typeof (guest as Record<string, unknown>).name !== "string")) return null;
  if (value.status !== "waiting" && value.status !== "active" && value.status !== "finished") return null;
  return {
    id, gameId: value.gameId as OnlineGameId, code: value.code,
    host: value.host as OnlinePlayer, guest: guest as OnlinePlayer | null,
    state: value.state as T, turnUid: value.turnUid, status: value.status,
    winnerUid: typeof value.winnerUid === "string" ? value.winnerUid : null,
  };
}

export function useOnlineMatch<T>(gameId: OnlineGameId, initialState: T) {
  const { user, loading: authLoading } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<OnlineRoom<T> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ROOM_KEY + gameId);
      if (saved && /^[A-Z2-9]{6}$/.test(saved)) setRoomId(saved);
    } catch (cause) {
      console.error("Could not restore your online game.", cause);
      setError("This browser could not restore your saved match.");
    }
  }, [gameId]);

  useEffect(() => {
    if (!user || !roomId) {
      setRoom(null);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, ROOM_COLLECTION, roomId), snapshot => {
      if (!snapshot.exists()) {
        setRoom(null);
        setError("This room no longer exists.");
        return;
      }
      const parsed = parseRoom<T>(snapshot.id, snapshot.data());
      if (!parsed || parsed.gameId !== gameId) {
        setError("This room contains an invalid game state.");
        return;
      }
      setRoom(parsed);
      setError("");
    }, cause => {
      console.error("Could not follow the online game.", cause);
      setError("Could not connect to this match. Check your connection and Firestore access.");
    });
    return unsubscribe;
  }, [gameId, roomId, user]);

  const createRoom = useCallback(async () => {
    if (!user) {
      setError("Sign in to create an online match.");
      return;
    }
    setBusy(true);
    setError("");
    const host = { uid: user.uid, name: playerName(user.displayName, user.email) };
    try {
      let createdCode = "";
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = createCode();
        const reference = doc(db, ROOM_COLLECTION, code);
        const madeRoom = await runTransaction(db, async transaction => {
          if ((await transaction.get(reference)).exists()) return false;
          transaction.set(reference, {
            gameId, code, host, guest: null, state: initialState,
            turnUid: user.uid, status: "waiting", winnerUid: null,
            createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
          });
          return true;
        });
        if (madeRoom) {
          createdCode = code;
          break;
        }
      }
      if (!createdCode) throw new Error("Could not reserve a unique invite code. Try again.");
      setRoomId(createdCode);
      try {
        localStorage.setItem(ROOM_KEY + gameId, createdCode);
      } catch (cause) {
        console.error("Could not save the room code on this device.", cause);
        setError("The room is ready, but this device could not save its invite code.");
      }
    } catch (cause) {
      console.error("Could not create the online game.", cause);
      setError(cause instanceof Error ? cause.message : "Could not create the online game.");
    } finally {
      setBusy(false);
    }
  }, [gameId, initialState, user]);

  const joinRoom = useCallback(async (rawCode: string) => {
    if (!user) {
      setError("Sign in to join an online match.");
      return;
    }
    const code = rawCode.trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(code)) {
      setError("Enter the six-character invite code.");
      return;
    }
    setBusy(true);
    setError("");
    const reference = doc(db, ROOM_COLLECTION, code);
    try {
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists()) throw new Error("That room was not found. Check the invite code.");
        const existing = snapshot.data();
        if (existing.gameId !== gameId) throw new Error("That invite code belongs to a different game.");
        if (existing.host?.uid === user.uid) throw new Error("You cannot join your own room on the same account.");
        if (existing.status !== "waiting" || existing.guest !== null) throw new Error("That room is already full or the game has started.");
        transaction.update(reference, {
          guest: { uid: user.uid, name: playerName(user.displayName, user.email) },
          status: "active",
          updatedAt: serverTimestamp(),
        });
      });
      setRoomId(code);
      try {
        localStorage.setItem(ROOM_KEY + gameId, code);
      } catch (cause) {
        console.error("Could not save the room code on this device.", cause);
        setError("You joined the room, but this device could not save its invite code.");
      }
    } catch (cause) {
      console.error("Could not join the online game.", cause);
      setError(cause instanceof Error ? cause.message : "Could not join the online game.");
    } finally {
      setBusy(false);
    }
  }, [gameId, user]);

  const play = useCallback(async (state: T, nextTurnUid: string, winnerUid: string | null = null, finished = false) => {
    if (!user || !room) return false;
    setError("");
    try {
      await runTransaction(db, async transaction => {
        const reference = doc(db, ROOM_COLLECTION, room.id);
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists()) throw new Error("The room was closed.");
        const latest = snapshot.data();
        if (latest.status !== "active" || latest.turnUid !== user.uid) throw new Error("It is not your turn.");
        const guestUid = (latest.guest as OnlinePlayer | null)?.uid;
        if (nextTurnUid !== latest.host.uid && nextTurnUid !== guestUid) throw new Error("Invalid next player.");
        if (winnerUid && winnerUid !== latest.host.uid && winnerUid !== guestUid) throw new Error("Invalid winner.");
        transaction.update(reference, {
          state,
          turnUid: nextTurnUid,
          status: finished ? "finished" : "active",
          winnerUid,
          updatedAt: serverTimestamp(),
        });
      });
      return true;
    } catch (cause) {
      console.error("Could not save your online move.", cause);
      setError(cause instanceof Error ? cause.message : "Could not save your online move.");
      return false;
    }
  }, [room, user]);

  const resign = useCallback(async () => {
    if (!user || !room?.guest) return;
    try {
      await runTransaction(db, async transaction => {
        const reference = doc(db, ROOM_COLLECTION, room.id);
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists() || snapshot.data().status !== "active") throw new Error("This game is no longer active.");
        const current = snapshot.data();
        if (user.uid !== current.host.uid && user.uid !== current.guest?.uid) throw new Error("You are not a player in this match.");
        transaction.update(reference, {
          status: "finished",
          winnerUid: user.uid === current.host.uid ? current.guest.uid : current.host.uid,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (cause) {
      console.error("Could not resign from the online game.", cause);
      setError(cause instanceof Error ? cause.message : "Could not resign from the online game.");
    }
  }, [room, user]);

  const leaveRoom = useCallback(() => {
    let storageError = false;
    try {
      localStorage.removeItem(ROOM_KEY + gameId);
    } catch (cause) {
      console.error("Could not forget this room.", cause);
      storageError = true;
    }
    setRoom(null);
    setRoomId(null);
    setError(storageError ? "Could not forget this room on this device." : "");
  }, [gameId]);

  return { user, authLoading, room, error, busy, createRoom, joinRoom, play, resign, leaveRoom, clearError: () => setError("") };
}

export function OnlineMatchPanel<T>({
  room, userId, busy, error, createRoom, joinRoom, leaveRoom, resign,
}: {
  room: OnlineRoom<T> | null;
  userId: string | undefined;
  busy: boolean;
  error: string;
  createRoom: () => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: () => void;
  resign: () => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const copyInviteCode = async () => {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.code);
      setCopyMessage("Invite code copied.");
    } catch (cause) {
      console.error("Could not copy the online match invite code.", cause);
      setCopyMessage("Copy the invite code above to share it.");
    }
  };

  return (
    <section className="w-full rounded-2xl border border-violet-300/15 bg-violet-400/[.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-bold text-violet-200"><Users size={17} /> Online match</h3>
        {room?.status === "active" && <button onClick={resign} className="text-xs text-gray-400 transition-colors hover:text-rose-300">Resign</button>}
        {room && <button onClick={leaveRoom} className="text-xs text-gray-400 transition-colors hover:text-white">Leave room</button>}
      </div>
      {!userId ? (
        <p className="mt-2 text-sm text-gray-400">Sign in to create a room or join a friend using an invite code.</p>
      ) : room ? (
        <div className="mt-3 space-y-2 text-sm text-gray-300">
          <p className="flex flex-wrap items-center gap-2">Invite code <span className="rounded-md border border-white/15 bg-black/25 px-2 py-1 font-mono font-bold tracking-[.2em] text-accent-cyan">{room.code}</span>
            <button onClick={() => void copyInviteCode()} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white"><Clipboard size={13} /> Copy</button>
          </p>
          {copyMessage && <p role="status" className="text-xs text-gray-400">{copyMessage}</p>}
          <p className="text-gray-400">{room.host.name} {room.guest ? `vs ${room.guest.name}` : "· Waiting for a friend to join…"}</p>
          {room.status === "active" && <p className="text-xs text-gray-500">Share the code with your opponent. Moves sync live across both devices.</p>}
          {room.status === "finished" && <p role="status" className="font-semibold text-amber-200">{room.winnerUid ? `${room.winnerUid === userId ? "You won!" : `${room.winnerUid === room.host.uid ? room.host.name : room.guest?.name} won!`}` : "Game drawn."}</p>}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={createRoom} disabled={busy} className="btn-glass flex items-center gap-2 border-violet-300/25 text-violet-100 disabled:opacity-50">
            <Swords size={15} /> Create room
          </button>
          <form onSubmit={event => { event.preventDefault(); void joinRoom(code); }} className="flex min-w-0 flex-1 gap-2">
            <input value={code} onChange={event => setCode(event.target.value.toUpperCase().slice(0, 6))} aria-label="Room invite code" placeholder="6-digit code" autoComplete="off" spellCheck={false}
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/25 px-3 font-mono tracking-[.15em] text-white placeholder:font-sans placeholder:tracking-normal" />
            <button type="submit" disabled={busy || code.length !== 6} className="btn-glass border-violet-300/25 text-violet-100 disabled:opacity-50">Join</button>
          </form>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-rose-300">{error}</p>}
    </section>
  );
}
