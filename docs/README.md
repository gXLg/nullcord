# Documentation

WORK IN PROGRESS

Welcome to the official documentation of `nullcord`!
If you are reading this, I finally overcame
my laziness and decided to make a big step further.

## Installation
To install `nullcord` you can simply use `npm`:
```
npm install nullcord
```
either globally or locally in your project.
You can as well just download it direclty
from GitHub, but this is not recommended
since some updates can be in GitHub
before I test them and publish to npm.

## nullcord
`nullcord` is a lightweight discord bot library
oriented on simplicity, minimalism and stability.

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
* Datatypes - any objects returned by discord
from their API are passed back to the user in their
original format
* Object oriented design - the library is
implemented in a functional way, but I like the design
pretty much already

## Contents
In this folder you will find the complete documentation
of the `nullcord` discord bot library. Please notify me
about any errors or inconsistencies in the issues.

The documentation is split into multiple parts like that:
* [Discord](00_discord.md) - basic information about discord
and their way of handling things
* [Initialization](01_init.md) - bot setup
* [Logging](02_logging.md) - explanation about
the logging system of nullcord
* [Events](03_events.md) - receiving events
* [API](04_api.md) - sending requests to discord
* [Utils](05_utils.md) - using the included utils
* [Cache](06_cache.md) - using the benefits of internal caching

# Changelog
(not yet released)
