// =============================================================================
// scripts/generate-icons-sharp.ts
//
// Generates every icon, favicon, splash screen and asset referenced anywhere
// in the isaacpaha.com codebase:
//
//   layout.tsx           → /favicon-*.png, /favicon.ico, /apple-touch-icon.png,
//                          /safari-pinned-tab.svg (via logo SVG if present),
//                          /logo.png (512px, for JSON-LD WebSite schema)
//
//   manifest-route.ts    → /icons/icon-*.png, /icons/android-icon-*.png,
//                          /icons/shortcut-blog.png, /icons/shortcut-tools.png,
//                          /icons/shortcut-games.png, /icons/shortcut-now.png
//
//   next.config.ts /     → /icons/mstile-*.png, /browserconfig.xml
//   Windows tiles
//
//   iOS Safari           → /splash/*.png (9 device sizes, #08080f background)
//
//   Apple meta tags      → /apple-touch-icon.png (180×180 at root)
//
// Usage:
//   npx ts-node --esm scripts/generate-icons-sharp.ts
//   OR add to package.json: "generate-icons": "npx ts-node --esm scripts/generate-icons-sharp.ts"
//
// Requires:  npm install --save-dev sharp @types/sharp ts-node typescript
// =============================================================================

import sharp from "sharp";
import { mkdir, writeFile, copyFile, access } from "fs/promises";
import path from "path";

// ── Site brand colours ────────────────────────────────────────────────────────
const BG_HEX  = "#08080f";                        // Site background
const BG_RGB  = { r: 8,  g: 8,  b: 15, alpha: 1 };// Parsed for sharp
const AMBER   = { r: 245, g: 158, b: 11 };        // #f59e0b accent

// ── Logo search paths (tried in order) ───────────────────────────────────────
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
  root:      "public",           // favicon.ico, apple-touch-icon.png, logo.png
  icons:     "public/icons",     // PWA icons, Android, Windows tiles, shortcuts
  splash:    "public/splash",    // iOS splash screens
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────
interface SizeSpec  { size: number }
interface RectSpec  { w: number; h: number; name: string }

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function findLogo(): Promise<string> {
  for (const p of LOGO_CANDIDATES) {
    try {
      await access(p);
      return p;
    } catch {
      /* keep trying */
    }
  }
  throw new Error(
    `❌  Logo not found. Place your logo at one of:\n${LOGO_CANDIDATES.map(p => `   ${p}`).join("\n")}`
  );
}

async function ensureDirs(): Promise<void> {
  for (const dir of Object.values(DIRS)) {
    await mkdir(dir, { recursive: true });
  }
}

function log(file: string): void {
  console.log(`  ✓  ${file}`);
}

// Create a Sharp instance from the source — re-used per icon to avoid re-reading
function src(logoPath: string) {
  return sharp(logoPath, { density: 300 }); // density=300 for SVG rasterisation
}

// ─────────────────────────────────────────────────────────────────────────────
// FAVICON GENERATION
// Files referenced in layout.tsx icons array + browser defaults
// ─────────────────────────────────────────────────────────────────────────────
async function generateFavicons(logoPath: string): Promise<void> {
  console.log("\n🏁  Favicons (referenced in layout.tsx)");

  // Standard favicon sizes — output to public/ root so /favicon-32x32.png works
  for (const size of [16, 32, 96]) {
    const file = path.join(DIRS.root, `favicon-${size}x${size}.png`);
    await src(logoPath)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(file);
    log(file);
  }

  // favicon.ico — browsers expect this at the root.
  // Sharp can't write true multi-size ICO; we output a 32×32 PNG with .ico extension.
  // For a real multi-size ICO, use `ico-endec` or `toIco` npm package after this step.
  // Most modern browsers are happy with a PNG served as favicon.ico.
  const icoFile = path.join(DIRS.root, "favicon.ico");
  await src(logoPath)
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(icoFile);
  log(icoFile);

  // Apple touch icon — must be at /apple-touch-icon.png (root)
  const appleFile = path.join(DIRS.root, "apple-touch-icon.png");
  await src(logoPath)
    .resize(180, 180, { fit: "contain", background: BG_RGB })
    .png()
    .toFile(appleFile);
  log(appleFile);
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGO COPY
// /logo.png (512px) — referenced in JSON-LD WebSite schema
// ─────────────────────────────────────────────────────────────────────────────
async function generateLogoAsset(logoPath: string): Promise<void> {
  console.log("\n🖼️   Logo asset (for JSON-LD schema)");

  const file = path.join(DIRS.root, "logo.png");
  await src(logoPath)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(file);
  log(file);
}

// ─────────────────────────────────────────────────────────────────────────────
// PWA ICONS  /icons/icon-*.png
// Sizes listed in manifest-route.ts icons array
// ─────────────────────────────────────────────────────────────────────────────
async function generatePwaIcons(logoPath: string): Promise<void> {
  console.log("\n📱  PWA icons (manifest-route.ts icons array)");

  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  for (const size of sizes) {
    const file = path.join(DIRS.icons, `icon-${size}x${size}.png`);
    await src(logoPath)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(file);
    log(file);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ANDROID ADAPTIVE ICONS  /icons/android-icon-*.png
// ─────────────────────────────────────────────────────────────────────────────
async function generateAndroidIcons(logoPath: string): Promise<void> {
  console.log("\n🤖  Android adaptive icons");

  // Use amber background for maskable (fills the safe zone)
  const maskableBg = { r: AMBER.r, g: AMBER.g, b: AMBER.b, alpha: 1 };

  for (const size of [48, 72, 96, 144, 192, 512]) {
    // Standard (transparent background)
    const std = path.join(DIRS.icons, `android-icon-${size}x${size}.png`);
    await src(logoPath)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(std);
    log(std);

    // Maskable version (amber bg, logo at ~80% to respect safe zone padding)
    const padded    = Math.round(size * 0.1);      // 10% padding each side
    const logoSize  = size - padded * 2;
    const maskable  = path.join(DIRS.icons, `android-icon-${size}x${size}-maskable.png`);
    await src(logoPath)
      .resize(logoSize, logoSize, { fit: "contain", background: maskableBg })
      .extend({ top: padded, bottom: padded, left: padded, right: padded, background: maskableBg })
      .png()
      .toFile(maskable);
    log(maskable);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHORTCUT ICONS — exact names referenced in manifest-route.ts
// /icons/shortcut-blog.png
// /icons/shortcut-tools.png
// /icons/shortcut-games.png
// /icons/shortcut-now.png
// ─────────────────────────────────────────────────────────────────────────────
async function generateShortcutIcons(logoPath: string): Promise<void> {
  console.log("\n⚡  PWA shortcut icons (manifest-route.ts shortcuts array)");

  // Each shortcut gets its own amber-background tile with an emoji overlay
  // We composite a coloured background + centred logo for each shortcut
  const shortcuts: { name: string; bg: sharp.RGBA; label: string }[] = [
    { name: "shortcut-blog.png",       bg: { r: 59,  g: 130, b: 246, alpha: 1 }, label: "blog"       },
    { name: "shortcut-tools.png",      bg: { r: 16,  g: 185, b: 129, alpha: 1 }, label: "tools"      },
    { name: "shortcut-games.png",      bg: { r: 245, g: 158, b: 11,  alpha: 1 }, label: "games"      },
    { name: "shortcut-now.png",        bg: { r: 139, g: 92,  b: 246, alpha: 1 }, label: "now"        },
    { name: "shortcut-apps.png",       bg: { r: 249, g: 115, b: 22,  alpha: 1 }, label: "apps"       },
    { name: "shortcut-newsletter.png", bg: { r: 236, g: 72,  b: 153, alpha: 1 }, label: "newsletter" },
  ];

  for (const { name, bg } of shortcuts) {
    const size    = 96;
    const padding = 18;
    const logoSz  = size - padding * 2;
    const file    = path.join(DIRS.icons, name);

    await src(logoPath)
      .resize(logoSz, logoSz, { fit: "contain", background: bg })
      .extend({ top: padding, bottom: padding, left: padding, right: padding, background: bg })
      .png()
      .toFile(file);
    log(file);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WINDOWS TILES — /icons/mstile-*.png + /browserconfig.xml
// ─────────────────────────────────────────────────────────────────────────────
async function generateWindowsTiles(logoPath: string): Promise<void> {
  console.log("\n🪟  Windows / Microsoft tiles");

  const tiles: { w: number; h: number; name: string }[] = [
    { w: 70,  h: 70,  name: "mstile-70x70.png"   },
    { w: 144, h: 144, name: "mstile-144x144.png"  },
    { w: 150, h: 150, name: "mstile-150x150.png"  },
    { w: 310, h: 150, name: "mstile-310x150.png"  },
    { w: 310, h: 310, name: "mstile-310x310.png"  },
  ];

  for (const { w, h, name } of tiles) {
    const file    = path.join(DIRS.icons, name);
    const padding = Math.floor(Math.min(w, h) * 0.15);
    const logoW   = w - padding * 2;
    const logoH   = h - padding * 2;

    await src(logoPath)
      .resize(logoW, logoH, { fit: "contain", background: BG_RGB })
      .extend({ top: padding, bottom: padding, left: padding, right: padding, background: BG_RGB })
      .png()
      .toFile(file);
    log(file);
  }

  // browserconfig.xml — tells IE/Edge about the tiles
  const browserconfig = `<?xml version="1.0" encoding="utf-8"?>
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
  await writeFile(bcFile, browserconfig, "utf-8");
  log(bcFile);
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFARI PINNED TAB SVG  /safari-pinned-tab.svg
// Referenced in layout.tsx: <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#f59e0b">
// Safari needs a single-colour SVG (black shapes on transparent).
// If source logo is SVG, we copy it and strip colours → make it black.
// If source is PNG, we generate a minimal circle-with-IP monogram as fallback.
// ─────────────────────────────────────────────────────────────────────────────
async function generateSafariPinnedTab(logoPath: string): Promise<void> {
  console.log("\n🧭  Safari pinned tab SVG");

  const isSourceSvg = logoPath.toLowerCase().endsWith(".svg");
  const outFile     = path.join(DIRS.root, "safari-pinned-tab.svg");

  if (isSourceSvg) {
    // Copy the SVG — Safari will use the alpha channel (shapes must be black)
    await copyFile(logoPath, outFile);
    log(`${outFile}  (copied from ${logoPath} — ensure shapes are black/opaque for Safari)`);
  } else {
    // Generate a minimal monogram SVG as a safe fallback
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="black"/>
  <text x="50" y="67" font-family="Georgia,serif" font-size="52" font-weight="bold"
        fill="white" text-anchor="middle">IP</text>
</svg>`;
    await writeFile(outFile, svg, "utf-8");
    log(`${outFile}  (monogram fallback — replace with your actual SVG logo)`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// iOS SPLASH SCREENS  /splash/*.png
// background: #08080f · logo centred at 1/3 screen size
// ─────────────────────────────────────────────────────────────────────────────
async function generateSplashScreens(logoPath: string): Promise<void> {
  console.log("\n🌅  iOS splash screens");

  const splashSizes: { w: number; h: number; name: string; device: string }[] = [
    { w: 640,  h: 1136, name: "iphone5.png",       device: "iPhone 5/SE 1st gen"  },
    { w: 750,  h: 1334, name: "iphone6.png",        device: "iPhone 6/7/8/SE 2nd" },
    { w: 828,  h: 1792, name: "iphonexr.png",       device: "iPhone XR/11"        },
    { w: 1125, h: 2436, name: "iphonex.png",        device: "iPhone X/XS/11 Pro"  },
    { w: 1170, h: 2532, name: "iphone12.png",       device: "iPhone 12/13/14"     },
    { w: 1284, h: 2778, name: "iphone12promax.png", device: "iPhone 12/13/14 Pro Max" },
    { w: 1290, h: 2796, name: "iphone14pro.png",    device: "iPhone 14/15 Pro Max"},
    { w: 1536, h: 2048, name: "ipad.png",           device: "iPad"                },
    { w: 1668, h: 2388, name: "ipadpro11.png",      device: "iPad Pro 11\""       },
    { w: 2048, h: 2732, name: "ipadpro12.png",      device: "iPad Pro 12.9\""     },
  ];

  for (const { w, h, name, device } of splashSizes) {
    const logoSize = Math.floor(Math.min(w, h) / 3.2);
    const padTop   = Math.floor((h - logoSize) / 2);
    const padBot   = h - logoSize - padTop;
    const padLeft  = Math.floor((w - logoSize) / 2);
    const padRight = w - logoSize - padLeft;

    const file = path.join(DIRS.splash, name);
    await src(logoPath)
      .resize(logoSize, logoSize, { fit: "contain", background: BG_RGB })
      .extend({ top: padTop, bottom: padBot, left: padLeft, right: padRight, background: BG_RGB })
      .png()
      .toFile(file);
    log(`${file}  (${device} · ${w}×${h})`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OG BASE IMAGE  /public/og-base.png  (for Cloudinary text-overlay OG)
// Referenced in lib/seo/metadata.ts cloudinaryOgImage()
// ─────────────────────────────────────────────────────────────────────────────
async function generateOgBase(logoPath: string): Promise<void> {
  console.log("\n📸  Open Graph base image (/public/og-base.png)");

  // 1200×630 dark background — we place the logo bottom-right as a watermark
  const W = 1200, H = 630;
  const logoSize   = 120;
  const padding    = 48;

  // Build a dark canvas via compositing
  const bg = await sharp({
    create: { width: W, height: H, channels: 4, background: BG_RGB }
  }).png().toBuffer();

  const logoBuffer = await src(logoPath)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const file = path.join(DIRS.root, "og-base.png");
  await sharp(bg)
    .composite([{
      input:     logoBuffer,
      left:      W - logoSize - padding,
      top:       H - logoSize - padding,
      blend:     "over",
    }])
    .png()
    .toFile(file);
  log(file);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
function printSummary(counts: Record<string, number>): void {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  console.log("\n" + "─".repeat(60));
  console.log("✅  All assets generated successfully!\n");
  console.log("📁  Output structure:");
  console.log("    public/");
  console.log(`    ├── favicon-16x16.png, favicon-32x32.png, favicon-96x96.png, favicon.ico`);
  console.log(`    ├── apple-touch-icon.png  (180×180)`);
  console.log(`    ├── logo.png              (512×512, for JSON-LD schema)`);
  console.log(`    ├── safari-pinned-tab.svg (for Safari mask-icon)`);
  console.log(`    ├── og-base.png           (1200×630, for Cloudinary OG overlays)`);
  console.log(`    ├── browserconfig.xml     (Windows tile config)`);
  console.log("    ├── 📁 icons/");
  console.log(`    │   ├── icon-*.png            (${counts.pwa} PWA icons)`);
  console.log(`    │   ├── android-icon-*.png     (${counts.android} standard + maskable)`);
  console.log(`    │   ├── shortcut-*.png         (${counts.shortcuts} PWA shortcuts)`);
  console.log(`    │   └── mstile-*.png           (${counts.windows} Windows tiles)`);
  console.log("    └── 📁 splash/");
  console.log(`        └── *.png                 (${counts.splash} iOS device sizes)`);
  console.log(`\n🎯  Total: ${total} files\n`);
  console.log("💡  Next steps:");
  console.log("    1. Add /public/icons/* to .gitignore if you prefer to generate at build time");
  console.log("    2. Replace safari-pinned-tab.svg with your actual SVG logo (must be single-colour black)");
  console.log("    3. Upload og-base.png to Cloudinary as isaacpaha/og-base.png");
  console.log("    4. Add splash screen <link> tags in layout.tsx <head> for iOS standalone mode");
  console.log("    5. Run: npx lighthouse https://www.isaacpaha.com --view  to verify PWA score");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("🎨  isaacpaha.com — Icon & Asset Generator");
  console.log("═".repeat(60));

  // 1. Find logo
  let logoPath: string;
  try {
    logoPath = await findLogo();
    console.log(`\n✓  Logo found: ${logoPath}`);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  // 2. Create directory structure
  await ensureDirs();
  console.log("✓  Output directories ready");

  // 3. Generate everything in logical order
  try {
    await generateFavicons(logoPath);            // 4 files → public/
    await generateLogoAsset(logoPath);           // 1 file  → public/
    await generateSafariPinnedTab(logoPath);     // 1 file  → public/
    await generatePwaIcons(logoPath);            // 8 files → public/icons/
    await generateAndroidIcons(logoPath);        // 12 files → public/icons/ (6 std + 6 maskable)
    await generateShortcutIcons(logoPath);       // 6 files → public/icons/
    await generateWindowsTiles(logoPath);        // 5 files → public/icons/ + browserconfig.xml
    await generateSplashScreens(logoPath);       // 10 files → public/splash/
    await generateOgBase(logoPath);              // 1 file  → public/
  } catch (err) {
    console.error("\n❌  Generation failed:", (err as Error).message);
    console.error((err as Error).stack);
    process.exit(1);
  }

  // 4. Summary
  printSummary({
    favicons:  4,
    logo:      1,
    safari:    1,
    ogBase:    1,
    pwa:       8,
    android:   12,
    shortcuts: 6,
    windows:   5 + 1,  // +1 for browserconfig.xml
    splash:    10,
  });
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});




// // scripts/generate-icons-sharp.ts
// import sharp from 'sharp'
// import { mkdir, access } from 'fs/promises'
// import path from 'path'

// // Auto-detect logo location
// const possiblePaths = [
//   'public/logo.png',  // Check public first
//   'logo.png',
//   'assets/logo.png',
//   'src/assets/logo.png',
//   'public/images/logo.png'
// ]

// async function findLogo(): Promise<string> {
//   for (const logoPath of possiblePaths) {
//     try {
//       await access(logoPath)
//       return logoPath
//     } catch {
//       continue
//     }
//   }
//   throw new Error(`Logo not found! Please place logo.png in one of these locations:\n${possiblePaths.join('\n')}`)
// }

// const sizes = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512]

// async function generateIcons() {
//   // Find logo file
//   let inputFile: string
//   try {
//     inputFile = await findLogo()
//     console.log(`✓ Found logo at: ${inputFile}\n`)
//   } catch (error) {
//     console.error((error as Error).message)
//     process.exit(1)
//   }

//   // Create organized directory structure
//   const directories = {
//     icons: 'public/icons',
//     splash: 'public/splash',
//     shortcuts: 'public/shortcuts',
//     favicons: 'public/favicons',
//     apple: 'public/apple'
//   }

//   // Ensure all directories exist
//   for (const dir of Object.values(directories)) {
//     await mkdir(dir, { recursive: true })
//   }

//   console.log('📁 Created organized folder structure\n')

//   console.log('🎨 Generating icons...')

//   // Generate standard icons in icons folder
//   for (const size of sizes) {
//     await sharp(inputFile)
//       .resize(size, size, {
//         fit: 'contain',
//         background: { r: 255, g: 255, b: 255, alpha: 0 }
//       })
//       .png()
//       .toFile(path.join(directories.icons, `icon-${size}x${size}.png`))
    
//     console.log(`✓ Generated icons/icon-${size}x${size}.png`)
//   }

//   // Generate Apple icons in apple folder
//   const appleSizes = [57, 60, 72, 76, 114, 120, 144, 152, 180]
//   for (const size of appleSizes) {
//     await sharp(inputFile)
//       .resize(size, size)
//       .png()
//       .toFile(path.join(directories.apple, `apple-touch-icon-${size}x${size}.png`))
//     console.log(`✓ Generated apple/apple-touch-icon-${size}x${size}.png`)
//   }

//   // Generate favicons in favicons folder
//   const faviconSizes = [16, 32, 48, 64]
//   for (const size of faviconSizes) {
//     await sharp(inputFile)
//       .resize(size, size)
//       .png()
//       .toFile(path.join(directories.favicons, `favicon-${size}x${size}.png`))
//     console.log(`✓ Generated favicons/favicon-${size}x${size}.png`)
//   }

//   // Generate ICO file (multi-size)
//   await sharp(inputFile)
//     .resize(32, 32)
//     .png()
//     .toFile(path.join(directories.favicons, 'favicon.ico'))
//   console.log('✓ Generated favicons/favicon.ico')

//   // Generate shortcut icons
//   const shortcutSizes = [96, 192, 512]
//   for (const size of shortcutSizes) {
//     await sharp(inputFile)
//       .resize(size, size)
//       .png()
//       .toFile(path.join(directories.shortcuts, `shortcut-icon-${size}x${size}.png`))
//     console.log(`✓ Generated shortcuts/shortcut-icon-${size}x${size}.png`)
//   }

//   // Generate splash screens
//   const splashSizes = [
//     { w: 640, h: 1136, name: 'iphone5_splash.png' },
//     { w: 750, h: 1334, name: 'iphone6_splash.png' },
//     { w: 828, h: 1792, name: 'iphonexr_splash.png' },
//     { w: 1125, h: 2436, name: 'iphonex_splash.png' },
//     { w: 1170, h: 2532, name: 'iphone12_splash.png' },
//     { w: 1242, h: 2688, name: 'iphonexsmax_splash.png' },
//     { w: 1536, h: 2048, name: 'ipad_splash.png' },
//     { w: 1668, h: 2388, name: 'ipadpro_splash.png' },
//     { w: 2048, h: 2732, name: 'ipadpro12_splash.png' }
//   ]

//   console.log('\n🌅 Generating splash screens...')

//   for (const splash of splashSizes) {
//     const logoSize = Math.floor(Math.min(splash.w, splash.h) / 3)
    
//     await sharp(inputFile)
//       .resize(logoSize, logoSize, {
//         fit: 'contain',
//         background: { r: 30, g: 41, b: 59, alpha: 1 }
//       })
//       .extend({
//         top: Math.floor((splash.h - logoSize) / 2),
//         bottom: Math.ceil((splash.h - logoSize) / 2),
//         left: Math.floor((splash.w - logoSize) / 2),
//         right: Math.ceil((splash.w - logoSize) / 2),
//         background: { r: 30, g: 41, b: 59, alpha: 1 }
//       })
//       .png()
//       .toFile(path.join(directories.splash, splash.name))
    
//     console.log(`✓ Generated splash/${splash.name}`)
//   }

//   // Generate Android adaptive icons
//   console.log('\n🤖 Generating Android adaptive icons...')
//   const androidSizes = [48, 72, 96, 144, 192, 512]
//   for (const size of androidSizes) {
//     await sharp(inputFile)
//       .resize(size, size)
//       .png()
//       .toFile(path.join(directories.icons, `android-icon-${size}x${size}.png`))
//     console.log(`✓ Generated icons/android-icon-${size}x${size}.png`)
//   }

//   // Generate Windows tiles
//   console.log('\n🪟 Generating Windows tiles...')
//   const windowsSizes = [
//     { size: 70, name: 'mstile-70x70.png' },
//     { size: 144, name: 'mstile-144x144.png' },
//     { size: 150, name: 'mstile-150x150.png' },
//     { size: 310, name: 'mstile-310x310.png' },
//     { size: 310, h: 150, name: 'mstile-310x150.png' }
//   ]

//   for (const tile of windowsSizes) {
//     const width = tile.size
//     const height = tile.h || tile.size
    
//     await sharp(inputFile)
//       .resize(width, height, {
//         fit: 'contain',
//         background: { r: 255, g: 255, b: 255, alpha: 0 }
//       })
//       .png()
//       .toFile(path.join(directories.icons, tile.name))
    
//     console.log(`✓ Generated icons/${tile.name}`)
//   }

//   console.log('\n✅ All icons generated successfully!')
//   console.log('\n📁 Generated folder structure:')
//   console.log('public/')
//   console.log('├── 📁 icons/')
//   console.log('│   ├── icon-*.png (11 standard icons)')
//   console.log('│   ├── android-icon-*.png (6 Android icons)')
//   console.log('│   └── mstile-*.png (5 Windows tiles)')
//   console.log('├── 📁 apple/')
//   console.log('│   └── apple-touch-icon-*.png (9 Apple icons)')
//   console.log('├── 📁 favicons/')
//   console.log('│   ├── favicon-*.png (4 favicon sizes)')
//   console.log('│   └── favicon.ico')
//   console.log('├── 📁 shortcuts/')
//   console.log('│   └── shortcut-icon-*.png (3 shortcut icons)')
//   console.log('└── 📁 splash/')
//   console.log('    └── *.png (9 splash screens)')
//   console.log('\n🎯 Total files generated: ' + 
//     (sizes.length + appleSizes.length + faviconSizes.length + 1 + 
//      shortcutSizes.length + splashSizes.length + androidSizes.length + 
//      windowsSizes.length) + ' icons')
// }

// generateIcons().catch(console.error)



