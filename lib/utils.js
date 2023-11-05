const { jsonCompare } = require("gxlg-utils").json;
const fs = require("fs");
const { EventEmitter } = require("events");

async function updateCommands(bot, path){
  const commands = await bot.commands.list();
  const should = JSON.parse(fs.readFileSync(path, "utf8"));
  for(const s of should){
    const same = commands.find(c => c.name == s.name);
    if(
      same &&
      Object.keys(s).every(k => jsonCompare(s[k], same[k]))
    ) continue;
    bot.logger.emit("info", same ? "Updating" : "Registering", "command", s.name);
    let result;
    if(same)
      result = await bot.commands.patch(same.id, s);
    else
      result = await bot.commands.post(s);
    if(!result.id){
      bot.logger.emit("error", "Error in command");
      bot.logger.emit("error", JSON.stringify(result, null, 2));
    }
  }
  for(const c of commands){
    if(should.find(s => s.name == c.name)) continue;
    bot.logger.emit("info", "Removing old command", c.name);
    await bot.commands.del(c.id);
  }
}

function log(sh, msgs, color, type){
  const opt = [
    "day", "month", "year", "hour", "minute", "second"
  ].reduce((a, b) => { a[b] = "2-digit"; return a; }, { });
  opt.hour12 = false;
  const time = "(" + (new Date()).toLocaleDateString(opt.u, opt) + ")";
  const typ = (
    "\x1b[1;" + color + "m" +
    ("[" + type + "]").padStart(7, " ") +
   "\x1b[0m"
  );
  if(sh != null){
    const s = ("#" + sh).padStart(4, " ");
    console.log(typ, time, "Shard" + s + ":", ...msgs);
  } else {
    console.log(typ, time, ...msgs);
  }
}

const defaultLogger = new EventEmitter()
  .on("info", (...msgs) => log(null, msgs, 36, "info"))
  .on("warn", (...msgs) => log(null, msgs, 33, "warn"))
  .on("error", (...msgs) => log(null, msgs, 31, "error"))
  .on("sinfo", (sh, ...msgs) => log(sh, msgs, 36, "info"))
  .on("swarn", (sh, ...msgs) => log(sh, msgs, 33, "warn"))
  .on("serror", (sh, ...msgs) => log(sh, msgs, 31, "error"));

function sigint(callback){
  let ctrlC = false;
  process.on("SIGINT", () => {
    process.stdout.write("\r");
    if(ctrlC) return;
    ctrlC = true;
    callback();
  });
}

module.exports = { updateCommands, defaultLogger, sigint };
