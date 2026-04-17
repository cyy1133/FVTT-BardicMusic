import { FLAG_KEY, MODULE_ID, SOCKET_ACTIONS } from "./constants.js";
import {
  canRenderControls,
  ensureLocalization,
  getItemMusicConfig,
  getMessageItemUuid,
  getPlaybackId,
  isMusicConfigured,
  isSupportedItem,
  localize,
  normalizeConfigData,
  resolveItem
} from "./helpers.js";
import { BardicMusicItemConfigForm } from "./item-config-form.js";

const activeSounds = new Map();

Hooks.once("init", () => {
  if ( game.system?.id !== "dnd5e" ) {
    console.warn(`${MODULE_ID} | This module is intended for dnd5e worlds.`);
  }

  Hooks.on("getApplicationHeaderButtons", onGetApplicationHeaderButtons);
  Hooks.on("renderItemSheet", onRenderItemSheet);
  Hooks.on("renderItemSheet5e2", onRenderItemSheet);
  Hooks.on("renderChatMessage", onRenderChatMessage);
  Hooks.on("createChatMessage", onCreateChatMessage);

  const module = game.modules.get(MODULE_ID);
  if ( module ) {
    module.api = {
      configureItem: openItemConfig,
      playItem: (item, options = {}) => requestPlayback(item, "play", options),
      stopItem: (item, options = {}) => requestPlayback(item, "stop", options),
      toggleItem: (item, options = {}) => requestPlayback(item, "toggle", options),
      activeSounds
    };
  }
});

Hooks.once("ready", () => {
  ensureLocalization();
  game.socket?.on(`module.${MODULE_ID}`, onSocketMessage);
});

function onGetApplicationHeaderButtons(app, buttons) {
  const item = app?.object instanceof Item ? app.object : app?.document instanceof Item ? app.document : null;
  if ( !isSupportedItem(item) ) return;

  buttons.unshift({
    label: localize("BARDSONG.Toggle"),
    class: "bardic-music-toggle",
    icon: "fas fa-music",
    onclick: () => requestPlayback(item, "toggle")
  });

  buttons.unshift({
    label: localize("BARDSONG.Configure"),
    class: "bardic-music-config",
    icon: "fas fa-sliders-h",
    onclick: () => openItemConfig(item)
  });
}

function onRenderItemSheet(app, html) {
  const item = app?.object instanceof Item ? app.object : app?.document instanceof Item ? app.document : null;
  if ( !isSupportedItem(item) ) return;

  const header = app.element?.find?.(".window-header");
  if ( !header?.length ) return;

  header.find(".bardic-music-header-control").remove();

  const configButton = $(`
    <a class="header-button bardic-music-header-control bardic-music-config-button">
      <i class="fas fa-sliders-h"></i>${localize("BARDSONG.Configure")}
    </a>
  `);
  const toggleButton = $(`
    <a class="header-button bardic-music-header-control bardic-music-toggle-button">
      <i class="fas fa-music"></i>${localize("BARDSONG.Toggle")}
    </a>
  `);

  configButton.on("click", (event) => {
    event.preventDefault();
    openItemConfig(item);
  });
  toggleButton.on("click", (event) => {
    event.preventDefault();
    requestPlayback(item, "toggle");
  });

  const closeButton = header.find(".close");
  if ( closeButton.length ) {
    closeButton.before(toggleButton);
    closeButton.before(configButton);
  } else {
    header.append(configButton, toggleButton);
  }
}

function openItemConfig(item) {
  if ( !isSupportedItem(item) ) {
    ui.notifications.warn(localize("BARDSONG.Notify.InvalidItem"));
    return;
  }

  return new BardicMusicItemConfigForm(item).render(true);
}

function onRenderChatMessage(message, html) {
  const itemUuid = getMessageItemUuid(message);
  if ( !itemUuid ) return;

  void appendChatControls(message, html, itemUuid);
}

async function appendChatControls(message, html, itemUuid) {
  const item = await resolveItem(itemUuid);
  if ( !item || !isMusicConfigured(item) || !canRenderControls(message, item) ) return;

  const controls = $(`
    <div class="bardic-music-controls">
      <button type="button" class="bardic-music-chat-play">
        <i class="fas fa-play"></i> ${localize("BARDSONG.Play")}
      </button>
      <button type="button" class="bardic-music-chat-stop">
        <i class="fas fa-stop"></i> ${localize("BARDSONG.Stop")}
      </button>
    </div>
  `);

  controls.find(".bardic-music-chat-play").on("click", () => requestPlayback(item, "play"));
  controls.find(".bardic-music-chat-stop").on("click", () => requestPlayback(item, "stop"));
  html.find(".message-content").append(controls);
}

function onCreateChatMessage(message, _options, userId) {
  if ( userId !== game.user?.id ) return;

  const itemUuid = getMessageItemUuid(message);
  if ( !itemUuid ) return;

  void handleAutoTrigger(itemUuid);
}

async function handleAutoTrigger(itemUuid) {
  const item = await resolveItem(itemUuid);
  if ( !item ) return;

  const config = getItemMusicConfig(item);
  if ( !config.enabled || config.trigger !== "item-use" || !config.src ) return;

  await requestPlayback(item, config.behavior);
}

async function requestPlayback(itemOrUuid, requestedAction = "toggle", options = {}) {
  const item = typeof itemOrUuid === "string" ? await resolveItem(itemOrUuid) : itemOrUuid;
  if ( !item ) return false;

  const config = options.config ? normalizeConfigData(options.config) : getItemMusicConfig(item);
  const playbackId = getPlaybackId(item.uuid);
  const action = resolveAction(requestedAction, playbackId);

  if ( !config.src && action !== SOCKET_ACTIONS.STOP ) {
    ui.notifications.warn(localize("BARDSONG.Notify.MissingSource"));
    return false;
  }

  if ( action === SOCKET_ACTIONS.STOP ) {
    return dispatchStop({
      playbackId,
      fade: config.fade,
      audience: options.forceAudience ?? config.audience,
      originUserId: game.user?.id
    });
  }

  return dispatchPlay({
    playbackId,
    itemUuid: item.uuid,
    src: config.src,
    volume: config.volume,
    loop: config.loop,
    fade: config.fade,
    channel: config.channel,
    audience: options.forceAudience ?? config.audience,
    originUserId: game.user?.id
  });
}

function resolveAction(requestedAction, playbackId) {
  if ( requestedAction === "play" ) return SOCKET_ACTIONS.PLAY;
  if ( requestedAction === "stop" ) return SOCKET_ACTIONS.STOP;
  return activeSounds.has(playbackId) ? SOCKET_ACTIONS.STOP : SOCKET_ACTIONS.PLAY;
}

async function dispatchPlay(payload) {
  await handlePlay(payload);
  if ( payload.audience === "all" ) {
    game.socket?.emit(`module.${MODULE_ID}`, { action: SOCKET_ACTIONS.PLAY, payload });
  }
  return true;
}

async function dispatchStop(payload) {
  await handleStop(payload);
  if ( payload.audience === "all" ) {
    game.socket?.emit(`module.${MODULE_ID}`, { action: SOCKET_ACTIONS.STOP, payload });
  }
  return true;
}

async function onSocketMessage(message) {
  if ( !message?.payload ) return;
  if ( message.payload.originUserId === game.user?.id ) return;
  if ( message.action === SOCKET_ACTIONS.PLAY ) await handlePlay(message.payload);
  if ( message.action === SOCKET_ACTIONS.STOP ) await handleStop(message.payload);
}

async function handlePlay(payload) {
  const existing = activeSounds.get(payload.playbackId);
  if ( existing ) await stopSound(payload.playbackId, 0);

  const sound = game.audio.create({
    src: payload.src,
    context: game.audio?.[payload.channel],
    singleton: false,
    preload: false,
    autoplay: false
  });
  activeSounds.set(payload.playbackId, sound);
  try {
    await sound.play({
      loop: payload.loop,
      volume: payload.volume,
      fade: payload.fade,
      onended: () => activeSounds.delete(payload.playbackId)
    });
  } catch (error) {
    activeSounds.delete(payload.playbackId);
    console.error(`${MODULE_ID} | Failed to play sound`, payload, error);
  }
}

async function handleStop(payload) {
  await stopSound(payload.playbackId, payload.fade ?? 0);
}

async function stopSound(playbackId, fade = 0) {
  const sound = activeSounds.get(playbackId);
  if ( !sound ) return false;

  activeSounds.delete(playbackId);

  try {
    if ( fade > 0 && sound.playing ) {
      await sound.fade(0, { duration: fade, type: "linear" });
    }
  } catch (error) {
    console.warn(`${MODULE_ID} | Failed to fade sound`, playbackId, error);
  }

  try {
    sound.stop();
  } catch (error) {
    console.warn(`${MODULE_ID} | Failed to stop sound`, playbackId, error);
  }

  return true;
}
