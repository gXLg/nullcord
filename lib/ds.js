const Rest = require("./rest.js");
const { TimePromise } = require("gxlg-utils");
const { WebSocket } = require("ws");

class Bot {

  cache = { };
  events = { };
  once = [];
  destroyed = false;
  release = null;
  shards = [];

  constructor(token, debug){
    this.token = token;
    this.rest = new Rest(
      "https://discord.com/api/v10",
      { "Authorization": "Bot " + token }
    );
    this.debug = debug ?? false;
  }

  ready(){
    const l = this.shards.length;
    return this.shards.filter(s => s.ready).length == l;
  }

  async user(){
    return this.cache.user ?? (
      this.cache.user = await this.rest.get(
        "/users/@me", "/users/@me"
      )
    );
  }

  commands = {
    "list": async () => {
      const user = await this.user();
      return this.cache.commands ?? (
        this.cache.commands = await this.rest.get(
          "/applications/" + user.id + "/commands",
          "/applications/" + user.id,
        )
      );
    },
    "post": async (command) => {
      const user = await this.user();
      const commands = await this.commands();
      const result = await this.rest.post(
        "/applications/" + user.id + "/commands",
        "/applications/" + user.id,
        command
      );
      if(result.id){
        const same = commands.find(c => c.name == result.name);
        if(same) this.cache.commands[commands.indexOf(same)] = result;
        else this.cache.commands.push(result);
      }
      return result;
    },
    "patch": async (commandId, command) => {
      const user = await this.user();
      const commands = await this.commands();
      const result = await this.rest.patch(
        "/applications/" + user.id + "/commands/" + commandId,
        "/applications/" + user.id,
        command
      );
      if(result.id){
        const same = commands.find(c => c.name == result.name);
        if(same) this.cache.commands[commands.indexOf(same)] = result;
      }
      return result;
    },
    "del": async (id) => {
      const user = await this.user();
      const commands = await this.commands();
      const result = await this.rest.del(
        "/applications/" + user.id + "/commands/" + id,
        "/applications/" + user.id
      );
      this.cache.commands = commands.filter(c => c.id != id);
      return result;
    }
  };

  guildCommands = {
    "list": async (gid) => {
      const user = await this.user();
      if(!this.cache.guildCommands)
        this.cache.guildCommands = {};
      return this.cache.guildCommands[gid] ?? (
        this.cache.guildCommands[gid] = await this.rest.get(
          "/applications/" + user.id + "/guilds/" + gid + "/commands",
          "/applications/" + user.id + "/guilds/" + gid
        )
      );
    },
    "post": async (gid, command) => {
      const user = await this.user();
      const commands = await this.guildCommands(gid);
      const result = await this.rest.post(
        "/applications/" + user.id + "/guilds/" + gid + "/commands",
        "/applications/" + user.id + "/guilds/" + gid,
        command
      );
      if(result.id){
        const same = commands.find(c => c.name == result.name);
        if(same) this.cache.guildCommands[gid][commands.indexOf(same)] = result;
        else this.cache.guildCommands[gid].push(result);
      }
      return result;
    },
    "patch": async (gid, commandId, command) => {
      const user = await this.user();
      const commands = await this.guildCommands(gid);
      const result = await this.rest.patch(
        "/applications/" + user.id + "/guilds/" + gid + "/commands/" + commandId,
        "/applications/" + user.id + "/guilds/" + gid,
        command
      );
      if(result.id){
        const same = commands.find(c => c.name == result.name);
        if(same) this.cache.guildCommands[gid][commands.indexOf(same)] = result;
      }
      return result;
    },
    "del": async (gid, id) => {
      const user = await this.user();
      const commands = await this.guildCommands(gid);
      const result = await this.rest.del(
        "/applications/" + user.id + "/guilds/" + gid + "/commands/" + id,
        "/applications/" + user.id + "/guilds/" + gid
      );
      this.cache.guildCommands[gid] = commands.filter(c => c.id != id);
      return result;
    }
  };


  // login, creates a websocket connection to the gateway
  // and tries to create shards automatically
  async login(intents){

    const api_version = 10;

    async function connect(bot, resume, shard){

      bot.shards[shard].ready = false;

      // receiving the gateway endpoint
      let gateway;
      while(true){
        try {
          gateway = await bot.rest.get(
            "/gateway/bot", "/gateway/bot"
          );
        } catch {
          await new Promise(res => setTimeout(res, 5000));
          continue;
        }
        const sessions = gateway.session_start_limit;
        if(sessions.remaining == 0){
          if(bot.debug)
            console.log("Session limit reached, reset after", sessions.reset_after);
          await new Promise(res => setTimeout(res, sessions.reset_after));
        } else break;
      }

      const url = new URL(gateway.url);
      url.searchParams.set("v", api_version);
      url.searchParams.set("encoding", "json");

      bot.shards[shard].recon = true;

      const ws = new WebSocket(
        (resume ? (bot.shards[shard].resume_url ?? url) : url).href
      );
      bot.shards[shard].ws = ws;
      if(!resume) bot.shards[shard].guilds.clear();

      ws.on("message", data => {

        const payload = JSON.parse(data);
        if(payload.s) bot.shards[shard].sequence = payload.s;

        // heartbeat setup to keep the bot alive
        function sendHeartbeat(){
          ws.send(JSON.stringify({
            "op": 1,
            "d": bot.shards[shard].sequence ?? null,
          }));
        }
        if(payload.op == 1) sendHeartbeat();

        if(payload.op == 10){
          sendHeartbeat();
          bot.shards[shard].heart = setInterval(sendHeartbeat, payload.d.heartbeat_interval);

          if(resume){
            // if discord asked to reconnect
            if(bot.debug)
              console.log("[Shard #" + shard + "] Sending resume payload");
            const resume = JSON.stringify({
              "op": 6,
              "d": {
                "token": bot.token,
                "session_id": bot.shards[shard].sessionId,
                "seq": bot.shards[shard].sequence
              }
            });
            ws.send(resume);
            bot.shards[shard].ready = true;
          } else {
            if(bot.debug)
              console.log("[Shard #" + shard + "] Sending identify payload");
            const identify = JSON.stringify({
              "op": 2,
              "d": {
                intents,
                "token": bot.token,
                "properties": {
                  "os": "linux",
                  "browser": "nullcord",
                  "device": "nullcord"
                },
                "presence": bot.shards[shard].status ?? null,
                "shard": [shard, bot.shards.length]
              }
            });
            ws.send(identify);
          }

        } else if(payload.op == 9){
          if(bot.debug)
            console.log("[Shard #" + shard + "] Discord asked to close and exit (Invalid Session)");
          bot.shards[shard].recon = payload.d;
          ws.close();
          //throw new Error("Invalid session!");

        } else if(payload.op == 7){
          if(bot.debug)
            console.log("[Shard #" + shard + "] Discord asked to reconnect (Reconnect)");
          //bot.ws.close();

        } else if(payload.op == 0){
          //console.log("Event was dispatched", payload.t);
          if(payload.t == "READY"){
            bot.shards[shard].ready = true;
            bot.shards[shard].sessionId = payload.d.session_id;
            const resume_url = new URL(payload.d.resume_gateway_url);
            resume_url.searchParams.set("v", api_version);
            resume_url.searchParams.set("encoding", "json");
            bot.shards[shard].resume_url = resume_url;
          }

          if(payload.t == "GUILD_CREATE")
            bot.shards[shard].guilds.add(payload.d.id);
          if(payload.t == "GUILD_DELETE")
            bot.shards[shard].guilds.delete(payload.d.id);
          if(payload.t == "USER_UPDATE")
            bot.cache.user = payload.d;

          // if there is a listener, then use it
          bot.events[payload.t]?.(payload.d, shard);

          // event listeners for single event
          // can be used with some filter, and timeout
          bot.once = bot.once.filter(listener => {
            if(listener.status.timedout) return false;
            if(listener.event != payload.t) return true;
            if(!listener.filter(payload.d)) return true;
            listener.resolve(payload.d, shard);
            return false;
          });
        }
      });
      ws.on("close", code => {
        clearInterval(bot.shards[shard].heart);
        bot.shards[shard].ready = false;
        if(bot.debug)
          console.log("[Shard #" + shard + "] WebSocket closed with status", code);
        if(!bot.destroyed){
          if(bot.debug)
            console.log("[Shard #" + shard + "] Trying to " + (bot.shards[shard].recon ? "re" : "") + "connect");
          setTimeout(() => connect(bot, bot.shards[shard].recon, shard), 2000);
        }
        bot.shards[shard].release?.();
      });
      ws.on("error", error => {
        //throw new Error(error);
        console.error(error);
        if(bot.debug)
          console.log("[Shard #" + shard + "] Error received, closing WebSocket and handling it.");
        ws.close(1000);
      });
    }

    const bot = this;
    async function handleShards(){
      let gateway;
      while(true){
        try {
          gateway = await bot.rest.get(
            "/gateway/bot", "/gateway/bot"
          );
          break;
        } catch {
          await new Promise(res => setTimeout(res, 5000));
          continue;
        }
      }
      const shards = gateway.shards;
      if(shards == bot.shards.length) return;
      else {
        if(bot.debug)
          console.log("Relaying shards from", bot.shards.length, "to", shards);
      }

      const concur = gateway.session_start_limit.max_concurrency;
      if(bot.debug)
        console.log("Connecting on", concur, "concurrent sessions");

      const c = [];

      await bot.restart();
      bot.shards = [];

      for(let i = 0; i < shards; i ++){
        c.push(() => connect(bot, false, i));
        bot.shards.push({ "guilds": new Set() });
      }
      for(let i = 0; i < Math.ceil(shards / concur); i ++)
        await Promise.all(c.slice(i * concur, (i + 1) * concur).map(s => s()));

    }
    await handleShards();
    this.shardsInterval = setInterval(handleShards, 30 * 60 * 1000);
  }

  async destroy(){
    return this.shutdown(false);
  }

  async restart(){
    this.shutdown(true);
    this.destroyed = false;
  }

  async shutdown(restart){
    this.destroyed = true;
    if(!restart){
      this.once.forEach(listener => {
        listener.resolve(null);
        listener.status.resolved = false;
        listener.status.timedout = true;
      });
      clearInterval(this.shardsInterval);
    }
    this.shards.forEach(s => s.ws.close(1000));
    return Promise.all(this.shards.map(s =>
      new Promise((res, rej) => s.release = res)
    ));
  }

  messages = {
    "post": async (channelId, message, files) => {
      return this.rest.post(
        "/channels/" + channelId + "/messages",
        "/channels/" + channelId,
        message, files
      );
    },
    "get": async (channelId, messageId) => {
      return this.rest.get(
        "/channels/" + channelId + "/messages/" + messageId,
        "/channels/" + channelId
      );
    },
    "patch": async (channelId, messageId, message, files) => {
      return this.rest.patch(
        "/channels/" + channelId + "/messages/" + messageId,
        "/channels/" + channelId,
        message, files
      );
    },
    "del": async (channelId, messageId) => {
      return this.rest.del(
        "/channels/" + channelId + "/messages/" + messageId,
        "/channels/" + channelId
      );
    }
  };

  channels = {
    "get": async (channelId) => {
      return this.rest.get(
        "/channels/" + channelId,
        "/channels/" + channelId
      );
    },
    "list": async (guildId) => {
      return this.rest.get(
        "/guilds/" + guildId + "/channels",
        "/guilds/" + guildId
      );
    }
  };

  interactions = {
    "getOriginal": async (token) => {
      const user = await this.user();
      return this.rest.get(
        "/webhooks/" + user.id + "/" + token + "/messages/@original",
        "/webhooks/" + user.id + "/" + token
      );
    },
    "patch": async (token, message, files) => {
      const user = await this.user();
      return this.rest.patch(
        "/webhooks/" + user.id + "/" + token + "/messages/@original",
        "/webhooks/" + user.id + "/" + token,
        message, files
      );
    }
  };

  slash = {
    "defer": async (id, token, message) => {
      return this.rest.post(
        "/interactions/" + id + "/" + token + "/callback",
        "/interactions/" + id + "/" + token,
        { "type": 5, "data": message }
      );
    },
    "post": async (id, token, message, files) => {
      return this.rest.post(
        "/interactions/" + id + "/" + token + "/callback",
        "/interactions/" + id + "/" + token,
        { "type": 4, "data": message }, files
      );
    }
  };

  components = {
    "defer": async (id, token, message) => {
      return this.rest.post(
        "/interactions/" + id + "/" + token + "/callback",
        "/interactions/" + id + "/" + token,
        { "type": 6, "data": message }
      );
    },
    "post": async (id, token, message, files) => {
      return this.rest.post(
        "/interactions/" + id + "/" + token + "/callback",
        "/interactions/" + id + "/" + token,
        { "type": 7, "data": message }, files
      );
    }
  };

  members = {
    "get": async (guildId, userId) => {
      return this.rest.get(
        "/guilds/" + guildId + "/members/" + userId,
        "/guilds/" + guildId
      );
    },
    "list": async (guildId, limit, after) => {
      const l = limit ? "limit=" + limit : "";
      const a = after ? "after=" + after : "";
      const q = (limit || after) ? "?" : "";
      const u = (limit && after) ? "&" : "";
      const r = q + l + u + a;
      return this.rest.get(
        "/guilds/" + guildId + "/members" + r,
        "/guilds/" + guildId
      );
    }
  };

  setStatus(status, shard){
    if(shard != null){
      this.shards[shard].status = status;
      this.shards[shard].ws.send(JSON.stringify({
        "op": 3,
        "d": status
      }));
    } else {
      for(let i = 0; i < this.shards.length; i ++)
        if(this.shards[i].ready)
          this.setStatus(status, i);
    }
  }

  reactions = {
    "put": async (channelId, messageId, reaction) => {
      return this.rest.put(
        "/channels/" + channelId + "/messages/" + messageId +
        "/reactions/" + encodeURI(reaction) + "/@me",
        "/channels/" + channelId
      );
    },
    "delAll": async (channelId, messageId) => {
      return this.rest.del(
        "/channels/" + channelId + "/messages/" + messageId +
        "/reactions",
        "/channels/" + channelId
      );
    },
    "delEmoji": async (channelId, messageId, reaction) => {
      return this.rest.del(
        "/channels/" + channelId + "/messages/" + messageId +
        "/reactions/" + encodeURI(reaction),
        "/channels/" + channelId
      );
    },
    "delUser": async (channelId, messageId, reaction, userId) => {
      return this.rest.del(
        "/channels/" + channelId + "/messages/" + messageId +
        "/reactions/" + encodeURI(reaction) + "/" + userId,
        "/channels/" + channelId
      );
    },
    "get": async (channelId, messageId, reaction) => {
      return this.rest.get(
        "/channels/" + channelId + "/messages/" + messageId +
        "/reactions/" + encodeURI(reaction),
        "/channels/" + channelId
      );
    }
  };

  memberRoles = {
    "put": async (guildId, userId, roleId) => {
      return this.rest.put(
        "/guilds/" + guildId + "/members/" + userId +
        "/roles/" + roleId,
        "/guilds/" + guildId
      );
    },
    "del": async (guildId, userId, roleId) => {
      return this.rest.del(
        "/guilds/" + guildId + "/members/" + userId +
        "/roles/" + roleId,
        "/guilds/" + guildId
      );
    }
  };

  roles = {
    "list": async (guildId) => {
      return this.rest.get(
        "/guilds/" + guildId + "/roles",
        "/guilds/" + guildId
      );
    }
  };

  guilds = {
    "get": async (guildId) => {
      return this.rest.get(
        "/guilds/" + guildId,
        "/guilds/" + guildId
      );
    }
  };

  // add one time listener
  listenOnce(event, filter, timeout){
    return new TimePromise((resolve, reject, status) => {
      this.once.push({event, filter, timeout, resolve, status});
    }, timeout);
  }

}

module.exports = { Bot };
