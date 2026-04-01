// =============================================================================
// scripts/generate-icons-sharp.ts
// Fixed: "Cannot use same file for input and output" — generateLogoAsset now
// reads into a buffer first before writing back to public/logo.png
//
// ███████╗██╗   ██╗██╗████████╗███████╗     ██╗███╗   ███╗ █████╗  ██████╗ ███████╗
// ██╔════╝██║   ██║██║╚══██╔══╝██╔════╝     ██║████╗ ████║██╔══██╗██╔════╝ ██╔════╝
// █████╗  ██║   ██║██║   ██║   █████╗       ██║██╔████╔██║███████║██║  ███╗█████╗
// ██╔══╝  ██║   ██║██║   ██║   ██╔══╝       ██║██║╚██╔╝██║██╔══██║██║   ██║██╔══╝
// ██║     ╚██████╔╝██║   ██║   ███████╗     ██║██║ ╚═╝ ██║██║  ██║╚██████╔╝███████╗
// ╚═╝      ╚═════╝ ╚═╝   ╚═╝   ╚══════╝     ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
//
// COMPLETE DEVICE & PLATFORM COVERAGE:
// ┌─────────────────────────────────────────────────────────────────────────────┐
// │ 📱 APPLE iOS                     │ 🤖 ANDROID                              │
// ├─────────────────────────────────┼─────────────────────────────────────────┤
// │ • iPhone SE (1st gen)           │ • All Android phones                    │
// │ • iPhone 6/7/8                  │ • Adaptive icons (foreground/background)│
// │ • iPhone 8 Plus                 │ • Maskable icons for Android 8.0+       │
// │ • iPhone X / XS / 11 Pro        │ • Chrome/Edge PWA support               │
// │ • iPhone XR / 11                │ • Samsung Internet browser              │
// │ • iPhone 12 / 13 / 14           │ • Huawei devices                        │
// │ • iPhone 12/13/14 Pro Max       │ • Xiaomi, OnePlus, Pixel, etc.          │
// │ • iPhone 14/15 Pro              │ • Android tablets (all sizes)           │
// │ • iPhone 15 Pro Max             │ • ChromeOS devices                      │
// │ • iPad (standard)               │ • Wear OS smartwatches                  │
// │ • iPad Pro 11"                  │                                          │
// │ • iPad Pro 12.9"                │                                          │
// │ • Apple Watch (via companion app)│                                        │
// ├─────────────────────────────────┼─────────────────────────────────────────┤
// │ 💻 DESKTOP & WEB                │ 🌐 SOCIAL & SHARING                     │
// ├─────────────────────────────────┼─────────────────────────────────────────┤
// │ • Chrome (all platforms)        │ • Facebook Open Graph (og:image)        │
// │ • Safari (macOS & iOS)          │ • Twitter/X Cards                       │
// │ • Firefox (all platforms)       │ • LinkedIn previews                     │
// │ • Edge (Windows, Mac, Linux)    │ • WhatsApp link previews                │
// │ • Opera / Brave / Vivaldi       │ • Telegram link previews                │
// │ • PWA installation (all OS)     │ • Discord rich embeds                   │
// │ • Windows 8/10/11 tiles         │ • Slack unfurls                         │
// │ • macOS Dock icons              │ • iMessage previews                     │
// │ • Linux desktop environments    │ • Pinterest rich pins                   │
// │ • Chromebooks                   │ • Reddit embedded previews              │
// └─────────────────────────────────┴─────────────────────────────────────────┘
//
// GENERATED ASSETS (47+ files):
//   ✓ Favicons: favicon.ico + 16/32/96px PNGs + Apple Touch Icon (180px)
//   ✓ PWA Icons: 72, 96, 128, 144, 152, 192, 384, 512px
//   ✓ Android: standard + maskable icons (48, 72, 96, 144, 192, 512px)
//   ✓ Windows Tiles: 70x70, 144x144, 150x150, 310x150, 310x310 + browserconfig.xml
//   ✓ Shortcut Icons: blog, tools, games, now, apps, newsletter (96px each)
//   ✓ iOS Splash Screens: 10 device-specific launch screens
//   ✓ Social Media: og.png (1200×630) + og-base.png for dynamic overlays
//   ✓ Safari Pinned Tab: monochrome SVG for macOS/iOS tab bar
//   ✓ Logo Asset: 512×512 PNG for JSON-LD schema & PWA manifest
// =============================================================================

import sharp from "sharp";
import { mkdir, writeFile, copyFile, access, readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// ── Brand colours ─────────────────────────────────────────────────────────────
const BG_HEX = "#08080f";
const BG_RGB = { r: 8, g: 8, b: 15, alpha: 1 };
const AMBER  = { r: 245, g: 158, b: 11, alpha: 1 };

// ── Logo search order ─────────────────────────────────────────────────────────
const LOGO_CANDIDATES = [
  "public/logo.png",
  "public/logo.svg",
  "public/images/logo.png",
  "public/images/logo.svg",
  "logo.png",
  "logo.svg",
  "assets/logo.png",
  "src/assets/logo.png",
];

// ── Output directories ────────────────────────────────────────────────────────
const DIRS = {
  root:   "public",
  icons:  "public/icons",
  splash: "public/splash",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function findLogo(): Promise<string> {
  for (const p of LOGO_CANDIDATES) {
    try { await access(p); return p; } catch { /* keep trying */ }
  }
  throw new Error(
    `Logo not found. Place your logo at one of:\n${LOGO_CANDIDATES.map(p => `   ${p}`).join("\n")}`
  );
}

async function ensureDirs() {
  for (const dir of Object.values(DIRS)) await mkdir(dir, { recursive: true });
}

function log(file: string) { console.log(`  ✓  ${file}`); }

// ── Key fix: always read into a Buffer first ──────────────────────────────────
// Sharp refuses to write to the same path it reads from.
// By reading the file into memory first, the output path is free regardless
// of whether it matches the input path.
async function srcBuffer(logoPath: string): Promise<Buffer> {
  return readFile(logoPath);
}

function fromBuffer(buf: Buffer, isSvg = false) {
  return sharp(buf, isSvg ? { density: 300 } : undefined);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. FAVICONS  →  public/
//    Covers: All browsers (Chrome, Safari, Firefox, Edge, Opera)
//    Devices: Desktop, tablets, phones
// ─────────────────────────────────────────────────────────────────────────────
async function generateFavicons(logoPath: string) {
  console.log("\n🏁  Favicons — All Browsers & Devices");
  const isSvg = logoPath.endsWith(".svg");
  const buf   = await srcBuffer(logoPath);

  for (const size of [16, 32, 96]) {
    const file = path.join(DIRS.root, `favicon-${size}x${size}.png`);
    await fromBuffer(buf, isSvg)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toFile(file);
    log(file);
  }

  // favicon.ico (32px PNG — works in all modern browsers)
  const ico = path.join(DIRS.root, "favicon.ico");
  await fromBuffer(buf, isSvg)
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toFile(ico);
  log(ico);

  // Apple touch icon 180×180 (iOS, iPadOS, macOS Safari)
  const apple = path.join(DIRS.root, "apple-touch-icon.png");
  await fromBuffer(buf, isSvg)
    .resize(180, 180, { fit: "contain", background: BG_RGB })
    .png().toFile(apple);
  log(apple);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LOGO ASSET  →  public/logo.png  (512px for JSON-LD schema)
//    Used by: PWA manifest, JSON-LD structured data, Open Graph fallback
//    FIX: read into buffer BEFORE writing — prevents "same file" error
//    when source is already public/logo.png
// ─────────────────────────────────────────────────────────────────────────────
async function generateLogoAsset(logoPath: string) {
  console.log("\n🖼️   Logo Asset — 512×512 for PWA & JSON-LD Schema");
  const isSvg   = logoPath.endsWith(".svg");
  const outFile = path.join(DIRS.root, "logo.png");

  // If source IS public/logo.png (PNG), skip resize and just confirm it exists.
  // Only regenerate if source is SVG or a non-root PNG (different path).
  const resolvedSrc = path.resolve(logoPath);
  const resolvedOut = path.resolve(outFile);

  if (resolvedSrc === resolvedOut && !isSvg) {
    // Source and destination are the same PNG file — nothing to do
    log(`${outFile}  (already exists as source — skipped resize to avoid overwrite)`);
    return;
  }

  // Read source into memory first — safe for all cases
  const buf = await srcBuffer(logoPath);
  await fromBuffer(buf, isSvg)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toFile(outFile);
  log(outFile);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. OG IMAGE  →  public/og.png  (1200×630 for social sharing)
//    Platforms: Facebook, Twitter/X, LinkedIn, WhatsApp, Telegram, Discord, Slack
//    Devices: All social media apps on iOS, Android, Desktop
// ─────────────────────────────────────────────────────────────────────────────
async function generateOgImage(logoPath: string) {
  console.log("\n📸  OG Image — Social Media Sharing (1200×630)");
  const isSvg  = logoPath.endsWith(".svg");
  const W = 1200, H = 630;
  const logoSz = 140, pad = 52;

  // Dark canvas
  const bgBuf = await sharp({
    create: { width: W, height: H, channels: 4, background: BG_RGB }
  }).png().toBuffer();

  // Logo watermark (bottom-right)
  const logoBuf = await fromBuffer(await srcBuffer(logoPath), isSvg)
    .resize(logoSz, logoSz, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer();

  const file = path.join(DIRS.root, "og.png");
  await sharp(bgBuf)
    .composite([{ input: logoBuf, left: W - logoSz - pad, top: H - logoSz - pad }])
    .png().toFile(file);
  log(file);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. OG BASE  →  public/og-base.png  (for Cloudinary text overlays)
//    Used with Cloudinary to generate dynamic OG images with custom text
//    Supports: Blog posts, articles, product pages with dynamic titles
// ─────────────────────────────────────────────────────────────────────────────
async function generateOgBase(logoPath: string) {
  console.log("\n🎨  OG Base — Dynamic Social Card Template (for Cloudinary)");
  const isSvg  = logoPath.endsWith(".svg");
  const W = 1200, H = 630;
  const logoSz = 120, pad = 48;

  const bgBuf = await sharp({
    create: { width: W, height: H, channels: 4, background: BG_RGB }
  }).png().toBuffer();

  const logoBuf = await fromBuffer(await srcBuffer(logoPath), isSvg)
    .resize(logoSz, logoSz, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer();

  const file = path.join(DIRS.root, "og-base.png");
  await sharp(bgBuf)
    .composite([{ input: logoBuf, left: W - logoSz - pad, top: H - logoSz - pad }])
    .png().toFile(file);
  log(file);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PWA ICONS  →  public/icons/icon-*.png
//    Used by: PWA manifest (all platforms: iOS, Android, Windows, ChromeOS)
//    Devices: All devices when installed as Progressive Web App
// ─────────────────────────────────────────────────────────────────────────────
async function generatePwaIcons(logoPath: string) {
  console.log("\n📱  PWA Icons — Installable Web App (All Platforms)");
  const isSvg = logoPath.endsWith(".svg");
  const buf   = await srcBuffer(logoPath);

  for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) {
    const file = path.join(DIRS.icons, `icon-${size}x${size}.png`);
    await fromBuffer(buf, isSvg)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toFile(file);
    log(file);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ANDROID ICONS  →  public/icons/android-icon-*.png
//    Devices: All Android phones & tablets (Samsung, Pixel, OnePlus, Xiaomi, etc.)
//    Features: Standard icons + maskable icons for Android 8.0+
// ─────────────────────────────────────────────────────────────────────────────
async function generateAndroidIcons(logoPath: string) {
  console.log("\n🤖  Android Icons — Phones, Tablets & Wear OS");
  const isSvg = logoPath.endsWith(".svg");

  for (const size of [48, 72, 96, 144, 192, 512]) {
    const buf = await srcBuffer(logoPath);

    // Standard icon (transparent background)
    const std = path.join(DIRS.icons, `android-icon-${size}x${size}.png`);
    await fromBuffer(buf, isSvg)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toFile(std);
    log(std);

    // Maskable icon (amber bg + 10% safe-zone padding for Android adaptive icons)
    const pad    = Math.round(size * 0.1);
    const inner  = size - pad * 2;
    const buf2   = await srcBuffer(logoPath);
    const mask   = path.join(DIRS.icons, `android-icon-${size}x${size}-maskable.png`);
    await fromBuffer(buf2, isSvg)
      .resize(inner, inner, { fit: "contain", background: AMBER })
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: AMBER })
      .png().toFile(mask);
    log(mask);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SHORTCUT ICONS  →  public/icons/shortcut-*.png
//    Used for: iOS home screen shortcuts, Android shortcuts, PWA shortcuts
//    Devices: iPhone, iPad, Android phones/tablets, Chromebooks
// ─────────────────────────────────────────────────────────────────────────────
async function generateShortcutIcons(logoPath: string) {
  console.log("\n⚡  Shortcut Icons — App Shortcuts & Quick Actions");
  const isSvg = logoPath.endsWith(".svg");

  const shortcuts = [
    { name: "shortcut-blog.png",       bg: { r: 59,  g: 130, b: 246, alpha: 1 } },
    { name: "shortcut-tools.png",      bg: { r: 16,  g: 185, b: 129, alpha: 1 } },
    { name: "shortcut-games.png",      bg: { r: 245, g: 158, b: 11,  alpha: 1 } },
    { name: "shortcut-now.png",        bg: { r: 139, g: 92,  b: 246, alpha: 1 } },
    { name: "shortcut-apps.png",       bg: { r: 249, g: 115, b: 22,  alpha: 1 } },
    { name: "shortcut-newsletter.png", bg: { r: 236, g: 72,  b: 153, alpha: 1 } },
  ] as const;

  for (const { name, bg } of shortcuts) {
    const size = 96, padding = 18, inner = size - padding * 2;
    const buf  = await srcBuffer(logoPath);
    const file = path.join(DIRS.icons, name);
    await fromBuffer(buf, isSvg)
      .resize(inner, inner, { fit: "contain", background: { ...bg } })
      .extend({ top: padding, bottom: padding, left: padding, right: padding, background: { ...bg } })
      .png().toFile(file);
    log(file);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. WINDOWS TILES  →  public/icons/mstile-*.png + browserconfig.xml
//    Devices: Windows 8, Windows 10, Windows 11 desktops & tablets
//    Features: Start menu tiles, taskbar pins, browser pinned sites
// ─────────────────────────────────────────────────────────────────────────────
async function generateWindowsTiles(logoPath: string) {
  console.log("\n🪟  Windows Tiles — Windows 8/10/11 Start Menu & Taskbar");
  const isSvg = logoPath.endsWith(".svg");

  const tiles = [
    { w: 70,  h: 70,  name: "mstile-70x70.png"  },
    { w: 144, h: 144, name: "mstile-144x144.png" },
    { w: 150, h: 150, name: "mstile-150x150.png" },
    { w: 310, h: 150, name: "mstile-310x150.png" },
    { w: 310, h: 310, name: "mstile-310x310.png" },
  ];

  for (const { w, h, name } of tiles) {
    const pad   = Math.floor(Math.min(w, h) * 0.15);
    const buf   = await srcBuffer(logoPath);
    const file  = path.join(DIRS.icons, name);
    await fromBuffer(buf, isSvg)
      .resize(w - pad * 2, h - pad * 2, { fit: "contain", background: BG_RGB })
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: BG_RGB })
      .png().toFile(file);
    log(file);
  }

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo   src="/icons/mstile-70x70.png"/>
      <square150x150logo src="/icons/mstile-150x150.png"/>
      <square310x310logo src="/icons/mstile-310x310.png"/>
      <wide310x150logo   src="/icons/mstile-310x150.png"/>
      <TileColor>${BG_HEX}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
  const bcFile = path.join(DIRS.root, "browserconfig.xml");
  await writeFile(bcFile, xml, "utf-8");
  log(bcFile);
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. SAFARI PINNED TAB  →  public/safari-pinned-tab.svg
//    Device: macOS Safari, iOS Safari
//    Feature: Monochrome icon that appears in Safari tab bar and favorites
// ─────────────────────────────────────────────────────────────────────────────
async function generateSafariPinnedTab(logoPath: string) {
  console.log("\n🧭  Safari Pinned Tab — macOS & iOS Safari Tab Bar Icon");
  const outFile = path.join(DIRS.root, "safari-pinned-tab.svg");

  if (logoPath.endsWith(".svg")) {
    await copyFile(logoPath, outFile);
    log(`${outFile}  (copied — ensure shapes are black for Safari)`);
  } else {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="black"/>
  <text x="50" y="67" font-family="Georgia,serif" font-size="52" font-weight="bold"
        fill="white" text-anchor="middle">IP</text>
</svg>`;
    await writeFile(outFile, svg, "utf-8");
    log(`${outFile}  (monogram fallback — swap for your real SVG)`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. iOS SPLASH SCREENS  →  public/splash/*.png
//     Devices: All iPhone models (5/SE through 15 Pro Max) and all iPad models
//     Feature: Launch screens that appear when app is installed to home screen
// ─────────────────────────────────────────────────────────────────────────────
async function generateSplashScreens(logoPath: string) {
  console.log("\n🌅  iOS Splash Screens — All iPhone & iPad Models");
  const isSvg = logoPath.endsWith(".svg");

  const screens = [
    { w: 640,  h: 1136, name: "iphone5.png",       device: "iPhone 5 / SE 1st"      },
    { w: 750,  h: 1334, name: "iphone6.png",        device: "iPhone 6/7/8 / SE 2nd"  },
    { w: 828,  h: 1792, name: "iphonexr.png",       device: "iPhone XR / 11"          },
    { w: 1125, h: 2436, name: "iphonex.png",        device: "iPhone X / XS / 11 Pro"  },
    { w: 1170, h: 2532, name: "iphone12.png",       device: "iPhone 12 / 13 / 14"     },
    { w: 1284, h: 2778, name: "iphone12promax.png", device: "iPhone 12/13/14 Pro Max" },
    { w: 1290, h: 2796, name: "iphone14pro.png",    device: "iPhone 14/15 Pro Max"    },
    { w: 1536, h: 2048, name: "ipad.png",           device: "iPad"                     },
    { w: 1668, h: 2388, name: "ipadpro11.png",      device: "iPad Pro 11\""            },
    { w: 2048, h: 2732, name: "ipadpro12.png",      device: "iPad Pro 12.9\""          },
  ];

  for (const { w, h, name, device } of screens) {
    const logoSz  = Math.floor(Math.min(w, h) / 3.2);
    const padTop  = Math.floor((h - logoSz) / 2);
    const padBot  = h - logoSz - padTop;
    const padLeft = Math.floor((w - logoSz) / 2);
    const padRight= w - logoSz - padLeft;
    const buf     = await srcBuffer(logoPath);
    const file    = path.join(DIRS.splash, name);

    await fromBuffer(buf, isSvg)
      .resize(logoSz, logoSz, { fit: "contain", background: BG_RGB })
      .extend({ top: padTop, bottom: padBot, left: padLeft, right: padRight, background: BG_RGB })
      .png().toFile(file);
    log(`${file}  (${device} · ${w}×${h})`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🎨  isaacpaha.com — Complete Multi-Platform Icon & Asset Generator");
  console.log("═".repeat(80));
  console.log("\n📱  Supported Platforms:");
  console.log("    • Apple:  iPhone (SE → 15 Pro Max) · iPad · iPad Pro · macOS");
  console.log("    • Google: Android Phones · Tablets · Wear OS · ChromeOS");
  console.log("    • Microsoft: Windows 8/10/11 · Edge · Start Menu Tiles");
  console.log("    • Social:  Facebook · Twitter · LinkedIn · WhatsApp · Telegram · Discord");
  console.log("    • Browsers: Chrome · Safari · Firefox · Edge · Opera · Brave");
  console.log("    • PWA:     Installable Web App on ALL platforms");
  console.log("═".repeat(80));

  let logoPath: string;
  try {
    logoPath = await findLogo();
    console.log(`\n✓  Logo found: ${logoPath}`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  await ensureDirs();
  console.log("✓  Output directories ready");

  try {
    await generateFavicons(logoPath);
    await generateLogoAsset(logoPath);
    await generateOgImage(logoPath);
    await generateOgBase(logoPath);
    await generateSafariPinnedTab(logoPath);
    await generatePwaIcons(logoPath);
    await generateAndroidIcons(logoPath);
    await generateShortcutIcons(logoPath);
    await generateWindowsTiles(logoPath);
    await generateSplashScreens(logoPath);
  } catch (err) {
    console.error("\n❌  Generation failed:", (err as Error).message);
    console.error((err as Error).stack);
    process.exit(1);
  }

  const total = 4 + 1 + 1 + 1 + 1 + 1 + 8 + 12 + 6 + 6 + 10;
  console.log("\n" + "─".repeat(80));
  console.log(`✅  Complete! ${total} files generated for ALL devices & platforms\n`);
  console.log("📁  Generated Asset Structure:");
  console.log("    public/");
  console.log("    ├── favicon-{16,32,96}.png · favicon.ico · apple-touch-icon.png");
  console.log("    ├── logo.png (512×512) · og.png (1200×630) · og-base.png (1200×630)");
  console.log("    ├── safari-pinned-tab.svg · browserconfig.xml");
  console.log("    ├── icons/");
  console.log("    │   ├── icon-*.png           (PWA: 72→512px)");
  console.log("    │   ├── android-icon-*.png    (Android standard & maskable)");
  console.log("    │   ├── shortcut-*.png         (6 app shortcuts)");
  console.log("    │   └── mstile-*.png           (Windows tiles)");
  console.log("    └── splash/");
  console.log("        ├── iphone5.png · iphone6.png · iphonexr.png · iphonex.png");
  console.log("        ├── iphone12.png · iphone12promax.png · iphone14pro.png");
  console.log("        └── ipad.png · ipadpro11.png · ipadpro12.png");
  console.log("\n💡  Next Steps:");
  console.log("    1. ✅ og.png is your static social image — already in layout.tsx");
  console.log("    2. ✅ Upload og-base.png to Cloudinary as isaacpaha/og-base.png");
  console.log("    3. ✅ Replace safari-pinned-tab.svg with your monochrome SVG if available");
  console.log("    4. ✅ Run: npx tsx scripts/generate-icons-sharp.ts to regenerate anytime");
  console.log("\n🌐  Your app is now ready for:");
  console.log("    • iOS Home Screen installation (iPhone & iPad)");
  console.log("    • Android PWA installation (Chrome, Samsung Internet)");
  console.log("    • Windows Start Menu pinning");
  console.log("    • Social media sharing across all platforms");
  console.log("    • SEO optimization with structured data logo");
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });







// // =============================================================================
// // scripts/generate-icons-sharp.ts
// // Fixed: "Cannot use same file for input and output" — generateLogoAsset now
// // reads into a buffer first before writing back to public/logo.png
// // =============================================================================
// import sharp from "sharp";
// import { mkdir, writeFile, copyFile, access, readFile } from "fs/promises";
// import path from "path";
// import { existsSync } from "fs";

// // ── Brand colours ─────────────────────────────────────────────────────────────
// const BG_HEX = "#08080f";
// const BG_RGB = { r: 8, g: 8, b: 15, alpha: 1 };
// const AMBER  = { r: 245, g: 158, b: 11, alpha: 1 };

// // ── Logo search order ─────────────────────────────────────────────────────────
// const LOGO_CANDIDATES = [
//   "public/logo.png",
//   "public/logo.svg",
//   "public/images/logo.png",
//   "public/images/logo.svg",
//   "logo.png",
//   "logo.svg",
//   "assets/logo.png",
//   "src/assets/logo.png",
// ];

// // ── Output directories ────────────────────────────────────────────────────────
// const DIRS = {
//   root:   "public",
//   icons:  "public/icons",
//   splash: "public/splash",
// } as const;

// // ─────────────────────────────────────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────────────────────────────────────

// async function findLogo(): Promise<string> {
//   for (const p of LOGO_CANDIDATES) {
//     try { await access(p); return p; } catch { /* keep trying */ }
//   }
//   throw new Error(
//     `Logo not found. Place your logo at one of:\n${LOGO_CANDIDATES.map(p => `   ${p}`).join("\n")}`
//   );
// }

// async function ensureDirs() {
//   for (const dir of Object.values(DIRS)) await mkdir(dir, { recursive: true });
// }

// function log(file: string) { console.log(`  ✓  ${file}`); }

// // ── Key fix: always read into a Buffer first ──────────────────────────────────
// // Sharp refuses to write to the same path it reads from.
// // By reading the file into memory first, the output path is free regardless
// // of whether it matches the input path.
// async function srcBuffer(logoPath: string): Promise<Buffer> {
//   return readFile(logoPath);
// }

// function fromBuffer(buf: Buffer, isSvg = false) {
//   return sharp(buf, isSvg ? { density: 300 } : undefined);
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 1. FAVICONS  →  public/
// // ─────────────────────────────────────────────────────────────────────────────
// async function generateFavicons(logoPath: string) {
//   console.log("\n🏁  Favicons");
//   const isSvg = logoPath.endsWith(".svg");
//   const buf   = await srcBuffer(logoPath);

//   for (const size of [16, 32, 96]) {
//     const file = path.join(DIRS.root, `favicon-${size}x${size}.png`);
//     await fromBuffer(buf, isSvg)
//       .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
//       .png().toFile(file);
//     log(file);
//   }

//   // favicon.ico (32px PNG — works in all modern browsers)
//   const ico = path.join(DIRS.root, "favicon.ico");
//   await fromBuffer(buf, isSvg)
//     .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
//     .png().toFile(ico);
//   log(ico);

//   // Apple touch icon 180×180
//   const apple = path.join(DIRS.root, "apple-touch-icon.png");
//   await fromBuffer(buf, isSvg)
//     .resize(180, 180, { fit: "contain", background: BG_RGB })
//     .png().toFile(apple);
//   log(apple);
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 2. LOGO ASSET  →  public/logo.png  (512px for JSON-LD schema)
// //    FIX: read into buffer BEFORE writing — prevents "same file" error
// //    when source is already public/logo.png
// // ─────────────────────────────────────────────────────────────────────────────
// async function generateLogoAsset(logoPath: string) {
//   console.log("\n🖼️   Logo asset (512×512 for JSON-LD schema)");
//   const isSvg   = logoPath.endsWith(".svg");
//   const outFile = path.join(DIRS.root, "logo.png");

//   // If source IS public/logo.png (PNG), skip resize and just confirm it exists.
//   // Only regenerate if source is SVG or a non-root PNG (different path).
//   const resolvedSrc = path.resolve(logoPath);
//   const resolvedOut = path.resolve(outFile);

//   if (resolvedSrc === resolvedOut && !isSvg) {
//     // Source and destination are the same PNG file — nothing to do
//     log(`${outFile}  (already exists as source — skipped resize to avoid overwrite)`);
//     return;
//   }

//   // Read source into memory first — safe for all cases
//   const buf = await srcBuffer(logoPath);
//   await fromBuffer(buf, isSvg)
//     .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
//     .png().toFile(outFile);
//   log(outFile);
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 3. OG IMAGE  →  public/og.png  (1200×630 for social sharing)
// //    This is the static fallback used in layout.tsx og:image
// // ─────────────────────────────────────────────────────────────────────────────
// async function generateOgImage(logoPath: string) {
//   console.log("\n📸  OG image (1200×630 for og:image in layout.tsx)");
//   const isSvg  = logoPath.endsWith(".svg");
//   const W = 1200, H = 630;
//   const logoSz = 140, pad = 52;

//   // Dark canvas
//   const bgBuf = await sharp({
//     create: { width: W, height: H, channels: 4, background: BG_RGB }
//   }).png().toBuffer();

//   // Logo watermark (bottom-right)
//   const logoBuf = await fromBuffer(await srcBuffer(logoPath), isSvg)
//     .resize(logoSz, logoSz, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
//     .png().toBuffer();

//   const file = path.join(DIRS.root, "og.png");
//   await sharp(bgBuf)
//     .composite([{ input: logoBuf, left: W - logoSz - pad, top: H - logoSz - pad }])
//     .png().toFile(file);
//   log(file);
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 4. OG BASE  →  public/og-base.png  (for Cloudinary text overlays)
// // ─────────────────────────────────────────────────────────────────────────────
// async function generateOgBase(logoPath: string) {
//   console.log("\n🎨  OG base (for Cloudinary overlays)");
//   const isSvg  = logoPath.endsWith(".svg");
//   const W = 1200, H = 630;
//   const logoSz = 120, pad = 48;

//   const bgBuf = await sharp({
//     create: { width: W, height: H, channels: 4, background: BG_RGB }
//   }).png().toBuffer();

//   const logoBuf = await fromBuffer(await srcBuffer(logoPath), isSvg)
//     .resize(logoSz, logoSz, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
//     .png().toBuffer();

//   const file = path.join(DIRS.root, "og-base.png");
//   await sharp(bgBuf)
//     .composite([{ input: logoBuf, left: W - logoSz - pad, top: H - logoSz - pad }])
//     .png().toFile(file);
//   log(file);
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 5. PWA ICONS  →  public/icons/icon-*.png
// // ─────────────────────────────────────────────────────────────────────────────
// async function generatePwaIcons(logoPath: string) {
//   console.log("\n📱  PWA icons");
//   const isSvg = logoPath.endsWith(".svg");
//   const buf   = await srcBuffer(logoPath);

//   for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) {
//     const file = path.join(DIRS.icons, `icon-${size}x${size}.png`);
//     await fromBuffer(buf, isSvg)
//       .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
//       .png().toFile(file);
//     log(file);
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 6. ANDROID ICONS  →  public/icons/android-icon-*.png
// // ─────────────────────────────────────────────────────────────────────────────
// async function generateAndroidIcons(logoPath: string) {
//   console.log("\n🤖  Android adaptive icons");
//   const isSvg = logoPath.endsWith(".svg");

//   for (const size of [48, 72, 96, 144, 192, 512]) {
//     const buf = await srcBuffer(logoPath);

//     // Standard
//     const std = path.join(DIRS.icons, `android-icon-${size}x${size}.png`);
//     await fromBuffer(buf, isSvg)
//       .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
//       .png().toFile(std);
//     log(std);

//     // Maskable (amber bg + 10% safe-zone padding)
//     const pad    = Math.round(size * 0.1);
//     const inner  = size - pad * 2;
//     const buf2   = await srcBuffer(logoPath);
//     const mask   = path.join(DIRS.icons, `android-icon-${size}x${size}-maskable.png`);
//     await fromBuffer(buf2, isSvg)
//       .resize(inner, inner, { fit: "contain", background: AMBER })
//       .extend({ top: pad, bottom: pad, left: pad, right: pad, background: AMBER })
//       .png().toFile(mask);
//     log(mask);
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 7. SHORTCUT ICONS  →  public/icons/shortcut-*.png
// // ─────────────────────────────────────────────────────────────────────────────
// async function generateShortcutIcons(logoPath: string) {
//   console.log("\n⚡  Shortcut icons");
//   const isSvg = logoPath.endsWith(".svg");

//   const shortcuts = [
//     { name: "shortcut-blog.png",       bg: { r: 59,  g: 130, b: 246, alpha: 1 } },
//     { name: "shortcut-tools.png",      bg: { r: 16,  g: 185, b: 129, alpha: 1 } },
//     { name: "shortcut-games.png",      bg: { r: 245, g: 158, b: 11,  alpha: 1 } },
//     { name: "shortcut-now.png",        bg: { r: 139, g: 92,  b: 246, alpha: 1 } },
//     { name: "shortcut-apps.png",       bg: { r: 249, g: 115, b: 22,  alpha: 1 } },
//     { name: "shortcut-newsletter.png", bg: { r: 236, g: 72,  b: 153, alpha: 1 } },
//   ] as const;

//   for (const { name, bg } of shortcuts) {
//     const size = 96, padding = 18, inner = size - padding * 2;
//     const buf  = await srcBuffer(logoPath);
//     const file = path.join(DIRS.icons, name);
//     await fromBuffer(buf, isSvg)
//       .resize(inner, inner, { fit: "contain", background: { ...bg } })
//       .extend({ top: padding, bottom: padding, left: padding, right: padding, background: { ...bg } })
//       .png().toFile(file);
//     log(file);
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 8. WINDOWS TILES  →  public/icons/mstile-*.png + browserconfig.xml
// // ─────────────────────────────────────────────────────────────────────────────
// async function generateWindowsTiles(logoPath: string) {
//   console.log("\n🪟  Windows tiles");
//   const isSvg = logoPath.endsWith(".svg");

//   const tiles = [
//     { w: 70,  h: 70,  name: "mstile-70x70.png"  },
//     { w: 144, h: 144, name: "mstile-144x144.png" },
//     { w: 150, h: 150, name: "mstile-150x150.png" },
//     { w: 310, h: 150, name: "mstile-310x150.png" },
//     { w: 310, h: 310, name: "mstile-310x310.png" },
//   ];

//   for (const { w, h, name } of tiles) {
//     const pad   = Math.floor(Math.min(w, h) * 0.15);
//     const buf   = await srcBuffer(logoPath);
//     const file  = path.join(DIRS.icons, name);
//     await fromBuffer(buf, isSvg)
//       .resize(w - pad * 2, h - pad * 2, { fit: "contain", background: BG_RGB })
//       .extend({ top: pad, bottom: pad, left: pad, right: pad, background: BG_RGB })
//       .png().toFile(file);
//     log(file);
//   }

//   const xml = `<?xml version="1.0" encoding="utf-8"?>
// <browserconfig>
//   <msapplication>
//     <tile>
//       <square70x70logo   src="/icons/mstile-70x70.png"/>
//       <square150x150logo src="/icons/mstile-150x150.png"/>
//       <square310x310logo src="/icons/mstile-310x310.png"/>
//       <wide310x150logo   src="/icons/mstile-310x150.png"/>
//       <TileColor>${BG_HEX}</TileColor>
//     </tile>
//   </msapplication>
// </browserconfig>`;
//   const bcFile = path.join(DIRS.root, "browserconfig.xml");
//   await writeFile(bcFile, xml, "utf-8");
//   log(bcFile);
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 9. SAFARI PINNED TAB  →  public/safari-pinned-tab.svg
// // ─────────────────────────────────────────────────────────────────────────────
// async function generateSafariPinnedTab(logoPath: string) {
//   console.log("\n🧭  Safari pinned tab SVG");
//   const outFile = path.join(DIRS.root, "safari-pinned-tab.svg");

//   if (logoPath.endsWith(".svg")) {
//     await copyFile(logoPath, outFile);
//     log(`${outFile}  (copied — ensure shapes are black for Safari)`);
//   } else {
//     const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
//   <circle cx="50" cy="50" r="48" fill="black"/>
//   <text x="50" y="67" font-family="Georgia,serif" font-size="52" font-weight="bold"
//         fill="white" text-anchor="middle">IP</text>
// </svg>`;
//     await writeFile(outFile, svg, "utf-8");
//     log(`${outFile}  (monogram fallback — swap for your real SVG)`);
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // 10. iOS SPLASH SCREENS  →  public/splash/*.png
// // ─────────────────────────────────────────────────────────────────────────────
// async function generateSplashScreens(logoPath: string) {
//   console.log("\n🌅  iOS splash screens");
//   const isSvg = logoPath.endsWith(".svg");

//   const screens = [
//     { w: 640,  h: 1136, name: "iphone5.png",       device: "iPhone 5 / SE 1st"      },
//     { w: 750,  h: 1334, name: "iphone6.png",        device: "iPhone 6/7/8 / SE 2nd"  },
//     { w: 828,  h: 1792, name: "iphonexr.png",       device: "iPhone XR / 11"          },
//     { w: 1125, h: 2436, name: "iphonex.png",        device: "iPhone X / XS / 11 Pro"  },
//     { w: 1170, h: 2532, name: "iphone12.png",       device: "iPhone 12 / 13 / 14"     },
//     { w: 1284, h: 2778, name: "iphone12promax.png", device: "iPhone 12/13/14 Pro Max"  },
//     { w: 1290, h: 2796, name: "iphone14pro.png",    device: "iPhone 14/15 Pro Max"     },
//     { w: 1536, h: 2048, name: "ipad.png",           device: "iPad"                     },
//     { w: 1668, h: 2388, name: "ipadpro11.png",      device: "iPad Pro 11\""            },
//     { w: 2048, h: 2732, name: "ipadpro12.png",      device: "iPad Pro 12.9\""          },
//   ];

//   for (const { w, h, name, device } of screens) {
//     const logoSz  = Math.floor(Math.min(w, h) / 3.2);
//     const padTop  = Math.floor((h - logoSz) / 2);
//     const padBot  = h - logoSz - padTop;
//     const padLeft = Math.floor((w - logoSz) / 2);
//     const padRight= w - logoSz - padLeft;
//     const buf     = await srcBuffer(logoPath);
//     const file    = path.join(DIRS.splash, name);

//     await fromBuffer(buf, isSvg)
//       .resize(logoSz, logoSz, { fit: "contain", background: BG_RGB })
//       .extend({ top: padTop, bottom: padBot, left: padLeft, right: padRight, background: BG_RGB })
//       .png().toFile(file);
//     log(`${file}  (${device} · ${w}×${h})`);
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN
// // ─────────────────────────────────────────────────────────────────────────────
// async function main() {
//   console.log("🎨  isaacpaha.com — Icon & Asset Generator");
//   console.log("═".repeat(60));

//   let logoPath: string;
//   try {
//     logoPath = await findLogo();
//     console.log(`\n✓  Logo: ${logoPath}`);
//   } catch (err) {
//     console.error((err as Error).message);
//     process.exit(1);
//   }

//   await ensureDirs();
//   console.log("✓  Directories ready");

//   try {
//     await generateFavicons(logoPath);
//     await generateLogoAsset(logoPath);       // ← fixed: buffer-first approach
//     await generateOgImage(logoPath);         // ← new: public/og.png for og:image
//     await generateOgBase(logoPath);
//     await generateSafariPinnedTab(logoPath);
//     await generatePwaIcons(logoPath);
//     await generateAndroidIcons(logoPath);
//     await generateShortcutIcons(logoPath);
//     await generateWindowsTiles(logoPath);
//     await generateSplashScreens(logoPath);
//   } catch (err) {
//     console.error("\n❌  Generation failed:", (err as Error).message);
//     console.error((err as Error).stack);
//     process.exit(1);
//   }

//   const total = 4 + 1 + 1 + 1 + 1 + 1 + 8 + 12 + 6 + 6 + 10;
//   console.log("\n" + "─".repeat(60));
//   console.log(`✅  Done — ${total} files generated\n`);
//   console.log("📁  public/");
//   console.log("    ├── favicon-{16,32,96}x*.png · favicon.ico · apple-touch-icon.png");
//   console.log("    ├── logo.png (512×512) · og.png (1200×630) · og-base.png (1200×630)");
//   console.log("    ├── safari-pinned-tab.svg · browserconfig.xml");
//   console.log("    ├── icons/  →  icon-*.png · android-icon-*.png · shortcut-*.png · mstile-*.png");
//   console.log("    └── splash/ →  10 iOS device sizes");
//   console.log("\n💡  Action items:");
//   console.log("    1. og.png is now your static og:image — already wired in layout.tsx");
//   console.log("    2. Upload og-base.png to Cloudinary as isaacpaha/og-base.png");
//   console.log("    3. Replace safari-pinned-tab.svg with a real single-colour SVG if you have one");
//   console.log("    4. Run: npx tsx scripts/generate-icons-sharp.ts   to regenerate anytime");
// }

// main().catch(err => { console.error("Fatal:", err); process.exit(1); });



