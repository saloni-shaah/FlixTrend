"use client";

import { useEffect, useState } from "react";
import { collection, doc, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from "firebase/firestore";
import { CloudUpload, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/utils/firebaseClient";

type ScoreEntry = { userId: string; username: string; score: number };

export function ScoreLeaderboard({
  gameId, score, canPost, scoreLabel = "points",
}: { gameId: string; score: number; canPost: boolean; scoreLabel?: string }) {
  const { user } = useAuth();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [postedBest, setPostedBest] = useState<number | null>(null);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const scoresQuery = query(
      collection(db, "game_leaderboards", gameId, "scores"),
      orderBy("score", "desc"),
      limit(10),
    );
    return onSnapshot(scoresQuery, snapshot => {
      setScores(snapshot.docs.flatMap(entry => {
        const data = entry.data();
        if (typeof data.userId !== "string" || typeof data.username !== "string" || typeof data.score !== "number") return [];
        return [{ userId: data.userId, username: data.username, score: data.score }];
      }));
    }, error => {
      console.error(`Could not load the ${gameId} leaderboard.`, error);
      setMessage("Leaderboard unavailable. Check your connection and try again.");
    });
  }, [gameId]);

  useEffect(() => {
    if (!user) {
      setPostedBest(null);
      return;
    }
    return onSnapshot(doc(db, "game_leaderboards", gameId, "scores", user.uid), snapshot => {
      const value = snapshot.data()?.score;
      setPostedBest(typeof value === "number" ? value : null);
    }, error => {
      console.error(`Could not load your ${gameId} leaderboard score.`, error);
      setMessage("Could not load your posted best score.");
    });
  }, [gameId, user]);

  const postScore = async () => {
    if (!user || !Number.isSafeInteger(score) || score < 0) {
      setMessage(user ? "That score is invalid and cannot be posted." : "Sign in to post your score.");
      return;
    }
    setPosting(true);
    setMessage("");
    try {
      const scoreRef = doc(db, "game_leaderboards", gameId, "scores", user.uid);
      const isNewBest = await runTransaction(db, async transaction => {
        const existing = await transaction.get(scoreRef);
        const previousBest = existing.data()?.score;
        if (typeof previousBest === "number" && previousBest >= score) return false;
        transaction.set(scoreRef, {
          userId: user.uid,
          username: (user.displayName || user.email?.split("@")[0] || "Player").slice(0, 32),
          score,
          updatedAt: serverTimestamp(),
        });
        return true;
      });
      setMessage(isNewBest ? "Your best score is on the leaderboard!"
        : `Your posted best is already ${(postedBest ?? score).toLocaleString()} ${scoreLabel}.`);
    } catch (error) {
      console.error(`Could not post the ${gameId} high score.`, error);
      setMessage("Could not post your score. Sign in and check your connection.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="w-full rounded-2xl border border-amber-300/15 bg-amber-300/[.045] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-bold text-amber-200"><Trophy size={17} /> Global leaderboard</h3>
        {canPost && <button onClick={() => void postScore()} disabled={posting || !user}
          className="btn-glass flex items-center gap-2 border-amber-300/20 text-amber-100 disabled:cursor-not-allowed disabled:opacity-45">
          <CloudUpload size={15} /> {posting ? "Posting…" : "Post my best"}
        </button>}
      </div>
      {canPost && !user && <p className="mt-2 text-xs text-gray-400">Sign in to post your highest score. Your personal best is saved on this device too.</p>}
      {canPost && postedBest !== null && <p className="mt-2 text-xs text-gray-400">Your online best: <span className="font-bold text-amber-200">{postedBest.toLocaleString()} {scoreLabel}</span></p>}
      {message && <p role="status" className="mt-2 text-xs text-gray-300">{message}</p>}
      <ol className="mt-3 space-y-1.5">
        {scores.length ? scores.map((entry, index) => (
          <li key={entry.userId} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-gray-300"><span className="mr-2 text-xs text-gray-500">#{index + 1}</span>{entry.username}{entry.userId === user?.uid && <span className="ml-1 text-xs text-accent-cyan">(you)</span>}</span>
            <span className="shrink-0 font-bold text-amber-200">{entry.score.toLocaleString()} <span className="text-xs font-normal text-gray-400">{scoreLabel}</span></span>
          </li>
        )) : <li className="py-1 text-xs text-gray-500">No scores posted yet. Set the first record!</li>}
      </ol>
    </section>
  );
}
