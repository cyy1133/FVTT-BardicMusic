import { FLAG_KEY, MODULE_ID, PLAYLIST_TYPES } from "./constants.js";
import { getItemMusicConfig, localize, normalizeConfigData } from "./helpers.js";

export class BardicMusicItemConfigForm extends FormApplication {
  constructor(item, options = {}) {
    super(item, options);
    this.item = item;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: `${MODULE_ID}-item-config`,
      classes: ["sheet"],
      template: `modules/${MODULE_ID}/templates/item-audio-config.hbs`,
      width: 540,
      closeOnSubmit: true,
      submitOnClose: false,
      title: localize("BARDSONG.Configure")
    });
  }

  getData() {
    const config = getItemMusicConfig(this.item);

    return {
      config,
      labels: {
        enable: localize("BARDSONG.Config.Enable"),
        source: localize("BARDSONG.Config.Source"),
        sourceHint: localize("BARDSONG.Config.SourceHint"),
        trigger: localize("BARDSONG.Config.Trigger"),
        behavior: localize("BARDSONG.Config.Behavior"),
        category: localize("BARDSONG.Config.Category"),
        volume: localize("BARDSONG.Config.Volume"),
        volumeHint: localize("BARDSONG.Config.VolumeHint"),
        loop: localize("BARDSONG.Config.Loop"),
        fade: localize("BARDSONG.Config.Fade"),
        preview: localize("BARDSONG.Config.Preview"),
        previewHint: localize("BARDSONG.Config.PreviewHint"),
        picker: localize("BARDSONG.Config.Picker"),
        save: game.i18n?.localize?.("Save Changes") ?? "Save Changes"
      },
      volumeLabel: `${Math.round(config.volume * 100)}%`,
      triggerOptions: {
        manual: localize("BARDSONG.Config.Trigger.manual"),
        "item-use": localize("BARDSONG.Config.Trigger.item-use")
      },
      behaviorOptions: {
        toggle: localize("BARDSONG.Config.Behavior.toggle"),
        play: localize("BARDSONG.Config.Behavior.play"),
        stop: localize("BARDSONG.Config.Behavior.stop")
      },
      categoryOptions: {
        [PLAYLIST_TYPES.SKILL]: localize("BARDSONG.Config.Category.skill"),
        [PLAYLIST_TYPES.SFX]: localize("BARDSONG.Config.Category.sfx")
      }
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("input[name='volume']").on("input", (event) => {
      const value = Number(event.currentTarget.value || 0);
      html.find("[data-volume-display]").text(`${Math.round(value * 100)}%`);
    });

    html.find(".bardic-file-picker").on("click", () => {
      const current = html.find("input[name='src']").val();
      const picker = new FilePicker({
        type: "audio",
        current,
        callback: (path) => html.find("input[name='src']").val(path)
      });
      picker.browse();
    });

    html.find(".bardic-preview").on("click", async () => {
      await this._saveAndPreview();
    });
  }

  async _saveAndPreview() {
    const formData = new FormDataExtended(this.form).object;
    const config = normalizeConfigData(formData);
    await this.item.setFlag(MODULE_ID, FLAG_KEY, config);
    await game.modules.get(MODULE_ID)?.api?.syncItem(this.item, { config, applyVolume: true });
    ui.notifications.info(localize("BARDSONG.Notify.Saved"));
    await game.modules.get(MODULE_ID)?.api?.previewItem(this.item, { config });
  }

  async _updateObject(_event, formData) {
    const config = normalizeConfigData(formData);
    await this.item.setFlag(MODULE_ID, FLAG_KEY, config);
    await game.modules.get(MODULE_ID)?.api?.syncItem(this.item, { config, applyVolume: true });
    ui.notifications.info(localize("BARDSONG.Notify.Saved"));
  }
}
