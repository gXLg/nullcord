# Documentation
Welcome to the official documentation of `nullcord`!
If you are reading this, I finally overcame
my laziness and decided to make a big step further.

## Installation
To install `nullcord` you can simply use `npm`:
```
npm install nullcord
```
either globally or locally in your project.

Downloading directly from GitHub is not
recommended as I might commit breaking changes
in between two releases without even documenting it.

## nullcord
`nullcord` is a lightweight javascript library
for Discord bots oriented on simplicity,
minimalism and stability.

With that in mind, I developed the library in a fully
functional way but did not include some features,
which in my opinion were heavy or not needed.

That means, following features are NOT implemented
and probably will never be:
* Voice connection - UDP transmission is
a pretty heavy operation
* Manual sharding - the smart auto-sharding
system is sufficient
* Selfbotting - while it is still possible,
I advice against it, it can get you banned,
because this lib uses only bot-specific endpoints
* Datatypes - any objects returned by Discord
from their API are passed back to the user in their
original format
* Object oriented design - the library is
implemented in a functional way, but I like the design
pretty much already

## Contents
In this folder you will find the complete documentation
of the `nullcord` Discord bot library. Please notify me
about any errors or inconsistencies in the issues.

The documentation is split into multiple parts like that:
* [<kbd>Discord</kbd>](00_discord.md) - basic information about Discord
and their way of handling things
* [<kbd>Initialization</kbd>](01_init.md) - bot setup
* [<kbd>Logging</kbd>](02_logging.md) - explanation about
the logging system of nullcord
* [<kbd>Events</kbd>](03_events.md) - receiving events
* [<kbd>API</kbd>](04_api.md) - sending requests to Discord
* [<kbd>Utils</kbd>](05_utils.md) - using the included utils
* [<kbd>Cache</kbd>](06_cache.md) - using the benefits of internal caching

# Changelog
## v3.3.0
* +`polls`

## v3.2.5
* ~~`emojis`~~ -> `guildEmojis`
* +`emojis` (application emojis)

## v3.2.0
* +`utils.updateGuildCommands()`
* +`slash.autocomplete()`
* +`slash.modal()`
* +`slash.premium()`

## v3.1.0
* ~~`shards()`~~ -> `shardsCount()`
* +`guildsCount()`
* +`autoIntents: options.guilds_count`

## v3.0.0
* Official release

# Planned for Future Releases
* OAuth flow including user endpoints
* Endpoints for:
  * SKUs
  * Activities
  * Role Connections
  * Guild Events
  * Guild Templates
  * Subscriptions
  * Sticker
* Audit Logs, endpoints and reasons
