# Discord bot prototype

A basic Discord bot built using Node.js and discord.js.
The bot responds to simple slash commands like server pinging and user listing/kicking. See full list of features below.
Used test writing for this project as a getting familiar moment with VSCodes agentic skill creating feature.

## Commands

- `/ping` for server check
- `/users` with count, list, and online subcommands for user related commands
- `/clear <amount>` for message deletion
- `/kick @user` for user removal
- `/ban @user` for user ban
- `warn @user` to issues warning for user
- `/checkwarnings @user` to check all users warnings, reasons for them and admin/moderator who gave the warnings
- `/clearWarnings @user` to clear issued warnings from user

## Features

- Slash command automatic loading system
- Role specific permission system
- Logging system that helps moderators control command usage
- Cooldown usage available for commands to prevent spamming
- Warning/Kick/Ban system for moderators to control server users
