<div>
<img align="left" src="https://github.com/gXLg/nullcord/assets/65429873/f3408aaf-1d49-428a-ae6f-5a6755c3c5cc" height="100">
<h1>nullcord</h1>
Lightweight discord library developed by <code>/dev/null</code>.
</div>
<br clear="left">
<br>
This lib is for private use, using in production is (yet) not recommended.
Plans are to make the lib production ready with v3.0
(rewriting phase started).

Rewriting:
* Logging -> internal event based
* Better networking request structure

This features have been extensively tested in latest releases:
* Logging
* Errors prevention
* No internet request stacking/WebSocket resurrection

Some features which will stay, but no promise
about keeping their structure:
* Sharding
* Endpoints objects for easier and more intuitive use
* Constants

Have to implement:
* ~~Error codes detection~~ User's job
* ~~Even smarter shard distribution~~ Works good already

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
WebSocket resurrection through heartbeat keep-alive, ending with sharding;
on one side - the user does not have to think about all the backend
related stuff, on the other side - the lib is not flexible about how
this is done, and so this is intended to be added as a customization
function in around v2.8
* ignorance - any errors occuring on WebSockets are being logged, but
never stop the process; neither are API errors - if any of them
happen, a specially formatted JSON will be returned, see discord
developer documentation and `lib/rest.js` for that; things like
ratelimits and connection timeouts are covered as of v2.5 and will simply
try to do the request again
* logging - using EventEmitters, look at `lib/utils.js` on how
the standard listener is defined

# Changelog
Too much to keep track of. Before v3.0 please just refer to the actual
version of the Readme and commits.

# Related projects
* My project [coc-bot](https://github.com/gXLg/coc-bot) uses an
up-to-date version of nullcord, the testing of nullcord have been
done mainly through this repo
* Also check out `gxlg-utils` and `gxlg-asyncdb` which are used in this lib

# For fun
Some interesting facts all around nullcord:
* The name obviously comes from my nickname `/dev/null` and `discord`
(it could have been `gxlg-cord`, glad it turned out this way)
* This lib was completely developed on my phone
("cross-platform development" just got a new meaning, huh?)
* The internet at my house was/is so bad, that it created a perfect
environment for debugging connection related issues
* I developed this while listening to breakcore and drinking
69 liters of coffee a night (I am broke and have an addiction now, please help)
* This library got 2 of my testing bots banned, but it's safe
to use now, I swear!
* If there would have been an award for the worst structured documentation
of rate limits, discord would surely receive it. I am so happy, I am through
with this, it was a nightmare!
