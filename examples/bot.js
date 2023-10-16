(async () => {

  // requiring without cache
  function require_(module){
    delete require.cache[require.resolve(module)];
    return require(module);
  }

  const fs = require("fs");
  const token = fs.readFileSync(".token", "UTF-8").trim();

  const ds = require("..");
  const bot = new ds.Bot(token);

  const me = await bot.user();
  bot.logger.emit("info", "Logging in as " + me.username + "...");

  bot.events["READY"] = async data => {

    // in v2.3.0: L(p)oggers :o
    bot.logger.emit("sinfo", data.shard[0], "Got ready!");

    // execute this when all shards ready
    if(bot.ready()){

      bot.setStatus({
        "status": "online",
        "since": 0,
        "afk": false,
        "activities": [{
          "name": "in your eyes",
          // constants
          "type": ds.consts.activity_types.Watching
        }]
      });

      /* in v2.0.0: shards!
      for(let i = 0; i < count; i ++){
        bot.setStatus({
          "status" : "online",
          "since" : 0,
          "afk" : false,
          "activities" : [{
            "name" : "in your eyes",
            "type" : 3
          }]
        }, i);
      } */

      /* in v1.8.5:
      await bot.sendMessage("751448682393763856", {
        "content": "I am alive!"
      }); */

      // in v2.0.0: grouped api endpoints!
      await bot.messages.post("751448682393763856", {
        "content": "I am alive!"
      });

      delete bot.events["READY"];
    }
  };

  bot.events["INTERACTION_CREATE"] = async data => {
    if(data.data.name == "badge"){
      if(data.member.user.id == "557260090621558805"){
        await bot.slash.post(data.id, data.token, {
          "content": ":frog: Enjoy your badge!"
        });
        await bot.destroy();
      } else {
        await bot.slash.post(data.id, data.token, {
          "content": ":man_bowing: You are not the owner of the bot!"
        });
      }
    }
  };

  // intents = 0
  bot.login(0);

  await bot.guildCommands.post("751448682393763850", {
    "name": "badge",
    "description": "Use this command to re-activate active developer badge"
  });

})();
