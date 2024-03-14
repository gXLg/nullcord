[<kbd>← Utils</kbd>](05_utils.md)
• **Cache**

---

# Cache
Here I explain how nullcord caches some values,
why you could benefit from it and what you have to remember.

Cache isnused internally to speed up things and avoid
making unnecessary requests. While cache is good,
younshould not use it directly in your code,
instead rely on internal caching when calling endpoints.

# One Time Cache
nullcord automatically caches the responses from following
endpoints:
* `bot.self.getUser()`
* `bot.self.getApp()`
* `bot.commands`
* `bot.guildCommands`

These endpoints automatically collect and save,
update or delete data. Upon multiple requests
the cached data will be returned.

# Concurrecny
This comes with a small drawback - you may only
run one instance of your bot at the same time.
Also, if you update the bot application through
the Discord Developer Portal, changes will not cache
and you have to restart your bot.
Changes applied to the user of the bot will be cached
throguh the `USER_UPDATE` event.

---

[<kbd>← Utils</kbd>](05_utils.md)
• **Cache**
