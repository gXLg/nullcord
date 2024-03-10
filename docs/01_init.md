# Initialization
Here I explain how to create and register a bot
using nullcord.

To understand the lifecycle, please first
read the [Discord](00_discord.md) chapter.

# Import
nullcord uses the package system of Node.js
to expose multiple modules.

These include:
* `Bot` class
* `utils` and `consts` modules
* `package` - information about nullcord used internally

The export is an Object, so you can import things like:
```js
const { Bot } = require("nullcord");
```
or
```js
const DiscordClient = require("nullcord").Bot;
```

However, the first method is preferred.

# Bot

## constructor

Arguments:
1. `token: String` - The token of the bot, which you can
find [here](https://discord.com/developers/applications)

2. `options: Object` - including following parameters:
  * `logger: EventEmitter` - more about logging in
  [Logging](02_logging.md)
  * `internal: Object|'null'|'true'` - an object to look up
  what internal events are to be logged, `true` to
  use a prebuilt internal logger or you can use `null` or
  just leave out this option to disable logging of internal event

## methods

### `ready() -> boolean`
A boolean query which tells
if all shards of the bot are
already registered.

### `async login(intents: Integer)`
Registers the bot on the WebSocket
to make it ready to receive events.
Intents are a bit mask of which events
you want to receive. You can read more
on [discord dev portal](https://discord.com/developers/docs/topics/gateway#list-of-intents).

nullcord provides a list of verbose
constants to use for intents. They have
all the same names as in the documentation
link above. You can import them via:
```js
const { gateway_intents: intents } = require("nullcord").consts;
```
And use them in two ways:

1. Manually making the bitmask:
```js
bot.login(intents.GUILDS | intents.GUILD_MESSAGES);
```
2. Using the `mask` function
(preferred by me, but this is just an opinion):
```js
bot.login(intents.mask("GUILDS", "GUILD_MESSAGES"));
```

Another way is to use the included utils
to automatically determine which intents
are needed, this will be explained on the
[Utils](05_utils.md) page.
