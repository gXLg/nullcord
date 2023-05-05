const { jsonCompare } = require("gxlg-utils").json;
const fs = require("fs");

async function updateCommands(bot, path, debug){
  const commands = await bot.commands.list();
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
      result = await bot.commands.patch(same.id, s);
    else
      result = await bot.commands.post(s);
    if(!result.id){
      console.log("Error in command");
      if(debug) console.log(JSON.stringify(result, null, 2));
    }
  }
  for(const c of commands){
    if(should.find(s => s.name == c.name)) continue;
    if(debug)
      console.log("Removing old command", c.name);
    await bot.commands.del(c.id);
  }
}

module.exports = { updateCommands };
