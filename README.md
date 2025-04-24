# Slack Group Mention Bot

A Slack bot that allows you to create and use group mentions. When a user types "@groupname" in a message, the bot will reply in the thread with mentions of all users in that group.

## Features

- Create and manage groups of users
- Automatically detect @group mentions in messages
- Reply in thread with all users in the mentioned group
- Add as many groups as you want

## Setup Instructions

### 1. Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps) and click "Create New App"
2. Choose "From scratch" and give your app a name and select your workspace
3. Under "Basic Information", note your "Signing Secret" for later

### 2. Configure Bot Token Scopes

1. Go to "OAuth & Permissions" in the sidebar
2. Under "Scopes", add the following Bot Token Scopes:
   - `chat:write` - To send messages
   - `commands` - To create slash commands
   - `users:read` - To get user information
   - `channels:history` - To read messages in channels
   - `groups:history` - To read messages in private channels
   - `im:history` - To read messages in DMs
   - `mpim:history` - To read messages in group DMs
3. Click "Install to Workspace" and authorize the app
4. Note your "Bot User OAuth Token" (starts with `xoxb-`) for later

### 3. Enable Socket Mode

1. Go to "Socket Mode" in the sidebar and enable it
2. Generate an app-level token with the `connections:write` scope
3. Note your App Token (starts with `xapp-`) for later

### 4. Create Slash Commands

Create the following slash commands under "Slash Commands" in the sidebar:

1. `/group-create` - Create a new group
   - Description: Create or update a group with specified users
   - Usage hint: groupname @user1 @user2 ...

2. `/group-list` - List all available groups
   - Description: Show all available groups

3. `/group-show` - Show members of a group
   - Description: Show all members of the specified group
   - Usage hint: groupname

4. `/group-delete` - Delete a group
   - Description: Delete the specified group
   - Usage hint: groupname

### 5. Configure Event Subscriptions

1. Go to "Event Subscriptions" in the sidebar and enable it
2. Subscribe to the `message.channels` bot event
3. Save changes

### 6. Install the App

1. Clone this repository
2. Run `npm install` to install dependencies
3. Create a `.env` file with the following:
   ```
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_SIGNING_SECRET=your-signing-secret
   SLACK_APP_TOKEN=xapp-your-app-token
   ```
4. Run `npm start` to start the bot

## Usage

### Creating a Group

```
/group-create dev @john @sarah @mike
```

This creates a group named "dev" with the mentioned users.

### Using a Group Mention

Simply type `@groupname` in any message:

```
Hey @dev, can we discuss the new feature?
```

The bot will reply in a thread with:

```
Group @dev mentions: @john @sarah @mike
```

### Listing All Groups

```
/group-list
```

### Viewing Group Members

```
/group-show dev
```

### Deleting a Group

```
/group-delete dev
```

## Storage

Groups are stored in a local `groups.json` file. For production use, you might want to replace this with a database. 