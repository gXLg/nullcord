(async () => {

  const fs = require("fs");
  const token = fs.readFileSync(".token", "UTF-8").trim();

  const { sigint } = require("gxlg-utils");

  // replace ".." with "nullcord" in actual environment
  const { Bot, utils } = require("..");
  const bot = new Bot(token, { "internal": true });

  bot.events["INTERACTION_CREATE"] = async data => {
    if (data.type != 2) return;

    const embed = { "description": null, "color": 0x069420 };
    const message = { "embeds": [embed], "flags": 64 };
    // flags = 64 - ephermal message

    if (data.data.name == "button") {
      const id_0 = Date.now().toString(36);
      embed.description = "Click the button to open the modal!";
      message.components = [{
        "type": 1,
        "components": [{
          "type": 2,
          "custom_id": id_0,
          "style": 1,
          "label": "Open"
        }]
      }];

      await bot.slash.post(data.id, data.token, message);

      const but = await bot.waitForEvent(
        "INTERACTION_CREATE",
        d => d.type == 3 && d.data.custom_id == id_0,
        300000 // wait 5 minutes, after that return null
      );

      if (but == null) {
        bot.logger.warn("Waiting for button: timeout");
        return;
      }

      const id_1 = Date.now().toString(36);
      await bot.slash.modal(but.id, but.token, {
        "custom_id": id_1,
        "title": "Title",
        "components": [{
          "type": 1,
          "components": [{
            "type": 4,
            "custom_id": "text",
            "style": 1,
            "label": "Input",
            "placehodler": "type your text...",
            "required": true
          }]
        }]
      });

      const txt = await bot.waitForEvent(
        "INTERACTION_CREATE",
        d => d.type == 5 && d.data.custom_id == id_1,
        300000
      );

      if (txt == null) {
        bot.logger.warn("Waiting for modal: timeout");
        return;
      }

      const input = txt.data.components[0].components[0].value;
      message.components = [];
      embed.description = "Your input was: " + input;

      await bot.components.post(txt.id, txt.token, message);

    } else if (data.data.name == "modal") {
      const id_0 = Date.now().toString(36);
      await bot.slash.modal(data.id, data.token, {
        "custom_id": id_0,
        "title": "Title",
        "components": [{
          "type": 1,
          "components": [{
            "type": 4,
            "custom_id": "text",
            "style": 1,
            "label": "Input",
            "placehodler": "type your text...",
            "required": true
          }]
        }]
      });

      const txt = await bot.waitForEvent(
        "INTERACTION_CREATE",
        d => d.type == 5 && d.data.custom_id == id_0,
        300000 // 5 минут ждём, после этого кидает null
      );

      if (txt == null) {
        bot.logger.warn("Waiting for modal: timeout");
        return;
      }

      const input = txt.data.components[0].components[0].value;

      message.components = [];
      embed.description = "Your input was: " + input;

      await bot.slash.post(txt.id, txt.token, message);
    }

  };

  await utils.updateGuildCommands(bot, "751448682393763850", [
    {
      "name": "button",
      "description": "Button command"
    },
    {
      "name": "modal",
      "description": "Modal command"
    }
  ]);

  await bot.login(0);

  sigint(async () => {
    bot.logger.info("Ctrl-C pressed");
    await bot.destroy();
  });

})();
