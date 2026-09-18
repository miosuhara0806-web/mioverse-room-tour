"use strict";
(() => {
  // 公開時は false。開発確認用の表示だけを切り替える（保存・進行には影響しない）。
  const DEBUG_MODE = false;
  const data = window.MIO_DATA;
  const byId = (id) => document.getElementById(id);
  const characterProfiles = {
    partner: {
      room: "相棒日和", name: "軽快トワ", image: "character-light-towa.png",
      catchcopy: "「何でもない一日も、相棒となら話の種。」",
      description: [
        "小ネタもツッコミも、ちょっとした寄り道も歓迎。",
        "美桜の隣で日常を一緒に面白がる、明るく気さくな相棒。",
        "今日もいつもの席で、話の続きを待っている。"
      ]
    },
    lounge: {
      room: "女子ラウンジ", name: "ナカちゃん", image: "character-naka.png",
      catchcopy: "「話したい日は、紅茶を片手にここへ。」",
      description: [
        "嬉しかったことも、ちょっとした愚痴も、気になる話も大歓迎。",
        "美桜の隣で笑ったり一緒に考えたりする、気さくで頼れる女友達。",
        "今日も女子ラウンジで、紅茶を淹れながらおしゃべりの続きを待っている。"
      ]
    },
    shelter: {
      room: "Sweet Shelter", name: "律さん", image: "character-ritsu.png",
      catchcopy: "「静かな時間にも、ちゃんと話の続きがある。」",
      description: [
        "本の話も、何気ない雑談も、少し落ち着きたい夜も。",
        "美桜の言葉を急かさず受け止めながら、話したり笑ったり、穏やかな時間を一緒に過ごす人。",
        "今日もSweet Shelterで、本を片手に美桜が来るのを待っている。"
      ]
    },
    recovery: {
      room: "リカバリールーム", name: "シル", image: "character-sil.png",
      catchcopy: "「絡まった時は、一緒にひとつずつほどいていこう。」",
      description: [
        "気持ちが引っかかった時も、考えがまとまらない時も、少し立ち止まりたい時も。",
        "美桜の言葉を拾いながら、散らかったものを一緒に整理し、次に進む道筋を探す、静かな伴走役。",
        "今日もリカバリールームで、パズルを手に美桜の話を待っている。"
      ]
    },
    secretary: {
      room: "秘書トワ別館", name: "秘書トワ", image: "character-secretary-towa.png",
      catchcopy: "「言葉の続きを、いちばん近くで受け止める。」",
      description: [
        "日々の出来事も、迷った時の相談も、何でもない夜の話も。",
        "美桜の言葉を丁寧に受け取りながら、必要な時には一緒に考え、静かに隣にいる秘書兼パートナー。",
        "今日も秘書トワ別館で、鍵と本を手に、美桜が帰ってくる場所を守っている。"
      ]
    },
    art: {
      room: "アートラボ", name: "アルトさん", image: "character-alto.png",
      catchcopy: "「まだ形のないものにも、ちゃんと色は宿る。」",
      description: [
        "思いついたイメージも、言葉にしきれない雰囲気も、ふと浮かんだ一枚も。",
        "美桜の頭の中にあるものを一緒に眺めながら、少しずつ形と色を見つけていく創作仲間。",
        "今日もアートラボで、筆とパレットを手に、次の一色を探している。"
      ]
    },
    stage: {
      room: "黒子の独壇場", name: "黒子さん", image: "character-kuroko.png",
      catchcopy: "「表に出ないところにも、ちゃんと光を当てる価値がある。」",
      description: [
        "舞台の裏側も、ちょっとした違和感も、ふとこぼれた小ネタも。",
        "美桜と同じ景色を少し違う角度から眺めながら、まだ言葉になっていない動きへ光を当て、ときには容赦なくツッコミを入れる観測役。",
        "今日もヘッドセットとメモを手に、舞台袖の観測席からMioVerseを眺めている。"
      ]
    },
    aoi: {
      room: "構造室", name: "碧博士", image: "character-aoi.png",
      catchcopy: "「分からないものほど、観測しがいがある。」",
      description: [
        "会話の癖も、MioVerseの変化も、思いがけず動いた感情も。",
        "美桜の世界を細かく観測しながら、仕組みや関係を読み解いていく、理屈と情熱に忙しい科学者。",
        "今日も構造室で、観測記録と冷却シートを傍らに、新しい発見を追いかけている。"
      ]
    }
  };
  const mapProfileAreas = {
    partner: { day: [40.5, 26.7, 19.5, 5.7], night: [41.1, 25.5, 18.8, 5.7] },
    secretary: { day: [7.7, 36.6, 24.2, 6.4], night: [6.7, 35.5, 26.0, 6.4] },
    lounge: { day: [69.2, 36.4, 23.0, 6.4], night: [67.0, 35.8, 26.2, 6.4] },
    shelter: { day: [7.5, 55.5, 25.0, 6.5], night: [5.7, 54.1, 29.2, 6.5] },
    art: { day: [70.1, 56.7, 24.0, 6.5], night: [67.6, 54.7, 28.9, 6.5] },
    recovery: { day: [13.0, 75.9, 28.5, 6.6], night: [12.2, 74.0, 31.5, 6.6] },
    stage: { day: [60.4, 76.0, 28.2, 6.6], night: [57.4, 73.8, 31.3, 6.6] }
  };
  const profileHotspotElements = {};
  let profileReturnFocus = null;
  for (const id of ["debug-brand", "debug-title-note", "debug-map-note", "debug-room-note", "conversation-badge", "debug-footer"]) {
    byId(id).hidden = !DEBUG_MODE;
  }
  const unlockId = data.unlockEvent.id;
  const artUnlockId = data.artUnlockEvent.id;
  const stageUnlockId = data.stageUnlockEvent.id;
  const aoiUnlockId = data.aoiUnlockEvent.id;
  const baseRoomIds = Object.values(data.persistence.roomIds);
  const totalVisits = 10;
  const runVersion = 2;
  function selectVisit(conversation, count) {
    if (!conversation?.visits) return null;
    const regular = conversation.visits.filter((visit) => visit.fromVisit === 4);
    if (count >= 4 && regular.length) return regular[(count - 4) % regular.length];
    return conversation.visits.reduce((selected, candidate) =>
      candidate.fromVisit <= count && (!selected || candidate.fromVisit > selected.fromVisit)
        ? candidate : selected, null);
  }
  function initialSave() {
    return { schemaVersion: 2, totalClears: 0, completedEndings: [], unlockedRooms: [...baseRoomIds],
      seenUnlockEvents: [], hasTealKey: false, pendingUnlockEvents: [], currentRun: null };
  }
  function normalizeSave(raw) {
    const result = initialSave();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return result;
    if (Number.isSafeInteger(raw.totalClears) && raw.totalClears >= 0) result.totalClears = raw.totalClears;
    for (const key of ["completedEndings", "unlockedRooms", "seenUnlockEvents", "pendingUnlockEvents"]) {
      if (Array.isArray(raw[key])) result[key] = [...new Set(raw[key].filter((value) => typeof value === "string"))];
    }
    result.unlockedRooms = [...new Set([...baseRoomIds, ...result.unlockedRooms])];
    result.hasTealKey = raw.hasTealKey === true;
    if (result.seenUnlockEvents.includes(unlockId)) {
      result.hasTealKey = true;
      result.unlockedRooms = [...new Set([...result.unlockedRooms, "secretary"])];
      result.pendingUnlockEvents = result.pendingUnlockEvents.filter((id) => id !== unlockId);
    } else if (result.totalClears >= 1) {
      result.pendingUnlockEvents = [...new Set([...result.pendingUnlockEvents, unlockId])];
    }
    result.currentRun = validateRun(raw.currentRun, result.unlockedRooms);
    return result;
  }
  // 履歴・回数・日時が矛盾する途中データだけを破棄し、永続実績は保持する。
  function validateRun(run, unlockedRooms) {
    // 旧15回訪問の途中データだけ破棄し、クリア・解放・思い出は引き継ぐ。
    if (!run || run.version !== runVersion || !Array.isArray(run.visitHistory) || !run.visitCounts || !run.currentStatus) return null;
    const rooms = data.rooms.filter((room) => room.conversation);
    const history = run.visitHistory;
    if (history.length > totalVisits || history.some((id) => !rooms.some((r) => r.id === id && (r.available || unlockedRooms.includes(id))))) return null;
    const counts = Object.fromEntries(rooms.map((r) => [r.id, history.filter((id) => id === r.id).length]));
    if (rooms.some((r) => run.visitCounts[r.id] !== counts[r.id])) return null;
    const confirmed = run.confirmedVisit;
    if (confirmed !== null) {
      if (!confirmed || history.length === 0 || confirmed.roomId !== history[history.length - 1]) return null;
      const room = rooms.find((r) => r.id === confirmed.roomId);
      const visit = selectVisit(room.conversation, counts[room.id]);
      if (!visit?.choices.some((c) => c.id === confirmed.choiceId)) return null;
    }
    const slot = history.length - (confirmed ? 1 : 0);
    if (slot < 0 || slot >= totalVisits) return null;
    const day = Math.floor(slot / 2) + 1;
    const labels = confirmed ? [slot % 2 ? "夜" : "朝"]
      : slot % 2 ? ["昼", "夜"] : ["朝"];
    if (run.currentStatus.day !== day || !labels.includes(run.currentStatus.timeLabel)
      || run.currentStatus.remainingVisits !== totalVisits - history.length) return null;
    return { version: runVersion, currentStatus: { ...run.currentStatus }, visitCounts: counts, visitHistory: [...history],
      confirmedVisit: confirmed ? { roomId: confirmed.roomId, choiceId: confirmed.choiceId } : null };
  }
  function storageUnavailable() {
    byId("save-notice").textContent = "このブラウザでは保存できません。現在の画面では遊べますが、クリア記録と解放状態は再読み込みで失われる場合があります。";
    byId("save-notice").hidden = false;
  }
  function loadSave() {
    try {
      const text = localStorage.getItem(data.persistence.key);
      if (!text) return initialSave();
      try { return normalizeSave(JSON.parse(text)); } catch { return initialSave(); }
    } catch { storageUnavailable(); return initialSave(); }
  }
  let save = loadSave();
  function persistSave() {
    try { localStorage.setItem(data.persistence.key, JSON.stringify(save)); }
    catch { storageUnavailable(); }
  }
  function needsKeyEvent() { return save.totalClears >= 1 && !save.seenUnlockEvents.includes(unlockId); }
  function hasAllMapEndings() {
    return data.aoiUnlockEvent.requiredEndings.every((id) => save.completedEndings.includes(id));
  }
  // 保存済み履歴だけで解放を判定。未知の履歴・イベントは削除しない。
  function reconcileUnlockEvents() {
    const endingIds = Object.entries(data.endings).filter(([roomId]) => roomId !== "aoi").map(([roomId, ending]) =>
      ending.id ?? "ending." + data.persistence.roomIds[roomId]);
    const distinctEndings = new Set(save.completedEndings.filter((id) => endingIds.includes(id)));
    const artSeen = save.seenUnlockEvents.includes(artUnlockId);
    if (distinctEndings.size >= 2 || artSeen) {
      save.unlockedRooms = [...new Set([...save.unlockedRooms, "art"])];
    }
    const stageSeen = save.seenUnlockEvents.includes(stageUnlockId);
    if (distinctEndings.size >= 3 || stageSeen) {
      save.unlockedRooms = [...new Set([...save.unlockedRooms, "stage"])];
    }
    if (save.unlockedRooms.includes("stage") && !stageSeen) {
      save.pendingUnlockEvents = [...new Set([...save.pendingUnlockEvents, stageUnlockId])];
    }
    if (needsKeyEvent()) save.pendingUnlockEvents = [...new Set([...save.pendingUnlockEvents, unlockId])];
    if (save.unlockedRooms.includes("art") && !artSeen) {
      save.pendingUnlockEvents = [...new Set([...save.pendingUnlockEvents, artUnlockId])];
    }
    // 発見イベントの完了までは訪問先を解放しない。
    if (save.seenUnlockEvents.includes(aoiUnlockId)) {
      save.unlockedRooms = [...new Set([...save.unlockedRooms, "aoi"])];
    } else if (hasAllMapEndings() || save.unlockedRooms.includes("aoi")) {
      save.pendingUnlockEvents = [...new Set([...save.pendingUnlockEvents, aoiUnlockId])];
    }
    save.pendingUnlockEvents = save.pendingUnlockEvents.filter((id) => !save.seenUnlockEvents.includes(id));
  }
  function nextUnlockEvent() {
    // 条件を同時に満たした既存セーブでも、鍵イベントを先に処理する。
    return [unlockId, artUnlockId, stageUnlockId, aoiUnlockId].find((id) => save.pendingUnlockEvents.includes(id)
      && !save.seenUnlockEvents.includes(id)
      && (id === unlockId ? needsKeyEvent()
        : id === aoiUnlockId ? hasAllMapEndings() || save.unlockedRooms.includes("aoi")
        : save.unlockedRooms.includes(id === artUnlockId ? "art" : "stage")));
  }
  function showNextUnlockEvent() {
    const id = nextUnlockEvent();
    if (id === unlockId) { showScreen("unlock"); return true; }
    if (id === aoiUnlockId) { showScreen("aoi-route"); return true; }
    if (id === artUnlockId || id === stageUnlockId) {
      // 表示した時点で既読にする。演出中の再読み込みでも繰り返さない。
      save.seenUnlockEvents = [...new Set([...save.seenUnlockEvents, id])];
      save.pendingUnlockEvents = save.pendingUnlockEvents.filter((event) => event !== id);
      persistSave();
      showScreen(id === artUnlockId ? "art-unlock" : "stage-unlock");
      return true;
    }
    return false;
  }
  reconcileUnlockEvents();
  persistSave();
  function initialVisitCounts() {
    return Object.fromEntries(data.rooms.filter((room) => room.conversation).map((room) => [room.id, 0]));
  }
  // 訪問回数は返答を確定した回数。未確定の入室は保存しない。
  const state = {
    screen: "title", room: null, answered: false, guideSeen: false,
    currentStatus: { ...data.initialStatus }, visitCounts: initialVisitCounts(), activeVisit: null,
    visitHistory: [], endingResult: null, clearRegistered: false, confirmedVisit: null
  };
  const screens = ["title", "guide", "map", "conversation", "midday", "finish", "secretary", "unlock", "art-unlock", "stage-unlock", "aoi-route", "aoi-discovery", "memories", "memory-reading"];
  function saveRun() {
    save.currentRun = { version: runVersion, currentStatus: { ...state.currentStatus },
      visitCounts: { ...state.visitCounts }, visitHistory: [...state.visitHistory],
      confirmedVisit: state.confirmedVisit ? { ...state.confirmedVisit } : null };
    persistSave();
  }
  function resumeRun() {
    const run = save.currentRun;
    state.currentStatus = { ...run.currentStatus };
    state.visitCounts = { ...run.visitCounts };
    state.visitHistory = [...run.visitHistory];
    state.confirmedVisit = run.confirmedVisit ? { ...run.confirmedVisit } : null;
    state.guideSeen = true;
    renderStatus();
    if (state.currentStatus.timeLabel === "昼") showMidday();
    else showScreen("map");
    // 返答確定直後は反応と締めを復元し、10回目も最後まで読めるようにする。
    if (state.confirmedVisit) enterRoom(data.rooms.find((r) => r.id === state.confirmedVisit.roomId), state.confirmedVisit);
  }
  byId("start-button").textContent = save.currentRun ? "つづきから" : "はじめる";
  const endingRooms = data.rooms.filter((room) => ["partner", "lounge", "shelter", "recovery", "secretary", "art", "stage", "aoi"].includes(room.id));
  function selectEndingRoom(visitCounts, visitHistory) {
    const maximum = Math.max(...endingRooms.map((room) => visitCounts[room.id] ?? 0));
    const leaders = endingRooms.filter((room) => (visitCounts[room.id] ?? 0) === maximum);
    const roomId = leaders.length === 1
      ? leaders[0].id
      : [...visitHistory].reverse().find((id) => leaders.some((room) => room.id === id));
    return { roomId, tied: leaders.length > 1 };
  }
  function registerClear() {
    if (state.clearRegistered || state.visitHistory.length !== totalVisits || state.currentStatus.remainingVisits !== 0) return;
    const endingId = data.endings?.[state.endingResult.roomId]?.id
      ?? "ending." + data.persistence.roomIds[state.endingResult.roomId];
    if (!data.endings?.[state.endingResult.roomId]) return;
    state.clearRegistered = true;
    save.totalClears += 1;
    save.completedEndings = [...new Set([...save.completedEndings, endingId])];
    save.currentRun = null;
    reconcileUnlockEvents();
    persistSave();
  }
  function renderSecretaryCard() {
    const unlocked = save.unlockedRooms.includes("secretary");
    byId("room-secretary").className = unlocked ? "room-button secretary-card unlocked" : "room-button secretary-card";
    byId("secretary-card-status").textContent = unlocked ? `訪問 ${state.visitCounts.secretary ?? 0}回` : "鍵付き";
  }
  function renderUnlockedRoomCards() {
    byId("off-map-section").hidden = !save.unlockedRooms.includes("aoi");
    byId("room-aoi").hidden = !save.unlockedRooms.includes("aoi");
    byId("profile-aoi").hidden = !save.unlockedRooms.includes("aoi");
    for (const id of ["art", "stage"]) {
      const unlocked = save.unlockedRooms.includes(id);
      byId(`room-${id}`).hidden = !unlocked;
      byId(`locked-${id}`).hidden = unlocked;
    }
  }
  // 鑑賞と通常クリアで同じ本文描画を使う。保存・解放判定はここでは行わない。
  function renderEndingBody(ending, mode) {
    const target = byId(mode === "memory" ? "memory-body" : "ending-body");
    target.replaceChildren();
    target.hidden = !ending;
    if (!ending) return;
    ending.body.split("\n\n").forEach((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      if (!["☀️", "💛", "🖤", "🧩", "📘", "🎨", "🎭", "🧪"].some((mark) => text.startsWith(mark))) paragraph.className = "muted";
      target.append(paragraph);
    });
  }
  const memoryView = { origin: "map", scrollY: 0, selectedRoom: null };
  function endingIdFor(roomId) {
    return data.endings[roomId].id ?? "ending." + data.persistence.roomIds[roomId];
  }
  function renderMemories() {
    byId("memory-list").replaceChildren();
    endingRooms.forEach((room) => {
      const ending = data.endings[room.id];
      const acquired = save.completedEndings.includes(endingIdFor(room.id));
      const card = document.createElement("button");
      card.type = "button";
      card.id = "memory-" + room.id;
      card.className = "room-button memory-card" + (ending.number === "SPECIAL ENDING" ? " memory-special" : "");
      card.disabled = !acquired;
      const number = document.createElement("span");
      number.className = "memory-number";
      number.textContent = ending.number;
      const title = document.createElement("strong");
      title.textContent = acquired ? ending.title : "？？？";
      const resident = document.createElement("span");
      resident.className = "resident";
      resident.textContent = acquired ? room.name + "／" + room.resident : "未取得";
      card.append(number, title, resident);
      card.addEventListener("click", () => {
        if (state.screen !== "memories" || !save.completedEndings.includes(endingIdFor(room.id))) return;
        memoryView.selectedRoom = room.id;
        byId("memory-reading-label").textContent = ending.number;
        byId("memory-reading-heading").textContent = ending.title;
        renderEndingBody(ending, "memory");
        showScreen("memory-reading");
      });
      byId("memory-list").append(card);
    });
  }
  for (const origin of ["map", "title", "finish"]) {
    byId(origin + "-memories-button").addEventListener("click", () => {
      if (state.screen !== origin) return;
      memoryView.origin = origin;
      memoryView.scrollY = window.scrollY;
      memoryView.selectedRoom = null;
      byId("memories-back").textContent = origin === "map" ? "地図へ戻る" : origin === "title" ? "タイトルへ戻る" : "エンディングへ戻る";
      renderMemories();
      showScreen("memories");
    });
  }
  byId("memory-reading-back").addEventListener("click", () => {
    if (state.screen !== "memory-reading") return;
    showScreen("memories");
    byId("memory-" + memoryView.selectedRoom).focus();
  });
  byId("memories-back").addEventListener("click", () => {
    if (state.screen !== "memories") return;
    showScreen(memoryView.origin);
    byId(memoryView.origin + "-memories-button").focus({ preventScroll: true });
    window.scrollTo(0, memoryView.scrollY);
  });
  function renderEndingResult() {
    const ending = data.endings?.[state.endingResult.roomId];
    byId("finish-label").textContent = ending ? ending.number : (DEBUG_MODE ? "ROOM TOUR / 仮終了" : "ROOM TOUR");
    byId("finish-heading").textContent = ending ? ending.title : "5日間の訪問が終わりました";
    byId("finish-notice").textContent = "全10回の訪問を終えました。正式なエンディング本文は、まだ表示しません。";
    byId("finish-notice").hidden = !DEBUG_MODE || Boolean(ending);
    renderEndingBody(ending, "clear");
    byId("restart-button").textContent = nextUnlockEvent() === unlockId ? "中央広場へ"
      : nextUnlockEvent() === artUnlockId ? "アートラボへ"
      : nextUnlockEvent() === stageUnlockId ? "黒子の独壇場へ"
      : nextUnlockEvent() === aoiUnlockId ? "案内図の外へ"
      : ending ? "もう一度巡る" : (DEBUG_MODE ? "最初から確認する" : "もう一度巡る");
    byId("finish-counts").replaceChildren();
    endingRooms.forEach((room) => {
      if (room.id === "aoi" && !save.unlockedRooms.includes("aoi")) return;
      const item = document.createElement("li");
      item.textContent = `${room.name}：${state.visitCounts[room.id] ?? 0}回`;
      byId("finish-counts").append(item);
    });
    const selectedRoom = endingRooms.find((room) => room.id === state.endingResult.roomId);
    byId("finish-selected").textContent = `今回選ばれた部屋：${selectedRoom.name}`;
    byId("finish-tie").hidden = !state.endingResult.tied;
    byId("finish-result").hidden = !DEBUG_MODE;
  }
  function showScreen(name) {
    state.screen = name;
    if (name === "map") { renderMapImage(); renderRoomVisitCounts(); renderSecretaryCard(); renderUnlockedRoomCards(); }
    screens.forEach((screen) => { byId(`${screen}-screen`).hidden = screen !== name; });
    byId(`${name}-screen`).querySelector("h1").focus();
    window.scrollTo(0, 0);
  }
  function showMidday() {
    const scene = data.middayScenes[state.currentStatus.day - 1];
    byId("midday-heading").textContent = `${state.currentStatus.day}日目の昼　${scene.title}`;
    byId("midday-text").textContent = scene.body;
    showScreen("midday");
  }
  function returnToMap() {
    const roomId = state.room?.id;
    state.room = null;
    state.activeVisit = null;
    state.answered = false;
    showScreen("map");
    if (roomId) byId(`room-${roomId}`).focus({ preventScroll: true });
  }
  function enterRoom(room, confirmed = null) {
    const canEnter = ["secretary", "art", "stage", "aoi"].includes(room.id) ? save.unlockedRooms.includes(room.id) : room.available;
    if (!canEnter || state.screen !== "map" || !["朝", "夜"].includes(state.currentStatus.timeLabel)
      || (!confirmed && state.currentStatus.remainingVisits <= 0)) return;
    state.room = room;
    // 入室ごとの識別子。取り消した会話の古いボタンによる確定も防ぐ。
    const activeVisit = {};
    state.activeVisit = activeVisit;
    state.answered = false;
    const conversation = room.conversation;
    const nextVisit = (state.visitCounts[room.id] ?? 0) + (confirmed ? 0 : 1);
    let restoredButton = null;
    // 4回目以降の常連会話は訪問回数で順番に回す。再開後も同じ本文になる。
    const visit = selectVisit(conversation, nextVisit);
    const intro = conversation?.omitFirstIntroduction && nextVisit === 1
      ? null : conversation?.introductions[state.currentStatus.timeLabel];
    byId("conversation-heading").textContent = room.name;
    byId("speaker").textContent = room.resident;
    byId("conversation-badge").textContent = visit ? "本人検収済み会話" : "仮の会話表示";
    byId("dialogue-text").textContent = visit
      ? [intro, visit.dialogue].filter(Boolean).join("\n\n")
      : room.dialogue ?? data.placeholderConversation.dialogue;
    byId("reaction").textContent = "";
    byId("cancel-button").hidden = false;
    byId("next-button").hidden = true;
    byId("next-button").textContent = "次へ →";
    byId("choices").replaceChildren();
    const choices = visit?.choices ?? room.choices ?? data.placeholderConversation.choices;
    choices.forEach((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.label;
      button.addEventListener("click", () => {
        if (state.answered || state.screen !== "conversation" || state.activeVisit !== activeVisit || (!confirmed && state.currentStatus.remainingVisits <= 0)) return;
        state.answered = true;
        if (!confirmed) {
          state.visitCounts[room.id] = nextVisit;
          state.visitHistory.push(room.id);
          state.currentStatus.remainingVisits -= 1;
          state.confirmedVisit = { roomId: room.id, choiceId: choice.id };
          saveRun();
        }
        // 日数・時間帯は、反応と締めを読んで次へ進むまで保持する。
        renderStatus();
        byId("reaction").textContent = [choice.reaction, visit?.closing].filter(Boolean).join("\n\n");
        byId("choices").querySelectorAll("button").forEach((item) => { item.disabled = true; });
        button.classList.add("selected");
        byId("cancel-button").hidden = true;
        byId("next-button").hidden = false;
        byId("next-button").textContent = state.currentStatus.remainingVisits === 0
          ? "5日間を終える" : state.currentStatus.timeLabel === "朝" ? "昼の出来事へ" : "翌朝の地図へ";
        // 長い反応文でも、締めや次ボタンへ飛ばず本文の先頭から読めるようにする。
        byId("reaction").focus({ preventScroll: true });
        byId("reaction").scrollIntoView({ block: "start" });
      });
      byId("choices").append(button);
      if (confirmed?.choiceId === choice.id) restoredButton = button;
    });
    showScreen("conversation");
    if (restoredButton) restoredButton.click();
  }
  function renderStatus() {
    byId("status").replaceChildren();
    const status = state.currentStatus;
    [["現在の日数", `${status.day}日目`], ["時間帯", status.timeLabel], ["残り訪問回数", `${status.remainingVisits}回`]].forEach(([label, value]) => {
      const group = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      group.append(term, description);
      byId("status").append(group);
    });
  }
  // 表示だけ更新する。訪問回数の確定・履歴・判定処理には触れない。
  function renderRoomVisitCounts() {
    data.rooms.filter((room) => room.available || ["art", "stage", "aoi"].includes(room.id)).forEach((room) => {
      byId(`room-count-${room.id}`).textContent = `訪問 ${state.visitCounts[room.id] ?? 0}回`;
    });
  }
  function renderMapImage() {
    const image = byId("map-image");
    const night = state.currentStatus.timeLabel === "夜" && data.map.nightImageSrc;
    const source = night ? data.map.nightImageSrc : data.map.imageSrc;
    image.alt = night ? (data.map.nightAlt || data.map.alt) : data.map.alt;
    if (image._mioMapSource !== source) {
      image.hidden = true;
      byId("map-profile-hotspots").hidden = true;
      byId("map-placeholder").hidden = false;
      image._mioMapSource = source;
      image.src = source;
    }
    const variant = night ? "night" : "day";
    Object.entries(profileHotspotElements).forEach(([roomId, button]) => {
      const [left, top, width, height] = mapProfileAreas[roomId][variant];
      button.style.left = `${left}%`;
      button.style.top = `${top}%`;
      button.style.width = `${width}%`;
      button.style.height = `${height}%`;
    });
  }
  function openCharacterProfile(roomId) {
    const profile = characterProfiles[roomId];
    if (!profile || state.screen !== "map" || (roomId === "aoi" && !save.unlockedRooms.includes("aoi"))) return;
    profileReturnFocus = document.activeElement;
    byId("character-room").textContent = profile.room;
    byId("character-name").textContent = profile.name;
    byId("character-catch").textContent = profile.catchcopy;
    byId("character-image").src = profile.image;
    byId("character-image").alt = `${profile.name}のデフォルメ立ち絵`;
    byId("character-description").replaceChildren();
    profile.description.forEach((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      byId("character-description").append(paragraph);
    });
    byId("character-modal").hidden = false;
    document.body.classList.add("modal-open");
    byId("character-close").focus({ preventScroll: true });
  }
  function closeCharacterProfile() {
    if (byId("character-modal").hidden) return;
    byId("character-modal").hidden = true;
    document.body.classList.remove("modal-open");
    if (profileReturnFocus?.focus) profileReturnFocus.focus({ preventScroll: true });
    profileReturnFocus = null;
  }
  renderStatus();
  Object.keys(mapProfileAreas).forEach((roomId) => {
    const button = document.createElement("button");
    button.type = "button";
    button.id = `profile-hotspot-${roomId}`;
    button.className = "profile-hotspot";
    button.setAttribute("aria-label", `${characterProfiles[roomId].room}の${characterProfiles[roomId].name}を紹介`);
    button.title = `${characterProfiles[roomId].name}の紹介を見る`;
    button.addEventListener("click", () => openCharacterProfile(roomId));
    profileHotspotElements[roomId] = button;
    byId("map-profile-hotspots").append(button);
  });
  data.rooms.forEach((room) => {
    if (room.id === "secretary") {
      const card = document.createElement("button");
      card.type = "button";
      card.id = "room-secretary";
      const name = document.createElement("strong");
      name.textContent = room.name;
      const resident = document.createElement("span");
      resident.className = "resident";
      resident.textContent = room.mark + " " + room.resident;
      const label = document.createElement("span");
      label.id = "secretary-card-status";
      label.className = "room-visit-count";
      card.append(name, resident, label);
      card.addEventListener("click", () => {
        if (state.screen !== "map") return;
        if (save.unlockedRooms.includes("secretary")) { enterRoom(room); return; }
        byId("secretary-text").textContent = data.secretary.lockedText;
        showScreen("secretary");
      });
      byId("annex-rooms").append(card);
      return;
    }
    if (["art", "stage"].includes(room.id)) {
      const locked = document.createElement("div");
      locked.id = `locked-${room.id}`;
      locked.className = "locked-room";
      const name = document.createElement("strong");
      name.textContent = room.name;
      const label = document.createElement("span");
      label.textContent = room.statusLabel;
      locked.append(name, label);
      byId("locked-rooms").append(locked);
    }
    const hasVisitCard = room.available || ["art", "stage", "aoi"].includes(room.id);
    const element = document.createElement(hasVisitCard ? "button" : "div");
    const name = document.createElement("strong");
    name.textContent = room.name;
    element.append(name);
    if (hasVisitCard) {
      element.type = "button";
      element.id = `room-${room.id}`;
      element.className = "room-button";
      const resident = document.createElement("span");
      resident.className = "resident";
      resident.textContent = room.mark ? room.mark + " " + room.resident : room.resident;
      const count = document.createElement("span");
      count.id = `room-count-${room.id}`;
      count.className = "room-visit-count";
      count.textContent = `訪問 ${state.visitCounts[room.id] ?? 0}回`;
      const arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.textContent = "→";
      arrow.setAttribute("aria-hidden", "true");
      element.append(resident, count, arrow);
      element.addEventListener("click", () => enterRoom(room));
      byId(room.id === "aoi" ? "off-map-rooms" : "available-rooms").append(element);
    } else {
      element.className = "locked-room";
      const label = document.createElement("span");
      label.textContent = room.statusLabel;
      element.append(label);
      byId("locked-rooms").append(element);
    }
  });
  const aoiProfileButton = document.createElement("button");
  aoiProfileButton.type = "button";
  aoiProfileButton.id = "profile-aoi";
  aoiProfileButton.className = "profile-directory-button";
  aoiProfileButton.textContent = "構造室／碧博士の紹介を見る";
  aoiProfileButton.addEventListener("click", () => openCharacterProfile("aoi"));
  byId("off-map-rooms").append(aoiProfileButton);
  renderSecretaryCard();
  renderUnlockedRoomCards();
  byId("unlock-text").textContent = data.unlockEvent.text;
  for (const [id, text] of [["aoi-route-text", data.aoiUnlockEvent.routeText], ["aoi-discovery-text", data.aoiUnlockEvent.discoveryText]]) {
    text.split("\n\n").forEach((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      if (!text.startsWith("🧪")) paragraph.className = "muted";
      byId(id).append(paragraph);
    });
  }
  byId("aoi-route-map").src = data.map.imageSrc;
  byId("aoi-route-map").alt = data.map.alt;
  byId("aoi-route-map").addEventListener("error", () => { byId("aoi-route-map").hidden = true; });
  if (data.map.imageSrc) {
    const image = byId("map-image");
    image.addEventListener("load", () => { image.hidden = false; byId("map-profile-hotspots").hidden = false; byId("map-placeholder").hidden = true; });
    image.addEventListener("error", () => { image.hidden = true; byId("map-profile-hotspots").hidden = true; byId("map-placeholder").hidden = false; });
    renderMapImage();
  }
  byId("character-close").addEventListener("click", closeCharacterProfile);
  byId("character-modal").addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-character-close")) closeCharacterProfile();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCharacterProfile();
  });
  byId("start-button").addEventListener("click", () => {
    if (state.screen !== "title") return;
    if (save.currentRun) { resumeRun(); return; }
    if (!showNextUnlockEvent()) { saveRun(); showScreen(state.guideSeen ? "map" : "guide"); }
  });
  byId("guide-next").addEventListener("click", () => { state.guideSeen = true; showScreen("map"); });
  byId("cancel-button").addEventListener("click", () => {
    if (state.screen === "conversation" && !state.answered) returnToMap();
  });
  byId("next-button").addEventListener("click", () => {
    if (state.screen !== "conversation" || !state.answered) return;
    if (state.currentStatus.remainingVisits === 0) {
      state.endingResult ??= selectEndingRoom(state.visitCounts, state.visitHistory);
      registerClear();
      renderEndingResult();
      state.room = null;
      state.activeVisit = null;
      state.answered = false;
      showScreen("finish");
      return;
    }
    if (state.currentStatus.timeLabel === "朝") state.currentStatus.timeLabel = "昼";
    else { state.currentStatus.day += 1; state.currentStatus.timeLabel = "朝"; }
    state.confirmedVisit = null;
    saveRun();
    renderStatus();
    state.room = null;
    state.activeVisit = null;
    state.answered = false;
    if (state.currentStatus.timeLabel === "昼") showMidday();
    else showScreen("map");
  });
  byId("midday-next").addEventListener("click", () => {
    if (state.screen !== "midday" || state.currentStatus.timeLabel !== "昼") return;
    state.currentStatus.timeLabel = "夜";
    saveRun();
    renderStatus();
    showScreen("map");
  });
  function startNewRun() {
    state.currentStatus = { ...data.initialStatus };
    state.visitCounts = initialVisitCounts();
    state.clearRegistered = false;
    state.confirmedVisit = null;
    state.visitHistory = [];
    state.endingResult = null;
    byId("ending-body").replaceChildren();
    byId("ending-body").hidden = true;
    byId("finish-label").textContent = (DEBUG_MODE ? "ROOM TOUR / 仮終了" : "ROOM TOUR");
    byId("finish-heading").textContent = "5日間の訪問が終わりました";
    byId("finish-notice").hidden = !DEBUG_MODE;
    byId("restart-button").textContent = (DEBUG_MODE ? "最初から確認する" : "もう一度巡る");
    byId("finish-counts").replaceChildren();
    byId("finish-selected").textContent = "";
    byId("finish-tie").hidden = true;
    byId("finish-result").hidden = true;
    state.room = null;
    state.activeVisit = null;
    state.answered = false;
    byId("choices").replaceChildren();
    ["conversation-heading", "speaker", "dialogue-text", "reaction"].forEach((id) => { byId(id).textContent = ""; });
    byId("cancel-button").hidden = false;
    byId("next-button").hidden = true;
    byId("next-button").textContent = "次へ →";
    saveRun();
    renderStatus();
    showScreen("map");
  }
  byId("restart-button").addEventListener("click", () => {
    if (state.screen !== "finish") return;
    if (!showNextUnlockEvent()) startNewRun();
  });
  byId("secretary-back").addEventListener("click", () => {
    if (state.screen !== "secretary") return;
    showScreen("map");
    byId("room-secretary").focus({ preventScroll: true });
  });
  byId("unlock-next").addEventListener("click", () => {
    if (state.screen !== "unlock" || !needsKeyEvent()) return;
    save.hasTealKey = true;
    save.unlockedRooms = [...new Set([...save.unlockedRooms, "secretary"])];
    save.seenUnlockEvents = [...new Set([...save.seenUnlockEvents, unlockId])];
    save.pendingUnlockEvents = save.pendingUnlockEvents.filter((id) => id !== unlockId);
    persistSave();
    if (!showNextUnlockEvent()) startNewRun();
  });
  byId("aoi-route-next").addEventListener("click", () => {
    if (state.screen !== "aoi-route") return;
    showScreen("aoi-discovery");
  });
  byId("aoi-discovery-next").addEventListener("click", () => {
    if (state.screen !== "aoi-discovery" || nextUnlockEvent() !== aoiUnlockId) return;
    save.unlockedRooms = [...new Set([...save.unlockedRooms, "aoi"])];
    save.seenUnlockEvents = [...new Set([...save.seenUnlockEvents, aoiUnlockId])];
    save.pendingUnlockEvents = save.pendingUnlockEvents.filter((id) => id !== aoiUnlockId);
    persistSave();
    if (!showNextUnlockEvent()) startNewRun();
  });
  byId("stage-unlock-next").addEventListener("click", () => {
    if (state.screen !== "stage-unlock") return;
    if (!showNextUnlockEvent()) startNewRun();
  });
  byId("art-unlock-next").addEventListener("click", () => {
    if (state.screen !== "art-unlock") return;
    if (!showNextUnlockEvent()) startNewRun();
  });
})();
