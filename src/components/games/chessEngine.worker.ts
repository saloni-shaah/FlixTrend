import { Chess, type Move } from "chess.js";

type SearchRequest = { fen: string; moves: string[]; strength: "casual" | "club" | "expert" };
type SearchResult = { type: "info"; depth: number; nodes: number } | {
  type: "bestmove"; from: string; to: string; promotion?: string; depth: number; nodes: number;
} | { type: "error"; message: string };
type TableEntry = { depth: number; score: number; flag: "exact" | "lower" | "upper"; move: string };

const VALUES: Record<string, number> = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 20_000 };
const MATE = 100_000;
const INF = 110_000;
class SearchLimitReached extends Error {}

function evaluate(chess: Chess) {
  const board = chess.board();
  const pieceCount = board.flat().filter(Boolean).length;
  let score = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      const sign = piece.color === "w" ? 1 : -1;
      const advancement = piece.color === "w" ? 6 - row : row - 1;
      const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
      const center = Math.round((7 - centerDistance) * 4);
      let positional = center;
      if (piece.type === "p") positional += advancement * 9;
      if (piece.type === "n") positional += center * 2;
      if (piece.type === "b") positional += center;
      if (piece.type === "k" && pieceCount > 20) positional -= center * 2;
      score += sign * (VALUES[piece.type] + positional);
    }
  }
  return chess.turn() === "w" ? score : -score;
}

function moveKey(move: Move) {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

function orderedMoves(chess: Chess, preferred: string | undefined) {
  return (chess.moves({ verbose: true }) as Move[]).sort((a, b) => {
    const keyA = moveKey(a); const keyB = moveKey(b);
    if (keyA === preferred) return -1;
    if (keyB === preferred) return 1;
    const score = (move: Move) =>
      (move.captured ? VALUES[move.captured] * 10 - VALUES[move.piece] : 0) +
      (move.promotion ? VALUES[move.promotion] : 0);
    return score(b) - score(a);
  });
}

function searchPosition({ fen, moves, strength }: SearchRequest) {
  const settings = {
    casual: { milliseconds: 280, nodes: 9_000, maxDepth: 8 },
    club: { milliseconds: 1_000, nodes: 45_000, maxDepth: 12 },
    expert: { milliseconds: 3_500, nodes: 180_000, maxDepth: 18 },
  }[strength];
  const chess = new Chess();
  for (const move of moves) chess.move(move);
  if (chess.fen() !== fen) throw new Error("The computer received an invalid position history.");
  const rootMoves = chess.moves({ verbose: true }) as Move[];
  if (!rootMoves.length) throw new Error("The computer cannot move in this position.");

  const table = new Map<string, TableEntry>();
  const deadline = performance.now() + settings.milliseconds;
  let nodes = 0;
  let bestMove = rootMoves[0];
  let completedDepth = 0;

  const checkLimit = () => {
    if (++nodes > settings.nodes || (nodes & 255) === 0 && performance.now() >= deadline) {
      throw new SearchLimitReached();
    }
  };

  const quiescence = (alpha: number, beta: number, ply: number, remaining: number): number => {
    checkLimit();
    if (chess.isCheckmate()) return -MATE + ply;
    if (chess.isDraw()) return 0;
    const inCheck = chess.isCheck();
    const standPat = evaluate(chess);
    if (!inCheck) {
      if (standPat >= beta) return beta;
      if (standPat > alpha) alpha = standPat;
      if (remaining === 0) return alpha;
    } else if (remaining === 0) {
      return standPat;
    }

    const moves = orderedMoves(chess, undefined).filter(move => inCheck || move.isCapture() || move.isPromotion());
    for (const move of moves) {
      chess.move({ from: move.from, to: move.to, promotion: move.promotion });
      const score = -quiescence(-beta, -alpha, ply + 1, remaining - 1);
      chess.undo();
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  };

  const alphaBeta = (depth: number, alpha: number, beta: number, ply: number): number => {
    checkLimit();
    if (chess.isCheckmate()) return -MATE + ply;
    if (chess.isDraw()) return 0;
    if (depth <= 0) return quiescence(alpha, beta, ply, 6);

    const originalAlpha = alpha;
    const hash = chess.hash();
    const cached = table.get(hash);
    if (cached && cached.depth >= depth) {
      if (cached.flag === "exact") return cached.score;
      if (cached.flag === "lower") alpha = Math.max(alpha, cached.score);
      else beta = Math.min(beta, cached.score);
      if (alpha >= beta) return cached.score;
    }

    let bestScore = -INF;
    let bestKey = "";
    const moves = orderedMoves(chess, cached?.move);
    if (!moves.length) return chess.isCheck() ? -MATE + ply : 0;
    for (const move of moves) {
      chess.move({ from: move.from, to: move.to, promotion: move.promotion });
      const score = -alphaBeta(depth - 1, -beta, -alpha, ply + 1);
      chess.undo();
      if (score > bestScore) {
        bestScore = score;
        bestKey = moveKey(move);
      }
      alpha = Math.max(alpha, score);
      if (alpha >= beta) break;
    }
    table.set(hash, {
      depth, score: bestScore,
      flag: bestScore <= originalAlpha ? "upper" : bestScore >= beta ? "lower" : "exact",
      move: bestKey,
    });
    if (table.size > 200_000) table.clear();
    return bestScore;
  };

  const rootHash = chess.hash();
  const rootTableMove = table.get(rootHash)?.move;
  const sortedRoots = orderedMoves(chess, rootTableMove);
  for (let depth = 1; depth <= settings.maxDepth; depth++) {
    let iterationBest: Move | null = null;
    let iterationScore = -INF;
    try {
      for (const move of sortedRoots) {
        checkLimit();
        chess.move({ from: move.from, to: move.to, promotion: move.promotion });
        const score = -alphaBeta(depth - 1, -INF, -iterationScore, 1);
        chess.undo();
        if (score > iterationScore) {
          iterationScore = score;
          iterationBest = move;
        }
      }
      if (iterationBest) bestMove = iterationBest;
      completedDepth = depth;
      postMessage({ type: "info", depth, nodes } satisfies SearchResult);
      if (Math.abs(iterationScore) >= MATE - 20) break;
    } catch (error) {
      if (!(error instanceof SearchLimitReached)) throw error;
      break;
    }
    if (performance.now() >= deadline) break;
  }

  return {
    type: "bestmove" as const,
    from: bestMove.from,
    to: bestMove.to,
    ...(bestMove.promotion ? { promotion: bestMove.promotion } : {}),
    depth: completedDepth,
    nodes,
  };
}

self.onmessage = (event: MessageEvent<SearchRequest>) => {
  try {
    postMessage(searchPosition(event.data));
  } catch (error) {
    postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "The chess engine could not analyze this position.",
    } satisfies SearchResult);
  }
};
