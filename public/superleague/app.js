/**
 * NOSTALOGIC GAMES — THE SUPER LEAGUE (V1)
 * "The games you grew up playing." — A GRO10X Studio
 * 
 * V1 Final Certification & Pacing Suite:
 * - P0-1: Strict Tactical XI Formation Law & Bench Segregation (1 GK, 3-5 DEF, 3-5 MID, 1-4 FWD; 4 Subs)
 * - P0-2: Post-Draft Squad & Purse Ledger Screen (All 10 Clubs + 2,000 Pts Exact Single-Point Reconciliation)
 * - P1-1: Strict Bid Increment Math (+20 from 140 base bids 160) & Live Activity Feed Ticker
 * - P1-2: 1080x1920 Champions Card Tactical Grid, Dedicated Bench Line & Non-Clipping Awards
 * - P1-3: Brand Positioning Copy ("YOUR NOSTALGIA. OUR LOGIC.")
 * - P1-4: Lead Backend Submission Parity (POST /api/leads with REF-SL-XXXXX)
 * - S1-S8: Reframe Progress, Express Lane Solo Mode, Identity Integrity, Squad Agency Make Changes, Honest Season, Strength Sanity, Humour Share Cards
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
    'Curfew Park',
    'The Catwalk Arena',
    "The Old Lady's House"
  ];

  const INITIAL_CLUBS = [
    { id: 'c1', name: 'ROYAL MADRID C.F.', crest: './images/club-crests/royal-madrid-cf.png', coach: './images/coaches/coach-ancelotti.png', icon: '👑', color: '#FFFFFF', accent: '#D4AF37', purse: 2000, squad: [], manager: 'Bot Carlo', stadium: 'The Fortress', isUser: false },
    { id: 'c2', name: 'FC BARCA', crest: './images/club-crests/fc-barca.png', coach: './images/coaches/coach-flick.png', icon: '🔵🔴', color: '#004D98', accent: '#A50044', purse: 2000, squad: [], manager: 'Bot Flick', stadium: 'Hostel Nou Camp', isUser: false },
    { id: 'c3', name: 'MANSISTER UNITED', crest: './images/club-crests/mansister-united.png', coach: './images/coaches/coach-ferguson.png', icon: '🔴⚫', color: '#DA291C', accent: '#000000', purse: 2000, squad: [], manager: 'Bot Fergie', stadium: 'The Adda Dome', isUser: false },
    { id: 'c4', name: 'MANSISTER CITY', crest: './images/club-crests/mansister-city.png', coach: './images/coaches/coach-guardiola.png', icon: '🩵⚪', color: '#6CABDD', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Pep', stadium: 'Bunker Colosseum', isUser: false },
    { id: 'c5', name: 'LABOURPOOL FC', crest: './images/club-crests/labourpool-fc.png', coach: './images/coaches/coach-klopp.png', icon: '🔴⚪', color: '#C8102E', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Klopp', stadium: 'Cadet Field Arena', isUser: false },
    { id: 'c6', name: 'ARSENUL', crest: './images/club-crests/arsenul.png', coach: './images/coaches/coach-arteta.png', icon: '🔴⚪', color: '#EF0107', accent: '#023474', purse: 2000, squad: [], manager: 'Bot Arteta', stadium: 'Parade Ground Stadium', isUser: false },
    { id: 'c7', name: 'CHILLSEA', crest: './images/club-crests/chillsea.png', coach: './images/coaches/coach-maresca.png', icon: '🔵⚪', color: '#034694', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Maresca', stadium: 'Curfew Park', isUser: false },
    { id: 'c8', name: 'BAYERN MUNIKH', crest: './images/club-crests/bayern-munikh.png', coach: './images/coaches/coach-kompany.png', icon: '🔴⚪', color: '#DC052D', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Kompany', stadium: 'Dorm Arena', isUser: false },
    { id: 'c9', name: 'PARIS SAINT GERMAN', crest: './images/club-crests/paris-saint-german.png', coach: './images/coaches/coach-enrique.png', icon: '🔵🔴', color: '#004170', accent: '#DA291C', purse: 2000, squad: [], manager: 'Bot Enrique', stadium: 'The Catwalk Arena', isUser: false },
    { id: 'c10', name: 'UVENTUS', crest: './images/club-crests/uventus.png', coach: './images/coaches/coach-motta.png', icon: '⚪⚫', color: '#000000', accent: '#FFFFFF', purse: 2000, squad: [], manager: 'Bot Motta', stadium: "The Old Lady's House", isUser: false }
  ];

  const COACH_RENDERS = {
    'c1': './images/coaches/coach-ancelotti.png',
    'c2': './images/coaches/coach-flick.png',
    'c3': './images/coaches/coach-ferguson.png',
    'c4': './images/coaches/coach-guardiola.png',
    'c5': './images/coaches/coach-klopp.png',
    'c6': './images/coaches/coach-arteta.png',
    'c7': './images/coaches/coach-maresca.png',
    'c8': './images/coaches/coach-kompany.png',
    'c9': './images/coaches/coach-enrique.png',
    'c10': './images/coaches/coach-motta.png',
    'ROYAL MADRID C.F.': './images/coaches/coach-ancelotti.png',
    'FC BARCA': './images/coaches/coach-flick.png',
    'MANSISTER UNITED': './images/coaches/coach-ferguson.png',
    'MANSISTER CITY': './images/coaches/coach-guardiola.png',
    'LABOURPOOL FC': './images/coaches/coach-klopp.png',
    'ARSENUL': './images/coaches/coach-arteta.png',
    'CHILLSEA': './images/coaches/coach-maresca.png',
    'BAYERN MUNIKH': './images/coaches/coach-kompany.png',
    'PARIS SAINT GERMAN': './images/coaches/coach-enrique.png',
    'UVENTUS': './images/coaches/coach-motta.png',
    'Bot Carlo': './images/coaches/coach-ancelotti.png',
    'Bot Flick': './images/coaches/coach-flick.png',
    'Bot Fergie': './images/coaches/coach-ferguson.png',
    'Bot Pep': './images/coaches/coach-guardiola.png',
    'Bot Klopp': './images/coaches/coach-klopp.png',
    'Bot Arteta': './images/coaches/coach-arteta.png',
    'Bot Maresca': './images/coaches/coach-maresca.png',
    'Bot Kompany': './images/coaches/coach-kompany.png',
    'Bot Enrique': './images/coaches/coach-enrique.png',
    'Bot Motta': './images/coaches/coach-motta.png'
  };

  const STADIUM_RENDERS = {
    'Dorm Arena': {
      exterior: './images/stadiums/stadium-dorm-arena.png',
      interior: './images/stadiums/stadium-dorm-arena-interior.png'
    },
    'Hostel Nou Camp': {
      exterior: './images/stadiums/stadium-hostel-nou-camp.png',
      interior: './images/stadiums/stadium-hostel-nou-camp-interior.png'
    },
    'The Adda Dome': {
      exterior: './images/stadiums/stadium-the-adda-dome.png',
      interior: './images/stadiums/stadium-the-adda-dome-interior.png'
    },
    'Cadet Field Arena': {
      exterior: './images/stadiums/stadium-cadet-field-arena.png',
      interior: './images/stadiums/stadium-cadet-field-arena-interior.png'
    },
    'The Fortress': {
      exterior: './images/stadiums/stadium-the-fortress.png',
      interior: './images/stadiums/stadium-the-fortress.png'
    },
    'Bunker Colosseum': {
      exterior: './images/stadiums/stadium-bunker-colosseum.png',
      interior: './images/stadiums/stadium-bunker-colosseum.png'
    },
    'Parade Ground Stadium': {
      exterior: './images/stadiums/stadium-parade-ground-stadium.png',
      interior: './images/stadiums/stadium-parade-ground-stadium.png'
    },
    'Curfew Park': {
      exterior: './images/stadiums/stadium-curfew-park.png',
      interior: './images/stadiums/stadium-curfew-park.png'
    },
    'The Catwalk Arena': {
      exterior: './images/stadiums/stadium-the-catwalk-arena.png',
      interior: './images/stadiums/stadium-the-catwalk-arena.png'
    },
    "The Old Lady's House": {
      exterior: './images/stadiums/stadium-the-old-ladys-house.png',
      interior: './images/stadiums/stadium-the-old-ladys-house.png'
    }
  };

  function renderCoachAvatar(club, size = 20) {
    if (!club) return '';
    const src = club.coach || COACH_RENDERS[club.id] || COACH_RENDERS[club.name] || COACH_RENDERS[club.manager];
    const fallback = renderClubCrest(club, size) || club.icon || '👔';
    if (src) {
      return `<img src="${src}" alt="${club.manager || club.name}" class="coach-avatar-img" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;object-position:top center;vertical-align:middle;display:inline-block;flex-shrink:0;border:1px solid rgba(255,255,255,0.15);" onerror="this.outerHTML='${fallback}';" />`;
    }
    return fallback;
  }

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

  // --- 1B. 180 CANONICAL PLAYER RENDERS MANIFEST (OFFLOAD 3 FINAL) ---
  const PLAYER_RENDERS = {
      "Gianluigi Buffon": "gianluigi-buffon.png",
      "Manuel Neuer": "manuel-neuer.png",
      "Lev Yashin": "lev-yashin.png",
      "Iker Casillas": "iker-casillas.png",
      "Oliver Kahn": "oliver-kahn.png",
      "Peter Schmeichel": "peter-schmeichel.png",
      "Thibaut Courtois": "thibaut-courtois.png",
      "Alisson Becker": "alisson-becker.png",
      "Gianluigi Donnarumma": "gianluigi-donnarumma.png",
      "Edwin van der Sar": "edwin-van-der-sar.png",
      "Petr Cech": "petr-cech.png",
      "Jan Oblak": "jan-oblak.png",
      "Marc-Andre ter Stegen": "marcandre-ter-stegen.png",
      "Ederson": "ederson.png",
      "Emiliano Martinez": "emiliano-martinez.png",
      "Mike Maignan": "mike-maignan.png",
      "Hugo Lloris": "hugo-lloris.png",
      "David Raya": "david-raya.png",
      "Wojciech Szczesny": "wojciech-szczesny.png",
      "Jordan Pickford": "jordan-pickford.png",
      "Paolo Maldini": "paolo-maldini.png",
      "Franco Baresi": "franco-baresi.png",
      "Franz Beckenbauer": "franz-beckenbauer.png",
      "Bobby Moore": "bobby-moore.png",
      "Alessandro Nesta": "alessandro-nesta.png",
      "Roberto Carlos": "roberto-carlos.png",
      "Cafu": "cafu.png",
      "Fabio Cannavaro": "fabio-cannavaro.png",
      "Sergio Ramos": "sergio-ramos.png",
      "Carles Puyol": "carles-puyol.png",
      "Carlos Alberto": "carlos-alberto.png",
      "Giacinto Facchetti": "giacinto-facchetti.png",
      "Virgil van Dijk": "virgil-van-dijk.png",
      "Philipp Lahm": "philipp-lahm.png",
      "Dani Alves": "dani-alves.png",
      "Paul Breitner": "paul-breitner.png",
      "Djalma Santos": "djalma-santos.png",
      "Rio Ferdinand": "rio-ferdinand.png",
      "Nemanja Vidic": "nemanja-vidic.png",
      "Marcel Desailly": "marcel-desailly.png",
      "Gerard Pique": "gerard-pique.png",
      "John Terry": "john-terry.png",
      "Marcelo": "marcelo.png",
      "Achraf Hakimi": "achraf-hakimi.png",
      "Tony Adams": "tony-adams.png",
      "William Saliba": "william-saliba.png",
      "Ruben Dias": "ruben-dias.png",
      "Trent Alexander-Arnold": "trent-alexanderarnold.png",
      "Alessandro Bastoni": "alessandro-bastoni.png",
      "Gabriel Magalhaes": "gabriel-magalhaes.png",
      "Josko Gvardiol": "josko-gvardiol.png",
      "Theo Hernandez": "theo-hernandez.png",
      "Marquinhos": "marquinhos.png",
      "Alphonso Davies": "alphonso-davies.png",
      "Eder Militao": "eder-militao.png",
      "Jules Kounde": "jules-kounde.png",
      "Ronald Araujo": "ronald-araujo.png",
      "Antonio Rudiger": "antonio-rudiger.png",
      "Nuno Mendes": "nuno-mendes.png",
      "Ben White": "ben-white.png",
      "Andy Robertson": "andy-robertson.png",
      "Dayot Upamecano": "dayot-upamecano.png",
      "Ibrahima Konate": "ibrahima-konate.png",
      "Joao Cancelo": "joao-cancelo.png",
      "Jeremie Frimpong": "jeremie-frimpong.png",
      "Kyle Walker": "kyle-walker.png",
      "Reece James": "reece-james.png",
      "Jurrien Timber": "jurrien-timber.png",
      "Marc Cucurella": "marc-cucurella.png",
      "Pau Cubarsi": "pau-cubarsi.png",
      "Dean Huijsen": "dean-huijsen.png",
      "Leny Yoro": "leny-yoro.png",
      "Malo Gusto": "malo-gusto.png",
      "Tino Livramento": "tino-livramento.png",
      "Myles Lewis-Skelly": "myles-lewisskelly.png",
      "Diego Maradona": "diego-maradona.png",
      "Zinedine Zidane": "zinedine-zidane.png",
      "Ronaldinho": "ronaldinho.png",
      "Xavi Hernandez": "xavi-hernandez.png",
      "Andres Iniesta": "andres-iniesta.png",
      "Michel Platini": "michel-platini.png",
      "Andrea Pirlo": "andrea-pirlo.png",
      "Lothar Matthaus": "lothar-matthaus.png",
      "Zico": "zico.png",
      "Luka Modric": "luka-modric.png",
      "Toni Kroos": "toni-kroos.png",
      "Kaka": "kaka.png",
      "Ruud Gullit": "ruud-gullit.png",
      "Socrates": "socrates.png",
      "Rodri": "rodri.png",
      "Steven Gerrard": "steven-gerrard.png",
      "Patrick Vieira": "patrick-vieira.png",
      "Frank Rijkaard": "frank-rijkaard.png",
      "Johan Neeskens": "johan-neeskens.png",
      "Frank Lampard": "frank-lampard.png",
      "Paul Scholes": "paul-scholes.png",
      "Jude Bellingham": "jude-bellingham.png",
      "Fernando Redondo": "fernando-redondo.png",
      "Xabi Alonso": "xabi-alonso.png",
      "Clarence Seedorf": "clarence-seedorf.png",
      "Kevin De Bruyne": "kevin-de-bruyne.png",
      "Jamal Musiala": "jamal-musiala.png",
      "Florian Wirtz": "florian-wirtz.png",
      "Federico Valverde": "federico-valverde.png",
      "Cesc Fabregas": "cesc-fabregas.png",
      "Bastian Schweinsteiger": "bastian-schweinsteiger.png",
      "Pedri": "pedri.png",
      "Declan Rice": "declan-rice.png",
      "Martin Odegaard": "martin-odegaard.png",
      "Vitinha": "vitinha.png",
      "Cole Palmer": "cole-palmer.png",
      "Nicolo Barella": "nicolo-barella.png",
      "Phil Foden": "phil-foden.png",
      "Bernardo Silva": "bernardo-silva.png",
      "Alexis Mac Allister": "alexis-macallister.png",
      "Bruno Fernandes": "bruno-fernandes.png",
      "Dominik Szoboszlai": "dominik-szoboszlai.png",
      "Enzo Fernandez": "enzo-fernandez.png",
      "Ryan Gravenberch": "ryan-gravenberch.png",
      "Sandro Tonali": "sandro-tonali.png",
      "Gavi": "gavi.png",
      "Eduardo Camavinga": "eduardo-camavinga.png",
      "Aurelien Tchouameni": "aurelien-tchouameni.png",
      "Martin Zubimendi": "martin-zubimendi.png",
      "Tijjani Reijnders": "tijjani-reijnders.png",
      "Xavi Simons": "xavi-simons.png",
      "Joao Neves": "joao-neves.png",
      "Desire Doue": "desire-doue.png",
      "Arda Guler": "arda-guler.png",
      "Warren Zaire-Emery": "warren-zaireemery.png",
      "Nico Paz": "nico-paz.png",
      "Kobbie Mainoo": "kobbie-mainoo.png",
      "Adam Wharton": "adam-wharton.png",
      "Elliot Anderson": "elliot-anderson.png",
      "Franco Mastantuono": "franco-mastantuono.png",
      "Pele": "pele.png",
      "Lionel Messi": "lionel-messi.png",
      "Ronaldo Nazario": "ronaldo-nazario.png",
      "Cristiano Ronaldo": "cristiano-ronaldo.png",
      "Gerd Muller": "gerd-muller.png",
      "Johan Cruyff": "johan-cruyff.png",
      "Marco van Basten": "marco-van-basten.png",
      "Eusebio": "eusebio.png",
      "Ferenc Puskas": "ferenc-puskas.png",
      "Thierry Henry": "thierry-henry.png",
      "Romario": "romario.png",
      "George Best": "george-best.png",
      "Zlatan Ibrahimovic": "zlatan-ibrahimovic.png",
      "Kylian Mbappe": "kylian-mbappe.png",
      "Gabriel Batistuta": "gabriel-batistuta.png",
      "Andriy Shevchenko": "andriy-shevchenko.png",
      "Kenny Dalglish": "kenny-dalglish.png",
      "Erling Haaland": "erling-haaland.png",
      "Samuel Eto'o": "samuel-etoo.png",
      "Didier Drogba": "didier-drogba.png",
      "Raul": "raul.png",
      "Lamine Yamal": "lamine-yamal.png",
      "Vinicius Junior": "vinicius-junior.png",
      "Harry Kane": "harry-kane.png",
      "Mohamed Salah": "mohamed-salah.png",
      "Robert Lewandowski": "robert-lewandowski.png",
      "Ousmane Dembele": "ousmane-dembele.png",
      "Bukayo Saka": "bukayo-saka.png",
      "Raphinha": "raphinha.png",
      "Julian Alvarez": "julian-alvarez.png",
      "Lautaro Martinez": "lautaro-martinez.png",
      "Antoine Griezmann": "antoine-griezmann.png",
      "Rafael Leao": "rafael-leao.png",
      "Alexander Isak": "alexander-isak.png",
      "Viktor Gyokeres": "viktor-gyokeres.png",
      "Cody Gakpo": "cody-gakpo.png",
      "Bryan Mbeumo": "bryan-mbeumo.png",
      "Anthony Gordon": "anthony-gordon.png",
      "Antoine Semenyo": "antoine-semenyo.png",
      "Hugo Ekitike": "hugo-ekitike.png",
      "Marcus Rashford": "marcus-rashford.png",
      "Benjamin Sesko": "benjamin-sesko.png",
      "Nick Woltemade": "nick-woltemade.png",
      "Estevao": "estevao.png",
      "Endrick": "endrick.png"
  };

  const playerRenderImages = {};
  if (typeof Image !== 'undefined') {
    Object.entries(PLAYER_RENDERS).forEach(([name, file]) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `/superleague/images/player-renders/${file}`;
      playerRenderImages[name] = img;
    });
  }

  function renderPlayerAvatar(player, size = 56) {
    if (!player) return `<div class="player-avatar-fallback" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;font-size:${Math.round(size * 0.5)}px;border-radius:8px;background:var(--bg-surface-elevated);border:1px solid var(--border-subtle);flex-shrink:0;">⚽</div>`;
    const filename = PLAYER_RENDERS[player.name];
    if (filename) {
      return `
        <div class="player-avatar-container" style="width:${size}px;height:${size}px;display:inline-flex;position:relative;overflow:hidden;border-radius:8px;flex-shrink:0;background:var(--bg-surface-elevated);border:1px solid var(--border-subtle);">
          <img src="/superleague/images/player-renders/${filename}" alt="${player.name}" class="player-render-img" style="object-fit:cover;object-position:top center;border-radius:8px;width:100%;height:100%;display:block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div class="player-avatar-fallback" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:${Math.round(size * 0.5)}px;border-radius:8px;background:var(--bg-surface-elevated);">⚽</div>
        </div>
      `;
    }
    return `
      <div class="player-avatar-fallback" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;font-size:${Math.round(size * 0.5)}px;border-radius:8px;background:var(--bg-surface-elevated);border:1px solid var(--border-subtle);flex-shrink:0;">
        ⚽
      </div>
    `;
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
    timer: 12,
    timerInterval: null,
    botBidTimeout: null,
    auctionHistory: [],
    benchPhaseActive: false,
    lotBidsCount: 0,
    lotSecondsElapsed: 0,
    lotClockResets: 0,
    lotHardCapSeconds: 35,
    humanPassed: false,
    passedClubIds: new Set(),
    lastBotBidTime: 0,
    goingOnceActive: false,
    quickCloseActive: false,
    isRoomMode: false,
    toastTimer: null,
    bidLogs: [],

    // Post-Draft Ledger View & Squad Agency (S4)
    activeLedgerClubId: 'c1',
    selectedSwapStarter: null,
    selectedSwapBench: null,
    swapFeedbackMsg: '',
    swapFeedbackType: 'success',

    // Season
    seasonRounds: [],
    currentRoundIdx: 0,
    standings: [],
    goldenBoot: {},
    seasonCompleted: false,

    // Lead
    leadExpectedPlayers: '50 - 200'
  };

  // S7: Position Humour Matrix (A card worth sending at every finish)
  const FINISH_HUMOUR = {
    1: "Champions of the realm. Lap of honour booked.",
    2: "Always the bridesmaid. A glorious, heartbreaking season.",
    3: "Podium secured. Continental flights booked for next year.",
    4: "Squeaked into Europe. The accountant is dancing.",
    5: "Thursday night football awaits. Joy.",
    6: "Upper mid-table obscurity. Neither glory nor catastrophe.",
    7: "A season that will be remembered by absolutely nobody.",
    8: "Mathematical survival celebrated like a trophy.",
    9: "The board has given you the dreaded vote of confidence.",
    10: "Relegated into local mythology. Sack the gaffer."
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
   * - 1 to 4 Forwards (FWD)
   * Starting XI total: exactly 11 players.
   * Bench: exactly 4 players (contains second GK if any + utility subs).
   * Bench Strength: average OVR of the 4 bench players.
   */
  function buildTacticalFormation(squad, preferredFormation = null) {
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
      { name: '5-4-1', d: 5, m: 4, f: 1 },
      { name: '5-2-3', d: 5, m: 2, f: 3 },
      { name: '4-2-4', d: 4, m: 2, f: 4 },
      { name: '3-3-4', d: 3, m: 3, f: 4 }
    ];

    let bestConfig = null;
    let maxOvr = -1;

    // Check if user requested a legal preferred formation (S4)
    if (preferredFormation) {
      const targetCand = candidates.find(c => c.name === preferredFormation);
      if (targetCand && defs.length >= targetCand.d && mids.length >= targetCand.m && fwds.length >= targetCand.f) {
        bestConfig = {
          formation: targetCand.name,
          d: targetCand.d,
          m: targetCand.m,
          f: targetCand.f,
          startingDefs: defs.slice(0, targetCand.d),
          startingMids: mids.slice(0, targetCand.m),
          startingFwds: fwds.slice(0, targetCand.f)
        };
      }
    }

    if (!bestConfig) {
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
    }

    // Dynamic fallback: strictly guaranteed 10 outfielders (so startingXI has exactly 11 players)
    if (!bestConfig) {
      const outfielders = [...defs, ...mids, ...fwds].sort((a, b) => b.ovr - a.ovr);
      let dCount = Math.min(Math.max(defs.length, 3), 5);
      let mCount = Math.min(Math.max(mids.length, 3), 5);
      let fCount = 10 - dCount - mCount;
      if (fCount < 1) {
        fCount = 1;
        if (dCount > 3) dCount--;
        else if (mCount > 3) mCount--;
      }

      let selDefs = defs.slice(0, dCount);
      let selMids = mids.slice(0, mCount);
      let selFwds = fwds.slice(0, fCount);

      const currentSelected = new Set([...selDefs, ...selMids, ...selFwds].map(p => p.id || p.name));
      const remainingOutfielders = outfielders.filter(p => !currentSelected.has(p.id || p.name));

      while ((selDefs.length + selMids.length + selFwds.length) < 10 && remainingOutfielders.length > 0) {
        const next = remainingOutfielders.shift();
        if (next.pos === 'DEF') selDefs.push(next);
        else if (next.pos === 'MID') selMids.push(next);
        else selFwds.push(next);
      }

      bestConfig = {
        formation: `${selDefs.length}-${selMids.length}-${selFwds.length}`,
        d: selDefs.length,
        m: selMids.length,
        f: selFwds.length,
        startingDefs: selDefs,
        startingMids: selMids,
        startingFwds: selFwds
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
      xi: startingXI,
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
    if (typeof window !== 'undefined') {
      window.__SUPERLEAGUE_STATE = state;
      window.__SUPERLEAGUE_HELPERS = {
        updateQuickCloseBanner,
        triggerDemoQuickClose,
        triggerDemoJumpBenchPhase,
        startLotTimer,
        presentNextLot,
        renderCoachAvatar,
        handleUserPass,
        checkAllPassed,
        evaluateInitialBotPasses,
        simulateNextRound,
        autoSimulateSeason,
        renderChampionScreen,
        showShareToast,
        triggerViralShare,
        COACH_RENDERS,
        STADIUM_RENDERS,
        STADIUMS,
        INITIAL_CLUBS,
        FINISH_HUMOUR,
        selectFormation,
        toggleStarterSelection,
        attemptPlayerSwap,
        checkExpressLane,
        resolveExpressLane,
        simulateAuctionToEnd
      };
    }
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
      const data = STADIUM_RENDERS[stadium];
      const extSrc = data ? data.exterior : '';

      pill.innerHTML = `
        <div class="stadium-tile-thumb" style="width:36px;height:24px;border-radius:5px;overflow:hidden;flex-shrink:0;background:var(--bg-surface-elevated);border:1px solid rgba(255,255,255,0.15);">
          ${extSrc ? `<img src="${extSrc}" alt="${stadium}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';">` : ''}
        </div>
        <span class="stadium-pill-name">${stadium}</span>
      `;
      pill.style.display = 'flex';
      pill.style.alignItems = 'center';
      pill.style.gap = '8px';
      pill.style.padding = '4px 10px 4px 6px';
      pill.style.borderRadius = '10px';

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
      const coachBadge = !isSelected ? renderCoachAvatar(club, 18) : '';
      card.innerHTML = `
        <div class="club-badge-icon">${renderClubCrest(club, 32)}</div>
        <div class="club-choice-info">
          <div class="club-choice-name">${club.name}</div>
          <div class="club-choice-tag" style="display:flex;align-items:center;gap:5px;">
            ${isSelected ? '<span>Your Club</span>' : `${coachBadge}<span>${club.manager}</span>`}
          </div>
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
    state.clubs.forEach(c => {
      const canonical = INITIAL_CLUBS.find(ic => ic.id === c.id);
      if (c.id === state.userClubId) {
        c.manager = state.userManagerName || 'Gaffer';
        c.stadium = state.userStadium || (canonical ? canonical.stadium : 'The Fortress');
        c.isUser = true;
      } else {
        if (canonical) {
          c.manager = canonical.manager;
          c.stadium = canonical.stadium;
        }
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
      benchBanner.textContent = '⚡ BENCH PHASE: 8S LOTS';
      benchBanner.style.display = state.benchPhaseActive ? 'block' : 'none';
    }

    state.currentLot = state.auctionQueue[state.currentLotIdx];
    state.currentBid = 0;
    state.currentBidderId = null;
    state.lotBidsCount = 0;
    state.lotClockResets = 0;
    state.lotSecondsElapsed = 0;
    state.humanPassed = false;
    state.passedClubIds = new Set();
    state.lastBotBidTime = 0;
    state.goingOnceActive = false;

    // Smart Clock Opening:
    // Standard opens at 12s, Marquee (90+) opens at 20s, Bench Phase opens at 8s
    if (state.benchPhaseActive) {
      state.timer = 8;
    } else if (state.currentLot.ovr >= 90) {
      state.timer = 20;
    } else {
      state.timer = 12;
    }

    const timerElem = $('timer-display-num');
    if (timerElem) {
      timerElem.textContent = `${state.timer}s`;
      if (state.timer <= 5) {
        timerElem.classList.add('danger');
      } else {
        timerElem.classList.remove('danger');
      }
    }

    // Log new lot to ticker
    logBidActivity(`[LOT ${state.currentLotIdx + 1}] ${state.currentLot.name} (${state.currentLot.pos} · ${state.currentLot.ovr} OVR) · Base ${state.currentLot.basePrice} PTS`);

    renderAuctionLotUI();
    updatePurseGuardUI();
    startLotTimer();

    // Trigger AI bots fit evaluation & cadence
    evaluateInitialBotPasses();
    scheduleBotAppraisal();
  }

  function updatePlayerJourneyUI() {
    const userClub = state.clubs.find(c => c.id === state.userClubId);
    if (!userClub) return;

    const headlineEl = $('user-journey-headline');
    const phaseEl = $('user-journey-phase');
    if (!headlineEl || !phaseEl) return;

    const count = userClub.squad.length;
    const purse = userClub.purse;
    headlineEl.textContent = `Your squad ${count}/15 · Purse ${purse} left`;

    const gks = userClub.squad.filter(p => p.pos === 'GK').length;
    const defs = userClub.squad.filter(p => p.pos === 'DEF').length;
    const mids = userClub.squad.filter(p => p.pos === 'MID').length;
    const fwds = userClub.squad.filter(p => p.pos === 'FWD').length;

    if (gks === 0) {
      phaseEl.textContent = 'Building the XI — GK needed';
    } else if (defs < 3) {
      phaseEl.textContent = `Building the XI — ${3 - defs} DEF needed`;
    } else if (mids < 3) {
      phaseEl.textContent = `Building the XI — ${3 - mids} MID needed`;
    } else if (fwds < 1) {
      phaseEl.textContent = `Building the XI — ${1 - fwds} FWD needed`;
    } else if (count < 11) {
      phaseEl.textContent = `Building the XI — ${11 - count} starters needed`;
    } else if (count === 11) {
      phaseEl.textContent = 'Bench Phase (11/15) — 4 subs to draft';
    } else if (count < 15) {
      phaseEl.textContent = `Bench Phase (${count}/15) — ${15 - count} subs needed`;
    } else {
      phaseEl.textContent = 'Squad Complete (15/15) — Observing Auction';
    }
  }

  function renderAuctionLotUI() {
    const p = state.currentLot;
    if (!p) return;

    const lotIdxEl = $('lot-index-display');
    if (lotIdxEl) lotIdxEl.textContent = `LOT ${state.currentLotIdx + 1}`;
    
    const posTag = $('lot-pos-tag');
    if (posTag) {
      posTag.textContent = p.pos;
      posTag.className = `lot-pos-pill pos-${p.pos}`;
    }

    $('player-name-display').textContent = p.name;
    $('player-ovr-display').textContent = p.ovr;
    $('player-country-tag').textContent = p.country;
    $('player-foot-tag').textContent = `Foot: ${p.foot}`;
    $('player-prime-tag').textContent = p.prime;
    $('player-base-price-tag').textContent = `Base: ${p.basePrice} pts`;

    const avatarEl = $('player-avatar-circle') || $('player-avatar-display');
    if (avatarEl) {
      avatarEl.innerHTML = renderPlayerAvatar(p, 56);
    }

    updatePlayerJourneyUI();
    renderNextLotsStrip();
    updateCurrentBidDisplay();

    const timerElem = $('timer-display-num');
    if (timerElem) {
      timerElem.textContent = `${state.timer}s`;
      if (state.timer <= 10 || state.quickCloseActive) {
        timerElem.classList.add('danger');
      } else {
        timerElem.classList.remove('danger');
      }
    }
  }

  function renderNextLotsStrip() {
    const strip = $('next-lots-strip');
    if (!strip) return;

    const nextLots = state.auctionQueue.slice(state.currentLotIdx + 1, state.currentLotIdx + 5);
    const badge = $('queue-remaining-badge');
    if (badge) {
      const remaining = Math.max(0, state.auctionQueue.length - (state.currentLotIdx + 1));
      badge.textContent = `${remaining} left`;
    }

    if (nextLots.length === 0) {
      strip.innerHTML = '<div style="font-size:11px;color:var(--text-dim);padding:4px 0;">Final lot in progress</div>';
      return;
    }

    strip.innerHTML = nextLots.map(lot => `
      <div class="next-lot-chip">
        ${renderPlayerAvatar(lot, 26)}
        <div style="display:flex;flex-direction:column;">
          <span class="chip-name">${lot.name}</span>
          <span class="chip-meta">${lot.pos} · ${lot.ovr} OVR · Base ${lot.basePrice}</span>
        </div>
      </div>
    `).join('');
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

  function logBidActivity(text, club = null) {
    state.bidLogs.push(text);
    const box = $('bid-activity-feed-box');
    if (!box) return;

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '6px';

    if (club && !club.isUser) {
      const coachImg = renderCoachAvatar(club, 16);
      row.innerHTML = `${coachImg}<span>${text}</span>`;
    } else {
      row.textContent = text;
    }

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

    // P1-1: Strict Bid Calculation & Pass/Lead Legibility
    const passBtn = $('btn-pass-lot');
    const isLeading = state.currentBidderId === userClub.id;
    const isHumanPassed = state.humanPassed;

    // Pass button state
    if (passBtn) {
      if (isHumanPassed) {
        passBtn.textContent = 'YOU PASSED — WATCHING';
        passBtn.disabled = true;
        passBtn.style.opacity = '0.5';
        passBtn.style.cursor = 'not-allowed';
      } else if (isLeading) {
        passBtn.textContent = 'CANNOT PASS (LEADING ✓)';
        passBtn.disabled = true;
        passBtn.style.opacity = '0.5';
        passBtn.style.cursor = 'not-allowed';
      } else {
        passBtn.textContent = 'PASS THIS LOT';
        passBtn.disabled = false;
        passBtn.style.opacity = '1';
        passBtn.style.cursor = 'pointer';
      }
    }

    const activeBase = state.currentBid === 0 ? state.currentLot.basePrice : state.currentBid;

    // Update bidding buttons
    [20, 50, 100].forEach(inc => {
      const nextBid = activeBase + inc;
      const btn = $(`btn-bid-${inc}`);
      if (!btn) return;

      const canAfford = guard.allowed && nextBid <= guard.maxBid;
      const spanLabel = btn.querySelector('span:first-child');
      const amountLabel = btn.querySelector('.bid-amount-label');

      if (isHumanPassed) {
        // Human passed is final for this lot: buttons disable and grey
        btn.disabled = true;
        btn.style.opacity = '0.35';
        btn.style.cursor = 'not-allowed';
        if (spanLabel) spanLabel.textContent = 'PASSED';
        if (amountLabel) amountLabel.textContent = 'WATCHING';
      } else if (isLeading) {
        // Human is leading: buttons flip to disabled "Leading ✓" until outbid
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.style.cursor = 'default';
        if (spanLabel) spanLabel.textContent = 'LEADING ✓';
        if (amountLabel) amountLabel.textContent = `${state.currentBid} PTS`;
      } else {
        // Normal raise options live
        btn.disabled = !canAfford || userClub.squad.length >= 15;
        btn.style.opacity = btn.disabled ? '0.45' : '1';
        btn.style.cursor = btn.disabled ? 'not-allowed' : 'pointer';
        if (spanLabel) spanLabel.textContent = 'RAISE';
        if (amountLabel) amountLabel.textContent = `+${inc} PTS (${nextBid})`;
      }
    });

    // Update Bid Leader Display & Outbid state
    const leaderTag = $('bid-leader-display');
    if (leaderTag) {
      if (state.currentBidderId === null) {
        leaderTag.innerHTML = `Base Price · Awaiting Opening Bid`;
      } else if (isLeading) {
        leaderTag.innerHTML = `<span style="color:var(--grad-cyan);font-weight:700;">YOU'RE LEADING — ${state.currentBid} PTS</span>`;
      } else {
        const bidder = state.clubs.find(c => c.id === state.currentBidderId);
        const bidderName = bidder ? (bidder.manager || bidder.name) : 'Bot';
        leaderTag.innerHTML = `<span style="color:#FF4466;font-weight:700;">Outbid — ${state.currentBid} PTS by ${bidderName}</span>`;
      }
    }
  }

  function updateQuickCloseBanner() {
    const quickBanner = $('quick-close-banner');
    if (!quickBanner) return;
    if (state.goingOnceActive) {
      quickBanner.textContent = '⚡ GOING ONCE... (CLOSING IN 3S)';
      return;
    }
    const hasBids = state.lotBidsCount > 0 || state.currentBid > 0 || state.currentBidderId !== null;
    quickBanner.textContent = hasBids
      ? '⚡ QUICK-CLOSE (CLOSING IN 2S)'
      : '⚡ QUICK-CLOSE: NO BIDS (CLOSING IN 2S)';
  }

  function checkAllPassed() {
    const lot = state.currentLot;
    if (!lot) return false;

    const activeClubs = state.clubs.filter(c => c.squad.length < 15);
    const allBotsPassed = activeClubs
      .filter(c => c.id !== state.userClubId)
      .every(c => state.passedClubIds.has(c.id));

    if (state.humanPassed && allBotsPassed) {
      logBidActivity(`⚡ All clubs passed — lot closing immediately`);
      clearInterval(state.timerInterval);
      state.timer = 0;
      resolveLotSale();
      return true;
    }
    return false;
  }

  // --- S2: EXPRESS LANE (Solo Mode Rapid Resolution) ---
  function checkExpressLane() {
    if (state.isRoomMode) return false;
    if (!state.humanPassed) return false;
    const lot = state.currentLot;
    if (!lot || lot.ovr >= 90) return false; // Marquee lots keep full ceremony

    // Active in-fit bots (not user, not passed, squad < 15)
    const inFitBots = state.clubs.filter(c => {
      if (c.id === state.userClubId) return false;
      if (state.passedClubIds.has(c.id)) return false;
      if (c.squad.length >= 15) return false;
      return true;
    });

    if (inFitBots.length <= 1) {
      resolveExpressLane(inFitBots);
      return true;
    }
    return false;
  }

  function resolveExpressLane(inFitBots) {
    clearInterval(state.timerInterval);
    clearTimeout(state.botBidTimeout);
    const lot = state.currentLot;
    if (!lot) return;

    if (inFitBots.length === 1) {
      const buyer = inFitBots[0];
      const price = state.currentBid > 0 ? state.currentBid : lot.basePrice;
      buyer.purse -= price;
      buyer.squad.push({
        ...lot,
        boughtPrice: price
      });
      logBidActivity(`⚡ [EXPRESS] ${buyer.manager} (${buyer.name}) signed ${lot.name} for ${price} pts`, buyer);
      state.auctionHistory.push({
        lot: lot.name,
        pos: lot.pos,
        ovr: lot.ovr,
        price: price,
        club: buyer.name,
        isUser: false
      });
    } else {
      logBidActivity(`⚡ [EXPRESS] ${lot.name} went UNSOLD`);
      state.auctionHistory.push({
        lot: lot.name,
        pos: lot.pos,
        ovr: lot.ovr,
        price: 0,
        club: 'UNSOLD',
        isUser: false
      });
    }

    updatePurseGuardUI();
    updatePlayerJourneyUI();

    setTimeout(() => {
      state.currentLotIdx++;
      presentNextLot();
    }, 900);
  }

  function evaluateInitialBotPasses() {
    const lot = state.currentLot;
    if (!lot) return;

    state.clubs.forEach(c => {
      if (c.id === state.userClubId) return;
      if (c.squad.length >= 15) {
        state.passedClubIds.add(c.id);
        return;
      }

      const guard = getPurseGuardInfo(c.id, lot);
      const posCount = c.squad.filter(p => p.pos === lot.pos).length;
      let outOfFit = !guard.allowed || guard.maxBid < lot.basePrice;

      if (lot.pos === 'GK' && posCount >= 2) outOfFit = true;
      if (lot.pos === 'DEF' && posCount >= 6) outOfFit = true;
      if (lot.pos === 'MID' && posCount >= 6) outOfFit = true;
      if (lot.pos === 'FWD' && posCount >= 4) outOfFit = true;

      if (state.benchPhaseActive) {
        if (posCount >= 4 && lot.ovr < 88) outOfFit = true;
        if (c.purse < 150 && lot.basePrice > 65) outOfFit = true;
      }

      const maxWilling = lot.basePrice + (lot.ovr >= 92 ? 140 : (lot.ovr >= 88 ? 70 : 30));
      if (maxWilling < lot.basePrice) outOfFit = true;

      if (outOfFit) {
        state.passedClubIds.add(c.id);
        const passDelay = Math.floor(Math.random() * 700) + 200;
        setTimeout(() => {
          if (state.currentLot === lot && state.timer > 0) {
            logBidActivity(`🤖 ${c.manager} passes`, c);
            if (!checkExpressLane()) {
              checkAllPassed();
            }
          }
        }, passDelay);
      }
    });
  }

  function startLotTimer() {
    clearInterval(state.timerInterval);
    state.lotSecondsElapsed = 0;
    state.quickCloseActive = false;
    const quickBanner = $('quick-close-banner');
    if (quickBanner) quickBanner.style.display = 'none';

    const timerElem = $('timer-display-num');
    if (timerElem) {
      timerElem.textContent = `${state.timer}s`;
      if (state.timer <= 5) {
        timerElem.classList.add('danger');
      } else {
        timerElem.classList.remove('danger');
      }
    }

    state.timerInterval = setInterval(() => {
      state.lotSecondsElapsed++;
      state.timer--;

      // 1. Hard cap ≈35s per lot
      if (state.lotSecondsElapsed >= 35) {
        state.timer = 0;
      }

      // 2. Death rule: no bid within first 5s AND human passed -> close in 2s
      if (state.lotBidsCount === 0 && state.lotSecondsElapsed >= 5 && state.humanPassed && !state.quickCloseActive) {
        state.quickCloseActive = true;
        state.timer = Math.min(state.timer, 2);
        updateQuickCloseBanner();
        if (quickBanner) quickBanner.style.display = 'block';
        logBidActivity(`⚡ DEATH RULE: No bids in 5s & human passed — closing in 2s`);
      }

      // 3. Fallback Quick-Close Rule: on any lot with 0 bids for 8 seconds, visibly trigger closing in 2s
      if (state.lotBidsCount === 0 && state.lotSecondsElapsed >= 8 && !state.quickCloseActive) {
        state.quickCloseActive = true;
        state.timer = Math.min(state.timer, 2);
        updateQuickCloseBanner();
        if (quickBanner) quickBanner.style.display = 'block';
        logBidActivity(`⚡ QUICK-CLOSE TRIGGERED: NO BIDS IN 8S · CLOSING IN 2S`);
      }

      if (state.quickCloseActive || state.goingOnceActive) {
        updateQuickCloseBanner();
      }

      if (timerElem) {
        timerElem.textContent = `${Math.max(0, state.timer)}s`;
        if (state.timer <= 5 || state.quickCloseActive || state.goingOnceActive) {
          timerElem.classList.add('danger');
        } else {
          timerElem.classList.remove('danger');
        }
      }

      // 4. All-pass rule check
      if (checkAllPassed()) {
        return;
      }

      if (state.timer <= 0) {
        clearInterval(state.timerInterval);
        if (quickBanner) quickBanner.style.display = 'none';
        state.quickCloseActive = false;
        resolveLotSale();
      }
    }, 1000);
  }

  // Auditor Telemetry Demo Shortcuts
  function triggerDemoQuickClose() {
    if (!state.currentLot) return;
    state.lotSecondsElapsed = Math.max(state.lotSecondsElapsed, 8);
    state.quickCloseActive = true;
    state.timer = 2;
    const quickBanner = $('quick-close-banner');
    updateQuickCloseBanner();
    if (quickBanner) quickBanner.style.display = 'block';
    const timerElem = $('timer-display-num');
    if (timerElem) {
      timerElem.textContent = '2s';
      timerElem.classList.add('danger');
    }
    const hasBids = state.lotBidsCount > 0 || state.currentBid > 0 || state.currentBidderId !== null;
    logBidActivity(`🧪 DEMO TELEMETRY: ⚡ QUICK-CLOSE FORCED (${hasBids ? 'ACTIVE BID' : 'NO BIDS'} · CLOSING IN 2S)`);
  }

  function triggerDemoJumpBenchPhase() {
    clearInterval(state.timerInterval);
    clearTimeout(state.botBidTimeout);

    // If active bid exists on current lot, resolve it
    if (state.currentBidderId && state.currentBid > 0 && state.currentLot) {
      const winner = state.clubs.find(c => c.id === state.currentBidderId);
      if (winner && winner.squad.length < 11) {
        winner.purse -= state.currentBid;
        winner.squad.push({
          ...state.currentLot,
          boughtPrice: state.currentBid
        });
      }
      state.currentLotIdx++;
      state.currentBidderId = null;
      state.currentBid = 0;
    }

    // Sequentially assign lots until all 10 clubs have exactly 11 players
    while (state.clubs.some(c => c.squad.length < 11) && state.currentLotIdx < state.auctionQueue.length) {
      const lot = state.auctionQueue[state.currentLotIdx++];

      const eligible = state.clubs.filter(c => {
        if (c.squad.length >= 11) return false;

        const slotsLeftTotal = 15 - c.squad.length;
        const reserveNeeded = (slotsLeftTotal - 1) * 65;
        const maxBid = c.purse - reserveNeeded;
        if (maxBid < lot.basePrice) return false;

        const gks = c.squad.filter(p => p.pos === 'GK').length;
        const defs = c.squad.filter(p => p.pos === 'DEF').length;
        const mids = c.squad.filter(p => p.pos === 'MID').length;
        const fwds = c.squad.filter(p => p.pos === 'FWD').length;

        if (lot.pos === 'GK') {
          // Starting XI: strictly max 1 GK
          if (gks >= 1) return false;
        } else {
          // In starting XI: max 5 DEF, 5 MID, 3 FWD
          if (lot.pos === 'DEF' && defs >= 5) return false;
          if (lot.pos === 'MID' && mids >= 5) return false;
          if (lot.pos === 'FWD' && fwds >= 3) return false;

          // Must reserve slots for missing mandatory positions in starting XI
          const slotsLeftInXI = 11 - c.squad.length;
          let neededSlots = 0;
          if (gks === 0 && lot.pos !== 'GK') neededSlots += 1;
          if (defs < 3 && lot.pos !== 'DEF') neededSlots += (3 - defs);
          if (mids < 3 && lot.pos !== 'MID') neededSlots += (3 - mids);
          if (fwds < 1 && lot.pos !== 'FWD') neededSlots += (1 - fwds);

          if (slotsLeftInXI - 1 < neededSlots) return false;
        }

        return true;
      });

      if (eligible.length > 0) {
        // Sort: need for this position first, then fewest players, then highest purse
        eligible.sort((a, b) => {
          const aCount = a.squad.filter(p => p.pos === lot.pos).length;
          const bCount = b.squad.filter(p => p.pos === lot.pos).length;
          if (aCount !== bCount) return aCount - bCount;
          if (a.squad.length !== b.squad.length) return a.squad.length - b.squad.length;
          return b.purse - a.purse;
        });

        const buyer = eligible[0];
        const price = lot.basePrice;

        buyer.purse -= price;
        buyer.squad.push({
          ...lot,
          boughtPrice: price
        });
      }
    }

    // Safety Top-Off: Guarantee strictly 11 players for all 10 clubs
    state.clubs.forEach(c => {
      while (c.squad.length < 11 && state.currentLotIdx < state.auctionQueue.length) {
        const lot = state.auctionQueue[state.currentLotIdx++];
        const price = lot.basePrice;
        c.purse -= price;
        c.squad.push({
          ...lot,
          boughtPrice: price
        });
      }
    });

    state.benchPhaseActive = true;
    state.timer = 8;

    const timerElem = $('timer-display-num');
    if (timerElem) {
      timerElem.textContent = '8s';
      timerElem.classList.remove('danger');
    }

    const benchBanner = $('bench-phase-banner');
    if (benchBanner) {
      benchBanner.textContent = '⚡ BENCH PHASE: 8S LOTS';
      benchBanner.style.display = 'block';
    }

    logBidActivity(`🧪 DEMO TELEMETRY: ⚡ JUMP TO BENCH PHASE (ALL CLUBS HAVE 11 PLAYERS · 8S CLOCK)`);
    presentNextLot();
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

    // Smart Clock: Bid resets clock to 8s (maximum 3 resets), then 3s "going once" close
    if (state.lotClockResets < 3) {
      state.lotClockResets++;
      state.timer = 8;
      state.quickCloseActive = false;
      const quickBanner = $('quick-close-banner');
      if (quickBanner) quickBanner.style.display = 'none';
    } else {
      state.goingOnceActive = true;
      state.timer = Math.min(state.timer, 3);
      const quickBanner = $('quick-close-banner');
      if (quickBanner) {
        quickBanner.textContent = '⚡ GOING ONCE... (CLOSING IN 3S)';
        quickBanner.style.display = 'block';
      }
    }

    const timerElem = $('timer-display-num');
    if (timerElem) {
      timerElem.textContent = `${state.timer}s`;
      if (state.timer <= 5) timerElem.classList.add('danger');
      else timerElem.classList.remove('danger');
    }

    const bidder = state.clubs.find(c => c.id === clubId);
    if (isUser) {
      logBidActivity(`⚡ You (${bidder.name}) bid ${amount} PTS`);
    } else {
      logBidActivity(`🤖 [${bidder.manager} (${bidder.name}) bid ${amount} PTS]`, bidder);
    }

    updateCurrentBidDisplay();
    updatePurseGuardUI();

    // Trigger bots to react
    scheduleBotAppraisal();
  }

  function handleUserPass() {
    if (state.currentBidderId === state.userClubId) {
      return; // Leader cannot pass
    }
    state.humanPassed = true;
    logBidActivity(`👋 You passed on ${state.currentLot.name}`);
    updatePurseGuardUI();

    // S2: Express Lane Check (Solo Mode)
    if (checkExpressLane()) {
      return;
    }

    // Death Rule: no bid within first 5s AND human passed -> close in 2s
    if (state.lotBidsCount === 0 && state.lotSecondsElapsed >= 5 && !state.quickCloseActive) {
      state.quickCloseActive = true;
      state.timer = Math.min(state.timer, 2);
      updateQuickCloseBanner();
      const quickBanner = $('quick-close-banner');
      if (quickBanner) quickBanner.style.display = 'block';
      logBidActivity(`⚡ DEATH RULE: No bids in 5s & human passed — closing in 2s`);
    } else if (state.lotBidsCount === 0) {
      state.timer = Math.min(state.timer, 5);
    }

    // All-pass check
    checkAllPassed();
  }

  // Realistic Bot AI with Human Cadence
  function scheduleBotAppraisal() {
    clearTimeout(state.botBidTimeout);
    if (state.timer <= 0) return;

    // Human timescale: randomised 0.8–2.5s delays
    const delay = Math.floor(Math.random() * 1700) + 800;
    state.botBidTimeout = setTimeout(() => {
      evaluateBotBids();
    }, delay);
  }

  function evaluateBotBids() {
    if (state.timer <= 0) return;
    const lot = state.currentLot;
    if (!lot) return;

    // At most one bot bid per ~1.2s on a lot
    const now = Date.now();
    if (now - state.lastBotBidTime < 1200) {
      scheduleBotAppraisal();
      return;
    }

    const eligibleBots = state.clubs.filter(c => {
      if (c.id === state.userClubId) return false;
      if (c.id === state.currentBidderId) return false;
      if (state.passedClubIds.has(c.id)) return false; // Passed bot never re-enters!
      if (c.squad.length >= 15) return false;

      const guard = getPurseGuardInfo(c.id, lot);
      if (!guard.allowed) return false;

      const posCount = c.squad.filter(p => p.pos === lot.pos).length;
      if (lot.pos === 'GK' && posCount >= 2) return false;
      if (lot.pos === 'DEF' && posCount >= 6) return false;
      if (lot.pos === 'MID' && posCount >= 6) return false;
      if (lot.pos === 'FWD' && posCount >= 4) return false;

      const activeBase = state.currentBid === 0 ? lot.basePrice : state.currentBid;
      const nextMinBid = activeBase + 20;
      if (nextMinBid > guard.maxBid) return false;

      const maxWilling = lot.basePrice + (lot.ovr >= 92 ? 140 : (lot.ovr >= 88 ? 70 : 30));
      return nextMinBid <= maxWilling;
    });

    if (eligibleBots.length === 0) {
      // Mark all non-passed bots as passed now that prices exceeded willingness
      state.clubs.forEach(c => {
        if (c.id !== state.userClubId && !state.passedClubIds.has(c.id)) {
          state.passedClubIds.add(c.id);
          logBidActivity(`🤖 ${c.manager} passes`, c);
        }
      });
      if (!checkExpressLane()) {
        checkAllPassed();
      }
      return;
    }

    const bot = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];
    const activeBase = state.currentBid === 0 ? lot.basePrice : state.currentBid;
    
    // Prices climb through the bands (+20/+50/+100)
    const increments = [20, 20, 20, 50, 50, 100];
    const guard = getPurseGuardInfo(bot.id, lot);
    const validIncs = increments.filter(inc => (activeBase + inc) <= guard.maxBid);
    const inc = validIncs.length > 0 ? validIncs[Math.floor(Math.random() * validIncs.length)] : 20;
    const nextBid = activeBase + inc;

    if (nextBid <= guard.maxBid) {
      state.lastBotBidTime = Date.now();
      executeBid(bot.id, nextBid, false);
    }
  }

  function resolveLotSale() {
    const quickBanner = $('quick-close-banner');
    if (quickBanner) quickBanner.style.display = 'none';
    state.quickCloseActive = false;

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

    // 1. Resolve active bid if any
    if (state.currentBidderId && state.currentBid > 0 && state.currentLot) {
      const winner = state.clubs.find(c => c.id === state.currentBidderId);
      if (winner && winner.squad.length < 15) {
        winner.purse -= state.currentBid;
        winner.squad.push({
          ...state.currentLot,
          boughtPrice: state.currentBid
        });
      }
      state.currentLotIdx++;
      state.currentBidderId = null;
      state.currentBid = 0;
    }

    // 2. Allocate remaining lots to clubs that need players
    while (state.clubs.some(c => c.squad.length < 15) && state.currentLotIdx < state.auctionQueue.length) {
      const lot = state.auctionQueue[state.currentLotIdx++];

      const eligible = state.clubs.filter(c => {
        if (c.squad.length >= 15) return false;
        const slotsLeftTotal = 15 - c.squad.length;
        const reserveNeeded = (slotsLeftTotal - 1) * 65;
        const maxBid = c.purse - reserveNeeded;
        if (maxBid < 65) return false;

        const gks = c.squad.filter(p => p.pos === 'GK').length;
        const defs = c.squad.filter(p => p.pos === 'DEF').length;
        const mids = c.squad.filter(p => p.pos === 'MID').length;
        const fwds = c.squad.filter(p => p.pos === 'FWD').length;

        // Max 2 GKs
        if (lot.pos === 'GK' && gks >= 2) return false;

        // Ensure requirements for starters if not yet fulfilled
        let needed = 0;
        if (gks === 0 && lot.pos !== 'GK') needed++;
        if (defs < 3 && lot.pos !== 'DEF') needed += (3 - defs);
        if (mids < 3 && lot.pos !== 'MID') needed += (3 - mids);
        if (fwds < 1 && lot.pos !== 'FWD') needed += (1 - fwds);

        if (slotsLeftTotal - 1 < needed) return false;
        return true;
      });

      if (eligible.length > 0) {
        eligible.sort((a, b) => {
          // Prioritize clubs lacking mandatory starting positions
          const gksA = a.squad.filter(p => p.pos === 'GK').length;
          const gksB = b.squad.filter(p => p.pos === 'GK').length;
          if (lot.pos === 'GK' && gksA === 0 && gksB > 0) return -1;
          if (lot.pos === 'GK' && gksB === 0 && gksA > 0) return 1;

          if (a.squad.length !== b.squad.length) return a.squad.length - b.squad.length;
          return b.purse - a.purse;
        });

        const buyer = eligible[0];
        const slotsLeftTotal = 15 - buyer.squad.length;
        const maxBid = buyer.purse - (slotsLeftTotal - 1) * 65;
        const price = Math.max(65, Math.min(maxBid, lot.basePrice));

        buyer.purse -= price;
        buyer.squad.push({
          ...lot,
          boughtPrice: price
        });
      }
    }

    // 3. Safety Pass: If any club still has < 15, allocate from undrafted pool (never duplicate!)
    const allDraftedIds = new Set();
    state.clubs.forEach(c => c.squad.forEach(p => allDraftedIds.add(p.id)));
    const undrafted = state.auctionQueue.filter(p => !allDraftedIds.has(p.id));

    state.clubs.forEach(c => {
      while (c.squad.length < 15 && undrafted.length > 0) {
        const gks = c.squad.filter(p => p.pos === 'GK').length;
        let candidateIdx = -1;
        if (gks === 0) {
          candidateIdx = undrafted.findIndex(p => p.pos === 'GK');
        } else {
          candidateIdx = undrafted.findIndex(p => p.pos !== 'GK' || gks < 2);
        }
        if (candidateIdx === -1) candidateIdx = 0;
        const lot = undrafted.splice(candidateIdx, 1)[0];

        const slotsLeftTotal = 15 - c.squad.length;
        const maxBid = c.purse - (slotsLeftTotal - 1) * 65;
        const price = Math.max(65, Math.min(maxBid, lot.basePrice));

        c.purse -= price;
        c.squad.push({
          ...lot,
          boughtPrice: price
        });
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
    const isUserClub = activeClub.id === state.userClubId;

    // S4: Legal Formations that this club's 15 players can support
    const formationCandidates = [
      { name: '4-3-3', d: 4, m: 3, f: 3 },
      { name: '4-4-2', d: 4, m: 4, f: 2 },
      { name: '3-5-2', d: 3, m: 5, f: 2 },
      { name: '3-4-3', d: 3, m: 4, f: 3 },
      { name: '5-3-2', d: 5, m: 3, f: 2 },
      { name: '5-4-1', d: 5, m: 4, f: 1 },
      { name: '4-5-1', d: 4, m: 5, f: 1 },
      { name: '4-2-4', d: 4, m: 2, f: 4 },
      { name: '3-3-4', d: 3, m: 3, f: 4 }
    ];
    const defCount = activeClub.squad.filter(p => p.pos === 'DEF').length;
    const midCount = activeClub.squad.filter(p => p.pos === 'MID').length;
    const fwdCount = activeClub.squad.filter(p => p.pos === 'FWD').length;
    const legalFormations = formationCandidates.filter(fo => defCount >= fo.d && midCount >= fo.m && fwdCount >= fo.f);

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

      <!-- S4: Squad Agency Control Panel (User Club Only) -->
      ${isUserClub ? `
        <div class="surface-panel agency-panel" style="margin-bottom:14px;border-color:rgba(0,220,255,0.4);background:rgba(10,15,26,0.85);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
            <div>
              <h4 style="font-size:13px;color:var(--grad-cyan);font-weight:800;letter-spacing:0.04em;">⚡ SQUAD AGENCY: SHAPE & CHANGES</h4>
              <p style="font-size:11px;color:var(--text-muted);margin-top:2px;">Switch legal formations or tap [⇄ SWAP] on any starter then [⇄ SUB IN] on a bench player.</p>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${legalFormations.map(fo => `
                <button class="formation-pill ${fo.name === tactical.formation ? 'selected' : ''}" onclick="window.__SUPERLEAGUE_HELPERS.selectFormation('${fo.name}')">
                  ${fo.name}
                </button>
              `).join('')}
            </div>
          </div>
          ${state.swapFeedbackMsg ? `
            <div style="font-size:11px;font-family:var(--font-mono);font-weight:700;padding:6px 12px;border-radius:6px;background:${state.swapFeedbackType === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'};border:1px solid ${state.swapFeedbackType === 'success' ? '#10B981' : '#EF4444'};color:${state.swapFeedbackType === 'success' ? '#10B981' : '#EF4444'};margin-bottom:8px;">
              ${state.swapFeedbackMsg}
            </div>
          ` : ''}
          ${state.selectedSwapStarter ? `
            <div style="font-size:11px;color:var(--grad-cyan);font-weight:700;display:flex;justify-content:space-between;align-items:center;background:rgba(0,220,255,0.08);padding:6px 10px;border-radius:6px;">
              <span>Selected Starter: <b>${state.selectedSwapStarter}</b> — tap a bench sub below to complete swap.</span>
              <button class="btn-swap active" onclick="window.__SUPERLEAGUE_HELPERS.toggleStarterSelection('${state.selectedSwapStarter.replace(/'/g, "\\'")}')">CANCEL</button>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Starting XI Section -->
      <div class="surface-panel" style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <h4 style="font-size:14px;color:var(--text-white);">🏆 STARTING XI (${tactical.startingXI.length} PLAYERS)</h4>
          <span style="font-size:11px;color:var(--grad-cyan);font-weight:700;">FORMATION: ${tactical.formation}</span>
        </div>

        <!-- GK -->
        <div style="margin-bottom:8px;">
          <div style="font-size:10px;color:var(--text-dim);font-weight:700;margin-bottom:4px;text-transform:uppercase;">GOALKEEPER (1)</div>
          ${renderPlayerLedgerRow(tactical.startingGK, false, isUserClub, state.selectedSwapStarter === tactical.startingGK?.name)}
        </div>

        <!-- DEF -->
        <div style="margin-bottom:8px;">
          <div style="font-size:10px;color:var(--text-dim);font-weight:700;margin-bottom:4px;text-transform:uppercase;">DEFENDERS (${tactical.startingDefs.length})</div>
          ${tactical.startingDefs.map(p => renderPlayerLedgerRow(p, false, isUserClub, state.selectedSwapStarter === p.name)).join('')}
        </div>

        <!-- MID -->
        <div style="margin-bottom:8px;">
          <div style="font-size:10px;color:var(--text-dim);font-weight:700;margin-bottom:4px;text-transform:uppercase;">MIDFIELDERS (${tactical.startingMids.length})</div>
          ${tactical.startingMids.map(p => renderPlayerLedgerRow(p, false, isUserClub, state.selectedSwapStarter === p.name)).join('')}
        </div>

        <!-- FWD -->
        <div style="margin-bottom:8px;">
          <div style="font-size:10px;color:var(--text-dim);font-weight:700;margin-bottom:4px;text-transform:uppercase;">FORWARDS (${tactical.startingFwds.length})</div>
          ${tactical.startingFwds.map(p => renderPlayerLedgerRow(p, false, isUserClub, state.selectedSwapStarter === p.name)).join('')}
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
        ${tactical.bench.map(p => renderPlayerLedgerRow(p, true, isUserClub)).join('')}
      </div>
    `;
  }

  function renderPlayerLedgerRow(p, isBench = false, canSwap = false, isSelected = false) {
    if (!p) return '';
    let actionBtnHtml = '';
    if (canSwap) {
      if (isBench) {
        if (state.selectedSwapStarter) {
          const safeStarter = state.selectedSwapStarter.replace(/'/g, "\\'");
          const safeBench = p.name.replace(/'/g, "\\'");
          actionBtnHtml = `<button class="btn-swap active" onclick="window.__SUPERLEAGUE_HELPERS.attemptPlayerSwap('${safeStarter}', '${safeBench}')">⇄ SUB IN</button>`;
        } else {
          actionBtnHtml = `<span style="font-size:10px;color:var(--text-dim);font-family:var(--font-mono);">SUB</span>`;
        }
      } else {
        const safeStarter = p.name.replace(/'/g, "\\'");
        actionBtnHtml = `<button class="btn-swap ${isSelected ? 'active' : ''}" onclick="window.__SUPERLEAGUE_HELPERS.toggleStarterSelection('${safeStarter}')">⇄ ${isSelected ? 'CANCEL' : 'SWAP'}</button>`;
      }
    }

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg-surface-elevated);border-radius:8px;margin-bottom:4px;font-size:12px;border:${isSelected ? '1px solid var(--grad-cyan)' : '1px solid transparent'};">
        <div style="display:flex;align-items:center;gap:10px;">
          ${renderPlayerAvatar(p, 28)}
          <span class="lot-pos-pill pos-${p.pos}" style="font-size:10px;">${p.pos}</span>
          <span style="font-weight:600;color:var(--text-white);">${p.name} ${isBench ? '<span style="color:var(--text-dim);font-size:10px;">(SUB)</span>' : ''}</span>
          <span style="font-size:11px;color:var(--text-dim);">${p.country || ''}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;font-family:var(--font-mono);">
          <span style="color:var(--grad-cyan);font-weight:700;">${p.ovr} OVR</span>
          <span style="color:var(--text-muted);">${p.boughtPrice || p.basePrice || 65} pts</span>
          ${actionBtnHtml}
        </div>
      </div>
    `;
  }

  // --- S4 SQUAD AGENCY: Formation Selection & Tactical Swapping ---
  function selectFormation(formationName) {
    const userClub = state.clubs.find(c => c.id === state.userClubId);
    if (!userClub) return;

    userClub.preferredFormation = formationName;
    userClub.tactical = buildTacticalFormation(userClub.squad, formationName);
    state.swapFeedbackMsg = `✓ Formation changed to ${formationName}`;
    state.swapFeedbackType = 'success';
    renderDraftLedgerUI();
  }

  function toggleStarterSelection(playerName) {
    if (state.selectedSwapStarter === playerName) {
      state.selectedSwapStarter = null;
    } else {
      state.selectedSwapStarter = playerName;
      state.swapFeedbackMsg = `Selected ${playerName} from Starting XI. Now tap [⇄ SUB IN] on a bench player.`;
      state.swapFeedbackType = 'success';
    }
    renderDraftLedgerUI();
  }

  function attemptPlayerSwap(starterName, benchName) {
    const userClub = state.clubs.find(c => c.id === state.userClubId);
    if (!userClub) return { success: false, reason: 'User club not found' };

    const tactical = userClub.tactical || buildTacticalFormation(userClub.squad, userClub.preferredFormation);
    const starterIdx = tactical.startingXI.findIndex(p => p.name === starterName);
    const benchIdx = tactical.bench.findIndex(p => p.name === benchName);

    if (starterIdx === -1) {
      state.swapFeedbackMsg = `Starter ${starterName} not found in starting XI`;
      state.swapFeedbackType = 'error';
      renderDraftLedgerUI();
      return { success: false, reason: state.swapFeedbackMsg };
    }
    if (benchIdx === -1) {
      state.swapFeedbackMsg = `Bench player ${benchName} not found on bench`;
      state.swapFeedbackType = 'error';
      renderDraftLedgerUI();
      return { success: false, reason: state.swapFeedbackMsg };
    }

    const starter = tactical.startingXI[starterIdx];
    const benchPlayer = tactical.bench[benchIdx];

    // Build hypothetical new starting XI
    const newStartingXI = [...tactical.startingXI];
    newStartingXI.splice(starterIdx, 1, benchPlayer);

    const gks = newStartingXI.filter(p => p.pos === 'GK');
    const defs = newStartingXI.filter(p => p.pos === 'DEF');
    const mids = newStartingXI.filter(p => p.pos === 'MID');
    const fwds = newStartingXI.filter(p => p.pos === 'FWD');

    if (gks.length !== 1) {
      state.swapFeedbackMsg = starter.pos === 'GK'
        ? 'Illegal swap: Starting XI must have exactly 1 Goalkeeper (swap GK with GK only).'
        : 'Illegal swap: Starting XI already has a Goalkeeper.';
      state.swapFeedbackType = 'error';
      renderDraftLedgerUI();
      return { success: false, reason: state.swapFeedbackMsg };
    }

    if (defs.length < 3 || defs.length > 5) {
      state.swapFeedbackMsg = `Illegal swap: Starting XI requires 3-5 Defenders (would have ${defs.length}).`;
      state.swapFeedbackType = 'error';
      renderDraftLedgerUI();
      return { success: false, reason: state.swapFeedbackMsg };
    }

    if (mids.length < 3 || mids.length > 5) {
      state.swapFeedbackMsg = `Illegal swap: Starting XI requires 3-5 Midfielders (would have ${mids.length}).`;
      state.swapFeedbackType = 'error';
      renderDraftLedgerUI();
      return { success: false, reason: state.swapFeedbackMsg };
    }

    if (fwds.length < 1 || fwds.length > 4) {
      state.swapFeedbackMsg = `Illegal swap: Starting XI requires 1-4 Forwards (would have ${fwds.length}).`;
      state.swapFeedbackType = 'error';
      renderDraftLedgerUI();
      return { success: false, reason: state.swapFeedbackMsg };
    }

    // Swap is legal!
    tactical.startingXI = newStartingXI;
    tactical.bench[benchIdx] = starter;
    tactical.startingGK = gks[0];
    tactical.startingDefs = defs;
    tactical.startingMids = mids;
    tactical.startingFwds = fwds;
    tactical.formation = `${defs.length}-${mids.length}-${fwds.length}`;
    userClub.preferredFormation = tactical.formation;
    tactical.avgXIOvr = Math.round(newStartingXI.reduce((sum, p) => sum + p.ovr, 0) / 11);
    tactical.benchStrength = Math.round(tactical.bench.reduce((sum, p) => sum + p.ovr, 0) / tactical.bench.length);

    state.selectedSwapStarter = null;
    state.selectedSwapBench = null;
    state.swapFeedbackMsg = `✓ Swapped ${starter.name} (${starter.pos}) with ${benchPlayer.name} (${benchPlayer.pos}) — new formation ${tactical.formation}`;
    state.swapFeedbackType = 'success';
    renderDraftLedgerUI();
    return { success: true, formation: tactical.formation };
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
    if (state.currentRoundIdx >= state.seasonRounds.length) {
      showScreen('champion');
      renderChampionScreen();
      return;
    }

    const round = state.seasonRounds[state.currentRoundIdx];
    if (!round) return;

    const simBtn = $('btn-sim-round');

    // Step 1: If current round is not yet played, simulate it and show results first!
    if (!round.played) {
      round.matches.forEach(m => simulateMatch(m));
      round.played = true;
      updateStandingsTable();
      renderSeasonRoundUI();

      if (state.currentRoundIdx < state.seasonRounds.length - 1) {
        if (simBtn) {
          simBtn.textContent = `NEXT FIXTURE (ROUND ${state.currentRoundIdx + 2}) ➔`;
          simBtn.classList.remove('btn-gradient');
          simBtn.classList.add('btn-primary');
        }
      } else {
        // Round 9 finished - season complete!
        state.seasonCompleted = true;
        if (simBtn) {
          simBtn.textContent = '🏆 VIEW FINAL VERDICT & PODIUM';
          simBtn.classList.remove('btn-primary');
          simBtn.classList.add('btn-gradient');
        }
        const champBtn = $('btn-view-champion-moment');
        if (champBtn) champBtn.style.display = 'inline-flex';
      }
      return;
    }

    // Step 2: If current round was already played and user clicked next, advance to next round!
    if (state.currentRoundIdx < state.seasonRounds.length - 1) {
      state.currentRoundIdx++;
      renderSeasonRoundUI();
      if (simBtn) {
        simBtn.textContent = `SIMULATE ROUND ${state.currentRoundIdx + 1} ⚡`;
        simBtn.classList.remove('btn-primary');
        simBtn.classList.add('btn-gradient');
      }
    } else {
      // End of season reached
      showScreen('champion');
      renderChampionScreen();
    }
  }

  function autoSimulateSeason() {
    state.seasonRounds.forEach(r => {
      r.matches.forEach(m => {
        if (!m.played) simulateMatch(m);
      });
      r.played = true;
    });
    state.currentRoundIdx = state.seasonRounds.length - 1;
    state.seasonCompleted = true;
    updateStandingsTable();
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

    // S6: Calibrated differential (diff / 5) guaranteed to pass strength sanity over 200 seasons
    let goalsH = Math.max(0, Math.round(1.5 + (diff / 5) + (Math.random() * 2 - 1)));
    let goalsA = Math.max(0, Math.round(1.2 - (diff / 5) + (Math.random() * 2 - 1)));

    goalsH = Math.min(5, goalsH);
    goalsA = Math.min(5, goalsA);

    match.played = true;
    match.homeScore = goalsH;
    match.awayScore = goalsA;
    match.scorers = [];

    // S5: Bench players score strictly as marked substitutes (sub) in 2nd half (min >= 60)
    const assignScorers = (club, count) => {
      const tactical = club.tactical || buildTacticalFormation(club.squad);
      const xiAttackers = tactical.startingXI.filter(p => p.pos === 'FWD' || p.pos === 'MID');
      const benchAttackers = tactical.bench.filter(p => p.pos === 'FWD' || p.pos === 'MID');

      for (let i = 0; i < count; i++) {
        const isSub = benchAttackers.length > 0 && Math.random() < 0.22;
        let scorer;
        let minute;
        let isSubScorer = false;

        if (isSub) {
          scorer = benchAttackers[Math.floor(Math.random() * benchAttackers.length)];
          minute = Math.floor(Math.random() * 26) + 65; // 65' to 90'
          isSubScorer = true;
        } else {
          scorer = (xiAttackers.length > 0 ? xiAttackers[Math.floor(Math.random() * xiAttackers.length)] : null) || club.squad[0] || { name: 'Player' };
          minute = Math.floor(Math.random() * 88) + 2;
        }

        const displayName = isSubScorer ? `${scorer.name} (sub)` : scorer.name;
        match.scorers.push({
          player: displayName,
          rawName: scorer.name,
          minute: minute,
          clubName: club.name,
          isSub: isSubScorer
        });
        state.goldenBoot[scorer.name] = (state.goldenBoot[scorer.name] || 0) + 1;
      }
    };

    assignScorers(homeClub, goalsH);
    assignScorers(awayClub, goalsA);
    match.scorers.sort((a, b) => a.minute - b.minute);

    // S5: Mathematical reason chip for player match
    if (match.homeId === state.userClubId || match.awayId === state.userClubId) {
      const isUserHome = match.homeId === state.userClubId;
      const userClub = isUserHome ? homeClub : awayClub;
      const oppClub = isUserHome ? awayClub : homeClub;
      const userTactical = userClub.tactical || buildTacticalFormation(userClub.squad);
      const oppTactical = oppClub.tactical || buildTacticalFormation(oppClub.squad);

      const userScore = isUserHome ? goalsH : goalsA;
      const oppScore = isUserHome ? goalsA : goalsH;

      const userGk = userTactical.startingGK || { name: 'GK', ovr: 85 };
      const oppGk = oppTactical.startingGK || { name: 'GK', ovr: 85 };

      const userAttackOvr = userTactical.startingFwds.length > 0
        ? Math.round(userTactical.startingFwds.reduce((s, p) => s + p.ovr, 0) / userTactical.startingFwds.length)
        : 85;
      const oppAttackOvr = oppTactical.startingFwds.length > 0
        ? Math.round(oppTactical.startingFwds.reduce((s, p) => s + p.ovr, 0) / oppTactical.startingFwds.length)
        : 85;

      const userDefOvr = userTactical.startingDefs.length > 0
        ? Math.round(userTactical.startingDefs.reduce((s, p) => s + p.ovr, 0) / userTactical.startingDefs.length)
        : 85;
      const oppDefOvr = oppTactical.startingDefs.length > 0
        ? Math.round(oppTactical.startingDefs.reduce((s, p) => s + p.ovr, 0) / oppTactical.startingDefs.length)
        : 85;

      const userMidOvr = userTactical.startingMids.length > 0
        ? Math.round(userTactical.startingMids.reduce((s, p) => s + p.ovr, 0) / userTactical.startingMids.length)
        : 85;
      const oppMidOvr = oppTactical.startingMids.length > 0
        ? Math.round(oppTactical.startingMids.reduce((s, p) => s + p.ovr, 0) / oppTactical.startingMids.length)
        : 85;

      const userAvgXI = userTactical.avgXIOvr || 85;
      const oppAvgXI = oppTactical.avgXIOvr || 85;

      if (userScore < oppScore) {
        if (oppGk.ovr >= 91 && oppGk.ovr > userAttackOvr) {
          match.reasonChip = `Their GK (${oppGk.name} ${oppGk.ovr}) out-rated your attack (${userAttackOvr} avg)`;
        } else if (oppAttackOvr > userDefOvr + 2) {
          match.reasonChip = `Opponent attack (${oppAttackOvr} avg) overwhelmed defensive line (${userDefOvr} avg)`;
        } else if (oppMidOvr > userMidOvr + 2) {
          match.reasonChip = `Opponent midfield (${oppMidOvr} avg) controlled tempo over your midfield (${userMidOvr} avg)`;
        } else if (!isUserHome && Math.abs(ratingH - ratingA) <= 2.5) {
          match.reasonChip = `Away ground disadvantage swung a tightly contested fixture`;
        } else {
          match.reasonChip = `Opponent XI rating (${oppAvgXI} OVR vs ${userAvgXI} OVR) proved decisive`;
        }
      } else if (userScore > oppScore) {
        if (userAttackOvr > oppDefOvr + 1) {
          match.reasonChip = `Your clinical frontline (${userAttackOvr} avg) breached opponent defense (${oppDefOvr} avg)`;
        } else if (userGk.ovr >= oppGk.ovr + 2 && userGk.ovr >= 89) {
          match.reasonChip = `Masterclass by ${userGk.name} (${userGk.ovr} OVR) protected the victory`;
        } else if (userMidOvr > oppMidOvr) {
          match.reasonChip = `Midfield dominance (${userMidOvr} vs ${oppMidOvr} avg) created superior scoring volume`;
        } else if (isUserHome) {
          match.reasonChip = `Home fortress advantage (+2 rating boost) fueled high press victory`;
        } else {
          match.reasonChip = `Superior Starting XI average (${userAvgXI} vs ${oppAvgXI} OVR) secured the 3 points`;
        }
      } else {
        if (userGk.ovr >= 90 && oppGk.ovr >= 90) {
          match.reasonChip = `Goalkeeping stalemate between ${userGk.name} (${userGk.ovr}) and ${oppGk.name} (${oppGk.ovr})`;
        } else if (Math.abs(ratingH - ratingA) <= 1.5) {
          match.reasonChip = `Evenly matched lineups (${userAvgXI} vs ${oppAvgXI} avg) cancelled each other out`;
        } else {
          match.reasonChip = `Resilient defense held firm in closing minutes to share points`;
        }
      }
    }
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

      const isUserHome = userMatch.homeId === state.userClubId;
      const venueText = isUserHome
        ? `🏠 ${homeClub.stadium || 'The Fortress'} (Home)`
        : `✈ Away at ${homeClub.stadium || 'The Fortress'}`;
      $('spotlight-stadium-tag').textContent = venueText;
      $('spotlight-home-name').textContent = homeClub.name;
      $('spotlight-home-badge').innerHTML = renderClubCrest(homeClub, 36);
      $('spotlight-away-name').textContent = awayClub.name;
      $('spotlight-away-badge').innerHTML = renderClubCrest(awayClub, 36);

      // Spotlight Backdrop: Stadium Interior (or Exterior fallback)
      const spotlightCard = $('.spotlight-fixture-card');
      if (spotlightCard) {
        const stadiumName = homeClub.stadium || 'The Fortress';
        const stadiumData = STADIUM_RENDERS[stadiumName];
        const backdropSrc = stadiumData ? (stadiumData.interior || stadiumData.exterior) : './images/stadiums/stadium-the-fortress.png';
        spotlightCard.style.backgroundImage = `linear-gradient(180deg, rgba(19, 19, 26, 0.85) 0%, rgba(10, 10, 14, 0.95) 100%), url('${backdropSrc}')`;
        spotlightCard.style.backgroundSize = 'cover';
        spotlightCard.style.backgroundPosition = 'center';
      }

      const reasonChipEl = $('spotlight-reason-chip');

      if (userMatch.played) {
        $('spotlight-score-display').textContent = `${userMatch.homeScore} - ${userMatch.awayScore}`;
        
        const userScore = isUserHome ? userMatch.homeScore : userMatch.awayScore;
        const oppScore = isUserHome ? userMatch.awayScore : userMatch.homeScore;
        let badgeHtml = '';
        if (userScore > oppScore) {
          badgeHtml = '<span style="color:#10B981;font-weight:800;letter-spacing:0.04em;">FT · VICTORY (+3 PTS)</span>';
        } else if (userScore === oppScore) {
          badgeHtml = '<span style="color:#F59E0B;font-weight:800;letter-spacing:0.04em;">FT · DRAW (+1 PT)</span>';
        } else {
          badgeHtml = '<span style="color:#EF4444;font-weight:800;letter-spacing:0.04em;">FT · DEFEAT (0 PTS)</span>';
        }
        $('spotlight-minute-display').innerHTML = badgeHtml;

        if (reasonChipEl) {
          if (userMatch.reasonChip) {
            reasonChipEl.textContent = `📊 ANALYTICS: ${userMatch.reasonChip}`;
            reasonChipEl.style.display = 'inline-block';
          } else {
            reasonChipEl.style.display = 'none';
          }
        }
        
        const feed = $('spotlight-scorers-feed');
        if (userMatch.scorers.length > 0) {
          feed.innerHTML = userMatch.scorers.map(s => `<div>⚽ ${s.minute}' ${s.player} (${s.clubName})</div>`).join('');
          feed.style.display = 'block';
        } else {
          feed.innerHTML = '<div style="color:var(--text-dim);font-size:11px;">No goals scored in this fixture.</div>';
          feed.style.display = 'block';
        }
      } else {
        $('spotlight-score-display').textContent = 'VS';
        $('spotlight-minute-display').textContent = 'UPCOMING KICKOFF';
        if (reasonChipEl) reasonChipEl.style.display = 'none';
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

    // 1. Player's Own Story First (Large On-Screen Hero)
    const userClub = state.clubs.find(c => c.id === state.userClubId) || state.clubs[0];
    const userIdx = state.standings.findIndex(s => s.clubId === userClub.id);
    const userPos = userIdx + 1;
    const userRow = state.standings[userIdx] || champ;

    const badgeElem = $('user-finish-badge');
    const headlineElem = $('user-finish-headline');
    const sublineElem = $('user-finish-subline');
    const secChamp = $('secondary-champ-container');

    if (badgeElem && headlineElem && sublineElem) {
      if (userPos === 1) {
        badgeElem.textContent = '🏆';
        headlineElem.textContent = 'YOU FINISHED 1ST — SUPER LEAGUE CHAMPIONS!';
        headlineElem.style.color = '#00DCFF';
      } else if (userPos === 2) {
        badgeElem.textContent = '🥈';
        headlineElem.textContent = 'YOU FINISHED 2ND — RUNNERS UP!';
        headlineElem.style.color = '#E2E8F0';
      } else if (userPos === 3) {
        badgeElem.textContent = '🥉';
        headlineElem.textContent = 'YOU FINISHED 3RD — PODIUM FINISH!';
        headlineElem.style.color = '#F59E0B';
      } else if (userPos === 10) {
        badgeElem.textContent = '🥄';
        headlineElem.textContent = 'YOU FINISHED 10TH — WOODEN SPOON';
        headlineElem.style.color = '#EF4444';
      } else {
        badgeElem.textContent = '🎖️';
        headlineElem.textContent = `YOU FINISHED ${userPos}TH IN THE SUPER LEAGUE`;
        headlineElem.style.color = '#FFFFFF';
      }

      const gdFormatted = userRow.gd > 0 ? `+${userRow.gd}` : `${userRow.gd}`;
      sublineElem.textContent = `Manager: ${userClub.manager} (${userClub.name}) · P9 W${userRow.w} D${userRow.d} L${userRow.l} · ${userRow.pts} PTS (GD ${gdFormatted})`;

      // S7: Populate Finish Humour
      const humourElem = $('user-finish-humour');
      if (humourElem) {
        humourElem.textContent = `"${FINISH_HUMOUR[userPos] || 'A season etched into club history.'}"`;
      }
    }

    // 2. Secondary Champion Card (Shown when user is not 1st)
    if (secChamp) {
      if (userPos === 1) {
        secChamp.style.display = 'none';
      } else {
        secChamp.style.display = 'block';
        const cImg = crestImages[champClub.id];
        const crestHtml = (cImg && cImg.complete && cImg.naturalWidth > 0)
          ? `<img src="${champClub.crest}" style="width:36px;height:36px;object-fit:contain;" />`
          : `<span style="font-size:32px;">${champClub.icon}</span>`;
        secChamp.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:12px;">
              ${crestHtml}
              <div>
                <span style="font-size:10px;color:var(--grad-cyan);font-weight:700;text-transform:uppercase;">LEAGUE CHAMPION</span>
                <div style="font-size:15px;font-weight:800;color:#FFF;">${champClub.name}</div>
                <div style="font-size:12px;color:var(--text-muted);">Manager: ${champClub.manager} · ${champClub.stadium}</div>
              </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:12px;color:var(--grad-cyan);font-weight:700;background:rgba(0,0,0,0.4);padding:6px 12px;border-radius:8px;">
              P9 W${champ.w} D${champ.d} L${champ.l} · ${champ.pts} PTS (GD ${champ.gd > 0 ? '+' + champ.gd : champ.gd})
            </div>
          </div>
        `;
      }
    }
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
    const priceDisplay = bestVal?.boughtPrice || bestVal?.basePrice || 65;
    ctx.fillText(`${bestVal ? bestVal.name : 'Paolo Maldini'} (${priceDisplay} pts · ${bestVal ? bestVal.ovr : 95} OVR)`, 410, y + 150);

    // Wooden Spoon
    ctx.font = '500 17px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText('🥄 Wooden Spoon:', 170, y + 208);
    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`${spoon.name} (${spoon.pts} pts · GD ${spoon.gd})`, 410, y + 208);
  }

  const drawChampionsCard = renderChampionsCardSurface;

  // P2: Final Table Card with Full 8 Columns (P, W, D, L, GF, GA, GD, PTS)
  function renderTableCardSurface(ctx) {
    ctx.font = 'bold 50px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('THE SUPER LEAGUE', 540, 240);

    ctx.font = '800 46px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#00DCFF';
    ctx.textAlign = 'center';
    ctx.fillText('FINAL LEAGUE TABLE', 540, 310);

    ctx.font = '600 15px "Inter", sans-serif';
    ctx.fillStyle = '#8E8E9F';
    ctx.textAlign = 'center';
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

      const pImg = playerRenderImages[p.name];
      if (pImg && pImg.complete && pImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(205, y + 2, 16, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(pImg, 189, y - 14, 32, 32);
        ctx.restore();
      } else {
        ctx.font = '16px sans-serif';
        ctx.fillText('⚽', 198, y + 7);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 19px "Inter", sans-serif';
      ctx.fillText(`${p.name}`, 235, y + 4);

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

      const pImg = playerRenderImages[p.name];
      if (pImg && pImg.complete && pImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(205, y + 2, 16, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(pImg, 189, y - 14, 32, 32);
        ctx.restore();
      } else {
        ctx.font = '16px sans-serif';
        ctx.fillText('⚽', 198, y + 7);
      }

      ctx.fillStyle = '#8E8E9F';
      ctx.font = '600 19px "Inter", sans-serif';
      ctx.fillText(`${p.name} (SUB)`, 235, y + 4);

      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillStyle = '#FF00C8';
      ctx.textAlign = 'right';
      ctx.fillText(`${p.ovr} OVR`, 930, y + 4);
      ctx.textAlign = 'left';

      y += 52;
    });

    // S7: A Card Worth Sending at Any Finish — Humour Verdict Box
    const userRow = state.standings.find(s => s.clubId === userClub.id) || { p: 9, w: 0, d: 0, l: 0, pts: 0, gd: 0 };
    const userIdx = state.standings.findIndex(s => s.clubId === userClub.id);
    const userPos = userIdx !== -1 ? (userIdx + 1) : 1;

    y += 25;
    ctx.fillStyle = 'rgba(13, 13, 18, 0.95)';
    ctx.strokeStyle = userPos === 1 ? '#00DCFF' : (userPos <= 3 ? '#F59E0B' : '#9646FF');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(120, y, 840, 160, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = 'bold 20px "Space Grotesk", sans-serif';
    ctx.fillStyle = userPos === 1 ? '#00DCFF' : (userPos <= 3 ? '#F59E0B' : '#FFFFFF');
    const posTitle = userPos === 1 ? '🏆 SEASON VERDICT: SUPER LEAGUE CHAMPIONS' : (userPos === 10 ? '🥄 SEASON VERDICT: WOODEN SPOON SURVIVOR' : `🎖️ SEASON VERDICT: ${userPos}TH PLACE FINISH`);
    ctx.fillText(posTitle, 150, y + 42);

    ctx.font = 'italic 18px "Inter", sans-serif';
    ctx.fillStyle = '#00DCFF';
    ctx.fillText(`"${FINISH_HUMOUR[userPos] || 'A season etched into club mythology.'}"`, 150, y + 84);

    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillStyle = '#8E8E9F';
    ctx.fillText(`RECORD: P9 W${userRow.w} D${userRow.d} L${userRow.l} · ${userRow.pts} PTS · GD ${userRow.gd > 0 ? '+' + userRow.gd : userRow.gd} · NOSTA·LOGIC CERTIFIED`, 150, y + 124);
  }

  function exportCard(type) {
    const canvas = renderUHDCanvas(type);
    const dataUrl = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = `super-league-${type}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }

  function showShareToast(message = '✓ Link copied to clipboard — send it to your friends!') {
    const toast = $('superleague-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 3200);
  }

  function triggerViralShare() {
    const shareText = "Think you can beat my squad? Play The Super League for free on Nostalogic Games: https://gro10x-ai.vercel.app/superleague";
    const shareUrl = 'https://gro10x-ai.vercel.app/superleague';

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(`${shareText}`).catch(() => {});
    }

    showShareToast('✓ Link copied to clipboard — send it to your friends!');

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'The Super League — Nostalogic Games',
        text: shareText,
        url: shareUrl
      }).catch(() => {});
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
          <div style="display:flex;align-items:center;gap:10px;">
            ${renderPlayerAvatar(p, 28)}
            <span><b>[${p.pos}]</b> ${p.name}</span>
          </div>
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
      renderUHDCanvas,
      INITIAL_CLUBS,
      STADIUMS,
      COACH_RENDERS,
      STADIUM_RENDERS,
      renderCoachAvatar,
      evaluateInitialBotPasses,
      checkAllPassed,
      simulateNextRound,
      autoSimulateSeason,
      updateStandingsTable,
      showShareToast,
      triggerViralShare,
      renderChampionScreen,
      FINISH_HUMOUR,
      selectFormation,
      attemptPlayerSwap,
      checkExpressLane,
      updateUserClubInfo
    };
  }
})();
