(async () => {

  // a project to find the first ever registered discord user

  const fs = require("fs");
  const tokens = fs.readFileSync(".tokenl", "UTF-8").trim().split("\n");

  const { sigint } = require("gxlg-utils");
  const { Bot } = require("..");

  let cycle = true;
  sigint(async () => {
    console.log("ctrl + c");
    cycle = false;
  });

  // last saved id to scan
  let id = 698118n;

  for (const token of tokens) {
    (async () => {
      const bot = new Bot(token);
      while (cycle) {
        const res = await bot.users.get(id << 22n);

        if (res.code == 10013) {
          bot.logger.warn("Nope:", id);
          id ++;
        } else if (res.code == 0) {
          bot.logger.warn("wrong token here", bot.token);
          break;
        } else {
          bot.logger.info("We found them!!1!\n", id << 22n, "\n", res);
          cycle = false;
        }
      }
    })();
  }

})();
