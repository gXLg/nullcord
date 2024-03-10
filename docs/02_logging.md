# Logging
Here I explain how the logger system
works in nullcord and how to use
it in the intended way.

A bot's logger is available through the
property `bot.logger`.

# Default Logger
The default logger is an object
having following available functions:
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

Newlines on the default logger

# Custom Logger
To implement and use your own logger,
with your own formatting, you just have to implement
an object with the above mentioned properties.
An easy way of doing so would be for example to create
an object with functions as values:
```js
const customLogger = {
  "info": (...msgs) => process.stdout.write("info:", ...msgs),
  ...
  "sinfo": (shard, ...msgs) => process.stdout.write("info, shard #" + shard + ":", ...msgs),
  ...
};
```

# Internal Logger
