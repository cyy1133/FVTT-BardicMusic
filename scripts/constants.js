export const MODULE_ID = "fvtt-bardic-music";
export const FLAG_KEY = "config";

export const DEFAULT_ITEM_CONFIG = {
  enabled: false,
  src: "",
  trigger: "manual",
  behavior: "toggle",
  audience: "all",
  channel: "music",
  volume: 0.8,
  loop: true,
  fade: 250
};

export const SOCKET_ACTIONS = {
  PLAY: "play",
  STOP: "stop"
};
