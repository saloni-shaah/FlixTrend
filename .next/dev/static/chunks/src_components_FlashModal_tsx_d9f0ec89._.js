(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/FlashModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FlashModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FlixTrendLogo$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/FlixTrendLogo.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AdBanner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/AdBanner.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/send.js [app-client] (ecmascript) <export default as Send>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$firebaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/firebaseClient.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$AppStateContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/AppStateContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getFirestore"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$firebaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["app"]);
const Watermark = ({ isAnimated = false })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `absolute flex items-center gap-1.5 bg-black/40 text-white py-1 px-2 rounded-full text-xs pointer-events-none z-10 ${isAnimated ? 'animate-[float-watermark_10s_ease-in-out_infinite]' : 'bottom-2 right-2'}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FlixTrendLogo$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FlixTrendLogo"], {
                size: 16
            }, void 0, false, {
                fileName: "[project]/src/components/FlashModal.tsx",
                lineNumber: 21,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-bold",
                children: "FlixTrend"
            }, void 0, false, {
                fileName: "[project]/src/components/FlashModal.tsx",
                lineNumber: 22,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/FlashModal.tsx",
        lineNumber: 16,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
_c = Watermark;
function AdView({ onSkip }) {
    _s();
    const [countdown, setCountdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(5);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdView.useEffect": ()=>{
            if (countdown <= 0) return;
            const timer = setTimeout({
                "AdView.useEffect.timer": ()=>setCountdown({
                        "AdView.useEffect.timer": (c)=>c - 1
                    }["AdView.useEffect.timer"])
            }["AdView.useEffect.timer"], 1000);
            return ({
                "AdView.useEffect": ()=>clearTimeout(timer)
            })["AdView.useEffect"];
        }
    }["AdView.useEffect"], [
        countdown
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full bg-black flex flex-col items-center justify-center relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-4 right-4 z-10",
                children: countdown > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-white bg-black/50 rounded-full px-3 py-1 text-sm",
                    children: [
                        "Skip in ",
                        countdown
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/FlashModal.tsx",
                    lineNumber: 39,
                    columnNumber: 21
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: onSkip,
                    className: "text-white bg-black/50 rounded-full px-4 py-2 text-sm flex items-center gap-2",
                    children: [
                        "Skip Ad ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                            size: 16
                        }, void 0, false, {
                            fileName: "[project]/src/components/FlashModal.tsx",
                            lineNumber: 42,
                            columnNumber: 33
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/FlashModal.tsx",
                    lineNumber: 41,
                    columnNumber: 21
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/FlashModal.tsx",
                lineNumber: 37,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full max-w-sm",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AdBanner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/src/components/FlashModal.tsx",
                    lineNumber: 47,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/FlashModal.tsx",
                lineNumber: 46,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-gray-500 absolute bottom-4",
                children: "This is a sponsored message."
            }, void 0, false, {
                fileName: "[project]/src/components/FlashModal.tsx",
                lineNumber: 49,
                columnNumber: 14
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/FlashModal.tsx",
        lineNumber: 36,
        columnNumber: 9
    }, this);
}
_s(AdView, "5IyNxS0sv4AHO/4kY6tmyq4YYJY=");
_c1 = AdView;
function FlashInteraction({ flash, currentUser, onClose }) {
    _s1();
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const emojis = [
        '❤️',
        '😂',
        '😮',
        '😢',
        '🔥',
        '👍'
    ];
    const getChatId = (uid1, uid2)=>[
            uid1,
            uid2
        ].sort().join("_");
    const handleSend = async (text)=>{
        if (!text.trim() || !currentUser || !flash) return;
        const chatId = getChatId(currentUser.uid, flash.userId);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["collection"])(db, "chats", chatId, "messages"), {
            text: text,
            sender: currentUser.uid,
            createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverTimestamp"])(),
            type: 'flash_reply',
            readBy: [
                currentUser.uid
            ],
            flash_preview: {
                mediaUrl: flash.mediaUrl,
                caption: flash.caption || ''
            }
        });
        // Potentially close the modal or show a "Sent!" confirmation
        onClose();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "absolute bottom-4 left-4 right-4 z-20 flex items-center gap-2",
        onClick: (e)=>e.stopPropagation(),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "text",
                value: message,
                onChange: (e)=>setMessage(e.target.value),
                placeholder: "Send a message...",
                className: "input-glass flex-1 text-sm",
                onKeyDown: (e)=>{
                    if (e.key === 'Enter' && message.trim()) {
                        handleSend(message);
                    }
                }
            }, void 0, false, {
                fileName: "[project]/src/components/FlashModal.tsx",
                lineNumber: 81,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>handleSend(message),
                disabled: !message.trim(),
                className: "p-3 rounded-full bg-accent-cyan text-black disabled:bg-gray-600",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$send$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Send$3e$__["Send"], {
                    size: 16
                }, void 0, false, {
                    fileName: "[project]/src/components/FlashModal.tsx",
                    lineNumber: 98,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/FlashModal.tsx",
                lineNumber: 93,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-1",
                children: emojis.map((emoji)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "text-2xl hover:scale-125 transition-transform",
                        onClick: ()=>handleSend(emoji),
                        children: emoji
                    }, emoji, false, {
                        fileName: "[project]/src/components/FlashModal.tsx",
                        lineNumber: 102,
                        columnNumber: 21
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/FlashModal.tsx",
                lineNumber: 100,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/FlashModal.tsx",
        lineNumber: 80,
        columnNumber: 9
    }, this);
}
_s1(FlashInteraction, "l8KXAebGu4sZHsyCIQX7P8si41w=");
_c2 = FlashInteraction;
function FlashModal({ userFlashes, onClose }) {
    _s2();
    const [currentUserFlashesIndex, setCurrentUserFlashesIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [currentFlashIndex, setCurrentFlashIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [viewedCount, setViewedCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [showAd, setShowAd] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [progress, setProgress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const videoRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const audioRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const timerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const touchStartX = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const { setSelectedChat } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$AppStateContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppState"])();
    const currentUser = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$firebaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"].currentUser;
    const AD_INTERVAL = 9;
    const allFlashes = Array.isArray(userFlashes) ? userFlashes : [
        userFlashes
    ];
    const handleClose = ()=>{
        onClose(allFlashes[currentUserFlashesIndex]?.userId);
    };
    const goToNext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FlashModal.useCallback[goToNext]": ()=>{
            // Check for ad break first
            if ((viewedCount + 1) % AD_INTERVAL === 0 && viewedCount > 0) {
                setShowAd(true);
                setViewedCount(0); // Reset counter after ad
                return;
            }
            setViewedCount({
                "FlashModal.useCallback[goToNext]": (v)=>v + 1
            }["FlashModal.useCallback[goToNext]"]);
            // Progression logic
            const currentUserFlashGroup = allFlashes[currentUserFlashesIndex];
            if (currentFlashIndex < currentUserFlashGroup.flashes.length - 1) {
                setCurrentFlashIndex({
                    "FlashModal.useCallback[goToNext]": (i)=>i + 1
                }["FlashModal.useCallback[goToNext]"]);
            } else {
                if (currentUserFlashesIndex < allFlashes.length - 1) {
                    setCurrentUserFlashesIndex({
                        "FlashModal.useCallback[goToNext]": (i)=>i + 1
                    }["FlashModal.useCallback[goToNext]"]);
                    setCurrentFlashIndex(0);
                } else {
                    handleClose(); // End of all flashes
                }
            }
        }
    }["FlashModal.useCallback[goToNext]"], [
        allFlashes,
        currentFlashIndex,
        currentUserFlashesIndex,
        handleClose,
        viewedCount,
        AD_INTERVAL
    ]);
    const goToPrev = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FlashModal.useCallback[goToPrev]": ()=>{
            if (currentFlashIndex > 0) {
                setCurrentFlashIndex({
                    "FlashModal.useCallback[goToPrev]": (i)=>i - 1
                }["FlashModal.useCallback[goToPrev]"]);
            } else if (currentUserFlashesIndex > 0) {
                const prevUserIndex = currentUserFlashesIndex - 1;
                setCurrentUserFlashesIndex(prevUserIndex);
                setCurrentFlashIndex(allFlashes[prevUserIndex].flashes.length - 1);
            }
        }
    }["FlashModal.useCallback[goToPrev]"], [
        allFlashes,
        currentFlashIndex,
        currentUserFlashesIndex
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FlashModal.useEffect": ()=>{
            if (showAd) {
                if (timerRef.current) clearTimeout(timerRef.current);
                if (audioRef.current) audioRef.current.pause();
                return;
            }
            const flash = allFlashes[currentUserFlashesIndex]?.flashes[currentFlashIndex];
            if (!flash) return;
            const isVideo = flash.mediaUrl && (flash.mediaUrl.includes('.mp4') || flash.mediaUrl.includes('.webm') || flash.mediaUrl.includes('.ogg'));
            setProgress(0);
            if (timerRef.current) clearTimeout(timerRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (flash.song?.preview_url) {
                const audio = new Audio(flash.song.preview_url);
                audioRef.current = audio;
                audio.currentTime = flash.song.snippetStart || 0;
                audio.play().catch({
                    "FlashModal.useEffect": (e)=>console.error("Audio play failed", e)
                }["FlashModal.useEffect"]);
                audio.addEventListener('ended', goToNext);
            }
            if (!isVideo) {
                timerRef.current = setTimeout(goToNext, 15000);
                requestAnimationFrame({
                    "FlashModal.useEffect": ()=>{
                        setProgress(100);
                    }
                }["FlashModal.useEffect"]);
            } else {
                setProgress(0);
            }
            return ({
                "FlashModal.useEffect": ()=>{
                    if (timerRef.current) clearTimeout(timerRef.current);
                    if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.removeEventListener('ended', goToNext);
                    }
                }
            })["FlashModal.useEffect"];
        }
    }["FlashModal.useEffect"], [
        currentUserFlashesIndex,
        currentFlashIndex,
        allFlashes,
        goToNext,
        showAd
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FlashModal.useEffect": ()=>{
            const handleKeyDown = {
                "FlashModal.useEffect.handleKeyDown": (e)=>{
                    if (showAd) return;
                    if (e.key === 'ArrowRight') goToNext();
                    if (e.key === 'ArrowLeft') goToPrev();
                }
            }["FlashModal.useEffect.handleKeyDown"];
            window.addEventListener('keydown', handleKeyDown);
            return ({
                "FlashModal.useEffect": ()=>window.removeEventListener('keydown', handleKeyDown)
            })["FlashModal.useEffect"];
        }
    }["FlashModal.useEffect"], [
        goToNext,
        goToPrev,
        showAd
    ]);
    const handleContainerClick = (e)=>{
        if (showAd) return;
        const { clientX, currentTarget } = e;
        const { left, width } = currentTarget.getBoundingClientRect();
        const clickPosition = clientX - left;
        if (clickPosition < width / 3) {
            goToPrev();
        } else {
            goToNext();
        }
    };
    const handleTouchStart = (e)=>{
        if (showAd) return;
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e)=>{
        if (showAd) return;
        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchEndX - touchStartX.current;
        if (Math.abs(deltaX) > 50) {
            if (deltaX < 0) goToNext();
            else goToPrev();
        }
    };
    const handleVideoTimeUpdate = ()=>{
        if (videoRef.current && videoRef.current.duration) {
            setProgress(videoRef.current.currentTime / videoRef.current.duration * 100);
        }
    };
    const handleVideoEnded = ()=>{
        goToNext();
    };
    const handleAdSkip = ()=>{
        setShowAd(false);
        // Immediately go to the next flash without incrementing viewedCount again
        const currentUserFlashGroup = allFlashes[currentUserFlashesIndex];
        if (currentFlashIndex < currentUserFlashGroup.flashes.length - 1) {
            setCurrentFlashIndex((i)=>i + 1);
        } else {
            if (currentUserFlashesIndex < allFlashes.length - 1) {
                setCurrentUserFlashesIndex((i)=>i + 1);
                setCurrentFlashIndex(0);
            } else {
                handleClose();
            }
        }
    };
    if (showAd) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "fixed inset-0 z-50 flex items-center justify-center bg-black/90",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative w-full max-w-lg h-[90vh] flex flex-col items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AdView, {
                    onSkip: handleAdSkip
                }, void 0, false, {
                    fileName: "[project]/src/components/FlashModal.tsx",
                    lineNumber: 279,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/FlashModal.tsx",
                lineNumber: 278,
                columnNumber: 14
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/FlashModal.tsx",
            lineNumber: 277,
            columnNumber: 11
        }, this);
    }
    const currentFlashUser = allFlashes[currentUserFlashesIndex];
    if (!currentFlashUser) return null;
    const currentFlash = currentFlashUser.flashes[currentFlashIndex];
    if (!currentFlash) return null;
    const isVideo = currentFlash.mediaUrl && (currentFlash.mediaUrl.includes('.mp4') || currentFlash.mediaUrl.includes('.webm') || currentFlash.mediaUrl.includes('.ogg'));
    const duration = isVideo ? videoRef.current?.duration || 15 : 15;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/90",
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative w-full max-w-lg h-[90vh] flex flex-col items-center justify-center cursor-pointer",
            onClick: handleContainerClick,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: (e)=>{
                        e.stopPropagation();
                        handleClose();
                    },
                    className: "absolute top-2 right-2 text-white text-3xl z-20",
                    children: "×"
                }, void 0, false, {
                    fileName: "[project]/src/components/FlashModal.tsx",
                    lineNumber: 297,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-4 left-2 right-2 flex gap-1 z-20",
                    children: currentFlashUser.flashes.map((_, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 h-1 bg-white/30 rounded-full overflow-hidden",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-full bg-white rounded-full",
                                style: {
                                    width: `${idx < currentFlashIndex ? 100 : idx === currentFlashIndex ? progress : 0}%`,
                                    transition: idx === currentFlashIndex && !isVideo ? `width ${duration}s linear` : 'none'
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/components/FlashModal.tsx",
                                lineNumber: 302,
                                columnNumber: 21
                            }, this)
                        }, idx, false, {
                            fileName: "[project]/src/components/FlashModal.tsx",
                            lineNumber: 301,
                            columnNumber: 17
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/components/FlashModal.tsx",
                    lineNumber: 299,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full h-full relative",
                    children: isVideo ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-full h-full",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                                ref: videoRef,
                                src: currentFlash.mediaUrl,
                                className: "w-full h-full object-contain",
                                autoPlay: true,
                                onTimeUpdate: handleVideoTimeUpdate,
                                onEnded: handleVideoEnded
                            }, void 0, false, {
                                fileName: "[project]/src/components/FlashModal.tsx",
                                lineNumber: 316,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Watermark, {
                                isAnimated: true
                            }, void 0, false, {
                                fileName: "[project]/src/components/FlashModal.tsx",
                                lineNumber: 324,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/FlashModal.tsx",
                        lineNumber: 315,
                        columnNumber: 17
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-full h-full",
                        children: [
                            currentFlash.mediaUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: currentFlash.mediaUrl,
                                alt: "flash",
                                className: "w-full h-full object-contain"
                            }, void 0, false, {
                                fileName: "[project]/src/components/FlashModal.tsx",
                                lineNumber: 328,
                                columnNumber: 47
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Watermark, {}, void 0, false, {
                                fileName: "[project]/src/components/FlashModal.tsx",
                                lineNumber: 329,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/FlashModal.tsx",
                        lineNumber: 327,
                        columnNumber: 17
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/FlashModal.tsx",
                    lineNumber: 313,
                    columnNumber: 9
                }, this),
                currentFlash.caption && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute bottom-20 left-4 right-4 text-white text-center font-semibold p-2 bg-black/50 rounded-lg",
                    children: currentFlash.caption
                }, void 0, false, {
                    fileName: "[project]/src/components/FlashModal.tsx",
                    lineNumber: 335,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FlashInteraction, {
                    flash: currentFlash,
                    currentUser: currentUser,
                    onClose: handleClose
                }, void 0, false, {
                    fileName: "[project]/src/components/FlashModal.tsx",
                    lineNumber: 340,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/FlashModal.tsx",
            lineNumber: 296,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/FlashModal.tsx",
        lineNumber: 295,
        columnNumber: 5
    }, this);
}
_s2(FlashModal, "P3kLzdkCy6BX1SSVat8Lv4CPaTM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$AppStateContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppState"]
    ];
});
_c3 = FlashModal;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "Watermark");
__turbopack_context__.k.register(_c1, "AdView");
__turbopack_context__.k.register(_c2, "FlashInteraction");
__turbopack_context__.k.register(_c3, "FlashModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/FlashModal.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/FlashModal.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=src_components_FlashModal_tsx_d9f0ec89._.js.map