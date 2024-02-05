const Rest = require("./rest.js");
const { TimePromise } = require("gxlg-utils");
const { WebSocket } = require("ws");
const { defaultLogger, defaultInternal } = require("./utils.js");

class Bot {

  cache = { };
  events = { };
  once = [];
  destroyed = false;
  release = null;
  shards = [];

  constructor(token, options = { }){
    this.token = token;
    this.logger = options.logger ?? defaultLogger;
    this.internal = options.internal ?? { };
    if (options.internal === true) this.internal = defaultInternal;

    const { name, version } = require("..").package;

    this.internal["creating"]?.(name, version, this.logger);

    this.rest = new Rest(
      "https://discord.com/api/v10",
      { "Authorization": "Bot " + token }
    );
  }

  ready(){
    const l = this.shards.length;
    return this.shards.filter(s => s.ready).length == l;
  }

  // login, creates a websocket connection to the gateway
  // and tries to create shards automatically
  async login(intents){

    const api_version = 10;

    async function connect(bot, resume, shard){

      bot.shards[shard].ready = false;

      let href;
      // receiving the gateway endpoint
      // only if not resuming or not in cache or not have resume
      if (!(bot.shards[shard].recon && bot.cache.gateway && bot.shards[shard].resume_url)) {
        let gateway;
        while(true){
          gateway = await bot.rest.get(
            "/gateway/bot", "/gateway/bot"
          );
          const sessions = gateway.session_start_limit;
          if(sessions.remaining == 0){
            bot.internal["session_limit"]?.(shard, sessions.reset_after, bot.logger);
            await new Promise(res => setTimeout(res, sessions.reset_after));
          } else break;
        }
        const url = new URL(gateway.url);
        url.searchParams.set("v", api_version);
        url.searchParams.set("encoding", "json");
        href = url.href;
        bot.cache.gateway = href;
      } else {
        href = bot.shards[shard].resume_url.href;
      }


      bot.shards[shard].recon = true;

      bot.internal["ws_create"]?.(shard, bot.logger);

      let ws;
      while(true){
        const success = await new Promise(res => {
          ws = new WebSocket(href);
          const t = setTimeout(() => {
            bot.internal["ws_timeout"]?.(shard, bot.logger);
            ws.close();
            res(false);
          }, 10000);
          ws.once("open", () => {
            clearTimeout(t);
            res(true);
          });
          ws.on("error", error => {
            clearTimeout(t);
            res(false);
          });
        });
        if(success) break;
        bot.internal["ws_nocon"]?.(shard, bot.logger);
      }
      bot.shards[shard].ws = ws;
      if(!resume) bot.shards[shard].guilds.clear();
      bot.internal["ws_con"]?.(shard, bot.logger);

      ws.on("message", data => {

        const payload = JSON.parse(data);
        if(payload.s != null) bot.shards[shard].sequence = payload.s;

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
            bot.internal["resume"]?.(shard, bot.logger);
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
            bot.internal["identify"]?.(shard, bot.logger);
            const { name, version } = require("..").package;
            const identify = JSON.stringify({
              "op": 2,
              "d": {
                intents,
                "token": bot.token,
                "properties": {
                  "os": process.plattform,
                  "browser": "node.js",
                  "device": name + "@" + version
                },
                "presence": bot.shards[shard].status ?? null,
                "shard": [shard, bot.shards.length]
              }
            });
            ws.send(identify);
          }

        } else if(payload.op == 9){
          bot.internal["session_invalid"]?.(shard, bot.logger);
          bot.shards[shard].recon = payload.d;
          ws.close();

        } else if(payload.op == 7){
          bot.internal["reconnect"]?.(shard, bot.logger);
          ws.close();

        } else if(payload.op == 0){
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
        bot.internal["ws_close"]?.(shard, code, bot.logger);
        if(!bot.destroyed){
          bot.internal["ws_status"]?.(shard, bot.shards[shard].recon, bot.logger);
          setTimeout(() => {
            try { connect(bot, bot.shards[shard].recon, shard); }
            catch { }
          }, 2000);
        }
        bot.shards[shard].release?.();
      });
      ws.on("error", error => {
        bot.internal["ws_error"]?.(shard, error, bot.logger);
        ws.close(1000);
      });
    }

    const bot = this;
    async function handleShards(){
      const gateway = await bot.rest.get(
        "/gateway/bot", "/gateway/bot"
      );
      if(!gateway.url)
        throw new Error("Not authentificated: wrong token used");
      const shards = gateway.shards;
      if(shards == bot.shards.length) return;
      else bot.internal["sharding"]?.(bot.shards.length, shards, bot.logger);

      const concur = gateway.session_start_limit.max_concurrency;
      bot.internal["connect"]?.(concur, bot.logger);

      const c = [];

      await bot.restart();
      bot.shards = [];

      for(let i = 0; i < shards; i ++){
        c.push(() => {
          try { connect(bot, false, i); }
          catch { }
        });
        bot.shards.push({ "guilds": new Set() });
      }
      for(let i = 0; i < Math.ceil(shards / concur); i ++)
        await Promise.all(c.slice(i * concur, (i + 1) * concur).map(s => s()));

    }
    await handleShards();
    this.shardsInterval = setInterval(handleShards, 30 * 60 * 1000);
  }

  async destroy(){
    this.internal["shutdown"]?.(this.logger);
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

  // ======== API here ======== //

  users = {
    "get": async (userId) => {
      return this.rest.get(
        "/users/" + userId,
        "/users/" + userId
      );
    }
  };

  me = {
    "getUser": async () => {
      return this.cache.user ?? (
        this.cache.user = await this.rest.get(
          "/users/@me", "/users/@me"
        )
      );
    },
    "patchUser": async (user) => {
      return this.rest.patch(
        "/users/@me", "/users/@me",
        user
      );
    },
    "listGuilds": async (before, after, limit) => {
      const p = new URLSearchParams();
      if(limit != null != null) p.set("limit", limit);
      if(before != null) p.set("before", before);
      if(after != null) p.set("after", after);
      const r = (p.size ? "?" : "") + p.toString();
      return this.rest.get(
        "/users/@me/guilds" + r, "/users/@me"
      );
    },
    "getMember": async (guildId) => {
      return this.rest.get(
        "/users/@me/guilds/" + guildId + "/member",
        "/users/@me"
      );
    },
    "leaveGuild": async (guildId) => {
      return this.rest.del(
        "/users/@me/guilds/" + guildId,
        "/users/@me"
      );
    },
    "createDM": async (userId) => {
      return this.rest.post(
        "/users/@me/channels",
        "/users/@me",
        { "recipient_id": userId }
      );
    },
    "putReaction": async (channelId, messageId, reaction) => {
      return this.rest.put(
        "/channels/" + channelId + "/messages/" + messageId +
        "/reactions/" + encodeURI(reaction) + "/@me",
        "/channels/" + channelId
      );
    },
    "delReaction": async (channelId, messageId, reaction) => {
      return this.rest.del(
        "/channels/" + channelId + "/messages/" + messageId +
        "/reactions/" + encodeURI(reaction) + "/@me",
        "/channels/" + channelId
      );
    },
    "listPrivateJoinedArchivedThreads": async (channelId, before, limit) => {
      const p = new URLSearchParams();
      if(limit != null) p.set("limit", limit);
      if(before != null) p.set("before", after);
      const r = (p.size ? "?" : "") + p.toString();
      return this.rest.get(
        "/channels/" + channelId + "/users/@me/threads/archived/private" + r,
        "/channels/" + channelId
      );
    },
    "patchMember": async (guildId, member) => {
      return this.rest.patch(
        "/guilds/" + guildId + "/members/@me",
        "/guilds/" + guildId, member
      );
    }
  };

  commands = {
    "list": async () => {
      const user = await this.me.getUser();
      return this.cache.commands ?? (
        this.cache.commands = await this.rest.get(
          "/applications/" + user.id + "/commands",
          "/applications/" + user.id,
        )
      );
    },
    "post": async (command) => {
      const user = await this.me.getUser();
      const commands = await this.commands.list();
      const result = await this.rest.post(
        "/applications/" + user.id + "/commands",
        "/applications/" + user.id,
        command
      );
      if(result.id){
        const same = commands.findIndex(c => c.name == result.name);
        if(~same) this.cache.commands[same] = result;
        else this.cache.commands.push(result);
      }
      return result;
    },
    "patch": async (commandId, command) => {
      const user = await this.me.getUser();
      const commands = await this.commands.list();
      const result = await this.rest.patch(
        "/applications/" + user.id + "/commands/" + commandId,
        "/applications/" + user.id,
        command
      );
      if(result.id){
        const same = commands.findIndex(c => c.name == result.name);
        if(~same) this.cache.commands[same] = result;
      }
      return result;
    },
    "del": async (id) => {
      const user = await this.me.getUser();
      const commands = await this.commands.list();
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
      const user = await this.me.getUser();
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
      const user = await this.me.getUser();
      const commands = await this.guildCommands.list(gid);
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
      const user = await this.me.getUser();
      const commands = await this.guildCommands.list(gid);
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
      const user = await this.me.getUser();
      const commands = await this.guildCommands.list(gid);
      const result = await this.rest.del(
        "/applications/" + user.id + "/guilds/" + gid + "/commands/" + id,
        "/applications/" + user.id + "/guilds/" + gid
      );
      this.cache.guildCommands[gid] = commands.filter(c => c.id != id);
      return result;
    }
  };

  sharding = {
    "getWS": guildId => {
      return this.shards[guildId % this.shards.length].ws;
    }
  };

  errors = {
    "status": response => {
      if(response.code || response.errors) return false;
      return true;
    }
  };

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
    },
    "list": async (channelId, after, before, around, limit) => {
      const p = new URLSearchParams();
      if(limit != null) p.set("limit", limit);
      if(before != null) p.set("before", before);
      if(after != null) p.set("after", after);
      if(around != null) p.set("around", around);
      const r = (p.size ? "?" : "") + p.toString();
      return this.rest.get(
        "/channels/" + channelId + "/messages" + r,
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
    "post": async (guildId, channel) => {
      return this.rest.post(
        "/guilds/" + guildId + "/channels",
        "/guilds/" + guildId, channel
      );
    },
    "patch": async (channelId, channel) => {
      return this.rest.patch(
        "/channels/" + channelId,
        "/channels/" + channelId,
        channel
      );
    },
    "list": async (guildId) => {
      return this.rest.get(
        "/guilds/" + guildId + "/channels",
        "/guilds/" + guildId
      );
    },
    "typing": async (channelId) => {
      return this.rest.post(
        "/channels/" + channelId + "/typing",
        "/channels/" + channelId,
        { }
      );
    },
    "del": async (channelId) => {
      return this.rest.del(
        "/channels/" + channelId,
        "/channels/" + channelId
      );
    },
    "patchPositions": async (guildId, positions) => {
      return this.rest.patch(
        "/guilds/" + guildId + "/channels",
        "/guilds/" + guildId, positions
      );

    }
  };

  invites = {
    "get": async (channelId) => {
      return this.rest.get(
        "/channels/" + channelId + "/invites",
        "/channels/" + channelId
      );
    },
    "post": async (channelId, invite) => {
      return this.rest.post(
        "/channels/" + channelId + "/invites",
        "/channels/" + channelId,
        invite
      );
    },
    "list": async (guildId) => {
      return this.rest.get(
        "/guilds/" + guildId + "/invites",
        "/guilds/" + guildId
      );
    },
    "vanity": async (guildId) => {
      return this.rest.get(
        "/guilds/" + guildId + "/vanity-url",
        "/guilds/" + guildId
      );
    }
  };

  pins = {
    "get": async (channelId) => {
      return this.rest.get(
        "/channels/" + channelId + "/pins",
        "/channels/" + channelId
      );
    },
    "put": async (channelId, messageId) => {
      return this.rest.put(
        "/channels/" + channelId + "/pins/" + messageId,
        "/channels/" + channelId,
        invite
      );
    },
    "del": async (channelId, messageId) => {
      return this.rest.del(
        "/channels/" + channelId + "/pins/" + messageId,
        "/channels/" + channelId,
        invite
      );
    }
  };

  threads = {
    "from": async (channelId, messageId, params) => {
      return this.rest.post(
        "/channels/" + channelId + "/messages/" + messageId + "/threads",
        "/channels/" + channelId, params
      );
    },
    "start": async (channelId, params) => {
      return this.rest.post(
        "/channels/" + channelId + "/threads",
        "/channels/" + channelId, params
      );
    },
    "listPublicArchived": async (channelId, before, limit) => {
      const p = new URLSearchParams();
      if(limit != null) p.set("limit", limit);
      if(before != null) p.set("before", after);
      const r = (p.size ? "?" : "") + p.toString();
      return this.rest.get(
        "/channels/" + channelId + "/threads/archived/public" + r,
        "/channels/" + channelId
      );
    },
    "listPrivateArchived": async (channelId, before, limit) => {
      const p = new URLSearchParams();
      if(limit != null) p.set("limit", limit);
      if(before != null) p.set("before", after);
      const r = (p.size ? "?" : "") + p.toString();
      return this.rest.get(
        "/channels/" + channelId + "/threads/archived/private" + r,
        "/channels/" + channelId
      );
    },
    "listActive": async (guildId) => {
      return this.rest.get(
        "/guilds/" + guildId + "/threads/active",
        "/guilds/" + guildId
      );
    }
  };

  threadMembers = {
    "put": async (channelId, userId) => {
      return this.rest.put(
        "/channels/" + channelId + "/thread-members/" + userId,
        "/channels/" + channelId
      );
    },
    "del": async (channelId, userId) => {
      return this.rest.put(
        "/channels/" + channelId + "/thread-members/" + userId,
        "/channels/" + channelId
      );
    },
    "get": async (channelId, userId, member) => {
      const p = new URLSearchParams();
      if(member != null) p.set("with_member", member);
      const r = (p.size ? "?" : "") + p.toString();
      return this.rest.put(
        "/channels/" + channelId + "/thread-members/" + userId + r,
        "/channels/" + channelId
      );
    },
    "list": async (channelId, member, after, limit) => {
      const p = new URLSearchParams();
      if(member != null) p.set("with_member", member);
      if(limit != null) p.set("limit", limit);
      if(after != null) p.set("after", after);
      const r = (p.size ? "?" : "") + p.toString();
      return this.rest.get(
        "/channels/" + channelId + "/thread-members" + r,
        "/channels/" + channelId
      );
    }
  };

  interactions = {
    "getOriginal": async (token) => {
      const user = await this.me.getUser();
      return this.rest.get(
        "/webhooks/" + user.id + "/" + token + "/messages/@original",
        "/webhooks/" + user.id + "/" + token
      );
    },
    "patch": async (token, message, files) => {
      const user = await this.me.getUser();
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
    "defer": async (id, token) => {
      return this.rest.post(
        "/interactions/" + id + "/" + token + "/callback",
        "/interactions/" + id + "/" + token,
        { "type": 6 }
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

  bans = {
    "list": async (guildId, after, before, limit) => {
      const p = new URLSearchParams();
      if(limit != null) p.set("limit", limit);
      if(before != null) p.set("before", before);
      if(around != null) p.set("around", around);
      const r = (p.size ? "?" : "") + p.toString();
      return this.rest.get(
        "/guilds/" + guildId + "/bans" + r,
        "/guilds/" + guildId
      );
    },
    "get": async (guildId, userId) => {
      return this.rest.get(
        "/guilds/" + guildId + "/bans/" + userId,
        "/guilds/" + guildId
      );
    },
    "put": async (guildId, userId) => {
      return this.rest.put(
        "/guilds/" + guildId + "/bans/" + userId,
        "/guilds/" + guildId
      );
    },
    "del": async (guildId, userId) => {
      return this.rest.del(
        "/guilds/" + guildId + "/bans/" + userId,
        "/guilds/" + guildId
      );
    },
  }

  members = {
    "get": async (guildId, userId) => {
      return this.rest.get(
        "/guilds/" + guildId + "/members/" + userId,
        "/guilds/" + guildId
      );
    },
    "del": async (guildId, userId) => {
      return this.rest.del(
        "/guilds/" + guildId + "/members/" + userId,
        "/guilds/" + guildId
      );
    },
    "list": async (guildId, after, limit) => {
      const p = new URLSearchParams();
      if(limit != null) p.set("limit", limit);
      if(after != null) p.set("after", after);
      const r = (p.size ? "?" : "") + p.toString();
      return this.rest.get(
        "/guilds/" + guildId + "/members" + r,
        "/guilds/" + guildId
      );
    },
    "search": async (guildId, search, limit) => {
      const p = new URLSearchParams();
      if(limit != null) p.set("limit", limit);
      if(search != null) p.set("query", search);
      const r = (p.size ? "?" : "") + p.toString();
      return this.rest.get(
        "/guilds/" + guildId + "/members/search" + r,
        "/guilds/" + guildId
      );
    },
    "patch": async (guildId, userId, member) => {
      return this.rest.patch(
        "/guilds/" + guildId + "/members/" + userId,
        "/guilds/" + guildId, member
      );
    }
  };

  reactions = {
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
    "get": async (channelId, messageId, reaction, limit, after) => {
      const p = new URLSearchParams();
      if(limit != null) p.set("limit", limit);
      if(after != null) p.set("after", after);
      const r = (p.size ? "?" : "") + p.toString();
      return this.rest.get(
        "/channels/" + channelId + "/messages/" + messageId +
        "/reactions/" + encodeURI(reaction) + r,
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
    },
    "post": async (guildId, role) => {
      return this.rest.post(
        "/guilds/" + guildId + "/roles",
        "/guilds/" + guildId, role
      );
    },
    "patch": async (guildId, roleId, role) => {
      return this.rest.patch(
        "/guilds/" + guildId + "/roles/" + roleId,
        "/guilds/" + guildId, role
      );
    },
    "patchPositions": async (guildId, roleId, positions) => {
      return this.rest.patch(
        "/guilds/" + guildId + "/roles",
        "/guilds/" + guildId, positions
      );
    }
  };

  emojis = {
    "list": async (guildId) => {
      return this.rest.get(
        "/guilds/" + guildId + "/emojis",
        "/guilds/" + guildId + "/emojis"
      );
    },
    "get": async (guildId, emojiId) => {
      return this.rest.get(
        "/guilds/" + guildId + "/emojis/" + emojiId,
        "/guilds/" + guildId + "/emojis"
      );
    },
    "post": async (guildId, emoji) => {
      return this.rest.post(
        "/guilds/" + guildId + "/emojis",
        "/guilds/" + guildId + "/emojis", emoji
      );
    },
    "patch":  async (guildId, emojiId, emoji) => {
      return this.rest.patch(
        "/guilds/" + guildId + "/emojis/" + emojiId,
        "/guilds/" + guildId + "/emojis", emoji
      );
    },
    "del":  async (guildId, emojiId) => {
      return this.rest.del(
        "/guilds/" + guildId + "/emojis/" + emojiId,
        "/guilds/" + guildId + "/emojis"
      );
    },
  };

  prunes = {
    "get": async (guildIs, days, roles) => {
      const p = new URLSearchParams();
      if(days != null) p.set("days", days);
      if(roles != null) p.set("includes_roles", roles.join(","));
      const r = (p.size ? "?" : "") + p.toString();
      return this.rest.get(
        "/guilds/" + guildId + "/prune" + r,
        "/guilds/" + guildId
      );
    },
    "post": async (guildIs, prune) => {
      return this.rest.post(
        "/guilds/" + guildId + "/prune",
        "/guilds/" + guildId, prune
      );
    }
  }

  guilds = {
    "post": async (guild) => {
      return this.rest.post(
        "/guilds", "/guilds", guild
      );
    },
    "get": async (guildId, counts) => {
      const p = new URLSearchParams();
      if(counts != null) p.set("with_counts", counts);
      const r = (p.size ? "?" : "") + p.toString();
      return this.rest.get(
        "/guilds/" + guildId + r,
        "/guilds/" + guildId
      );
    },
    "patch": async (guildId, guild) => {
      return this.rest.patch(
        "/guilds/" + guildId, "/guilds", guild
      );
    },
    "del": async (guildId) => {
      return this.rest.del(
        "/guilds/" + guildId, "/guilds"
      );
    },
    "getPreview": async (guildId) => {
      return this.rest.get(
        "/guilds/" + guildId + "/preview",
        "/guilds/" + guildId
      );
    },
    "mfa": async (guildId, mfa) => {
      return this.rest.post(
        "/guilds/" + guildId + "/mfa",
        "/guilds/" + guildId, { "level": mfa }
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
