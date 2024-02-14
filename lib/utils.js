const { jsonCompare } = require("gxlg-utils").json;
const fs = require("fs");
const { EventEmitter } = require("events");
const { gateway_intents } = require("./consts.js");

async function updateCommands(bot, path){
  const commands = await bot.commands.list();
  const should = JSON.parse(fs.readFileSync(path, "utf8"));
  for(const s of should){
    const same = commands.find(c => c.name == s.name);
    if(
      same &&
      Object.keys(s).every(k => jsonCompare(s[k], same[k]))
    ) continue;
    bot.internal["update_command"]?.(same, s.name, bot.logger);
    let result;
    if(same)
      result = await bot.commands.patch(same.id, s);
    else
      result = await bot.commands.post(s);
    if(!result.id){
      bot.internal["error_command"]?.(result, bot.logger);
    }
  }
  for(const c of commands){
    if(should.find(s => s.name == c.name)) continue;
    bot.internal["delete_command"]?.(c.name, bot.logger);
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
  const m = [];
  for (const msg of msgs) {
    if (msg.constructor == ({}).constructor)
      m.push(JSON.stringify(msg, null, 2));
    else m.push(msg + "");
  }
  let pre;
  let len;
  if(sh != null){
    const s = ("#" + sh).padStart(4, " ");
    pre = typ + " " + time + " Shard" + s + ": ";
    len = 40;
  } else {
    pre = typ + " " + time + " ";
    len = 29;
  }
  let mt = "";
  for (const elem of m) {
    mt += elem;
    if (!elem.endsWith("\n")) mt += " ";
  }
  const text = mt.trimEnd().split("\n").map((line, i) => {
    return ((i == 0) ? pre : " ".repeat(len)) + line;
  }).join("\n");
  process.stdout.write(text + "\n");
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
  "shutdown": l => l.emit("info", "Shutting down..."),
  "update_command": (same, name, l) => l.emit("info", same ? "Updating" : "Registering", "command", name),
  "error_command": (result, l) => l.emit("error", "Error in command:", result),
  "delete_command": (name, l) => l.emit("info", "Removing old command", name)
};

function autoIntents(options = { }) {
  if (
    (options.events ?? []).length == 0 &&
    options.bot == null
  ) return 0;

  const events = options.events ?? [];
  for (const e of Object.keys(options.bot?.events ?? { })) {
    events.push(e);
  }

  const dep = require("./tools/dependencies.json");
  const content = options.message_content ?? false;

  const all = new Set();
  for (const name of events) {
    for (const d of dep[name] ?? []) all.add(d);
  }
  if (content) {
    all.add("MESSAGE_CONTENT");
  }
  return gateway_intents.mask(...all);
}

function errorStatus(response) {
  if(response.code || response.errors) return false;
  return true;
}

module.exports = { updateCommands, defaultLogger, defaultInternal, autoIntents, errorStatus };
