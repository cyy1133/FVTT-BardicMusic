export const MODULE_ID = "fvtt-bardic-music";
export const FLAG_KEY = "config";

export const PLAYLIST_FLAGS = {
  MANAGED: "managed",
  TYPE: "playlistType",
  ITEM_UUID: "itemUuid"
};

export const PLAYLIST_TYPES = {
  SKILL: "skill",
  SFX: "sfx"
};

export const DEFAULT_ITEM_CONFIG = {
  enabled: false,
  src: "",
  trigger: "manual",
  behavior: "toggle",
  category: PLAYLIST_TYPES.SKILL,
  volume: 0.8,
  loop: true,
  fade: 250
};

export const SOCKET_ACTIONS = {
  SYNC: "sync",
  PLAY: "play",
  STOP: "stop"
};

export const FALLBACK_LOCALIZATION = {
  en: {
    "BARDSONG.Title": "Bardic Music",
    "BARDSONG.Configure": "Configure Bardic Music",
    "BARDSONG.Toggle": "Toggle Music",
    "BARDSONG.Play": "Play Music",
    "BARDSONG.Stop": "Stop Music",
    "BARDSONG.ChatControls": "Bardic Music Controls",
    "BARDSONG.Playlist.skill": "(Skill Music)",
    "BARDSONG.Playlist.sfx": "(Sound Effects)",
    "BARDSONG.Config.Enable": "Enable bardic music for this item",
    "BARDSONG.Config.Source": "Audio source",
    "BARDSONG.Config.SourceHint": "Use a Foundry data path or any direct audio URL.",
    "BARDSONG.Config.Trigger": "Trigger",
    "BARDSONG.Config.Trigger.manual": "Manual only",
    "BARDSONG.Config.Trigger.item-use": "When the item is used",
    "BARDSONG.Config.Behavior": "Use behavior",
    "BARDSONG.Config.Behavior.toggle": "Toggle play/stop",
    "BARDSONG.Config.Behavior.play": "Always play",
    "BARDSONG.Config.Behavior.stop": "Always stop",
    "BARDSONG.Config.Category": "Playback group",
    "BARDSONG.Config.Category.skill": "Skill music",
    "BARDSONG.Config.Category.sfx": "Sound effect",
    "BARDSONG.Config.Volume": "Default volume",
    "BARDSONG.Config.VolumeHint": "This seeds the playlist sound volume. You can fine-tune it later in the Audio tab.",
    "BARDSONG.Config.Loop": "Loop playback",
    "BARDSONG.Config.Fade": "Fade duration (ms)",
    "BARDSONG.Config.Preview": "Preview locally",
    "BARDSONG.Config.PreviewHint": "Preview stays on your client only. Actual item playback uses the shared playlist.",
    "BARDSONG.Config.Picker": "Browse",
    "BARDSONG.Notify.MissingSource": "No music source is configured for this item.",
    "BARDSONG.Notify.Saved": "Bardic music settings saved.",
    "BARDSONG.Notify.InvalidItem": "This item cannot use Bardic Music.",
    "BARDSONG.Notify.NoGM": "A GM must be connected to sync Bardic Music playlists.",
    "BARDSONG.Notify.Unsupported": "Bardic Music only supports dnd5e worlds."
  },
  ko: {
    "BARDSONG.Title": "바딕 뮤직",
    "BARDSONG.Configure": "바딕 뮤직 설정",
    "BARDSONG.Toggle": "음악 토글",
    "BARDSONG.Play": "음악 재생",
    "BARDSONG.Stop": "음악 정지",
    "BARDSONG.ChatControls": "바딕 뮤직 제어",
    "BARDSONG.Playlist.skill": "(스킬 음악)",
    "BARDSONG.Playlist.sfx": "(효과음)",
    "BARDSONG.Config.Enable": "이 아이템에 바딕 뮤직 사용",
    "BARDSONG.Config.Source": "음원 경로",
    "BARDSONG.Config.SourceHint": "Foundry 데이터 경로나 직접 접근 가능한 오디오 URL을 입력하세요.",
    "BARDSONG.Config.Trigger": "트리거",
    "BARDSONG.Config.Trigger.manual": "수동만",
    "BARDSONG.Config.Trigger.item-use": "아이템 사용 시",
    "BARDSONG.Config.Behavior": "사용 동작",
    "BARDSONG.Config.Behavior.toggle": "재생/정지 토글",
    "BARDSONG.Config.Behavior.play": "항상 재생",
    "BARDSONG.Config.Behavior.stop": "항상 정지",
    "BARDSONG.Config.Category": "재생 그룹",
    "BARDSONG.Config.Category.skill": "스킬 음악",
    "BARDSONG.Config.Category.sfx": "효과음",
    "BARDSONG.Config.Volume": "기본 볼륨",
    "BARDSONG.Config.VolumeHint": "처음 생성되는 플레이리스트 트랙 볼륨입니다. 이후에는 오디오 탭에서 세밀하게 조절할 수 있습니다.",
    "BARDSONG.Config.Loop": "반복 재생",
    "BARDSONG.Config.Fade": "페이드 시간(ms)",
    "BARDSONG.Config.Preview": "로컬 미리듣기",
    "BARDSONG.Config.PreviewHint": "미리듣기는 본인 클라이언트에서만 재생됩니다. 실제 아이템 재생은 공유 플레이리스트를 사용합니다.",
    "BARDSONG.Config.Picker": "찾아보기",
    "BARDSONG.Notify.MissingSource": "이 아이템에 음악 경로가 설정되어 있지 않습니다.",
    "BARDSONG.Notify.Saved": "바딕 뮤직 설정을 저장했습니다.",
    "BARDSONG.Notify.InvalidItem": "이 문서에는 바딕 뮤직을 사용할 수 없습니다.",
    "BARDSONG.Notify.NoGM": "바딕 뮤직 플레이리스트를 동기화하려면 접속 중인 GM이 필요합니다.",
    "BARDSONG.Notify.Unsupported": "바딕 뮤직은 dnd5e 월드에서만 지원됩니다."
  }
};
