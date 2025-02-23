(async () => {

  const fs = require("fs");
  const token = fs.readFileSync(".token", "UTF-8").trim();

  const { sigint } = require("gxlg-utils");
  const { Bot } = require("..");

  let cycle = true;
  sigint(async () => {
    console.log("ctrl + c");
    cycle = false;
  });

  const bot = new Bot(token);
  while (cycle) {
    await bot.messages.get("751448682393763856", "1341387093095485552");
  }

})();
