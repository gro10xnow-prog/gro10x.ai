/**
 * public/app/copilot-shell.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X OS Universal Platform-Wide Copilot Controller v1.0
 * Manages the global shell Copilot surface (#app-copilot), docking/drawer modes,
 * sidebar mini-rail transitions, global hotkeys (Ctrl+J / Cmd+J), and dynamic
 * module persona swapping (#finance, #crm, #kanban, etc.).
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function initCopilotShell() {
  const STORAGE_KEYS = {
    MODE: 'gro10x_copilot_mode',           // 'docked' | 'drawer' | 'collapsed'
    SIDEBAR_MINI: 'gro10x_sidebar_mini'    // 'true' | 'false'
  };

  const DEFAULT_WELCOME = `
    👋 <strong>Greetings, Executive!</strong> I am the <strong>GRO10X Universal Copilot</strong> (Autonomous Digital Employee).
    <br><br>
    I provide context-aware operations across Financials, Retainers, CRM, and Agile Delivery. Use the quick chips below or instruct me directly.
  `;

  class CopilotController {
    constructor() {
      this.mode = localStorage.getItem(STORAGE_KEYS.MODE) || 'docked';
      this.sidebarMini = localStorage.getItem(STORAGE_KEYS.SIDEBAR_MINI) === 'true';
      this.activeContext = window.location.hash || '#dashboard';
      this.manifests = {};
      this.chatHistories = {}; // context -> messages[]
      this.inFlightDrafts = {};

      // Auto-mini sidebar when docked on screens < 1600px to ensure canvas breathing room
      if (window.innerWidth < 1600 && localStorage.getItem(STORAGE_KEYS.SIDEBAR_MINI) === null) {
        this.sidebarMini = true;
      }
    }

    boot() {
      this.applySidebarState();
      this.applyModeState();
      this.bindEvents();
      this.render();
    }

    bindEvents() {
      // Global Hotkey: Ctrl+J / Cmd+J toggles Copilot
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J')) {
          e.preventDefault();
          this.toggleExpand();
        } else if (e.key === 'Escape' && this.mode === 'drawer') {
          this.collapse();
        }
      });

      // Window resize adaptation
      window.addEventListener('resize', () => {
        if (window.innerWidth <= 1024 && this.mode === 'docked') {
          this.setMode('drawer');
        }
      });
    }

    registerModule(contextHash, manifest) {
      this.manifests[contextHash] = manifest;
      if (this.activeContext === contextHash) {
        this.render();
      }
    }

    switchContext(newHash) {
      this.activeContext = newHash;
      this.render();
    }

    applySidebarState() {
      const sidebar = document.getElementById('sidebarNav');
      const toggleBtn = document.getElementById('sidebarToggleBtn');
      if (sidebar) {
        if (this.sidebarMini) {
          sidebar.classList.add('mini');
        } else {
          sidebar.classList.remove('mini');
        }
      }
      if (toggleBtn) {
        toggleBtn.setAttribute('title', this.sidebarMini ? 'Expand Sidebar (Full)' : 'Collapse Sidebar (Mini-Rail)');
        toggleBtn.textContent = this.sidebarMini ? '◧' : '◨';
      }
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_MINI, this.sidebarMini ? 'true' : 'false');
    }

    toggleSidebar() {
      this.sidebarMini = !this.sidebarMini;
      this.applySidebarState();
    }

    applyModeState() {
      const wrapper = document.getElementById('mainWrapper');
      if (!wrapper) return;

      wrapper.classList.remove('copilot-docked', 'copilot-drawer', 'copilot-collapsed');

      if (this.mode === 'docked') {
        wrapper.classList.add('copilot-docked');
      } else if (this.mode === 'drawer') {
        wrapper.classList.add('copilot-drawer');
      } else {
        wrapper.classList.add('copilot-collapsed');
      }

      const copilotBtn = document.getElementById('copilotHeaderBtn');
      if (copilotBtn) {
        if (this.mode === 'collapsed') {
          copilotBtn.classList.remove('active');
        } else {
          copilotBtn.classList.add('active');
        }
      }

      localStorage.setItem(STORAGE_KEYS.MODE, this.mode);
    }

    setMode(newMode) {
      this.mode = newMode;
      this.applyModeState();
      this.render();
    }

    toggleExpand() {
      if (this.mode === 'collapsed') {
        const preferred = localStorage.getItem('gro10x_preferred_active_mode') || 'docked';
        this.setMode(preferred);
      } else {
        this.collapse();
      }
    }

    expand() {
      const preferred = localStorage.getItem('gro10x_preferred_active_mode') || 'docked';
      this.setMode(preferred);
    }

    collapse() {
      if (this.mode !== 'collapsed') {
        localStorage.setItem('gro10x_preferred_active_mode', this.mode);
      }
      this.setMode('collapsed');
    }

    toggleMode() {
      const next = this.mode === 'docked' ? 'drawer' : 'docked';
      localStorage.setItem('gro10x_preferred_active_mode', next);
      this.setMode(next);
    }

    getActiveManifest() {
      return this.manifests[this.activeContext] || {
        personaName: 'Mother OS Copilot',
        personaRole: 'Autonomous Digital Employee',
        avatar: '🤖',
        statusText: 'Online · Platform Ready',
        welcomeMessage: DEFAULT_WELCOME,
        quickChips: [
          { id: 'ops_summary', label: '📊 Ops Health', prompt: 'Summarize system health and telemetry' },
          { id: 'jump_finance', label: '💰 Open Finance', prompt: 'Navigate to Financials and ledger' },
          { id: 'jump_crm', label: '👥 Open CRM', prompt: 'Show client accounts and proposals' },
          { id: 'jump_kanban', label: '📋 Open Kanban', prompt: 'List urgent deliverable sprint tasks' }
        ],
        intentHandler: async (text, copilot) => {
          copilot.appendAssistantMessage(`I received your request: "<em>${escapeHTML(text)}</em>". Switch to <strong>#finance</strong>, <strong>#crm</strong>, or <strong>#kanban</strong> for domain-specific executions.`);
        }
      };
    }

    getChatHistory() {
      if (!this.chatHistories[this.activeContext]) {
        const manifest = this.getActiveManifest();
        this.chatHistories[this.activeContext] = [
          {
            id: 'welcome',
            role: 'assistant',
            content: manifest.welcomeMessage || DEFAULT_WELCOME,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];
      }
      return this.chatHistories[this.activeContext];
    }

    appendUserMessage(text) {
      const history = this.getChatHistory();
      history.push({
        id: 'msg_' + Date.now(),
        role: 'user',
        content: escapeHTML(text),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.renderChatMessages();
    }

    appendAssistantMessage(content, cardHtml = '') {
      const history = this.getChatHistory();
      history.push({
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: content,
        cardHtml: cardHtml,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.renderChatMessages();
    }

    async handleUserInput(rawText) {
      const text = (rawText || '').trim();
      if (!text) return;
      this.appendUserMessage(text);

      const manifest = this.getActiveManifest();
      if (manifest && typeof manifest.intentHandler === 'function') {
        try {
          await manifest.intentHandler(text, this);
        } catch (err) {
          console.error('[Copilot Shell] Intent handler exception:', err);
          this.appendAssistantMessage(`❌ <strong>Execution Error:</strong> ${escapeHTML(err.message || 'Action failed')}`);
        }
      }
    }

    triggerChip(chipId) {
      const manifest = this.getActiveManifest();
      const chip = (manifest.quickChips || []).find(c => c.id === chipId);
      if (chip && chip.prompt) {
        const input = document.getElementById('shellCopilotInput');
        if (input) input.value = chip.prompt;
        this.handleUserInput(chip.prompt);
      }
    }

    render() {
      const container = document.getElementById('app-copilot');
      if (!container) return;

      const manifest = this.getActiveManifest();
      const isDocked = this.mode === 'docked';

      container.innerHTML = `
        <!-- Copilot Header -->
        <div class="copilot-header">
          <div class="copilot-profile">
            <div class="copilot-avatar-box">
              <span class="copilot-avatar-emoji">${manifest.avatar || '🤖'}</span>
              <span class="copilot-pulse-dot"></span>
            </div>
            <div class="copilot-meta">
              <div class="copilot-title">${escapeHTML(manifest.personaName || 'GRO10X Copilot')}</div>
              <div class="copilot-status">${escapeHTML(manifest.statusText || 'Online · Mother OS Lead')}</div>
            </div>
          </div>
          <div class="copilot-actions">
            <button type="button" class="copilot-tool-btn" onclick="window.GRO10X_COPILOT.toggleMode()" title="${isDocked ? 'Switch to Floating Drawer' : 'Switch to Docked Split'}">
              ${isDocked ? '❐ Float' : '⊞ Dock'}
            </button>
            <button type="button" class="copilot-tool-btn" onclick="window.GRO10X_COPILOT.collapse()" title="Minimize Copilot (Ctrl+J)">
              —
            </button>
          </div>
        </div>

        <!-- Quick Action Chips -->
        <div class="copilot-chips-bar" id="shellCopilotChips">
          ${(manifest.quickChips || []).map(chip => `
            <button type="button" class="copilot-action-chip" onclick="window.GRO10X_COPILOT.triggerChip('${chip.id}')">
              ${escapeHTML(chip.label)}
            </button>
          `).join('')}
        </div>

        <!-- Scrollable Chat Stream -->
        <div class="copilot-chat-stream" id="shellCopilotMessages">
          <!-- Populated by renderChatMessages() -->
        </div>

        <!-- Input Area -->
        <form class="copilot-input-form" onsubmit="event.preventDefault(); window.GRO10X_COPILOT.submitInput();">
          <input type="text" id="shellCopilotInput" class="copilot-input-field" placeholder="Ask agent or type e.g. 'Issue PurpleBot retainer for 20k'..." autocomplete="off">
          <button type="submit" class="copilot-send-btn" title="Send message (Enter)">🚀</button>
        </form>
      `;

      this.renderChatMessages();
    }

    renderChatMessages() {
      const msgBox = document.getElementById('shellCopilotMessages');
      if (!msgBox) return;

      const history = this.getChatHistory();
      msgBox.innerHTML = history.map(m => {
        const isUser = m.role === 'user';
        return `
          <div class="copilot-message-wrap ${isUser ? 'user' : 'assistant'}">
            <div class="copilot-message-header">
              <span>${isUser ? 'You' : '🤖 ' + (this.getActiveManifest().personaName || 'Copilot')}</span>
              <span class="copilot-message-time">${m.timestamp || ''}</span>
            </div>
            <div class="copilot-message-bubble ${isUser ? 'user' : 'assistant'}">
              <div>${m.content}</div>
              ${m.cardHtml || ''}
            </div>
          </div>
        `;
      }).join('');

      msgBox.scrollTop = msgBox.scrollHeight;
    }

    submitInput() {
      const input = document.getElementById('shellCopilotInput');
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      this.handleUserInput(text);
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.GRO10X_COPILOT = new CopilotController();

  document.addEventListener('DOMContentLoaded', () => {
    window.GRO10X_COPILOT.boot();
  });
})();
