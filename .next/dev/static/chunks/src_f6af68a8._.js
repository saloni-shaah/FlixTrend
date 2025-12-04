(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/games/TicTacToe.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TicTacToe",
    ()=>TicTacToe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle.js [app-client] (ecmascript) <export default as Circle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-client] (ecmascript) <export default as RotateCcw>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const lines = [
    [
        0,
        1,
        2
    ],
    [
        3,
        4,
        5
    ],
    [
        6,
        7,
        8
    ],
    [
        0,
        3,
        6
    ],
    [
        1,
        4,
        7
    ],
    [
        2,
        5,
        8
    ],
    [
        0,
        4,
        8
    ],
    [
        2,
        4,
        6
    ]
];
function calculateWinner(squares) {
    for(let i = 0; i < lines.length; i++){
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return {
                winner: squares[a],
                line: lines[i]
            };
        }
    }
    return null;
}
function Square({ value, onSquareClick, isWinning }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        className: `w-20 h-20 md:w-24 md:h-24 bg-black/20 flex items-center justify-center transition-all duration-300 ${isWinning ? 'bg-brand-gold/30' : 'hover:bg-accent-cyan/10'}`,
        onClick: onSquareClick,
        children: [
            value === 'X' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                className: `w-12 h-12 transition-colors ${isWinning ? 'text-white' : 'text-accent-pink'}`
            }, void 0, false, {
                fileName: "[project]/src/components/games/TicTacToe.tsx",
                lineNumber: 29,
                columnNumber: 27
            }, this),
            value === 'O' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__["Circle"], {
                className: `w-12 h-12 transition-colors ${isWinning ? 'text-white' : 'text-accent-cyan'}`
            }, void 0, false, {
                fileName: "[project]/src/components/games/TicTacToe.tsx",
                lineNumber: 30,
                columnNumber: 27
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/games/TicTacToe.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
_c = Square;
function Board({ squares, onPlay, xIsNext, winningLine }) {
    const winnerInfo = calculateWinner(squares);
    const winner = winnerInfo?.winner;
    let status;
    if (winner) {
        status = 'Winner: ' + winner;
    } else if (squares.every(Boolean)) {
        status = 'Draw!';
    } else {
        status = `Next player: ${xIsNext ? 'X' : 'O'}`;
    }
    function handleClick(i) {
        if (calculateWinner(squares) || squares[i]) {
            return;
        }
        onPlay(i);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-center gap-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `font-bold text-xl transition-colors ${winner ? 'text-brand-gold' : 'text-gray-300'}`,
                children: status
            }, void 0, false, {
                fileName: "[project]/src/components/games/TicTacToe.tsx",
                lineNumber: 57,
                columnNumber: 14
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-3 gap-1 bg-accent-cyan/20 p-1 rounded-lg relative",
                children: [
                    squares.map((square, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Square, {
                            value: square,
                            onSquareClick: ()=>handleClick(i),
                            isWinning: winningLine?.includes(i) || false
                        }, i, false, {
                            fileName: "[project]/src/components/games/TicTacToe.tsx",
                            lineNumber: 60,
                            columnNumber: 21
                        }, this)),
                    winningLine && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "absolute inset-0 w-full h-full pointer-events-none",
                        viewBox: "0 0 100 100",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                            x1: getCoord(winningLine[0]).x,
                            y1: getCoord(winningLine[0]).y,
                            x2: getCoord(winningLine[2]).x,
                            y2: getCoord(winningLine[2]).y,
                            stroke: "var(--brand-gold)",
                            strokeWidth: "2",
                            strokeLinecap: "round"
                        }, void 0, false, {
                            fileName: "[project]/src/components/games/TicTacToe.tsx",
                            lineNumber: 64,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/games/TicTacToe.tsx",
                        lineNumber: 63,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/TicTacToe.tsx",
                lineNumber: 58,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/games/TicTacToe.tsx",
        lineNumber: 56,
        columnNumber: 9
    }, this);
}
_c1 = Board;
function getCoord(index) {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = col * 33.33 + 16.66;
    const y = row * 33.33 + 16.66;
    return {
        x,
        y
    };
}
function OfflineGame() {
    _s();
    const [history, setHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([
        Array(9).fill(null)
    ]);
    const [currentMove, setCurrentMove] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const xIsNext = currentMove % 2 === 0;
    const currentSquares = history[currentMove];
    const winnerInfo = calculateWinner(currentSquares);
    function handlePlay(nextSquares) {
        const nextHistory = [
            ...history.slice(0, currentMove + 1),
            nextSquares
        ];
        setHistory(nextHistory);
        setCurrentMove(nextHistory.length - 1);
    }
    function onSquareClick(i) {
        const nextSquares = currentSquares.slice();
        nextSquares[i] = xIsNext ? 'X' : 'O';
        handlePlay(nextSquares);
    }
    const resetGame = ()=>{
        setHistory([
            Array(9).fill(null)
        ]);
        setCurrentMove(0);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-center gap-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Board, {
                squares: currentSquares,
                onPlay: onSquareClick,
                xIsNext: xIsNext,
                winningLine: winnerInfo?.line || null
            }, void 0, false, {
                fileName: "[project]/src/components/games/TicTacToe.tsx",
                lineNumber: 113,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: resetGame,
                className: "btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                        size: 16
                    }, void 0, false, {
                        fileName: "[project]/src/components/games/TicTacToe.tsx",
                        lineNumber: 115,
                        columnNumber: 17
                    }, this),
                    " Reset Game"
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/TicTacToe.tsx",
                lineNumber: 114,
                columnNumber: 13
            }, this),
            winnerInfo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-2xl font-bold text-brand-gold animate-bounce",
                        children: "✨ Winner! ✨"
                    }, void 0, false, {
                        fileName: "[project]/src/components/games/TicTacToe.tsx",
                        lineNumber: 119,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-300",
                        children: [
                            "Congratulations to Player ",
                            winnerInfo.winner,
                            "!"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/TicTacToe.tsx",
                        lineNumber: 120,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/TicTacToe.tsx",
                lineNumber: 118,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/games/TicTacToe.tsx",
        lineNumber: 112,
        columnNumber: 9
    }, this);
}
_s(OfflineGame, "xZZdy1/aP1agxyjHn6CL01lXnXc=");
_c2 = OfflineGame;
function TicTacToe() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            opacity: 0,
            scale: 0.95
        },
        animate: {
            opacity: 1,
            scale: 1
        },
        className: "w-full max-w-md glass-card p-8 flex flex-col items-center gap-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-3xl font-headline text-accent-pink",
                children: "Tic-Tac-Toe"
            }, void 0, false, {
                fileName: "[project]/src/components/games/TicTacToe.tsx",
                lineNumber: 134,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OfflineGame, {}, void 0, false, {
                fileName: "[project]/src/components/games/TicTacToe.tsx",
                lineNumber: 135,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/games/TicTacToe.tsx",
        lineNumber: 129,
        columnNumber: 9
    }, this);
}
_c3 = TicTacToe;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "Square");
__turbopack_context__.k.register(_c1, "Board");
__turbopack_context__.k.register(_c2, "OfflineGame");
__turbopack_context__.k.register(_c3, "TicTacToe");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/games/Snake.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Snake",
    ()=>Snake
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-client] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-up.js [app-client] (ecmascript) <export default as ArrowUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-down.js [app-client] (ecmascript) <export default as ArrowDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-client] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-right.js [app-client] (ecmascript) <export default as ArrowRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$apple$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Apple$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/apple.js [app-client] (ecmascript) <export default as Apple>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trophy.js [app-client] (ecmascript) <export default as Trophy>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const GRID_SIZE = 20;
const TILE_SIZE = 20; // in pixels
const getRandomCoordinate = (snakeBody)=>{
    let coordinate;
    do {
        coordinate = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    }while (snakeBody.some((segment)=>segment.x === coordinate.x && segment.y === coordinate.y))
    return coordinate;
};
function Snake() {
    _s();
    const [snake, setSnake] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([
        {
            x: 10,
            y: 10
        }
    ]);
    const [food, setFood] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(getRandomCoordinate(snake));
    const [direction, setDirection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('RIGHT');
    const [speed, setSpeed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(200);
    const [gameOver, setGameOver] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [score, setScore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [highScore, setHighScore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const gameLoopRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const touchStartRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Load high score from local storage
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Snake.useEffect": ()=>{
            const storedHighScore = localStorage.getItem('snakeHighScore');
            if (storedHighScore) {
                setHighScore(parseInt(storedHighScore, 10));
            }
        }
    }["Snake.useEffect"], []);
    const changeDirection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Snake.useCallback[changeDirection]": (newDir)=>{
            setDirection({
                "Snake.useCallback[changeDirection]": (currentDir)=>{
                    if (newDir === 'UP' && currentDir !== 'DOWN') return 'UP';
                    if (newDir === 'DOWN' && currentDir !== 'UP') return 'DOWN';
                    if (newDir === 'LEFT' && currentDir !== 'RIGHT') return 'LEFT';
                    if (newDir === 'RIGHT' && currentDir !== 'LEFT') return 'RIGHT';
                    return currentDir;
                }
            }["Snake.useCallback[changeDirection]"]);
        }
    }["Snake.useCallback[changeDirection]"], []);
    const handleKeyDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Snake.useCallback[handleKeyDown]": (e)=>{
            e.preventDefault(); // Prevent page scrolling with arrow keys
            switch(e.key){
                case 'ArrowUp':
                    changeDirection('UP');
                    break;
                case 'ArrowDown':
                    changeDirection('DOWN');
                    break;
                case 'ArrowLeft':
                    changeDirection('LEFT');
                    break;
                case 'ArrowRight':
                    changeDirection('RIGHT');
                    break;
            }
        }
    }["Snake.useCallback[handleKeyDown]"], [
        changeDirection
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Snake.useEffect": ()=>{
            window.addEventListener('keydown', handleKeyDown);
            return ({
                "Snake.useEffect": ()=>window.removeEventListener('keydown', handleKeyDown)
            })["Snake.useEffect"];
        }
    }["Snake.useEffect"], [
        handleKeyDown
    ]);
    const handleTouchStart = (e)=>{
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    };
    const handleTouchEnd = (e)=>{
        if (!touchStartRef.current) return;
        const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 30) changeDirection('RIGHT');
            else if (deltaX < -30) changeDirection('LEFT');
        } else {
            if (deltaY > 30) changeDirection('DOWN');
            else if (deltaY < -30) changeDirection('UP');
        }
        touchStartRef.current = null;
    };
    const resetGame = ()=>{
        setSnake([
            {
                x: 10,
                y: 10
            }
        ]);
        setFood(getRandomCoordinate([
            {
                x: 10,
                y: 10
            }
        ]));
        setDirection('RIGHT');
        setGameOver(false);
        setScore(0);
        setSpeed(200);
    };
    const runGame = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Snake.useCallback[runGame]": ()=>{
            if (gameOver) return;
            setSnake({
                "Snake.useCallback[runGame]": (prevSnake)=>{
                    const newSnake = [
                        ...prevSnake
                    ];
                    const head = {
                        ...newSnake[0]
                    };
                    switch(direction){
                        case 'UP':
                            head.y -= 1;
                            break;
                        case 'DOWN':
                            head.y += 1;
                            break;
                        case 'LEFT':
                            head.x -= 1;
                            break;
                        case 'RIGHT':
                            head.x += 1;
                            break;
                    }
                    // Wall collision
                    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                        setGameOver(true);
                        setSpeed(null);
                        return prevSnake;
                    }
                    // Self collision
                    for(let i = 1; i < newSnake.length; i++){
                        if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
                            setGameOver(true);
                            setSpeed(null);
                            return prevSnake;
                        }
                    }
                    newSnake.unshift(head);
                    // Food collision
                    if (head.x === food.x && head.y === food.y) {
                        const newScore = score + 10;
                        setScore(newScore);
                        if (newScore > highScore) {
                            setHighScore(newScore);
                            localStorage.setItem('snakeHighScore', newScore.toString());
                        }
                        setFood(getRandomCoordinate(newSnake));
                        // Increase speed slightly
                        setSpeed({
                            "Snake.useCallback[runGame]": (s)=>Math.max(50, s * 0.95)
                        }["Snake.useCallback[runGame]"]);
                    } else {
                        newSnake.pop();
                    }
                    return newSnake;
                }
            }["Snake.useCallback[runGame]"]);
        }
    }["Snake.useCallback[runGame]"], [
        direction,
        food,
        gameOver,
        score,
        highScore
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Snake.useEffect": ()=>{
            if (speed !== null && !gameOver) {
                if (gameLoopRef.current) clearInterval(gameLoopRef.current);
                gameLoopRef.current = setInterval(runGame, speed);
            } else if (gameLoopRef.current) {
                clearInterval(gameLoopRef.current);
            }
            return ({
                "Snake.useEffect": ()=>{
                    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
                }
            })["Snake.useEffect"];
        }
    }["Snake.useEffect"], [
        runGame,
        speed,
        gameOver
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            opacity: 0,
            scale: 0.9
        },
        animate: {
            opacity: 1,
            scale: 1
        },
        className: "w-full max-w-md glass-card p-6 flex flex-col items-center gap-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-3xl font-headline text-accent-green",
                children: "Snake"
            }, void 0, false, {
                fileName: "[project]/src/components/games/Snake.tsx",
                lineNumber: 169,
                columnNumber: 14
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between w-full font-bold",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].span, {
                        animate: {
                            scale: [
                                1,
                                1.2,
                                1
                            ]
                        },
                        transition: {
                            duration: 0.3,
                            times: [
                                0,
                                0.5,
                                1
                            ]
                        },
                        className: "text-accent-cyan text-lg",
                        children: [
                            "Score: ",
                            score
                        ]
                    }, score, true, {
                        fileName: "[project]/src/components/games/Snake.tsx",
                        lineNumber: 172,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-accent-pink text-lg",
                        children: [
                            "High Score: ",
                            highScore
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/Snake.tsx",
                        lineNumber: 175,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/Snake.tsx",
                lineNumber: 171,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid bg-black/30 border-2 border-accent-cyan/20 relative shadow-[0_0_15px_rgba(0,240,255,0.3)] touch-none",
                style: {
                    gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
                    width: `${GRID_SIZE * TILE_SIZE}px`,
                    height: `${GRID_SIZE * TILE_SIZE}px`
                },
                onTouchStart: handleTouchStart,
                onTouchEnd: handleTouchEnd,
                children: [
                    snake.map((segment, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `w-full h-full rounded-sm transition-colors duration-200 ${index === 0 ? 'bg-accent-green shadow-[0_0_8px_rgba(57,255,20,0.7)]' : 'bg-green-400/80'}`,
                            style: {
                                gridColumnStart: segment.x + 1,
                                gridRowStart: segment.y + 1
                            }
                        }, index, false, {
                            fileName: "[project]/src/components/games/Snake.tsx",
                            lineNumber: 190,
                            columnNumber: 21
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-center text-red-500",
                        style: {
                            gridColumnStart: food.x + 1,
                            gridRowStart: food.y + 1
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$apple$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Apple$3e$__["Apple"], {
                            className: "animate-pulse drop-shadow-[0_0_5px_rgba(255,50,50,0.8)]"
                        }, void 0, false, {
                            fileName: "[project]/src/components/games/Snake.tsx",
                            lineNumber: 206,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/games/Snake.tsx",
                        lineNumber: 199,
                        columnNumber: 18
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/Snake.tsx",
                lineNumber: 178,
                columnNumber: 13
            }, this),
            gameOver && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    opacity: 0,
                    y: 10
                },
                animate: {
                    opacity: 1,
                    y: 0
                },
                className: "text-center bg-red-500/10 p-4 rounded-xl border border-red-500/30",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__["Trophy"], {
                        className: "mx-auto text-brand-gold mb-2",
                        size: 32
                    }, void 0, false, {
                        fileName: "[project]/src/components/games/Snake.tsx",
                        lineNumber: 216,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-2xl font-bold text-red-500",
                        children: "Game Over!"
                    }, void 0, false, {
                        fileName: "[project]/src/components/games/Snake.tsx",
                        lineNumber: 217,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-300",
                        children: [
                            "Your final score is ",
                            score,
                            "."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/Snake.tsx",
                        lineNumber: 218,
                        columnNumber: 21
                    }, this),
                    score > 0 && score === highScore && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-bold text-brand-gold animate-pulse",
                        children: "New High Score!"
                    }, void 0, false, {
                        fileName: "[project]/src/components/games/Snake.tsx",
                        lineNumber: 219,
                        columnNumber: 58
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/Snake.tsx",
                lineNumber: 211,
                columnNumber: 17
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden md:grid grid-cols-3 gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {}, void 0, false, {
                                fileName: "[project]/src/components/games/Snake.tsx",
                                lineNumber: 226,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn-glass p-4",
                                onClick: ()=>changeDirection('UP'),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUp$3e$__["ArrowUp"], {}, void 0, false, {
                                    fileName: "[project]/src/components/games/Snake.tsx",
                                    lineNumber: 227,
                                    columnNumber: 93
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/Snake.tsx",
                                lineNumber: 227,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {}, void 0, false, {
                                fileName: "[project]/src/components/games/Snake.tsx",
                                lineNumber: 228,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn-glass p-4",
                                onClick: ()=>changeDirection('LEFT'),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {}, void 0, false, {
                                    fileName: "[project]/src/components/games/Snake.tsx",
                                    lineNumber: 229,
                                    columnNumber: 95
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/Snake.tsx",
                                lineNumber: 229,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn-glass p-4",
                                onClick: ()=>changeDirection('DOWN'),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDown$3e$__["ArrowDown"], {}, void 0, false, {
                                    fileName: "[project]/src/components/games/Snake.tsx",
                                    lineNumber: 230,
                                    columnNumber: 95
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/Snake.tsx",
                                lineNumber: 230,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn-glass p-4",
                                onClick: ()=>changeDirection('RIGHT'),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowRight$3e$__["ArrowRight"], {}, void 0, false, {
                                    fileName: "[project]/src/components/games/Snake.tsx",
                                    lineNumber: 231,
                                    columnNumber: 96
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/Snake.tsx",
                                lineNumber: 231,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/Snake.tsx",
                        lineNumber: 225,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: resetGame,
                        className: "btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                size: 16
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/Snake.tsx",
                                lineNumber: 235,
                                columnNumber: 21
                            }, this),
                            " New Game"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/Snake.tsx",
                        lineNumber: 234,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/Snake.tsx",
                lineNumber: 223,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/games/Snake.tsx",
        lineNumber: 164,
        columnNumber: 9
    }, this);
}
_s(Snake, "3mGtF2Obg+71CtioAVz1L81/zQM=");
_c = Snake;
var _c;
__turbopack_context__.k.register(_c, "Snake");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/games/2048.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Game2048",
    ()=>Game2048
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-client] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trophy.js [app-client] (ecmascript) <export default as Trophy>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const GRID_SIZE = 4;
const TILE_COLORS = {
    2: 'bg-gray-700 text-gray-200',
    4: 'bg-gray-600 text-gray-100',
    8: 'bg-orange-500 text-white',
    16: 'bg-orange-600 text-white',
    32: 'bg-red-500 text-white',
    64: 'bg-red-600 text-white',
    128: 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/50',
    256: 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50',
    512: 'bg-yellow-600 text-black shadow-lg shadow-yellow-600/50',
    1024: 'bg-purple-500 text-white shadow-lg shadow-purple-500/50',
    2048: 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
};
const createEmptyBoard = ()=>Array(GRID_SIZE).fill(null).map(()=>Array(GRID_SIZE).fill(0));
const addRandomTile = (board)=>{
    const newBoard = board.map((row)=>[
            ...row
        ]);
    let added = false;
    while(!added){
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        if (newBoard[row][col] === 0) {
            newBoard[row][col] = Math.random() < 0.9 ? 2 : 4;
            added = true;
        }
    }
    return newBoard;
};
const slide = (row)=>{
    const arr = row.filter((val)=>val);
    const missing = GRID_SIZE - arr.length;
    const zeros = Array(missing).fill(0);
    return arr.concat(zeros);
};
const combine = (row)=>{
    let scoreToAdd = 0;
    for(let i = 0; i < GRID_SIZE - 1; i++){
        if (row[i] !== 0 && row[i] === row[i + 1]) {
            row[i] *= 2;
            scoreToAdd += row[i];
            row[i + 1] = 0;
        }
    }
    return {
        newRow: row,
        score: scoreToAdd
    };
};
const rotate = (board)=>{
    const newBoard = createEmptyBoard();
    for(let i = 0; i < GRID_SIZE; i++){
        for(let j = 0; j < GRID_SIZE; j++){
            newBoard[i][j] = board[j][i];
        }
    }
    return newBoard;
};
const flip = (board)=>{
    return board.map((row)=>row.slice().reverse());
};
const moveLeft = (board)=>{
    let totalScore = 0;
    const newBoard = board.map((row)=>{
        let newRow = slide(row);
        const { newRow: combinedRow, score } = combine(newRow);
        totalScore += score;
        return slide(combinedRow);
    });
    return {
        board: newBoard,
        score: totalScore
    };
};
const moveRight = (board)=>{
    const flippedBoard = flip(board);
    const { board: newBoard, score } = moveLeft(flippedBoard);
    return {
        board: flip(newBoard),
        score: score
    };
};
const moveUp = (board)=>{
    const rotatedBoard = rotate(board);
    const { board: newBoard, score } = moveLeft(rotatedBoard);
    return {
        board: rotate(rotate(rotate(newBoard))),
        score: score
    };
};
const moveDown = (board)=>{
    const rotatedBoard = rotate(board);
    const { board: newBoard, score } = moveRight(rotatedBoard);
    return {
        board: rotate(rotate(rotate(newBoard))),
        score: score
    };
};
function Game2048() {
    _s();
    const [board, setBoard] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(addRandomTile(addRandomTile(createEmptyBoard())));
    const [score, setScore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [highScore, setHighScore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [gameOver, setGameOver] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [gameWon, setGameWon] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const touchStartRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Game2048.useEffect": ()=>{
            const storedHighScore = localStorage.getItem('2048HighScore');
            if (storedHighScore) {
                setHighScore(parseInt(storedHighScore, 10));
            }
        }
    }["Game2048.useEffect"], []);
    const resetGame = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Game2048.useCallback[resetGame]": ()=>{
            setBoard(addRandomTile(addRandomTile(createEmptyBoard())));
            setScore(0);
            setGameOver(false);
            setGameWon(false);
        }
    }["Game2048.useCallback[resetGame]"], []);
    const isGameOver = (board)=>{
        for(let i = 0; i < GRID_SIZE; i++){
            for(let j = 0; j < GRID_SIZE; j++){
                if (board[i][j] === 0) return false;
                if (i < GRID_SIZE - 1 && board[i][j] === board[i + 1][j]) return false;
                if (j < GRID_SIZE - 1 && board[i][j] === board[i][j + 1]) return false;
            }
        }
        return true;
    };
    const handleMove = (newBoard, scoreGained, moved)=>{
        if (moved) {
            const boardWithNewTile = addRandomTile(newBoard);
            setBoard(boardWithNewTile);
            const newScore = score + scoreGained;
            setScore(newScore);
            if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('2048HighScore', newScore.toString());
            }
            if (!gameWon && boardWithNewTile.some((row)=>row.includes(2048))) {
                setGameWon(true);
            }
            if (isGameOver(boardWithNewTile)) {
                setGameOver(true);
            }
        }
    };
    const handleKeyDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Game2048.useCallback[handleKeyDown]": (e)=>{
            if (gameOver) return;
            let result;
            const originalBoard = JSON.stringify(board);
            switch(e.key){
                case 'ArrowLeft':
                    result = moveLeft(board);
                    break;
                case 'ArrowRight':
                    result = moveRight(board);
                    break;
                case 'ArrowUp':
                    result = moveUp(board);
                    break;
                case 'ArrowDown':
                    result = moveDown(board);
                    break;
                default:
                    return;
            }
            e.preventDefault();
            const moved = JSON.stringify(result.board) !== originalBoard;
            handleMove(result.board, result.score, moved);
        }
    }["Game2048.useCallback[handleKeyDown]"], [
        board,
        score,
        highScore,
        gameOver,
        gameWon
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Game2048.useEffect": ()=>{
            window.addEventListener('keydown', handleKeyDown);
            return ({
                "Game2048.useEffect": ()=>window.removeEventListener('keydown', handleKeyDown)
            })["Game2048.useEffect"];
        }
    }["Game2048.useEffect"], [
        handleKeyDown
    ]);
    const handleTouchStart = (e)=>{
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    };
    const handleTouchEnd = (e)=>{
        if (!touchStartRef.current || gameOver) return;
        const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
        if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) return;
        let result;
        const originalBoard = JSON.stringify(board);
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) result = moveRight(board);
            else result = moveLeft(board);
        } else {
            if (deltaY > 0) result = moveDown(board);
            else result = moveUp(board);
        }
        const moved = JSON.stringify(result.board) !== originalBoard;
        handleMove(result.board, result.score, moved);
        touchStartRef.current = null;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            opacity: 0,
            scale: 0.9
        },
        animate: {
            opacity: 1,
            scale: 1
        },
        className: "w-full max-w-md glass-card p-6 flex flex-col items-center gap-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-3xl font-headline text-accent-cyan",
                children: "2048"
            }, void 0, false, {
                fileName: "[project]/src/components/games/2048.tsx",
                lineNumber: 215,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between w-full font-bold",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].span, {
                        animate: {
                            scale: [
                                1,
                                1.2,
                                1
                            ]
                        },
                        transition: {
                            duration: 0.3,
                            times: [
                                0,
                                0.5,
                                1
                            ]
                        },
                        className: "text-accent-cyan text-lg",
                        children: [
                            "Score: ",
                            score
                        ]
                    }, score, true, {
                        fileName: "[project]/src/components/games/2048.tsx",
                        lineNumber: 218,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-accent-pink text-lg",
                        children: [
                            "High Score: ",
                            highScore
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/2048.tsx",
                        lineNumber: 221,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/2048.tsx",
                lineNumber: 217,
                columnNumber: 14
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-4 gap-2 bg-black/30 border-2 border-accent-cyan/20 p-2 rounded-lg relative touch-none",
                onTouchStart: handleTouchStart,
                onTouchEnd: handleTouchEnd,
                children: [
                    board.map((row, i)=>row.map((val, j)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `w-20 h-20 md:w-24 md:h-24 rounded-md flex items-center justify-center font-bold text-2xl md:text-3xl ${val === 0 ? 'bg-gray-800/50' : TILE_COLORS[val] || 'bg-gray-500'}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                    children: val !== 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                        initial: {
                                            scale: 0.5,
                                            opacity: 0
                                        },
                                        animate: {
                                            scale: 1,
                                            opacity: 1
                                        },
                                        exit: {
                                            scale: 0.5,
                                            opacity: 0
                                        },
                                        children: val
                                    }, val, false, {
                                        fileName: "[project]/src/components/games/2048.tsx",
                                        lineNumber: 234,
                                        columnNumber: 33
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/games/2048.tsx",
                                    lineNumber: 232,
                                    columnNumber: 28
                                }, this)
                            }, `${i}-${j}`, false, {
                                fileName: "[project]/src/components/games/2048.tsx",
                                lineNumber: 231,
                                columnNumber: 25
                            }, this))),
                    (gameOver || gameWon) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0
                        },
                        animate: {
                            opacity: 1
                        },
                        className: "absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 rounded-lg z-10",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__["Trophy"], {
                                className: `mx-auto mb-2 ${gameWon && !gameOver ? 'text-brand-gold' : 'text-gray-500'}`,
                                size: 32
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/2048.tsx",
                                lineNumber: 253,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: `text-2xl font-bold ${gameWon && !gameOver ? 'text-green-400' : 'text-red-500'}`,
                                children: gameWon && !gameOver ? "You Win!" : "Game Over!"
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/2048.tsx",
                                lineNumber: 254,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-300",
                                children: [
                                    "Your final score is ",
                                    score,
                                    "."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/games/2048.tsx",
                                lineNumber: 255,
                                columnNumber: 25
                            }, this),
                            gameWon && !gameOver && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-400",
                                children: "Keep going to get an even higher score!"
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/2048.tsx",
                                lineNumber: 256,
                                columnNumber: 50
                            }, this),
                            gameWon && !gameOver && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setGameWon(false),
                                className: "btn-glass bg-accent-purple/20 text-accent-purple text-sm mt-2",
                                children: "Keep Playing"
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/2048.tsx",
                                lineNumber: 258,
                                columnNumber: 29
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/2048.tsx",
                        lineNumber: 248,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/2048.tsx",
                lineNumber: 224,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: resetGame,
                className: "btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                        size: 16
                    }, void 0, false, {
                        fileName: "[project]/src/components/games/2048.tsx",
                        lineNumber: 267,
                        columnNumber: 17
                    }, this),
                    " New Game"
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/2048.tsx",
                lineNumber: 266,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/games/2048.tsx",
        lineNumber: 210,
        columnNumber: 9
    }, this);
}
_s(Game2048, "YbwDhyrvf0RQDryzfQZIfA5vBTY=");
_c = Game2048;
var _c;
__turbopack_context__.k.register(_c, "Game2048");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/games/Match3.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Match3",
    ()=>Match3
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-client] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.js [app-client] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gem$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/gem.js [app-client] (ecmascript) <export default as Gem>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trophy.js [app-client] (ecmascript) <export default as Trophy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$move$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Move$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/move.js [app-client] (ecmascript) <export default as Move>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const GRID_SIZE = 8;
const TILE_COLORS = [
    '#FF3CAC',
    '#00F0FF',
    '#39FF14',
    '#FFB400',
    '#BF00FF',
    '#FF5F6D'
];
// --- LEVEL DEFINITIONS ---
const levels = [
    {
        level: 1,
        goal: {
            type: 'score',
            value: 1000
        },
        moves: 20
    },
    {
        level: 2,
        goal: {
            type: 'score',
            value: 2500
        },
        moves: 25
    },
    {
        level: 3,
        goal: {
            type: 'clearColor',
            colorIndex: 2,
            value: 15
        },
        moves: 30
    }
];
const hasMatches = (board)=>{
    for(let r = 0; r < GRID_SIZE; r++){
        for(let c = 0; c < GRID_SIZE; c++){
            if (c < GRID_SIZE - 2 && board[r][c] !== null && board[r][c] === board[r][c + 1] && board[r][c] === board[r][c + 2]) return true;
            if (r < GRID_SIZE - 2 && board[r][c] !== null && board[r][c] === board[r + 1][c] && board[r][c] === board[r + 2][c]) return true;
        }
    }
    return false;
};
const createInitialBoard = ()=>{
    const newBoard = Array(GRID_SIZE).fill(null).map(()=>Array(GRID_SIZE).fill(null));
    for(let r = 0; r < GRID_SIZE; r++){
        for(let c = 0; c < GRID_SIZE; c++){
            newBoard[r][c] = Math.floor(Math.random() * TILE_COLORS.length);
        }
    }
    // Prevent initial matches
    if (hasMatches(newBoard)) {
        return createInitialBoard(); // Recurse until a match-free board is made
    }
    return newBoard;
};
function Match3() {
    _s();
    const [currentLevel, setCurrentLevel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [board, setBoard] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(createInitialBoard());
    const [score, setScore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [highScore, setHighScore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [movesLeft, setMovesLeft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(levels[currentLevel].moves);
    const [gameState, setGameState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('playing');
    const [goalProgress, setGoalProgress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [selectedTile, setSelectedTile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Match3.useEffect": ()=>{
            const storedHighScore = localStorage.getItem('match3HighScore');
            if (storedHighScore) setHighScore(parseInt(storedHighScore, 10));
        }
    }["Match3.useEffect"], []);
    const checkMatches = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Match3.useCallback[checkMatches]": (currentBoard)=>{
            const matches = new Set();
            // Horizontal
            for(let r = 0; r < GRID_SIZE; r++){
                for(let c = 0; c < GRID_SIZE - 2; c++){
                    if (currentBoard[r][c] !== null && currentBoard[r][c] === currentBoard[r][c + 1] && currentBoard[r][c] === currentBoard[r][c + 2]) {
                        matches.add(`${r}-${c}`);
                        matches.add(`${r}-${c + 1}`);
                        matches.add(`${r}-${c + 2}`);
                    }
                }
            }
            // Vertical
            for(let c = 0; c < GRID_SIZE; c++){
                for(let r = 0; r < GRID_SIZE - 2; r++){
                    if (currentBoard[r][c] !== null && currentBoard[r][c] === currentBoard[r + 1][c] && currentBoard[r][c] === currentBoard[r + 2][c]) {
                        matches.add(`${r}-${c}`);
                        matches.add(`${r + 1}-${c}`);
                        matches.add(`${r + 2}-${c}`);
                    }
                }
            }
            return matches;
        }
    }["Match3.useCallback[checkMatches]"], []);
    const dropAndRefill = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Match3.useCallback[dropAndRefill]": (boardAfterClear)=>{
            const newBoard = boardAfterClear.map({
                "Match3.useCallback[dropAndRefill].newBoard": (row)=>[
                        ...row
                    ]
            }["Match3.useCallback[dropAndRefill].newBoard"]);
            for(let c = 0; c < GRID_SIZE; c++){
                let emptyCount = 0;
                for(let r = GRID_SIZE - 1; r >= 0; r--){
                    if (newBoard[r][c] === null) {
                        emptyCount++;
                    } else if (emptyCount > 0) {
                        newBoard[r + emptyCount][c] = newBoard[r][c];
                        newBoard[r][c] = null;
                    }
                }
                for(let r = 0; r < emptyCount; r++){
                    newBoard[r][c] = Math.floor(Math.random() * TILE_COLORS.length);
                }
            }
            return newBoard;
        }
    }["Match3.useCallback[dropAndRefill]"], []);
    const processMatches = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Match3.useCallback[processMatches]": (currentBoard)=>{
            let matches = checkMatches(currentBoard);
            if (matches.size === 0) return {
                newBoard: currentBoard,
                scoreGained: 0,
                clearedColors: {}
            };
            let scoreGained = 0;
            let clearedColors = {};
            const boardAfterClear = currentBoard.map({
                "Match3.useCallback[processMatches].boardAfterClear": (row)=>[
                        ...row
                    ]
            }["Match3.useCallback[processMatches].boardAfterClear"]);
            matches.forEach({
                "Match3.useCallback[processMatches]": (key)=>{
                    const [r, c] = key.split('-').map(Number);
                    const colorIndex = boardAfterClear[r][c];
                    if (colorIndex !== null) {
                        clearedColors[colorIndex] = (clearedColors[colorIndex] || 0) + 1;
                        boardAfterClear[r][c] = null;
                        scoreGained += 10;
                    }
                }
            }["Match3.useCallback[processMatches]"]);
            const refilledBoard = dropAndRefill(boardAfterClear);
            // Chain reaction
            const chainedResult = processMatches(refilledBoard);
            let finalClearedColors = {
                ...clearedColors
            };
            for(const color in chainedResult.clearedColors){
                finalClearedColors[color] = (finalClearedColors[color] || 0) + chainedResult.clearedColors[color];
            }
            return {
                newBoard: chainedResult.newBoard,
                scoreGained: scoreGained + chainedResult.scoreGained,
                clearedColors: finalClearedColors
            };
        }
    }["Match3.useCallback[processMatches]"], [
        checkMatches,
        dropAndRefill
    ]);
    const handleSwap = (r1, c1, r2, c2)=>{
        if (gameState !== 'playing' || movesLeft <= 0) return;
        const dr = Math.abs(r1 - r2);
        const dc = Math.abs(c1 - c2);
        if (dr + dc !== 1) return; // Not an adjacent swap
        const newBoard = board.map((row)=>[
                ...row
            ]);
        [newBoard[r1][c1], newBoard[r2][c2]] = [
            newBoard[r2][c2],
            newBoard[r1][c1]
        ];
        const { newBoard: boardAfterMatches, scoreGained, clearedColors } = processMatches(newBoard);
        if (scoreGained > 0) {
            setBoard(boardAfterMatches);
            const newScore = score + scoreGained;
            setScore(newScore);
            if (newScore > highScore) {
                setHighScore(newScore);
                localStorage.setItem('match3HighScore', newScore.toString());
            }
            const levelGoal = levels[currentLevel].goal;
            if (levelGoal.type === 'clearColor') {
                setGoalProgress((prev)=>prev + (clearedColors[levelGoal.colorIndex] || 0));
            } else {
                setGoalProgress(newScore);
            }
            setMovesLeft((moves)=>moves - 1);
        }
    // If swap is invalid, we could swap them back visually, but for simplicity, we do nothing.
    };
    const handleTileClick = (r, c)=>{
        if (gameState !== 'playing') return;
        if (!selectedTile) {
            setSelectedTile({
                r,
                c
            });
        } else {
            handleSwap(selectedTile.r, selectedTile.c, r, c);
            setSelectedTile(null); // Reset selection after attempting a swap
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Match3.useEffect": ()=>{
            if (gameState !== 'playing') return;
            const levelGoal = levels[currentLevel].goal;
            let goalMet = false;
            if (levelGoal.type === 'score' && score >= levelGoal.value) goalMet = true;
            if (levelGoal.type === 'clearColor' && goalProgress >= levelGoal.value) goalMet = true;
            if (goalMet) {
                setGameState('won');
            } else if (movesLeft <= 0) {
                setGameState('lost');
            }
        }
    }["Match3.useEffect"], [
        score,
        movesLeft,
        goalProgress,
        currentLevel,
        gameState
    ]);
    const resetGame = (levelIndex = 0)=>{
        setCurrentLevel(levelIndex);
        setBoard(createInitialBoard());
        setScore(levelIndex > 0 ? score : 0);
        setMovesLeft(levels[levelIndex].moves);
        setGameState('playing');
        setGoalProgress(0);
        setSelectedTile(null);
    };
    const level = levels[currentLevel];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            opacity: 0,
            scale: 0.9
        },
        animate: {
            opacity: 1,
            scale: 1
        },
        className: "w-full max-w-md glass-card p-6 flex flex-col items-center gap-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-3xl font-headline text-accent-pink",
                children: "Match-3 Madness"
            }, void 0, false, {
                fileName: "[project]/src/components/games/Match3.tsx",
                lineNumber: 218,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between w-full font-bold text-lg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-accent-cyan flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                                size: 18
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/Match3.tsx",
                                lineNumber: 220,
                                columnNumber: 76
                            }, this),
                            " Score: ",
                            score
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/Match3.tsx",
                        lineNumber: 220,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-accent-pink flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$move$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Move$3e$__["Move"], {
                                size: 18
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/Match3.tsx",
                                lineNumber: 221,
                                columnNumber: 76
                            }, this),
                            " Moves: ",
                            movesLeft
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/Match3.tsx",
                        lineNumber: 221,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/Match3.tsx",
                lineNumber: 219,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full text-center bg-black/20 p-2 rounded-lg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-bold text-brand-gold",
                        children: [
                            "Level ",
                            level.level,
                            ": ",
                            level.goal.type === 'score' ? `Reach ${level.goal.value} points` : `Clear ${level.goal.value} green gems`
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/Match3.tsx",
                        lineNumber: 224,
                        columnNumber: 17
                    }, this),
                    level.goal.type === 'clearColor' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full bg-gray-600 rounded-full h-2.5 mt-1",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-green-400 h-2.5 rounded-full",
                            style: {
                                width: `${Math.min(100, goalProgress / level.goal.value * 100)}%`
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/games/Match3.tsx",
                            lineNumber: 229,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/games/Match3.tsx",
                        lineNumber: 228,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/Match3.tsx",
                lineNumber: 223,
                columnNumber: 14
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid gap-1 bg-black/30 border-2 border-accent-cyan/20 p-1 rounded-lg relative",
                style: {
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                        children: board.map((row, r)=>row.map((colorIndex, c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                    layoutId: `${r}-${c}`,
                                    initial: {
                                        scale: 0
                                    },
                                    animate: {
                                        scale: 1
                                    },
                                    exit: {
                                        scale: 0
                                    },
                                    transition: {
                                        duration: 0.3
                                    },
                                    className: `w-full aspect-square rounded-md flex items-center justify-center cursor-pointer transition-all ${selectedTile?.r === r && selectedTile?.c === c ? 'ring-2 ring-white scale-110' : ''}`,
                                    style: {
                                        backgroundColor: colorIndex !== null ? TILE_COLORS[colorIndex] : 'transparent'
                                    },
                                    onClick: ()=>handleTileClick(r, c),
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gem$3e$__["Gem"], {
                                        className: "text-white/50"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/games/Match3.tsx",
                                        lineNumber: 251,
                                        columnNumber: 24
                                    }, this)
                                }, `${r}-${c}`, false, {
                                    fileName: "[project]/src/components/games/Match3.tsx",
                                    lineNumber: 240,
                                    columnNumber: 21
                                }, this)))
                    }, void 0, false, {
                        fileName: "[project]/src/components/games/Match3.tsx",
                        lineNumber: 238,
                        columnNumber: 17
                    }, this),
                    (gameState === 'won' || gameState === 'lost') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0
                        },
                        animate: {
                            opacity: 1
                        },
                        className: "absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 rounded-lg z-10",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__["Trophy"], {
                                className: `mx-auto mb-2 ${gameState === 'won' ? 'text-brand-gold' : 'text-gray-500'}`,
                                size: 32
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/Match3.tsx",
                                lineNumber: 261,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: `text-2xl font-bold ${gameState === 'won' ? 'text-green-400' : 'text-red-500'}`,
                                children: gameState === 'won' ? 'Level Complete!' : 'Game Over'
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/Match3.tsx",
                                lineNumber: 262,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-300",
                                children: [
                                    "Your score: ",
                                    score
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/games/Match3.tsx",
                                lineNumber: 263,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2 mt-4",
                                children: [
                                    gameState === 'won' && levels[currentLevel + 1] && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>resetGame(currentLevel + 1),
                                        className: "btn-glass bg-green-500",
                                        children: "Next Level"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/games/Match3.tsx",
                                        lineNumber: 266,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>resetGame(currentLevel),
                                        className: "btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                                size: 16
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/games/Match3.tsx",
                                                lineNumber: 269,
                                                columnNumber: 29
                                            }, this),
                                            " ",
                                            gameState === 'won' ? 'Play Again' : 'Try Again'
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/games/Match3.tsx",
                                        lineNumber: 268,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/games/Match3.tsx",
                                lineNumber: 264,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/Match3.tsx",
                        lineNumber: 256,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/Match3.tsx",
                lineNumber: 234,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>resetGame(currentLevel),
                className: "btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                        size: 16
                    }, void 0, false, {
                        fileName: "[project]/src/components/games/Match3.tsx",
                        lineNumber: 276,
                        columnNumber: 17
                    }, this),
                    " Reset Game"
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/Match3.tsx",
                lineNumber: 275,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/games/Match3.tsx",
        lineNumber: 213,
        columnNumber: 10
    }, this);
}
_s(Match3, "l8e/pUlyGUGsiF5KrLWLiJrh/Ms=");
_c = Match3;
var _c;
__turbopack_context__.k.register(_c, "Match3");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/games/BrickBreaker.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BrickBreaker",
    ()=>BrickBreaker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-client] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trophy.js [app-client] (ecmascript) <export default as Trophy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/heart.js [app-client] (ecmascript) <export default as Heart>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
// --- GAME CONFIGURATION ---
const BRICK_ROW_COUNT = 5;
const BRICK_COLUMN_COUNT = 10;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 8;
const INITIAL_LIVES = 3;
const BRICK_COLORS = [
    '#FF3CAC',
    '#BF00FF',
    '#00F0FF',
    '#39FF14',
    '#FFB400'
];
const levelLayouts = [
    // Level 1: Solid Wall with varied colors
    Array(BRICK_ROW_COUNT).fill(0).map((_, r)=>Array(BRICK_COLUMN_COUNT).fill(0).map((_, c)=>({
                status: 1,
                color: BRICK_COLORS[(r + c) % BRICK_COLORS.length]
            }))),
    // Level 2: Pyramid
    [
        [
            0,
            0,
            0,
            0,
            1,
            1,
            0,
            0,
            0,
            0
        ],
        [
            0,
            0,
            0,
            1,
            1,
            1,
            1,
            0,
            0,
            0
        ],
        [
            0,
            0,
            1,
            1,
            1,
            1,
            1,
            1,
            0,
            0
        ],
        [
            0,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            0
        ],
        [
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1,
            1
        ]
    ].map((row, r)=>row.map((cell)=>({
                status: cell,
                color: BRICK_COLORS[r % BRICK_COLORS.length]
            }))),
    // Level 3: Checkered
    Array(BRICK_ROW_COUNT).fill(0).map((_, r)=>Array(BRICK_COLUMN_COUNT).fill(0).map((_, c)=>({
                status: (r + c) % 2,
                color: BRICK_COLORS[c % BRICK_COLORS.length]
            })))
];
function BrickBreaker() {
    _s();
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [level, setLevel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [score, setScore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [highScore, setHighScore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [lives, setLives] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(INITIAL_LIVES);
    const [gameState, setGameState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('start');
    // Use refs for state that changes every frame to avoid re-renders
    const ballRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        x: 0,
        y: 0,
        dx: 4,
        dy: -4
    });
    const paddleRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        x: 0
    });
    const bricksRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(JSON.parse(JSON.stringify(levelLayouts[level])));
    const resetBallAndPaddle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BrickBreaker.useCallback[resetBallAndPaddle]": ()=>{
            const canvas = canvasRef.current;
            if (!canvas) return;
            paddleRef.current.x = (canvas.width - PADDLE_WIDTH) / 2;
            ballRef.current = {
                x: canvas.width / 2,
                y: canvas.height - 50,
                dx: 4,
                dy: -4
            };
        }
    }["BrickBreaker.useCallback[resetBallAndPaddle]"], []);
    const resetLevel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BrickBreaker.useCallback[resetLevel]": (levelIndex)=>{
            bricksRef.current = JSON.parse(JSON.stringify(levelLayouts[levelIndex]));
            setLevel(levelIndex);
            setLives(INITIAL_LIVES);
            setScore(0);
            resetBallAndPaddle();
            setGameState('start');
        }
    }["BrickBreaker.useCallback[resetLevel]"], [
        resetBallAndPaddle
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrickBreaker.useEffect": ()=>{
            const storedHighScore = localStorage.getItem('brickBreakerHighScore');
            if (storedHighScore) setHighScore(parseInt(storedHighScore));
            resetBallAndPaddle(); // Initial position
        }
    }["BrickBreaker.useEffect"], [
        resetBallAndPaddle
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BrickBreaker.useEffect": ()=>{
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            let animationFrameId;
            const draw = {
                "BrickBreaker.useEffect.draw": ()=>{
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    // Draw Bricks
                    bricksRef.current.forEach({
                        "BrickBreaker.useEffect.draw": (row, r)=>{
                            row.forEach({
                                "BrickBreaker.useEffect.draw": (brick, c)=>{
                                    if (brick.status === 1) {
                                        const brickX = c * (canvas.width / BRICK_COLUMN_COUNT);
                                        const brickY = r * 30 + 30;
                                        const brickWidth = canvas.width / BRICK_COLUMN_COUNT;
                                        const brickHeight = 25;
                                        ctx.beginPath();
                                        ctx.rect(brickX + 2, brickY + 2, brickWidth - 4, brickHeight - 4);
                                        ctx.fillStyle = brick.color || BRICK_COLORS[r % BRICK_COLORS.length];
                                        ctx.fill();
                                        ctx.closePath();
                                    }
                                }
                            }["BrickBreaker.useEffect.draw"]);
                        }
                    }["BrickBreaker.useEffect.draw"]);
                    // Draw Ball
                    ctx.beginPath();
                    ctx.arc(ballRef.current.x, ballRef.current.y, BALL_RADIUS, 0, Math.PI * 2);
                    ctx.fillStyle = '#00F0FF';
                    ctx.shadowColor = '#00F0FF';
                    ctx.shadowBlur = 10;
                    ctx.fill();
                    ctx.closePath();
                    ctx.shadowBlur = 0;
                    // Draw Paddle
                    ctx.beginPath();
                    ctx.rect(paddleRef.current.x, canvas.height - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);
                    ctx.fillStyle = '#FF3CAC';
                    ctx.shadowColor = '#FF3CAC';
                    ctx.shadowBlur = 10;
                    ctx.fill();
                    ctx.closePath();
                    ctx.shadowBlur = 0;
                }
            }["BrickBreaker.useEffect.draw"];
            const update = {
                "BrickBreaker.useEffect.update": ()=>{
                    const ball = ballRef.current;
                    const paddle = paddleRef.current;
                    const bricks = bricksRef.current;
                    // Collision Detection
                    bricks.forEach({
                        "BrickBreaker.useEffect.update": (row, r)=>{
                            row.forEach({
                                "BrickBreaker.useEffect.update": (brick, c)=>{
                                    if (brick.status === 1) {
                                        const brickX = c * (canvas.width / BRICK_COLUMN_COUNT);
                                        const brickY = r * 30 + 30;
                                        const brickWidth = canvas.width / BRICK_COLUMN_COUNT;
                                        const brickHeight = 25;
                                        if (ball.x > brickX && ball.x < brickX + brickWidth && ball.y > brickY && ball.y < brickY + brickHeight) {
                                            ball.dy = -ball.dy;
                                            brick.status = 0;
                                            setScore({
                                                "BrickBreaker.useEffect.update": (s)=>{
                                                    const newScore = s + 10;
                                                    if (newScore > highScore) {
                                                        setHighScore(newScore);
                                                        localStorage.setItem('brickBreakerHighScore', newScore.toString());
                                                    }
                                                    return newScore;
                                                }
                                            }["BrickBreaker.useEffect.update"]);
                                        }
                                    }
                                }
                            }["BrickBreaker.useEffect.update"]);
                        }
                    }["BrickBreaker.useEffect.update"]);
                    ball.x += ball.dx;
                    ball.y += ball.dy;
                    // Wall collision
                    if (ball.x > canvas.width - BALL_RADIUS || ball.x < BALL_RADIUS) {
                        ball.dx = -ball.dx;
                    }
                    if (ball.y < BALL_RADIUS) {
                        ball.dy = -ball.dy;
                        // FIX: Prevent ball getting stuck at top
                        if (Math.abs(ball.dy) < 1) {
                            ball.dy = 2;
                        }
                    } else if (ball.y > canvas.height - PADDLE_HEIGHT - 10 - BALL_RADIUS) {
                        if (ball.x > paddle.x && ball.x < paddle.x + PADDLE_WIDTH) {
                            ball.dy = -ball.dy;
                        } else {
                            setLives({
                                "BrickBreaker.useEffect.update": (l)=>{
                                    const newLives = l - 1;
                                    if (newLives <= 0) {
                                        setGameState('lost');
                                    } else {
                                        resetBallAndPaddle();
                                        setGameState('paused');
                                    }
                                    return newLives;
                                }
                            }["BrickBreaker.useEffect.update"]);
                        }
                    }
                    if (bricks.every({
                        "BrickBreaker.useEffect.update": (row)=>row.every({
                                "BrickBreaker.useEffect.update": (brick)=>brick.status === 0
                            }["BrickBreaker.useEffect.update"])
                    }["BrickBreaker.useEffect.update"])) {
                        setGameState('won');
                    }
                }
            }["BrickBreaker.useEffect.update"];
            const gameLoop = {
                "BrickBreaker.useEffect.gameLoop": ()=>{
                    if (gameState === 'playing') {
                        update();
                    }
                    draw();
                    animationFrameId = requestAnimationFrame(gameLoop);
                }
            }["BrickBreaker.useEffect.gameLoop"];
            gameLoop();
            return ({
                "BrickBreaker.useEffect": ()=>{
                    cancelAnimationFrame(animationFrameId);
                }
            })["BrickBreaker.useEffect"];
        }
    }["BrickBreaker.useEffect"], [
        gameState,
        resetBallAndPaddle,
        highScore
    ]);
    const handleMouseMove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BrickBreaker.useCallback[handleMouseMove]": (e)=>{
            const canvas = canvasRef.current;
            if (!canvas) return;
            const relativeX = e.clientX - canvas.getBoundingClientRect().left;
            if (relativeX > 0 && relativeX < canvas.width) {
                paddleRef.current.x = Math.min(Math.max(relativeX - PADDLE_WIDTH / 2, 0), canvas.width - PADDLE_WIDTH);
            }
        }
    }["BrickBreaker.useCallback[handleMouseMove]"], []);
    const handleTouchMove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BrickBreaker.useCallback[handleTouchMove]": (e)=>{
            e.preventDefault();
            const canvas = canvasRef.current;
            if (!canvas) return;
            const relativeX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
            if (relativeX > 0 && relativeX < canvas.width) {
                paddleRef.current.x = Math.min(Math.max(relativeX - PADDLE_WIDTH / 2, 0), canvas.width - PADDLE_WIDTH);
            }
        }
    }["BrickBreaker.useCallback[handleTouchMove]"], []);
    const startGame = (e)=>{
        e.stopPropagation();
        if (gameState === 'start' || gameState === 'paused') {
            setGameState('playing');
        }
    };
    const goToNextLevel = ()=>{
        const nextLevel = (level + 1) % levelLayouts.length;
        resetLevel(nextLevel);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            opacity: 0,
            scale: 0.9
        },
        animate: {
            opacity: 1,
            scale: 1
        },
        className: "w-full max-w-2xl glass-card p-4 flex flex-col items-center gap-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-3xl font-headline text-accent-pink",
                children: "Brick Breaker"
            }, void 0, false, {
                fileName: "[project]/src/components/games/BrickBreaker.tsx",
                lineNumber: 237,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between w-full font-bold text-lg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-accent-cyan",
                        children: [
                            "Score: ",
                            score
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/BrickBreaker.tsx",
                        lineNumber: 239,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-400",
                        children: [
                            "High Score: ",
                            highScore
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/BrickBreaker.tsx",
                        lineNumber: 240,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 text-accent-pink",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__["Heart"], {}, void 0, false, {
                                fileName: "[project]/src/components/games/BrickBreaker.tsx",
                                lineNumber: 242,
                                columnNumber: 21
                            }, this),
                            " ",
                            lives
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/BrickBreaker.tsx",
                        lineNumber: 241,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/BrickBreaker.tsx",
                lineNumber: 238,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative w-full aspect-[4/3] bg-black/50 border-2 border-accent-cyan/20 rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.3)]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                        ref: canvasRef,
                        width: 600,
                        height: 450,
                        className: "w-full h-full",
                        onMouseMove: handleMouseMove,
                        onTouchMove: handleTouchMove
                    }, void 0, false, {
                        fileName: "[project]/src/components/games/BrickBreaker.tsx",
                        lineNumber: 247,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                        children: gameState !== 'playing' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                            initial: {
                                opacity: 0
                            },
                            animate: {
                                opacity: 1
                            },
                            exit: {
                                opacity: 0
                            },
                            className: "absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 rounded-lg z-10 cursor-pointer",
                            onClick: startGame,
                            onTouchStart: startGame,
                            children: [
                                gameState === 'start' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-2xl font-bold text-green-400 animate-pulse",
                                    children: "Tap to Start"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/games/BrickBreaker.tsx",
                                    lineNumber: 265,
                                    columnNumber: 50
                                }, this),
                                gameState === 'paused' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-2xl font-bold text-yellow-400",
                                    children: "Paused - Tap to Resume"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/games/BrickBreaker.tsx",
                                    lineNumber: 266,
                                    columnNumber: 51
                                }, this),
                                gameState === 'lost' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__["Trophy"], {
                                            className: "mx-auto mb-2 text-gray-500",
                                            size: 32
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/games/BrickBreaker.tsx",
                                            lineNumber: 269,
                                            columnNumber: 32
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-2xl font-bold text-red-500",
                                            children: "Game Over!"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/games/BrickBreaker.tsx",
                                            lineNumber: 270,
                                            columnNumber: 32
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-300",
                                            children: [
                                                "Your final score is ",
                                                score,
                                                "."
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/games/BrickBreaker.tsx",
                                            lineNumber: 271,
                                            columnNumber: 32
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: (e)=>{
                                                e.stopPropagation();
                                                resetLevel(level);
                                            },
                                            className: "btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                                    size: 16
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/games/BrickBreaker.tsx",
                                                    lineNumber: 273,
                                                    columnNumber: 36
                                                }, this),
                                                " Try Again"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/games/BrickBreaker.tsx",
                                            lineNumber: 272,
                                            columnNumber: 32
                                        }, this)
                                    ]
                                }, void 0, true),
                                gameState === 'won' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__["Trophy"], {
                                            className: "mx-auto mb-2 text-brand-gold",
                                            size: 32
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/games/BrickBreaker.tsx",
                                            lineNumber: 279,
                                            columnNumber: 32
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-2xl font-bold text-green-400",
                                            children: "Level Complete!"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/games/BrickBreaker.tsx",
                                            lineNumber: 280,
                                            columnNumber: 32
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-300",
                                            children: [
                                                "Final Score: ",
                                                score
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/games/BrickBreaker.tsx",
                                            lineNumber: 281,
                                            columnNumber: 32
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: (e)=>{
                                                e.stopPropagation();
                                                goToNextLevel();
                                            },
                                            className: "btn-glass bg-green-500/20 text-green-400 flex items-center gap-2 mt-4",
                                            children: "Next Level"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/games/BrickBreaker.tsx",
                                            lineNumber: 282,
                                            columnNumber: 32
                                        }, this)
                                    ]
                                }, void 0, true)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/games/BrickBreaker.tsx",
                            lineNumber: 257,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/games/BrickBreaker.tsx",
                        lineNumber: 255,
                        columnNumber: 18
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/BrickBreaker.tsx",
                lineNumber: 246,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>resetLevel(level),
                className: "btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                        size: 16
                    }, void 0, false, {
                        fileName: "[project]/src/components/games/BrickBreaker.tsx",
                        lineNumber: 292,
                        columnNumber: 17
                    }, this),
                    " Reset Game"
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/games/BrickBreaker.tsx",
                lineNumber: 291,
                columnNumber: 14
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/games/BrickBreaker.tsx",
        lineNumber: 232,
        columnNumber: 9
    }, this);
}
_s(BrickBreaker, "7hx1muNKQcpLoT0adPlYBN+hMYA=");
_c = BrickBreaker;
var _c;
__turbopack_context__.k.register(_c, "BrickBreaker");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/cricket-data.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "internationalTeams",
    ()=>internationalTeams,
    "iplTeams",
    ()=>iplTeams
]);
const iplTeams = [
    {
        name: 'Chennai Super Kings',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Chennai_Super_Kings_Logo.svg/1200px-Chennai_Super_Kings_Logo.svg.png'
    },
    {
        name: 'Mumbai Indians',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c1/Mumbai_Indians_Logo.svg/1200px-Mumbai_Indians_Logo.svg.png'
    },
    {
        name: 'Royal Challengers Bengaluru',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/Royal_Challengers_Bangalore_2020.svg/1200px-Royal_Challengers_Bangalore_2020.svg.png'
    },
    {
        name: 'Kolkata Knight Riders',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Kolkata_Knight_Riders_Logo.svg/1200px-Kolkata_Knight_Riders_Logo.svg.png'
    },
    {
        name: 'Delhi Capitals',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Delhi_Capitals_Logo.svg/1200px-Delhi_Capitals_Logo.svg.png'
    },
    {
        name: 'Punjab Kings',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Punjab_Kings_Logo.svg/1200px-Punjab_Kings_Logo.svg.png'
    },
    {
        name: 'Rajasthan Royals',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/Rajasthan_Royals_Logo.svg/1200px-Rajasthan_Royals_Logo.svg.png'
    },
    {
        name: 'Sunrisers Hyderabad',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/81/Sunrisers_Hyderabad.svg/1200px-Sunrisers_Hyderabad.svg.png'
    },
    {
        name: 'Lucknow Super Giants',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/Lucknow_Super_Giants_logo.svg/1200px-Lucknow_Super_Giants_logo.svg.png'
    },
    {
        name: 'Gujarat Titans',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b2/Gujarat_Titans_logo.svg/1200px-Gujarat_Titans_logo.svg.png'
    }
];
const internationalTeams = [
    {
        name: 'India',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8d/Board_of_Control_for_Cricket_in_India_logo.svg/1200px-Board_of_Control_for_Cricket_in_India_logo.svg.png'
    },
    {
        name: 'Australia',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Cricket_Australia_logo.svg/1200px-Cricket_Australia_logo.svg.png'
    },
    {
        name: 'England',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/ce/England_and_Wales_Cricket_Board_logo.svg/1200px-England_and_Wales_Cricket_Board_logo.svg.png'
    },
    {
        name: 'Pakistan',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/82/Pakistan_Cricket_Board_Logo.svg/1200px-Pakistan_Cricket_Board_Logo.svg.png'
    },
    {
        name: 'South Africa',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Cricket_South_Africa_logo.svg/1200px-Cricket_South_Africa_logo.svg.png'
    },
    {
        name: 'New Zealand',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/New_Zealand_Cricket_logo.svg/1200px-New_Zealand_Cricket_logo.svg.png'
    },
    {
        name: 'West Indies',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Cricket_West_Indies_logo.svg/1200px-Cricket_West_Indies_logo.svg.png'
    },
    {
        name: 'Sri Lanka',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/Sri_Lanka_Cricket_logo.svg/1200px-Sri_Lanka_Cricket_logo.svg.png'
    },
    {
        name: 'Bangladesh',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Bangladesh_Cricket_Board_Logo.svg/1200px-Bangladesh_Cricket_Board_Logo.svg.png'
    },
    {
        name: 'Afghanistan',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Afghanistan_Cricket_Board_logo.svg/1200px-Afghanistan_Cricket_Board_logo.svg.png'
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/games/CricketChallenge.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CricketChallenge",
    ()=>CricketChallenge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-client] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trophy.js [app-client] (ecmascript) <export default as Trophy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cricket$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/cricket-data.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
// --- GAME CONFIGURATION ---
const PITCH_HEIGHT = 450;
const PITCH_WIDTH = 350;
const BAT_WIDTH = 20;
const BAT_HEIGHT = 80;
const BALL_SIZE = 15;
const SWEET_SPOT_Y = PITCH_HEIGHT - BAT_HEIGHT - 35;
const BALL_START_Y = 70;
const BALL_SPEED = 400; // pixels per second
const scoreMap = {
    perfect: {
        runs: 6,
        text: "SIX!",
        color: "text-green-400"
    },
    good: {
        runs: 4,
        text: "FOUR!",
        color: "text-blue-400"
    },
    ok: {
        runs: 2,
        text: "2 Runs",
        color: "text-yellow-400"
    },
    bad: {
        runs: 1,
        text: "1 Run",
        color: "text-orange-400"
    }
};
const Bat = ({ swinging })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].g, {
        transform: "translate(5, 8)",
        animate: {
            rotate: swinging ? [
                -20,
                80,
                -20
            ] : -20
        },
        transition: {
            duration: 0.25,
            ease: "easeInOut"
        },
        style: {
            originX: `10px`,
            originY: `70px`
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: `M0,0 L${BAT_WIDTH},0 L${BAT_WIDTH},${BAT_HEIGHT - 20} Q${BAT_WIDTH / 2},${BAT_HEIGHT} 0,${BAT_HEIGHT - 20} Z`,
            fill: "#D2B48C",
            stroke: "#8B4513",
            strokeWidth: "2"
        }, void 0, false, {
            fileName: "[project]/src/components/games/CricketChallenge.tsx",
            lineNumber: 37,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/games/CricketChallenge.tsx",
        lineNumber: 31,
        columnNumber: 6
    }, ("TURBOPACK compile-time value", void 0));
_c = Bat;
const Stumps = ({ y })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
        transform: `translate(${PITCH_WIDTH / 2 - 10}, ${y})`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "0",
                y: "0",
                width: "4",
                height: "30",
                fill: "white"
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 43,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "8",
                y: "0",
                width: "4",
                height: "30",
                fill: "white"
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 44,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "16",
                y: "0",
                width: "4",
                height: "30",
                fill: "white"
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 45,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "0",
                y: "-2",
                width: "10",
                height: "3",
                fill: "#B22222"
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 46,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "10",
                y: "-2",
                width: "10",
                height: "3",
                fill: "#B22222"
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 47,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/games/CricketChallenge.tsx",
        lineNumber: 42,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
_c1 = Stumps;
const Bowler = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
        transform: `translate(${PITCH_WIDTH / 2 - 10}, 20)`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "10",
                cy: "10",
                r: "8",
                fill: "#FFADAD"
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 53,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "5",
                y: "18",
                width: "10",
                height: "25",
                fill: "#FFADAD"
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 54,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/games/CricketChallenge.tsx",
        lineNumber: 52,
        columnNumber: 6
    }, ("TURBOPACK compile-time value", void 0));
_c2 = Bowler;
const Batsman = ({ swinging })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
        transform: `translate(${PITCH_WIDTH / 2 - 15}, ${PITCH_HEIGHT - 60})`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "10",
                cy: "-25",
                r: "8",
                fill: "#F8F7F8"
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 60,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "5",
                y: "-17",
                width: "10",
                height: "25",
                fill: "#F8F7F8"
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 61,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "0",
                y: "8",
                width: "20",
                height: "4",
                fill: "#F8F7F8"
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 62,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "3",
                y: "12",
                width: "5",
                height: "15",
                fill: "#F8F7F8"
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 63,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "12",
                y: "12",
                width: "5",
                height: "15",
                fill: "#F8F7F8"
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 64,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Bat, {
                swinging: swinging
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 65,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/games/CricketChallenge.tsx",
        lineNumber: 59,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
_c3 = Batsman;
function CricketChallenge() {
    _s();
    const [gameState, setGameState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('setup');
    const [setupStep, setSetupStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('tournament');
    // Game Config State
    const [tournament, setTournament] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedTeam, setSelectedTeam] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [totalOvers, setTotalOvers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [score, setScore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [highScore, setHighScore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [ballsLeft, setBallsLeft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(6);
    const [ballPosition, setBallPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        x: PITCH_WIDTH / 2,
        y: BALL_START_Y
    });
    const batSwingingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const feedbackRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const animationFrameId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const lastTimeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CricketChallenge.useEffect": ()=>{
            const storedHighScore = localStorage.getItem('cricketHighScore');
            if (storedHighScore) setHighScore(parseInt(storedHighScore));
        }
    }["CricketChallenge.useEffect"], []);
    const resetGame = ()=>{
        setScore(0);
        setBallsLeft(totalOvers * 6);
        setBallPosition({
            x: PITCH_WIDTH / 2,
            y: BALL_START_Y
        });
        batSwingingRef.current = false;
        feedbackRef.current = null;
        setGameState('playing');
        setTimeout(()=>setGameState('ballInPlay'), 1000);
    };
    const handleConfigSelect = (step, value)=>{
        if (step === 'tournament') {
            setTournament(value);
            setSetupStep('team');
        } else if (step === 'team') {
            setSelectedTeam(value);
            setSetupStep('overs');
        } else if (step === 'overs') {
            setTotalOvers(value);
            setBallsLeft(value * 6);
            setGameState('playing');
            setTimeout(()=>setGameState('ballInPlay'), 1000);
        }
    };
    const handleSwing = ()=>{
        if (gameState !== 'ballInPlay' || batSwingingRef.current) return;
        batSwingingRef.current = true;
        setTimeout(()=>{
            batSwingingRef.current = false;
        }, 300);
        const impactDifference = Math.abs(ballPosition.y - SWEET_SPOT_Y);
        let runsScored = 0;
        let currentFeedback;
        let ballPath = {
            x: 0,
            y: 0
        };
        const randomAngle = (Math.random() - 0.5) * Math.PI / 3;
        if (impactDifference < 10) {
            runsScored = 6;
            currentFeedback = scoreMap.perfect;
            ballPath = {
                x: Math.sin(randomAngle) * 200,
                y: -250
            };
        } else if (impactDifference < 20) {
            runsScored = 4;
            currentFeedback = scoreMap.good;
            ballPath = {
                x: Math.sin(randomAngle) * 150,
                y: -200
            };
        } else if (impactDifference < 35) {
            runsScored = 2;
            currentFeedback = {
                text: `${runsScored} Runs`,
                color: "text-yellow-400"
            };
            ballPath = {
                x: (Math.random() > 0.5 ? 1 : -1) * 80,
                y: -150
            };
        } else if (impactDifference < 50) {
            runsScored = 1;
            currentFeedback = {
                text: `${runsScored} Run`,
                color: "text-orange-400"
            };
            ballPath = {
                x: (Math.random() > 0.5 ? 1 : -1) * 40,
                y: -100
            };
        } else {
            currentFeedback = {
                text: "OUT!",
                color: "text-red-500"
            };
        }
        feedbackRef.current = {
            ...currentFeedback,
            ballPath
        };
        const newScore = score + runsScored;
        setScore(newScore);
        if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('cricketHighScore', newScore.toString());
        }
        setGameState('paused');
    };
    const gameLoop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CricketChallenge.useCallback[gameLoop]": (timestamp)=>{
            if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
            const deltaTime = (timestamp - lastTimeRef.current) / 1000;
            if (gameState === 'ballInPlay') {
                setBallPosition({
                    "CricketChallenge.useCallback[gameLoop]": (prevPos)=>{
                        const newY = prevPos.y + BALL_SPEED * deltaTime;
                        if (newY > PITCH_HEIGHT) {
                            feedbackRef.current = {
                                text: "Missed!",
                                color: "text-red-500"
                            };
                            setGameState('paused');
                            return prevPos;
                        }
                        return {
                            ...prevPos,
                            y: newY
                        };
                    }
                }["CricketChallenge.useCallback[gameLoop]"]);
            }
            lastTimeRef.current = timestamp;
            animationFrameId.current = requestAnimationFrame(gameLoop);
        }
    }["CricketChallenge.useCallback[gameLoop]"], [
        gameState
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CricketChallenge.useEffect": ()=>{
            animationFrameId.current = requestAnimationFrame(gameLoop);
            return ({
                "CricketChallenge.useEffect": ()=>cancelAnimationFrame(animationFrameId.current)
            })["CricketChallenge.useEffect"];
        }
    }["CricketChallenge.useEffect"], [
        gameLoop
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CricketChallenge.useEffect": ()=>{
            if (gameState === 'paused') {
                const timeout = setTimeout({
                    "CricketChallenge.useEffect.timeout": ()=>{
                        if (ballsLeft - 1 <= 0) {
                            setGameState('gameOver');
                        } else {
                            setBallsLeft({
                                "CricketChallenge.useEffect.timeout": (b)=>b - 1
                            }["CricketChallenge.useEffect.timeout"]);
                            setBallPosition({
                                x: PITCH_WIDTH / 2,
                                y: BALL_START_Y
                            });
                            feedbackRef.current = null;
                            setGameState('playing');
                            setTimeout({
                                "CricketChallenge.useEffect.timeout": ()=>setGameState('ballInPlay')
                            }["CricketChallenge.useEffect.timeout"], 500);
                        }
                    }
                }["CricketChallenge.useEffect.timeout"], 1500);
                return ({
                    "CricketChallenge.useEffect": ()=>clearTimeout(timeout)
                })["CricketChallenge.useEffect"];
            }
        }
    }["CricketChallenge.useEffect"], [
        gameState,
        ballsLeft
    ]);
    const teamOptions = tournament === 'IPL' ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cricket$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["iplTeams"] : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cricket$2d$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["internationalTeams"];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            opacity: 0,
            scale: 0.9
        },
        animate: {
            opacity: 1,
            scale: 1
        },
        className: "w-full max-w-lg glass-card p-4 flex flex-col items-center gap-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-3xl font-headline text-accent-green",
                children: "Super Over Challenge"
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 200,
                columnNumber: 13
            }, this),
            gameState === 'setup' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                mode: "wait",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                    initial: {
                        opacity: 0,
                        x: 50
                    },
                    animate: {
                        opacity: 1,
                        x: 0
                    },
                    exit: {
                        opacity: 0,
                        x: -50
                    },
                    className: "w-full",
                    children: [
                        setupStep === 'tournament' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col items-center gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-xl font-bold text-accent-cyan",
                                    children: "Choose Tournament"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                    lineNumber: 213,
                                    columnNumber: 33
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn-glass w-full",
                                    onClick: ()=>handleConfigSelect('tournament', 'IPL'),
                                    children: "IPL"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                    lineNumber: 214,
                                    columnNumber: 33
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn-glass w-full",
                                    onClick: ()=>handleConfigSelect('tournament', 'ICC'),
                                    children: "ICC World Cup"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                    lineNumber: 215,
                                    columnNumber: 33
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/games/CricketChallenge.tsx",
                            lineNumber: 212,
                            columnNumber: 29
                        }, this),
                        setupStep === 'team' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-xl font-bold text-accent-cyan text-center mb-4",
                                    children: "Select Your Team"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                    lineNumber: 220,
                                    columnNumber: 33
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto",
                                    children: teamOptions.map((team)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "glass-card p-3 text-center cursor-pointer hover:border-accent-pink",
                                            onClick: ()=>handleConfigSelect('team', team),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                    src: team.logo,
                                                    alt: team.name,
                                                    className: "w-20 h-20 mx-auto object-contain mb-2"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                                    lineNumber: 224,
                                                    columnNumber: 45
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "font-bold text-sm",
                                                    children: team.name
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                                    lineNumber: 225,
                                                    columnNumber: 45
                                                }, this)
                                            ]
                                        }, team.name, true, {
                                            fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                            lineNumber: 223,
                                            columnNumber: 41
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                    lineNumber: 221,
                                    columnNumber: 33
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/games/CricketChallenge.tsx",
                            lineNumber: 219,
                            columnNumber: 29
                        }, this),
                        setupStep === 'overs' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col items-center gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-xl font-bold text-accent-cyan",
                                    children: "Choose Format"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                    lineNumber: 233,
                                    columnNumber: 33
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn-glass w-full",
                                    onClick: ()=>handleConfigSelect('overs', 1),
                                    children: "Super Over (1 Over)"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                    lineNumber: 234,
                                    columnNumber: 33
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn-glass w-full",
                                    onClick: ()=>handleConfigSelect('overs', 6),
                                    children: "Powerplay (6 Overs)"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                    lineNumber: 235,
                                    columnNumber: 33
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn-glass w-full",
                                    onClick: ()=>handleConfigSelect('overs', 20),
                                    children: "T20 Match (20 Overs)"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                    lineNumber: 236,
                                    columnNumber: 33
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn-glass w-full",
                                    onClick: ()=>handleConfigSelect('overs', 50),
                                    children: "ODI Match (50 Overs)"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                    lineNumber: 237,
                                    columnNumber: 33
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/games/CricketChallenge.tsx",
                            lineNumber: 232,
                            columnNumber: 29
                        }, this)
                    ]
                }, setupStep, true, {
                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                    lineNumber: 204,
                    columnNumber: 21
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                lineNumber: 203,
                columnNumber: 17
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between items-center w-full font-bold text-lg",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 text-accent-cyan",
                                children: [
                                    selectedTeam && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: selectedTeam.logo,
                                        alt: selectedTeam.name,
                                        className: "w-8 h-8"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                        lineNumber: 246,
                                        columnNumber: 45
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "Score: ",
                                            score
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                        lineNumber: 247,
                                        columnNumber: 28
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                lineNumber: 245,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-accent-pink",
                                children: [
                                    "Balls Left: ",
                                    ballsLeft
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                lineNumber: 249,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/CricketChallenge.tsx",
                        lineNumber: 244,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative cursor-pointer overflow-hidden rounded-lg bg-green-900/50",
                        style: {
                            width: PITCH_WIDTH,
                            height: PITCH_HEIGHT
                        },
                        onClick: handleSwing,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "100%",
                                height: "100%",
                                viewBox: `0 0 ${PITCH_WIDTH} ${PITCH_HEIGHT}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ellipse", {
                                        cx: PITCH_WIDTH / 2,
                                        cy: PITCH_HEIGHT / 2,
                                        rx: PITCH_WIDTH / 2 - 10,
                                        ry: PITCH_HEIGHT / 2 - 10,
                                        fill: "#4C9A2A"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                        lineNumber: 258,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                        x: PITCH_WIDTH / 2 - 40,
                                        y: 0,
                                        width: "80",
                                        height: PITCH_HEIGHT,
                                        fill: "#A0522D",
                                        opacity: "0.3"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                        lineNumber: 259,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                        x: PITCH_WIDTH / 2 - 2,
                                        y: "50",
                                        width: "4",
                                        height: PITCH_HEIGHT - 100,
                                        fill: "white",
                                        opacity: "0.4"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                        lineNumber: 260,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stumps, {
                                        y: 45
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                        lineNumber: 261,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stumps, {
                                        y: PITCH_HEIGHT - 65
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                        lineNumber: 262,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Bowler, {}, void 0, false, {
                                        fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                        lineNumber: 263,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Batsman, {
                                        swinging: batSwingingRef.current
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                        lineNumber: 264,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                lineNumber: 257,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                className: "absolute w-4 h-4 bg-white rounded-full shadow-lg",
                                animate: {
                                    top: ballPosition.y - BALL_SIZE / 2,
                                    left: ballPosition.x - BALL_SIZE / 2
                                },
                                transition: {
                                    duration: 0,
                                    ease: 'linear'
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                lineNumber: 267,
                                columnNumber: 25
                            }, this),
                            feedbackRef.current?.ballPath && gameState === 'paused' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                className: "absolute w-5 h-5 bg-white rounded-full shadow-lg z-20",
                                initial: {
                                    x: ballPosition.x - BALL_SIZE / 2,
                                    y: ballPosition.y - BALL_SIZE / 2
                                },
                                animate: {
                                    x: ballPosition.x + feedbackRef.current.ballPath.x,
                                    y: ballPosition.y + feedbackRef.current.ballPath.y,
                                    opacity: 0
                                },
                                transition: {
                                    duration: 0.8,
                                    ease: "easeOut"
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                lineNumber: 277,
                                columnNumber: 29
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                children: gameState === 'gameOver' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                    initial: {
                                        opacity: 0
                                    },
                                    animate: {
                                        opacity: 1
                                    },
                                    className: "absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 z-10",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trophy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trophy$3e$__["Trophy"], {
                                            className: "mx-auto mb-2 text-brand-gold",
                                            size: 32
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                            lineNumber: 296,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-2xl font-bold text-accent-cyan",
                                            children: "Game Over"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                            lineNumber: 297,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-300",
                                            children: [
                                                "Your final score: ",
                                                score
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                            lineNumber: 298,
                                            columnNumber: 33
                                        }, this),
                                        score > 0 && score >= highScore && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "font-bold text-brand-gold animate-pulse",
                                            children: "New High Score!"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                            lineNumber: 299,
                                            columnNumber: 69
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setGameState('setup'),
                                            className: "btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                                    size: 16
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                                    lineNumber: 301,
                                                    columnNumber: 37
                                                }, this),
                                                " Play Again"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                            lineNumber: 300,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                    lineNumber: 291,
                                    columnNumber: 29
                                }, this) : feedbackRef.current && gameState === 'paused' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                    initial: {
                                        opacity: 0,
                                        scale: 0.5
                                    },
                                    animate: {
                                        opacity: 1,
                                        scale: 1.5
                                    },
                                    exit: {
                                        opacity: 0
                                    },
                                    className: `absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-extrabold drop-shadow-lg ${feedbackRef.current.color}`,
                                    children: feedbackRef.current.text
                                }, feedbackRef.current.text + score, false, {
                                    fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                    lineNumber: 305,
                                    columnNumber: 30
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                lineNumber: 289,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/CricketChallenge.tsx",
                        lineNumber: 252,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setGameState('setup'),
                        className: "btn-glass bg-accent-purple/20 text-accent-purple flex items-center gap-2 mt-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                size: 16
                            }, void 0, false, {
                                fileName: "[project]/src/components/games/CricketChallenge.tsx",
                                lineNumber: 318,
                                columnNumber: 25
                            }, this),
                            " Change Settings"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/games/CricketChallenge.tsx",
                        lineNumber: 317,
                        columnNumber: 22
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/games/CricketChallenge.tsx",
        lineNumber: 195,
        columnNumber: 9
    }, this);
}
_s(CricketChallenge, "zHzde+itRxh8zzca/JiaFU5Qmww=");
_c4 = CricketChallenge;
var _c, _c1, _c2, _c3, _c4;
__turbopack_context__.k.register(_c, "Bat");
__turbopack_context__.k.register(_c1, "Stumps");
__turbopack_context__.k.register(_c2, "Bowler");
__turbopack_context__.k.register(_c3, "Batsman");
__turbopack_context__.k.register(_c4, "CricketChallenge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/AdBanner.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdBanner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$firebaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/firebaseClient.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getFirestore"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$firebaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["app"]);
const FlixTrendAd = ({ ad })=>{
    if (!ad?.creative) {
        return null; // Don't render if creative is missing
    }
    const { creative } = ad;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full glass-card p-4 my-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2 mb-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-8 h-8 rounded-full bg-accent-purple overflow-hidden",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: `https://api.dicebear.com/8.x/initials/svg?seed=${ad.campaign.name}`,
                            alt: "advertiser logo",
                            className: "w-full h-full"
                        }, void 0, false, {
                            fileName: "[project]/src/components/AdBanner.tsx",
                            lineNumber: 23,
                            columnNumber: 21
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/src/components/AdBanner.tsx",
                        lineNumber: 21,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm font-bold",
                                children: ad.campaign.name
                            }, void 0, false, {
                                fileName: "[project]/src/components/AdBanner.tsx",
                                lineNumber: 26,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-400",
                                children: "Sponsored"
                            }, void 0, false, {
                                fileName: "[project]/src/components/AdBanner.tsx",
                                lineNumber: 27,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AdBanner.tsx",
                        lineNumber: 25,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/AdBanner.tsx",
                lineNumber: 20,
                columnNumber: 14
            }, ("TURBOPACK compile-time value", void 0)),
            creative.type === 'image' && creative.mediaUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                src: creative.mediaUrl,
                alt: creative.headline,
                className: "rounded-lg w-full"
            }, void 0, false, {
                fileName: "[project]/src/components/AdBanner.tsx",
                lineNumber: 31,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)),
            creative.type === 'video' && creative.mediaUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                src: creative.mediaUrl,
                className: "rounded-lg w-full",
                controls: true
            }, void 0, false, {
                fileName: "[project]/src/components/AdBanner.tsx",
                lineNumber: 34,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-bold text-accent-cyan",
                        children: creative.headline
                    }, void 0, false, {
                        fileName: "[project]/src/components/AdBanner.tsx",
                        lineNumber: 37,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-300",
                        children: creative.body
                    }, void 0, false, {
                        fileName: "[project]/src/components/AdBanner.tsx",
                        lineNumber: 38,
                        columnNumber: 17
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: creative.callToActionUrl,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-xs text-accent-pink hover:underline mt-2 inline-block",
                        children: [
                            creative.callToAction,
                            " →"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AdBanner.tsx",
                        lineNumber: 39,
                        columnNumber: 18
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/AdBanner.tsx",
                lineNumber: 36,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/AdBanner.tsx",
        lineNumber: 19,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0));
};
_c = FlixTrendAd;
function AdBanner() {
    _s();
    const [ad, setAd] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdBanner.useEffect": ()=>{
            const fetchAd = {
                "AdBanner.useEffect.fetchAd": async ()=>{
                    try {
                        // This logic is simplified. A real ad server would be much more complex.
                        // 1. Get a random active campaign
                        const campaignsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["collection"])(db, 'adCampaigns');
                        const q = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["query"])(campaignsRef, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["where"])('status', '==', 'active'), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["limit"])(10));
                        const campaignSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDocs"])(q);
                        if (campaignSnap.empty) {
                            return; // No active campaigns
                        }
                        const campaigns = campaignSnap.docs.map({
                            "AdBanner.useEffect.fetchAd.campaigns": (doc)=>({
                                    id: doc.id,
                                    ...doc.data()
                                })
                        }["AdBanner.useEffect.fetchAd.campaigns"]);
                        const randomCampaign = campaigns[Math.floor(Math.random() * campaigns.length)];
                        // 2. Get a creative for that campaign
                        const creativesRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["collection"])(db, 'adCampaigns', randomCampaign.id, 'creatives');
                        const creativeSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDocs"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["query"])(creativesRef, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["limit"])(1)));
                        if (creativeSnap.empty) {
                            return; // No creative found
                        }
                        const randomCreative = {
                            id: creativeSnap.docs[0].id,
                            ...creativeSnap.docs[0].data()
                        };
                        setAd({
                            campaign: randomCampaign,
                            creative: randomCreative
                        });
                    } catch (error) {
                        console.error("Error fetching FlixTrend ad:", error);
                    }
                }
            }["AdBanner.useEffect.fetchAd"];
            fetchAd();
        }
    }["AdBanner.useEffect"], []);
    // If we have a direct-sold ad, render it. Otherwise, render nothing.
    if (ad) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FlixTrendAd, {
            ad: ad
        }, void 0, false, {
            fileName: "[project]/src/components/AdBanner.tsx",
            lineNumber: 87,
            columnNumber: 16
        }, this);
    }
    return null;
}
_s(AdBanner, "NP5ThXyZl23+ftsijN6HEKuio+Q=");
_c1 = AdBanner;
var _c, _c1;
__turbopack_context__.k.register(_c, "FlixTrendAd");
__turbopack_context__.k.register(_c1, "AdBanner");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/AdModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AdBanner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/AdBanner.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function AdModal({ onComplete }) {
    _s();
    const [countdown, setCountdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(5);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdModal.useEffect": ()=>{
            if (countdown <= 0) {
                onComplete();
                return;
            }
            const timer = setTimeout({
                "AdModal.useEffect.timer": ()=>setCountdown({
                        "AdModal.useEffect.timer": (c)=>c - 1
                    }["AdModal.useEffect.timer"])
            }["AdModal.useEffect.timer"], 1000);
            return ({
                "AdModal.useEffect": ()=>clearTimeout(timer)
            })["AdModal.useEffect"];
        }
    }["AdModal.useEffect"], [
        countdown,
        onComplete
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
            initial: {
                opacity: 0
            },
            animate: {
                opacity: 1
            },
            exit: {
                opacity: 0
            },
            className: "fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-4 right-4 z-10",
                    children: countdown > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-white bg-black/50 rounded-full px-3 py-1 text-sm",
                        children: [
                            "You can skip in ",
                            countdown
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AdModal.tsx",
                        lineNumber: 31,
                        columnNumber: 25
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onComplete,
                        className: "text-white bg-black/50 rounded-full px-4 py-2 text-sm flex items-center gap-2",
                        children: [
                            "Skip Ad ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 16
                            }, void 0, false, {
                                fileName: "[project]/src/components/AdModal.tsx",
                                lineNumber: 34,
                                columnNumber: 37
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/AdModal.tsx",
                        lineNumber: 33,
                        columnNumber: 25
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/AdModal.tsx",
                    lineNumber: 29,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full max-w-sm",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AdBanner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/src/components/AdModal.tsx",
                        lineNumber: 39,
                        columnNumber: 21
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/AdModal.tsx",
                    lineNumber: 38,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-xs text-gray-500 mt-4",
                    children: "Sponsored Message"
                }, void 0, false, {
                    fileName: "[project]/src/components/AdModal.tsx",
                    lineNumber: 41,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/AdModal.tsx",
            lineNumber: 23,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/AdModal.tsx",
        lineNumber: 22,
        columnNumber: 9
    }, this);
}
_s(AdModal, "5IyNxS0sv4AHO/4kY6tmyq4YYJY=");
_c = AdModal;
var _c;
__turbopack_context__.k.register(_c, "AdModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/GamePlayer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GamePlayer",
    ()=>GamePlayer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-client] (ecmascript) <export default as ArrowLeft>");
"use client";
;
;
function GamePlayer({ game, onBack }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full flex flex-col items-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full max-w-4xl flex items-center justify-between mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-headline font-bold text-accent-cyan",
                                children: game.title
                            }, void 0, false, {
                                fileName: "[project]/src/components/GamePlayer.tsx",
                                lineNumber: 12,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-400",
                                children: [
                                    "by ",
                                    game.username
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GamePlayer.tsx",
                                lineNumber: 13,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GamePlayer.tsx",
                        lineNumber: 11,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn-glass flex items-center gap-2",
                        onClick: onBack,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                size: 16
                            }, void 0, false, {
                                fileName: "[project]/src/components/GamePlayer.tsx",
                                lineNumber: 16,
                                columnNumber: 11
                            }, this),
                            " Back to Games"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GamePlayer.tsx",
                        lineNumber: 15,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/GamePlayer.tsx",
                lineNumber: 10,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden border-2 border-accent-cyan",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("iframe", {
                    src: game.gameUrl,
                    sandbox: "allow-scripts allow-same-origin",
                    className: "w-full h-full border-0",
                    title: game.title
                }, void 0, false, {
                    fileName: "[project]/src/components/GamePlayer.tsx",
                    lineNumber: 20,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/GamePlayer.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-center text-gray-400 mt-4 max-w-4xl",
                children: game.description
            }, void 0, false, {
                fileName: "[project]/src/components/GamePlayer.tsx",
                lineNumber: 27,
                columnNumber: 8
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/GamePlayer.tsx",
        lineNumber: 9,
        columnNumber: 5
    }, this);
}
_c = GamePlayer;
var _c;
__turbopack_context__.k.register(_c, "GamePlayer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/GamesHub.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GamesHub",
    ()=>GamesHub
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-left.js [app-client] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gamepad$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gamepad2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/gamepad-2.js [app-client] (ecmascript) <export default as Gamepad2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$games$2f$TicTacToe$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/games/TicTacToe.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$games$2f$Snake$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/games/Snake.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$games$2f$2048$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/games/2048.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$games$2f$Match3$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/games/Match3.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$games$2f$BrickBreaker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/games/BrickBreaker.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$games$2f$CricketChallenge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/games/CricketChallenge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AdModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/AdModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$firebaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/firebaseClient.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$GamePlayer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/GamePlayer.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
;
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getFirestore"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$firebaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["app"]);
const games = [
    {
        id: 'tic-tac-toe',
        name: "Tic-Tac-Toe",
        description: "The classic offline and online game. Challenge a friend to a match.",
        component: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$games$2f$TicTacToe$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TicTacToe"]
    },
    {
        id: 'snake',
        name: "Snake",
        description: "A timeless arcade classic. Guide the snake to eat the food and grow longer, but don't hit the walls or yourself!",
        component: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$games$2f$Snake$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Snake"]
    },
    {
        id: '2048',
        name: "2048",
        description: "An addictive puzzle game. Swipe to slide tiles and combine them to reach the 2048 tile!",
        component: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$games$2f$2048$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Game2048"]
    },
    {
        id: 'match3',
        name: "Match-3 Madness",
        description: "A colorful and addictive gem-matching puzzle game with levels and objectives.",
        component: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$games$2f$Match3$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Match3"]
    },
    {
        id: 'brick-breaker',
        name: "Brick Breaker",
        description: "A classic arcade challenge. Break all the bricks with the ball and paddle to clear levels.",
        component: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$games$2f$BrickBreaker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BrickBreaker"]
    },
    {
        id: 'cricket-challenge',
        name: "Super Over Challenge",
        description: "A fast-paced cricket batting game. Choose your team and format, and score as many runs as you can!",
        component: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$games$2f$CricketChallenge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CricketChallenge"]
    }
];
function GamesHub() {
    _s();
    const [activeGame, setActiveGame] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showAd, setShowAd] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [gameToStart, setGameToStart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [developerGames, setDeveloperGames] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GamesHub.useEffect": ()=>{
            const q = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["query"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["collection"])(db, "games"), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["orderBy"])("createdAt", "desc"));
            const unsub = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onSnapshot"])(q, {
                "GamesHub.useEffect.unsub": (snapshot)=>{
                    setDeveloperGames(snapshot.docs.map({
                        "GamesHub.useEffect.unsub": (doc)=>({
                                id: doc.id,
                                ...doc.data(),
                                isDevGame: true
                            })
                    }["GamesHub.useEffect.unsub"]));
                }
            }["GamesHub.useEffect.unsub"]);
            return ({
                "GamesHub.useEffect": ()=>unsub()
            })["GamesHub.useEffect"];
        }
    }["GamesHub.useEffect"], []);
    const handleSelectGame = (game)=>{
        setGameToStart(game);
        setShowAd(true);
    };
    const startGame = ()=>{
        setShowAd(false);
        if (gameToStart) {
            setActiveGame(gameToStart);
            setGameToStart(null);
        }
    };
    if (activeGame) {
        const GameComponent = activeGame.component;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full flex flex-col items-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>setActiveGame(null),
                    className: "btn-glass self-start mb-4 flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                            size: 16
                        }, void 0, false, {
                            fileName: "[project]/src/components/GamesHub.tsx",
                            lineNumber: 90,
                            columnNumber: 21
                        }, this),
                        " Back to Games"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/GamesHub.tsx",
                    lineNumber: 89,
                    columnNumber: 17
                }, this),
                activeGame.isDevGame ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$GamePlayer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GamePlayer"], {
                    game: activeGame,
                    onBack: ()=>setActiveGame(null)
                }, void 0, false, {
                    fileName: "[project]/src/components/GamesHub.tsx",
                    lineNumber: 92,
                    columnNumber: 42
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(GameComponent, {}, void 0, false, {
                    fileName: "[project]/src/components/GamesHub.tsx",
                    lineNumber: 92,
                    columnNumber: 112
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/GamesHub.tsx",
            lineNumber: 88,
            columnNumber: 14
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full flex flex-col items-center",
        children: [
            showAd && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AdModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                onComplete: startGame
            }, void 0, false, {
                fileName: "[project]/src/components/GamesHub.tsx",
                lineNumber: 100,
                columnNumber: 17
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-3xl font-headline bg-gradient-to-r from-accent-pink to-accent-green bg-clip-text text-transparent mb-8",
                children: "Community Games"
            }, void 0, false, {
                fileName: "[project]/src/components/GamesHub.tsx",
                lineNumber: 102,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-center text-gray-400 mb-12 max-w-2xl",
                children: "Challenge a friend, play a quick game solo, or explore games made by other developers in the community!"
            }, void 0, false, {
                fileName: "[project]/src/components/GamesHub.tsx",
                lineNumber: 106,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full space-y-12",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].section, {
                        initial: {
                            opacity: 0,
                            y: 20
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            duration: 0.5,
                            delay: 0.1
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-xl font-bold text-accent-cyan mb-4",
                                children: "FlixTrend Classics"
                            }, void 0, false, {
                                fileName: "[project]/src/components/GamesHub.tsx",
                                lineNumber: 116,
                                columnNumber: 22
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                                children: games.map((game)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                        className: "glass-card p-6 flex flex-col gap-3 hover:border-accent-cyan transition-colors duration-300 cursor-pointer",
                                        whileHover: {
                                            y: -5
                                        },
                                        onClick: ()=>handleSelectGame(game),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gamepad$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gamepad2$3e$__["Gamepad2"], {
                                                className: "text-accent-pink"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/GamesHub.tsx",
                                                lineNumber: 125,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                className: "font-bold text-lg text-accent-cyan",
                                                children: game.name
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/GamesHub.tsx",
                                                lineNumber: 126,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-gray-400 flex-1",
                                                children: game.description
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/GamesHub.tsx",
                                                lineNumber: 127,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-right text-xs font-bold text-accent-pink",
                                                children: "Play Now →"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/GamesHub.tsx",
                                                lineNumber: 128,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, game.id, true, {
                                        fileName: "[project]/src/components/GamesHub.tsx",
                                        lineNumber: 119,
                                        columnNumber: 29
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/GamesHub.tsx",
                                lineNumber: 117,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GamesHub.tsx",
                        lineNumber: 111,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].section, {
                        initial: {
                            opacity: 0,
                            y: 20
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            duration: 0.5,
                            delay: 0.3
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-xl font-bold text-accent-cyan mb-4",
                                children: "Developer Showcase"
                            }, void 0, false, {
                                fileName: "[project]/src/components/GamesHub.tsx",
                                lineNumber: 139,
                                columnNumber: 22
                            }, this),
                            developerGames.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                                children: developerGames.map((game)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                        className: "glass-card p-6 flex flex-col gap-3 hover:border-accent-green transition-colors duration-300 cursor-pointer",
                                        whileHover: {
                                            y: -5
                                        },
                                        onClick: ()=>handleSelectGame(game),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$gamepad$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Gamepad2$3e$__["Gamepad2"], {
                                                className: "text-accent-green"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/GamesHub.tsx",
                                                lineNumber: 149,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                className: "font-bold text-lg text-accent-green",
                                                children: game.title
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/GamesHub.tsx",
                                                lineNumber: 150,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-gray-400 flex-1",
                                                children: game.description
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/GamesHub.tsx",
                                                lineNumber: 151,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-right text-xs font-bold text-accent-green",
                                                children: "Play Now →"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/GamesHub.tsx",
                                                lineNumber: 152,
                                                columnNumber: 37
                                            }, this)
                                        ]
                                    }, game.id, true, {
                                        fileName: "[project]/src/components/GamesHub.tsx",
                                        lineNumber: 143,
                                        columnNumber: 33
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/GamesHub.tsx",
                                lineNumber: 141,
                                columnNumber: 26
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-500 text-center",
                                children: "No developer games have been published yet."
                            }, void 0, false, {
                                fileName: "[project]/src/components/GamesHub.tsx",
                                lineNumber: 156,
                                columnNumber: 26
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GamesHub.tsx",
                        lineNumber: 134,
                        columnNumber: 18
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/GamesHub.tsx",
                lineNumber: 110,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/GamesHub.tsx",
        lineNumber: 98,
        columnNumber: 9
    }, this);
}
_s(GamesHub, "puX4JpDGk7XhsfyQLHe2YTwH9wc=");
_c = GamesHub;
var _c;
__turbopack_context__.k.register(_c, "GamesHub");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/GamesHub.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/GamesHub.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=src_f6af68a8._.js.map