# Logging
Here I explain how the logger system
works in nullcord and how to use
it in the intended way.

A bot's logger is available through the
property `bot.logger`.

# Default Logger
The default logger is an object
having following available callbacks:
* `info`, `warn`, `error` - global events
* `sinfo`, `swarn`, `serror` - events from shards

The default logger has a nice formatting which
produces nice looking messages like this:
```
 [info] (03/05/24, 23:51:14) Executing application command play
```
or for shards:
```
 [info] (03/05/24, 23:50:17) Shard  #0: Got ready!
```

The arguments to pass to the logger are going
to be printed separated by space. Example:
```js
bot.logger.info("Logging in as", username);
```

The passed arguments are converted into a string directly
if they are not an object. If they are an object,
`JSON.stringify(argument, null, 2)` is used.

For shard events, the first passed argument is the number
of a shard.

Newlines on the default logger are being prepended with
an intent matching the length of the information fields.
Example:
```
 [info] (03/05/24, 23:50:17) Received following data:
                             {
                               "key": 25764,
                               "expires": 60000
                             }
```

# Custom Logger
To implement and use your own logger,
with your own formatting, you just have to implement
an object with the above mentioned properties.
An easy way of doing so would be to create
an object with callbacks as values like this:
```js
const customLogger = {
  "info": (...msgs) => process.stdout.write("info:", ...msgs),
  ...
  "sinfo": (shard, ...msgs) => process.stdout.write("info, shard #" + shard + ":", ...msgs),
  ...
};
```

# Internal Logger
An internal logger is an object, which defines
callbacks as its' properties.
As the property names go internal events which you might want
to log. Example (from default internal logger):
```js
{
  "creating": (name, version, l) => l.info("Creating a Discord bot using", name, version)
}
```
This will log when creating a bot using nullcord's `Bot` constructor.

A list of all defined lookups and their default wording can be found
in the [<kbd>Utils</kbd>](/lib/utils.js#L79) file.

The last argument of each callback is the logger, which when called internally
defaults to bot's current logger.

The default internal logger also provides a function `with` which can be used
to create a subset of events to be logged. For example, if you want
to log the creation of bot, when the bot changes shards and when
the bot is being shut down, you can use
```js
const internal = defaultLogger.with("creating", "sharding", "shutdown");
```
