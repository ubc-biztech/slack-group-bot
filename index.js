const { App } = require("@slack/bolt")
const fs = require("fs")
const path = require("path")
require("dotenv").config()

// Initialize the Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  socketModeOptions: {
    autoReconnectEnabled: true
  }
})

// Path to the groups configuration file
const groupsFilePath = path.join(__dirname, "groups.json")

// Load groups configuration
function loadGroups() {
  try {
    if (fs.existsSync(groupsFilePath)) {
      const data = fs.readFileSync(groupsFilePath, "utf8")
      return JSON.parse(data)
    } else {
      // If file doesn't exist, create it with an empty groups object
      const emptyGroups = {}
      fs.writeFileSync(groupsFilePath, JSON.stringify(emptyGroups, null, 2))
      return emptyGroups
    }
  } catch (error) {
    console.error("Error loading groups:", error)
    return {}
  }
}

// Save groups configuration
function saveGroups(groups) {
  try {
    fs.writeFileSync(groupsFilePath, JSON.stringify(groups, null, 2))
  } catch (error) {
    console.error("Error saving groups:", error)
  }
}

// Listen for messages containing @group mentions
app.message(/@([a-zA-Z0-9_-]+)/, async ({ message, say, context }) => {
  // Skip messages from bots to prevent potential loops
  if (message.subtype === "bot_message") return

  // Load current groups
  const groups = loadGroups()

  // Extract all potential group mentions from the message
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const mentions = [...message.text.matchAll(mentionRegex)].map(
    (match) => match[1]
  )

  for (const groupName of mentions) {
    // Check if this group exists in our configuration
    if (groups[groupName]) {
      const members = groups[groupName]
      if (members.length > 0) {
        // Format the group members mention text
        const memberMentions = members.map((id) => `<@${id}>`).join(" ")

        // Reply in thread with the mentioned members
        await say({
          text: `${memberMentions}`,
          thread_ts: message.ts
        })
      }
    }
  }
})

// Command to create or update a group
app.command("/group-create", async ({ command, ack, respond }) => {
  await ack()

  const args = command.text.split(" ")
  if (args.length < 2) {
    await respond("Usage: /group-create groupname @user1 @user2 ...")
    return
  }

  const groupName = args[0]
  const userMentions = args.slice(1)

  // Extract user IDs from mentions
  const userIds = userMentions
    .map((mention) => {
      const match = mention.match(/@([a-zA-Z0-9_-]+)/)
      if (match) {
        const userId = match[1]
        // TODO: Resolve username to userId using Slack API
        return userId // Placeholder for actual user ID
      }
      return null
    })
    .filter((id) => id !== null)

  if (userIds.length === 0) {
    await respond("Please provide at least one valid user mention.")
    return
  }

  // Load groups, update, and save
  const groups = loadGroups()
  groups[groupName] = userIds
  saveGroups(groups)

  await respond(
    `Group \`@${groupName}\` created/updated with ${userIds.length} members.`
  )
})

// Command to list all groups
app.command("/group-list", async ({ command, ack, respond }) => {
  await ack()

  const groups = loadGroups()
  const groupNames = Object.keys(groups)

  if (groupNames.length === 0) {
    await respond("No groups have been created yet.")
  } else {
    const groupList = groupNames
      .map((name) => {
        const members = groups[name]
        return `\`@${name}\`: ${members.length} members`
      })
      .join("\n")

    await respond(`Available groups:\n${groupList}`)
  }
})

// Command to show members of a specific group
app.command("/group-show", async ({ command, ack, respond, client }) => {
  await ack()

  const groupName = command.text.trim()
  if (!groupName) {
    await respond("Usage: /group-show groupname")
    return
  }

  const groups = loadGroups()
  if (!groups[groupName]) {
    await respond(`Group \`@${groupName}\` does not exist.`)
    return
  }

  const members = groups[groupName]
  if (members.length === 0) {
    await respond(`Group \`@${groupName}\` has no members.`)
    return
  }

  // Resolve user IDs to names
  let userList = ""
  for (const userId of members) {
    userList += `<@${userId}>\n`
  }

  await respond(`Members of group \`@${groupName}\`:\n${userList}`)
})

// Command to remove a group
app.command("/group-delete", async ({ command, ack, respond }) => {
  await ack()

  const groupName = command.text.trim()
  if (!groupName) {
    await respond("Usage: /group-delete groupname")
    return
  }

  const groups = loadGroups()
  if (!groups[groupName]) {
    await respond(`Group \`@${groupName}\` does not exist.`)
    return
  }

  delete groups[groupName]
  saveGroups(groups)

  await respond(`Group \`@${groupName}\` has been deleted.`)
})

// Start the app
;(async () => {
  await app.start(process.env.PORT || 3000)
  console.log("⚡️ Slack Group Mention Bot is running!")
})()

// DUMMY CODE FOR SOCKET

const http = require("http")

const server = http.createServer((req, res) => {
  res.end("Slack bot is running")
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Dummy server listening on port ${PORT}`)
})

app.socketMode?.client?.on("disconnect", (e) => {
  console.warn("Slack socket disconnected:", e)
})

app.socketMode?.client?.on("error", (e) => {
  console.error("Slack socket error:", e)
})

app.socketMode?.client?.on("reconnect", () => {
  console.log("Slack socket reconnecting...")
})
