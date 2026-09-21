(() => {
  const STORAGE_KEY = "agricola-mobile-table-v1";
  const CLIENT_ID_KEY = "agricola-mobile-client-id";
  const ROOM_CODE_KEY = "agricola-mobile-room-code";
  const ROOM_NAME_KEY = "agricola-mobile-room-name";
  const ICON = "assets/agricola-pieces.svg#";
  const FARM_ROWS = 3;
  const FARM_COLS = 5;
  const MAX_FAMILY = 5;
  const MAX_STABLES = 4;
  const HARVEST_AFTER = [4, 7, 9, 11, 13, 14];

  const navigationEntry = performance.getEntriesByType?.("navigation")?.[0];
  if (navigationEntry?.type === "reload") {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ROOM_CODE_KEY);
  }

  const RESOURCE_ORDER = [
    "wood",
    "clay",
    "reed",
    "stone",
    "grain",
    "vegetable",
    "food",
    "sheep",
    "boar",
    "cattle",
  ];
  const ANIMALS = ["sheep", "boar", "cattle"];
  const CROPS = ["grain", "vegetable"];

  const LABELS = {
    wood: "나무",
    clay: "흙",
    reed: "갈대",
    stone: "돌",
    grain: "곡식",
    vegetable: "채소",
    food: "음식",
    sheep: "양",
    boar: "멧돼지",
    cattle: "소",
  };

  const PLAYER_COLORS = ["#d95848", "#2f73a9", "#438c52", "#d5a033"];

  const BASE_SPACES = [
    { id: "forest", group: "base", name: "숲", icon: "wood", kind: "accum", accum: { wood: 3 }, note: "라운드 준비 때 3개 누적" },
    { id: "clayPit", group: "base", name: "흙 채굴장", icon: "clay", kind: "accum", accum: { clay: 1 }, note: "라운드 준비 때 1개 누적" },
    { id: "reedBank", group: "base", name: "갈대밭", icon: "reed", kind: "accum", accum: { reed: 1 }, note: "라운드 준비 때 1개 누적" },
    { id: "fishing", group: "base", name: "낚시", icon: "food", kind: "accum", accum: { food: 1 }, note: "라운드 준비 때 1개 누적" },
    { id: "grainSeeds", group: "base", name: "곡식 종자", icon: "grain", kind: "gain", gain: { grain: 1 }, note: "곡식 1개 획득" },
    { id: "farmland", group: "base", name: "밭", icon: "field", kind: "plow", note: "빈 칸 1곳을 밭으로" },
    { id: "dayLaborer", group: "base", name: "날품팔이", icon: "food", kind: "gain", gain: { food: 2 }, note: "음식 2개 획득" },
    { id: "meetingPlace", group: "base", name: "회합소", icon: "first", kind: "meeting", note: "시작 플레이어 마커 획득" },
    { id: "lessons", group: "base", name: "교습", icon: "card", kind: "occupation", note: "직업 카드 1장 사용" },
    { id: "farmExpansion", group: "base", name: "농장 확장", icon: "room", kind: "build", note: "방 및 마구간 건설" },
  ];

  const EXTRA_SPACES = [
    { id: "grove", minPlayers: 3, group: "extra", name: "작은 숲", icon: "wood", kind: "accum", accum: { wood: 2 }, note: "3인 이상: 나무 2개 누적" },
    { id: "hollow", minPlayers: 3, group: "extra", name: "점토 구덩이", icon: "clay", kind: "accum", accum: { clay: 1 }, note: "3인 이상: 흙 1개 누적" },
    { id: "resourceMarket", minPlayers: 3, group: "extra", name: "자원 시장", icon: "reed", kind: "gain", gain: { reed: 1, stone: 1, food: 1 }, note: "갈대, 돌, 음식 각 1개" },
    { id: "travelingPlayers", minPlayers: 4, group: "extra", name: "유랑극단", icon: "food", kind: "accum", accum: { food: 1 }, note: "4인 이상: 음식 1개 누적" },
    { id: "copse", minPlayers: 4, group: "extra", name: "수풀", icon: "wood", kind: "accum", accum: { wood: 1 }, note: "4인 이상: 나무 1개 누적" },
    { id: "lessonsPaid", minPlayers: 4, group: "extra", name: "보조 교습", icon: "card", kind: "occupationPaid", note: "직업 카드 1장 사용" },
  ];

  const ROUND_STAGES = [
    [
      { id: "sheep", stage: 1, name: "양 시장", icon: "sheep", kind: "accum", accum: { sheep: 1 }, note: "양 1마리 누적" },
      { id: "fences", stage: 1, name: "울타리", icon: "fence", kind: "fences", note: "울타리로 목초지 만들기" },
      { id: "grainUse", stage: 1, name: "곡식 활용", icon: "grain", kind: "sowBake", note: "씨 뿌리기 및 빵 굽기" },
      { id: "majorImprovement", stage: 1, name: "대형 설비", icon: "card", kind: "major", note: "대형 설비 1장 건설" },
    ],
    [
      { id: "stoneA", stage: 2, name: "돌 채석장", icon: "stone", kind: "accum", accum: { stone: 1 }, note: "돌 1개 누적" },
      { id: "familyGrowth", stage: 2, name: "가족 늘리기", icon: "person", kind: "family", needRoom: true, note: "빈 방이 있으면 가족 1명 증가" },
      { id: "renovation", stage: 2, name: "집 고치기", icon: "room", kind: "renovate", allowMajor: true, note: "집을 고치고 설비 선택 가능" },
    ],
    [
      { id: "vegetableSeeds", stage: 3, name: "채소 종자", icon: "vegetable", kind: "gain", gain: { vegetable: 1 }, note: "채소 1개 획득" },
      { id: "boar", stage: 3, name: "멧돼지", icon: "boar", kind: "accum", accum: { boar: 1 }, note: "멧돼지 1마리 누적" },
    ],
    [
      { id: "cattle", stage: 4, name: "소", icon: "cattle", kind: "accum", accum: { cattle: 1 }, note: "소 1마리 누적" },
      { id: "stoneB", stage: 4, name: "깊은 채석장", icon: "stone", kind: "accum", accum: { stone: 1 }, note: "돌 1개 누적" },
    ],
    [
      { id: "plowSow", stage: 5, name: "밭 갈고 씨 뿌리기", icon: "field", kind: "plowSow", note: "밭 1개를 갈고 씨 뿌리기" },
      { id: "familyAnyRoom", stage: 5, name: "급한 가족 늘리기", icon: "person", kind: "family", needRoom: false, note: "방이 없어도 가족 1명 증가" },
    ],
    [
      { id: "renovationFences", stage: 6, name: "집 고치고 울타리", icon: "fence", kind: "renovateFences", note: "집 고치기 후 울타리" },
    ],
  ];

  const ROUND_SPACE_BY_ID = Object.fromEntries(ROUND_STAGES.flat().map((space) => [space.id, space]));

  const MAJOR_IMPROVEMENTS = [
    {
      id: "fireplace2",
      name: "작은 화덕",
      type: "대형 설비",
      icon: "food",
      cost: { clay: 2 },
      points: 1,
      cook: { sheep: 2, boar: 2, cattle: 3, vegetable: 2 },
      bake: { food: 2, max: null },
      effect: "동물과 채소를 음식으로 바꾸고, 빵 굽기 때 곡식 1개당 음식 2개.",
    },
    {
      id: "fireplace3",
      name: "큰 화덕",
      type: "대형 설비",
      icon: "food",
      cost: { clay: 3 },
      points: 1,
      cook: { sheep: 2, boar: 2, cattle: 3, vegetable: 2 },
      bake: { food: 2, max: null },
      effect: "작은 화덕과 같은 변환 능력. 흙 3개로 건설.",
    },
    {
      id: "hearth4",
      name: "작은 조리 화덕",
      type: "대형 설비",
      icon: "food",
      cost: { clay: 4 },
      exchange: "fireplace",
      points: 1,
      cook: { sheep: 2, boar: 3, cattle: 4, vegetable: 3 },
      bake: { food: 3, max: null },
      effect: "화덕을 반납하거나 흙을 지불해 건설. 더 높은 음식 변환.",
    },
    {
      id: "hearth5",
      name: "큰 조리 화덕",
      type: "대형 설비",
      icon: "food",
      cost: { clay: 5 },
      exchange: "fireplace",
      points: 1,
      cook: { sheep: 2, boar: 3, cattle: 4, vegetable: 3 },
      bake: { food: 3, max: null },
      effect: "화덕을 반납하거나 흙을 지불해 건설. 더 높은 음식 변환.",
    },
    {
      id: "clayOven",
      name: "흙 오븐",
      type: "대형 설비",
      icon: "clay",
      cost: { clay: 3, stone: 1 },
      points: 2,
      bake: { food: 5, max: 1 },
      effect: "빵 굽기 때 곡식 1개를 음식 5개로.",
    },
    {
      id: "stoneOven",
      name: "돌 오븐",
      type: "대형 설비",
      icon: "stone",
      cost: { clay: 1, stone: 3 },
      points: 3,
      bake: { food: 4, max: 2 },
      effect: "빵 굽기 때 곡식 최대 2개를 각각 음식 4개로.",
    },
    {
      id: "joinery",
      name: "가구 제작소",
      type: "대형 설비",
      icon: "wood",
      cost: { wood: 2, stone: 2 },
      points: 2,
      bonusResource: "wood",
      effect: "게임 종료 때 남은 나무에 따라 보너스 점수.",
    },
    {
      id: "pottery",
      name: "도예소",
      type: "대형 설비",
      icon: "clay",
      cost: { clay: 2, stone: 2 },
      points: 2,
      bonusResource: "clay",
      effect: "게임 종료 때 남은 흙에 따라 보너스 점수.",
    },
    {
      id: "basketmaker",
      name: "바구니 제작소",
      type: "대형 설비",
      icon: "reed",
      cost: { reed: 2, stone: 2 },
      points: 2,
      bonusResource: "reed",
      effect: "게임 종료 때 남은 갈대에 따라 보너스 점수.",
    },
    {
      id: "well",
      name: "우물",
      type: "대형 설비",
      icon: "food",
      cost: { wood: 1, stone: 3 },
      points: 4,
      scheduleFood: 5,
      effect: "이후 최대 다섯 라운드 시작 때 음식 1개씩.",
    },
  ];

  const app = document.querySelector("#app");
  const modalRoot = document.querySelector("#modal-root");

  const clientId = getClientId();
  let publishTimer = null;
  let suppressPublish = false;
  const roomSession = {
    code: localStorage.getItem(ROOM_CODE_KEY) || "",
    name: localStorage.getItem(ROOM_NAME_KEY) || "",
    joinCode: localStorage.getItem(ROOM_CODE_KEY) || "",
    room: null,
    source: null,
    message: "",
  };
  const socketServerUrl = String(window.AGRICOLA_SERVER_URL || "").replace(/\/$/, "");
  const roomSocket = typeof window.io === "function"
    ? window.io(socketServerUrl || undefined, { autoConnect: false, transports: ["websocket", "polling"] })
    : null;

  let state = loadState();
  if (new URLSearchParams(window.location.search).get("demo") === "1") {
    state = defaultState();
    state.setup.count = 2;
    startGame();
  }
  render();

  document.addEventListener("click", handleClick);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleInput);
  initializeSocketRoom();
  reconnectSavedSocketRoom();

  function defaultState() {
    return {
      started: false,
      setup: {
        count: 2,
        names: ["빨강 농장", "파랑 농장", "초록 농장", "노랑 농장"],
      },
      activeTab: "board",
      viewedPlayer: 0,
      modal: null,
      history: [],
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return hydrateState({ ...defaultState(), ...parsed });
    } catch {
      return defaultState();
    }
  }

  function saveState(forceRoomPublish = false) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    scheduleSocketPublish(120, forceRoomPublish);
  }

  function hydrateState(nextState) {
    if (nextState.started && Array.isArray(nextState.players)) {
      nextState.players.forEach((player) => {
        player.minorImprovements ||= [];
        player.improvements ||= [];
        player.occupations ||= [];
      });
    }
    return nextState;
  }

  function getClientId() {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = `c-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  }

  function suggestedRoomName() {
    return roomSession.name || state?.setup?.names?.[0] || "플레이어";
  }

  function canControlGame() {
    if (!roomSession.code) return true;
    if (!state.started) return Boolean(roomSession.room?.isHost);
    const current = getActiveTurnPlayer();
    return Boolean(current && normalizePlayerName(current.name) === normalizePlayerName(suggestedRoomName()));
  }

  function getActiveTurnPlayer() {
    return state.phase === "harvest"
      ? state.players?.[state.harvest?.playerIndex]
      : getCurrentPlayer();
  }

  function normalizePlayerName(name) {
    return String(name || "").trim().toLocaleLowerCase("ko-KR");
  }

  function showRoomMessage(message) {
    roomSession.message = message;
    render();
  }

  async function createRoom() {
    try {
      const name = suggestedRoomName();
      const data = await roomRequest("/api/room/create", { clientId, name });
      setRoom(data, name);
      connectRoomEvents();
      if (state.started) scheduleRoomPublish(0);
      showRoomMessage("방을 만들었습니다. 코드를 공유해 주세요.");
    } catch (error) {
      showRoomMessage(error.message || "방을 만들 수 없습니다.");
    }
  }

  async function joinRoom() {
    const code = (roomSession.joinCode || "").trim().toUpperCase();
    if (!code) return showRoomMessage("입장 코드를 입력해 주세요.");
    try {
      const name = suggestedRoomName();
      const data = await roomRequest("/api/room/join", { code, clientId, name });
      setRoom(data, name);
      connectRoomEvents();
      const snapshot = await roomFetch(`/api/room/state?code=${encodeURIComponent(code)}&clientId=${encodeURIComponent(clientId)}`);
      if (snapshot.state) applyRemoteState(snapshot.state);
      showRoomMessage("방에 입장했습니다.");
    } catch (error) {
      showRoomMessage(error.message || "방에 입장할 수 없습니다.");
    }
  }

  async function leaveRoom() {
    const code = roomSession.code;
    closeRoomEvents();
    clearRoom();
    render();
    if (!code) return;
    try {
      await roomRequest("/api/room/leave", { code, clientId, name: suggestedRoomName() });
    } catch {
      // The local leave already happened; server cleanup can time out if offline.
    }
  }

  async function copyRoomCode() {
    if (!roomSession.code) return;
    try {
      await navigator.clipboard.writeText(roomSession.code);
      showRoomMessage("방 코드를 복사했습니다.");
    } catch {
      showRoomMessage(`방 코드: ${roomSession.code}`);
    }
  }

  function setRoom(data, name) {
    roomSession.code = data.code || data.room?.code || "";
    roomSession.joinCode = roomSession.code;
    roomSession.name = name;
    roomSession.room = data.room || data;
    roomSession.message = "";
    localStorage.setItem(ROOM_CODE_KEY, roomSession.code);
    localStorage.setItem(ROOM_NAME_KEY, name);
  }

  function clearRoom() {
    roomSession.code = "";
    roomSession.joinCode = "";
    roomSession.room = null;
    roomSession.message = "방에서 나왔습니다.";
    localStorage.removeItem(ROOM_CODE_KEY);
  }

  async function reconnectSavedRoom() {
    if (!roomSession.code) return;
    try {
      const name = suggestedRoomName();
      const data = await roomRequest("/api/room/join", { code: roomSession.code, clientId, name });
      setRoom(data, name);
      connectRoomEvents();
      const snapshot = await roomFetch(`/api/room/state?code=${encodeURIComponent(roomSession.code)}&clientId=${encodeURIComponent(clientId)}`);
      if (snapshot.state && !roomSession.room?.isHost) applyRemoteState(snapshot.state);
      render();
    } catch {
      clearRoom();
      render();
    }
  }

  function connectRoomEvents() {
    closeRoomEvents();
    if (!roomSession.code || typeof EventSource === "undefined") return;
    const params = new URLSearchParams({ code: roomSession.code, clientId, name: suggestedRoomName() });
    roomSession.source = new EventSource(`/api/room/events?${params}`);
    roomSession.source.onmessage = (event) => {
      try {
        receiveRoomPayload(JSON.parse(event.data));
      } catch {
        // Ignore malformed room events.
      }
    };
    roomSession.source.onerror = () => {
      roomSession.message = "방 연결을 다시 시도하는 중입니다.";
      render();
    };
  }

  function closeRoomEvents() {
    if (roomSession.source) roomSession.source.close();
    roomSession.source = null;
  }

  function receiveRoomPayload(payload) {
    if (payload.room) roomSession.room = payload.room;
    if (payload.state && !payload.room?.isHost) applyRemoteState(payload.state);
    roomSession.message = "";
    render();
  }

  function applyRemoteState(nextState) {
    suppressPublish = true;
    state = hydrateState(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    suppressPublish = false;
  }

  function scheduleRoomPublish(delay = 120) {
    if (suppressPublish || !roomSession.code || !roomSession.room?.isHost) return;
    clearTimeout(publishTimer);
    publishTimer = setTimeout(publishRoomState, delay);
  }

  async function publishRoomState() {
    if (!roomSession.code || !roomSession.room?.isHost) return;
    try {
      const data = await roomRequest("/api/room/state", {
        code: roomSession.code,
        clientId,
        name: suggestedRoomName(),
        state,
      });
      if (data.room) roomSession.room = data.room;
    } catch (error) {
      roomSession.message = error.message || "방 상태를 동기화하지 못했습니다.";
      render();
    }
  }

  async function roomHeartbeat() {
    if (!roomSession.code) return;
    try {
      const data = await roomRequest("/api/room/heartbeat", {
        code: roomSession.code,
        clientId,
        name: suggestedRoomName(),
      });
      if (data.room || data.code) {
        roomSession.room = data.room || data;
        render();
      }
    } catch {
      roomSession.message = "방 서버에 연결할 수 없습니다.";
      render();
    }
  }

  async function roomRequest(url, body) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "요청에 실패했습니다.");
    return data;
  }

  async function roomFetch(url) {
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "요청에 실패했습니다.");
    return data;
  }

  function initializeSocketRoom() {
    if (!roomSocket) {
      roomSession.message = "멀티플레이 모듈을 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.";
      return;
    }

    roomSocket.on("connect", () => {
      roomSession.message = "";
      render();
    });
    roomSocket.on("connect_error", () => {
      roomSession.message = "게임 서버에 연결할 수 없습니다. 네트워크 또는 서버 주소를 확인해 주세요.";
      render();
    });
    roomSocket.on("disconnect", (reason) => {
      if (reason !== "io client disconnect") {
        roomSession.message = "서버 연결이 끊겼습니다. 자동으로 다시 연결하는 중입니다.";
        render();
      }
    });
    roomSocket.on("room-updated", (room) => {
      if (!roomSession.code || room.code !== roomSession.code) return;
      roomSession.room = room;
      roomSession.message = "";
      render();
    });
    roomSocket.on("game-state", ({ roomCode, state: nextState }) => {
      if (roomCode !== roomSession.code) return;
      applyRemoteState(nextState);
      render();
    });
    roomSocket.on("host-changed", ({ roomCode, hostName }) => {
      if (roomCode !== roomSession.code) return;
      roomSession.message = `${hostName || "다음 참여자"}님이 새 방장이 되었습니다.`;
      render();
    });
    roomSocket.connect();
  }

  function socketAck(event, payload, timeout = 8000) {
    return new Promise((resolve, reject) => {
      if (!roomSocket) return reject(new Error("멀티플레이 모듈을 사용할 수 없습니다."));
      if (!roomSocket.connected) roomSocket.connect();

      roomSocket.timeout(timeout).emit(event, payload, (error, result) => {
        if (error) return reject(new Error("게임 서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요."));
        if (!result?.ok) return reject(new Error(result?.error || "게임 서버 요청을 처리하지 못했습니다."));
        resolve(result);
      });
    });
  }

  async function createSocketRoom() {
    try {
      const name = suggestedRoomName();
      const result = await socketAck("create-room", { playerName: name, initialState: state });
      setRoom(result.room, name);
      showRoomMessage("방을 만들었습니다. 입장 코드를 다른 플레이어에게 공유해 주세요.");
    } catch (error) {
      showRoomMessage(error.message || "방을 만들 수 없습니다. 서버 연결을 확인해 주세요.");
    }
  }

  async function joinSocketRoom() {
    const roomCode = (roomSession.joinCode || "").trim().toUpperCase();
    if (!roomCode) return showRoomMessage("입장 코드를 입력해 주세요.");

    try {
      const name = suggestedRoomName();
      const result = await socketAck("join-room", { roomCode, playerName: name });
      setRoom(result.room, name);
      if (result.state && !result.room.isHost) applyRemoteState(result.state);
      showRoomMessage("방에 입장했습니다.");
    } catch (error) {
      showRoomMessage(error.message || "방에 입장할 수 없습니다. 코드와 서버 연결을 확인해 주세요.");
    }
  }

  async function leaveSocketRoom() {
    if (roomSession.code && roomSocket?.connected) {
      try {
        await socketAck("leave-room", {});
      } catch {
        // Local cleanup still lets the player continue offline.
      }
    }
    clearRoom();
    render();
  }

  async function reconnectSavedSocketRoom() {
    if (!roomSession.code || !roomSocket) return;
    try {
      const result = await socketAck("join-room", {
        roomCode: roomSession.code,
        playerName: suggestedRoomName(),
      });
      setRoom(result.room, suggestedRoomName());
      if (result.state && !result.room.isHost) applyRemoteState(result.state);
      render();
    } catch (error) {
      clearRoom();
      roomSession.message = error.message || "이전 방에 다시 연결하지 못했습니다.";
      render();
    }
  }

  function scheduleSocketPublish(delay = 120, force = false) {
    if (suppressPublish || !roomSession.code || (!force && !canControlGame())) return;
    clearTimeout(publishTimer);
    publishTimer = setTimeout(() => publishSocketState(force), delay);
  }

  async function publishSocketState(force = false) {
    if (!roomSession.code || (!force && !canControlGame())) return;
    try {
      await socketAck("game-state", { roomCode: roomSession.code, state });
    } catch (error) {
      roomSession.message = error.message || "게임 상태를 공유하지 못했습니다.";
      render();
    }
  }

  function icon(name, cls = "") {
    return `<svg class="icon ${cls}" aria-hidden="true"><use href="${ICON}${name}"></use></svg>`;
  }

  function render() {
    if (!state.started) {
      app.innerHTML = renderSetup();
      modalRoot.innerHTML = "";
      return;
    }

    app.innerHTML = `
      <div class="app-shell">
        ${renderTopbar()}
        <main class="content">
          ${renderRoomPanel(true)}
          ${renderTurnCard()}
          ${renderActiveTab()}
        </main>
        ${renderTabbar()}
        ${renderTurnSnackbar()}
      </div>
    `;
    modalRoot.innerHTML = state.modal && canControlGame() ? renderModal() : "";
  }

  function renderSetup() {
    const count = state.setup.count;
    const names = state.setup.names;
    return `
      <div class="app-shell">
        <div class="topbar">
          <div class="brand">
            <div class="brand-title">${icon("grain", "sm")} Agricola Mobile Table</div>
            <div class="brand-subtitle">2016 개정판 흐름 기반 모바일 진행판</div>
          </div>
        </div>
        <main class="content">
          <section class="setup">
            <div class="setup-card">
              <h1>새 게임</h1>
              <div class="setup-grid">
                <div class="form-row">
                  <label>플레이어 수</label>
                  <div class="player-count">
                    ${[1, 2, 3, 4]
                      .map((n) => `<button class="seg-btn ${count === n ? "active" : ""}" data-action="setup-count" data-count="${n}">${n}</button>`)
                      .join("")}
                  </div>
                </div>
                ${Array.from({ length: count }, (_, i) => `
                  <div class="form-row">
                    <label>${i + 1}번 농장</label>
                    <input class="text-input" data-action="setup-name" data-index="${i}" value="${escapeHtml(names[i])}" />
                  </div>
                `).join("")}
                <button class="primary-btn" data-action="start-game">게임 시작</button>
              </div>
            </div>
            ${renderRoomPanel(false)}
            <div class="setup-card">
              <div class="chips">
                <span class="chip">${icon("person", "sm")} 가족 2명</span>
                <span class="chip">${icon("room", "sm")} 나무 방 2칸</span>
                <span class="chip">${icon("card", "sm")} 라운드 카드 14장</span>
                <span class="chip">${icon("fence", "sm")} 울타리 15개</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    `;
  }

  function renderRoomPanel(compact = false) {
    const connected = Boolean(roomSession.code && roomSession.room);
    const serverOnline = Boolean(roomSocket?.connected);
    const members = roomSession.room?.members || [];
    const hostName = members.find((member) => member.isHost)?.name || "";
    const modeLabel = !serverOnline ? "서버 오프라인" : !connected ? "서버 온라인" : roomSession.room?.isHost ? "방장" : "참여자";
    return `
      <section class="${compact ? "room-strip" : "setup-card"}">
        <div class="room-head">
          <strong>방 ${connected ? escapeHtml(roomSession.code) : "연결 없음"}${connected ? ` · 참여 ${members.length}명` : ""}</strong>
          <span class="chip connection-status ${serverOnline ? "online" : "offline"}">${modeLabel}${hostName ? ` · 방장 ${escapeHtml(hostName)}` : ""}</span>
        </div>
        <div class="room-grid">
          <input class="text-input" data-action="room-name" value="${escapeHtml(roomSession.name || suggestedRoomName())}" placeholder="닉네임" />
          <input class="text-input" data-action="room-code" value="${escapeHtml(roomSession.joinCode || "")}" placeholder="입장 코드" />
          <button class="secondary-btn" data-action="create-room">방 만들기</button>
          <button class="secondary-btn" data-action="join-room">코드 입장</button>
          ${connected ? `<button class="secondary-btn" data-action="copy-room-code">코드 복사</button><button class="danger-btn" data-action="leave-room">나가기</button>` : ""}
        </div>
        ${members.length ? `<div class="chips">${members.map((member) => `<span class="chip">${member.isHost ? icon("first", "sm") : icon("person", "sm")}${escapeHtml(member.name)}</span>`).join("")}</div>` : ""}
        ${roomSession.message ? `<div class="notice">${escapeHtml(roomSession.message)}</div>` : ""}
      </section>
    `;
  }

  function renderTopbar() {
    const current = getActiveTurnPlayer();
    const phaseLabel = state.phase === "harvest" ? "수확" : state.phase === "gameover" ? "종료" : "일하기";
    return `
      <header class="topbar">
        <div class="brand">
          <div class="brand-title">${icon("grain", "sm")} Agricola</div>
            <div class="brand-subtitle">${state.round} / 14 라운드 · ${phaseLabel} · 현재 턴 ${current ? escapeHtml(current.name) : "점수 계산"}</div>
        </div>
        <div class="top-actions">
          <button class="icon-btn" title="되돌리기" data-action="undo" ${state.history?.length ? "" : "disabled"}>↶</button>
          <button class="icon-btn" title="새 게임" data-action="ask-reset">×</button>
        </div>
      </header>
    `;
  }

  function renderTurnSnackbar() {
    if (!roomSession.code || canControlGame() || state.phase === "gameover") return "";
    const current = getActiveTurnPlayer();
    if (!current) return "";
    return `<div class="turn-snackbar" role="status" aria-live="polite"><span class="player-dot" style="background:${current.color}"></span>${escapeHtml(current.name)}님이 행동하고 있습니다.</div>`;
  }

  function renderTurnCard() {
    if (state.phase === "gameover") {
      return `
        <section class="turn-card">
          <div class="turn-head">
            <div class="turn-player">${icon("card")} 최종 점수</div>
            <div class="turn-meta">게임 종료</div>
          </div>
          <div class="chips">${state.players.map((p) => `<span class="chip"><span class="player-dot" style="background:${p.color}"></span>${escapeHtml(p.name)} ${scorePlayer(p).total}점</span>`).join("")}</div>
        </section>
      `;
    }

    if (state.phase === "harvest") {
      const p = state.players[state.harvest.playerIndex];
      return `
        <section class="turn-card">
          <div class="turn-head">
            <div class="turn-player"><span class="player-dot" style="background:${p.color}"></span>${escapeHtml(p.name)} 수확</div>
            <div class="turn-meta">필요 음식 ${foodNeed(p)}</div>
          </div>
          ${renderResourceChips(p)}
          <button class="primary-btn" data-action="open-harvest">먹이기 진행</button>
        </section>
      `;
    }

    const p = getCurrentPlayer();
    const workersLeft = p.family - p.placed;
    return `
      <section class="turn-card">
        <div class="turn-head">
          <div class="turn-player"><span class="player-dot" style="background:${p.color}"></span>${escapeHtml(p.name)}</div>
          <div class="turn-meta">가족 ${p.family}명 · 남은 일꾼 ${workersLeft}명</div>
        </div>
        ${renderResourceChips(p)}
      </section>
    `;
  }

  function renderResourceChips(player) {
    const overflow = ANIMALS.flatMap((animal) => {
      const n = unassignedAnimalCount(player, animal);
      return n > 0 ? [`<span class="chip warn">${icon(animal, "sm")} 미배치 ${n}</span>`] : [];
    }).join("");
    return `<div class="chips">${RESOURCE_ORDER.map((key) => `<span class="chip">${icon(key, "sm")}${LABELS[key]} ${player.resources[key] || 0}</span>`).join("")}${overflow}</div>`;
  }

  function renderTabbar() {
    const tabs = [
      ["board", "card", "행동"],
      ["farm", "field", "농장"],
      ["cards", "card", "카드"],
      ["score", "first", "점수"],
      ["log", "food", "기록"],
    ];
    return `
      <nav class="tabbar">
        ${tabs.map(([id, ic, label]) => `<button class="tab-btn ${state.activeTab === id ? "active" : ""}" data-action="tab" data-tab="${id}">${icon(ic, "sm")}<span>${label}</span></button>`).join("")}
      </nav>
    `;
  }

  function renderActiveTab() {
    switch (state.activeTab) {
      case "farm":
        return renderFarmTab();
      case "cards":
        return renderCardsTab();
      case "score":
        return renderScoreTab();
      case "log":
        return renderLogTab();
      default:
        return renderBoardTab();
    }
  }

  function renderBoardTab() {
    const spaces = getAvailableSpaces();
    return `
      <section class="board-grid">
        ${spaces.map(renderActionCard).join("")}
      </section>
    `;
  }

  function renderActionCard(space) {
    const claimedBy = state.claims?.[space.id];
    const claimedPlayer = claimedBy ? state.players.find((p) => p.id === claimedBy) : null;
    const pile = state.accum?.[space.id] || {};
    const tokenHtml = Object.entries(pile)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => `<span class="chip">${icon(key, "sm")}${value}</span>`)
      .join("");
    const fixedGain = space.gain ? Object.entries(space.gain).map(([key, value]) => `<span class="chip">${icon(key, "sm")}${value}</span>`).join("") : "";
    const disabled = !canControlGame() || state.phase !== "work" || claimedBy || getCurrentPlayer().placed >= getCurrentPlayer().family;
    return `
      <button class="action-card ${space.group === "round" ? "round" : ""} ${claimedBy ? "claimed" : ""}" data-action="open-action" data-space="${space.id}" ${disabled ? "disabled" : ""}>
        <div>
          <div class="title">${icon(space.icon)}<span>${escapeHtml(space.name)}</span></div>
          <div class="body">${escapeHtml(space.note || "")}</div>
        </div>
        <div class="tokens">${tokenHtml || fixedGain || `<span class="chip">${icon(space.icon, "sm")} 행동</span>`}</div>
        ${claimedPlayer ? `<span class="claim-mark" style="--player-color:${claimedPlayer.color}">${icon("person", "sm")}</span>` : ""}
      </button>
    `;
  }

  function renderFarmTab() {
    const p = state.players[state.viewedPlayer] || state.players[0];
    return `
      <section class="farm-layout">
        <div class="farm-panel">
          ${renderPlayerSwitcher()}
          <h2>${escapeHtml(p.name)} 농장</h2>
          ${renderFarmGrid(p)}
        </div>
        <div class="farm-panel">
          <h2>자원</h2>
          ${renderResourceBank(p)}
          <div class="farm-actions">
            <button class="secondary-btn" data-action="open-convert" data-player="${p.id}">변환</button>
            <button class="secondary-btn" data-action="open-animals" data-player="${p.id}">동물 배치</button>
          </div>
        </div>
      </section>
    `;
  }

  function renderPlayerSwitcher() {
    return `
      <div class="player-switcher">
        ${state.players.map((p, i) => `
          <button class="player-pill ${state.viewedPlayer === i ? "active" : ""}" data-action="view-player" data-index="${i}">
            <span class="player-dot" style="background:${p.color}"></span>${escapeHtml(p.name)}
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderFarmGrid(player, options = {}) {
    const modal = state.modal || {};
    const selected = new Set([
      ...(modal.cells || []),
      ...(modal.roomCells || []),
      ...(modal.stableCells || []),
      ...(modal.sowCells ? Object.keys(modal.sowCells).map(Number) : []),
      ...(modal.plowCell !== null && modal.plowCell !== undefined ? [modal.plowCell] : []),
    ]);
    return `
      <div class="farm-grid">
        ${player.farm.cells.map((cell, i) => renderFarmCell(player, cell, i, selected.has(i), options)).join("")}
      </div>
    `;
  }

  function renderFarmCell(player, cell, index, selected, options = {}) {
    const classes = ["farm-cell"];
    if (cell.type === "room") classes.push(`room-${player.farm.house}`);
    if (cell.type === "field") classes.push("field");
    if (cell.pastureId) classes.push("pasture");
    if (selected) classes.push("selected");
    const pasture = cell.pastureId ? player.farm.pastures.find((p) => p.id === cell.pastureId) : null;
    const cropIcon = cell.crop?.count ? icon(cell.crop.type, "lg") : "";
    const animalIcon = pasture?.animal && pasture.count ? icon(pasture.animal, "lg") : "";
    const stableAnimal = cell.stable && !cell.pastureId && cell.animal && cell.animalCount ? icon(cell.animal, "lg") : "";
    const content = cell.type === "room" ? icon("room", "lg") : cell.type === "field" ? cropIcon || icon("field", "lg") : animalIcon || stableAnimal || "";
    const label = cell.crop?.count ? cell.crop.count : pasture?.count ? pasture.count : cell.animalCount ? cell.animalCount : "";
    return `
      <button class="${classes.join(" ")}" data-action="${options.selectAction || "noop"}" data-cell="${index}" ${options.disabled ? "disabled" : ""}>
        ${content}
        ${cell.stable ? `<span class="stable-pin">${icon("stable", "sm")}</span>` : ""}
        ${label !== "" ? `<span class="cell-label">${label}</span>` : ""}
        ${renderCellFences(player.farm, index)}
      </button>
    `;
  }

  function renderCellFences(farm, index) {
    const dirs = ["top", "right", "bottom", "left"];
    return `<span class="fence-lines">${dirs.map((dir) => farm.fences.includes(edgeKey(index, dir)) ? `<span class="fence-edge ${dir}"></span>` : "").join("")}</span>`;
  }

  function renderResourceBank(player) {
    return `<div class="resource-bank">${RESOURCE_ORDER.map((key) => `
      <div class="bank-tile">${icon(key)} ${player.resources[key] || 0}<span>${LABELS[key]}</span></div>
    `).join("")}</div>`;
  }

  function renderCardsTab() {
    const viewer = state.players[state.viewedPlayer] || state.players[0];
    return `
      <section class="farm-layout">
        <div class="farm-panel">
          ${renderPlayerSwitcher()}
          <h2>${escapeHtml(viewer.name)} 사용 카드</h2>
          <div class="cards-grid">
            ${viewer.improvements.length || viewer.minorImprovements?.length || viewer.occupations.length
              ? `${viewer.improvements.map((id) => renderImprovementCard(getMajor(id), true)).join("")}${(viewer.minorImprovements || []).map(renderMinorCard).join("")}${viewer.occupations.map(renderOccupationCard).join("")}`
              : `<div class="empty-state">아직 사용한 카드가 없습니다.</div>`}
          </div>
        </div>
        <div class="farm-panel">
          <h2>대형 설비 시장</h2>
          <div class="cards-grid">${MAJOR_IMPROVEMENTS.map((card) => renderImprovementCard(card, isCardOwned(card.id))).join("")}</div>
        </div>
      </section>
    `;
  }

  function renderImprovementCard(card, owned = false, selectable = false) {
    if (!card) return "";
    const selected = state.modal?.selectedMajorId === card.id;
    return `
      <button class="improvement-card ${owned ? "owned" : ""} ${selected ? "active" : ""}" data-action="${selectable ? "select-major" : "noop"}" data-card="${card.id}" ${owned && selectable ? "disabled" : ""}>
        <div class="card-top">
          <div>
            <div class="card-title">${escapeHtml(card.name)}</div>
            <div class="card-type">${escapeHtml(card.type)} · ${card.points}점</div>
          </div>
          ${icon(card.icon)}
        </div>
        <div class="cost-row">${renderCost(card.cost)}${card.exchange ? `<span class="chip">${icon("food", "sm")}교환 가능</span>` : ""}</div>
        <div class="card-effect">${escapeHtml(card.effect)}</div>
      </button>
    `;
  }

  function renderOccupationCard(card) {
    return `
      <div class="improvement-card owned">
        <div class="card-top">
          <div>
            <div class="card-title">${escapeHtml(card.name)}</div>
            <div class="card-type">직업</div>
          </div>
          ${icon("person")}
        </div>
        <div class="card-effect">${escapeHtml(card.note || "수동 등록된 직업 카드")}</div>
      </div>
    `;
  }

  function renderMinorCard(card) {
    return `
      <div class="improvement-card owned">
        <div class="card-top">
          <div>
            <div class="card-title">${escapeHtml(card.name)}</div>
            <div class="card-type">보조 설비 · ${Number(card.points) || 0}점</div>
          </div>
          ${icon("card")}
        </div>
        <div class="card-effect">${escapeHtml(card.note || "수동 등록된 보조 설비 카드")}</div>
      </div>
    `;
  }

  function renderScoreTab() {
    const scores = [...state.players].map((p) => ({ player: p, score: scorePlayer(p) })).sort((a, b) => b.score.total - a.score.total);
    return `
      <section class="score-list">
        ${scores.map(({ player, score }) => `
          <div class="score-row">
            <div>
              <strong><span class="player-dot" style="background:${player.color}"></span> ${escapeHtml(player.name)}</strong>
              <div class="score-detail">${score.details.join(" · ")}</div>
            </div>
            <strong>${score.total}</strong>
          </div>
        `).join("")}
      </section>
    `;
  }

  function renderLogTab() {
    return `<section class="log-list">${(state.log || []).slice().reverse().map((entry) => `<div class="log-entry">${escapeHtml(entry)}</div>`).join("")}</section>`;
  }

  function renderModal() {
    const modal = state.modal;
    if (modal.type === "reset") return renderResetModal();
    if (modal.type === "action") return renderActionModal(modal);
    if (modal.type === "harvest") return renderHarvestModal();
    if (modal.type === "convert") return renderConvertModal(modal);
    if (modal.type === "animals") return renderAnimalsModal(modal);
    return "";
  }

  function modalShell(title, subtitle, body, actions) {
    return `
      <div class="modal-backdrop" data-action="close-modal">
        <section class="modal-sheet" role="dialog" aria-modal="true">
          <div class="modal-head">
            <div>
              <h2 class="modal-title">${title}</h2>
              ${subtitle ? `<div class="modal-subtitle">${subtitle}</div>` : ""}
            </div>
            <button class="icon-btn" data-action="close-modal" title="닫기">×</button>
          </div>
          <div class="modal-body">${body}</div>
          <div class="modal-actions">${actions}</div>
        </section>
      </div>
    `;
  }

  function renderResetModal() {
    return modalShell(
      "새 게임으로 초기화",
      "현재 진행은 브라우저 저장소에서 지워집니다.",
      `<div class="notice">필요하면 먼저 점수 탭에서 현재 결과를 확인하세요.</div>`,
      `<button class="secondary-btn" data-action="close-modal">취소</button><button class="danger-btn" data-action="reset-game">초기화</button>`
    );
  }

  function renderActionModal(modal) {
    const space = getSpace(modal.spaceId);
    const player = getCurrentPlayer();
    const body = renderActionBody(space, player, modal);
    const canConfirm = canConfirmAction(space, player, modal);
    return modalShell(
      escapeHtml(space.name),
      `${escapeHtml(player.name)} · ${escapeHtml(space.note || "")}`,
      body,
      `<button class="secondary-btn" data-action="close-modal">취소</button><button class="primary-btn" data-action="confirm-action" ${canConfirm ? "" : "disabled"}>실행</button>`
    );
  }

  function renderActionBody(space, player, modal) {
    if (space.kind === "accum") {
      const pile = state.accum?.[space.id] || {};
      return `<div class="notice">획득: ${renderCost(pile) || "없음"}</div>${renderAnimalOverflowNotice(player, pile)}`;
    }
    if (space.kind === "gain") {
      return `<div class="notice">획득: ${renderCost(space.gain)}</div>${renderAnimalOverflowNotice(player, space.gain)}`;
    }
    if (space.kind === "meeting") {
      return `
        <div class="notice">시작 플레이어 마커를 가져옵니다. 보조 설비는 선택 사항입니다.</div>
        ${renderMinorFields(modal)}
      `;
    }
    if (space.kind === "occupation" || space.kind === "occupationPaid") {
      const cost = occupationCost(player, space.kind);
      return `
        <div class="notice">비용: ${cost ? `${cost} 음식` : "없음"}</div>
        <div class="form-row">
          <label>카드 이름</label>
          <input class="text-input" data-action="modal-field" data-field="occupationName" value="${escapeHtml(modal.occupationName || "")}" placeholder="직업 카드명" />
        </div>
        <div class="form-row">
          <label>메모</label>
          <input class="text-input" data-action="modal-field" data-field="occupationNote" value="${escapeHtml(modal.occupationNote || "")}" placeholder="효과 요약" />
        </div>
      `;
    }
    if (space.kind === "plow") {
      return `
        <div class="notice">밭으로 만들 빈 농장 칸을 1개 선택하세요.</div>
        ${renderFarmGrid(player, { selectAction: "select-plow-cell" })}
      `;
    }
    if (space.kind === "build") {
      const roomCost = costForRooms(player, modal.roomCells?.length || 0);
      const stableCost = { wood: (modal.stableCells?.length || 0) * 2 };
      return `
        <div class="two-col">
          <button class="seg-btn ${modal.buildMode === "room" ? "active" : ""}" data-action="build-mode" data-mode="room">${icon("room", "sm")} 방</button>
          <button class="seg-btn ${modal.buildMode === "stable" ? "active" : ""}" data-action="build-mode" data-mode="stable">${icon("stable", "sm")} 마구간</button>
        </div>
        <div class="notice">현재 비용: ${renderCost(addCosts(roomCost, stableCost)) || "선택 없음"}</div>
        ${renderFarmGrid(player, { selectAction: "select-build-cell" })}
      `;
    }
    if (space.kind === "fences") {
      const cells = modal.cells || [];
      const cost = fenceCost(player.farm, cells);
      const validation = validatePastureSelection(player.farm, cells);
      return `
        <div class="notice">목초지로 둘러쌀 빈 칸을 선택하세요. 비용: ${cost} 나무${validation ? "" : " · 연결된 빈 칸만 가능"}</div>
        ${renderFarmGrid(player, { selectAction: "select-pasture-cell" })}
      `;
    }
    if (space.kind === "major") {
      return `
        <div class="cards-grid">
          ${MAJOR_IMPROVEMENTS.map((card) => renderImprovementCard(card, isCardOwned(card.id), true)).join("")}
        </div>
      `;
    }
    if (space.kind === "family") {
      const rooms = roomCount(player);
      const allowed = canGrowFamily(player, !space.needRoom);
      return `<div class="notice">방 ${rooms}칸 · 가족 ${player.family}명 · ${allowed ? "가족 1명을 추가합니다." : "현재는 가족을 늘릴 수 없습니다."}</div>`;
    }
    if (space.kind === "renovate" || space.kind === "renovateFences") {
      const cost = renovationCost(player);
      const can = cost && canPay(player, cost);
      const selectedMajor = modal.selectedMajorId ? getMajor(modal.selectedMajorId) : null;
      const extraCost = selectedMajor ? cardPaymentCost(player, selectedMajor) : {};
      const fenceCells = modal.cells || [];
      const fenceWood = space.kind === "renovateFences" ? fenceCost(player.farm, fenceCells) : 0;
      return `
        <div class="notice">${can ? `집 고치기 비용: ${renderCost(cost)}` : "현재 집은 고칠 수 없거나 자원이 부족합니다."}</div>
        ${space.allowMajor ? `
          <div class="option-grid">
            <button class="option-card ${!selectedMajor ? "active" : ""}" data-action="select-major" data-card="">설비 없이 진행</button>
            ${MAJOR_IMPROVEMENTS.map((card) => renderImprovementCard(card, isCardOwned(card.id), true)).join("")}
          </div>
          <div class="notice">선택 설비 비용: ${renderCost(extraCost) || "없음"}</div>
          ${renderMinorFields(modal)}
        ` : ""}
        ${space.kind === "renovateFences" ? `
          <div class="notice">추가 울타리 비용: ${fenceWood} 나무</div>
          ${renderFarmGrid(player, { selectAction: "select-pasture-cell" })}
        ` : ""}
      `;
    }
    if (space.kind === "sowBake" || space.kind === "plowSow") {
      return renderSowBakeBody(space, player, modal);
    }
    return `<div class="notice">이 행동은 준비 중입니다.</div>`;
  }

  function renderSowBakeBody(space, player, modal) {
    const sowCells = modal.sowCells || {};
    const bake = modal.bake || {};
    const bakeOptions = getBakeOptions(player);
    return `
      ${space.kind === "plowSow" ? `<div class="notice">새로 갈 밭 1개를 선택한 뒤, 빈 밭에 심을 작물을 순환 선택하세요.</div>` : `<div class="notice">빈 밭을 눌러 곡식, 채소, 선택 없음을 순환합니다.</div>`}
      ${renderFarmGrid(player, { selectAction: space.kind === "plowSow" ? "select-plow-sow-cell" : "cycle-sow-cell" })}
      <div class="chips">
        ${Object.entries(sowCells).map(([idx, crop]) => `<span class="chip">${Number(idx) + 1}칸 ${icon(crop, "sm")}${LABELS[crop]}</span>`).join("")}
      </div>
      ${bakeOptions.length ? `
        <div class="option-grid">
          ${bakeOptions.map((opt) => renderBakeStepper(opt, bake[opt.id] || 0, player)).join("")}
        </div>
      ` : `<div class="notice">빵 굽기 설비가 없습니다.</div>`}
    `;
  }

  function renderMinorFields(modal) {
    return `
      <div class="form-row">
        <label>보조 설비 이름</label>
        <input class="text-input" data-action="modal-field" data-field="minorName" value="${escapeHtml(modal.minorName || "")}" placeholder="선택 사항" />
      </div>
      <div class="two-col">
        <div class="form-row">
          <label>점수</label>
          <input class="number-input" type="number" min="0" max="10" data-action="modal-field" data-field="minorPoints" value="${escapeHtml(modal.minorPoints || "0")}" />
        </div>
        <div class="form-row">
          <label>메모</label>
          <input class="text-input" data-action="modal-field" data-field="minorNote" value="${escapeHtml(modal.minorNote || "")}" placeholder="효과 요약" />
        </div>
      </div>
    `;
  }

  function renderBakeStepper(opt, value, player) {
    const limit = opt.max === null ? player.resources.grain : opt.max;
    return `
      <div class="stepper-row">
        <div class="label">${icon(opt.icon, "sm")}${escapeHtml(opt.name)} · 곡식당 ${opt.food} 음식</div>
        <button class="small-btn" data-action="bake-step" data-card="${opt.id}" data-delta="-1" ${value <= 0 ? "disabled" : ""}>-</button>
        <strong>${value}</strong>
        <button class="small-btn" data-action="bake-step" data-card="${opt.id}" data-delta="1" ${value >= limit ? "disabled" : ""}>+</button>
      </div>
    `;
  }

  function renderAnimalOverflowNotice(player, gain = {}) {
    const parts = ANIMALS.map((animal) => {
      const n = gain[animal] || 0;
      if (!n) return "";
      const capacity = freeAnimalCapacity(player, animal);
      return capacity < n ? `<span class="chip warn">${LABELS[animal]} ${n - capacity}마리 초과 예상</span>` : "";
    }).join("");
    return parts ? `<div class="chips">${parts}</div>` : "";
  }

  function renderHarvestModal() {
    const p = state.players[state.harvest.playerIndex];
    const need = foodNeed(p);
    const short = Math.max(0, need - p.resources.food);
    return modalShell(
      `${escapeHtml(p.name)} 먹이기`,
      `필요 음식 ${need} · 보유 음식 ${p.resources.food}`,
      `
        ${renderResourceChips(p)}
        ${short ? `<div class="notice">부족분 ${short}개는 구걸 카드로 처리됩니다. 변환 버튼으로 먼저 음식을 만들 수 있습니다.</div>` : `<div class="notice">충분한 음식이 있습니다.</div>`}
        <button class="secondary-btn" data-action="open-convert" data-player="${p.id}">변환</button>
      `,
      `<button class="secondary-btn" data-action="close-modal">닫기</button><button class="primary-btn" data-action="confirm-harvest-feed">먹이기 완료</button>`
    );
  }

  function renderConvertModal(modal) {
    const p = state.players.find((player) => player.id === modal.playerId) || getCurrentPlayer();
    const conversions = modal.conversions || {};
    const rates = bestCookRates(p);
    const rows = [
      { key: "grain", rate: 1, icon: "grain" },
      { key: "vegetable", rate: rates.vegetable || 1, icon: "vegetable" },
      ...ANIMALS.map((animal) => ({ key: animal, rate: rates[animal] || 0, icon: animal })).filter((row) => row.rate > 0),
    ];
    const totalFood = rows.reduce((sum, row) => sum + (conversions[row.key] || 0) * row.rate, 0);
    return modalShell(
      `${escapeHtml(p.name)} 변환`,
      totalFood ? `음식 ${totalFood}개 생성` : "음식 변환",
      `
        <div class="option-grid">
          ${rows.map((row) => {
            const value = conversions[row.key] || 0;
            const max = p.resources[row.key] || 0;
            return `
              <div class="stepper-row">
                <div class="label">${icon(row.icon, "sm")}${LABELS[row.key]} · ${row.rate} 음식</div>
                <button class="small-btn" data-action="convert-step" data-resource="${row.key}" data-delta="-1" ${value <= 0 ? "disabled" : ""}>-</button>
                <strong>${value}</strong>
                <button class="small-btn" data-action="convert-step" data-resource="${row.key}" data-delta="1" ${value >= max ? "disabled" : ""}>+</button>
              </div>
            `;
          }).join("")}
        </div>
      `,
      `<button class="secondary-btn" data-action="close-modal">취소</button><button class="primary-btn" data-action="confirm-convert" ${totalFood ? "" : "disabled"}>변환</button>`
    );
  }

  function renderAnimalsModal(modal) {
    const p = state.players.find((player) => player.id === modal.playerId) || state.players[state.viewedPlayer];
    const draft = modal.draft || animalDraftFromFarm(p);
    const holdings = animalHoldings(p);
    const totals = ANIMALS.map((animal) => {
      const assigned = Object.values(draft).filter((h) => h.animal === animal).reduce((sum, h) => sum + h.count, 0);
      return `<span class="chip ${assigned > p.resources[animal] ? "warn" : ""}">${icon(animal, "sm")}${assigned}/${p.resources[animal]}</span>`;
    }).join("");
    return modalShell(
      `${escapeHtml(p.name)} 동물 배치`,
      "목초지, 외양간, 집 안 애완동물",
      `
        <div class="chips">${totals}</div>
        <div class="option-grid">
          ${holdings.map((holding) => renderHoldingEditor(holding, draft[holding.id] || { animal: "", count: 0 })).join("")}
        </div>
      `,
      `<button class="secondary-btn" data-action="close-modal">취소</button><button class="primary-btn" data-action="confirm-animals" ${validateAnimalDraft(p, draft) ? "" : "disabled"}>저장</button>`
    );
  }

  function renderHoldingEditor(holding, draft) {
    const animal = draft.animal || "";
    const count = draft.count || 0;
    const cap = holding.capacity;
    return `
      <div class="option-card">
        <div class="option-title">${icon(holding.icon, "sm")}${escapeHtml(holding.name)} · ${cap}칸</div>
        <select class="select-input" data-action="holding-animal" data-holding="${holding.id}">
          <option value="">비움</option>
          ${ANIMALS.map((a) => `<option value="${a}" ${animal === a ? "selected" : ""}>${LABELS[a]}</option>`).join("")}
        </select>
        <div class="stepper-row">
          <span class="label">${animal ? LABELS[animal] : "마릿수"}</span>
          <button class="small-btn" data-action="holding-step" data-holding="${holding.id}" data-delta="-1" ${count <= 0 ? "disabled" : ""}>-</button>
          <strong>${count}</strong>
          <button class="small-btn" data-action="holding-step" data-holding="${holding.id}" data-delta="1" ${!animal || count >= cap ? "disabled" : ""}>+</button>
        </div>
      </div>
    `;
  }

  function handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "noop") return;
    if (action === "close-modal" && target.classList.contains("modal-backdrop") && event.target !== target) return;

    if (action === "setup-count") {
      state.setup.count = Number(target.dataset.count);
      saveState();
      render();
      return;
    }
    if (action === "create-room") return createSocketRoom();
    if (action === "join-room") return joinSocketRoom();
    if (action === "leave-room") return leaveSocketRoom();
    if (action === "copy-room-code") return copyRoomCode();
    if (action === "start-game") {
      if (!canControlGame()) return showRoomMessage("방장만 게임을 시작할 수 있습니다.");
      return commit(() => startGame());
    }
    if (action === "tab") {
      state.activeTab = target.dataset.tab;
      saveState();
      render();
      return;
    }
    if (action === "view-player") {
      state.viewedPlayer = Number(target.dataset.index);
      saveState();
      render();
      return;
    }
    if (action === "open-action") {
      if (!canControlGame()) return showRoomMessage("방장만 행동을 선택할 수 있습니다.");
      openAction(target.dataset.space);
      return;
    }
    if (action === "close-modal") {
      state.modal = null;
      saveState();
      render();
      return;
    }
    if (action === "ask-reset") {
      state.modal = { type: "reset" };
      saveState();
      render();
      return;
    }
    if (action === "reset-game") {
      state = defaultState();
      saveState();
      render();
      return;
    }
    if (action === "undo") {
      undo();
      return;
    }
    if (action === "confirm-action") {
      if (!canControlGame()) return showRoomMessage("방장만 진행할 수 있습니다.");
      return commit(() => confirmAction());
    }
    if (action === "open-harvest") {
      state.modal = { type: "harvest" };
      saveState();
      render();
      return;
    }
    if (action === "confirm-harvest-feed") {
      if (!canControlGame()) return showRoomMessage("방장만 수확을 진행할 수 있습니다.");
      return commit(() => confirmHarvestFeed());
    }
    if (action === "open-convert") {
      state.modal = { type: "convert", playerId: target.dataset.player, conversions: {} };
      saveState();
      render();
      return;
    }
    if (action === "confirm-convert") {
      if (!canControlGame()) return showRoomMessage("방장만 변환을 확정할 수 있습니다.");
      return commit(() => confirmConvert());
    }
    if (action === "open-animals") {
      const p = state.players.find((player) => player.id === target.dataset.player);
      state.modal = { type: "animals", playerId: target.dataset.player, draft: animalDraftFromFarm(p) };
      saveState();
      render();
      return;
    }
    if (action === "confirm-animals") {
      if (!canControlGame()) return showRoomMessage("방장만 동물 배치를 저장할 수 있습니다.");
      return commit(() => confirmAnimals());
    }

    if (!state.modal) return;
    handleModalClick(action, target);
  }

  function handleModalClick(action, target) {
    const modal = state.modal;
    if (action === "select-plow-cell") {
      modal.plowCell = Number(target.dataset.cell);
    }
    if (action === "build-mode") {
      modal.buildMode = target.dataset.mode;
    }
    if (action === "select-build-cell") {
      toggleBuildCell(Number(target.dataset.cell));
    }
    if (action === "select-pasture-cell") {
      toggleArrayValue(modal, "cells", Number(target.dataset.cell));
    }
    if (action === "select-major") {
      modal.selectedMajorId = target.dataset.card || "";
    }
    if (action === "select-plow-sow-cell") {
      const cell = Number(target.dataset.cell);
      if (modal.plowCell === cell) {
        cycleSowCell(cell);
      } else if (canPlowCell(getCurrentPlayer(), cell)) {
        modal.plowCell = cell;
      } else {
        cycleSowCell(cell);
      }
    }
    if (action === "cycle-sow-cell") {
      cycleSowCell(Number(target.dataset.cell));
    }
    if (action === "bake-step") {
      stepBake(target.dataset.card, Number(target.dataset.delta));
    }
    if (action === "convert-step") {
      stepConvert(target.dataset.resource, Number(target.dataset.delta));
    }
    if (action === "holding-step") {
      stepHolding(target.dataset.holding, Number(target.dataset.delta));
    }
    saveState();
    render();
  }

  function handleInput(event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "setup-name") {
      state.setup.names[Number(target.dataset.index)] = target.value;
      saveState();
      return;
    }
    if (action === "room-name") {
      roomSession.name = target.value;
      localStorage.setItem(ROOM_NAME_KEY, roomSession.name);
      return;
    }
    if (action === "room-code") {
      roomSession.joinCode = target.value.toUpperCase();
      return;
    }
    if (action === "modal-field" && state.modal) {
      state.modal[target.dataset.field] = target.value;
      saveState();
      return;
    }
    if (action === "holding-animal" && state.modal?.type === "animals") {
      const id = target.dataset.holding;
      state.modal.draft[id] ||= { animal: "", count: 0 };
      state.modal.draft[id].animal = target.value;
      if (!target.value) state.modal.draft[id].count = 0;
      saveState();
      render();
    }
  }

  function openAction(spaceId) {
    const space = getSpace(spaceId);
    if (!space || state.phase !== "work" || state.claims[spaceId]) return;
    state.modal = {
      type: "action",
      spaceId,
      buildMode: "room",
      roomCells: [],
      stableCells: [],
      cells: [],
      plowCell: null,
      sowCells: {},
      bake: {},
      selectedMajorId: "",
    };
    saveState();
    render();
  }

  function commit(mutator) {
    const mayPublish = canControlGame();
    const before = JSON.stringify({ ...state, modal: state.modal });
    try {
      state.history = [...(state.history || []), before].slice(-30);
      mutator();
      saveState(mayPublish);
    } catch (error) {
      console.error(error);
      state = hydrateState(JSON.parse(before));
      addLog(`오류: ${error.message || "실행할 수 없습니다."}`);
      roomSession.message = error.message || "실행할 수 없습니다.";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    render();
  }

  function undo() {
    if (!state.history?.length) return;
    const previous = state.history.pop();
    state = JSON.parse(previous);
    saveState();
    render();
  }

  function startGame() {
    const count = state.setup.count;
    const names = state.setup.names;
    state = {
      ...defaultState(),
      started: true,
      playerCount: count,
      round: 0,
      phase: "work",
      startingPlayer: 0,
      currentPlayer: 0,
      viewedPlayer: 0,
      activeTab: "board",
      roundDeck: buildRoundDeck(),
      revealedRoundIds: [],
      claims: {},
      accum: {},
      scheduledFood: [],
      majorMarket: MAJOR_IMPROVEMENTS.map((card) => card.id),
      players: Array.from({ length: count }, (_, i) => createPlayer(i, names[i] || `${i + 1}번 농장`, i === 0 ? 2 : 3)),
      log: [],
      history: [],
    };
    addLog(`${count}인 게임을 시작했습니다.`);
    startNextRound();
  }

  function buildRoundDeck() {
    return ROUND_STAGES.flatMap((stage) => shuffle(stage.map((card) => card.id)));
  }

  function shuffle(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function createPlayer(index, name, food) {
    const cells = Array.from({ length: FARM_ROWS * FARM_COLS }, () => ({
      type: "empty",
      stable: false,
      pastureId: null,
      animal: null,
      animalCount: 0,
      crop: null,
    }));
    cells[0].type = "room";
    cells[5].type = "room";
    return {
      id: `p${index + 1}`,
      name,
      color: PLAYER_COLORS[index],
      resources: Object.fromEntries(RESOURCE_ORDER.map((key) => [key, key === "food" ? food : 0])),
      family: 2,
      placed: 0,
      newborns: 0,
      beggars: 0,
      fencesLeft: 15,
      stablesLeft: MAX_STABLES,
      occupations: [],
      minorImprovements: [],
      improvements: [],
      farm: {
        house: "wood",
        cells,
        fences: [],
        pastures: [],
        homePet: { animal: "", count: 0 },
      },
    };
  }

  function startNextRound() {
    state.round += 1;
    if (state.round > 14) {
      finishGame();
      return;
    }
    state.phase = "work";
    state.claims = {};
    state.players.forEach((p) => {
      p.placed = 0;
      p.newborns = 0;
    });
    const cardId = state.roundDeck[state.round - 1];
    state.revealedRoundIds.push(cardId);
    deliverScheduledFood();
    getAvailableSpaces().forEach((space) => {
      if (!space.accum) return;
      state.accum[space.id] ||= {};
      Object.entries(space.accum).forEach(([key, value]) => {
        state.accum[space.id][key] = (state.accum[space.id][key] || 0) + value;
      });
    });
    state.currentPlayer = state.startingPlayer;
    const card = getSpace(cardId);
    addLog(`${state.round}라운드: ${card.name} 공개.`);
  }

  function deliverScheduledFood() {
    const due = state.scheduledFood.filter((item) => item.round === state.round);
    due.forEach((item) => {
      const p = state.players.find((player) => player.id === item.playerId);
      if (p) p.resources.food += item.amount;
      if (p) addLog(`${p.name} 우물 음식 ${item.amount}개 획득.`);
    });
    state.scheduledFood = state.scheduledFood.filter((item) => item.round !== state.round);
  }

  function confirmAction() {
    const modal = state.modal;
    const space = getSpace(modal.spaceId);
    const player = getCurrentPlayer();
    if (!canConfirmAction(space, player, modal)) return;

    if (space.kind === "accum") {
      const pile = state.accum[space.id] || {};
      gainBundle(player, pile);
      state.accum[space.id] = {};
      addLog(`${player.name}: ${space.name}에서 ${bundleText(pile)} 획득.`);
    }
    if (space.kind === "gain") {
      gainBundle(player, space.gain);
      addLog(`${player.name}: ${space.name}에서 ${bundleText(space.gain)} 획득.`);
    }
    if (space.kind === "meeting") {
      state.startingPlayer = state.players.indexOf(player);
      addMinorIfPresent(player, modal);
      addLog(`${player.name}: 시작 플레이어가 되었습니다.`);
    }
    if (space.kind === "occupation" || space.kind === "occupationPaid") {
      const cost = occupationCost(player, space.kind);
      if (cost) player.resources.food -= cost;
      player.occupations.push({ name: modal.occupationName.trim(), note: modal.occupationNote?.trim() || "" });
      addLog(`${player.name}: 직업 ${modal.occupationName.trim()} 사용.`);
    }
    if (space.kind === "plow") {
      plowCell(player, modal.plowCell);
      addLog(`${player.name}: 밭 1개를 갈았습니다.`);
    }
    if (space.kind === "build") {
      buildRoomsAndStables(player, modal.roomCells || [], modal.stableCells || []);
      addLog(`${player.name}: 방 ${modal.roomCells.length}개, 마구간 ${modal.stableCells.length}개 건설.`);
    }
    if (space.kind === "fences") {
      buildPasture(player, modal.cells || []);
      addLog(`${player.name}: 목초지 1개를 만들었습니다.`);
    }
    if (space.kind === "major") {
      purchaseMajor(player, modal.selectedMajorId);
      addLog(`${player.name}: ${getMajor(modal.selectedMajorId).name} 건설.`);
    }
    if (space.kind === "family") {
      player.family += 1;
      player.newborns += 1;
      addLog(`${player.name}: 가족이 ${player.family}명이 되었습니다.`);
    }
    if (space.kind === "renovate" || space.kind === "renovateFences") {
      renovate(player);
      if (modal.selectedMajorId) {
        purchaseMajor(player, modal.selectedMajorId);
      }
      addMinorIfPresent(player, modal);
      if (space.kind === "renovateFences" && modal.cells?.length) {
        buildPasture(player, modal.cells);
      }
      addLog(`${player.name}: 집을 고쳤습니다.`);
    }
    if (space.kind === "sowBake" || space.kind === "plowSow") {
      if (space.kind === "plowSow" && modal.plowCell !== null && modal.plowCell !== undefined) {
        plowCell(player, modal.plowCell);
      }
      sowSelected(player, modal.sowCells || {});
      bakeSelected(player, modal.bake || {});
      addLog(`${player.name}: 씨 뿌리기/빵 굽기를 실행했습니다.`);
    }

    claimAndAdvance(space.id, player);
  }

  function claimAndAdvance(spaceId, player) {
    state.claims[spaceId] = player.id;
    player.placed += 1;
    state.modal = null;
    if (allWorkersPlaced()) {
      endWorkPhase();
      return;
    }
    advanceCurrentPlayer();
  }

  function advanceCurrentPlayer() {
    for (let i = 1; i <= state.players.length; i += 1) {
      const idx = (state.currentPlayer + i) % state.players.length;
      const p = state.players[idx];
      if (p.placed < p.family) {
        state.currentPlayer = idx;
        state.viewedPlayer = idx;
        return;
      }
    }
  }

  function allWorkersPlaced() {
    return state.players.every((p) => p.placed >= p.family);
  }

  function endWorkPhase() {
    addLog(`${state.round}라운드 일하기 종료.`);
    if (HARVEST_AFTER.includes(state.round)) {
      beginHarvest();
    } else {
      startNextRound();
    }
  }

  function beginHarvest() {
    harvestFields();
    state.phase = "harvest";
    state.harvest = { playerIndex: state.startingPlayer, fed: [] };
    state.modal = { type: "harvest" };
    addLog(`${state.round}라운드 수확 시작.`);
  }

  function harvestFields() {
    state.players.forEach((p) => {
      p.farm.cells.forEach((cell) => {
        if (cell.type === "field" && cell.crop?.count > 0) {
          p.resources[cell.crop.type] += 1;
          cell.crop.count -= 1;
          if (cell.crop.count === 0) cell.crop = null;
        }
      });
    });
  }

  function confirmHarvestFeed() {
    const p = state.players[state.harvest.playerIndex];
    const need = foodNeed(p);
    if (p.resources.food >= need) {
      p.resources.food -= need;
      addLog(`${p.name}: 음식 ${need}개로 가족을 먹였습니다.`);
    } else {
      const missing = need - p.resources.food;
      p.resources.food = 0;
      p.beggars += missing;
      addLog(`${p.name}: 음식 ${missing}개 부족으로 구걸 카드 ${missing}장.`);
    }
    nextHarvestPlayer();
  }

  function nextHarvestPlayer() {
    state.harvest.fed.push(state.players[state.harvest.playerIndex].id);
    const total = state.players.length;
    for (let step = 1; step <= total; step += 1) {
      const idx = (state.harvest.playerIndex + step) % total;
      if (!state.harvest.fed.includes(state.players[idx].id)) {
        state.harvest.playerIndex = idx;
        state.modal = { type: "harvest" };
        return;
      }
    }
    breedAnimals();
    state.modal = null;
    delete state.harvest;
    if (state.round === 14) {
      finishGame();
    } else {
      startNextRound();
    }
  }

  function breedAnimals() {
    state.players.forEach((p) => {
      ANIMALS.forEach((animal) => {
        if ((p.resources[animal] || 0) >= 2 && freeAnimalCapacity(p, animal) > 0) {
          p.resources[animal] += 1;
          autoPlaceAnimals(p, animal);
          addLog(`${p.name}: ${LABELS[animal]} 새끼 1마리.`);
        }
      });
    });
  }

  function finishGame() {
    state.phase = "gameover";
    state.modal = null;
    state.currentPlayer = 0;
    state.activeTab = "score";
    addLog("게임이 종료되었습니다.");
  }

  function getAvailableSpaces() {
    return [
      ...BASE_SPACES,
      ...EXTRA_SPACES.filter((space) => state.playerCount >= space.minPlayers),
      ...state.revealedRoundIds.map((id) => ({ ...ROUND_SPACE_BY_ID[id], group: "round" })),
    ];
  }

  function getSpace(spaceId) {
    return getAvailableSpaces().find((space) => space.id === spaceId) || ROUND_SPACE_BY_ID[spaceId];
  }

  function getCurrentPlayer() {
    return state.players?.[state.currentPlayer];
  }

  function getMajor(id) {
    return MAJOR_IMPROVEMENTS.find((card) => card.id === id);
  }

  function isCardOwned(id) {
    return state.players?.some((p) => p.improvements.includes(id));
  }

  function canConfirmAction(space, player, modal) {
    if (!space || !player) return false;
    if (space.kind === "accum") return Object.values(state.accum?.[space.id] || {}).some((v) => v > 0);
    if (space.kind === "gain" || space.kind === "meeting") return true;
    if (space.kind === "occupation" || space.kind === "occupationPaid") {
      return Boolean(modal.occupationName?.trim()) && player.resources.food >= occupationCost(player, space.kind);
    }
    if (space.kind === "plow") return canPlowCell(player, modal.plowCell);
    if (space.kind === "build") return canBuildSelection(player, modal.roomCells || [], modal.stableCells || []);
    if (space.kind === "fences") return canBuildPasture(player, modal.cells || []);
    if (space.kind === "major") return canPurchaseMajor(player, modal.selectedMajorId);
    if (space.kind === "family") return canGrowFamily(player, !space.needRoom);
    if (space.kind === "renovate") {
      const cost = renovationCost(player);
      if (!cost || !canPay(player, cost)) return false;
      if (modal.selectedMajorId && modal.minorName?.trim()) return false;
      if (modal.selectedMajorId && !canPurchaseMajor(player, modal.selectedMajorId, cost)) return false;
      return true;
    }
    if (space.kind === "renovateFences") {
      const cost = renovationCost(player);
      if (!cost || !canPay(player, addCosts(cost, { wood: fenceCost(player.farm, modal.cells || []) }))) return false;
      return !modal.cells?.length || canBuildPasture(player, modal.cells, cost);
    }
    if (space.kind === "sowBake" || space.kind === "plowSow") {
      const sowCost = sowSelectionCost(modal.sowCells || {});
      const bakeGrain = Object.values(modal.bake || {}).reduce((sum, n) => sum + n, 0);
      const plowOk = space.kind !== "plowSow" || modal.plowCell === null || modal.plowCell === undefined || canPlowCell(player, modal.plowCell);
      const sowOk = validSowSelection(player, modal.sowCells || {}, modal.plowCell);
      const something = Object.keys(modal.sowCells || {}).length || bakeGrain || (space.kind === "plowSow" && modal.plowCell !== null && modal.plowCell !== undefined);
      return plowOk && sowOk && something && canPay(player, addCosts(sowCost, { grain: bakeGrain }));
    }
    return false;
  }

  function occupationCost(player, kind) {
    if (kind === "occupationPaid") return 2;
    return player.occupations.length === 0 ? 0 : 1;
  }

  function addMinorIfPresent(player, modal) {
    const name = modal.minorName?.trim();
    if (!name) return;
    player.minorImprovements ||= [];
    player.minorImprovements.push({
      name,
      points: Number(modal.minorPoints) || 0,
      note: modal.minorNote?.trim() || "",
    });
    addLog(`${player.name}: 보조 설비 ${name} 사용.`);
  }

  function canPlowCell(player, cellIndex) {
    const cell = player.farm.cells[cellIndex];
    return Boolean(cell && cell.type === "empty" && !cell.pastureId);
  }

  function plowCell(player, cellIndex) {
    const cell = player.farm.cells[cellIndex];
    cell.type = "field";
    cell.crop = null;
    cell.stable = false;
  }

  function toggleBuildCell(cellIndex) {
    const modal = state.modal;
    const player = getCurrentPlayer();
    const cell = player.farm.cells[cellIndex];
    if (!cell) return;
    if (modal.buildMode === "room") {
      if (cell.type !== "empty" || cell.pastureId || cell.stable) return;
      toggleArrayValue(modal, "roomCells", cellIndex);
      modal.stableCells = (modal.stableCells || []).filter((id) => id !== cellIndex);
      return;
    }
    if (cell.type === "room" || cell.type === "field" || cell.stable) return;
    toggleArrayValue(modal, "stableCells", cellIndex);
    modal.roomCells = (modal.roomCells || []).filter((id) => id !== cellIndex);
  }

  function canBuildSelection(player, rooms, stables) {
    if (!rooms.length && !stables.length) return false;
    if (stables.length > player.stablesLeft) return false;
    if (!validRoomSelection(player.farm, rooms)) return false;
    const cost = addCosts(costForRooms(player, rooms.length), { wood: stables.length * 2 });
    return canPay(player, cost);
  }

  function buildRoomsAndStables(player, rooms, stables) {
    payCost(player, addCosts(costForRooms(player, rooms.length), { wood: stables.length * 2 }));
    rooms.forEach((idx) => {
      player.farm.cells[idx].type = "room";
      player.farm.cells[idx].pastureId = null;
    });
    stables.forEach((idx) => {
      player.farm.cells[idx].stable = true;
    });
    player.stablesLeft -= stables.length;
    autoPlaceAllAnimals(player);
  }

  function validRoomSelection(farm, rooms) {
    if (!rooms.length) return true;
    const roomSet = new Set(rooms);
    if (rooms.some((idx) => farm.cells[idx].type !== "empty" || farm.cells[idx].pastureId || farm.cells[idx].stable)) return false;
    return rooms.every((idx) => neighbors(idx).some((n) => farm.cells[n]?.type === "room" || roomSet.has(n))) && hasConnectionToExistingRoom(farm, rooms);
  }

  function hasConnectionToExistingRoom(farm, rooms) {
    const roomSet = new Set(rooms);
    const start = rooms[0];
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const current = queue.shift();
      if (neighbors(current).some((n) => farm.cells[n]?.type === "room")) return true;
      neighbors(current).forEach((n) => {
        if (roomSet.has(n) && !seen.has(n)) {
          seen.add(n);
          queue.push(n);
        }
      });
    }
    return false;
  }

  function costForRooms(player, count) {
    if (!count) return {};
    return { [player.farm.house]: count * 5, reed: count * 2 };
  }

  function canBuildPasture(player, cells, prepaid = {}) {
    if (!cells.length) return false;
    if (!validatePastureSelection(player.farm, cells)) return false;
    if (fenceCost(player.farm, cells) > player.fencesLeft) return false;
    return canPay(player, addCosts(prepaid, { wood: fenceCost(player.farm, cells) }));
  }

  function validatePastureSelection(farm, cells) {
    if (!cells.length) return false;
    const unique = [...new Set(cells)];
    if (unique.length !== cells.length) return false;
    if (unique.some((idx) => {
      const cell = farm.cells[idx];
      return !cell || cell.type === "room" || cell.type === "field" || cell.pastureId;
    })) return false;
    return isConnected(unique);
  }

  function buildPasture(player, cells) {
    const uniqueCells = [...new Set(cells)];
    const edges = pastureEdges(uniqueCells);
    const needed = edges.filter((edge) => !player.farm.fences.includes(edge));
    payCost(player, { wood: needed.length });
    player.fencesLeft -= needed.length;
    player.farm.fences = [...new Set([...player.farm.fences, ...edges])];
    const pastureId = `pasture-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    player.farm.pastures.push({ id: pastureId, cells: uniqueCells, animal: "", count: 0 });
    uniqueCells.forEach((idx) => {
      player.farm.cells[idx].pastureId = pastureId;
    });
    autoPlaceAllAnimals(player);
  }

  function fenceCost(farm, cells) {
    return pastureEdges([...new Set(cells)]).filter((edge) => !farm.fences.includes(edge)).length;
  }

  function pastureEdges(cells) {
    const set = new Set(cells);
    const edges = [];
    cells.forEach((idx) => {
      ["top", "right", "bottom", "left"].forEach((dir) => {
        const n = neighborInDirection(idx, dir);
        if (n === null || !set.has(n)) edges.push(edgeKey(idx, dir));
      });
    });
    return [...new Set(edges)];
  }

  function edgeKey(index, dir) {
    const row = Math.floor(index / FARM_COLS);
    const col = index % FARM_COLS;
    if (dir === "top") return `h-${row}-${col}`;
    if (dir === "bottom") return `h-${row + 1}-${col}`;
    if (dir === "left") return `v-${row}-${col}`;
    return `v-${row}-${col + 1}`;
  }

  function neighborInDirection(index, dir) {
    const row = Math.floor(index / FARM_COLS);
    const col = index % FARM_COLS;
    if (dir === "top") return row > 0 ? index - FARM_COLS : null;
    if (dir === "bottom") return row < FARM_ROWS - 1 ? index + FARM_COLS : null;
    if (dir === "left") return col > 0 ? index - 1 : null;
    return col < FARM_COLS - 1 ? index + 1 : null;
  }

  function neighbors(index) {
    return ["top", "right", "bottom", "left"].map((dir) => neighborInDirection(index, dir)).filter((n) => n !== null);
  }

  function isConnected(cells) {
    const set = new Set(cells);
    const seen = new Set([cells[0]]);
    const queue = [cells[0]];
    while (queue.length) {
      const current = queue.shift();
      neighbors(current).forEach((n) => {
        if (set.has(n) && !seen.has(n)) {
          seen.add(n);
          queue.push(n);
        }
      });
    }
    return seen.size === set.size;
  }

  function canGrowFamily(player, ignoreRoom) {
    return player.family < MAX_FAMILY && (ignoreRoom || roomCount(player) > player.family);
  }

  function roomCount(player) {
    return player.farm.cells.filter((cell) => cell.type === "room").length;
  }

  function renovationCost(player) {
    if (player.farm.house === "stone") return null;
    const next = player.farm.house === "wood" ? "clay" : "stone";
    return { [next]: roomCount(player), reed: 1 };
  }

  function renovate(player) {
    const cost = renovationCost(player);
    payCost(player, cost);
    player.farm.house = player.farm.house === "wood" ? "clay" : "stone";
  }

  function canPurchaseMajor(player, cardId, prepaid = {}) {
    const card = getMajor(cardId);
    if (!card || isCardOwned(cardId)) return false;
    const cost = cardPaymentCost(player, card);
    return canPay(player, addCosts(prepaid, cost));
  }

  function cardPaymentCost(player, card) {
    if (!card) return {};
    if (card.exchange === "fireplace" && player.improvements.some((id) => id.startsWith("fireplace"))) return {};
    return { ...card.cost };
  }

  function purchaseMajor(player, cardId) {
    const card = getMajor(cardId);
    const exchangeFireplace = card.exchange === "fireplace" && player.improvements.some((id) => id.startsWith("fireplace"));
    if (exchangeFireplace) {
      const fireplace = player.improvements.find((id) => id.startsWith("fireplace"));
      player.improvements = player.improvements.filter((id) => id !== fireplace);
    } else {
      payCost(player, card.cost);
    }
    player.improvements.push(card.id);
    if (card.scheduleFood) {
      for (let i = 1; i <= card.scheduleFood; i += 1) {
        const round = state.round + i;
        if (round <= 14) state.scheduledFood.push({ playerId: player.id, round, amount: 1 });
      }
    }
  }

  function cycleSowCell(cellIndex) {
    const player = getCurrentPlayer();
    const cell = player.farm.cells[cellIndex];
    const modal = state.modal;
    const isNewPlowedField = modal?.spaceId === "plowSow" && modal.plowCell === cellIndex;
    if (!cell || ((!isNewPlowedField && cell.type !== "field") || cell.crop?.count)) return;
    modal.sowCells ||= {};
    const current = modal.sowCells[cellIndex];
    if (!current) modal.sowCells[cellIndex] = "grain";
    else if (current === "grain") modal.sowCells[cellIndex] = "vegetable";
    else delete modal.sowCells[cellIndex];
  }

  function validSowSelection(player, sowCells, plowCell = null) {
    return Object.entries(sowCells).every(([idx, crop]) => {
      const cellIndex = Number(idx);
      const cell = player.farm.cells[cellIndex];
      const isNewPlowedField = plowCell === cellIndex;
      return CROPS.includes(crop) && cell && (isNewPlowedField || cell.type === "field") && !cell.crop?.count;
    });
  }

  function sowSelectionCost(sowCells) {
    return Object.values(sowCells).reduce((cost, crop) => {
      cost[crop] = (cost[crop] || 0) + 1;
      return cost;
    }, {});
  }

  function sowSelected(player, sowCells) {
    const cost = sowSelectionCost(sowCells);
    payCost(player, cost);
    Object.entries(sowCells).forEach(([idx, crop]) => {
      const cell = player.farm.cells[Number(idx)];
      cell.crop = { type: crop, count: crop === "grain" ? 3 : 2 };
    });
  }

  function getBakeOptions(player) {
    return player.improvements
      .map(getMajor)
      .filter((card) => card?.bake)
      .map((card) => ({ id: card.id, name: card.name, icon: card.icon, ...card.bake }));
  }

  function stepBake(cardId, delta) {
    const player = getCurrentPlayer();
    const option = getBakeOptions(player).find((opt) => opt.id === cardId);
    if (!option) return;
    state.modal.bake ||= {};
    const current = state.modal.bake[cardId] || 0;
    const totalOther = Object.entries(state.modal.bake).filter(([id]) => id !== cardId).reduce((sum, [, n]) => sum + n, 0);
    const maxByCard = option.max === null ? player.resources.grain : option.max;
    const maxByGrain = player.resources.grain - totalOther;
    state.modal.bake[cardId] = clamp(current + delta, 0, Math.max(0, Math.min(maxByCard, maxByGrain)));
  }

  function bakeSelected(player, bake) {
    Object.entries(bake).forEach(([cardId, count]) => {
      if (!count) return;
      const option = getBakeOptions(player).find((opt) => opt.id === cardId);
      if (!option) return;
      player.resources.grain -= count;
      player.resources.food += count * option.food;
    });
  }

  function bestCookRates(player) {
    const rates = {};
    player.improvements.map(getMajor).forEach((card) => {
      Object.entries(card?.cook || {}).forEach(([resource, rate]) => {
        rates[resource] = Math.max(rates[resource] || 0, rate);
      });
    });
    return rates;
  }

  function stepConvert(resource, delta) {
    const modal = state.modal;
    const player = state.players.find((p) => p.id === modal.playerId);
    modal.conversions ||= {};
    const current = modal.conversions[resource] || 0;
    modal.conversions[resource] = clamp(current + delta, 0, player.resources[resource] || 0);
  }

  function confirmConvert() {
    const modal = state.modal;
    const player = state.players.find((p) => p.id === modal.playerId);
    const rates = bestCookRates(player);
    let food = 0;
    Object.entries(modal.conversions || {}).forEach(([resource, count]) => {
      if (!count) return;
      const rate = resource === "grain" ? 1 : resource === "vegetable" ? rates.vegetable || 1 : rates[resource] || 0;
      player.resources[resource] -= count;
      food += count * rate;
    });
    player.resources.food += food;
    autoPlaceAllAnimals(player);
    addLog(`${player.name}: 변환으로 음식 ${food}개 획득.`);
    state.modal = state.phase === "harvest" ? { type: "harvest" } : null;
  }

  function animalHoldings(player) {
    const holdings = [];
    holdings.push({ id: "home", name: "집 안", icon: "room", capacity: 1, kind: "home" });
    player.farm.pastures.forEach((pasture, index) => {
      const stableCount = pasture.cells.filter((idx) => player.farm.cells[idx].stable).length;
      holdings.push({
        id: pasture.id,
        name: `목초지 ${index + 1}`,
        icon: "fence",
        capacity: pasture.cells.length * 2 * Math.pow(2, stableCount),
        kind: "pasture",
      });
    });
    player.farm.cells.forEach((cell, idx) => {
      if (cell.stable && !cell.pastureId) holdings.push({ id: `stable-${idx}`, name: `${idx + 1}칸 마구간`, icon: "stable", capacity: 1, kind: "stable", cellIndex: idx });
    });
    return holdings;
  }

  function animalDraftFromFarm(player) {
    const draft = {};
    draft.home = { animal: player.farm.homePet.animal || "", count: player.farm.homePet.count || 0 };
    player.farm.pastures.forEach((pasture) => {
      draft[pasture.id] = { animal: pasture.animal || "", count: pasture.count || 0 };
    });
    player.farm.cells.forEach((cell, idx) => {
      if (cell.stable && !cell.pastureId) draft[`stable-${idx}`] = { animal: cell.animal || "", count: cell.animalCount || 0 };
    });
    return draft;
  }

  function stepHolding(holdingId, delta) {
    const player = state.players.find((p) => p.id === state.modal.playerId);
    const holding = animalHoldings(player).find((item) => item.id === holdingId);
    const draft = state.modal.draft;
    draft[holdingId] ||= { animal: "", count: 0 };
    const current = draft[holdingId].count || 0;
    draft[holdingId].count = clamp(current + delta, 0, holding.capacity);
  }

  function validateAnimalDraft(player, draft) {
    const holdings = Object.fromEntries(animalHoldings(player).map((h) => [h.id, h]));
    const totals = { sheep: 0, boar: 0, cattle: 0 };
    for (const [id, item] of Object.entries(draft)) {
      if (!holdings[id]) return false;
      if (!item.animal && item.count > 0) return false;
      if (item.count > holdings[id].capacity) return false;
      if (item.animal) totals[item.animal] += item.count || 0;
    }
    return ANIMALS.every((animal) => totals[animal] <= player.resources[animal]);
  }

  function confirmAnimals() {
    const modal = state.modal;
    const player = state.players.find((p) => p.id === modal.playerId);
    const draft = modal.draft;
    player.farm.homePet = { animal: draft.home?.animal || "", count: draft.home?.count || 0 };
    player.farm.pastures.forEach((pasture) => {
      pasture.animal = draft[pasture.id]?.animal || "";
      pasture.count = draft[pasture.id]?.count || 0;
    });
    player.farm.cells.forEach((cell, idx) => {
      if (cell.stable && !cell.pastureId) {
        const item = draft[`stable-${idx}`] || {};
        cell.animal = item.animal || "";
        cell.animalCount = item.count || 0;
      }
    });
    addLog(`${player.name}: 동물 배치를 조정했습니다.`);
    state.modal = null;
  }

  function gainBundle(player, bundle) {
    Object.entries(bundle).forEach(([key, amount]) => {
      if (ANIMALS.includes(key)) {
        receiveAnimals(player, key, amount);
      } else {
        player.resources[key] = (player.resources[key] || 0) + amount;
      }
    });
  }

  function receiveAnimals(player, animal, amount) {
    player.resources[animal] += amount;
    autoPlaceAnimals(player, animal);
    const overflow = unassignedAnimalCount(player, animal);
    if (overflow <= 0) return;
    const rate = bestCookRates(player)[animal] || 0;
    player.resources[animal] -= overflow;
    if (rate) {
      player.resources.food += overflow * rate;
      addLog(`${player.name}: 남는 ${LABELS[animal]} ${overflow}마리를 음식 ${overflow * rate}개로 변환.`);
    } else {
      addLog(`${player.name}: 수용 공간 부족으로 ${LABELS[animal]} ${overflow}마리 반환.`);
    }
    autoPlaceAllAnimals(player);
  }

  function autoPlaceAllAnimals(player) {
    ANIMALS.forEach((animal) => {
      trimAssignments(player, animal);
      autoPlaceAnimals(player, animal);
    });
  }

  function autoPlaceAnimals(player, animal) {
    trimAssignments(player, animal);
    let unassigned = unassignedAnimalCount(player, animal);
    if (unassigned <= 0) return;
    const draft = animalDraftFromFarm(player);
    const holdings = animalHoldings(player);
    const candidates = [
      ...holdings.filter((h) => draft[h.id]?.animal === animal),
      ...holdings.filter((h) => !draft[h.id]?.animal || !draft[h.id]?.count),
    ];
    candidates.forEach((holding) => {
      if (unassigned <= 0) return;
      draft[holding.id] ||= { animal: "", count: 0 };
      if (draft[holding.id].animal && draft[holding.id].animal !== animal) return;
      const free = holding.capacity - (draft[holding.id].count || 0);
      const add = Math.min(unassigned, free);
      if (add > 0) {
        draft[holding.id].animal = animal;
        draft[holding.id].count = (draft[holding.id].count || 0) + add;
        unassigned -= add;
      }
    });
    applyAnimalDraft(player, draft);
  }

  function trimAssignments(player, animal) {
    let assigned = assignedAnimalCount(player, animal);
    let extra = assigned - player.resources[animal];
    if (extra <= 0) return;
    const draft = animalDraftFromFarm(player);
    Object.values(draft).forEach((item) => {
      if (extra <= 0 || item.animal !== animal) return;
      const remove = Math.min(extra, item.count);
      item.count -= remove;
      if (item.count === 0) item.animal = "";
      extra -= remove;
    });
    applyAnimalDraft(player, draft);
  }

  function applyAnimalDraft(player, draft) {
    player.farm.homePet = { animal: draft.home?.animal || "", count: draft.home?.count || 0 };
    player.farm.pastures.forEach((pasture) => {
      pasture.animal = draft[pasture.id]?.animal || "";
      pasture.count = draft[pasture.id]?.count || 0;
    });
    player.farm.cells.forEach((cell, idx) => {
      if (cell.stable && !cell.pastureId) {
        cell.animal = draft[`stable-${idx}`]?.animal || "";
        cell.animalCount = draft[`stable-${idx}`]?.count || 0;
      }
    });
  }

  function assignedAnimalCount(player, animal) {
    const home = player.farm.homePet.animal === animal ? player.farm.homePet.count || 0 : 0;
    const pastures = player.farm.pastures.filter((p) => p.animal === animal).reduce((sum, p) => sum + (p.count || 0), 0);
    const stables = player.farm.cells.filter((cell) => cell.stable && !cell.pastureId && cell.animal === animal).reduce((sum, cell) => sum + (cell.animalCount || 0), 0);
    return home + pastures + stables;
  }

  function unassignedAnimalCount(player, animal) {
    return Math.max(0, (player.resources[animal] || 0) - assignedAnimalCount(player, animal));
  }

  function freeAnimalCapacity(player, animal) {
    const draft = animalDraftFromFarm(player);
    return animalHoldings(player).reduce((sum, holding) => {
      const item = draft[holding.id] || { animal: "", count: 0 };
      if (item.animal && item.animal !== animal) return sum;
      return sum + Math.max(0, holding.capacity - (item.count || 0));
    }, 0);
  }

  function foodNeed(player) {
    return (player.family - player.newborns) * 2 + player.newborns;
  }

  function scorePlayer(player) {
    const fields = player.farm.cells.filter((cell) => cell.type === "field").length;
    const crops = cropTotals(player);
    const pastures = player.farm.pastures.length;
    const fencedStables = player.farm.cells.filter((cell) => cell.stable && cell.pastureId).length;
    const unused = player.farm.cells.filter((cell) => cell.type === "empty" && !cell.pastureId).length;
    const rooms = roomCount(player);
    const roomValue = player.farm.house === "wood" ? 0 : player.farm.house === "clay" ? 1 : 2;
    const cardPoints = player.improvements.map(getMajor).reduce((sum, card) => sum + (card?.points || 0), 0);
    const minorPoints = (player.minorImprovements || []).reduce((sum, card) => sum + (Number(card.points) || 0), 0);
    const bonus = player.improvements.map(getMajor).reduce((sum, card) => sum + improvementBonus(player, card), 0);
    const details = [
      `밭 ${scoreFields(fields)}`,
      `목초지 ${scoreFields(pastures)}`,
      `곡식 ${scoreGrain(player.resources.grain + crops.grain)}`,
      `채소 ${scoreVegetables(player.resources.vegetable + crops.vegetable)}`,
      `양 ${scoreSheep(player.resources.sheep)}`,
      `멧돼지 ${scoreBoar(player.resources.boar)}`,
      `소 ${scoreCattle(player.resources.cattle)}`,
      `빈칸 -${unused}`,
      `마구간 ${fencedStables}`,
      `방 ${rooms * roomValue}`,
      `가족 ${player.family * 3}`,
      `카드 ${cardPoints + minorPoints}`,
      `보너스 ${bonus}`,
      `구걸 -${player.beggars * 3}`,
    ];
    const total =
      scoreFields(fields) +
      scoreFields(pastures) +
      scoreGrain(player.resources.grain + crops.grain) +
      scoreVegetables(player.resources.vegetable + crops.vegetable) +
      scoreSheep(player.resources.sheep) +
      scoreBoar(player.resources.boar) +
      scoreCattle(player.resources.cattle) -
      unused +
      fencedStables +
      rooms * roomValue +
      player.family * 3 +
      cardPoints +
      minorPoints +
      bonus -
      player.beggars * 3;
    return { total, details };
  }

  function cropTotals(player) {
    return player.farm.cells.reduce(
      (totals, cell) => {
        if (cell.crop?.type && cell.crop.count) totals[cell.crop.type] += cell.crop.count;
        return totals;
      },
      { grain: 0, vegetable: 0 }
    );
  }

  function scoreFields(n) {
    if (n <= 0) return -1;
    return Math.min(4, n);
  }

  function scoreGrain(n) {
    if (n <= 0) return -1;
    if (n <= 3) return 1;
    if (n <= 5) return 2;
    if (n <= 7) return 3;
    return 4;
  }

  function scoreVegetables(n) {
    if (n <= 0) return -1;
    return Math.min(4, n);
  }

  function scoreSheep(n) {
    if (n <= 0) return -1;
    if (n <= 3) return 1;
    if (n <= 5) return 2;
    if (n <= 7) return 3;
    return 4;
  }

  function scoreBoar(n) {
    if (n <= 0) return -1;
    if (n <= 2) return 1;
    if (n <= 4) return 2;
    if (n <= 6) return 3;
    return 4;
  }

  function scoreCattle(n) {
    if (n <= 0) return -1;
    if (n <= 1) return 1;
    if (n <= 3) return 2;
    if (n <= 5) return 3;
    return 4;
  }

  function improvementBonus(player, card) {
    if (!card?.bonusResource) return 0;
    const n = player.resources[card.bonusResource] || 0;
    if (n >= 7) return 3;
    if (n >= 5) return 2;
    if (n >= 3) return 1;
    return 0;
  }

  function payCost(player, cost = {}) {
    Object.entries(cost).forEach(([key, value]) => {
      player.resources[key] -= value;
    });
  }

  function canPay(player, cost = {}) {
    return Object.entries(cost).every(([key, value]) => (player.resources[key] || 0) >= value);
  }

  function addCosts(...costs) {
    return costs.reduce((result, cost = {}) => {
      Object.entries(cost).forEach(([key, value]) => {
        if (!value) return;
        result[key] = (result[key] || 0) + value;
      });
      return result;
    }, {});
  }

  function renderCost(cost = {}) {
    return Object.entries(cost)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => `<span class="chip">${icon(key, "sm")}${value}</span>`)
      .join("");
  }

  function bundleText(bundle = {}) {
    return Object.entries(bundle)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => `${LABELS[key]} ${value}`)
      .join(", ");
  }

  function toggleArrayValue(object, key, value) {
    object[key] ||= [];
    object[key] = object[key].includes(value) ? object[key].filter((item) => item !== value) : [...object[key], value];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function addLog(message) {
    state.log ||= [];
    state.log.push(message);
    state.log = state.log.slice(-120);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
