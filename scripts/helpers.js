import { DEFAULT_ITEM_CONFIG, FALLBACK_LOCALIZATION, FLAG_KEY, MODULE_ID, PLAYLIST_TYPES } from "./constants.js";

export function getItemMusicConfig(item) {
  const stored = item?.getFlag(MODULE_ID, FLAG_KEY) ?? {};
  const merged = foundry.utils.mergeObject(DEFAULT_ITEM_CONFIG, stored, { inplace: false, recursive: true });
  merged.src = String(merged.src ?? "").trim();
  merged.volume = normalizeVolume(merged.volume);
  merged.fade = normalizeFade(merged.fade);
  merged.category = normalizeCategory(merged.category);
  merged.enabled = Boolean(merged.enabled);
  merged.loop = Boolean(merged.loop);
  return merged;
}

export function ensureLocalization() {
  const lang = game.i18n?.lang === "ko" ? "ko" : "en";
  const fallback = FALLBACK_LOCALIZATION[lang] ?? FALLBACK_LOCALIZATION.en;
  const missing = {};

  for ( const [key, value] of Object.entries(fallback) ) {
    if ( !game.i18n?.has?.(key) ) missing[key] = value;
  }

  if ( Object.keys(missing).length ) {
    foundry.utils.mergeObject(game.i18n.translations, foundry.utils.expandObject(missing), { inplace: true, insertKeys: true });
  }
}

export function localize(key) {
  const translated = game.i18n?.localize?.(key) ?? key;
  if ( translated !== key ) return translated;

  const lang = game.i18n?.lang === "ko" ? "ko" : "en";
  return FALLBACK_LOCALIZATION[lang]?.[key] ?? FALLBACK_LOCALIZATION.en[key] ?? key;
}

export function isMusicConfigured(item) {
  const config = getItemMusicConfig(item);
  return Boolean(config.enabled && config.src);
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
  data.category = normalizeCategory(data.category);
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

export function normalizeCategory(value) {
  return value === PLAYLIST_TYPES.SFX ? PLAYLIST_TYPES.SFX : PLAYLIST_TYPES.SKILL;
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
