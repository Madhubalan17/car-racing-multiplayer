// ========================================================
// ROAD RIVALS - Pure Node.js Static Server (Zero Dependencies)
// ========================================================

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = process.env.PORT || 8080;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    ".html": "text/html; charset=UTF-8",
    ".css": "text/css; charset=UTF-8",
    ".js": "application/javascript; charset=UTF-8",
    ".json": "application/json; charset=UTF-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav"
};

const server = http.createServer((req, res) => {
    // Parse URL and strip query strings/hashes
    let safePath = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
    if (safePath === "/" || safePath === "") {
        safePath = "/index.html";
    }

    // Prevent directory traversal attacks
    const normalizedPath = path.normalize(safePath).replace(/^(\.\.[\/\\])+/, "");
    const filePath = path.join(ROOT_DIR, normalizedPath);

    // Make sure request stays within ROOT_DIR
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("403 Forbidden");
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { "Content-Type": "text/html; charset=UTF-8" });
            res.end("<h1>404 Not Found</h1><p>The requested file does not exist.</p>");
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        res.writeHead(200, {
            "Content-Type": contentType,
            "Content-Length": stats.size,
            "Cache-Control": "no-cache"
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

// Helper to get local network IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "localhost";
}

server.listen(PORT, () => {
    const localIP = getLocalIP();
    console.log("\n=======================================================");
    console.log("🏁  ROAD RIVALS - RACING GAME SERVER STARTED!  🏁");
    console.log("=======================================================");
    console.log(`🎮 Play locally:      http://localhost:${PORT}`);
    console.log(`📱 Play on mobile/LAN: http://${localIP}:${PORT}`);
    console.log("=======================================================");
    console.log("👉 Open http://localhost:" + PORT + " in your browser to start racing!");
    console.log("Press Ctrl + C to stop the server.\n");
});

