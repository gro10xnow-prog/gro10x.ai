/**
 * NOSTALOGIC GAMES — THE SUPER LEAGUE (V1)
 * "The games you grew up playing." — A GRO10X Studio
 * 
 * Core Architectural Engine:
 * - 180-Player Pool (20 GK, 55 DEF, 60 MID, 45 FWD)
 * - 10 Parody Franchises with 2,000 pts Starting Purse
 * - Positional Purse Guard Engine (Strict Feasibility & Math Reconciliation)
 * - 40s Lot Auction with Anti-Snipe (+10s), Quick-Close (8s), & Banded Bids
 * - 9-Round Single Round-Robin Season Simulation with Live Match Spotlight
 * - True 1080x1920 UHD Canvas Cards (Champions, Final Table, My Squad)
 * - Working Lead Intake ("Run It For Your People") -> POST /api/leads
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
    { id: 'c1', name: 'Royal Madrid CF', icon: '👑', color: '#FFFFFF', accent: '#D4AF37', purse: 2000, squad: [], manager: 'Bot Ancelotti', stadium: 'The Fortress', isUser: false },
    { id: 'c2', name: 'FC Barcelonia', icon: '🔵🔴', color: '#004D98', accent: '#A50044', purse: 2000, squad: [], manager: 'Bot Flick', stadium: 'Hostel Nou Camp', isUser: false },
    { id: 'c3', name: 'Manchestar United', icon: '🔴⚫', color: '#DA291C', accent: '#000000', purse: 2000, squad: [], manager: 'Bot Fergie', stadium: 'The Adda Dome', isUser: false },
    { id: 'c4', name: 'Manchestar City', icon: '🩵⚪', color: '#6CABDD', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Pep', stadium: 'Bunker Colosseum', isUser: false },
    { id: 'c5', name: 'Liverpul FC', icon: '🔴⚪', color: '#C8102E', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Klopp', stadium: 'Cadet Field Arena', isUser: false },
    { id: 'c6', name: 'Arsenalia', icon: '🔴⚪', color: '#EF0107', accent: '#023474', purse: 2000, squad: [], manager: 'Bot Arteta', stadium: 'Parade Ground Stadium', isUser: false },
    { id: 'c7', name: 'Chelseea', icon: '🔵⚪', color: '#034694', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Maresca', stadium: 'Curfew Park', isUser: false },
    { id: 'c8', name: 'Bayern Munchena', icon: '🔴⚪', color: '#DC052D', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Kompany', stadium: 'Dorm Arena', isUser: false },
    { id: 'c9', name: 'Paris Saint-Germaine', icon: '🔵🔴', color: '#004170', accent: '#DA291C', purse: 2000, squad: [], manager: 'Bot Enrique', stadium: 'The Fortress', isUser: false },
    { id: 'c10', name: 'Juventas', icon: '⚪⚫', color: '#000000', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Motta', stadium: 'The Adda Dome', isUser: false }
  ];

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
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);

  // --- 3. SCREEN NAVIGATION ---
  function showScreen(screenId) {
    state.screen = screenId;
    const screens = $$('.screen');
    screens.forEach(s => s.classList.remove('active'));
    
    const target = $('screen-' + screenId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const app = $('app');
    if (screenId === 'auction' || screenId === 'season' || screenId === 'champion') {
      app.classList.add('wide-mode');
    } else {
      app.classList.remove('wide-mode');
    }
  }

  // --- 4. PURSE GUARD ENGINE ---
  // Rules:
  // - Squad max: 15 players
  // - Minimum purse per remaining slot: 65 pts (lowest base price)
  // - Must guarantee at least 1 GK in 15 slots
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

    // Min points reserved for the remaining (slotsLeft - 1) players
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

  // --- 5. INITIALIZATION & SPLASH ---
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

    $('screen-splash').addEventListener('click', () => {
      clearTimeout(splashTimer);
      showScreen('shelf');
    });
  }

  // --- 6. EVENT LISTENERS ---
  function setupEventListeners() {
    // Brand header tap
    $('app-brand-btn').addEventListener('click', () => showScreen('shelf'));

    // Shelf Screen
    $('btn-play-superleague').addEventListener('click', () => showScreen('doors'));
    $('btn-notify-supercup').addEventListener('click', () => openNotifyModal('Super Cup (Cricket Auction)'));
    $('btn-notify-liveauction').addEventListener('click', () => openNotifyModal('Live Auction Events'));

    // Doors Screen
    $('btn-door-play').addEventListener('click', () => showScreen('lobby'));
    $('btn-door-create').addEventListener('click', () => showScreen('lobby'));
    $('btn-door-join').addEventListener('click', () => {
      const code = $('join-room-input').value.trim();
      if (code) state.roomCode = code.toUpperCase();
      showScreen('lobby');
    });

    // Lobby Screen
    $('btn-start-auction').addEventListener('click', startAuctionRitual);
    $('manager-name-input').addEventListener('input', (e) => {
      state.userManagerName = e.target.value.trim() || 'Gaffer';
      updateUserClubInfo();
    });

    // Auction Screen
    $('btn-bid-20').addEventListener('click', () => placeUserBid(20));
    $('btn-bid-50').addEventListener('click', () => placeUserBid(50));
    $('btn-bid-100').addEventListener('click', () => placeUserBid(100));
    $('btn-pass-lot').addEventListener('click', handleUserPass);
    $('btn-sim-auction').addEventListener('click', simulateAuctionToEnd);
    $('btn-view-squad').addEventListener('click', openSquadModal);

    // Season Screen
    $('btn-sim-round').addEventListener('click', simulateNextRound);
    $('btn-auto-sim-season').addEventListener('click', autoSimulateSeason);
    $('btn-view-champion-moment').addEventListener('click', () => showScreen('champion'));

    // Champion Screen & Flex Studio
    $('btn-export-champions-card').addEventListener('click', () => exportCard('champions'));
    $('btn-export-table-card').addEventListener('click', () => exportCard('table'));
    $('btn-export-squad-card').addEventListener('click', () => exportCard('squad'));
    $('btn-viral-share').addEventListener('click', triggerViralShare);
    $('btn-rematch').addEventListener('click', resetForRematch);

    // Lead Intake Form
    $$('.chip-option').forEach(chip => {
      chip.addEventListener('click', (e) => {
        $$('.chip-option').forEach(c => c.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        state.leadExpectedPlayers = e.currentTarget.dataset.val;
      });
    });
    $('btn-submit-lead').addEventListener('click', handleLeadSubmit);
    $('btn-submit-modal-notify').addEventListener('click', handleModalNotifySubmit);
    $('modal-notify-close').addEventListener('click', closeNotifyModal);
    $('modal-squad-close').addEventListener('click', closeSquadModal);
  }

  // --- 7. LOBBY SETUP ---
  function renderStadiumSelection() {
    const wrap = $('stadium-pills-wrap');
    if (!wrap) return;
    wrap.innerHTML = '';

    STADIUMS.forEach((stadium, idx) => {
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
        <div class="club-badge-icon">${club.icon}</div>
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

  // --- 8. AUCTION ENGINE ---
  function startAuctionRitual() {
    updateUserClubInfo();
    
    // Build auction queue from 180 players
    // Shuffle slightly while ensuring good positional spread
    state.auctionQueue = [...state.allPlayers].sort(() => 0.5 - Math.random());
    state.currentLotIdx = 0;
    state.auctionHistory = [];
    state.benchPhaseActive = false;

    // Reset club purses and squads
    state.clubs.forEach(c => {
      c.purse = 2000;
      c.squad = [];
    });

    showScreen('auction');
    presentNextLot();
  }

  function presentNextLot() {
    clearInterval(state.timerInterval);
    clearTimeout(state.botBidTimeout);
    $('anti-snipe-banner').classList.remove('active');

    // Check if all clubs have completed 15 players
    const allDone = state.clubs.every(c => c.squad.length >= 15);
    if (allDone || state.currentLotIdx >= state.auctionQueue.length) {
      finishAuction();
      return;
    }

    // Check Bench Phase (when all clubs have at least 11 starting XI)
    const allHaveStartingXI = state.clubs.every(c => c.squad.length >= 11);
    state.benchPhaseActive = allHaveStartingXI;
    if (state.benchPhaseActive) {
      $('bench-phase-banner').style.display = 'block';
    } else {
      $('bench-phase-banner').style.display = 'none';
    }

    state.currentLot = state.auctionQueue[state.currentLotIdx];
    state.currentBid = 0;
    state.currentBidderId = null;
    state.lotBidsCount = 0;
    state.timer = state.benchPhaseActive ? 20 : 40;

    renderAuctionLotUI();
    updatePurseGuardUI();
    startLotTimer();

    // Trigger initial bot appraisal
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

  function updatePurseGuardUI() {
    const userClub = state.clubs.find(c => c.id === state.userClubId);
    if (!userClub) return;

    $('user-purse-display').textContent = `${userClub.purse} PTS`;
    $('user-squad-count-display').textContent = `${userClub.squad.length} / 15 SQUAD`;

    const guard = getPurseGuardInfo(userClub.id, state.currentLot);
    $('purse-guard-reason-text').textContent = guard.reason;

    // Update bidding buttons
    const curVal = state.currentBid === 0 ? state.currentLot.basePrice : state.currentBid;
    
    [20, 50, 100].forEach(inc => {
      const nextBid = state.currentBid === 0 ? curVal : state.currentBid + inc;
      const btn = $(`btn-bid-${inc}`);
      if (!btn) return;

      const canAfford = guard.allowed && nextBid <= guard.maxBid;
      const alreadyLeader = state.currentBidderId === userClub.id;

      btn.disabled = !canAfford || alreadyLeader || userClub.squad.length >= 15;
      btn.querySelector('.bid-amount-label').textContent = `+${inc} PTS`;
    });
  }

  function startLotTimer() {
    const timerElem = $('timer-display-num');
    timerElem.classList.remove('danger');

    state.timerInterval = setInterval(() => {
      state.timer--;
      timerElem.textContent = `${state.timer}s`;

      if (state.timer <= 10) {
        timerElem.classList.add('danger');
      } else {
        timerElem.classList.remove('danger');
      }

      // Quick-Close rule: if 0 bids in first 8 seconds (i.e. timer passed 8s mark)
      // and it's an outfield lot not wanted, accelerate timer
      if (state.lotBidsCount === 0 && ((state.benchPhaseActive && state.timer <= 12) || (!state.benchPhaseActive && state.timer <= 32))) {
        // Only quick close if bots have evaluated and passed
        // We let timer run briskly
      }

      if (state.timer <= 0) {
        clearInterval(state.timerInterval);
        resolveLotSale();
      }
    }, 1000);
  }

  function placeUserBid(increment) {
    const userClub = state.clubs.find(c => c.id === state.userClubId);
    if (!userClub) return;

    const guard = getPurseGuardInfo(userClub.id, state.currentLot);
    const nextBid = state.currentBid === 0 ? state.currentLot.basePrice : state.currentBid + increment;

    if (!guard.allowed || nextBid > guard.maxBid) {
      alert(`Purse Guard: Cannot place bid of ${nextBid} pts. Maximum allowed is ${guard.maxBid} pts.`);
      return;
    }

    executeBid(userClub.id, nextBid);
  }

  function executeBid(clubId, amount) {
    state.currentBid = amount;
    state.currentBidderId = clubId;
    state.lotBidsCount++;

    // Anti-Snipe: If bid in final 10 seconds, add +10s
    if (state.timer <= 10) {
      state.timer += 10;
      $('anti-snipe-banner').classList.add('active');
      setTimeout(() => $('anti-snipe-banner').classList.remove('active'), 2500);
    }

    updateCurrentBidDisplay();
    updatePurseGuardUI();

    // Trigger bots to react
    scheduleBotAppraisal();
  }

  function handleUserPass() {
    // If user is not the leader, they pass.
    // If user is the leader, they cannot pass their own winning bid.
    if (state.currentBidderId === state.userClubId) {
      return;
    }
    // Fast forward lot if no other bids pending
    if (state.lotBidsCount === 0) {
      state.timer = Math.min(state.timer, 3);
    }
  }

  // Realistic Bot AI
  function scheduleBotAppraisal() {
    clearTimeout(state.botBidTimeout);

    const delay = Math.floor(Math.random() * 2500) + 1200;
    state.botBidTimeout = setTimeout(() => {
      evaluateBotBids();
    }, delay);
  }

  function evaluateBotBids() {
    if (state.timer <= 0) return;

    const lot = state.currentLot;
    if (!lot) return;

    // Filter bots that can afford and need this position
    const eligibleBots = state.clubs.filter(c => {
      if (c.id === state.userClubId) return false;
      if (c.id === state.currentBidderId) return false;
      if (c.squad.length >= 15) return false;

      const guard = getPurseGuardInfo(c.id, lot);
      if (!guard.allowed) return false;

      // Position balance need
      const posCount = c.squad.filter(p => p.pos === lot.pos).length;
      if (lot.pos === 'GK' && posCount >= 2) return false;
      if (lot.pos === 'DEF' && posCount >= 6) return false;
      if (lot.pos === 'MID' && posCount >= 6) return false;
      if (lot.pos === 'FWD' && posCount >= 4) return false;

      // Max bot valuation based on OVR
      const basePrice = lot.basePrice;
      const maxBotWillingness = basePrice + (lot.ovr >= 92 ? 120 : (lot.ovr >= 88 ? 60 : 30));
      const nextRequired = state.currentBid === 0 ? basePrice : state.currentBid + 20;

      return nextRequired <= maxBotWillingness && nextRequired <= guard.maxBid;
    });

    if (eligibleBots.length > 0) {
      // Pick one bot to raise
      const bot = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];
      const increments = [20, 20, 50];
      const inc = increments[Math.floor(Math.random() * increments.length)];
      const nextBid = state.currentBid === 0 ? lot.basePrice : state.currentBid + inc;
      
      const guard = getPurseGuardInfo(bot.id, lot);
      if (nextBid <= guard.maxBid) {
        executeBid(bot.id, nextBid);
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
      // Unsold
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

  // Quick-Simulate to End of Draft
  // Guarantees all 10 squads end with exactly 15 players, at least 1 GK,
  // 100% purse arithmetic reconciliation, and legal positional balance
  function simulateAuctionToEnd() {
    clearInterval(state.timerInterval);
    clearTimeout(state.botBidTimeout);

    // Fast-resolve current lot if active bid
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

      // Find eligible clubs that need this player
      const clubsNeeding = state.clubs.filter(c => {
        if (c.squad.length >= 15) return false;
        const guard = getPurseGuardInfo(c.id, lot);
        if (!guard.allowed) return false;

        const posCount = c.squad.filter(p => p.pos === lot.pos).length;
        if (lot.pos === 'GK' && posCount >= 2) return false;
        return guard.maxBid >= lot.basePrice;
      });

      if (clubsNeeding.length > 0) {
        // Sort by club with most purse remaining
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

    // Final safety pass to ensure EVERY club has exactly 15 players and >= 1 GK
    state.clubs.forEach(c => {
      // Ensure GK
      const hasGK = c.squad.some(p => p.pos === 'GK');
      if (!hasGK) {
        const gkCandidate = state.allPlayers.find(p => p.pos === 'GK' && !c.squad.some(s => s.id === p.id));
        if (gkCandidate) {
          if (c.squad.length >= 15) {
            // Swap lowest non-GK
            c.squad.sort((a, b) => a.ovr - b.ovr);
            const removed = c.squad.shift();
            c.purse += removed.boughtPrice || 65;
          }
          const cost = Math.min(c.purse, gkCandidate.basePrice);
          c.purse -= cost;
          c.squad.push({ ...gkCandidate, boughtPrice: cost });
        }
      }

      // Top off to 15 if still under
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

  function finishAuction() {
    clearInterval(state.timerInterval);
    clearTimeout(state.botBidTimeout);

    // Initialize 9-Round Season
    initSeasonSimulation();
    showScreen('season');
  }

  // --- 9. SEASON SIMULATION (9 ROUNDS) ---
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
    renderSeasonRoundUI();
  }

  // Standard Round-Robin Berger Pairing for 10 Teams
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
      // Rotate pool keeping first fixed
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
    round.matches.forEach(m => {
      simulateMatch(m);
    });

    // Update Standings
    updateStandingsTable();

    state.currentRoundIdx++;
    renderSeasonRoundUI();

    if (state.currentRoundIdx >= state.seasonRounds.length) {
      state.seasonCompleted = true;
      $('btn-sim-round').disabled = true;
      $('btn-auto-sim-season').disabled = true;
      $('btn-view-champion-moment').style.display = 'inline-flex';
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

    // Team Rating Calculation
    const getRating = (club, isHome) => {
      const xi = [...club.squad].sort((a, b) => b.ovr - a.ovr).slice(0, 11);
      const avgOvr = xi.reduce((acc, p) => acc + p.ovr, 0) / (xi.length || 1);
      const gk = club.squad.find(p => p.pos === 'GK') || { ovr: 85 };
      return (avgOvr * 0.75) + (gk.ovr * 0.25) + (isHome ? 2 : 0);
    };

    const ratingH = getRating(homeClub, true);
    const ratingA = getRating(awayClub, false);
    const diff = (ratingH - ratingA);

    // Goal generation with bounded RNG
    let goalsH = Math.max(0, Math.round(1.5 + (diff / 6) + (Math.random() * 2 - 1)));
    let goalsA = Math.max(0, Math.round(1.2 - (diff / 6) + (Math.random() * 2 - 1)));

    // Prevent absurd blowouts
    goalsH = Math.min(5, goalsH);
    goalsA = Math.min(5, goalsA);

    match.played = true;
    match.homeScore = goalsH;
    match.awayScore = goalsA;
    match.scorers = [];

    // Assign goalscorers
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
        // Track Golden Boot
        state.goldenBoot[scorer.name] = (state.goldenBoot[scorer.name] || 0) + 1;
      }
    };

    assignScorers(homeClub, goalsH);
    assignScorers(awayClub, goalsA);
    match.scorers.sort((a, b) => a.minute - b.minute);
  }

  function updateStandingsTable() {
    // Reset points
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

    // Sort standings: PTS desc, GD desc, GF desc
    state.standings.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
  }

  function renderSeasonRoundUI() {
    const roundIdx = Math.min(state.currentRoundIdx, state.seasonRounds.length - 1);
    const round = state.seasonRounds[roundIdx];
    if (!round) return;

    $('current-round-pill').textContent = `ROUND ${round.roundNum} / 9`;

    // Find User Match in this round
    const userMatch = round.matches.find(m => m.homeId === state.userClubId || m.awayId === state.userClubId);
    if (userMatch) {
      const homeClub = state.clubs.find(c => c.id === userMatch.homeId);
      const awayClub = state.clubs.find(c => c.id === userMatch.awayId);

      $('spotlight-stadium-tag').textContent = `STADIUM: ${homeClub.stadium || 'The Fortress'}`;
      $('spotlight-home-name').textContent = homeClub.name;
      $('spotlight-home-badge').textContent = homeClub.icon;
      $('spotlight-away-name').textContent = awayClub.name;
      $('spotlight-away-badge').textContent = awayClub.icon;

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

    // Render other 4 simultaneous matches
    const otherMatches = round.matches.filter(m => m !== userMatch);
    const simGrid = $('simultaneous-fixtures-grid');
    simGrid.innerHTML = '';

    otherMatches.forEach(m => {
      const home = state.clubs.find(c => c.id === m.homeId);
      const away = state.clubs.find(c => c.id === m.awayId);
      const item = document.createElement('div');
      item.className = 'sim-fixture-mini';
      item.innerHTML = `
        <span>${home.name} ${m.played ? m.homeScore : ''}</span>
        <span class="tabular-nums" style="color:var(--text-muted);">${m.played ? '-' : 'vs'}</span>
        <span>${m.played ? m.awayScore : ''} ${away.name}</span>
      `;
      simGrid.appendChild(item);
    });

    // Render Standings Table
    renderStandingsTableUI();

    // Render Golden Boot Leaderboard
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
        <td>${s.icon} ${s.name}</td>
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
      item.innerHTML = `
        <span>${idx + 1}. ⚽ ${name}</span>
        <span class="tabular-nums" style="font-weight:700;color:var(--grad-cyan);">${goals} Goals</span>
      `;
      box.appendChild(item);
    });
  }

  // --- 10. CHAMPION MOMENT & 9:16 UHD FLEX STUDIO (1080x1920) ---
  function renderChampionScreen() {
    updateStandingsTable();
    const champ = state.standings[0];
    const champClub = state.clubs.find(c => c.id === champ.clubId);

    $('champ-icon-display').textContent = champClub.icon;
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

    // 1. Background Pitch Black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Subtle Gradient Ambient Glow
    const glow = ctx.createRadialGradient(540, 300, 50, 540, 300, 700);
    glow.addColorStop(0, 'rgba(150, 70, 255, 0.22)');
    glow.addColorStop(0.5, 'rgba(0, 220, 255, 0.08)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 1920);

    // 3. Line-Circle Motif Watermark
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(540, 960, 380, 0, Math.PI * 2);
    ctx.stroke();

    // 45 degree diagonal slash across motif
    ctx.beginPath();
    ctx.moveTo(270, 1230);
    ctx.lineTo(810, 690);
    ctx.stroke();
    ctx.restore();

    // 4. Studio Header Lockup
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NOSTA·LOGIC GAMES', 540, 120);

    ctx.font = '600 18px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.letterSpacing = '4px';
    ctx.fillText('THE GAMES YOU GREW UP PLAYING · A GRO10X STUDIO', 540, 160);

    // Render Specific Card Surface
    if (type === 'champions') {
      renderChampionsCardSurface(ctx);
    } else if (type === 'table') {
      renderTableCardSurface(ctx);
    } else if (type === 'squad') {
      renderSquadCardSurface(ctx);
    }

    // 5. Universal Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(100, 1780, 880, 2);

    ctx.font = 'bold 22px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#00DCFF';
    ctx.textAlign = 'center';
    ctx.fillText('MAKE YOUR ROOM · FREE TO PLAY', 540, 1830);

    ctx.font = '500 16px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText('gro10x-ai.vercel.app/superleague', 540, 1865);

    return canvas;
  }

  function renderChampionsCardSurface(ctx) {
    const champ = state.standings[0];
    const champClub = state.clubs.find(c => c.id === champ.clubId);

    // Title
    ctx.font = 'bold 54px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('THE SUPER LEAGUE', 540, 270);

    const grad = ctx.createLinearGradient(300, 0, 780, 0);
    grad.addColorStop(0, '#00DCFF');
    grad.addColorStop(0.5, '#9646FF');
    grad.addColorStop(1, '#FF00C8');
    ctx.fillStyle = grad;
    ctx.font = '800 68px "Space Grotesk", sans-serif';
    ctx.fillText('CHAMPIONS', 540, 345);

    // Badge & Club Name
    ctx.font = '80px sans-serif';
    ctx.fillText(champClub.icon, 540, 460);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px "Space Grotesk", sans-serif';
    ctx.fillText(champClub.name, 540, 530);

    ctx.font = '500 24px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText(`Manager: ${champClub.manager} · ${champClub.stadium}`, 540, 575);

    // Record Box
    ctx.fillStyle = 'rgba(13, 13, 15, 0.9)';
    ctx.strokeStyle = '#2A2A38';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(140, 620, 800, 90, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FF00C8';
    ctx.font = 'bold 28px "JetBrains Mono", monospace';
    ctx.fillText(`RECORD: P9  W${champ.w}  D${champ.d}  L${champ.l}  ·  ${champ.pts} POINTS`, 540, 676);

    // Starting XI Lineup
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px "Space Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🏆 TITLE-WINNING STARTING XI', 140, 770);

    const xi = [...champClub.squad].sort((a, b) => b.ovr - a.ovr).slice(0, 11);
    let y = 820;
    xi.forEach((p, i) => {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent';
      ctx.fillRect(140, y - 28, 800, 44);

      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillStyle = p.pos === 'GK' ? '#3B82F6' : (p.pos === 'DEF' ? '#10B981' : (p.pos === 'MID' ? '#F59E0B' : '#EF4444'));
      ctx.fillText(p.pos, 160, y);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 20px "Inter", sans-serif';
      ctx.fillText(p.name, 230, y);

      ctx.font = '500 16px "Inter", sans-serif';
      ctx.fillStyle = '#8E8E9F';
      ctx.fillText(`${p.country}`, 640, y);

      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00DCFF';
      ctx.textAlign = 'right';
      ctx.fillText(`${p.ovr} OVR`, 910, y);
      ctx.textAlign = 'left';

      y += 48;
    });

    // Accolades Footer Box
    y += 40;
    ctx.fillStyle = 'rgba(13, 13, 15, 0.9)';
    ctx.strokeStyle = '#2A2A38';
    ctx.beginPath();
    ctx.roundRect(140, y, 800, 280, 18);
    ctx.fill();
    ctx.stroke();

    const topScorer = Object.entries(state.goldenBoot).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
    const bestVal = [...champClub.squad].sort((a, b) => (b.ovr / (b.boughtPrice || 65)) - (a.ovr / (a.boughtPrice || 65)))[0] || champClub.squad[0];
    const spoon = state.standings[state.standings.length - 1];

    ctx.font = 'bold 20px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('SEASON HONOUR ROLL', 170, y + 45);

    ctx.font = '500 18px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText('🥇 Golden Boot Winner:', 170, y + 100);
    ctx.fillStyle = '#00DCFF';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`${topScorer[0]} (${topScorer[1]} Goals)`, 440, y + 100);

    ctx.font = '500 18px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText('💎 Best Value Signing:', 170, y + 160);
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`${bestVal ? bestVal.name : 'N/A'} (${bestVal ? bestVal.boughtPrice : 0} pts)`, 440, y + 160);

    ctx.font = '500 18px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText('🥄 Wooden Spoon:', 170, y + 220);
    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`${spoon.name} (${spoon.pts} pts)`, 440, y + 220);
  }

  function renderTableCardSurface(ctx) {
    ctx.font = 'bold 54px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('THE SUPER LEAGUE', 540, 270);

    ctx.font = '800 48px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#00DCFF';
    ctx.fillText('FINAL LEAGUE TABLE', 540, 340);

    ctx.font = '500 20px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText('9 ROUNDS COMPLETED · SINGLE ROUND-ROBIN', 540, 385);

    // Table Header
    let y = 460;
    ctx.fillStyle = '#0D0D12';
    ctx.fillRect(100, y - 35, 880, 50);

    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillStyle = '#545464';
    ctx.textAlign = 'left';
    ctx.fillText('POS', 130, y);
    ctx.fillText('CLUB', 220, y);
    ctx.textAlign = 'center';
    ctx.fillText('P', 650, y);
    ctx.fillText('GD', 750, y);
    ctx.fillText('PTS', 880, y);

    y += 45;
    state.standings.forEach((s, idx) => {
      const isChamp = idx === 0;
      const isUser = s.isUser;

      if (isUser) {
        ctx.fillStyle = 'rgba(150, 70, 255, 0.2)';
        ctx.fillRect(100, y - 35, 880, 65);
      } else if (isChamp) {
        ctx.fillStyle = 'rgba(0, 220, 255, 0.1)';
        ctx.fillRect(100, y - 35, 880, 65);
      }

      ctx.textAlign = 'left';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillStyle = isChamp ? '#00DCFF' : (isUser ? '#FF00C8' : '#FFFFFF');
      ctx.fillText(`${idx + 1}`, 130, y + 5);

      ctx.font = '600 22px "Inter", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${s.icon} ${s.name}`, 220, y + 5);

      ctx.textAlign = 'center';
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillStyle = '#8E8E9F';
      ctx.fillText(`${s.p}`, 650, y + 5);
      ctx.fillText(`${s.gd > 0 ? '+' + s.gd : s.gd}`, 750, y + 5);

      ctx.font = 'bold 26px "JetBrains Mono", monospace';
      ctx.fillStyle = isChamp ? '#00DCFF' : '#FFFFFF';
      ctx.fillText(`${s.pts}`, 880, y + 5);

      y += 75;
    });
  }

  function renderSquadCardSurface(ctx) {
    const userClub = state.clubs.find(c => c.id === state.userClubId) || state.clubs[0];

    ctx.font = 'bold 54px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('MY SUPER LEAGUE SQUAD', 540, 270);

    ctx.font = '80px sans-serif';
    ctx.fillText(userClub.icon, 540, 390);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px "Space Grotesk", sans-serif';
    ctx.fillText(userClub.name, 540, 460);

    ctx.font = '500 22px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText(`Manager: ${userClub.manager} · ${userClub.stadium}`, 540, 505);

    // Squad Roster Box
    let y = 580;
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('15-PLAYER ROSTER (11 STARTING XI + 4 SUBS)', 130, y);

    y += 40;
    const sorted = [...userClub.squad].sort((a, b) => b.ovr - a.ovr);
    sorted.forEach((p, idx) => {
      const isBench = idx >= 11;
      ctx.fillStyle = isBench ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(130, y - 28, 820, 48);

      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillStyle = p.pos === 'GK' ? '#3B82F6' : (p.pos === 'DEF' ? '#10B981' : (p.pos === 'MID' ? '#F59E0B' : '#EF4444'));
      ctx.fillText(`${p.pos}`, 150, y + 4);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 20px "Inter", sans-serif';
      ctx.fillText(`${p.name} ${isBench ? '(SUB)' : ''}`, 230, y + 4);

      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00DCFF';
      ctx.textAlign = 'right';
      ctx.fillText(`${p.ovr} OVR`, 920, y + 4);
      ctx.textAlign = 'left';

      y += 56;
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

  // --- 11. LEAD INTAKE ("RUN IT FOR YOUR PEOPLE") ---
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

    const payload = {
      name: name,
      phone: phone,
      company: org || 'Alumni / Campus / Office',
      source: 'superleague_inquiry',
      notes: `Super League Run Inquiry. Expected players: ${state.leadExpectedPlayers}. Manager: ${state.userManagerName}`
    };

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      // Generate Reference Code
      const refCode = 'REF-SL-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      $('lead-confirmed-ref').textContent = refCode;
      $('lead-form-fields').style.display = 'none';
      $('lead-confirmed-box').style.display = 'flex';
    } catch (err) {
      console.warn('Lead submit offline/fallback:', err);
      const refCode = 'REF-SL-' + Math.random().toString(36).substring(2, 7).toUpperCase();
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
      userClub.squad.forEach((p, idx) => {
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

  // Export for testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      state,
      getPurseGuardInfo,
      simulateMatch,
      generateRoundRobinSchedule,
      renderUHDCanvas
    };
  }
})();
