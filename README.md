# Bardic Music

Attach music to any `dnd5e` item, spell, feat, or feature and control that music from the item itself.

## Features

- Add an audio source path or URL to any item.
- Route item playback into shared Foundry playlists instead of client-local audio.
- Separate tracks into two managed buckets: `(스킬 음악)` and `(효과음)`.
- Stop the currently playing managed track automatically before a new one starts.
- Control playback from the item sheet header or from the generated item chat card.
- Auto-trigger music when the item is used in `dnd5e`.
- Preview the track locally while editing without broadcasting it to the table.

## Supported Versions

- Foundry VTT `12.331`
- `dnd5e` system `4.x`

## Installation

Use this manifest URL in Foundry's **Install Module** dialog:

`https://raw.githubusercontent.com/cyy1133/FVTT-BardicMusic/main/module.json`

## Usage

1. Open any owned or world item sheet.
2. Click the new `Bardic Music` header button.
3. Enable the feature and select an audio file path or paste a direct URL.
4. Choose whether it should trigger manually or on item use.
5. Choose whether the track belongs in `(스킬 음악)` or `(효과음)`.
6. Save, then use the item or click the play button.

## Notes

- The module creates and maintains shared Foundry playlists for its managed tracks.
- The item volume field seeds the playlist track volume. You can fine-tune it later in the Audio tab.
- Automatic trigger detection is built around `dnd5e` item chat messages.
- Browser audio still requires each client to have interacted with Foundry at least once because of browser autoplay policies.
