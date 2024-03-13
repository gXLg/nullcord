# nullcord
<img src="https://github.com/gXLg/nullcord/assets/65429873/f3408aaf-1d49-428a-ae6f-5a6755c3c5cc" height="100" alt="nullcord logo">

Lightweight discord library developed by <code>/dev/null</code>.

This lib is for private use, using in production is (yet) not recommended.
Plans are to make the lib production ready with v3.0
(rewriting phase started).

Rewriting:
* Logging -> internal event based (done) -> object based (done)
* AutoIntents (done)
* Better networking request structure (done)
* SigInt handler -> `gxlg-utils` (done)
* Search Options parameter (done)
* Unexpectedly found an even better structure for rate limits! -> rewrite! (done)
* Docs! ('-';)

:warning: Current repository is preparing
for the upcoming v3.0 update.
Some information here is for not-yet-released
features/functionality, for the released description
refer to releases on npm.

# Installation

```
npm install nullcord
```

# Documentation
The lib is yet not production ready and is therefore subject to change.
As already said, v3.0 will make it so far, but documenting everything
already now would be a waste of time.

Docs writing is in progress, you can check out [<kbd>docs</kbd>](docs).

# Contribution
List of contributors (special thanks):

|Name|Contributions|
|--|--|
|<img align=left src="https://images.weserv.nl/?url=avatars.githubusercontent.com/u/65429873?v=4&h=60&w=60&fit=cover&mask=circle&maxage=7d">[/dev/null](https://github.com/gXLg)|Creator and owner|
|<img align=left src="https://images.weserv.nl/?url=avatars.githubusercontent.com/u/156463271?v=4&h=60&w=60&fit=cover&mask=circle&maxage=7d">[flp5](https://github.com/flp5)|Advices about utils and logging|

When contributing, please first open an issue and contact me.
Sometimes I may have uncommited changes in my local repo,
which could break a pull request.
I will add you to the list of contributors once the pull request
is merged or I implemented your changes.

# Related Projects
* My project [<kbd>coc-bot</kbd>](https://github.com/gXLg/coc-bot) uses an
up-to-date version of nullcord, the testing of nullcord have been
done mainly through this repo
* Also check out [<kbd>gxlg-utils</kbd>](https://github.com/gXLg/gxlg-utils) which is used in this lib
* First sketches of nullcord are available in an old [<kbd>hackaton attempt</kbd>](https://github.com/gXLg/documantic-hackaton)

# For Fun
Some interesting facts all around nullcord:
* The name should always be written in lowercase
* The name obviously comes from my nickname `/dev/null` and `discord`
* This lib was completely developed on my phone
("mobile developer" just got a new meaning, huh?)
* The internet at my house was/is so bad, that it created a perfect
environment for debugging connectivity related issues
* I developed this while listening to breakcore and drinking
69 liters of coffee a night (I am broke and have an addiction now, please help)
* This library got 2 of my testing bots banned, but it's safe
to use now, I swear!
* If there would have been an award for the worst structured documentation
of rate limits, discord would surely receive it. I am so happy, I am through
with this, it was a nightmare!
* The logo has been made in Paint in under 5 minutes :D
