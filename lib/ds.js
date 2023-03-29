const Rest = require("./rest.js");
const { TimePromise } = require("gxlg-utils");
const { WebSocket } = require("ws");

class Bot {

  cache = { };
  events = { };
  sequence = null;
  once = [];
  destroyed = false;
  release = null;

  constructor(token, debug){
    this.token = token;
    this.rest = new Rest(
      "https://discord.com/api/v10",
      { "Authorization": "Bot " + token }
    );
    this.debug = debug ?? false;
  }

  // for getting user info without logging in
  async user(){
    return this.cache.user ?? (
      this.cache.user = await this.rest.get(
        "/users/@me", "/users/@me"
      )
    );
  }

  // getting a list of all commands
  async commands(){
    const user = await this.user();
    return this.cache.commands ?? (
      this.cache.commands = await this.rest.get(
        "/applications/" + user.id + "/commands",
        "/applications/" + user.id,
      )
    );
  }

  // register a command
  async registerCommand(command){
    const user = await this.user();
    const commands = await this.commands();
    const result = await this.rest.post(
      "/applications/" + user.id + "/commands",
      "/applications/" + user.id,
      command
    );
    const same = commands.find(c => c.id == result.id);
    if(same) this.cache.commands[commands.indexOf(same)] = result;
    return result;
  }

  // delete a command
  async deleteCommand(id){
    const user = await this.user();
    const commands = await this.commands();
    const result = await this.rest.del(
      "/applications/" + user.id + "/commands/" + id,
      "/applications/" + user.id
    );
    this.cache.commands = commands.filter(c => c.id != id);
    return result;
  }

  // getting a list of all guild commands
  async guildCommands(gid){
    const user = await this.user();
    if(!this.cache.guildCommands)
      this.cache.guildCommands = {};
    return this.cache.guildCommands[gid] ?? (
      this.cache.guildCommands[gid] = await this.rest.get(
        "/applications/" + user.id + "/guilds/" + gid + "/commands",
        "/applications/" + user.id + "/guilds/" + gid
      )
    );
  }

  // register a guild command
  async registerGuildCommand(gid, command){
    const user = await this.user();
    const commands = await this.guildCommands(gid);
    const result = await this.rest.post(
      "/applications/" + user.id + "/guilds/" + gid + "/commands",
      "/applications/" + user.id + "/guilds/" + gid,
      command
    );
    const same = commands.find(c => c.id == result.id);
    if(same) this.cache.guildCommands[gid][commands.indexOf(same)] = result;
    return result;
  }

  // delete a guild command
  async deleteGuildCommand(gid, id){
    const user = await this.user();
    const commands = await this.guildCommands(gid);
    const result = await this.rest.del(
      "/applications/" + user.id + "/guilds/" + gid + "/commands/" + id,
      "/applications/" + user.id + "/guilds/" + gid
    );
    this.cache.guildCommands[gid] = commands.filter(c => c.id != id);
    return result;
  }

  // login, creates a websocket connection to the gateway
  async login(intents){

    // receiving the gateway endpoint
    const gateway = await this.rest.get(
      "/gateway/bot",
      "/gateway/bot"
    );
    const sessions = gateway.session_start_limit;
    if(sessions.remaining == 0){
      if(bot.debug)
        console.log("Session limit reached, reset after", sessions.reset_after);
      await new Promise(res => setTimeout(res, sessions.reset_after));
    }

    const url = new URL(gateway.url);
    url.searchParams.set("v", 10);
    url.searchParams.set("encoding", "json");

    function connect(bot, resume){

      bot.recon = true;

      bot.ws = new WebSocket(url.href);
      bot.ws.on("message", data => {
        const payload = JSON.parse(data);

        if(payload.s) bot.sequence = payload.s;

        // heartbeat setup to keep the bot alive
        function sendHeartbeat(){
          bot.ws.send(JSON.stringify({
            "op": 1,
            "d": bot.sequence
          }));
        }
        if(payload.op == 1) sendHeartbeat();

        if(payload.op == 10){
          sendHeartbeat();
          bot.heart = setInterval(sendHeartbeat, payload.d.heartbeat_interval);

          if(resume){
            // if discord asked to reconnect
            if(bot.debug)
              console.log("Sending resume payload");
            const resume = JSON.stringify({
              "op": 6,
              "d": {
                "token": bot.token,
                "session_id": bot.sessionId,
                "seq": bot.sequence
              }
            });
            bot.ws.send(resume);
          } else {
            if(bot.debug)
              console.log("Sending identify payload");
            const identify = JSON.stringify({
              "op": 2,
              "d": {
                intents,
                "token": bot.token,
                "properties": {
                  "$os": "linux",
                  "$browser": "node.js",
                  "$device": "calculator"
                }
              }
            });
            bot.ws.send(identify);
          }

        } else if(payload.op == 9){
          if(bot.debug)
            console.log("Discord asked to close and exit");
          bot.recon = false;
          //bot.ws.close();
          //throw new Error("Invalid session!");

        } else if(payload.op == 7){
          if(bot.debug)
            console.log("Discord asked to reconnect");
          //bot.ws.close();

        } else if(payload.op == 0){
          //console.log("Event was dispatched", payload.t);
          if(payload.t == "READY") bot.sessionId = payload.d.session_id;

          // if there is a listener, then use it
          (bot.events[payload.t] ?? (() => {}))(payload.d);

          // event listeners for single event
          // can be used with some filter, and timeout
          bot.once = bot.once.filter(listener => {
            if(listener.status.timedout) return false;
            if(listener.event != payload.t) return true;
            if(!listener.filter(payload.d)) return true;
            listener.resolve(payload.d);
            return false;
          });
        }
      });
      bot.ws.on("close", code => {
        clearInterval(bot.heart);
        if(bot.debug)
          console.log("WebSocket closed with status", code);
        if(!bot.destroyed){
          if(bot.debug)
            console.log("Trying to " + (bot.recon ? "re" : "") + "connect");
          setTimeout(() => connect(bot, bot.recon), 5000);
        }
        if(bot.release != null) bot.release();
      });
      bot.ws.on("error", error => {
        throw new Error(error);
      });
    }
    connect(this, false);
  }

  async destroy(){
    this.destroyed = true;
    this.ws.close(1000);
    return new Promise((res, rej) => {
      this.release = res;
    });
  }

  // answer to slash command, that will respond later
  async commandsDeferred(id, token){
    return this.rest.post(
      "/interactions/" + id + "/" + token + "/callback",
      "/interactions/" + id + "/" + token,
      { "type": 5 }
    );
  }

  // answer to slash command directly
  async commandsResponse(id, token, message){
  return this.rest.post(
      "/interactions/" + id + "/" + token + "/callback",
      "/interactions/" + id + "/" + token,
      { "type": 4, "data": message }
    );
  }

  // get original response message
  async commandsGetResponse(token){
    return this.rest.get(
      "/webhooks/" + this.cache.user.id + "/" + token + "/messages/@original",
      "/webhooks/" + this.cache.user.id + "/" + token
    );
  }

  // answer to button press, that will respond later
  async commandsDeferredWithCom(id, token){
    return this.rest.post(
      "/interactions/" + id + "/" + token + "/callback",
      "/interactions/" + id + "/" + token,
      { "type": 6 }
    );
  }

  // answer to button press directly
  async commandsComResponse(id, token, message){
    return this.rest.post(
      "/interactions/" + id + "/" + token + "/callback",
      "/interactions/" + id + "/" + token,
      { "type": 7, "data": message }
    );
  }

  // edit the message, both for slash and button
  async commandsEditResponse(token, message){
    return this.rest.patch(
        "/webhooks/" + this.cache.user.id + "/" + token + "/messages/@original",
        "/webhooks/" + this.cache.user.id + "/" + token,
        message
    );
  }

  async sendMessage(channelId, message){
    return this.rest.post(
      "/channels/" + channelId + "/messages",
      "/channels/" + channelId,
      message
    );
  };

  async editMessage(channelId, messageId, message){
    return this.rest.patch(
      "/channels/" + channelId + "/messages/" + messageId,
      "/channels/" + channelId,
      message
    );
  }

  async deleteMessage(channelId, messageId){
    return this.rest.del(
      "/channels/" + channelId + "/messages/" + messageId,
      "/channels/" + channelId
    );
  }

  async getMessage(channelId, messageId){
    return this.rest.get(
      "/channels/" + channelId + "/messages/" + messageId,
      "/channels/" + channelId
    );
  }

  async getChannel(channelId){
    return this.rest.get(
      "/channels/" + channelId,
      "/channels/" + channelId
    );
  }

  setStatus(status){
    this.ws.send(JSON.stringify({
      "op": 3,
      "d": status
    }));
  }

  async react(channelId, messageId, reaction){
    return this.rest.put(
      "/channels/" + channelId + "/messages/" + messageId +
      "/reactions/" + encodeURI(reaction) + "/@me",
      "/channels/" + channelId
    );
  }

  async deleteReaction(channelId, messageId, reaction){
    return this.rest.del(
      "/channels/" + channelId + "/messages/" + messageId +
      "/reactions/" + encodeURI(reaction),
      "/channels/" + channelId
    );
  }

  async deleteAllReactions(channelId, messageId){
    return this.rest.del(
      "/channels/" + channelId + "/messages/" + messageId +
      "/reactions",
      "/channels/" + channelId
    );
  }

  async deleteReactionUser(channelId, messageId, reaction, userId){
    return this.rest.del(
      "/channels/" + channelId + "/messages/" + messageId +
      "/reactions/" + encodeURI(reaction) + "/" + userId,
      "/channels/" + channelId
    );
  }

  async getReactions(channelId, messageId, reaction){
    return this.rest.get(
      "/channels/" + channelId + "/messages/" + messageId +
      "/reactions/" + encodeURI(reaction),
      "/channels/" + channelId
    );
  }

  async addUserRole(guildId, userId, roleId){
    return this.rest.put(
      "/guilds/" + guildId + "/members/" + userId +
      "/roles/" + roleId,
      "/guilds/" + guildId
    );
  }

  // add one time listener
  async listenOnce(event, filter, timeout){
    return new TimePromise((resolve, reject, status) => {
      this.once.push({event, filter, timeout, resolve, status});
    }, timeout);
  }

}

module.exports = { Bot };
