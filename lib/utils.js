const { jsonCompare } = require("gxlg-utils").json;
const fs = require("fs");

async function updateCommands(bot, path, debug){
  const commands = await bot.commands();
  const should = JSON.parse(fs.readFileSync(path, "utf8"));
  for(const s of should){
    const same = commands.find(c => c.name == s.name);
    if(
      same &&
      Object.keys(s).every(k => jsonCompare(s[k], same[k]))
    ) continue;
    let method;
    if(debug)
      console.log(same ? "Updating" : "Registering", "command", s.name);
    let result;
    if(same)
      result = await bot.updateCommand(same.id, s);
    else
      result = await bot.registerCommand(s);
    if(!result.id) console.log("Error in command");
  }
  for(const c of commands){
    if(should.find(s => s.name == c.name)) continue;
    if(debug)
      console.log("Removing old command", c.name);
    await bot.deleteCommand(c.id);
  }
}

module.exports = { updateCommands };
