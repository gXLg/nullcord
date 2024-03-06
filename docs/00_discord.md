# Discord
Here I explain how Discord handles things
and how this is connected to nullcord.

## Flow
To run a bot in Discord, one has to understand
how the workflow of Discord works.

1. The client connects to an HTTP API endpoint to get
the Websocket address to connect to
2. The client connects to the Websocket
and sends authentification details such as a token
and a numeric value to register for specific events
(intents, which are explained further below)
3. To keep the connection, a heartbeat (similar to ping)
is sent ca. every 45 seconds
4. Discord sends events which the client is registered to
over the Websocket
5. Sometimes the Discord wants your client to change
the server or to refresh your connection, this is
explained further below
6. When sending data to Discord, like sending messages or
searching for data about specific channel, these requests
are made over the HTTP Rest API
7. To shut down the bot, a close code is being sent to
Discord over the Websocket and the client disconnects

All this is handled by nullcord internally
behind the `login` function.

## Rate Limits
Sending requests over the HTTP Rest API has
some limitations about the frequency. Discord
creates buckets for different endpoints and
each bucket receives a number of requests which
are allowed to make in a specific interval of time.
Exceeding this limits will get your bot disconnected
or after multiple occurences will temporarily
disable your bot.

This is of course not desired and so nullcord has an
internal system which keeps track of global and bucketed
requests and the API of nullcord is designed specifically
to meet the requirements of Discord.
The internal request maker waits for the limit to be
clear again before sending a request which could be over
the rate limit.

## Errors
There may be different types of errors
when creating a Discord bot, each of them
is handled nicely by nullcord.

1. Connectivity issues - client side problem of
bad internet connection, this could potentially lead
to loss of requests or constant disconnecting from
the Websocket; fortunately I have bad internet at home
so I was able to design nullcord to never fail
in such situations and repeat dropped requests,
resurrect Websocket connections and resume sessions
to receive events accordingly.
2. Bad Format - when sending API requests you
could use wrong IDs or use the wrong endpoint;
the usage of wrong endpoints is eliminated by nullcord
because it has its' own API endpoints which are verbal
and easy to use; the requests errors should be handled
by the user themself - the raw error is returned upon
making an errorneous request but does not throw
3. Session Errors - more about it further below,
but not to worry - any session related errors are
covered by nullcord and will keep you bot running
nicely and smoothly

## Sessions
Sessions in Discord are represented through
WebSocket connections, which have a special
lifecycle.

1. A new session can be created, there is
a limit of new sessions per hour, but this
number is big, and if exceeded, nullcord
will peacefully wait for a new session to
be available.
2. A bot can disconnect from a session,
a reconnection is possible under different
circumstances.
3. Discord can request to either reconnect
(their servers make load balancing) or
completely disconnect from a session.
5. Trying to reconnect after some period of time
can fail because Discord already invalidated the old
session, nevertheless nullcord tries its' best
to always keep the connection alive and not to
drop even a single packet - even if your
internet connection is not the best.

## Shards
When reaching a certain amount of servers,
your bot won't be able to handle all the traffic
on a single WebSocket. Therefore, when connecting,
Discord will provide us with the needed information
to create an optimal and balanced connection.

nullcord automatically checks this status every hour
and will rearrange the shards when the recommended
amount of shards is changed.

## Intents
To receive events from the WebSocket, the bot
has to subscribe to them. This happens with the
help of intents. An intent is a bitmask which
specifies which events should be sent over the
WebSocket connection.

More on how to use intents in nullcord is explained
in [Initialization](01_init.md) and [Utils](05_utils.md).
