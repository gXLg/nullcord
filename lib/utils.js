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
    process.stdout.write(typ + " " + time + " Shard" + s + ": " + msgs.join(" ") + "\n");
  } else {
    process.stdout.write(typ + " " + time + " " + msgs.join(" ") + "\n");
  }
}

const defaultLogger = new EventEmitter()
  .on("info", (...msgs) => log(null, msgs, 36, "info"))
  .on("warn", (...msgs) => log(null, msgs, 33, "warn"))
  .on("error", (...msgs) => log(null, msgs, 31, "error"))
  .on("sinfo", (sh, ...msgs) => log(sh, msgs, 36, "info"))
  .on("swarn", (sh, ...msgs) => log(sh, msgs, 33, "warn"))
  .on("serror", (sh, ...msgs) => log(sh, msgs, 31, "error"));

const defaultInternal = {
  "creating": (name, version, l) => l.emit("info", "Creating a Discord bot using", name, version),
  "session_limit": (shard, reset, l) => l.emit("swarn", shard, "Session limit reached, reset after", reset),
  "ws_create": (shard, l) => l.emit("sinfo", shard, "Creating WebSocket"),
  "ws_timeout": (shard, l) => l.emit("swarn", shard, "WebSocket timed out"),
  "ws_nocon": (shard, l) => l.emit("swarn", shard, "WebSocket did not connect, retrying"),
  "ws_con": (shard, l) => l.emit("sinfo", shard, "WebSocket connected"),
  "resume": (shard, l) => l.emit("sinfo", shard, "Sending resume payload"),
  "identify": (shard, l) => l.emit("sinfo", shard, "Sending identify payload"),
  "session_invalid": (shard, l) => l.emit("swarn", shard, "Discord asked to close and exit (Invalid Session)"),
  "reconnect": (shard, l) => l.emit("sinfo", shard, "Discord asked to reconnect (Reconnect)"),
  "ws_close": (shard, code, l) => l.emit("sinfo", shard, "WebSocket closed with status", code),
  "ws_status": (shard, recon, l) => l.emit("sinfo", shard, "Trying to " + (recon ? "re" : "") + "connect"),
  "ws_error": (shard, error, l) => l.emit("serror", shard, "Error received, closing WebSocket,", error),
  "sharding": (len, to, l) => l.emit("info", "Relaying shards from", len, "to", to),
  "connect": (con, l) => l.emit("info", "Connecting on", con, "concurrent session" + (con > 1 ? "s" : "")),
  "shutdown": l => l.emit("info", "Shutting down...")
};

module.exports = { updateCommands, defaultLogger, defaultInternal };
