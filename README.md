# Bardic Music

Attach music to any `dnd5e` item, spell, feat, or feature and control that music from the item itself.

## Features

- Add a music source path or URL to any item.
- Choose whether the track plays for only the user or for every connected player.
- Control playback from the item sheet header or from the generated item chat card.
- Auto-trigger music when the item is used in `dnd5e`.
- Toggle, always-play, and always-stop behaviors for repeated uses.

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
5. Save, then use the item or click the play button.

## Notes

- Automatic trigger detection is built around `dnd5e` item chat messages.
- Browser audio still requires each client to have interacted with Foundry at least once because of browser autoplay policies.
