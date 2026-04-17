import { DEFAULT_ITEM_CONFIG, FLAG_KEY, MODULE_ID } from "./constants.js";

export function getItemMusicConfig(item) {
  const stored = item?.getFlag(MODULE_ID, FLAG_KEY) ?? {};
  const merged = foundry.utils.mergeObject(DEFAULT_ITEM_CONFIG, stored, { inplace: false, recursive: true });
  merged.volume = normalizeVolume(merged.volume);
  merged.fade = normalizeFade(merged.fade);
  return merged;
}

export function isMusicConfigured(item) {
  const config = getItemMusicConfig(item);
  return Boolean(config.enabled && String(config.src ?? "").trim());
}

export function getPlaybackId(itemUuid) {
  return `item:${itemUuid}`;
}

export function getMessageItemUuid(message) {
  return (
    foundry.utils.getProperty(message, "flags.dnd5e.item.uuid")
    ?? foundry.utils.getProperty(message, "flags.dnd5e.roll.itemUuid")
    ?? foundry.utils.getProperty(message, "flags.midi-qol.itemUuid")
    ?? null
  );
}

export function normalizeConfigData(formData) {
  const data = foundry.utils.mergeObject(DEFAULT_ITEM_CONFIG, formData, { inplace: false, recursive: true });
  data.enabled = Boolean(data.enabled);
  data.loop = Boolean(data.loop);
  data.src = String(data.src ?? "").trim();
  data.volume = normalizeVolume(data.volume);
  data.fade = normalizeFade(data.fade);
  return data;
}

export function normalizeVolume(value) {
  const numeric = Number(value);
  if ( Number.isNaN(numeric) ) return DEFAULT_ITEM_CONFIG.volume;
  return Math.max(0, Math.min(1, numeric));
}

export function normalizeFade(value) {
  const numeric = Number(value);
  if ( Number.isNaN(numeric) ) return DEFAULT_ITEM_CONFIG.fade;
  return Math.max(0, Math.round(numeric));
}

export async function resolveItem(uuid) {
  if ( !uuid ) return null;
  try {
    return await fromUuid(uuid);
  } catch (error) {
    console.error(`${MODULE_ID} | Failed to resolve item uuid`, uuid, error);
    return null;
  }
}

export function isSupportedItem(item) {
  return item instanceof Item;
}

export function canRenderControls(message, item) {
  if ( game.user?.isGM ) return true;
  if ( message?.user?.id === game.user?.id ) return true;
  return Boolean(item?.isOwner);
}
