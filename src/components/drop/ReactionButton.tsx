"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SmilePlus } from "lucide-react";
import {
  getFirestore,
  doc,
  runTransaction,
  onSnapshot,
  deleteField,
} from "firebase/firestore";
import { app, auth } from "@/utils/firebaseClient";
import { useAuthState } from "react-firebase-hooks/auth";

const db = getFirestore(app);

export const EMOJIS = [
  { emoji: "❤️",  label: "Love",    key: "heart"   },
  { emoji: "😂",  label: "Haha",    key: "haha"    },
  { emoji: "🔥",  label: "Fire",    key: "fire"    },
  { emoji: "😮",  label: "Wow",     key: "wow"     },
  { emoji: "👏",  label: "Clap",    key: "clap"    },
  { emoji: "😢",  label: "Sad",     key: "sad"     },
  { emoji: "😡",  label: "Angry",   key: "angry"   },
  { emoji: "💯",  label: "100",     key: "hundred" },
] as const;

export type EmojiKey = (typeof EMOJIS)[number]["key"];

type ReactionsMap = Record<EmojiKey, { count: number; reacted: boolean }>;

function emptyReactions(): ReactionsMap {
  return Object.fromEntries(
    EMOJIS.map(({ key }) => [key, { count: 0, reacted: false }])
  ) as ReactionsMap;
}

function useLongPress(
  onLongPress: () => void,
  onClick: () => void,
  delay = 420
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (e.type === "touchstart") e.preventDefault();
      fired.current = false;
      timer.current = setTimeout(() => {
        fired.current = true;
        onLongPress();
      }, delay);
    },
    [onLongPress, delay]
  );

  const end = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!fired.current) onClick();
  }, [onClick]);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: end,
    onTouchCancel: cancel,
  };
}

interface ReactionButtonProps {
  postId: string;
  collectionName: string;
}

export const ReactionButton: React.FC<ReactionButtonProps> = ({
  postId,
  collectionName,
}) => {
  const [user] = useAuthState(auth);
  const [reactions, setReactions] = useState<ReactionsMap>(emptyReactions);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [floatingEmoji, setFloatingEmoji] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!postId || !collectionName) return;
    const dropRef = doc(db, collectionName, postId);
    const unsubscribe = onSnapshot(dropRef, (snap) => {
        if (!snap.exists()) {
            setReactions(emptyReactions());
            return;
        }
        const data = snap.data();
        const newReactions = emptyReactions();
        EMOJIS.forEach(({ key }) => {
            const reactionMap = data[`reaction_${key}`] as Record<string, boolean> | undefined;
            if (reactionMap) {
                const count = Object.keys(reactionMap).length;
                const reacted = user ? !!reactionMap[user.uid] : false;
                newReactions[key] = { count, reacted };
            }
        });
        setReactions(newReactions);
    });
    return () => unsubscribe();
  }, [postId, collectionName, user]);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const handleEmojiSelect = async (key: EmojiKey, emoji: string) => {
    if (!user) { alert("Please log in to react."); return; }
    
    setIsSubmitting(true);
    setIsPickerOpen(false);
    setFloatingEmoji(emoji);
    setTimeout(() => setFloatingEmoji(null), 700);

    const originalReactions = reactions;
    const myReactionKey = EMOJIS.find(({ key }) => originalReactions[key].reacted)?.key;

    // Optimistic update
    const newOptimisticReactions = JSON.parse(JSON.stringify(originalReactions));
    if (myReactionKey) {
        newOptimisticReactions[myReactionKey].count -= 1;
        newOptimisticReactions[myReactionKey].reacted = false;
    }
    if (myReactionKey !== key) {
        newOptimisticReactions[key].count += 1;
        newOptimisticReactions[key].reacted = true;
    }
    setReactions(newOptimisticReactions);
    
    const dropRef = doc(db, collectionName, postId);
    try {
      await runTransaction(db, async (transaction) => {
        const dropSnap = await transaction.get(dropRef);
        if (!dropSnap.exists()) { throw new Error("Drop does not exist!"); }

        const data = dropSnap.data();
        const updates: Record<string, any> = {};
        let alreadyReactedWith: EmojiKey | null = null;

        for (const emojiInfo of EMOJIS) {
            const reactionMap = data[`reaction_${emojiInfo.key}`];
            if (reactionMap && reactionMap[user.uid]) {
                alreadyReactedWith = emojiInfo.key;
                updates[`reaction_${emojiInfo.key}.${user.uid}`] = deleteField();
                break; 
            }
        }

        if (alreadyReactedWith !== key) {
            updates[`reaction_${key}.${user.uid}`] = true;
        }

        transaction.update(dropRef, updates);
      });
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
      setReactions(originalReactions); // Rollback on failure
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClick = () => setIsPickerOpen((v) => !v);
  const handleLongPress = () => setIsPickerOpen(true);
  const lpHandlers = useLongPress(handleLongPress, handleClick);

  const onMouseEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setIsPickerOpen(true);
  };
  const onMouseLeave = () => {
    hoverTimer.current = setTimeout(() => setIsPickerOpen(false), 220);
  };

  const totalCount = EMOJIS.reduce((s, { key }) => s + reactions[key].count, 0);
  const topEmojis = EMOJIS.filter(({ key }) => reactions[key].count > 0)
    .sort((a, b) => reactions[b.key].count - reactions[a.key].count)
    .slice(0, 3);
  const myReaction = EMOJIS.find(({ key }) => reactions[key].reacted);

  const fmtCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        {...lpHandlers}
        disabled={isSubmitting}
        aria-label="React to post"
        aria-expanded={isPickerOpen}
        className={[
          "group relative flex items-center gap-1.5 px-3 py-1.5",
          "rounded-full border text-sm font-medium",
          "select-none touch-manipulation outline-none",
          "transition-all duration-150 active:scale-95",
          myReaction
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-border/80",
          "disabled:pointer-events-none disabled:opacity-50",
        ].join(" ")}
      >
        <span className="flex items-center -space-x-1">
          {topEmojis.length > 0
            ? topEmojis.map(({ emoji, key }) => (
                <span key={key} className="text-base leading-none">
                  {emoji}
                </span>
              ))
            : (
              <SmilePlus className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            )}
        </span>

        {totalCount > 0 && (
          <span className="tabular-nums leading-none">{fmtCount(totalCount)}</span>
        )}

        {myReaction && (
          <span className="absolute inset-0 rounded-full animate-ping bg-primary opacity-10 pointer-events-none" />
        )}
      </button>

      <AnimatePresence>
        {floatingEmoji && (
          <motion.span
            key="float"
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full text-2xl z-50"
            initial={{ opacity: 1, y: 0, scale: 0.6 }}
            animate={{ opacity: 0, y: -44, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            {floatingEmoji}
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPickerOpen && (
          <motion.div
            key="picker"
            className={[
              "absolute z-50 bottom-full mb-2",
              "left-1/2 -translate-x-1/2",
              "sm:left-0 sm:translate-x-0",
            ].join(" ")}
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            onMouseEnter={() => {
              if (hoverTimer.current) clearTimeout(hoverTimer.current);
            }}
            onMouseLeave={onMouseLeave}
          >
            <div
              className={[
                "flex items-end gap-0.5 p-1.5 rounded-2xl",
                "bg-popover border border-border/60",
                "shadow-2xl shadow-black/15 dark:shadow-black/50",
                "backdrop-blur-sm",
              ].join(" ")}
            >
              {EMOJIS.map(({ emoji, key, label }, i) => {
                const { count, reacted } = reactions[key];
                return (
                  <motion.button
                    key={key}
                    onClick={() => handleEmojiSelect(key, emoji)}
                    disabled={isSubmitting}
                    aria-label={`${label}${count > 0 ? ` · ${count}` : ""}`}
                    title={label}
                    initial={{ opacity: 0, y: 14, scale: 0.4 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: i * 0.028,
                      type: "spring",
                      stiffness: 420,
                      damping: 20,
                    }}
                    whileHover={{ scale: 1.4, y: -7 }}
                    whileTap={{ scale: 0.85 }}
                    className={[
                      "relative flex flex-col items-center gap-0.5",
                      "px-2 pt-2 pb-1.5 rounded-xl",
                      "text-xl leading-none",
                      "outline-none touch-manipulation select-none",
                      "transition-colors duration-100",
                      reacted
                        ? "bg-primary/15 ring-1 ring-primary/30"
                        : "hover:bg-muted/60",
                      "disabled:pointer-events-none",
                    ].join(" ")}
                  >
                    <span>{emoji}</span>
                    {count > 0 && (
                      <span
                        className={[
                          "text-[10px] font-semibold tabular-nums leading-none",
                          reacted ? "text-primary" : "text-muted-foreground",
                        ].join(" ")}
                      >
                        {fmtCount(count)}
                      </span>
                    )}
                    {reacted && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex justify-center sm:justify-start sm:pl-5 -mt-px">
              <div
                className="w-2.5 h-2.5 rotate-45 bg-popover border-r border-b border-border/60"
                style={{ marginTop: -6 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};