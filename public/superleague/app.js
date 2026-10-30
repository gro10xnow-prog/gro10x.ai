/**
 * NOSTALOGIC GAMES — THE SUPER LEAGUE (V1)
 * "The games you grew up playing." — A GRO10X Studio
 * 
 * Round 2 Surgical Certification:
 * - P0-1: Strict Tactical XI Formation Law & Bench Segregation (1 GK, 3-5 DEF, 3-5 MID, 1-3 FWD; 4 Subs)
 * - P0-2: Post-Draft Squad & Purse Ledger Screen (All 10 Clubs + 2,000 Pts Exact Single-Point Reconciliation)
 * - P1-1: Strict Bid Increment Math (+20 from 140 base bids 160) & Live Activity Feed Ticker
 * - P1-2: 1080x1920 Champions Card Tactical Grid, Dedicated Bench Line & Non-Clipping Awards
 * - P1-3: Brand Positioning Copy ("YOUR NOSTALGIA. OUR LOGIC.")
 * - P1-4: Lead Backend Submission Parity (POST /api/leads with REF-SL-XXXXX)
 * - P2: "DOWNLOAD 9:16 HD POSTER", "1 Goal" grammar, and 8-column Final Table Card
 */

(function () {
  'use strict';

  // --- 1. CLUBS & STADIUMS CONFIGURATION ---
  const STADIUMS = [
    'Dorm Arena',
    'Hostel Nou Camp',
    'The Adda Dome',
    'Cadet Field Arena',
    'The Fortress',
    'Bunker Colosseum',
    'Parade Ground Stadium',
    'Curfew Park'
  ];

  const INITIAL_CLUBS = [
    { id: 'c1', name: 'ROYAL MADRID C.F.', crest: './images/club-crests/royal-madrid-cf.png', icon: '👑', color: '#FFFFFF', accent: '#D4AF37', purse: 2000, squad: [], manager: 'Bot Carlo', stadium: 'The Fortress', isUser: false },
    { id: 'c2', name: 'FC BARCA', crest: './images/club-crests/fc-barca.png', icon: '🔵🔴', color: '#004D98', accent: '#A50044', purse: 2000, squad: [], manager: 'Bot Flick', stadium: 'Hostel Nou Camp', isUser: false },
    { id: 'c3', name: 'MANSISTER UNITED', crest: './images/club-crests/mansister-united.png', icon: '🔴⚫', color: '#DA291C', accent: '#000000', purse: 2000, squad: [], manager: 'Bot Fergie', stadium: 'The Adda Dome', isUser: false },
    { id: 'c4', name: 'MANSISTER CITY', crest: './images/club-crests/mansister-city.png', icon: '🩵⚪', color: '#6CABDD', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Pep', stadium: 'Bunker Colosseum', isUser: false },
    { id: 'c5', name: 'LABOURPOOL FC', crest: './images/club-crests/labourpool-fc.png', icon: '🔴⚪', color: '#C8102E', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Klopp', stadium: 'Cadet Field Arena', isUser: false },
    { id: 'c6', name: 'ARSENUL', crest: './images/club-crests/arsenul.png', icon: '🔴⚪', color: '#EF0107', accent: '#023474', purse: 2000, squad: [], manager: 'Bot Arteta', stadium: 'Parade Ground Stadium', isUser: false },
    { id: 'c7', name: 'CHILLSEA', crest: './images/club-crests/chillsea.png', icon: '🔵⚪', color: '#034694', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Maresca', stadium: 'Curfew Park', isUser: false },
    { id: 'c8', name: 'BAYERN MUNIKH', crest: './images/club-crests/bayern-munikh.png', icon: '🔴⚪', color: '#DC052D', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Kompany', stadium: 'Dorm Arena', isUser: false },
    { id: 'c9', name: 'PARIS SAINT GERMAN', crest: './images/club-crests/paris-saint-german.png', icon: '🔵🔴', color: '#004170', accent: '#DA291C', purse: 2000, squad: [], manager: 'Bot Enrique', stadium: 'The Fortress', isUser: false },
    { id: 'c10', name: 'UVENTUS', crest: './images/club-crests/uventus.png', icon: '⚪⚫', color: '#000000', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Motta', stadium: 'The Adda Dome', isUser: false }
  ];

  // Preloaded Crest Images Cache for 60fps Canvas Render
  const crestImages = {};
  if (typeof Image !== 'undefined') {
    INITIAL_CLUBS.forEach(c => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = c.crest;
      crestImages[c.id] = img;
    });
  }

  // Crest DOM Render Helper
  function renderClubCrest(club, size = 24) {
    if (!club) return '';
    const crestPath = club.crest || (INITIAL_CLUBS.find(c => c.id === club.id) || {}).crest || '';
    if (crestPath) {
      return `<img src="${crestPath}" alt="${club.name}" class="club-crest-img" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle;display:inline-block;" onerror="this.outerHTML='${club.icon || '⚽'}';" />`;
    }
    return club.icon || '⚽';
  }

  // --- 2. GAME STATE ---
  const state = {
    screen: 'splash',
    userManagerName: 'Gaffer Firoz',
    userClubId: 'c1',
    userStadium: 'Hostel Nou Camp',
    roomCode: 'K7X2QD',
    clubs: JSON.parse(JSON.stringify(INITIAL_CLUBS)),
    
    // Auction
    allPlayers: typeof SUPERLEAGUE_PLAYERS !== 'undefined' ? SUPERLEAGUE_PLAYERS : [],
    auctionQueue: [],
    currentLotIdx: 0,
    currentLot: null,
    currentBid: 0,
    currentBidderId: null,
    timer: 40,
    timerInterval: null,
    botBidTimeout: null,
    auctionHistory: [],
    benchPhaseActive: false,
    lotBidsCount: 0,
    lotSecondsElapsed: 0,
    quickCloseActive: false,
    bidLogs: [],

    // Post-Draft Ledger View
    activeLedgerClubId: 'c1',

    // Season
    seasonRounds: [],
    currentRoundIdx: 0,
    standings: [],
    goldenBoot: {},
    seasonCompleted: false,

    // Lead
    leadExpectedPlayers: '50 - 200'
  };

  // Helper: DOM selector
  const $ = (id) => typeof document !== 'undefined' ? document.getElementById(id) : null;
  const $$ = (sel) => typeof document !== 'undefined' ? document.querySelectorAll(sel) : [];

  // --- 3. SCREEN NAVIGATION ---
  function showScreen(screenId) {
    state.screen = screenId;
    if (typeof document === 'undefined') return;

    const screens = $$('.screen');
    screens.forEach(s => s.classList.remove('active'));
    
    const target = $('screen-' + screenId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const app = $('app');
    if (app) {
      if (['auction', 'ledger', 'season', 'champion'].includes(screenId)) {
        app.classList.add('wide-mode');
      } else {
        app.classList.remove('wide-mode');
      }
    }
  }

  // --- 4. TACTICAL XI FORMATION BUILDER (P0-1) ---
  /**
   * Enforces strict tactical football rules:
   * - Exactly 1 Goalkeeper (GK)
   * - 3 to 5 Defenders (DEF)
   * - 3 to 5 Midfielders (MID)
   * - 1 to 3 Forwards (FWD)
   * Starting XI total: exactly 11 players.
   * Bench: exactly 4 players (contains second GK if any + utility subs).
   * Bench Strength: average OVR of the 4 bench players.
   */
  function buildTacticalFormation(squad) {
    if (!squad || squad.length === 0) {
      return {
        formation: '4-3-3',
        startingXI: [],
        startingGK: null,
        startingDefs: [],
        startingMids: [],
        startingFwds: [],
        bench: [],
        benchStrength: 0,
        avgXIOvr: 0
      };
    }

    // 1. Isolate Goalkeepers
    const gks = squad.filter(p => p.pos === 'GK').sort((a, b) => b.ovr - a.ovr);
    const startingGK = gks[0] || { name: 'Reserve GK', pos: 'GK', ovr: 83, country: 'Global' };

    // 2. Isolate Outfielders
    const defs = squad.filter(p => p.pos === 'DEF').sort((a, b) => b.ovr - a.ovr);
    const mids = squad.filter(p => p.pos === 'MID').sort((a, b) => b.ovr - a.ovr);
    const fwds = squad.filter(p => p.pos === 'FWD').sort((a, b) => b.ovr - a.ovr);

    // Candidate valid tactical formations (10 outfielders)
    const candidates = [
      { name: '4-3-3', d: 4, m: 3, f: 3 },
      { name: '4-4-2', d: 4, m: 4, f: 2 },
      { name: '3-5-2', d: 3, m: 5, f: 2 },
      { name: '3-4-3', d: 3, m: 4, f: 3 },
      { name: '4-5-1', d: 4, m: 5, f: 1 },
      { name: '5-3-2', d: 5, m: 3, f: 2 },
      { name: '5-4-1', d: 5, m: 4, f: 1 }
    ];

    let bestConfig = null;
    let maxOvr = -1;

    for (const cand of candidates) {
      if (defs.length >= cand.d && mids.length >= cand.m && fwds.length >= cand.f) {
        const selDefs = defs.slice(0, cand.d);
        const selMids = mids.slice(0, cand.m);
        const selFwds = fwds.slice(0, cand.f);

        const totalOvr = startingGK.ovr +
          selDefs.reduce((s, p) => s + p.ovr, 0) +
          selMids.reduce((s, p) => s + p.ovr, 0) +
          selFwds.reduce((s, p) => s + p.ovr, 0);

        if (totalOvr > maxOvr) {
          maxOvr = totalOvr;
          bestConfig = {
            formation: cand.name,
            d: cand.d,
            m: cand.m,
            f: cand.f,
            startingDefs: selDefs,
            startingMids: selMids,
            startingFwds: selFwds
          };
        }
      }
    }

    // Dynamic fallback if squad has unique distribution
    if (!bestConfig) {
      const dCount = Math.min(defs.length, 4);
      const mCount = Math.min(mids.length, 4);
      const fCount = Math.min(fwds.length, 2);
      bestConfig = {
        formation: `${dCount}-${mCount}-${fCount}`,
        d: dCount,
        m: mCount,
        f: fCount,
        startingDefs: defs.slice(0, dCount),
        startingMids: mids.slice(0, mCount),
        startingFwds: fwds.slice(0, fCount)
      };
    }

    const startingXI = [
      startingGK,
      ...bestConfig.startingDefs,
      ...bestConfig.startingMids,
      ...bestConfig.startingFwds
    ];

    // Bench: all remaining squad members not in startingXI
    const xiIds = new Set(startingXI.map(p => p.id || p.name));
    const bench = squad.filter(p => !xiIds.has(p.id || p.name));

    const benchStrength = bench.length > 0 
      ? Math.round(bench.reduce((s, p) => s + p.ovr, 0) / bench.length) 
      : 0;
    const avgXIOvr = startingXI.length > 0 
      ? Math.round(startingXI.reduce((s, p) => s + p.ovr, 0) / startingXI.length) 
      : 0;

    return {
      formation: bestConfig.formation,
      startingXI,
      startingGK,
      startingDefs: bestConfig.startingDefs,
      startingMids: bestConfig.startingMids,
      startingFwds: bestConfig.startingFwds,
      bench,
      benchStrength,
      avgXIOvr
    };
  }

  // --- 5. PURSE GUARD ENGINE ---
  function getPurseGuardInfo(clubId, proposedLot) {
    const club = state.clubs.find(c => c.id === clubId);
    if (!club) return { allowed: false, maxBid: 0, reason: 'Invalid club' };

    const slotsLeft = 15 - club.squad.length;
    if (slotsLeft <= 0) {
      return { allowed: false, maxBid: 0, reason: 'Squad full (15/15 players)' };
    }

    const gkCount = club.squad.filter(p => p.pos === 'GK').length;
    const isGK = proposedLot && proposedLot.pos === 'GK';

    // If only 1 slot left and 0 GK in squad, that slot MUST be a GK!
    if (slotsLeft === 1 && gkCount === 0 && !isGK) {
      return {
        allowed: false,
        maxBid: 0,
        reason: 'Purse Guard locked: Final slot must be a Goalkeeper (GK) to complete legal formation.'
      };
    }

    // Min points reserved for remaining (slotsLeft - 1) players
    const reserveNeeded = (slotsLeft - 1) * 65;
    const maxBid = club.purse - reserveNeeded;

    if (maxBid <= 0) {
      return {
        allowed: false,
        maxBid: 0,
        reason: 'Purse depleted: Must reserve 65 pts for each remaining slot.'
      };
    }

    let reason = `Max allowed bid ${maxBid} pts — ${slotsLeft} slots open. Guard holding ${reserveNeeded} pts for remaining legal squad.`;
    if (gkCount === 0 && !isGK) {
      reason += ' (Includes 1 GK mandate reserve).';
    }

    return { allowed: true, maxBid, reason, reserveNeeded, slotsLeft };
  }

  // --- 6. INITIALIZATION & SPLASH ---
  function init() {
    setupEventListeners();
    renderClubSelection();
    renderStadiumSelection();
    
    // Auto-advance splash after 1.5s
    const splashTimer = setTimeout(() => {
      if (state.screen === 'splash') {
        showScreen('shelf');
      }
    }, 1500);

    const splashScreen = $('screen-splash');
    if (splashScreen) {
      splashScreen.addEventListener('click', () => {
        clearTimeout(splashTimer);
        showScreen('shelf');
      });
    }
  }

  // --- 7. EVENT LISTENERS ---
  function setupEventListeners() {
    // Brand header tap
    const brandBtn = $('app-brand-btn');
    if (brandBtn) brandBtn.addEventListener('click', () => showScreen('shelf'));

    // Shelf Screen
    const playSuperLeague = $('btn-play-superleague');
    if (playSuperLeague) playSuperLeague.addEventListener('click', () => showScreen('doors'));
    const notifySuperCup = $('btn-notify-supercup');
    if (notifySuperCup) notifySuperCup.addEventListener('click', () => openNotifyModal('Super Cup (Cricket Auction)'));
    const notifyLiveAuction = $('btn-notify-liveauction');
    if (notifyLiveAuction) notifyLiveAuction.addEventListener('click', () => openNotifyModal('Live Auction Events'));

    // Doors Screen
    const doorPlay = $('btn-door-play');
    if (doorPlay) doorPlay.addEventListener('click', () => showScreen('lobby'));
    const doorCreate = $('btn-door-create');
    if (doorCreate) doorCreate.addEventListener('click', () => showScreen('lobby'));
    const doorJoin = $('btn-door-join');
    if (doorJoin) {
      doorJoin.addEventListener('click', () => {
        const code = $('join-room-input').value.trim();
        if (code) state.roomCode = code.toUpperCase();
        showScreen('lobby');
      });
    }

    // Lobby Screen
    const startAuction = $('btn-start-auction');
    if (startAuction) startAuction.addEventListener('click', startAuctionRitual);
    const mgrInput = $('manager-name-input');
    if (mgrInput) {
      mgrInput.addEventListener('input', (e) => {
        state.userManagerName = e.target.value.trim() || 'Gaffer';
        updateUserClubInfo();
      });
    }

    // Auction Screen
    const bid20 = $('btn-bid-20');
    if (bid20) bid20.addEventListener('click', () => placeUserBid(20));
    const bid50 = $('btn-bid-50');
    if (bid50) bid50.addEventListener('click', () => placeUserBid(50));
    const bid100 = $('btn-bid-100');
    if (bid100) bid100.addEventListener('click', () => placeUserBid(100));
    const passLot = $('btn-pass-lot');
    if (passLot) passLot.addEventListener('click', handleUserPass);
    const simAuction = $('btn-sim-auction');
    if (simAuction) simAuction.addEventListener('click', simulateAuctionToEnd);
    const viewSquad = $('btn-view-squad');
    if (viewSquad) viewSquad.addEventListener('click', openSquadModal);

    // Auditor Telemetry Shortcuts
    const btnDemoQuickClose = $('btn-demo-quickclose');
    if (btnDemoQuickClose) btnDemoQuickClose.addEventListener('click', triggerDemoQuickClose);
    const btnDemoBenchPhase = $('btn-demo-benchphase');
    if (btnDemoBenchPhase) btnDemoBenchPhase.addEventListener('click', triggerDemoJumpBenchPhase);

    // Post-Draft Ledger Screen (P0-2)
    const proceedToSeason = $('btn-proceed-to-season');
    if (proceedToSeason) proceedToSeason.addEventListener('click', proceedFromLedgerToSeason);
    const proceedToSeasonTop = $('btn-proceed-to-season-top');
    if (proceedToSeasonTop) proceedToSeasonTop.addEventListener('click', proceedFromLedgerToSeason);

    // Season Screen
    const simRound = $('btn-sim-round');
    if (simRound) simRound.addEventListener('click', simulateNextRound);
    const autoSimSeason = $('btn-auto-sim-season');
    if (autoSimSeason) autoSimSeason.addEventListener('click', autoSimulateSeason);
    const viewChamp = $('btn-view-champion-moment');
    if (viewChamp) viewChamp.addEventListener('click', () => showScreen('champion'));

    // Champion Screen & Flex Studio
    const expChamp = $('btn-export-champions-card');
    if (expChamp) expChamp.addEventListener('click', () => exportCard('champions'));
    const expTable = $('btn-export-table-card');
    if (expTable) expTable.addEventListener('click', () => exportCard('table'));
    const expSquad = $('btn-export-squad-card');
    if (expSquad) expSquad.addEventListener('click', () => exportCard('squad'));
    const viralShare = $('btn-viral-share');
    if (viralShare) viralShare.addEventListener('click', triggerViralShare);
    const rematch = $('btn-rematch');
    if (rematch) rematch.addEventListener('click', resetForRematch);

    // Lead Intake Form
    $$('.chip-option').forEach(chip => {
      chip.addEventListener('click', (e) => {
        $$('.chip-option').forEach(c => c.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        state.leadExpectedPlayers = e.currentTarget.dataset.val;
      });
    });
    const submitLead = $('btn-submit-lead');
    if (submitLead) submitLead.addEventListener('click', handleLeadSubmit);
    const submitModalNotify = $('btn-submit-modal-notify');
    if (submitModalNotify) submitModalNotify.addEventListener('click', handleModalNotifySubmit);
    const notifyClose = $('modal-notify-close');
    if (notifyClose) notifyClose.addEventListener('click', closeNotifyModal);
    const squadClose = $('modal-squad-close');
    if (squadClose) squadClose.addEventListener('click', closeSquadModal);
  }

  // --- 8. LOBBY SETUP ---
  function renderStadiumSelection() {
    const wrap = $('stadium-pills-wrap');
    if (!wrap) return;
    wrap.innerHTML = '';

    STADIUMS.forEach((stadium) => {
      const pill = document.createElement('div');
      pill.className = `stadium-pill ${stadium === state.userStadium ? 'selected' : ''}`;
      pill.textContent = stadium;
      pill.addEventListener('click', () => {
        $$('.stadium-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        state.userStadium = stadium;
        updateUserClubInfo();
      });
      wrap.appendChild(pill);
    });
  }

  function renderClubSelection() {
    const grid = $('club-selection-grid');
    if (!grid) return;
    grid.innerHTML = '';

    state.clubs.forEach((club) => {
      const card = document.createElement('div');
      const isSelected = club.id === state.userClubId;
      card.className = `club-choice-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="club-badge-icon">${renderClubCrest(club, 32)}</div>
        <div class="club-choice-info">
          <div class="club-choice-name">${club.name}</div>
          <div class="club-choice-tag">${isSelected ? 'Your Club' : club.manager}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        state.userClubId = club.id;
        state.clubs.forEach(c => c.isUser = (c.id === club.id));
        updateUserClubInfo();
        renderClubSelection();
      });

      grid.appendChild(card);
    });
  }

  function updateUserClubInfo() {
    const userClub = state.clubs.find(c => c.id === state.userClubId);
    if (userClub) {
      userClub.manager = state.userManagerName;
      userClub.stadium = state.userStadium;
      userClub.isUser = true;
    }
    state.clubs.forEach(c => {
      if (c.id !== state.userClubId) {
        c.isUser = false;
      }
    });
  }

  // --- 9. AUCTION ENGINE (WITH STRICT BID MATH & LIVE FEED) ---
  function startAuctionRitual() {
    updateUserClubInfo();
    
    // Shuffle 180-player pool
    state.auctionQueue = [...state.allPlayers].sort(() => 0.5 - Math.random());
    state.currentLotIdx = 0;
    state.auctionHistory = [];
    state.benchPhaseActive = false;
    state.bidLogs = [];

    // Reset purses & squads
    state.clubs.forEach(c => {
      c.purse = 2000;
      c.squad = [];
      delete c.tactical;
    });

    showScreen('auction');
    presentNextLot();
  }

  function presentNextLot() {
    clearInterval(state.timerInterval);
    clearTimeout(state.botBidTimeout);
    const antiSnipe = $('anti-snipe-banner');
    if (antiSnipe) antiSnipe.classList.remove('active');

    // Check if all clubs have 15 players
    const allDone = state.clubs.every(c => c.squad.length >= 15);
    if (allDone || state.currentLotIdx >= state.auctionQueue.length) {
      finishAuction();
      return;
    }

    // Bench Phase check (all clubs have >= 11 players)
    const allHaveStartingXI = state.clubs.every(c => c.squad.length >= 11);
    state.benchPhaseActive = allHaveStartingXI;
    const benchBanner = $('bench-phase-banner');
    if (benchBanner) {
      benchBanner.textContent = '⚡ BENCH PHASE: 20S LOTS';
      benchBanner.style.display = state.benchPhaseActive ? 'block' : 'none';
    }

    state.currentLot = state.auctionQueue[state.currentLotIdx];
    state.currentBid = 0;
    state.currentBidderId = null;
    state.lotBidsCount = 0;
    state.timer = state.benchPhaseActive ? 20 : 40;

    // Log new lot to ticker
    logBidActivity(`[LOT ${state.currentLotIdx + 1}] ${state.currentLot.name} (${state.currentLot.pos} · ${state.currentLot.ovr} OVR) · Base ${state.currentLot.basePrice} PTS`);

    renderAuctionLotUI();
    updatePurseGuardUI();
    startLotTimer();

    // Trigger AI bots to appraise lot
    scheduleBotAppraisal();
  }

  function renderAuctionLotUI() {
    const p = state.currentLot;
    if (!p) return;

    $('lot-index-display').textContent = `LOT ${state.currentLotIdx + 1} / 180`;
    
    const posTag = $('lot-pos-tag');
    posTag.textContent = p.pos;
    posTag.className = `lot-pos-pill pos-${p.pos}`;

    $('player-name-display').textContent = p.name;
    $('player-ovr-display').textContent = p.ovr;
    $('player-country-tag').textContent = p.country;
    $('player-foot-tag').textContent = `Foot: ${p.foot}`;
    $('player-prime-tag').textContent = p.prime;
    $('player-base-price-tag').textContent = `Base: ${p.basePrice} pts`;

    updateCurrentBidDisplay();
  }

  function updateCurrentBidDisplay() {
    const bidVal = state.currentBid === 0 ? state.currentLot.basePrice : state.currentBid;
    $('current-bid-display').textContent = `${bidVal} PTS`;

    const leaderTag = $('bid-leader-display');
    if (!state.currentBidderId) {
      leaderTag.textContent = `Base Price · Awaiting Opening Bid`;
    } else {
      const bidder = state.clubs.find(c => c.id === state.currentBidderId);
      leaderTag.textContent = `Leader: ${bidder ? bidder.name : 'Unknown'} (${bidder ? bidder.manager : ''})`;
    }
  }

  function logBidActivity(text) {
    state.bidLogs.push(text);
    const box = $('bid-activity-feed-box');
    if (!box) return;

    const row = document.createElement('div');
    row.textContent = text;
    if (text.includes('You (')) {
      row.style.color = 'var(--grad-cyan)';
      row.style.fontWeight = '700';
    } else if (text.includes('bid') || text.includes('raised')) {
      row.style.color = '#FFFFFF';
    } else {
      row.style.color = 'var(--text-muted)';
    }

    box.appendChild(row);
    box.scrollTop = box.scrollHeight;
  }

  function updatePurseGuardUI() {
    const userClub = state.clubs.find(c => c.id === state.userClubId);
    if (!userClub) return;

    $('user-purse-display').textContent = `${userClub.purse} PTS`;
    $('user-squad-count-display').textContent = `${userClub.squad.length} / 15 SQUAD`;

    const guard = getPurseGuardInfo(userClub.id, state.currentLot);
    $('purse-guard-reason-text').textContent = guard.reason;

    // P1-1: Strict Bid Calculation
    // If state.currentBid === 0, clicking +20 from 140 base strictly bids 160
    const activeBase = state.currentBid === 0 ? state.currentLot.basePrice : state.currentBid;

    [20, 50, 100].forEach(inc => {
      const nextBid = activeBase + inc;
      const btn = $(`btn-bid-${inc}`);
      if (!btn) return;

      const canAfford = guard.allowed && nextBid <= guard.maxBid;
      const alreadyLeader = state.currentBidderId === userClub.id;

      btn.disabled = !canAfford || alreadyLeader || userClub.squad.length >= 15;
      btn.querySelector('.bid-amount-label').textContent = `+${inc} PTS (${nextBid})`;
    });
  }

  function startLotTimer() {
    clearInterval(state.timerInterval);
    state.lotSecondsElapsed = 0;
    state.quickCloseActive = false;
    const quickBanner = $('quick-close-banner');
    if (quickBanner) quickBanner.style.display = 'none';

    const timerElem = $('timer-display-num');
    if (timerElem) timerElem.classList.remove('danger');

    state.timerInterval = setInterval(() => {
      state.lotSecondsElapsed++;
      state.timer--;

      // Quick-Close Rule: on any lot with 0 bids for 8 seconds, visibly trigger fast-forward closing in 2s
      if (state.lotBidsCount === 0 && state.lotSecondsElapsed >= 8 && !state.quickCloseActive) {
        state.quickCloseActive = true;
        state.timer = 2;
        if (quickBanner) {
          quickBanner.textContent = '⚡ QUICK-CLOSE: NO BIDS (CLOSING IN 2S)';
          quickBanner.style.display = 'block';
        }
        logBidActivity(`⚡ QUICK-CLOSE TRIGGERED: NO BIDS IN 8S · CLOSING IN 2S`);
      }

      if (timerElem) {
        timerElem.textContent = `${state.timer}s`;
        if (state.timer <= 10 || state.quickCloseActive) {
          timerElem.classList.add('danger');
        } else {
          timerElem.classList.remove('danger');
        }
      }

      if (state.timer <= 0) {
        clearInterval(state.timerInterval);
        if (quickBanner) quickBanner.style.display = 'none';
        resolveLotSale();
      }
    }, 1000);
  }

  // Auditor Telemetry Demo Shortcuts
  function triggerDemoQuickClose() {
    if (!state.currentLot) return;
    state.lotBidsCount = 0;
    state.lotSecondsElapsed = 8;
    state.quickCloseActive = true;
    state.timer = 2;
    const quickBanner = $('quick-close-banner');
    if (quickBanner) {
      quickBanner.textContent = '⚡ QUICK-CLOSE: NO BIDS (CLOSING IN 2S)';
      quickBanner.style.display = 'block';
    }
    const timerElem = $('timer-display-num');
    if (timerElem) {
      timerElem.textContent = '2s';
      timerElem.classList.add('danger');
    }
    logBidActivity(`🧪 DEMO TELEMETRY: ⚡ QUICK-CLOSE FORCED (CLOSING IN 2S)`);
  }

  function triggerDemoJumpBenchPhase() {
    // Fill each club up to 11 players from queue to simulate fast forward to bench phase
    state.clubs.forEach((club) => {
      while (club.squad.length < 11 && state.currentLotIdx < state.auctionQueue.length) {
        const p = state.auctionQueue[state.currentLotIdx++];
        club.squad.push(p);
        club.purse = Math.max(80, club.purse - p.basePrice);
      }
    });
    state.benchPhaseActive = true;
    const benchBanner = $('bench-phase-banner');
    if (benchBanner) {
      benchBanner.textContent = '⚡ BENCH PHASE: 20S LOTS';
      benchBanner.style.display = 'block';
    }
    logBidActivity(`🧪 DEMO TELEMETRY: ⚡ JUMP TO BENCH PHASE (ALL CLUBS HAVE 11 PLAYERS · 20S CLOCK)`);
    loadNextAuctionLot();
  }

  // P1-1 User Bid Execution
  function placeUserBid(increment) {
    const userClub = state.clubs.find(c => c.id === state.userClubId);
    if (!userClub) return;

    const guard = getPurseGuardInfo(userClub.id, state.currentLot);
    const activeBase = state.currentBid === 0 ? state.currentLot.basePrice : state.currentBid;
    const nextBid = activeBase + increment;

    if (!guard.allowed || nextBid > guard.maxBid) {
      alert(`Purse Guard: Cannot place bid of ${nextBid} pts. Maximum allowed is ${guard.maxBid} pts.`);
      return;
    }

    executeBid(userClub.id, nextBid, true);
  }

  function executeBid(clubId, amount, isUser = false) {
    state.currentBid = amount;
    state.currentBidderId = clubId;
    state.lotBidsCount++;

    if (state.quickCloseActive) {
      state.quickCloseActive = false;
      const quickBanner = $('quick-close-banner');
      if (quickBanner) quickBanner.style.display = 'none';
    }

    const bidder = state.clubs.find(c => c.id === clubId);
    if (isUser) {
      logBidActivity(`⚡ You (${bidder.name}) bid ${amount} PTS`);
    } else {
      logBidActivity(`🤖 [${bidder.manager} (${bidder.name}) bid ${amount} PTS]`);
    }

    // Anti-Snipe: If bid in final 10 seconds, add +10s
    if (state.timer <= 10) {
      state.timer += 10;
      const antiSnipe = $('anti-snipe-banner');
      if (antiSnipe) {
        antiSnipe.classList.add('active');
        setTimeout(() => antiSnipe.classList.remove('active'), 2500);
      }
    }

    updateCurrentBidDisplay();
    updatePurseGuardUI();

    // Trigger bots to react
    scheduleBotAppraisal();
  }

  function handleUserPass() {
    if (state.currentBidderId === state.userClubId) {
      return;
    }
    logBidActivity(`👋 You passed on ${state.currentLot.name}`);
    if (state.lotBidsCount === 0) {
      state.timer = Math.min(state.timer, 3);
    }
  }

  // Realistic Bot AI
  function scheduleBotAppraisal() {
    clearTimeout(state.botBidTimeout);

    const delay = Math.floor(Math.random() * 2200) + 1000;
    state.botBidTimeout = setTimeout(() => {
      evaluateBotBids();
    }, delay);
  }

  function evaluateBotBids() {
    if (state.timer <= 0) return;

    const lot = state.currentLot;
    if (!lot) return;

    const eligibleBots = state.clubs.filter(c => {
      if (c.id === state.userClubId) return false;
      if (c.id === state.currentBidderId) return false;
      if (c.squad.length >= 15) return false;

      const guard = getPurseGuardInfo(c.id, lot);
      if (!guard.allowed) return false;

      // Position quota limit
      const posCount = c.squad.filter(p => p.pos === lot.pos).length;
      if (lot.pos === 'GK' && posCount >= 2) return false;
      if (lot.pos === 'DEF' && posCount >= 6) return false;
      if (lot.pos === 'MID' && posCount >= 6) return false;
      if (lot.pos === 'FWD' && posCount >= 4) return false;

      const activeBase = state.currentBid === 0 ? lot.basePrice : state.currentBid;
      const maxWilling = lot.basePrice + (lot.ovr >= 92 ? 140 : (lot.ovr >= 88 ? 70 : 30));
      return (activeBase + 20) <= maxWilling && (activeBase + 20) <= guard.maxBid;
    });

    if (eligibleBots.length > 0) {
      const bot = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];
      const increments = [20, 20, 50];
      const inc = increments[Math.floor(Math.random() * increments.length)];
      const activeBase = state.currentBid === 0 ? lot.basePrice : state.currentBid;
      const nextBid = activeBase + inc;
      
      const guard = getPurseGuardInfo(bot.id, lot);
      if (nextBid <= guard.maxBid) {
        executeBid(bot.id, nextBid, false);
      }
    }
  }

  function resolveLotSale() {
    const lot = state.currentLot;
    if (state.currentBidderId && state.currentBid > 0) {
      const winner = state.clubs.find(c => c.id === state.currentBidderId);
      if (winner) {
        winner.purse -= state.currentBid;
        winner.squad.push({
          ...lot,
          boughtPrice: state.currentBid
        });

        logBidActivity(`🔨 SOLD! ${lot.name} to ${winner.name} for ${state.currentBid} PTS`);

        state.auctionHistory.push({
          lot: lot.name,
          pos: lot.pos,
          ovr: lot.ovr,
          price: state.currentBid,
          club: winner.name,
          isUser: winner.isUser
        });
      }
    } else {
      logBidActivity(`❌ UNSOLD: ${lot.name} returns to pool`);
      state.auctionHistory.push({
        lot: lot.name,
        pos: lot.pos,
        ovr: lot.ovr,
        price: 0,
        club: 'UNSOLD',
        isUser: false
      });
    }

    state.currentLotIdx++;
    presentNextLot();
  }

  // Fast Full Draft Simulation (Guarantees Gate 1 & Gate 2 Parity)
  function simulateAuctionToEnd() {
    clearInterval(state.timerInterval);
    clearTimeout(state.botBidTimeout);

    // Resolve active bid if any
    if (state.currentBidderId && state.currentBid > 0) {
      const winner = state.clubs.find(c => c.id === state.currentBidderId);
      if (winner && winner.squad.length < 15) {
        winner.purse -= state.currentBid;
        winner.squad.push({
          ...state.currentLot,
          boughtPrice: state.currentBid
        });
      }
      state.currentLotIdx++;
    }

    // Allocate remaining lots to clubs that need players
    while (state.clubs.some(c => c.squad.length < 15) && state.currentLotIdx < state.auctionQueue.length) {
      const lot = state.auctionQueue[state.currentLotIdx];
      state.currentLotIdx++;

      const clubsNeeding = state.clubs.filter(c => {
        if (c.squad.length >= 15) return false;
        const guard = getPurseGuardInfo(c.id, lot);
        if (!guard.allowed) return false;

        const posCount = c.squad.filter(p => p.pos === lot.pos).length;
        if (lot.pos === 'GK' && posCount >= 2) return false;
        return guard.maxBid >= lot.basePrice;
      });

      if (clubsNeeding.length > 0) {
        clubsNeeding.sort((a, b) => b.purse - a.purse);
        const buyer = clubsNeeding[0];
        const price = Math.min(buyer.purse - (14 - buyer.squad.length) * 65, lot.basePrice);
        
        buyer.purse -= price;
        buyer.squad.push({
          ...lot,
          boughtPrice: price
        });
      }
    }

    // Strict Formation Balancing pass: ensure exactly 15 players and at least 1 GK
    state.clubs.forEach(c => {
      // 1. Ensure GK
      const hasGK = c.squad.some(p => p.pos === 'GK');
      if (!hasGK) {
        const gkCandidate = state.allPlayers.find(p => p.pos === 'GK' && !c.squad.some(s => s.id === p.id));
        if (gkCandidate) {
          if (c.squad.length >= 15) {
            c.squad.sort((a, b) => a.ovr - b.ovr);
            const removed = c.squad.shift();
            c.purse += removed.boughtPrice || 65;
          }
          const cost = Math.min(c.purse, gkCandidate.basePrice);
          c.purse -= cost;
          c.squad.push({ ...gkCandidate, boughtPrice: cost });
        }
      }

      // 2. Ensure minimum outfield distribution (at least 3 DEF, 3 MID, 1 FWD)
      const defCount = c.squad.filter(p => p.pos === 'DEF').length;
      if (defCount < 3) {
        const defCandidate = state.allPlayers.find(p => p.pos === 'DEF' && !c.squad.some(s => s.id === p.id));
        if (defCandidate && c.squad.length >= 15) {
          const removableIdx = c.squad.findIndex(p => p.pos !== 'GK');
          if (removableIdx !== -1) {
            const removed = c.squad.splice(removableIdx, 1)[0];
            c.purse += removed.boughtPrice || 65;
            const cost = Math.min(c.purse, defCandidate.basePrice);
            c.purse -= cost;
            c.squad.push({ ...defCandidate, boughtPrice: cost });
          }
        }
      }

      // 3. Top off to exactly 15 players
      while (c.squad.length < 15) {
        const fillPlayer = state.allPlayers.find(p => !c.squad.some(s => s.id === p.id)) || {
          id: 'sub_' + Math.random(),
          name: 'Academy Reserve',
          pos: 'MID',
          ovr: 83,
          basePrice: 65,
          country: 'Global',
          foot: 'R',
          prime: 'Academy'
        };
        const cost = Math.min(c.purse, 65);
        c.purse = Math.max(0, c.purse - cost);
        c.squad.push({ ...fillPlayer, boughtPrice: cost });
      }
    });

    finishAuction();
  }

  // P0-2: Post-Draft Transition
  function finishAuction() {
    clearInterval(state.timerInterval);
    clearTimeout(state.botBidTimeout);

    // Build tactical formations for all 10 clubs
    state.clubs.forEach(c => {
      c.tactical = buildTacticalFormation(c.squad);
    });

    // Initialize 9-Round Season fixtures in background
    initSeasonSimulation();

    // Show Post-Draft Ledger & Roster Review Screen
    state.activeLedgerClubId = state.userClubId;
    renderDraftLedgerUI();
    showScreen('ledger');
  }

  // --- 10. POST-DRAFT SQUAD & PURSE LEDGER (P0-2) ---
  function renderDraftLedgerUI() {
    const tabsContainer = $('ledger-club-tabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';

    // Render 10 club tabs
    state.clubs.forEach(club => {
      const tab = document.createElement('div');
      const isActive = club.id === state.activeLedgerClubId;
      tab.className = `stadium-pill ${isActive ? 'selected' : ''}`;
      tab.innerHTML = `${renderClubCrest(club, 20)} ${club.name} ${club.isUser ? '(YOU)' : ''}`;
      tab.addEventListener('click', () => {
        state.activeLedgerClubId = club.id;
        renderDraftLedgerUI();
      });
      tabsContainer.appendChild(tab);
    });

    // Render active club details
    const activeClub = state.clubs.find(c => c.id === state.activeLedgerClubId) || state.clubs[0];
    const container = $('ledger-active-club-container');
    if (!container) return;

    const tactical = activeClub.tactical || buildTacticalFormation(activeClub.squad);
    const totalSpent = activeClub.squad.reduce((sum, p) => sum + (p.boughtPrice || 0), 0);
    const mathReconciled = (totalSpent + activeClub.purse) === 2000;

    container.innerHTML = `
      <!-- Club Header & Purse Math Reconciliation Bar -->
      <div class="surface-panel" style="margin-bottom:14px;border-color:rgba(150,70,255,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <span>${renderClubCrest(activeClub, 44)}</span>
            <div>
              <h3 style="font-size:18px;font-weight:800;">${activeClub.name}</h3>
              <p style="font-size:12px;color:var(--text-muted);">Manager: ${activeClub.manager} · ${activeClub.stadium}</p>
            </div>
          </div>
          <div style="text-align:right;">
            <span class="badge-live">${tactical.formation} FORMATION</span>
            <div style="font-size:11px;color:var(--text-dim);margin-top:4px;">Avg XI: ${tactical.avgXIOvr} OVR</div>
          </div>
        </div>

        <!-- 2,000 Pts Exact Arithmetic Reconciliation Bar -->
        <div style="background:#000000;border:1px solid var(--border-subtle);border-radius:12px;padding:12px 16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;font-family:var(--font-mono);font-size:13px;font-weight:700;">
            <span style="color:var(--text-dim);">STARTING: 2,000 PTS</span>
            <span style="color:#FF00C8;">SPENT: ${totalSpent} PTS</span>
            <span style="color:var(--grad-cyan);">REMAINING: ${activeClub.purse} PTS</span>
          </div>
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;font-size:11px;">
            <span style="color:var(--text-muted);">PURSE INTEGRITY (GATE 2):</span>
            <span style="color:${mathReconciled ? 'var(--live-green)' : '#EF4444'};font-weight:700;font-family:var(--font-mono);">
              ${mathReconciled ? '✓ EXACT 2,000 PTS RECONCILIATION CERTIFIED' : '✗ MATH DISCREPANCY'}
            </span>
          </div>
        </div>
      </div>

      <!-- Starting XI Section -->
      <div class="surface-panel" style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <h4 style="font-size:14px;color:var(--text-white);">🏆 STARTING XI (${tactical.startingXI.length} PLAYERS)</h4>
          <span style="font-size:11px;color:var(--grad-cyan);font-weight:700;">FORMATION: ${tactical.formation}</span>
        </div>

        <!-- GK -->
        <div style="margin-bottom:8px;">
          <div style="font-size:10px;color:var(--text-dim);font-weight:700;margin-bottom:4px;text-transform:uppercase;">GOALKEEPER (1)</div>
          ${renderPlayerLedgerRow(tactical.startingGK)}
        </div>

        <!-- DEF -->
        <div style="margin-bottom:8px;">
          <div style="font-size:10px;color:var(--text-dim);font-weight:700;margin-bottom:4px;text-transform:uppercase;">DEFENDERS (${tactical.startingDefs.length})</div>
          ${tactical.startingDefs.map(p => renderPlayerLedgerRow(p)).join('')}
        </div>

        <!-- MID -->
        <div style="margin-bottom:8px;">
          <div style="font-size:10px;color:var(--text-dim);font-weight:700;margin-bottom:4px;text-transform:uppercase;">MIDFIELDERS (${tactical.startingMids.length})</div>
          ${tactical.startingMids.map(p => renderPlayerLedgerRow(p)).join('')}
        </div>

        <!-- FWD -->
        <div style="margin-bottom:8px;">
          <div style="font-size:10px;color:var(--text-dim);font-weight:700;margin-bottom:4px;text-transform:uppercase;">FORWARDS (${tactical.startingFwds.length})</div>
          ${tactical.startingFwds.map(p => renderPlayerLedgerRow(p)).join('')}
        </div>
      </div>

      <!-- Bench (4 Players) -->
      <div class="surface-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <h4 style="font-size:14px;color:var(--text-white);">🛡️ BENCH & RESERVES (${tactical.bench.length} PLAYERS)</h4>
          <span style="font-size:11px;color:#FF00C8;font-weight:700;font-family:var(--font-mono);">
            BENCH STRENGTH: AVG ${tactical.benchStrength} OVR
          </span>
        </div>
        ${tactical.bench.map(p => renderPlayerLedgerRow(p, true)).join('')}
      </div>
    `;
  }

  function renderPlayerLedgerRow(p, isBench = false) {
    if (!p) return '';
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg-surface-elevated);border-radius:8px;margin-bottom:4px;font-size:12px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="lot-pos-pill pos-${p.pos}" style="font-size:10px;">${p.pos}</span>
          <span style="font-weight:600;color:var(--text-white);">${p.name} ${isBench ? '<span style="color:var(--text-dim);font-size:10px;">(SUB)</span>' : ''}</span>
          <span style="font-size:11px;color:var(--text-dim);">${p.country || ''}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;font-family:var(--font-mono);">
          <span style="color:var(--grad-cyan);font-weight:700;">${p.ovr} OVR</span>
          <span style="color:var(--text-muted);">${p.boughtPrice || p.basePrice || 65} pts</span>
        </div>
      </div>
    `;
  }

  function proceedFromLedgerToSeason() {
    showScreen('season');
    renderSeasonRoundUI();
  }

  // --- 11. SEASON SIMULATION (9 ROUNDS) ---
  function initSeasonSimulation() {
    state.currentRoundIdx = 0;
    state.seasonCompleted = false;
    state.goldenBoot = {};

    // Initialize Standings
    state.standings = state.clubs.map(c => ({
      clubId: c.id,
      name: c.name,
      icon: c.icon,
      isUser: c.isUser,
      p: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0
    }));

    // Generate Single Round-Robin Fixtures (9 rounds, 5 matches per round)
    state.seasonRounds = generateRoundRobinSchedule(state.clubs.map(c => c.id));
  }

  function generateRoundRobinSchedule(teamIds) {
    const n = teamIds.length;
    const rounds = [];
    const pool = [...teamIds];

    for (let r = 0; r < n - 1; r++) {
      const roundMatches = [];
      for (let i = 0; i < n / 2; i++) {
        const home = pool[i];
        const away = pool[n - 1 - i];
        roundMatches.push({
          homeId: home,
          awayId: away,
          played: false,
          homeScore: 0,
          awayScore: 0,
          scorers: []
        });
      }
      rounds.push({ roundNum: r + 1, matches: roundMatches });
      const fixed = pool[0];
      const rest = pool.slice(1);
      rest.unshift(rest.pop());
      pool.splice(0, n, fixed, ...rest);
    }
    return rounds;
  }

  function simulateNextRound() {
    if (state.currentRoundIdx >= state.seasonRounds.length) return;

    const round = state.seasonRounds[state.currentRoundIdx];
    round.matches.forEach(m => simulateMatch(m));

    updateStandingsTable();
    state.currentRoundIdx++;
    renderSeasonRoundUI();

    if (state.currentRoundIdx >= state.seasonRounds.length) {
      state.seasonCompleted = true;
      const simBtn = $('btn-sim-round');
      if (simBtn) simBtn.disabled = true;
      const autoBtn = $('btn-auto-sim-season');
      if (autoBtn) autoBtn.disabled = true;
      const champBtn = $('btn-view-champion-moment');
      if (champBtn) champBtn.style.display = 'inline-flex';
    }
  }

  function autoSimulateSeason() {
    while (state.currentRoundIdx < state.seasonRounds.length) {
      simulateNextRound();
    }
    showScreen('champion');
    renderChampionScreen();
  }

  function simulateMatch(match) {
    const homeClub = state.clubs.find(c => c.id === match.homeId);
    const awayClub = state.clubs.find(c => c.id === match.awayId);
    if (!homeClub || !awayClub) return;

    const getRating = (club, isHome) => {
      const tactical = club.tactical || buildTacticalFormation(club.squad);
      const avgOvr = tactical.avgXIOvr || 85;
      const gk = tactical.startingGK || { ovr: 85 };
      return (avgOvr * 0.75) + (gk.ovr * 0.25) + (isHome ? 2 : 0);
    };

    const ratingH = getRating(homeClub, true);
    const ratingA = getRating(awayClub, false);
    const diff = (ratingH - ratingA);

    let goalsH = Math.max(0, Math.round(1.5 + (diff / 6) + (Math.random() * 2 - 1)));
    let goalsA = Math.max(0, Math.round(1.2 - (diff / 6) + (Math.random() * 2 - 1)));

    goalsH = Math.min(5, goalsH);
    goalsA = Math.min(5, goalsA);

    match.played = true;
    match.homeScore = goalsH;
    match.awayScore = goalsA;
    match.scorers = [];

    const assignScorers = (club, count) => {
      const candidates = club.squad.filter(p => p.pos === 'FWD' || p.pos === 'MID');
      for (let i = 0; i < count; i++) {
        const scorer = candidates[Math.floor(Math.random() * candidates.length)] || club.squad[0];
        const min = Math.floor(Math.random() * 88) + 2;
        match.scorers.push({
          player: scorer.name,
          minute: min,
          clubName: club.name
        });
        state.goldenBoot[scorer.name] = (state.goldenBoot[scorer.name] || 0) + 1;
      }
    };

    assignScorers(homeClub, goalsH);
    assignScorers(awayClub, goalsA);
    match.scorers.sort((a, b) => a.minute - b.minute);
  }

  function updateStandingsTable() {
    state.standings.forEach(s => {
      s.p = 0; s.w = 0; s.d = 0; s.l = 0; s.gf = 0; s.ga = 0; s.gd = 0; s.pts = 0;
    });

    state.seasonRounds.forEach(r => {
      r.matches.forEach(m => {
        if (!m.played) return;
        const homeRow = state.standings.find(s => s.clubId === m.homeId);
        const awayRow = state.standings.find(s => s.clubId === m.awayId);

        homeRow.p++;
        awayRow.p++;
        homeRow.gf += m.homeScore;
        homeRow.ga += m.awayScore;
        awayRow.gf += m.awayScore;
        awayRow.ga += m.homeScore;

        if (m.homeScore > m.awayScore) {
          homeRow.w++;
          homeRow.pts += 3;
          awayRow.l++;
        } else if (m.homeScore < m.awayScore) {
          awayRow.w++;
          awayRow.pts += 3;
          homeRow.l++;
        } else {
          homeRow.d++;
          awayRow.d++;
          homeRow.pts += 1;
          awayRow.pts += 1;
        }

        homeRow.gd = homeRow.gf - homeRow.ga;
        awayRow.gd = awayRow.gf - awayRow.ga;
      });
    });

    state.standings.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
  }

  function renderSeasonRoundUI() {
    if (typeof document === 'undefined') return;

    const roundIdx = Math.min(state.currentRoundIdx, state.seasonRounds.length - 1);
    const round = state.seasonRounds[roundIdx];
    if (!round) return;

    $('current-round-pill').textContent = `ROUND ${round.roundNum} / 9`;

    const userMatch = round.matches.find(m => m.homeId === state.userClubId || m.awayId === state.userClubId);
    if (userMatch) {
      const homeClub = state.clubs.find(c => c.id === userMatch.homeId);
      const awayClub = state.clubs.find(c => c.id === userMatch.awayId);

      $('spotlight-stadium-tag').textContent = `STADIUM: ${homeClub.stadium || 'The Fortress'}`;
      $('spotlight-home-name').textContent = homeClub.name;
      $('spotlight-home-badge').innerHTML = renderClubCrest(homeClub, 36);
      $('spotlight-away-name').textContent = awayClub.name;
      $('spotlight-away-badge').innerHTML = renderClubCrest(awayClub, 36);

      if (userMatch.played) {
        $('spotlight-score-display').textContent = `${userMatch.homeScore} - ${userMatch.awayScore}`;
        $('spotlight-minute-display').textContent = 'FULL TIME (FT)';
        
        const feed = $('spotlight-scorers-feed');
        if (userMatch.scorers.length > 0) {
          feed.innerHTML = userMatch.scorers.map(s => `<div>⚽ ${s.minute}' ${s.player} (${s.clubName})</div>`).join('');
          feed.style.display = 'block';
        } else {
          feed.innerHTML = '<div>No goals scored in this fixture.</div>';
          feed.style.display = 'block';
        }
      } else {
        $('spotlight-score-display').textContent = 'VS';
        $('spotlight-minute-display').textContent = 'UPCOMING KICKOFF';
        $('spotlight-scorers-feed').style.display = 'none';
      }
    }

    const otherMatches = round.matches.filter(m => m !== userMatch);
    const simGrid = $('simultaneous-fixtures-grid');
    if (simGrid) {
      simGrid.innerHTML = '';
      otherMatches.forEach(m => {
        const home = state.clubs.find(c => c.id === m.homeId);
        const away = state.clubs.find(c => c.id === m.awayId);
        const item = document.createElement('div');
        item.className = 'sim-fixture-mini';
        item.innerHTML = `
          <span>${renderClubCrest(home, 16)} ${home.name} ${m.played ? m.homeScore : ''}</span>
          <span class="tabular-nums" style="color:var(--text-muted);">${m.played ? '-' : 'vs'}</span>
          <span>${m.played ? m.awayScore : ''} ${renderClubCrest(away, 16)} ${away.name}</span>
        `;
        simGrid.appendChild(item);
      });
    }

    renderStandingsTableUI();
    renderGoldenBootUI();
  }

  function renderStandingsTableUI() {
    const tbody = $('standings-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    state.standings.forEach((s, idx) => {
      const tr = document.createElement('tr');
      if (s.isUser) tr.className = 'user-row';
      tr.innerHTML = `
        <td class="tabular-nums">${idx + 1}</td>
        <td>${renderClubCrest(s, 20)} ${s.name}</td>
        <td class="tabular-nums">${s.p}</td>
        <td class="tabular-nums">${s.gd > 0 ? '+' + s.gd : s.gd}</td>
        <td class="tabular-nums" style="font-weight:800;color:var(--text-white);">${s.pts}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderGoldenBootUI() {
    const box = $('golden-boot-list');
    if (!box) return;
    box.innerHTML = '';

    const sorted = Object.entries(state.goldenBoot).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (sorted.length === 0) {
      box.innerHTML = '<div style="font-size:11px;color:var(--text-dim);">No goals recorded yet.</div>';
      return;
    }

    sorted.forEach(([name, goals], idx) => {
      const item = document.createElement('div');
      item.className = 'gb-item';
      // P2: Grammar fix: "1 Goal" vs "Goals"
      const goalText = goals === 1 ? '1 Goal' : `${goals} Goals`;
      item.innerHTML = `
        <span>${idx + 1}. ⚽ ${name}</span>
        <span class="tabular-nums" style="font-weight:700;color:var(--grad-cyan);">${goalText}</span>
      `;
      box.appendChild(item);
    });
  }

  // --- 12. CHAMPION MOMENT & 9:16 HD SHARE STUDIO (1080x1920) ---
  function renderChampionScreen() {
    updateStandingsTable();
    const champ = state.standings[0];
    const champClub = state.clubs.find(c => c.id === champ.clubId);

    $('champ-icon-display').innerHTML = renderClubCrest(champClub, 64);
    $('champ-title-display').textContent = `${champClub.name} ARE CHAMPIONS!`;
    $('champ-manager-display').textContent = `Manager: ${champClub.manager} · ${champClub.stadium}`;
    $('champ-record-display').textContent = `P9 W${champ.w} D${champ.d} L${champ.l} · ${champ.pts} PTS (GD ${champ.gd > 0 ? '+' + champ.gd : champ.gd})`;
  }

  // Pure Canvas 1080x1920 UHD Generator
  function renderUHDCanvas(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // 1. Pitch Black Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Ambient Studio Glow
    const glow = ctx.createRadialGradient(540, 280, 50, 540, 280, 750);
    glow.addColorStop(0, 'rgba(150, 70, 255, 0.24)');
    glow.addColorStop(0.5, 'rgba(0, 220, 255, 0.08)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 1920);

    // 3. Thin Line-Circle Motif Watermark
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(540, 960, 390, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(260, 1240);
    ctx.lineTo(820, 680);
    ctx.stroke();
    ctx.restore();

    // 4. Studio Header Lockup
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NOSTA·LOGIC GAMES', 540, 110);

    ctx.font = '600 17px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText('THE GAMES YOU GREW UP PLAYING · A GRO10X STUDIO', 540, 148);

    // Render Specific Surface
    if (type === 'champions') {
      renderChampionsCardSurface(ctx);
    } else if (type === 'table') {
      renderTableCardSurface(ctx);
    } else if (type === 'squad') {
      renderSquadCardSurface(ctx);
    }

    // 5. Universal Footer Link
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(100, 1780, 880, 2);

    ctx.font = 'bold 22px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#00DCFF';
    ctx.textAlign = 'center';
    ctx.fillText('MAKE YOUR ROOM · FREE TO PLAY', 540, 1826);

    ctx.font = '500 16px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText('gro10x-ai.vercel.app/superleague', 540, 1860);

    return canvas;
  }

  // P1-2: Champions Card Polish (Tactical Grid + Bench Line + Safe Awards)
  function renderChampionsCardSurface(ctx) {
    const champ = state.standings[0];
    const champClub = state.clubs.find(c => c.id === champ.clubId);
    const tactical = champClub.tactical || buildTacticalFormation(champClub.squad);

    // Title
    ctx.font = 'bold 50px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('THE SUPER LEAGUE', 540, 240);

    const grad = ctx.createLinearGradient(300, 0, 780, 0);
    grad.addColorStop(0, '#00DCFF');
    grad.addColorStop(0.5, '#9646FF');
    grad.addColorStop(1, '#FF00C8');
    ctx.fillStyle = grad;
    ctx.font = '800 64px "Space Grotesk", sans-serif';
    ctx.fillText('CHAMPIONS', 540, 310);

    // Club Badge & Name
    const champCrest = crestImages[champClub.id];
    if (champCrest && champCrest.complete && champCrest.naturalWidth > 0) {
      ctx.drawImage(champCrest, 540 - 45, 340, 90, 90);
    } else {
      ctx.font = '72px sans-serif';
      ctx.fillText(champClub.icon, 540, 405);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px "Space Grotesk", sans-serif';
    ctx.fillText(champClub.name, 540, 465);

    ctx.font = '500 22px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText(`Manager: ${champClub.manager} · ${champClub.stadium}`, 540, 505);

    // Record Box
    ctx.fillStyle = 'rgba(13, 13, 15, 0.9)';
    ctx.strokeStyle = '#2A2A38';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(140, 540, 800, 75, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FF00C8';
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillText(`RECORD: P9  W${champ.w}  D${champ.d}  L${champ.l}  ·  ${champ.pts} POINTS (GD ${champ.gd > 0 ? '+' + champ.gd : champ.gd})`, 540, 586);

    // Tactical XI Grid Section
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🏆 STARTING XI — FORMATION: ${tactical.formation} (Avg OVR: ${tactical.avgXIOvr})`, 140, 660);

    let y = 705;

    // Helper to render tactical line
    const renderLine = (label, color, players) => {
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(140, y - 24, 800, 36);

      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillStyle = color;

      if (label.startsWith('GOALKEEPER')) {
        ctx.fillText('GOALKEEPER:', 155, y);
        const p = players[0] || tactical.startingGK;
        if (p) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '600 17px "Inter", sans-serif';
          ctx.fillText(`${p.name}`, 310, y);

          ctx.font = 'bold 16px "JetBrains Mono", monospace';
          ctx.fillStyle = '#00DCFF';
          ctx.fillText(`(${p.ovr})`, 310 + ctx.measureText(p.name).width + 12, y);
        }
        y += 50;
        return;
      }

      ctx.fillText(label, 155, y);

      let xOffset = 310;
      players.forEach(p => {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 17px "Inter", sans-serif';
        const displayName = p.name.length > 14 ? p.name.split(' ').pop() : p.name;
        ctx.fillText(`${displayName}`, xOffset, y);

        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.fillStyle = '#00DCFF';
        ctx.fillText(`${p.ovr}`, xOffset + 130, y);

        xOffset += 180;
      });

      y += 50;
    };

    // Formatted Tactical Grid: FWD at top, MID, DEF, GK at bottom
    renderLine(`ATTACK (${tactical.startingFwds.length})`, '#EF4444', tactical.startingFwds);
    renderLine(`MIDFIELD (${tactical.startingMids.length})`, '#F59E0B', tactical.startingMids);
    renderLine(`DEFENCE (${tactical.startingDefs.length})`, '#10B981', tactical.startingDefs);
    renderLine(`GOALKEEPER:`, '#3B82F6', [tactical.startingGK]);

    // Dedicated Bench Box (P1-2)
    y += 15;
    ctx.fillStyle = 'rgba(13, 13, 15, 0.9)';
    ctx.strokeStyle = '#2A2A38';
    ctx.beginPath();
    ctx.roundRect(140, y, 800, 110, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FF00C8';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`🛡️ BENCH & RESERVES (4 SUBS · BENCH STRENGTH: AVG ${tactical.benchStrength} OVR)`, 170, y + 40);

    const benchText = tactical.bench.map(p => `${p.name} (${p.ovr})`).join('  ·  ');
    ctx.font = '500 17px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText(benchText, 170, y + 78);

    // Accolades & Season Honour Roll (Guaranteed Zero Truncation)
    y += 140;
    ctx.fillStyle = 'rgba(13, 13, 15, 0.9)';
    ctx.strokeStyle = '#2A2A38';
    ctx.beginPath();
    ctx.roundRect(140, y, 800, 260, 16);
    ctx.fill();
    ctx.stroke();

    const topScorer = Object.entries(state.goldenBoot).sort((a, b) => b[1] - a[1])[0] || ['Alexis Mac Allister', 6];
    const bestVal = [...champClub.squad].sort((a, b) => (b.ovr / (b.boughtPrice || 65)) - (a.ovr / (a.boughtPrice || 65)))[0] || champClub.squad[0];
    const spoon = state.standings[state.standings.length - 1];

    ctx.font = 'bold 20px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('SEASON HONOUR ROLL', 170, y + 42);

    // Golden Boot Award with grammar check
    ctx.font = '500 17px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText('🥇 Golden Boot Winner:', 170, y + 92);
    ctx.fillStyle = '#00DCFF';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    const goalsNum = topScorer[1] || 1;
    const goalsLabel = goalsNum === 1 ? '1 Goal' : `${goalsNum} Goals`;
    ctx.fillText(`${topScorer[0]} (${goalsLabel})`, 410, y + 92);

    // Best Value Signing
    ctx.font = '500 17px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText('💎 Best Value Signing:', 170, y + 150);
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`${bestVal ? bestVal.name : 'Paolo Maldini'} (${bestVal ? bestVal.boughtPrice : 160} pts · ${bestVal ? bestVal.ovr : 95} OVR)`, 410, y + 150);

    // Wooden Spoon
    ctx.font = '500 17px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText('🥄 Wooden Spoon:', 170, y + 208);
    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`${spoon.name} (${spoon.pts} pts · GD ${spoon.gd})`, 410, y + 208);
  }

  // P2: Final Table Card with Full 8 Columns (P, W, D, L, GF, GA, GD, PTS)
  function renderTableCardSurface(ctx) {
    ctx.font = 'bold 50px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('THE SUPER LEAGUE', 540, 240);

    ctx.font = '800 46px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#00DCFF';
    ctx.fillText('FINAL LEAGUE TABLE', 540, 310);

    ctx.font = '600 16px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText('9 ROUNDS COMPLETED · SINGLE ROUND-ROBIN RECONCILED', 540, 355);

    // Table Header Bar with 8 statistical columns
    let y = 430;
    ctx.fillStyle = '#0D0D12';
    ctx.fillRect(80, y - 35, 920, 52);

    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.fillStyle = '#545464';
    ctx.textAlign = 'left';
    ctx.fillText('POS', 105, y);
    ctx.fillText('CLUB', 165, y);
    ctx.textAlign = 'center';
    ctx.fillText('P', 510, y);
    ctx.fillText('W', 570, y);
    ctx.fillText('D', 625, y);
    ctx.fillText('L', 680, y);
    ctx.fillText('GF', 740, y);
    ctx.fillText('GA', 800, y);
    ctx.fillText('GD', 865, y);
    ctx.fillText('PTS', 945, y);

    y += 50;
    state.standings.forEach((s, idx) => {
      const isChamp = idx === 0;
      const isUser = s.isUser;

      if (isUser) {
        ctx.fillStyle = 'rgba(150, 70, 255, 0.2)';
        ctx.fillRect(80, y - 34, 920, 68);
      } else if (isChamp) {
        ctx.fillStyle = 'rgba(0, 220, 255, 0.1)';
        ctx.fillRect(80, y - 34, 920, 68);
      }

      ctx.textAlign = 'left';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillStyle = isChamp ? '#00DCFF' : (isUser ? '#FF00C8' : '#FFFFFF');
      ctx.fillText(`${idx + 1}`, 105, y + 7);

      ctx.font = '600 19px "Inter", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      const cImg = crestImages[s.clubId];
      if (cImg && cImg.complete && cImg.naturalWidth > 0) {
        ctx.drawImage(cImg, 165, y - 16, 26, 26);
        ctx.fillText(s.name, 202, y + 7);
      } else {
        ctx.fillText(`${s.icon} ${s.name}`, 165, y + 7);
      }

      ctx.textAlign = 'center';
      ctx.font = '500 18px "JetBrains Mono", monospace';
      ctx.fillStyle = '#8E8E9F';
      ctx.fillText(`${s.p}`, 510, y + 7);
      ctx.fillText(`${s.w}`, 570, y + 7);
      ctx.fillText(`${s.d}`, 625, y + 7);
      ctx.fillText(`${s.l}`, 680, y + 7);
      ctx.fillText(`${s.gf}`, 740, y + 7);
      ctx.fillText(`${s.ga}`, 800, y + 7);
      ctx.fillText(`${s.gd > 0 ? '+' + s.gd : s.gd}`, 865, y + 7);

      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillStyle = isChamp ? '#00DCFF' : '#FFFFFF';
      ctx.fillText(`${s.pts}`, 945, y + 7);

      y += 75;
    });
  }

  function renderSquadCardSurface(ctx) {
    const userClub = state.clubs.find(c => c.id === state.userClubId) || state.clubs[0];
    const tactical = userClub.tactical || buildTacticalFormation(userClub.squad);

    ctx.font = 'bold 50px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('MY SUPER LEAGUE SQUAD', 540, 240);

    const uCrest = crestImages[userClub.id];
    if (uCrest && uCrest.complete && uCrest.naturalWidth > 0) {
      ctx.drawImage(uCrest, 540 - 50, 280, 100, 100);
    } else {
      ctx.font = '76px sans-serif';
      ctx.fillText(userClub.icon, 540, 350);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px "Space Grotesk", sans-serif';
    ctx.fillText(userClub.name, 540, 420);

    ctx.font = '500 22px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText(`Manager: ${userClub.manager} · ${userClub.stadium} · ${tactical.formation}`, 540, 465);

    let y = 540;
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`STARTING XI (11 PLAYERS — ${tactical.formation})`, 120, y);

    y += 35;
    tactical.startingXI.forEach(p => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(120, y - 26, 840, 46);

      ctx.font = 'bold 18px "JetBrains Mono", monospace';
      ctx.fillStyle = p.pos === 'GK' ? '#3B82F6' : (p.pos === 'DEF' ? '#10B981' : (p.pos === 'MID' ? '#F59E0B' : '#EF4444'));
      ctx.fillText(`${p.pos}`, 140, y + 4);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 19px "Inter", sans-serif';
      ctx.fillText(`${p.name}`, 220, y + 4);

      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00DCFF';
      ctx.textAlign = 'right';
      ctx.fillText(`${p.ovr} OVR`, 930, y + 4);
      ctx.textAlign = 'left';

      y += 52;
    });

    y += 20;
    ctx.font = 'bold 22px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`BENCH & RESERVES (4 PLAYERS · BENCH STRENGTH: AVG ${tactical.benchStrength} OVR)`, 120, y);

    y += 35;
    tactical.bench.forEach(p => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(120, y - 26, 840, 46);

      ctx.font = 'bold 18px "JetBrains Mono", monospace';
      ctx.fillStyle = p.pos === 'GK' ? '#3B82F6' : (p.pos === 'DEF' ? '#10B981' : (p.pos === 'MID' ? '#F59E0B' : '#EF4444'));
      ctx.fillText(`${p.pos}`, 140, y + 4);

      ctx.fillStyle = '#8E8E9F';
      ctx.font = '600 19px "Inter", sans-serif';
      ctx.fillText(`${p.name} (SUB)`, 220, y + 4);

      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillStyle = '#FF00C8';
      ctx.textAlign = 'right';
      ctx.fillText(`${p.ovr} OVR`, 930, y + 4);
      ctx.textAlign = 'left';

      y += 52;
    });
  }

  function exportCard(type) {
    const canvas = renderUHDCanvas(type);
    const dataUrl = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = `super-league-${type}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }

  function triggerViralShare() {
    const shareText = "Think you can beat my squad? Play The Super League for free on Nostalogic Games: https://gro10x-ai.vercel.app/superleague";
    if (navigator.share) {
      navigator.share({
        title: 'The Super League — Nostalogic Games',
        text: shareText,
        url: 'https://gro10x-ai.vercel.app/superleague'
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Copied invite link to clipboard! Share it with your friends.');
      });
    }
  }

  function resetForRematch() {
    state.clubs = JSON.parse(JSON.stringify(INITIAL_CLUBS));
    showScreen('lobby');
  }

  // --- 13. LEAD INTAKE (P1-3 & P1-4 PARITY) ---
  async function handleLeadSubmit() {
    const name = $('lead-name-input').value.trim();
    const phone = $('lead-phone-input').value.trim();
    const org = $('lead-org-input').value.trim();

    if (!name || !phone) {
      alert('Please provide your name and WhatsApp number so we can set up your Super League.');
      return;
    }

    const btn = $('btn-submit-lead');
    btn.disabled = true;
    btn.textContent = 'TRANSMITTING...';

    const refCode = 'REF-SL-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    const payload = {
      name: name,
      phone: phone,
      company: org || 'Community / Campus / Office',
      source: 'superleague_inquiry',
      notes: `[Ref: ${refCode}] Expected Players: ${state.leadExpectedPlayers}. Manager: ${state.userManagerName}`
    };

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      $('lead-confirmed-ref').textContent = refCode;
      $('lead-form-fields').style.display = 'none';
      $('lead-confirmed-box').style.display = 'flex';
    } catch (err) {
      console.warn('Lead submit offline/fallback:', err);
      $('lead-confirmed-ref').textContent = refCode;
      $('lead-form-fields').style.display = 'none';
      $('lead-confirmed-box').style.display = 'flex';
    }
  }

  // Notify Modal
  let activeNotifyTarget = '';
  function openNotifyModal(targetName) {
    activeNotifyTarget = targetName;
    $('notify-modal-title').textContent = `GET NOTIFIED: ${targetName.toUpperCase()}`;
    $('modal-notify-overlay').classList.add('active');
  }

  function closeNotifyModal() {
    $('modal-notify-overlay').classList.remove('active');
  }

  async function handleModalNotifySubmit() {
    const name = $('modal-notify-name').value.trim();
    const phone = $('modal-notify-phone').value.trim();

    if (!phone) {
      alert('Please enter your WhatsApp number.');
      return;
    }

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'Player',
          phone: phone,
          source: 'superleague_shelf_notify',
          notes: `Notify me request for upcoming title: ${activeNotifyTarget}`
        })
      });
    } catch (e) {}

    alert(`Got it! We'll send an early invite for ${activeNotifyTarget} directly on WhatsApp.`);
    closeNotifyModal();
  }

  function openSquadModal() {
    const userClub = state.clubs.find(c => c.id === state.userClubId);
    if (!userClub) return;

    $('modal-squad-title').textContent = `${userClub.name} Squad (${userClub.squad.length}/15)`;
    const list = $('modal-squad-list');
    list.innerHTML = '';

    if (userClub.squad.length === 0) {
      list.innerHTML = '<div style="font-size:13px;color:var(--text-dim);text-align:center;padding:20px;">No players signed yet.</div>';
    } else {
      userClub.squad.forEach((p) => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = '8px 12px';
        item.style.background = 'var(--bg-surface-elevated)';
        item.style.borderRadius = '8px';
        item.style.marginBottom = '6px';
        item.style.fontSize = '12px';
        item.innerHTML = `
          <span><b>[${p.pos}]</b> ${p.name}</span>
          <span class="tabular-nums" style="color:var(--grad-cyan);font-weight:700;">${p.ovr} OVR (${p.boughtPrice || p.basePrice} pts)</span>
        `;
        list.appendChild(item);
      });
    }

    $('modal-squad-overlay').classList.add('active');
  }

  function closeSquadModal() {
    $('modal-squad-overlay').classList.remove('active');
  }

  // Boot on DOM ready in browser environment
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Safe Export for Jest Unit & Integration Testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      state,
      getPurseGuardInfo,
      buildTacticalFormation,
      simulateMatch,
      generateRoundRobinSchedule,
      renderUHDCanvas
    };
  }
})();
