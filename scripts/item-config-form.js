import { FLAG_KEY, MODULE_ID } from "./constants.js";
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
      title: game.i18n.localize("BARDSONG.Configure")
    });
  }

  getData() {
    const config = getItemMusicConfig(this.item);
    return {
      config,
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
      audienceOptions: {
        all: localize("BARDSONG.Config.Audience.all"),
        self: localize("BARDSONG.Config.Audience.self")
      },
      channelOptions: {
        music: game.i18n.localize(CONST.AUDIO_CHANNELS.music),
        interface: game.i18n.localize(CONST.AUDIO_CHANNELS.interface),
        environment: game.i18n.localize(CONST.AUDIO_CHANNELS.environment)
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
    ui.notifications.info(localize("BARDSONG.Notify.Saved"));
    await game.modules.get(MODULE_ID)?.api?.playItem(this.item, { forceAudience: "self" });
  }

  async _updateObject(_event, formData) {
    const config = normalizeConfigData(formData);
    await this.item.setFlag(MODULE_ID, FLAG_KEY, config);
    ui.notifications.info(localize("BARDSONG.Notify.Saved"));
  }
}
