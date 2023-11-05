# nullcord
Lightweight custom discord bot library developed by `/dev/null`.

This lib is for private use, using in production is not recommended.

Plans are to make the lib production ready with v3.0

Right now have got some new things, which will probably change:
* Logging
* Errors prevention
* No internet request stacking

Some features which will stay, but no promise
about keeping their structure:
* Sharding
* Endpoints objects for easier and more intuitive use
* Constants

Have to implement:
* Error codes detection
* Even smarter shard distribution

Following features will not be implemented:
* Voice - this lib is intened to be simple, however voice
is a pretty heavy operation, which will not be added

FYI: Even it being not production ready, the lib is stable and is working perfectly,
so if you really want to - you can use the lib and your bot will not break :)
(as of now :smirk:)

# Installation

```
npm install nullcord
```

# Documentation
The lib is yet not production ready and is therefore subject to change.
As already said, v3.0 will make it so far, but documenting everything
already now would be a waste of time.

However if you really badly want to use my lib, here is a summary of
how you could do this, and what code you should read through:

* `examples/bot.js` - a compilation of different functions used
to initialize a bot
* `lib/consts.js` - useful constants and flags used by discord
* `lib/utils.js` - helpful scripts, like automatically un-/registering
application commands
* `lib/ds.js` - all the bot commands, in v2.0 I put API endpoints
into intuitively distributed groups, in v2.4 almost every endpoint is
covered by the lib (my guess is ~95%, excluding anything voice related)
* raw format - I did not use typing system for anything, so everything
returned by discord in JSON will be given like that to the developer,
while this might seem inconvenient at first, it's just as good and stable
* automation - a lot of things are automated by the lib, starting from
websocket resurrection through heartbeat keep alive, ending with sharding;
on one side - the user does not have to think about all the backend
related stuff, on the other side - the lib is not flexible about how
this is done, and so this is intended to be added as a customization
function in around v2.8
* ignorance - any errors occuring on WebSockets are being logged, but
never stop the process; neither are API errors - if any of them
happen, a specially formatted JSON will be returned, see discord
developer documentation and `lib/rest.js` for that
* logging - using EventEmitters, look at `lib/utils.js` on how
the standard listener is defined

# Changelog
Too much to keep track of. Before v3.0 please just refer to the actual
version of the Readme and commits.
