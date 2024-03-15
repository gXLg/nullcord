[<kbd>← Events</kbd>](03_events.md)
• **API** •
[<kbd>Utils →</kbd>](05_utils.md)

---

# API
Here is a small guide on
how to use nullcord's API.

# Groups
nullcord's API is grouped into multiple
endpoint groups which are all pretty verbose.

Here's an up-to-date list of all groups:
* Self
* Users
* Commands
* Guild Commands
* Messages
* Channels
* Invites
* Pins
* Threads
* Thread Members
* Interactions
* Slash
* Components
* Bans
* Members
* Reactions
* Member Roles
* Roles
* Emojis
* Prunes
* Guilds

# Calling
Every endpoint is an asynchronous function.
They will always return a JSON. The JSON
will be one of the following:
* Empty
when Discord returned nothing
* Data
when Discord returned the requested data
* Error
an error formatted according to Discord's standards
* Internal error
if you have set `retry` to false, an internal error
with an error code `-1` can be returned, when your bot breaks a rate-limit,
a connection error occures etc.

All the listed endpoints here are to be called like this:
```js
await bot.<group>.<endpoint>(<arguments>);
```

# Search Options
Some of the following APIs, especially those
for searching in large amounts of data support
a special argument, which will be called `sopt`.
On how to use it, click the corresponding documentation
link and see the usage of query options for that
endpoint. The search options may be an optional argument
for some endpoints.



# Files
Some endpoints allow for files to be passed as an argument.
These are optional. When passed, they have to be passed as an object,
with the key being the filename, and the value being binary data of that file.
Example:
```js
await bot.messages.post(channel, message, {
  "file.png": fs.readFileSync("./pic.png", "binary")
});
```



# Self
> ```js
bot.self
```
working with endpoints from first perspective
## Get Current User
> > ```js
getUser()
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/user#get-current-user)

## Modify Current User
> > ```js
patchUser(data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/user#modify-current-user)

## Get Current User Guilds
> > ```js
listGuilds(sopt)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/user#get-current-user-guilds)

## Leave Guild
> > ```js
leaveGuild(id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/user#leave-guild)

## Create Dm
> > ```js
createDM(id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/user#create-dm)

## Create Reaction
> > ```js
putReaction(channel, message, reaction)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#create-reaction)

## Delete Own Reaction
> > ```js
delReaction(channel, message, reaction)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#delete-own-reaction)

## List Joined Private Archived Threads
> > ```js
listJoinedPrivateArchivedThreads(channel, sopt)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#list-joined-private-archived-threads)

## Modify Current Member
> > ```js
patchMember(guild, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#modify-current-member)

## Trigger Typing Indicator
> > ```js
startTyping(channel)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#trigger-typing-indicator)

## Get Current Application
> > ```js
getApp()
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/application#get-current-application)

## Edit Current Application
> > ```js
patchApp(data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/application#edit-current-application)

## Join Thread
> > ```js
joinThread(id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#join-thread)

## Leave Thread
> > ```js
leaveThread(id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#leave-thread)



# Users
> ```js
bot.users
```
working with users in Discord
## Get User
> > ```js
get(id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/user#get-user)



# Commands
> ```js
bot.commands
```
working with global application commands
## Get Global Application Commands
> > ```js
list()
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/application-commands#get-global-application-commands)

## Create Global Application Command
> > ```js
post(data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/application-commands#create-global-application-command)

## Get Global Application Command
> > ```js
get(id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/application-commands#get-global-application-command)

## Edit Global Application Command
> > ```js
patch(id, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/application-commands#edit-global-application-command)

## Delete Global Application Command
> > ```js
del(id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/application-commands#delete-global-application-command)



# Guild Commands
> ```js
bot.guildCommands
```
working with guild application commands
## Get Guild Application Commands
> > ```js
list(guild)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/application-commands#get-guild-application-commands)

## Create Guild Application Command
> > ```js
post(guild, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/application-commands#create-guild-application-command)

## Get Guild Application Command
> > ```js
get(guild, id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/application-commands#get-guild-application-command)

## Edit Guild Application Command
> > ```js
patch(guild, id, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/application-commands#edit-guild-application-command)

## Delete Guild Application Command
> > ```js
del(guild, id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/application-commands#delete-guild-application-command)



# Messages
> ```js
bot.messages
```
working with messages on Discord
## Create Message
> > ```js
post(channel, data, files)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#create-message)

## Get Channel Message
> > ```js
get(channel, id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#get-channel-message)

## Edit Message
> > ```js
patch(channel, id, data, files)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#edit-message)

## Delete Message
> > ```js
del(channel, id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#delete-message)

## Get Channel Messages
> > ```js
list(channel, sopt)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#get-channel-messages)



# Channels
> ```js
bot.channels
```
working with channels
## Get Channel
> > ```js
get(id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#get-channel)

## Create Guild Channel
> > ```js
post(guild, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#create-guild-channel)

## Modify Channel
> > ```js
patch(id, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#modify-channel)

## Deleteclose Channel
> > ```js
del(id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#deleteclose-channel)

## Get Guild Channels
> > ```js
list(guild)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#get-guild-channels)

## Modify Guild Channel Positions
> > ```js
patchPositions(guild, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#modify-guild-channel-positions)



# Invites
> ```js
bot.invites
```
working with guild invites
## Get Channel Invites
> > ```js
get(channel)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#get-channel-invites)

## Create Channel Invite
> > ```js
post(channel, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#create-channel-invite)

## Get Guild Invites
> > ```js
list(guild)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#get-guild-invites)

## Get Guild Vanity Url
> > ```js
vanity(guild)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#get-guild-vanity-url)



# Pins
> ```js
bot.pins
```
working with message pins
## Get Pinned Messages
> > ```js
get(channel)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#get-pinned-messages)

## Pin Message
> > ```js
put(channel, message)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#pin-message)

## Unpin Message
> > ```js
del(channel, message)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#unpin-message)



# Threads
> ```js
bot.threads
```
working with thread channels
## Start Thread From Message
> > ```js
startFrom(channel, message, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#start-thread-from-message)

## Start Thread Without Message
> > ```js
startNew(channel, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#start-thread-without-message)

## List Public Archived Threads
> > ```js
listPublicArchived(channel, sopt)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#list-public-archived-threads)

## List Private Archived Threads
> > ```js
listPrivateArchived(channel, sopt)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#list-private-archived-threads)

## List Active Guild Threads
> > ```js
listActive(guild)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#list-active-guild-threads)



# Thread Members
> ```js
bot.threadMembers
```
working with members in thread channels
## Add Thread Member
> > ```js
put(thread, id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#add-thread-member)

## Remove Thread Member
> > ```js
del(thread, id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#remove-thread-member)

## Get Thread Member
> > ```js
get(thread, id, sopt)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#get-thread-member)

## List Thread Members
> > ```js
list(thread, sopt)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#list-thread-members)



# Interactions
>  `bot.interactions
```
working with webhook based interactions endpoint
## Get Original Interaction Response
> > ```js
getOriginal(token)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/receiving-and-responding#get-original-interaction-response)

## Edit Original Interaction Response
> > ```js
patch(token, message, files)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/receiving-and-responding#edit-original-interaction-response)

## Delete Original Interaction Response
> > ```js
del(token)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/receiving-and-responding#delete-original-interaction-response)



# Slash and Components
> ```js
bot.slash
```
working with direct responding to an interaction
> ```js
bot.components
```
working with direct responding to a component interaction

All the endpoints here refer to a single entry in the Discord docs:
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/interactions/receiving-and-responding#responding-to-an-interaction)
> > ```js
defer(id, token, message)
```
> > ```js
post(id, token, message, files)
```



# Bans
> ```js
bot.bans
```
managing guild bans
## Get Guild Bans
> > ```js
list(guild, sopt)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#get-guild-bans)

## Get Guild Ban
> > ```js
get(guild, user)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#get-guild-ban)

## Create Guild Ban
> > ```js
put(guild, user)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#create-guild-ban)

## Remove Guild Ban
> > ```js
del(guild, user)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#remove-guild-ban)



# Members
> ```js
bot.members
```
working with guild members on Discord
## Get Guild Member
> > ```js
get(guild, user)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#get-guild-member)

## List Guild Members
> > ```js
list(guild, sopt)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#list-guild-members)

## Remove Guild Member
> > ```js
del(guild, user)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#remove-guild-member)

## Modify Guild Member
> > ```js
patch(guild, user, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#modify-guild-member)

## Search Guild Members
> > ```js
search(guild, sopt)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#search-guild-members)



# Reactions
> ```js
bot.reactions
```
working with message reactions
## Delete All Reactions
> > ```js
delAll(channel, message)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#delete-all-reactions)

## Delete All Reactions For Emoji
> > ```js
delEmoji(channel, message, emoji)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#delete-all-reactions-for-emoji)

## Delete User Reaction
> > ```js
delUser(channel, message, emoji, user)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#delete-user-reaction)

## Get Reactions
> > ```js
get(channel, message, emoji, sopt)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/channel#get-reactions)



# Roles
> ```js
bot.roles
```
manage guild roles
## Get Guild Roles
> > ```js
list(guild)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#get-guild-roles)

## Create Guild Role
> > ```js
post(guild, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#create-guild-role)

## Modify Guild Role Positions
> > ```js
patch(guild, id, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#modify-guild-role-positions)

## Delete Guild Role
> > ```js
del(guild, id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#delete-guild-role)

## Modify Guild Role Positions
> > ```js
patchPosition(guild, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#modify-guild-role-positions)



# Member Roles
> ```js
bot.memberRoles
```
manage roles of guild members
## Add Guild Member Role
> > ```js
put(guild, user, role)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#add-guild-member-role)

## Remove Guild Member Role
> > ```js
del(guild, user, role)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#remove-guild-member-role)



# Emojis
> ```js
bot.emojis
```
manage guild emojis
## List Guild Emojis
> > ```js
list(guild)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/emoji#list-guild-emojis)

## Get Guild Emoji
> > ```js
get(guild, id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/emoji#get-guild-emoji)

## Create Guild Emoji
> > ```js
post(guild, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/emoji#create-guild-emoji)

## Modify Guild Emoji
> > ```js
patch(guid, id, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/emoji#modify-guild-emoji)

## Delete Guild Emoji
> > ```js
del(guild, id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/emoji#delete-guild-emoji)



# Prunes
> ```js
bot.prunes
```
manage messafe prunes on a Discord guild
## Get Guild Prune Count
> > ```js
get(guild, sopt)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#get-guild-prune-count)

## Begin Guild Prune
> > ```js
post(guild, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#begin-guild-prune)



# Guilds
> ```js
bot.guilds
```
working with Discord guilds
## Create Guild
> > ```js
post(data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#create-guild)

## Get Guild
> > ```js
get(id, sopt)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#get-guild)

## Modify Guild
> > ```js
patch(id, data)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#modify-guild)

## Delete Guild
> > ```js
del(id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#delete-guild)

## Get Guild Preview
> > ```js
getPreview(id)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#get-guild-preview)

## Modify Guild Mfa Level
> > ```js
mfa(id, lvl)
```
[<kbd>Discord docs</kbd>](https://discord.com/developers/docs/resources/guild#modify-guild-mfa-level)

---

[<kbd>← Events</kbd>](03_events.md)
• **API** •
[<kbd>Utils →</kbd>](05_utils.md)
