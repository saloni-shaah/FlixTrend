"use client";

import Image from "next/image";
import Link from "next/link";
import React, { memo, useMemo, useState } from "react";
import { Eye, Play, Star } from "lucide-react";

type ProfileFlowCardProps = {
  post: any;
  userId: string;
  sortBy: string;
};

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getMediaUrl = (value: any): string => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};

const formatCompactNumber = (value: any): string => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0";

  if (number >= 1_000_000) {
    const formatted = Math.floor((number / 1_000_000) * 10) / 10;
    return `${formatted.toString().replace(/\.0$/, "")}M`;
  }

  if (number >= 1_000) {
    const formatted = Math.floor((number / 1_000) * 10) / 10;
    return `${formatted.toString().replace(/\.0$/, "")}K`;
  }

  return number.toLocaleString();
};

const formatDuration = (value: any): string => {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return "";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const getFlowHeat = (views: number, likes: number, publishedAt: Date | null) => {
  const ageInDays = publishedAt
    ? Math.max(0, (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24))
    : 30;
  const recencyBoost = Math.max(0, 7 - ageInDays) * 90;
  const score = views * 0.12 + likes * 1.8 + recencyBoost;

  if (score >= 3500) {
    return {
      width: "w-full",
      className: "bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-500 shadow-[0_0_18px_rgba(34,211,238,0.65)]",
    };
  }

  if (score >= 700) {
    return {
      width: "w-2/3",
      className: "bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.45)]",
    };
  }

  return {
    width: "w-1/3",
    className: "bg-zinc-500/80",
  };
};

function FlowPlaceholder() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.22),transparent_32%),linear-gradient(135deg,rgba(39,39,42,0.95),rgba(9,9,11,1))]">
      <div className="absolute inset-0 animate-pulse bg-white/[0.03]" />
      <div className="relative grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-black/35 text-white shadow-2xl backdrop-blur">
        <Play className="ml-0.5 h-6 w-6 fill-white" aria-hidden="true" />
      </div>
    </div>
  );
}

function FlowOverlay({
  title,
  views,
  likes,
  duration,
  isRecent,
  publishedAt,
}: {
  title: string;
  views: number;
  likes: number;
  duration: string;
  isRecent: boolean;
  publishedAt: Date | null;
}) {
  const heat = getFlowHeat(views, likes, publishedAt);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/75 via-black/25 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

      <div className="absolute left-2.5 right-2.5 top-2.5 flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-cyan-200/40 bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100 shadow-lg backdrop-blur">
            Flow
          </span>
          {isRecent ? (
            <span className="rounded-full border border-white/20 bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-950 shadow-lg">
              New
            </span>
          ) : null}
        </div>
        {duration ? (
          <span className="rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white shadow-lg backdrop-blur">
            {duration}
          </span>
        ) : null}
      </div>

      <div className="absolute inset-x-2.5 bottom-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow">{title}</h3>
        <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-white/90">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {formatCompactNumber(views)}
          </span>
          <span className="text-white/45">•</span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-white/90" aria-hidden="true" />
            {formatCompactNumber(likes)}
          </span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-black/45">
        <div className={`h-full rounded-r-full ${heat.width} ${heat.className}`} />
      </div>
    </>
  );
}

function ProfileFlowCardComponent({ post, userId, sortBy }: ProfileFlowCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const mediaUrl = getMediaUrl(post.mediaUrl);
  const thumbnail = post.thumbnailUrl || post.thumbnail || post.posterUrl || "";
  const title = post.content || post.description || post.title || "Untitled Flow";
  const publishedAt = toDate(post.publishAt || post.createdAt);
  const views = Number(post.viewCount || post.views || 0);
  const likes = Number(post.likesCount || post.likes || post.starCount || 0);
  const duration = formatDuration(post.duration || post.durationSeconds || post.videoDuration);
  const href = `/flow/${post.id}?userId=${encodeURIComponent(userId)}&sort=${encodeURIComponent(sortBy)}`;

  const isRecent = useMemo(() => {
    if (!publishedAt) return false;
    const ageInDays = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays >= 0 && ageInDays < 7;
  }, [publishedAt]);

  const shouldPreview = Boolean(mediaUrl && isHovering);

  return (
    <Link
      href={href}
      aria-label={`Watch Flow post: ${title}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
      className="group relative block aspect-[9/16] w-full cursor-pointer overflow-hidden rounded-xl bg-zinc-950 shadow-lg shadow-black/20 outline-none ring-1 ring-white/10 transition duration-300 ease-out will-change-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-950/40 focus-visible:ring-2 focus-visible:ring-cyan-300"
    >
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition duration-300 ease-out will-change-transform ${
            shouldPreview ? "opacity-0" : "opacity-100"
          } group-hover:scale-[1.04]`}
          loading="lazy"
        />
      ) : (
        <FlowPlaceholder />
      )}

      {shouldPreview ? (
        <video
          src={mediaUrl}
          poster={thumbnail || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover opacity-100 transition duration-300 ease-out will-change-transform group-hover:scale-[1.04]"
        />
      ) : null}

      <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/10" />
      <div className="absolute inset-0 grid place-items-center opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-black/40 text-white shadow-xl backdrop-blur">
          <Play className="ml-0.5 h-6 w-6 fill-white" aria-hidden="true" />
        </div>
      </div>

      <div
        className={`pointer-events-none absolute inset-0 rounded-xl bg-cyan-300/15 transition duration-300 ${
          isPressed ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      />

      <FlowOverlay
        title={title}
        views={views}
        likes={likes}
        duration={duration}
        isRecent={isRecent}
        publishedAt={publishedAt}
      />
    </Link>
  );
}

export const ProfileFlowCard = memo(ProfileFlowCardComponent);
