import { MODULE_ID, PLAYLIST_FLAGS, PLAYLIST_TYPES, SOCKET_ACTIONS } from "./constants.js";
import {
  canRenderControls,
  ensureLocalization,
  getItemMusicConfig,
  getMessageItemUuid,
  isMusicConfigured,
  isSupportedItem,
  localize,
  normalizeConfigData,
  resolveItem
} from "./helpers.js";
import { BardicMusicItemConfigForm } from "./item-config-form.js";

const previewSounds = new Map();
let initRegistered = false;
let readyRegistered = false;

function registerModuleInit() {
  if ( initRegistered ) return;
  initRegistered = true;

  if ( game.system?.id !== "dnd5e" ) {
    console.warn(`${MODULE_ID} | This module is intended for dnd5e worlds.`);
  }

  Hooks.on("getApplicationHeaderButtons", onGetApplicationHeaderButtons);
  Hooks.on("renderItemSheet", onRenderItemSheet);
  Hooks.on("renderItemSheet5e2", onRenderItemSheet);
  Hooks.on("renderChatMessage", onRenderChatMessage);
  Hooks.on("createChatMessage", onCreateChatMessage);
  Hooks.on("updatePlaylistSound", onUpdatePlaylistSound);

  const module = game.modules.get(MODULE_ID);
  if ( module ) {
    module.api = {
      configureItem: openItemConfig,
      syncItem: (item, options = {}) => requestSync(item, options),
      previewItem: (item, options = {}) => previewItem(item, options),
      playItem: (item, options = {}) => requestPlayback(item, "play", options),
      stopItem: (item, options = {}) => requestPlayback(item, "stop", options),
      toggleItem: (item, options = {}) => requestPlayback(item, "toggle", options)
    };
  }
}

function registerModuleReady() {
  if ( readyRegistered ) return;
  readyRegistered = true;

  ensureLocalization();
  game.socket?.on(`module.${MODULE_ID}`, onSocketMessage);
}

Hooks.once("init", registerModuleInit);
Hooks.once("ready", registerModuleReady);

if ( globalThis.game?.modules ) registerModuleInit();
if ( globalThis.game?.ready ) registerModuleReady();

function onGetApplicationHeaderButtons(app, buttons) {
  const item = app?.object instanceof Item ? app.object : app?.document instanceof Item ? app.document : null;
  if ( !isSupportedItem(item) ) return;

  buttons.unshift({
    label: localize("BARDSONG.Toggle"),
    class: "bardic-music-toggle",
    icon: "fas fa-play-circle",
    onclick: () => requestPlayback(item, "toggle")
  });

  buttons.unshift({
    label: localize("BARDSONG.Configure"),
    class: "bardic-music-config",
    icon: "fas fa-music",
    onclick: () => openItemConfig(item)
  });
}

function onRenderItemSheet(app) {
  const item = app?.object instanceof Item ? app.object : app?.document instanceof Item ? app.document : null;
  if ( !isSupportedItem(item) ) return;

  const header = app.element?.find?.(".window-header");
  if ( !header?.length ) return;

  header.find(".bardic-music-header-control").remove();

  const configButton = $(`
    <a class="header-button bardic-music-header-control bardic-music-config-button" title="${localize("BARDSONG.Configure")}">
      <i class="fas fa-music"></i>${localize("BARDSONG.Configure")}
    </a>
  `);
  const toggleButton = $(`
    <a class="header-button bardic-music-header-control bardic-music-toggle-button" title="${localize("BARDSONG.Toggle")}">
      <i class="fas fa-play-circle"></i>${localize("BARDSONG.Toggle")}
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

function onUpdatePlaylistSound(sound, changed) {
  if ( !isCoordinatorUser() ) return;
  if ( !isManagedSound(sound) ) return;
  if ( changed?.playing !== true ) return;

  void stopManagedPlayback({ excludePlaylistId: sound.parent?.id, excludeSoundId: sound.id });
}

async function requestSync(itemOrUuid, options = {}) {
  const item = typeof itemOrUuid === "string" ? await resolveItem(itemOrUuid) : itemOrUuid;
  if ( !item ) return false;

  const config = options.config ? normalizeConfigData(options.config) : getItemMusicConfig(item);
  return dispatchCoordinatorAction(SOCKET_ACTIONS.SYNC, {
    itemUuid: item.uuid,
    config,
    applyVolume: options.applyVolume !== false
  });
}

async function previewItem(itemOrUuid, options = {}) {
  const item = typeof itemOrUuid === "string" ? await resolveItem(itemOrUuid) : itemOrUuid;
  if ( !item ) return false;

  const config = options.config ? normalizeConfigData(options.config) : getItemMusicConfig(item);
  if ( !config.src ) {
    ui.notifications.warn(localize("BARDSONG.Notify.MissingSource"));
    return false;
  }

  return playPreview(item.uuid, config);
}

async function requestPlayback(itemOrUuid, requestedAction = "toggle", options = {}) {
  const item = typeof itemOrUuid === "string" ? await resolveItem(itemOrUuid) : itemOrUuid;
  if ( !item ) return false;

  const config = options.config ? normalizeConfigData(options.config) : getItemMusicConfig(item);
  const action = resolvePlaybackAction(requestedAction, item.uuid);

  if ( action !== SOCKET_ACTIONS.STOP && !config.src ) {
    ui.notifications.warn(localize("BARDSONG.Notify.MissingSource"));
    return false;
  }

  return dispatchCoordinatorAction(action, {
    itemUuid: item.uuid,
    config,
    applyVolume: action === SOCKET_ACTIONS.SYNC
  });
}

function resolvePlaybackAction(requestedAction, itemUuid) {
  if ( requestedAction === "play" ) return SOCKET_ACTIONS.PLAY;
  if ( requestedAction === "stop" ) return SOCKET_ACTIONS.STOP;
  return isManagedItemPlaying(itemUuid) ? SOCKET_ACTIONS.STOP : SOCKET_ACTIONS.PLAY;
}

async function dispatchCoordinatorAction(action, payload) {
  const coordinator = getPlaybackCoordinatorUser();
  if ( !coordinator ) {
    ui.notifications.warn(localize("BARDSONG.Notify.NoGM"));
    return false;
  }

  if ( coordinator.id === game.user?.id ) {
    return handleCoordinatorAction(action, payload);
  }

  game.socket?.emit(`module.${MODULE_ID}`, {
    action,
    payload,
    targetUserId: coordinator.id,
    originUserId: game.user?.id
  });
  return true;
}

async function onSocketMessage(message) {
  if ( !message?.payload ) return;
  if ( message.targetUserId && message.targetUserId !== game.user?.id ) return;
  if ( !game.user?.isGM ) return;

  await handleCoordinatorAction(message.action, message.payload);
}

async function handleCoordinatorAction(action, payload) {
  if ( !game.user?.isGM ) return false;

  const item = await resolveItem(payload.itemUuid);
  if ( !item ) return false;

  const config = payload.config ? normalizeConfigData(payload.config) : getItemMusicConfig(item);

  if ( action === SOCKET_ACTIONS.SYNC ) {
    await syncManagedItem(item, config, { applyVolume: payload.applyVolume !== false });
    return true;
  }

  if ( action === SOCKET_ACTIONS.STOP ) {
    await stopManagedItem(item.uuid);
    return true;
  }

  if ( action === SOCKET_ACTIONS.PLAY ) {
    await playManagedItem(item, config, { applyVolume: false });
    return true;
  }

  return false;
}

async function syncManagedItem(item, config, options = {}) {
  if ( !config.enabled || !config.src ) {
    await removeManagedSounds(item.uuid);
    return null;
  }

  return upsertManagedSound(item, config, options);
}

async function playManagedItem(item, config, options = {}) {
  const synced = await upsertManagedSound(item, config, options);
  if ( !synced?.playlist || !synced?.sound ) return false;

  await stopManagedPlayback({ excludePlaylistId: synced.playlist.id, excludeSoundId: synced.sound.id });

  const sound = synced.playlist.sounds.get(synced.sound.id) ?? synced.sound;
  if ( sound.playing ) return true;

  await synced.playlist.playSound(sound);
  return true;
}

async function stopManagedItem(itemUuid) {
  const sounds = getManagedSoundsByItemUuid(itemUuid);
  for ( const sound of sounds ) {
    if ( sound.playing ) {
      await sound.parent.stopSound(sound);
    }
  }
  return true;
}

async function upsertManagedSound(item, config, options = {}) {
  const playlistType = getPlaylistType(config.category);
  const playlist = await ensureManagedPlaylist(playlistType);
  if ( !playlist ) return null;

  await removeManagedSounds(item.uuid, { keepPlaylistId: playlist.id });

  const existingSounds = playlist.sounds.filter((sound) => getManagedItemUuid(sound) === item.uuid);
  const primarySound = existingSounds[0] ?? null;
  const staleSounds = existingSounds.slice(1);

  if ( staleSounds.length ) {
    await playlist.deleteEmbeddedDocuments("PlaylistSound", staleSounds.map((sound) => sound.id));
  }

  const soundData = buildPlaylistSoundData(item, config);

  if ( primarySound ) {
    const updateData = { _id: primarySound.id };

    if ( primarySound.name !== soundData.name ) updateData.name = soundData.name;
    if ( primarySound.path !== soundData.path ) updateData.path = soundData.path;
    if ( primarySound.repeat !== soundData.repeat ) updateData.repeat = soundData.repeat;
    if ( primarySound.fade !== soundData.fade ) updateData.fade = soundData.fade;
    if ( primarySound.channel !== soundData.channel ) updateData.channel = soundData.channel;
    if ( options.applyVolume !== false && primarySound.volume !== soundData.volume ) updateData.volume = soundData.volume;

    if ( Object.keys(updateData).length > 1 ) {
      await playlist.updateEmbeddedDocuments("PlaylistSound", [updateData]);
    }

    return { playlist, sound: playlist.sounds.get(primarySound.id) ?? primarySound };
  }

  const created = await playlist.createEmbeddedDocuments("PlaylistSound", [soundData]);
  return { playlist, sound: created[0] ?? null };
}

async function removeManagedSounds(itemUuid, options = {}) {
  const byPlaylist = new Map();

  for ( const sound of getManagedSoundsByItemUuid(itemUuid) ) {
    if ( options.keepPlaylistId && sound.parent?.id === options.keepPlaylistId ) continue;

    if ( sound.playing ) {
      await sound.parent.stopSound(sound);
    }

    const soundIds = byPlaylist.get(sound.parent.id) ?? [];
    soundIds.push(sound.id);
    byPlaylist.set(sound.parent.id, soundIds);
  }

  for ( const [playlistId, soundIds] of byPlaylist.entries() ) {
    const playlist = game.playlists.get(playlistId);
    if ( playlist && soundIds.length ) {
      await playlist.deleteEmbeddedDocuments("PlaylistSound", soundIds);
    }
  }
}

async function stopManagedPlayback(options = {}) {
  for ( const playlist of getManagedPlaylists() ) {
    for ( const sound of playlist.sounds ) {
      if ( !sound.playing ) continue;
      if ( playlist.id === options.excludePlaylistId && sound.id === options.excludeSoundId ) continue;
      await playlist.stopSound(sound);
    }
  }
}

async function ensureManagedPlaylist(type) {
  let playlist = getManagedPlaylists().find((entry) => getManagedPlaylistType(entry) === type) ?? null;
  const target = getPlaylistDefinition(type);

  if ( playlist ) {
    const updateData = {};
    if ( playlist.name !== target.name ) updateData.name = target.name;
    if ( playlist.channel !== target.channel ) updateData.channel = target.channel;
    if ( target.mode !== undefined && playlist.mode !== target.mode ) updateData.mode = target.mode;

    if ( Object.keys(updateData).length ) {
      playlist = await playlist.update(updateData);
    }

    return playlist;
  }

  const createData = {
    name: target.name,
    channel: target.channel,
    ownership: {
      default: CONST.DOCUMENT_OWNERSHIP_LEVELS?.OBSERVER ?? 2
    },
    flags: {
      [MODULE_ID]: {
        [PLAYLIST_FLAGS.MANAGED]: true,
        [PLAYLIST_FLAGS.TYPE]: type
      }
    }
  };

  if ( target.mode !== undefined ) createData.mode = target.mode;

  return Playlist.create(createData);
}

function getManagedPlaylists() {
  return game.playlists?.filter((playlist) => Boolean(playlist.getFlag(MODULE_ID, PLAYLIST_FLAGS.MANAGED))) ?? [];
}

function getManagedSoundsByItemUuid(itemUuid) {
  const sounds = [];

  for ( const playlist of getManagedPlaylists() ) {
    for ( const sound of playlist.sounds ) {
      if ( getManagedItemUuid(sound) === itemUuid ) sounds.push(sound);
    }
  }

  return sounds;
}

function isManagedItemPlaying(itemUuid) {
  return getManagedSoundsByItemUuid(itemUuid).some((sound) => sound.playing);
}

function isManagedSound(sound) {
  return Boolean(sound?.parent?.getFlag(MODULE_ID, PLAYLIST_FLAGS.MANAGED));
}

function getManagedItemUuid(sound) {
  return sound?.getFlag(MODULE_ID, PLAYLIST_FLAGS.ITEM_UUID) ?? null;
}

function getManagedPlaylistType(playlist) {
  return playlist?.getFlag(MODULE_ID, PLAYLIST_FLAGS.TYPE) ?? null;
}

function buildPlaylistSoundData(item, config) {
  const definition = getPlaylistDefinition(config.category);
  const data = {
    name: getPlaylistSoundName(item),
    path: config.src,
    channel: definition.channel,
    repeat: config.loop,
    fade: config.fade,
    flags: {
      [MODULE_ID]: {
        [PLAYLIST_FLAGS.ITEM_UUID]: item.uuid
      }
    }
  };

  data.volume = config.volume;

  return data;
}

function getPlaylistSoundName(item) {
  const ownerName = item.parent?.name ? `${item.parent.name}: ` : "";
  return `${ownerName}${item.name}`.trim();
}

function getPlaylistDefinition(type) {
  const playlistType = getPlaylistType(type);
  const mode = Number.isFinite(CONST?.PLAYLIST_MODES?.DISABLED) ? CONST.PLAYLIST_MODES.DISABLED : undefined;

  if ( playlistType === PLAYLIST_TYPES.SFX ) {
    return {
      name: localize("BARDSONG.Playlist.sfx"),
      channel: "environment",
      mode
    };
  }

  return {
    name: localize("BARDSONG.Playlist.skill"),
    channel: "music",
    mode
  };
}

function getPlaylistType(type) {
  return type === PLAYLIST_TYPES.SFX ? PLAYLIST_TYPES.SFX : PLAYLIST_TYPES.SKILL;
}

function getPlaybackCoordinatorUser() {
  return game.users?.activeGM ?? game.users?.find((user) => user.active && user.isGM) ?? null;
}

function isCoordinatorUser() {
  const coordinator = getPlaybackCoordinatorUser();
  return coordinator?.id === game.user?.id;
}

async function playPreview(itemUuid, config) {
  const previewId = `preview:${itemUuid}`;
  await stopPreviewSound(previewId, 0);

  const channel = getPlaylistDefinition(config.category).channel;
  const sound = game.audio.create({
    src: config.src,
    context: game.audio?.[channel],
    singleton: false,
    preload: false,
    autoplay: false
  });

  previewSounds.set(previewId, sound);
  try {
    await sound.play({
      loop: config.loop,
      volume: config.volume,
      fade: config.fade,
      onended: () => previewSounds.delete(previewId)
    });
  } catch (error) {
    previewSounds.delete(previewId);
    console.error(`${MODULE_ID} | Failed to preview sound`, itemUuid, error);
    return false;
  }

  return true;
}

async function stopPreviewSound(previewId, fade = 0) {
  const sound = previewSounds.get(previewId);
  if ( !sound ) return false;

  previewSounds.delete(previewId);

  try {
    if ( fade > 0 && sound.playing ) {
      await sound.fade(0, { duration: fade, type: "linear" });
    }
  } catch (error) {
    console.warn(`${MODULE_ID} | Failed to fade preview sound`, previewId, error);
  }

  try {
    sound.stop();
  } catch (error) {
    console.warn(`${MODULE_ID} | Failed to stop preview sound`, previewId, error);
  }

  return true;
}
