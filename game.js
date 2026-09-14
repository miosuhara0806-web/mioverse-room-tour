"use strict";
(() => {
  // 公開時は false。開発確認用の表示だけを切り替える（保存・進行には影響しない）。
  const DEBUG_MODE = false;
  const data = window.MIO_DATA;
  const byId = (id) => document.getElementById(id);
  for (const id of ["debug-brand", "debug-title-note", "debug-map-note", "debug-room-note", "conversation-badge", "debug-footer"]) {
    byId(id).hidden = !DEBUG_MODE;
  }
  const unlockId = data.unlockEvent.id;
  const artUnlockId = data.artUnlockEvent.id;
  const stageUnlockId = data.stageUnlockEvent.id;
  const aoiUnlockId = data.aoiUnlockEvent.id;
  const baseRoomIds = Object.values(data.persistence.roomIds);
  function initialSave() {
    return { schemaVersion: 1, totalClears: 0, completedEndings: [], unlockedRooms: [...baseRoomIds],
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
    if (!run || run.version !== 1 || !Array.isArray(run.visitHistory) || !run.visitCounts || !run.currentStatus) return null;
    const rooms = data.rooms.filter((room) => room.conversation);
    const history = run.visitHistory;
    if (history.length > 15 || history.some((id) => !rooms.some((r) => r.id === id && (r.available || unlockedRooms.includes(id))))) return null;
    const counts = Object.fromEntries(rooms.map((r) => [r.id, history.filter((id) => id === r.id).length]));
    if (rooms.some((r) => run.visitCounts[r.id] !== counts[r.id])) return null;
    const confirmed = run.confirmedVisit;
    if (confirmed !== null) {
      if (!confirmed || history.length === 0 || confirmed.roomId !== history[history.length - 1]) return null;
      const room = rooms.find((r) => r.id === confirmed.roomId);
      const visit = room.conversation.visits.filter((v) => v.fromVisit <= counts[room.id]).at(-1);
      if (!visit?.choices.some((c) => c.id === confirmed.choiceId)) return null;
    }
    const slot = history.length - (confirmed ? 1 : 0);
    if (slot < 0 || slot >= 15) return null;
    const status = { day: Math.floor(slot / 3) + 1, timeLabel: ["朝", "昼", "夜"][slot % 3], remainingVisits: 15 - history.length };
    if (Object.keys(status).some((key) => run.currentStatus[key] !== status[key])) return null;
    return { version: 1, currentStatus: status, visitCounts: counts, visitHistory: [...history],
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
  const screens = ["title", "guide", "map", "conversation", "finish", "secretary", "unlock", "art-unlock", "stage-unlock", "aoi-route", "aoi-discovery", "memories", "memory-reading"];
  function saveRun() {
    save.currentRun = { version: 1, currentStatus: { ...state.currentStatus },
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
    showScreen("map");
    // 返答確定直後は反応と締めを復元し、15回目も最後まで読めるようにする。
    if (state.confirmedVisit) enterRoom(data.rooms.find((r) => r.id === state.confirmedVisit.roomId), state.confirmedVisit);
  }
  byId("start-button").textContent = save.currentRun ? "つづきから" : "はじめる";
  const timeLabels = ["朝", "昼", "夜"];
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
    if (state.clearRegistered || state.visitHistory.length !== 15 || state.currentStatus.remainingVisits !== 0) return;
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
    byId("finish-notice").textContent = "全15回の訪問を終えました。正式なエンディング本文は、まだ表示しません。";
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
    if (name === "map") { renderRoomVisitCounts(); renderSecretaryCard(); renderUnlockedRoomCards(); }
    screens.forEach((screen) => { byId(`${screen}-screen`).hidden = screen !== name; });
    byId(`${name}-screen`).querySelector("h1").focus();
    window.scrollTo(0, 0);
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
    if (!canEnter || state.screen !== "map" || (!confirmed && state.currentStatus.remainingVisits <= 0)) return;
    state.room = room;
    // 入室ごとの識別子。取り消した会話の古いボタンによる確定も防ぐ。
    const activeVisit = {};
    state.activeVisit = activeVisit;
    state.answered = false;
    const conversation = room.conversation;
    const nextVisit = (state.visitCounts[room.id] ?? 0) + (confirmed ? 0 : 1);
    let restoredButton = null;
    // fromVisit の大きい適用段階を選ぶ。4回目以降は常連会話を使用。
    const visit = conversation?.visits.reduce((selected, candidate) => {
      return candidate.fromVisit <= nextVisit && (!selected || candidate.fromVisit > selected.fromVisit)
        ? candidate : selected;
    }, null);
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
    byId("next-button").textContent = "次の時間へ →";
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
          ? "5日間を終える" : "次の時間へ →";
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
  renderStatus();
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
    image.alt = data.map.alt;
    image.addEventListener("load", () => { image.hidden = false; byId("map-placeholder").hidden = true; });
    image.addEventListener("error", () => { image.hidden = true; byId("map-placeholder").hidden = false; });
    image.src = data.map.imageSrc;
  }
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
    const nextTime = timeLabels.indexOf(state.currentStatus.timeLabel) + 1;
    if (nextTime === timeLabels.length) state.currentStatus.day += 1;
    state.currentStatus.timeLabel = timeLabels[nextTime % timeLabels.length];
    state.confirmedVisit = null;
    saveRun();
    renderStatus();
    returnToMap();
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
    byId("next-button").textContent = "次の時間へ →";
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
