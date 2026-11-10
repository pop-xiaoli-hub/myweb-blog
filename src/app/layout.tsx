import type { Metadata, Viewport } from "next";
import {
  Allura,
  Cormorant_Garamond,
  Schibsted_Grotesk,
} from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
});

const allura = Allura({
  variable: "--font-allura",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "popxiaoli | iOS development notes",
    template: "%s | popxiaoli",
  },
  description:
    "Long-form notes on Objective-C, iOS launch performance, runtime details and the craft of building apps.",
  openGraph: {
    title: "popxiaoli | iOS development notes",
    description:
      "Long-form notes on Objective-C, iOS launch performance and runtime details.",
    type: "website",
    images: ["/images/site-background.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "popxiaoli | iOS development notes",
    description:
      "Long-form notes on Objective-C, iOS launch performance and runtime details.",
    images: ["/images/site-background.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05080c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${schibsted.variable} ${cormorant.variable} ${allura.variable} h-full antialiased`}
      data-type="service"
      data-radius="soft"
      data-buttons="solid"
      data-motion
      suppressHydrationWarning
    >
      <head>
        <meta name="site-kind" content="other" />
        <meta name="page-type" content="service" />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/assets/motion/motion.css" />
        <style
          id="sunset-theme"
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --bg: #05080c;
                --surface: rgba(9, 17, 24, 0.64);
                --surface-strong: rgba(18, 29, 38, 0.72);
                --ink: #f0f7fb;
                --muted: #bfd0da;
                --line: rgba(255, 255, 255, 0.14);
                --line-strong: rgba(255, 255, 255, 0.26);
                --accent: #8dd7f4;
                --action: #83cde9;
                --action-ink: #07141d;
                --heading: #b7e7fb;
                --heading-bright: #d3f2ff;
                --sky-soft: rgba(44, 78, 94, 0.72);
                --sky-pale: rgba(30, 53, 66, 0.68);
                --card: rgba(18, 29, 38, 0.72);
              }
              html, body { background: #020406 !important; color: #f0f7fb; color-scheme: dark; }
              body { position: relative; isolation: isolate; }
              body::before {
                content: ""; position: fixed; inset: -28px; z-index: 0; pointer-events: none;
                background: url("/images/interface-background.png") center / cover no-repeat;
                filter: blur(7px) saturate(.9) brightness(.7); transform: scale(1.035);
              }
              body::after {
                content: ""; position: fixed; inset: 0; z-index: 0; pointer-events: none;
                background: linear-gradient(180deg, rgba(3,6,9,.24), rgba(3,6,9,.45) 48%, rgba(2,3,5,.94));
              }
              main, .site-footer { position: relative; z-index: 1; }
              .site-header {
                position:fixed !important; top:14px !important; left:50% !important; right:auto !important; z-index:50 !important;
                width:min(1360px,calc(100% - 32px)) !important;
                border:1px solid rgba(255,255,255,.16) !important; border-radius:20px !important;
                background:rgba(4,8,12,.62) !important; box-shadow:0 18px 42px -24px rgba(0,0,0,.78) !important;
                backdrop-filter:blur(24px) saturate(125%); transform:translateX(-50%) !important;
              }
              .entry-hub, .detail-hero, .memories-page, .assistant-page, .page-hero,
              .archive-section, .about-hero, .about-section, .writing-section,
              .memories-section, .topics-section, .assistant-section { background: transparent !important; }
              .entry-board { position:relative; isolation:isolate; overflow:hidden; background:rgba(4,8,12,.42) !important; border-color:rgba(255,255,255,.16) !important; backdrop-filter:blur(20px) saturate(118%); }
              .entry-board::before { content:""; position:absolute; z-index:2; top:-12%; bottom:-12%; left:-58%; width:48%; pointer-events:none; border-radius:50%; filter:blur(48px) saturate(112%); background:linear-gradient(90deg,transparent,rgba(112,214,250,.28) 22%,rgba(164,231,255,.44) 50%,rgba(255,169,112,.18) 72%,transparent); opacity:0; will-change:transform,opacity; animation:water-flow 9s ease-in-out infinite; }
              .entry-board::after { display:none; }
              .entry-hub { display:flex; min-height:calc(100svh - 88px); flex-direction:column; justify-content:center; padding:calc(var(--nav) + 20px) 0 72px; }
              .hub-intro { display:grid; grid-template-columns:minmax(0,6fr) minmax(280px,4fr); gap:48px; align-items:end; margin-bottom:34px; }
              .entry-board { border:1px solid rgba(255,255,255,.16); border-radius:34px; padding:18px; box-shadow:inset 0 1px rgba(255,255,255,.12),0 28px 70px -42px rgba(0,0,0,.78); }
              .entry-grid { position:relative; z-index:1; display:grid; grid-template-columns:repeat(16,minmax(0,1fr)); grid-template-rows:repeat(12,42px); gap:14px; }
              .entry-card { position:relative; isolation:isolate; display:flex; min-width:0; overflow:hidden; flex-direction:column; border:1px solid rgba(255,255,255,.14); border-radius:26px; padding:26px; color:#f0f7fb; background:rgba(8,14,19,.62) !important; backdrop-filter:blur(18px) saturate(116%); }
              .entry-writing { grid-column:1 / span 9; grid-row:1 / span 5; justify-content:space-between; background:rgba(5,10,14,.64) !important; }
              .entry-memory { grid-column:10 / span 7; grid-row:2 / span 8; justify-content:space-between; padding:0; border-color:transparent; color:#fff; }
              .entry-assistant { grid-column:5 / span 5; grid-row:6 / span 4; background:rgba(8,19,26,.66) !important; }
              .entry-about { grid-column:1 / span 4; grid-row:7 / span 4; background:rgba(5,10,14,.64) !important; }
              .entry-essay { grid-column:5 / span 12; grid-row:10 / span 3; justify-content:flex-start; background:rgba(5,10,14,.64) !important; }
              .entry-card:not(.entry-memory)::before { content:""; position:absolute; inset:-18px; z-index:-2; pointer-events:none; background:url("/images/interface-background.png") center/cover no-repeat; filter:blur(16px) saturate(.88) brightness(.58); transform:scale(1.06); }
              .entry-card:not(.entry-memory)::after { content:""; position:absolute; inset:0; z-index:-1; pointer-events:none; border-radius:inherit; background:linear-gradient(145deg,rgba(3,8,12,.82),rgba(5,14,20,.6) 58%,rgba(2,5,8,.88)); }
              .entry-card:not(.entry-memory) > * { position:relative; z-index:1; }
              .entry-writing::before { background-position:36% 30%; }
              .entry-assistant::before { background-position:76% 36%; }
              .entry-about::before { background-position:18% 72%; }
              .entry-topline { display:flex; justify-content:space-between; gap:20px; color:#bfd0da; font-size:12px; letter-spacing:.08em; text-transform:uppercase; }
              .entry-writing h2,.entry-assistant h2,.entry-about h2 { margin:16px 0 8px; color:#b7e7fb; font-size:clamp(1.8rem,2.8vw,2.6rem); line-height:1.08; }
              .entry-memory h2 { margin:0; color:#fff; font-size:clamp(2.4rem,4.2vw,4rem); line-height:1.08; }
              .entry-memory-copy { position:relative; z-index:2; display:flex; height:100%; flex-direction:column; justify-content:space-between; padding:26px; }
              .latest-note { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:16px; align-items:center; border-top:1px solid rgba(255,255,255,.14); padding-top:18px; }
              .latest-note strong { overflow:hidden; color:#b7e7fb; font-weight:500; text-overflow:ellipsis; white-space:nowrap; }
              .mini-chat { display:grid; gap:6px; margin-top:auto; }
              .mini-chat span { max-width:92%; border:1px solid rgba(255,255,255,.14); border-radius:10px; padding:7px 9px; background:rgba(3,8,12,.62); color:#f0f7fb; font-size:12px; line-height:1.4; }
              .mini-chat span:last-child { justify-self:end; background:rgba(65,126,154,.72); }
              .entry-essay blockquote { max-width:54rem; margin:22px 0 0; color:#f0f7fb; font-size:clamp(1.15rem,1.7vw,1.45rem); line-height:1.55; letter-spacing:-.018em; }
              .entry-essay footer { margin-top:auto; color:#bfd0da; font-size:13px; }
              @keyframes water-flow { 0%,8%{transform:translate3d(-8%,0,0);opacity:0} 22%{opacity:.46} 62%{transform:translate3d(190%,0,0);opacity:.46} 92%,100%{transform:translate3d(390%,0,0);opacity:0} }
              .site-footer { background:rgba(1,3,5,.84) !important; backdrop-filter:blur(20px) saturate(115%); }
              @media (max-width:1023px) {
                .entry-hub { min-height:auto; padding:calc(var(--nav) + 32px) 0 72px; }
                .hub-intro { grid-template-columns:1fr; gap:20px; }
                .entry-grid { grid-template-columns:repeat(2,minmax(0,1fr)); grid-template-rows:auto; }
                .entry-writing { grid-column:1 / -1; grid-row:auto; min-height:370px; }
                .entry-memory { grid-column:1 / -1; grid-row:auto; height:440px; }
                .entry-assistant,.entry-about { grid-column:auto; grid-row:auto; min-height:260px; }
                .entry-essay { grid-column:1 / -1; grid-row:auto; min-height:180px; }
              }
              @media (max-width:639px) {
                .entry-hub { padding:calc(var(--nav) + 20px) 0 56px; }
                .hub-intro { margin-bottom:24px; }
                .entry-board { border-radius:22px; padding:8px; }
                .entry-grid { gap:10px; }
                .entry-card { border-radius:20px; padding:20px; }
                .entry-writing { min-height:330px; }
                .entry-memory { height:360px; }
                .entry-memory-copy { padding:20px; }
                .entry-assistant,.entry-about { min-height:245px; }
                .entry-essay { min-height:170px; }
                .entry-writing h2,.entry-assistant h2,.entry-about h2 { font-size:24px; }
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('m-enter','mo-js');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700);setTimeout(()=>document.documentElement.classList.add('mo-safe'),2500)",
          }}
        />
      </head>
      <body>
        <header className="site-header">
          <div className="container nav-bar">
            <a className="skip-link" href="#top">
              跳至内容
            </a>
            <Link href="/" className="brand-mark" aria-label="popxiaoli 首页">
              <span className="brand-dot" aria-hidden="true" />
              popxiaoli
            </Link>

            <nav className="desktop-nav" aria-label="主导航">
              <Link href="/">首页</Link>
              <Link href="/blog">文章</Link>
              <Link href="/memories">相册</Link>
              <Link href="/assistant">助手</Link>
              <Link href="/about">关于</Link>
            </nav>

            <div className="nav-actions">
              <span className="nav-wordmark">Realove</span>
              <details className="mobile-nav">
                <summary aria-label="打开导航">
                  <span />
                  <span />
                </summary>
                <div className="mobile-nav-panel">
                  <Link href="/">首页</Link>
                  <Link href="/blog">文章</Link>
                  <Link href="/memories">相册</Link>
                  <Link href="/assistant">助手</Link>
                  <Link href="/about">关于</Link>
                </div>
              </details>
            </div>
          </div>
        </header>

        <main id="top">{children}</main>

        <footer className="site-footer" id="site-footer">
          <div className="container footer-strip">
            <div className="footer-identity">
              <Link href="/" className="brand-mark">
                <span className="brand-dot" aria-hidden="true" />
                popxiaoli
              </Link>
              <p>iOS notes, photographs and questions.</p>
            </div>
            <nav className="footer-links" aria-label="页脚导航">
              <Link href="/blog">文章</Link>
              <Link href="/memories">相册</Link>
              <Link href="/assistant">助手</Link>
              <Link href="/about">关于</Link>
            </nav>
            <Link href="/blog" className="btn btn--primary">
              Read the blog
            </Link>
          </div>
          <div className="container footer-bottom">
            <span>popxiaoli&apos;s notes</span>
            <span>© 2026</span>
          </div>
        </footer>

        <Script
          src="/assets/motion/motion.js"
          type="module"
          strategy="afterInteractive"
        />
        <Script
          src="/assets/moments/moments.js"
          type="module"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
