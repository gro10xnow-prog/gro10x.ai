// PurpleOS Command Center Engine (Ctrl + K)

let isCmdOpen = false;

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    toggleCommandCenter();
  } else if (e.key === 'Escape' && isCmdOpen) {
    toggleCommandCenter(false);
  }
});

function toggleCommandCenter(forceState) {
  const backdrop = document.getElementById('cmdBackdrop');
  const input = document.getElementById('cmdInput');

  if (typeof forceState === 'boolean') {
    isCmdOpen = forceState;
  } else {
    isCmdOpen = !isCmdOpen;
  }

  if (isCmdOpen) {
    backdrop.classList.add('active');
    input.value = '';
    input.focus();
    renderCommandResults('');
  } else {
    backdrop.classList.remove('active');
  }
}

function handleCmdInput(event) {
  const query = event.target.value.toLowerCase().trim();
  renderCommandResults(query);
}

function renderCommandResults(query) {
  const resultsContainer = document.getElementById('cmdResults');
  let html = '';

  // Quick Action Commands
  const actions = [
    { title: '⚡ Clock In Studio', subtitle: 'Log attendance status as In Studio', action: 'clockin', icon: '⏱️' },
    { title: '🚪 Clock Out', subtitle: 'Log attendance status as Clocked Out', action: 'clockout', icon: '🚪' },
    { title: '➕ Register New Client', subtitle: 'Open CRM client creation form', action: 'add-client', icon: '👤' },
    { title: '💸 Log Studio Expense', subtitle: 'Record operational gear/rent expense', action: 'add-expense', icon: '💳' },
    { title: '🎬 Open Review Room', subtitle: 'Launch video feedback player', action: 'open-review', icon: '📽️' }
  ];

  const matchedActions = actions.filter(a => !query || a.title.toLowerCase().includes(query) || a.subtitle.toLowerCase().includes(query));

  if (matchedActions.length > 0) {
    html += `<div class="cmd-group-label">Quick Actions</div>`;
    matchedActions.forEach(a => {
      html += `
        <div class="cmd-item" onclick="executeCmdAction('${a.action}')">
          <div class="cmd-item-left">
            <div class="cmd-item-icon">${a.icon}</div>
            <div>
              <div class="cmd-item-title">${a.title}</div>
              <div class="cmd-item-subtitle">${a.subtitle}</div>
            </div>
          </div>
          <span class="cmd-item-action">Run</span>
        </div>
      `;
    });
  }

  // Search Tasks in appData
  if (window.appData && window.appData.tasks) {
    const matchedTasks = window.appData.tasks.filter(t => !query || t.title.toLowerCase().includes(query) || t.client.toLowerCase().includes(query));
    if (matchedTasks.length > 0) {
      html += `<div class="cmd-group-label">Tasks & Campaigns (${matchedTasks.length})</div>`;
      matchedTasks.slice(0, 4).forEach(t => {
        html += `
          <div class="cmd-item" onclick="navigateTab('tasks'); toggleCommandCenter(false);">
            <div class="cmd-item-left">
              <div class="cmd-item-icon">📋</div>
              <div>
                <div class="cmd-item-title">${t.title}</div>
                <div class="cmd-item-subtitle">${t.client} • Stage: ${t.stage}</div>
              </div>
            </div>
            <span class="cmd-item-action">View</span>
          </div>
        `;
      });
    }
  }

  // Search Clients
  if (window.appData && window.appData.clients) {
    const matchedClients = window.appData.clients.filter(c => !query || c.name.toLowerCase().includes(query) || c.contactPerson.toLowerCase().includes(query));
    if (matchedClients.length > 0) {
      html += `<div class="cmd-group-label">Clients (${matchedClients.length})</div>`;
      matchedClients.slice(0, 3).forEach(c => {
        html += `
          <div class="cmd-item" onclick="navigateTab('clients'); toggleCommandCenter(false);">
            <div class="cmd-item-left">
              <div class="cmd-item-icon">🏢</div>
              <div>
                <div class="cmd-item-title">${c.name}</div>
                <div class="cmd-item-subtitle">Contact: ${c.contactPerson} (${c.category})</div>
              </div>
            </div>
            <span class="cmd-item-action">Open CRM</span>
          </div>
        `;
      });
    }
  }

  if (!html) {
    html = `<div style="padding: 2rem; text-align: center; color: #71717a; font-size: 0.9rem;">No matching actions or records found for "${query}"</div>`;
  }

  resultsContainer.innerHTML = html;
}

function executeCmdAction(action) {
  toggleCommandCenter(false);

  if (action === 'clockin') {
    sendSimCommand('/clockin');
  } else if (action === 'clockout') {
    sendSimCommand('/clockout');
  } else if (action === 'add-client') {
    navigateTab('clients');
    openAddClientModal();
  } else if (action === 'add-expense') {
    navigateTab('financials');
    openAddExpenseModal();
  } else if (action === 'open-review') {
    navigateTab('reviewroom');
  }
}

function navigateTab(tabId) {
  let mapped = tabId;
  if (tabId === 'tasks') mapped = 'kanban';
  if (tabId === 'clients') mapped = 'crm';
  if (typeof switchTab === 'function') {
    switchTab(mapped);
  }
}
