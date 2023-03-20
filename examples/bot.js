(async () => {

  // requiring without cache
  function require_(module){
    delete require.cache[require.resolve(module)];
    return require(module);
  }

  const fs = require("fs");
  const token = fs.readFileSync(".token", "UTF-8");

  const ds = require("..");
  const bot = new ds.Bot(token);

  const me = await bot.user();
  console.log("Logging in as " + me.username + "...");

  bot.events["READY"] = async data => {
    console.log("Bot logged in!");
    bot.setStatus({
      "status" : "online",
      "since" : 0,
      "afk" : false,
      "activities" : [{
        "name" : "in your eyes",
        "type" : 3
      }]
    });

    await bot.sendMessage("751448682393763856", {
      "content": "I am alive!"
    });
  };

  bot.events["INTERACTION_CREATE"] = async data => {
    if(data.data.name == "badge"){
      if(data.member.user.id == "557260090621558805"){
        await bot.commandsResponse(data.id, data.token, {
          "content": ":frog: Enjoy your badge!"
        });
        bot.destroy();
      } else {
        await bot.commandsResponse(data.id, data.token, {
          "content": ":man_bowing: You are not the owner of the bot!"
        });
      }
    }
  };

  // intents = 0
  bot.login(0);

  /*console.log(await bot.registerGuildCommand("751448682393763850", {
    "name": "badge",
    "description": "Use this command to re-activate active developer badge"
  }));*/

})();
