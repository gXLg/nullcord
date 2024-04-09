[<kbd>← API</kbd>](04_api.md)
• **Utils** •
[<kbd>Cache →</kbd>](06_cache.md)

---

# Utils
Here I showcase usefull utils
built into nullcord and how to use them.

Utils are accessible from the `utils` module:
```js
const { utils } = require("nullcord");
```

# Update commands
```js
async utils.updateCommands(bot, commands)
```
```js
async utils.updateGuildCommands(bot, guild, commands)
```
Automatically retrieves all current
commands of the `bot`, deletes old commands,
updates commands with changed structure
and creates new commands.
If `commands` is an array, the commands configuration
is read direclty from it, else it is interpreted as
a path to a JSON file.
More about commands structure you can find
on [<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/application-commands#application-commands).

For `updateGuildCommands` the argument `guild` is
the ID of the updated guild.

# Auto Intents
```js
utils.autoIntents(options) -> Integer
```

Automatically calculates required intents.
The argument `options` is an object with the following
accepted properties:
* `bot` - the util will get all registered `bot.events`
and add the needed intents for them
* `events` - an array of events which you would like
to receive, but do not have registered any listeners
for them yet; this includes `bot.waitForEvent` listeners,
as by design they should not be triggered globally
* `message_content` - a boolean representing if you want
to receive the content of messages along with the `MESSAGE_CREATE` event;
this intent is privileged and has to be enabled in the Developer
Portal; more about privileged intents can be found in the
[<kbd>Discord</kbd>](00_discord.md) section of this documentation
* `guilds_count` - a boolean to specify, if you want to be able to count
guilds internally, this will add the `GUILDS` intent

# Error Status
```js
utils.errorStatus(response) -> Boolean
```
A simple checker for whether a `response` from the API
contains errors. Returns `true` when the response
was errorneous.

---

[<kbd>← API</kbd>](04_api.md)
• **Utils** •
[<kbd>Cache →</kbd>](06_cache.md)
