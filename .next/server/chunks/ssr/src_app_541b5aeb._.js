module.exports=[23115,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call Providers() from the server but Providers is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/src/app/providers.tsx <module evaluation>","Providers");a.s(["Providers",0,b])},36459,a=>{"use strict";let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call Providers() from the server but Providers is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/src/app/providers.tsx","Providers");a.s(["Providers",0,b])},62752,a=>{"use strict";a.i(23115);var b=a.i(36459);a.n(b)},27572,a=>{"use strict";var b=a.i(7997),c=a.i(62752);let d=process.env.NEXT_PUBLIC_SITE_URL||"https://flixtrend.in",e={metadataBase:new URL(d),title:{default:"FlixTrend",template:"%s | FlixTrend"},description:"FlixTrend: The Future of Social, Built for Gen-Z. Secure, Creative, Connected. Where trends find you first.",manifest:"/manifest.json",keywords:["FlixTrend","social media","Gen-Z","video sharing","live streaming","secure social","Indian social media","flashes","vibes","vibesapce","scope"],openGraph:{title:"FlixTrend",description:"The Future of Social, Built for Gen-Z. Secure, Creative, Connected.",url:d,siteName:"FlixTrend",images:[{url:"/og-image.png",width:1200,height:630,alt:"FlixTrend - The Future of Social"}],locale:"en_IN",type:"website"},twitter:{card:"summary_large_image",title:"FlixTrend: The Vibe is Here.",description:"The Future of Social, Built for Gen-Z. Secure, Creative, Connected.",creator:"@FlxTrnd",site:"@FlxTrnd",images:[`${d}/og-image.png`]},icons:{icon:[{url:"/favicon.ico",sizes:"any"},{url:"/icon.svg",type:"image/svg+xml"},{url:"/icons/icon-192x192.png",type:"image/png",sizes:"192x192"},{url:"/icons/icon-512x512.png",type:"image/png",sizes:"512x512"}],apple:[{url:"/apple-touch-icon.png"}]}};function f({children:a}){let d=`
    (function() {
      try {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        }

        const simpleMode = localStorage.getItem('simpleMode');
        if (simpleMode === 'true') {
          document.documentElement.classList.add('simple');
        }

        const accentColor = localStorage.getItem('accentColor');
        if (accentColor) {
            document.documentElement.style.setProperty('--accent-cyan', accentColor);
            document.documentElement.style.setProperty('--brand-saffron', accentColor);
        }
      } catch (e) {
        console.error('Failed to set theme from localStorage', e);
      }
    })();
  `;return(0,b.jsxs)("html",{lang:"en",suppressHydrationWarning:!0,children:[(0,b.jsxs)("head",{children:[(0,b.jsx)("script",{dangerouslySetInnerHTML:{__html:d}}),(0,b.jsx)("meta",{name:"theme-color",content:"#1B1B1E"}),(0,b.jsx)("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),(0,b.jsx)("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),(0,b.jsx)("link",{href:"https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Space+Grotesk:wght@700&family=Italianno&family=Dancing+Script:wght@400..700&family=Great+Vibes&display=swap",rel:"stylesheet"})]}),(0,b.jsx)("body",{className:"relative min-h-screen",children:(0,b.jsx)(c.Providers,{children:a})})]})}a.s(["default",()=>f,"metadata",0,e])}];

//# sourceMappingURL=src_app_541b5aeb._.js.map