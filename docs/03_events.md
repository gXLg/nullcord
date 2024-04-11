[<kbd>← Logging</kbd>](02_logging.md)
• **Events** •
[<kbd>Utils →</kbd>](04_api.md)

---

# Events
Here I explain how to use
Discord events in nullcord.

# Subscribe
nullcord's `Bot` class has an object
accessible with `bot.events` which stores callbacks
to execute when certain events fire.

Events are shard specific, since they are received on
a WebSocket which represents a single shard.

Such event callbacks therefore accept two arguments:
`data` and `shard`.

`data` is an object representing received data.
For a list of events and which data you can receive
check out the [<kbd>Discord dev portal</kbd>](https://discord.com/developers/docs/topics/gateway-events).
The events which can not be received are:
* Hello
* Resumed
* Reconnect
* Invalid Session

These events are used for control of sessions
and are handled by nullcord internally.

A list of all available events is provided by nullcord via the
`consts` module. You can use it with auto complete to see the
list whenever you are too lazy to go to the developer portal.
This list works like an enum where the key and the value are
the same. To use them in your code you can do:
```js
const { gateway_events: events } = require("nullcord").consts;
```

You can register for an event in the following three ways:
* Using the String value
```js
bot.events["INTERACTION_CREATE"] = async (data, shard) => {
  // ...
};
```
* Using property setting, which I personally dislike
```js
bot.events.INTERACTION_CREATE = async (data, shard) => {
  // ...
};
```
* Using the `consts`
```js
bot.events[events.INTERACTION_CREATE] = async (data, shard) => {
  // ...
};
```

Remember, that simply registering for an event
will not always suffice. You may have to enable
it using intents.

To delete/unsubscribe from an event you have to delete
the callback from the object using JavaScript's `delete` keyword.

# Await
Sometimes you need to wait for a specific event to occure before
you can continue executing your code. Doing this with subscribe
events could be done like this:
```js
const waiters = { };
bot.events["MESSAGE_CREATE"] = async (data, shard) => {
  const message = data.content.trim().toLowerCase();
  if (message in waiters) {
    waiters[message](data);
    delete waiters[message];
  }
};

// somewhere else in your code
const awaited_message = await new Promise(resolve => {
  waiters["hello world"] = resolve;
});

```

But this looks and works bad. What if you would want to put a timeout
on waiting, or you have to await for different messages with different
criterias?

For this purpose, the `waitForEvent` method of the class `Bot` exists!
It accepts three arguments:
* `event` - the event to wait for
* `filter` - a callback to determine if the event is what we need
* `timeout` - optional timeout in miliseconds, after which the
method returns `null`

Using this method we can implement the idea from above in just one line:
```js
// somewhere else in your code
const awaited_message = await bot.waitForEvent(
  "MESSAGE_CREATE",
  data => data.content.trim().toLowerCase() == "hello world",
  60000
);
```
This will wait for a message which, ignoring the case,
says "hello world" with a timeout of one minute.

# Order
In general, a good structuring of the events would be
to create subscribe events for some starting conditions,
and then add awaiting events to wait for a chain of events.

An example for such a structure would be listening for
any users to use an application command and then wait
for them responding to the output by for example clicking
buttons:
```js
bot.events["INTERACTION_CREATE"] = async command => {
  if(command.type != 2) return;
  const name = command.data.name;
  bot.logger.info("Executing command", name);

  if (name == "button") {
    const embed = { "description": null, "color": 0x7CF2EE };
    const message = { "embeds": [embed], "flags": 64 };

    embed.description = "Press the button!";
    const button_id = Date.now().toString(36);
    message.components = [
      {
        "type": 1,
        "components": [
          {
            "type": 2,
            "custom_id": button_id,
            "style": 1,
            "label": "beep?"
          }
        ]
      }
    ];
    await bot.slash.post(command.id, command.token, message);

    const res = await bot.listenOnce(
      "INTERACTION_CREATE",
      c => c.data?.custom_id == button_id,
      300_000
    );

    message.components = [];

    if (res == null) {
      embed.description = "Button timed out, please try again!";
      await bot.interactions.patch(command.token, message);
      return;
    }

    embed.description = "boop!";
    await bot.interactions.patch(command.token, message);
  }
};
```

---

[<kbd>← Logging</kbd>](02_logging.md)
• **Events** •
[<kbd>API →</kbd>](04_api.md)
