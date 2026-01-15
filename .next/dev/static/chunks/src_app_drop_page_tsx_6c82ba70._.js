(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/app/drop/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DropPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
// Placeholder for the three states of the Drop page
const Unposted = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Unposted State"
    }, void 0, false, {
        fileName: "[project]/src/app/drop/page.tsx",
        lineNumber: 6,
        columnNumber: 24
    }, ("TURBOPACK compile-time value", void 0));
_c = Unposted;
const Creating = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Creating State"
    }, void 0, false, {
        fileName: "[project]/src/app/drop/page.tsx",
        lineNumber: 7,
        columnNumber: 24
    }, ("TURBOPACK compile-time value", void 0));
_c1 = Creating;
const Posted = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Posted State"
    }, void 0, false, {
        fileName: "[project]/src/app/drop/page.tsx",
        lineNumber: 8,
        columnNumber: 22
    }, ("TURBOPACK compile-time value", void 0));
_c2 = Posted;
function DropPage() {
    _s();
    const [userHasPosted, setUserHasPosted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isCreating, setIsCreating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // In a real application, this would be determined by fetching user data
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DropPage.useEffect": ()=>{
            // For now, we'll just simulate the user not having posted
            setUserHasPosted(false);
        }
    }["DropPage.useEffect"], []);
    if (isCreating) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Creating, {}, void 0, false, {
            fileName: "[project]/src/app/drop/page.tsx",
            lineNumber: 21,
            columnNumber: 12
        }, this);
    }
    if (userHasPosted) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Posted, {}, void 0, false, {
            fileName: "[project]/src/app/drop/page.tsx",
            lineNumber: 25,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Unposted, {}, void 0, false, {
        fileName: "[project]/src/app/drop/page.tsx",
        lineNumber: 28,
        columnNumber: 10
    }, this);
}
_s(DropPage, "b6BGIIb56ob3XnSoOV2wIu47z4w=");
_c3 = DropPage;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "Unposted");
__turbopack_context__.k.register(_c1, "Creating");
__turbopack_context__.k.register(_c2, "Posted");
__turbopack_context__.k.register(_c3, "DropPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_app_drop_page_tsx_6c82ba70._.js.map