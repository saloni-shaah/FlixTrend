module.exports = [
"[project]/src/app/login/LoginWithEmail.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LoginWithEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$firebaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/firebaseClient.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/auth/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/node-esm/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
function LoginWithEmail() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const finishSignIn = async ()=>{
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isSignInWithEmailLink"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$firebaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["auth"], window.location.href)) {
                let email = window.localStorage.getItem('emailForSignIn');
                if (!email) {
                    email = window.prompt('Please provide your email for confirmation');
                }
                try {
                    if (email) {
                        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signInWithEmailLink"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$firebaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["auth"], email, window.location.href);
                        window.localStorage.removeItem('emailForSignIn');
                        router.push('/home?new=true');
                    }
                } catch (err) {
                    setError('Failed to sign in. The link may have expired or been used already.');
                    console.error('Sign In With Email Link Error:', err);
                }
            } else {
                setError('Invalid sign-in link.');
            }
            setLoading(false);
        };
        finishSignIn();
    }, [
        router
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen flex items-center justify-center p-4 animate-fade-in",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
            initial: {
                opacity: 0,
                y: -20
            },
            animate: {
                opacity: 1,
                y: 0
            },
            transition: {
                duration: 0.5
            },
            className: "glass-card p-8 w-full max-w-md flex flex-col items-center gap-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-3xl font-headline font-bold text-accent-pink mb-2 text-center",
                    children: loading ? 'Completing Sign In...' : 'Sign In Complete'
                }, void 0, false, {
                    fileName: "[project]/src/app/login/LoginWithEmail.tsx",
                    lineNumber: 48,
                    columnNumber: 9
                }, this),
                loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-accent-cyan",
                    children: "Please wait while we sign you in."
                }, void 0, false, {
                    fileName: "[project]/src/app/login/LoginWithEmail.tsx",
                    lineNumber: 51,
                    columnNumber: 21
                }, this),
                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-red-400 text-center animate-bounce mt-2",
                    children: error
                }, void 0, false, {
                    fileName: "[project]/src/app/login/LoginWithEmail.tsx",
                    lineNumber: 52,
                    columnNumber: 19
                }, this),
                !loading && !error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-accent-cyan",
                    children: "You have been successfully signed in!"
                }, void 0, false, {
                    fileName: "[project]/src/app/login/LoginWithEmail.tsx",
                    lineNumber: 53,
                    columnNumber: 32
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/login/LoginWithEmail.tsx",
            lineNumber: 42,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/login/LoginWithEmail.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/lib/countries.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "countries",
    ()=>countries
]);
const countries = [
    {
        name: 'Afghanistan',
        code: 'AF',
        dial_code: '+93'
    },
    {
        name: 'Albania',
        code: 'AL',
        dial_code: '+355'
    },
    {
        name: 'Algeria',
        code: 'DZ',
        dial_code: '+213'
    },
    {
        name: 'American Samoa',
        code: 'AS',
        dial_code: '+1684'
    },
    {
        name: 'Andorra',
        code: 'AD',
        dial_code: '+376'
    },
    {
        name: 'Angola',
        code: 'AO',
        dial_code: '+244'
    },
    {
        name: 'Anguilla',
        code: 'AI',
        dial_code: '+1264'
    },
    {
        name: 'Antarctica',
        code: 'AQ',
        dial_code: '+672'
    },
    {
        name: 'Antigua and Barbuda',
        code: 'AG',
        dial_code: '+1268'
    },
    {
        name: 'Argentina',
        code: 'AR',
        dial_code: '+54'
    },
    {
        name: 'Armenia',
        code: 'AM',
        dial_code: '+374'
    },
    {
        name: 'Aruba',
        code: 'AW',
        dial_code: '+297'
    },
    {
        name: 'Australia',
        code: 'AU',
        dial_code: '+61'
    },
    {
        name: 'Austria',
        code: 'AT',
        dial_code: '+43'
    },
    {
        name: 'Azerbaijan',
        code: 'AZ',
        dial_code: '+994'
    },
    {
        name: 'Bahamas',
        code: 'BS',
        dial_code: '+1242'
    },
    {
        name: 'Bahrain',
        code: 'BH',
        dial_code: '+973'
    },
    {
        name: 'Bangladesh',
        code: 'BD',
        dial_code: '+880'
    },
    {
        name: 'Barbados',
        code: 'BB',
        dial_code: '+1246'
    },
    {
        name: 'Belarus',
        code: 'BY',
        dial_code: '+375'
    },
    {
        name: 'Belgium',
        code: 'BE',
        dial_code: '+32'
    },
    {
        name: 'Belize',
        code: 'BZ',
        dial_code: '+501'
    },
    {
        name: 'Benin',
        code: 'BJ',
        dial_code: '+229'
    },
    {
        name: 'Bermuda',
        code: 'BM',
        dial_code: '+1441'
    },
    {
        name: 'Bhutan',
        code: 'BT',
        dial_code: '+975'
    },
    {
        name: 'Bolivia',
        code: 'BO',
        dial_code: '+591'
    },
    {
        name: 'Bosnia and Herzegovina',
        code: 'BA',
        dial_code: '+387'
    },
    {
        name: 'Botswana',
        code: 'BW',
        dial_code: '+267'
    },
    {
        name: 'Brazil',
        code: 'BR',
        dial_code: '+55'
    },
    {
        name: 'British Indian Ocean Territory',
        code: 'IO',
        dial_code: '+246'
    },
    {
        name: 'Brunei Darussalam',
        code: 'BN',
        dial_code: '+673'
    },
    {
        name: 'Bulgaria',
        code: 'BG',
        dial_code: '+359'
    },
    {
        name: 'Burkina Faso',
        code: 'BF',
        dial_code: '+226'
    },
    {
        name: 'Burundi',
        code: 'BI',
        dial_code: '+257'
    },
    {
        name: 'Cambodia',
        code: 'KH',
        dial_code: '+855'
    },
    {
        name: 'Cameroon',
        code: 'CM',
        dial_code: '+237'
    },
    {
        name: 'Canada',
        code: 'CA',
        dial_code: '+1'
    },
    {
        name: 'Cape Verde',
        code: 'CV',
        dial_code: '+238'
    },
    {
        name: 'Cayman Islands',
        code: 'KY',
        dial_code: '+1345'
    },
    {
        name: 'Central African Republic',
        code: 'CF',
        dial_code: '+236'
    },
    {
        name: 'Chad',
        code: 'TD',
        dial_code: '+235'
    },
    {
        name: 'Chile',
        code: 'CL',
        dial_code: '+56'
    },
    {
        name: 'China',
        code: 'CN',
        dial_code: '+86'
    },
    {
        name: 'Christmas Island',
        code: 'CX',
        dial_code: '+61'
    },
    {
        name: 'Cocos (Keeling) Islands',
        code: 'CC',
        dial_code: '+61'
    },
    {
        name: 'Colombia',
        code: 'CO',
        dial_code: '+57'
    },
    {
        name: 'Comoros',
        code: 'KM',
        dial_code: '+269'
    },
    {
        name: 'Congo',
        code: 'CG',
        dial_code: '+242'
    },
    {
        name: 'Cook Islands',
        code: 'CK',
        dial_code: '+682'
    },
    {
        name: 'Costa Rica',
        code: 'CR',
        dial_code: '+506'
    },
    {
        name: 'Croatia',
        code: 'HR',
        dial_code: '+385'
    },
    {
        name: 'Cuba',
        code: 'CU',
        dial_code: '+53'
    },
    {
        name: 'Cyprus',
        code: 'CY',
        dial_code: '+357'
    },
    {
        name: 'Czech Republic',
        code: 'CZ',
        dial_code: '+420'
    },
    {
        name: 'Denmark',
        code: 'DK',
        dial_code: '+45'
    },
    {
        name: 'Djibouti',
        code: 'DJ',
        dial_code: '+253'
    },
    {
        name: 'Dominica',
        code: 'DM',
        dial_code: '+1767'
    },
    {
        name: 'Dominican Republic',
        code: 'DO',
        dial_code: '+1809'
    },
    {
        name: 'Ecuador',
        code: 'EC',
        dial_code: '+593'
    },
    {
        name: 'Egypt',
        code: 'EG',
        dial_code: '+20'
    },
    {
        name: 'El Salvador',
        code: 'SV',
        dial_code: '+503'
    },
    {
        name: 'Equatorial Guinea',
        code: 'GQ',
        dial_code: '+240'
    },
    {
        name: 'Eritrea',
        code: 'ER',
        dial_code: '+291'
    },
    {
        name: 'Estonia',
        code: 'EE',
        dial_code: '+372'
    },
    {
        name: 'Ethiopia',
        code: 'ET',
        dial_code: '+251'
    },
    {
        name: 'Falkland Islands (Malvinas)',
        code: 'FK',
        dial_code: '+500'
    },
    {
        name: 'Faroe Islands',
        code: 'FO',
        dial_code: '+298'
    },
    {
        name: 'Fiji',
        code: 'FJ',
        dial_code: '+679'
    },
    {
        name: 'Finland',
        code: 'FI',
        dial_code: '+358'
    },
    {
        name: 'France',
        code: 'FR',
        dial_code: '+33'
    },
    {
        name: 'French Guiana',
        code: 'GF',
        dial_code: '+594'
    },
    {
        name: 'French Polynesia',
        code: 'PF',
        dial_code: '+689'
    },
    {
        name: 'Gabon',
        code: 'GA',
        dial_code: '+241'
    },
    {
        name: 'Gambia',
        code: 'GM',
        dial_code: '+220'
    },
    {
        name: 'Georgia',
        code: 'GE',
        dial_code: '+995'
    },
    {
        name: 'Germany',
        code: 'DE',
        dial_code: '+49'
    },
    {
        name: 'Ghana',
        code: 'GH',
        dial_code: '+233'
    },
    {
        name: 'Gibraltar',
        code: 'GI',
        dial_code: '+350'
    },
    {
        name: 'Greece',
        code: 'GR',
        dial_code: '+30'
    },
    {
        name: 'Greenland',
        code: 'GL',
        dial_code: '+299'
    },
    {
        name: 'Grenada',
        code: 'GD',
        dial_code: '+1473'
    },
    {
        name: 'Guadeloupe',
        code: 'GP',
        dial_code: '+590'
    },
    {
        name: 'Guam',
        code: 'GU',
        dial_code: '+1671'
    },
    {
        name: 'Guatemala',
        code: 'GT',
        dial_code: '+502'
    },
    {
        name: 'Guernsey',
        code: 'GG',
        dial_code: '+44'
    },
    {
        name: 'Guinea',
        code: 'GN',
        dial_code: '+224'
    },
    {
        name: 'Guinea-Bissau',
        code: 'GW',
        dial_code: '+245'
    },
    {
        name: 'Guyana',
        code: 'GY',
        dial_code: '+592'
    },
    {
        name: 'Haiti',
        code: 'HT',
        dial_code: '+509'
    },
    {
        name: 'Honduras',
        code: 'HN',
        dial_code: '+504'
    },
    {
        name: 'Hong Kong',
        code: 'HK',
        dial_code: '+852'
    },
    {
        name: 'Hungary',
        code: 'HU',
        dial_code: '+36'
    },
    {
        name: 'Iceland',
        code: 'IS',
        dial_code: '+354'
    },
    {
        name: 'India',
        code: 'IN',
        dial_code: '+91'
    },
    {
        name: 'Indonesia',
        code: 'ID',
        dial_code: '+62'
    },
    {
        name: 'Iran',
        code: 'IR',
        dial_code: '+98'
    },
    {
        name: 'Iraq',
        code: 'IQ',
        dial_code: '+964'
    },
    {
        name: 'Ireland',
        code: 'IE',
        dial_code: '+353'
    },
    {
        name: 'Isle of Man',
        code: 'IM',
        dial_code: '+44'
    },
    {
        name: 'Israel',
        code: 'IL',
        dial_code: '+972'
    },
    {
        name: 'Italy',
        code: 'IT',
        dial_code: '+39'
    },
    {
        name: 'Jamaica',
        code: 'JM',
        dial_code: '+1876'
    },
    {
        name: 'Japan',
        code: 'JP',
        dial_code: '+81'
    },
    {
        name: 'Jersey',
        code: 'JE',
        dial_code: '+44'
    },
    {
        name: 'Jordan',
        code: 'JO',
        dial_code: '+962'
    },
    {
        name: 'Kazakhstan',
        code: 'KZ',
        dial_code: '+7'
    },
    {
        name: 'Kenya',
        code: 'KE',
        dial_code: '+254'
    },
    {
        name: 'Kiribati',
        code: 'KI',
        dial_code: '+686'
    },
    {
        name: 'Kuwait',
        code: 'KW',
        dial_code: '+965'
    },
    {
        name: 'Kyrgyzstan',
        code: 'KG',
        dial_code: '+996'
    },
    {
        name: 'Laos',
        code: 'LA',
        dial_code: '+856'
    },
    {
        name: 'Latvia',
        code: 'LV',
        dial_code: '+371'
    },
    {
        name: 'Lebanon',
        code: 'LB',
        dial_code: '+961'
    },
    {
        name: 'Lesotho',
        code: 'LS',
        dial_code: '+266'
    },
    {
        name: 'Liberia',
        code: 'LR',
        dial_code: '+231'
    },
    {
        name: 'Libya',
        code: 'LY',
        dial_code: '+218'
    },
    {
        name: 'Liechtenstein',
        code: 'LI',
        dial_code: '+423'
    },
    {
        name: 'Lithuania',
        code: 'LT',
        dial_code: '+370'
    },
    {
        name: 'Luxembourg',
        code: 'LU',
        dial_code: '+352'
    },
    {
        name: 'Macao',
        code: 'MO',
        dial_code: '+853'
    },
    {
        name: 'Macedonia',
        code: 'MK',
        dial_code: '+389'
    },
    {
        name: 'Madagascar',
        code: 'MG',
        dial_code: '+261'
    },
    {
        name: 'Malawi',
        code: 'MW',
        dial_code: '+265'
    },
    {
        name: 'Malaysia',
        code: 'MY',
        dial_code: '+60'
    },
    {
        name: 'Maldives',
        code: 'MV',
        dial_code: '+960'
    },
    {
        name: 'Mali',
        code: 'ML',
        dial_code: '+223'
    },
    {
        name: 'Malta',
        code: 'MT',
        dial_code: '+356'
    },
    {
        name: 'Marshall Islands',
        code: 'MH',
        dial_code: '+692'
    },
    {
        name: 'Martinique',
        code: 'MQ',
        dial_code: '+596'
    },
    {
        name: 'Mauritania',
        code: 'MR',
        dial_code: '+222'
    },
    {
        name: 'Mauritius',
        code: 'MU',
        dial_code: '+230'
    },
    {
        name: 'Mayotte',
        code: 'YT',
        dial_code: '+262'
    },
    {
        name: 'Mexico',
        code: 'MX',
        dial_code: '+52'
    },
    {
        name: 'Micronesia',
        code: 'FM',
        dial_code: '+691'
    },
    {
        name: 'Moldova',
        code: 'MD',
        dial_code: '+373'
    },
    {
        name: 'Monaco',
        code: 'MC',
        dial_code: '+377'
    },
    {
        name: 'Mongolia',
        code: 'MN',
        dial_code: '+976'
    },
    {
        name: 'Montenegro',
        code: 'ME',
        dial_code: '+382'
    },
    {
        name: 'Montserrat',
        code: 'MS',
        dial_code: '+1664'
    },
    {
        name: 'Morocco',
        code: 'MA',
        dial_code: '+212'
    },
    {
        name: 'Mozambique',
        code: 'MZ',
        dial_code: '+258'
    },
    {
        name: 'Myanmar',
        code: 'MM',
        dial_code: '+95'
    },
    {
        name: 'Namibia',
        code: 'NA',
        dial_code: '+264'
    },
    {
        name: 'Nauru',
        code: 'NR',
        dial_code: '+674'
    },
    {
        name: 'Nepal',
        code: 'NP',
        dial_code: '+977'
    },
    {
        name: 'Netherlands',
        code: 'NL',
        dial_code: '+31'
    },
    {
        name: 'New Caledonia',
        code: 'NC',
        dial_code: '+687'
    },
    {
        name: 'New Zealand',
        code: 'NZ',
        dial_code: '+64'
    },
    {
        name: 'Nicaragua',
        code: 'NI',
        dial_code: '+505'
    },
    {
        name: 'Niger',
        code: 'NE',
        dial_code: '+227'
    },
    {
        name: 'Nigeria',
        code: 'NG',
        dial_code: '+234'
    },
    {
        name: 'Niue',
        code: 'NU',
        dial_code: '+683'
    },
    {
        name: 'Norfolk Island',
        code: 'NF',
        dial_code: '+672'
    },
    {
        name: 'North Korea',
        code: 'KP',
        dial_code: '+850'
    },
    {
        name: 'Northern Mariana Islands',
        code: 'MP',
        dial_code: '+1670'
    },
    {
        name: 'Norway',
        code: 'NO',
        dial_code: '+47'
    },
    {
        name: 'Oman',
        code: 'OM',
        dial_code: '+968'
    },
    {
        name: 'Pakistan',
        code: 'PK',
        dial_code: '+92'
    },
    {
        name: 'Palau',
        code: 'PW',
        dial_code: '+680'
    },
    {
        name: 'Palestine',
        code: 'PS',
        dial_code: '+970'
    },
    {
        name: 'Panama',
        code: 'PA',
        dial_code: '+507'
    },
    {
        name: 'Papua New Guinea',
        code: 'PG',
        dial_code: '+675'
    },
    {
        name: 'Paraguay',
        code: 'PY',
        dial_code: '+595'
    },
    {
        name: 'Peru',
        code: 'PE',
        dial_code: '+51'
    },
    {
        name: 'Philippines',
        code: 'PH',
        dial_code: '+63'
    },
    {
        name: 'Poland',
        code: 'PL',
        dial_code: '+48'
    },
    {
        name: 'Portugal',
        code: 'PT',
        dial_code: '+351'
    },
    {
        name: 'Puerto Rico',
        code: 'PR',
        dial_code: '+1939'
    },
    {
        name: 'Qatar',
        code: 'QA',
        dial_code: '+974'
    },
    {
        name: 'Romania',
        code: 'RO',
        dial_code: '+40'
    },
    {
        name: 'Russia',
        code: 'RU',
        dial_code: '+7'
    },
    {
        name: 'Rwanda',
        code: 'RW',
        dial_code: '+250'
    },
    {
        name: 'Samoa',
        code: 'WS',
        dial_code: '+685'
    },
    {
        name: 'San Marino',
        code: 'SM',
        dial_code: '+378'
    },
    {
        name: 'Sao Tome and Principe',
        code: 'ST',
        dial_code: '+239'
    },
    {
        name: 'Saudi Arabia',
        code: 'SA',
        dial_code: '+966'
    },
    {
        name: 'Senegal',
        code: 'SN',
        dial_code: '+221'
    },
    {
        name: 'Serbia',
        code: 'RS',
        dial_code: '+381'
    },
    {
        name: 'Seychelles',
        code: 'SC',
        dial_code: '+248'
    },
    {
        name: 'Sierra Leone',
        code: 'SL',
        dial_code: '+232'
    },
    {
        name: 'Singapore',
        code: 'SG',
        dial_code: '+65'
    },
    {
        name: 'Slovakia',
        code: 'SK',
        dial_code: '+421'
    },
    {
        name: 'Slovenia',
        code: 'SI',
        dial_code: '+386'
    },
    {
        name: 'Solomon Islands',
        code: 'SB',
        dial_code: '+677'
    },
    {
        name: 'Somalia',
        code: 'SO',
        dial_code: '+252'
    },
    {
        name: 'South Africa',
        code: 'ZA',
        dial_code: '+27'
    },
    {
        name: 'South Korea',
        code: 'KR',
        dial_code: '+82'
    },
    {
        name: 'South Sudan',
        code: 'SS',
        dial_code: '+211'
    },
    {
        name: 'Spain',
        code: 'ES',
        dial_code: '+34'
    },
    {
        name: 'Sri Lanka',
        code: 'LK',
        dial_code: '+94'
    },
    {
        name: 'Sudan',
        code: 'SD',
        dial_code: '+249'
    },
    {
        name: 'Suriname',
        code: 'SR',
        dial_code: '+597'
    },
    {
        name: 'Sweden',
        code: 'SE',
        dial_code: '+46'
    },
    {
        name: 'Switzerland',
        code: 'CH',
        dial_code: '+41'
    },
    {
        name: 'Syria',
        code: 'SY',
        dial_code: '+963'
    },
    {
        name: 'Taiwan',
        code: 'TW',
        dial_code: '+886'
    },
    {
        name: 'Tajikistan',
        code: 'TJ',
        dial_code: '+992'
    },
    {
        name: 'Tanzania',
        code: 'TZ',
        dial_code: '+255'
    },
    {
        name: 'Thailand',
        code: 'TH',
        dial_code: '+66'
    },
    {
        name: 'Timor-Leste',
        code: 'TL',
        dial_code: '+670'
    },
    {
        name: 'Togo',
        code: 'TG',
        dial_code: '+228'
    },
    {
        name: 'Tokelau',
        code: 'TK',
        dial_code: '+690'
    },
    {
        name: 'Tonga',
        code: 'TO',
        dial_code: '+676'
    },
    {
        name: 'Trinidad and Tobago',
        code: 'TT',
        dial_code: '+1868'
    },
    {
        name: 'Tunisia',
        code: 'TN',
        dial_code: '+216'
    },
    {
        name: 'Turkey',
        code: 'TR',
        dial_code: '+90'
    },
    {
        name: 'Turkmenistan',
        code: 'TM',
        dial_code: '+993'
    },
    {
        name: 'Turks and Caicos Islands',
        code: 'TC',
        dial_code: '+1649'
    },
    {
        name: 'Tuvalu',
        code: 'TV',
        dial_code: '+688'
    },
    {
        name: 'Uganda',
        code: 'UG',
        dial_code: '+256'
    },
    {
        name: 'Ukraine',
        code: 'UA',
        dial_code: '+380'
    },
    {
        name: 'United Arab Emirates',
        code: 'AE',
        dial_code: '+971'
    },
    {
        name: 'United Kingdom',
        code: 'GB',
        dial_code: '+44'
    },
    {
        name: 'United States',
        code: 'US',
        dial_code: '+1'
    },
    {
        name: 'Uruguay',
        code: 'UY',
        dial_code: '+598'
    },
    {
        name: 'Uzbekistan',
        code: 'UZ',
        dial_code: '+998'
    },
    {
        name: 'Vanuatu',
        code: 'VU',
        dial_code: '+678'
    },
    {
        name: 'Venezuela',
        code: 'VE',
        dial_code: '+58'
    },
    {
        name: 'Vietnam',
        code: 'VN',
        dial_code: '+84'
    },
    {
        name: 'Virgin Islands, British',
        code: 'VG',
        dial_code: '+1284'
    },
    {
        name: 'Virgin Islands, U.S.',
        code: 'VI',
        dial_code: '+1340'
    },
    {
        name: 'Yemen',
        code: 'YE',
        dial_code: '+967'
    },
    {
        name: 'Zambia',
        code: 'ZM',
        dial_code: '+260'
    },
    {
        name: 'Zimbabwe',
        code: 'ZW',
        dial_code: '+263'
    }
];
}),
"[project]/src/components/ui/CountrySelector.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CountrySelector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$countries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/countries.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
// Function to convert country code to flag emoji
const countryCodeToEmoji = (code)=>{
    const OFFSET = 127397;
    const chars = [
        ...code.toUpperCase()
    ].map((char)=>String.fromCodePoint(char.charCodeAt(0) + OFFSET));
    return chars.join('');
};
function CountrySelector({ onCountrySelect }) {
    const [selectedCountry, setSelectedCountry] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$countries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["countries"].find((c)=>c.code === 'US'));
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const filteredCountries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$countries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["countries"].filter((country)=>country.name.toLowerCase().includes(searchTerm.toLowerCase()) || country.dial_code.includes(searchTerm)), [
        searchTerm
    ]);
    const handleSelect = (country)=>{
        setSelectedCountry(country);
        onCountrySelect(country.dial_code);
        setIsOpen(false);
        setSearchTerm("");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "input-glass w-full flex items-center justify-between p-3",
                onClick: ()=>setIsOpen(!isOpen),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "flex items-center gap-2 text-white",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xl",
                                children: countryCodeToEmoji(selectedCountry.code)
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/CountrySelector.tsx",
                                lineNumber: 43,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: selectedCountry.dial_code
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/CountrySelector.tsx",
                                lineNumber: 44,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ui/CountrySelector.tsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: `w-5 h-5 transition-transform text-gray-400 ${isOpen ? 'transform rotate-180' : ''}`,
                        fill: "currentColor",
                        viewBox: "0 0 20 20",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            fillRule: "evenodd",
                            d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z",
                            clipRule: "evenodd"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ui/CountrySelector.tsx",
                            lineNumber: 47,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/CountrySelector.tsx",
                        lineNumber: 46,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ui/CountrySelector.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute z-20 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            placeholder: "Search country...",
                            className: "input-glass w-full bg-gray-800",
                            value: searchTerm,
                            onChange: (e)=>setSearchTerm(e.target.value)
                        }, void 0, false, {
                            fileName: "[project]/src/components/ui/CountrySelector.tsx",
                            lineNumber: 53,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/CountrySelector.tsx",
                        lineNumber: 52,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "max-h-60 overflow-y-auto",
                        children: filteredCountries.map((country)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                className: "px-4 py-2 cursor-pointer hover:bg-gray-700 flex items-center gap-3",
                                onClick: ()=>handleSelect(country),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xl",
                                        children: countryCodeToEmoji(country.code)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ui/CountrySelector.tsx",
                                        lineNumber: 68,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-300 flex-grow",
                                        children: country.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ui/CountrySelector.tsx",
                                        lineNumber: 69,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-400",
                                        children: country.dial_code
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ui/CountrySelector.tsx",
                                        lineNumber: 70,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, country.code, true, {
                                fileName: "[project]/src/components/ui/CountrySelector.tsx",
                                lineNumber: 63,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/CountrySelector.tsx",
                        lineNumber: 61,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ui/CountrySelector.tsx",
                lineNumber: 51,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/CountrySelector.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/app/login/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LoginPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$firebaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/firebaseClient.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/auth/dist/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/node-esm/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$login$2f$LoginWithEmail$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/login/LoginWithEmail.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$CountrySelector$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/CountrySelector.tsx [app-ssr] (ecmascript)");
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
// ... (ForgotPasswordModal remains the same)
function LoginPageContent() {
    const [phoneNumber, setPhoneNumber] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [countryCode, setCountryCode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("+1");
    const [otp, setOtp] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showOtpInput, setShowOtpInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [confirmationResult, setConfirmationResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        window.recaptchaVerifier = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RecaptchaVerifier"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$firebaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["auth"], 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response)=>{
            // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
        });
    }, []);
    const handlePhoneSignIn = async (e)=>{
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const fullPhoneNumber = `${countryCode}${phoneNumber}`;
            const verifier = window.recaptchaVerifier;
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$node$2d$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signInWithPhoneNumber"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$firebaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["auth"], fullPhoneNumber, verifier);
            setConfirmationResult(result);
            setShowOtpInput(true);
        } catch (err) {
            setError("Failed to send OTP. Please check the phone number and try again.");
            console.error("Phone Sign In Error:", err);
        }
        setLoading(false);
    };
    const handleOtpSubmit = async (e)=>{
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await confirmationResult.confirm(otp);
            router.push("/home?new=true");
        } catch (err) {
            setError("Invalid OTP. Please try again.");
            console.error("OTP Verification Error:", err);
        }
        setLoading(false);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen flex items-center justify-center p-4 animate-fade-in",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
            initial: {
                opacity: 0,
                y: -20
            },
            animate: {
                opacity: 1,
                y: 0
            },
            transition: {
                duration: 0.5
            },
            className: "glass-card p-8 w-full max-w-md flex flex-col gap-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    id: "recaptcha-container"
                }, void 0, false, {
                    fileName: "[project]/src/app/login/page.tsx",
                    lineNumber: 77,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-3xl font-headline font-bold text-accent-pink mb-2 text-center",
                    children: "Welcome Back"
                }, void 0, false, {
                    fileName: "[project]/src/app/login/page.tsx",
                    lineNumber: 78,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-accent-cyan text-center mb-4",
                    children: "Login with your phone number"
                }, void 0, false, {
                    fileName: "[project]/src/app/login/page.tsx",
                    lineNumber: 79,
                    columnNumber: 9
                }, this),
                !showOtpInput ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                    onSubmit: handlePhoneSignIn,
                    className: "flex flex-col gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$CountrySelector$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            onCountrySelect: setCountryCode
                        }, void 0, false, {
                            fileName: "[project]/src/app/login/page.tsx",
                            lineNumber: 83,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "tel",
                            placeholder: "Phone Number",
                            className: "input-glass w-full",
                            value: phoneNumber,
                            onChange: (e)=>setPhoneNumber(e.target.value),
                            required: true
                        }, void 0, false, {
                            fileName: "[project]/src/app/login/page.tsx",
                            lineNumber: 84,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].button, {
                            whileHover: {
                                scale: 1.05
                            },
                            whileTap: {
                                scale: 0.95
                            },
                            type: "submit",
                            className: "btn-glass mt-4 bg-accent-pink/80",
                            disabled: loading,
                            children: loading ? "Sending OTP..." : "Send OTP"
                        }, void 0, false, {
                            fileName: "[project]/src/app/login/page.tsx",
                            lineNumber: 92,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/login/page.tsx",
                    lineNumber: 82,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                    onSubmit: handleOtpSubmit,
                    className: "flex flex-col gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            placeholder: "Enter OTP",
                            className: "input-glass w-full",
                            value: otp,
                            onChange: (e)=>setOtp(e.target.value),
                            required: true
                        }, void 0, false, {
                            fileName: "[project]/src/app/login/page.tsx",
                            lineNumber: 104,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].button, {
                            whileHover: {
                                scale: 1.05
                            },
                            whileTap: {
                                scale: 0.95
                            },
                            type: "submit",
                            className: "btn-glass mt-4 bg-accent-pink/80",
                            disabled: loading,
                            children: loading ? "Verifying..." : "Verify OTP"
                        }, void 0, false, {
                            fileName: "[project]/src/app/login/page.tsx",
                            lineNumber: 112,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/login/page.tsx",
                    lineNumber: 103,
                    columnNumber: 11
                }, this),
                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-red-400 text-center animate-bounce mt-2",
                    children: error
                }, void 0, false, {
                    fileName: "[project]/src/app/login/page.tsx",
                    lineNumber: 124,
                    columnNumber: 19
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center mt-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-gray-400",
                            children: "Don't have an account? "
                        }, void 0, false, {
                            fileName: "[project]/src/app/login/page.tsx",
                            lineNumber: 127,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/signup",
                            className: "text-accent-cyan hover:underline",
                            children: "Sign up"
                        }, void 0, false, {
                            fileName: "[project]/src/app/login/page.tsx",
                            lineNumber: 128,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/login/page.tsx",
                    lineNumber: 126,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center mt-2 text-xs text-gray-400",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/terms",
                            className: "hover:text-accent-cyan hover:underline",
                            children: "Terms of Service"
                        }, void 0, false, {
                            fileName: "[project]/src/app/login/page.tsx",
                            lineNumber: 131,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "mx-2",
                            children: "|"
                        }, void 0, false, {
                            fileName: "[project]/src/app/login/page.tsx",
                            lineNumber: 132,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/privacy",
                            className: "hover:text-accent-cyan hover:underline",
                            children: "Privacy Policy"
                        }, void 0, false, {
                            fileName: "[project]/src/app/login/page.tsx",
                            lineNumber: 133,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/login/page.tsx",
                    lineNumber: 130,
                    columnNumber: 10
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/login/page.tsx",
            lineNumber: 71,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/login/page.tsx",
        lineNumber: 70,
        columnNumber: 5
    }, this);
}
function LoginHandler() {
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const finish = searchParams.get('finish');
    if (finish) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$login$2f$LoginWithEmail$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
            fileName: "[project]/src/app/login/page.tsx",
            lineNumber: 145,
            columnNumber: 16
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LoginPageContent, {}, void 0, false, {
        fileName: "[project]/src/app/login/page.tsx",
        lineNumber: 147,
        columnNumber: 12
    }, this);
}
function LoginPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Suspense"], {
        fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen flex items-center justify-center",
            children: "Loading..."
        }, void 0, false, {
            fileName: "[project]/src/app/login/page.tsx",
            lineNumber: 152,
            columnNumber: 25
        }, void 0),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LoginHandler, {}, void 0, false, {
            fileName: "[project]/src/app/login/page.tsx",
            lineNumber: 153,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/login/page.tsx",
        lineNumber: 152,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=src_bba2f8d8._.js.map