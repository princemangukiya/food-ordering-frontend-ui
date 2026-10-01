import React, { useState, useEffect } from "react";

export default function ShareModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [shareMode, setShareMode] = useState("GLOBAL"); // "GLOBAL" | "WIFI"
  const [tunnelUrl, setTunnelUrl] = useState("");
  const [wifiUrl, setWifiUrl] = useState("http://10.238.231.139:5180");
  const [tunnelStatus, setTunnelStatus] = useState("CHECKING"); // "ONLINE" | "CONNECTING" | "OFFLINE" | "CHECKING"
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTunnelConfig = async () => {
    try {
      const res = await fetch(`/tunnel_config.json?v=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.publicUrl) setTunnelUrl(data.publicUrl);
        if (data.localWifiUrl) setWifiUrl(data.localWifiUrl);
        if (data.status) setTunnelStatus(data.status);
        else if (data.publicUrl) setTunnelStatus("ONLINE");
        return;
      }
    } catch (e) {
      console.warn("Could not read tunnel_config.json:", e);
    }
    setTunnelStatus("OFFLINE");
  };

  useEffect(() => {
    if (!isOpen) return;

    fetchTunnelConfig();

    // Auto-poll every 3s while modal is open to catch live tunnel updates
    const interval = setInterval(() => {
      fetchTunnelConfig();
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchTunnelConfig();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  if (!isOpen) return null;

  // If user is already accessing the site from a public domain (e.g. on their phone or remote), use that origin
  const isAlreadyPublic =
    typeof window !== "undefined" &&
    window.location.origin.startsWith("http") &&
    !window.location.origin.includes("localhost") &&
    !window.location.origin.includes("127.0.0.1");

  const effectiveGlobalUrl = isAlreadyPublic ? window.location.origin : tunnelUrl;
  const activeUrl = shareMode === "GLOBAL" ? effectiveGlobalUrl : wifiUrl;

  const isGlobalReady = shareMode === "GLOBAL" && Boolean(effectiveGlobalUrl);

  const qrCodeUrl = activeUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        activeUrl
      )}&margin=10`
    : "";

  const handleCopy = () => {
    if (!activeUrl) return;
    navigator.clipboard?.writeText(activeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `🍔 Order delicious food from FoodExpress on your phone or laptop! Click here: ${activeUrl}`
  )}`;

  return (
    <div className="share-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="share-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="share-modal-close-btn" onClick={onClose} aria-label="Close share popup">
          ✕
        </button>

        <div className="share-modal-header">
          <div className="share-icon-circle">🌐</div>
          <div>
            <h2>Share Live Food Ordering Link</h2>
            <p>Scan with any phone camera to browse menu & place real orders!</p>
          </div>
        </div>

        {/* Live Tunnel Status Badge */}
        {shareMode === "GLOBAL" ? (
          tunnelStatus === "ONLINE" && isGlobalReady ? (
            <div className="share-tunnel-status-bar">
              <span className="live-dot-pulse"></span>
              <span className="tunnel-status-text">
                <strong>Global Internet Active:</strong> Anyone on Airtel, Jio, Vi 4G/5G, or any Wi-Fi can order.
              </span>
              <button
                className="share-refresh-icon-btn"
                onClick={handleManualRefresh}
                title="Refresh Status"
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem" }}
              >
                {isRefreshing ? "⏳" : "🔄"}
              </button>
            </div>
          ) : tunnelStatus === "CONNECTING" ? (
            <div className="share-tunnel-status-bar warning" style={{ background: "#fef9c3", borderColor: "#fde047", color: "#854d0e" }}>
              <span className="live-dot-pulse" style={{ background: "#eab308", boxShadow: "0 0 0 3px rgba(234, 179, 8, 0.35)" }}></span>
              <span className="tunnel-status-text">
                <strong>Connecting Tunnel:</strong> Starting live Cloudflare connection, please wait 5-10 seconds...
              </span>
              <button
                className="share-refresh-icon-btn"
                onClick={handleManualRefresh}
                title="Refresh Status"
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem" }}
              >
                {isRefreshing ? "⏳" : "🔄"}
              </button>
            </div>
          ) : (
            <div className="share-tunnel-status-bar offline" style={{ background: "#fff1f2", borderColor: "#fecdd3", color: "#9f1239" }}>
              <span style={{ fontSize: "1rem" }}>⚠️</span>
              <span className="tunnel-status-text">
                <strong>Tunnel Not Started:</strong> Run <code>start-online-share.bat</code> on your laptop for 4G/5G access, or switch to <strong>Same Wi-Fi</strong> tab.
              </span>
              <button
                className="share-refresh-icon-btn"
                onClick={handleManualRefresh}
                title="Refresh Status"
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem" }}
              >
                {isRefreshing ? "⏳" : "🔄"}
              </button>
            </div>
          )
        ) : (
          <div className="share-tunnel-status-bar" style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" }}>
            <span style={{ fontSize: "1.1rem" }}>📶</span>
            <span className="tunnel-status-text">
              <strong>Local Wi-Fi Mode:</strong> 100% Reliable! Phone & Laptop must be on same Wi-Fi or Hotspot. No Cloudflare, never expires!
            </span>
          </div>
        )}

        {/* Tab switcher: Global 4G/5G vs Local Wi-Fi */}
        <div className="share-tabs-nav">
          <button
            className={`share-tab-pill ${shareMode === "GLOBAL" ? "active" : ""}`}
            onClick={() => setShareMode("GLOBAL")}
          >
            🌍 Global Internet (4G / 5G / Any Wi-Fi)
          </button>
          <button
            className={`share-tab-pill ${shareMode === "WIFI" ? "active" : ""}`}
            onClick={() => setShareMode("WIFI")}
          >
            📶 Same Home / Office Wi-Fi (No Error 1033)
          </button>
        </div>

        <div className="share-modal-body">
          {/* QR Code Section */}
          <div className="share-qr-container">
            {activeUrl ? (
              <div className="qr-image-wrapper">
                <img src={qrCodeUrl} alt="Scan QR code to order" className="share-qr-img" />
              </div>
            ) : (
              <div style={{ height: "200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", color: "#64748b" }}>
                <span style={{ fontSize: "2rem" }}>⏳</span>
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: "600" }}>Waiting for Global Tunnel link...</p>
                <button
                  className="share-tab-pill active"
                  style={{ width: "auto", padding: "0.4rem 1rem", fontSize: "0.8rem" }}
                  onClick={() => setShareMode("WIFI")}
                >
                  👉 Switch to Local Wi-Fi Mode Now
                </button>
              </div>
            )}
            <span className="qr-scan-instruction">
              📸 Point your phone camera at this QR code to open the menu instantly
            </span>
          </div>

          {/* Public / Local Link Box */}
          <div className="share-url-box">
            <label>
              {shareMode === "GLOBAL"
                ? "🌐 Public Live Website Link (Works on Mobile Data / Anywhere):"
                : "📶 Local Wi-Fi Link (Works when phone is on same Wi-Fi / Hotspot):"}
            </label>
            <div className="url-input-action-row">
              <input
                type="text"
                readOnly
                value={activeUrl || "Waiting for tunnel connection..."}
                placeholder="https://..."
              />
              <button
                className="copy-link-action-btn"
                onClick={handleCopy}
                disabled={!activeUrl}
                style={{ opacity: activeUrl ? 1 : 0.6 }}
              >
                {copied ? "Copied! ✓" : "Copy Link 📋"}
              </button>
            </div>
          </div>

          {/* Social / WhatsApp Share Action */}
          <div className="share-quick-buttons">
            <a
              href={activeUrl ? whatsappShareUrl : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-share-btn"
              style={{ opacity: activeUrl ? 1 : 0.6, pointerEvents: activeUrl ? "auto" : "none" }}
            >
              <span>💬</span> Send Link on WhatsApp
            </a>
            <button
              className="share-native-btn"
              onClick={handleCopy}
              disabled={!activeUrl}
              style={{ opacity: activeUrl ? 1 : 0.6 }}
            >
              <span>🔗</span> {copied ? "Link Copied to Clipboard!" : "Copy Link"}
            </button>
          </div>

          {/* Help Info Box */}
          <div className="share-info-card">
            <span className="info-icon-badge">💡</span>
            <div>
              <strong>Instant Live Order Sync:</strong>
              <p>
                When someone places an order from their phone using this link, your laptop will immediately play the kitchen bell chime and show the order with live items and status in Kitchen POS!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
