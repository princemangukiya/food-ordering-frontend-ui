import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import http from "http";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_PORT = 5180;
const CLOUDFLARED_EXE = path.join(__dirname, "cloudflared.exe");
const PUBLIC_CONFIG_FILE = path.join(__dirname, "public", "tunnel_config.json");
const DIST_CONFIG_FILE = path.join(__dirname, "dist", "tunnel_config.json");

// Helper to get local IPv4 address
function getLocalWifiIp() {
  const interfaces = os.networkInterfaces();
  let candidate = "127.0.0.1";

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        // Prioritize Wi-Fi or Ethernet
        if (/wi-fi|wireless|ethernet|wlan/i.test(name)) {
          return addr.address;
        }
        candidate = addr.address;
      }
    }
  }
  return candidate;
}

function updateConfig(config) {
  const data = JSON.stringify(config, null, 2);
  try {
    fs.mkdirSync(path.dirname(PUBLIC_CONFIG_FILE), { recursive: true });
    fs.writeFileSync(PUBLIC_CONFIG_FILE, data, "utf-8");
  } catch (err) {
    console.error("Failed to write public tunnel_config.json:", err.message);
  }

  try {
    if (fs.existsSync(path.join(__dirname, "dist"))) {
      fs.writeFileSync(DIST_CONFIG_FILE, data, "utf-8");
    }
  } catch {}
}

let cloudflareProcess = null;
let currentPublicUrl = "";
let isShuttingDown = false;
let pingInterval = null;

function saveStatus(status, publicUrl = "") {
  const localWifiIp = getLocalWifiIp();
  const config = {
    publicUrl: publicUrl || currentPublicUrl,
    localWifiUrl: `http://${localWifiIp}:${LOCAL_PORT}`,
    status: status,
    updatedAt: new Date().toISOString(),
  };
  updateConfig(config);
}

// Keep-alive ping every 30s to prevent Cloudflare idle disconnects (Error 1033)
function startKeepAlive(url) {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = setInterval(() => {
    if (!url || isShuttingDown) return;
    try {
      https
        .get(url, { timeout: 8000 }, (res) => {
          // Keep-alive successful
          res.resume();
        })
        .on("error", (e) => {
          console.warn("[Tunnel KeepAlive Ping Notice]:", e.message);
        });
    } catch {}
  }, 30000);
}

function startTunnel() {
  if (isShuttingDown) return;

  if (!fs.existsSync(CLOUDFLARED_EXE)) {
    console.error("❌ cloudflared.exe not found at:", CLOUDFLARED_EXE);
    saveStatus("OFFLINE");
    return;
  }

  console.log("\n=======================================================");
  console.log("🚀 Starting FoodExpress Cloudflare Live Tunnel...");
  console.log("   Target Local Port: http://localhost:" + LOCAL_PORT);
  console.log("=======================================================");

  saveStatus("CONNECTING");

  const args = [
    "tunnel",
    "--url",
    `http://localhost:${LOCAL_PORT}`,
    "--no-autoupdate",
    "--protocol",
    "quic",
  ];

  cloudflareProcess = spawn(CLOUDFLARED_EXE, args, {
    cwd: __dirname,
    windowsHide: true,
  });

  let urlFound = false;

  const handleOutput = (data) => {
    const text = data.toString();

    // Cloudflare prints the trycloudflare url in stderr
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !urlFound) {
      urlFound = true;
      currentPublicUrl = match[0];
      const localWifiUrl = `http://${getLocalWifiIp()}:${LOCAL_PORT}`;

      saveStatus("ONLINE", currentPublicUrl);
      startKeepAlive(currentPublicUrl);

      console.log("\n=======================================================");
      console.log("✅ FOODEXPRESS LIVE TUNNEL IS ACTIVE & ONLINE!");
      console.log("🌐 Public 4G/5G Live URL:", currentPublicUrl);
      console.log("📶 Same Wi-Fi Local URL :", localWifiUrl);
      console.log("📱 Scan QR Code inside App or open link on phone!");
      console.log("🔄 Auto-keepalive active: Prevents Error 1033 timeouts.");
      console.log("=======================================================\n");
    }
  };

  cloudflareProcess.stdout.on("data", handleOutput);
  cloudflareProcess.stderr.on("data", handleOutput);

  cloudflareProcess.on("close", (code) => {
    if (pingInterval) clearInterval(pingInterval);
    if (!isShuttingDown) {
      console.warn(`⚠️ Cloudflare tunnel process exited (code ${code}). Auto-reconnecting in 4 seconds...`);
      saveStatus("CONNECTING");
      setTimeout(startTunnel, 4000);
    } else {
      saveStatus("OFFLINE");
    }
  });

  cloudflareProcess.on("error", (err) => {
    console.error("❌ Tunnel process error:", err.message);
    if (pingInterval) clearInterval(pingInterval);
    if (!isShuttingDown) {
      setTimeout(startTunnel, 5000);
    }
  });
}

// Clean exit handlers
const cleanExit = () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("\n🛑 Stopping FoodExpress Tunnel...");
  if (pingInterval) clearInterval(pingInterval);
  saveStatus("OFFLINE");
  if (cloudflareProcess) {
    try {
      cloudflareProcess.kill();
    } catch {}
  }
  process.exit(0);
};

process.on("SIGINT", cleanExit);
process.on("SIGTERM", cleanExit);

// Start immediately
startTunnel();
