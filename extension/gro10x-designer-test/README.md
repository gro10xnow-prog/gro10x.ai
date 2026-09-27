# 🎨 GRO10X Designer Test — AI Image Upscaler Automator

**GRO10X Designer Test** is a specialized Chrome extension built to automate web-based AI image upscalers (such as Magnific, Krea, Upscale.media, Pixelcut, BigJPG, VanceAI, Topaz Web, or custom in-house designer tools).

---

### 💡 The Brainstorming Challenge & The Solution

### The Question:
> *"I have been running to do like upload where I keep a Chrome extension... select like 2K 4K or 8K and submit... then it triggers browser automation there. Goes and presses the upload picture button. Once the picture is uploaded, there is a top navigation where it is written upscale there are two or three options: 2K, 4K, 8K. And it presses one, waits for it to generate, then in the top buttons there will be download. Downloads it. **I don't know how from downloads it can again come back to me.**"*

### Verified Against Your Workspace Screenshot:
Your workspace uses **CapCut Web / Canvas Editor** ("Poster Generation"):
- **Bottom Dock**: Contains the `Upload image` tool (shortcut: `i`) to add images to the canvas.
- **Floating Action Bar** (floats directly above the selected canvas image):
  `[Remove BG] [Angles] [HD Upscale] [Eraser] [Expand] [Recolor] [Edit text] [Separate layers] [Download]`
- **Top Header**: White pill `[ Download ]` button beside your credits counter (`458`).
- **Upscale Menu**: Clicking `HD Upscale` triggers the resolution popover (`2K`, `4K`, `8K`).

---

### The Solution — How It Comes Back to You (3 Coordinated Channels):

```
┌─────────────────────────┐     1. Select 2K / 4K / 8K       ┌─────────────────────────┐
│                         │  ──────────────────────────────> │   CapCut / Canvas Tab   │
│  Designer Test Popup    │     (Upload or Canvas Selection) │                         │
│  (Extension UI)         │                                  │  • Floats above image   │
│                         │     2. DOM Automation            │  • Clicks "HD Upscale"  │
│                         │  ──────────────────────────────> │  • Clicks 2K / 4K / 8K  │
│                         │                                  │  • Monitors generation  │
│                         │     3. Direct Blob Capture       │  • Clicks "Download"    │
│  🎉 Result Returns:     │  <────────────────────────────── │                         │
│  • Instant High-Res UI  │                                  └─────────────────────────┘
│  • [📂 Show in Explorer]│                                               │
│  • [🖼️ Open File]       │                                               ▼
│  • [📋 Copy Image]      │                                      4. Browser Download
│  • [☁️ Cloud Vault]     │                                  ┌─────────────────────────┘
│                         │     5. Downloads API Hook        │   chrome.downloads      │
│                         │  <────────────────────────────── │   • item.filename       │
│                         │                                  │   • item.fileSize       │
└─────────────────────────/                                  └─────────────────────────┘
```

1. **Channel 1 — Direct In-Memory Blob Interception (Instantaneous Return)**:
   - When the upscaler finishes, `content.js` intercepts the generated image blob or `<a>` download trigger directly from the browser DOM before it even reaches disk.
   - It sends the Data URL straight into the **Designer Test extension popup**, rendering an immediate full-quality preview.
   - You can click **"📋 Copy"** to instantly paste the upscaled graphic into Photoshop, Figma, Slack, or any document without touching the file explorer.

2. **Channel 2 — `chrome.downloads` Hook (Direct Windows File Explorer Integration)**:
   - The background service worker (`service-worker.js`) listens to Chrome's `chrome.downloads.onCreated` and `chrome.downloads.onChanged` events.
   - The moment the file finishes downloading, it records the exact local Windows path (e.g. `C:\Users\LeNoVo\Downloads\upscaled_4k.png`).
   - Clicking **"📂 Show in Explorer"** calls `chrome.downloads.show(downloadId)` to **instantly open Windows Explorer with your file highlighted**!
   - Clicking **"🖼️ Open File"** calls `chrome.downloads.open(downloadId)` to view it in Windows Photos.
   - You can also enable **"Auto-reveal in Windows Explorer upon download"** in the popup to have Windows Explorer pop up automatically the split-second it downloads!

3. **Channel 3 — Brand Empire Vault Sync (Team Collaboration)**:
   - The captured image can optionally be synced directly to the Supabase storage bucket (`brand-assets/upscales/`) to attach it directly to the active brand catalog SKU.

---

## 🛠️ How to Load in Chrome / Brave

1. Open **Chrome** or **Brave** and navigate to `chrome://extensions/`.
2. Enable **"Developer mode"** in the top-right corner.
3. Click **"Load unpacked"**.
4. Select the directory:
   ```
   C:\Users\LeNoVo\Documents\GRO10X Business\Gro10x.ai\extension\gro10x-designer-test
   ```
5. The extension will appear with the **🎨 Designer Test** icon.
6. Pin it to your Chrome toolbar for quick access!

---

## 📋 File Structure

```
extension/gro10x-designer-test/
├── manifest.json       # Manifest V3 (sidePanel, downloads, storage, scripting, activeTab)
├── service-worker.js   # Side panel open controller & background downloads watcher
├── content.js          # DOM automator (canvas coordinate clicks, HD Upscale, 1-click download)
├── sidepanel.html      # DOCKED SIDE PANEL UI (never closes when interacting with canvas)
├── sidepanel.js        # Live canvas selection poller & automation coordinator
├── styles.css          # Full-height responsive dark glass theme
├── README.md           # Architecture documentation & guide
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```
