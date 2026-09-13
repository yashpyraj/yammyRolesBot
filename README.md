# yammyRolesBot

A Discord bot that keeps a single pinned embed in sync with your server's roles — a live team roster that updates itself instead of someone re-typing it after every change.

`discord.js v14` · `Node (ESM)`

---

## What it does

Pick a set of roles, and the bot renders each one as a card in one embed: member names, a headcount, and a point-of-contact block. It then **edits that same message in place** whenever the underlying roles change — it never posts a second one.

Updates are triggered by:

| Event | |
|---|---|
| `guildMemberAdd` / `guildMemberRemove` | someone joins or leaves |
| `guildMemberUpdate` | roles changed, or a display name changed |
| `roleCreate` / `roleDelete` / `roleUpdate` | the roles themselves changed |

Bulk changes — a role sync, a mass assignment — would otherwise fire one rebuild per member, so updates are **debounced by 1.5s** and collapse into a single edit.

On startup the bot looks through the last 25 messages in the channel for its own embed and adopts it. If there isn't one, it posts and pins a new message. A restart therefore reuses the existing dashboard rather than orphaning it.

A configured role that doesn't exist renders as `❌ Role not found` with the name it looked for, rather than silently vanishing from the board.

## Setup

```sh
npm install
```

Create `.env`:

```sh
BOT_TOKEN=your-bot-token
GUILD_ID=your-server-id
CHANNEL_ID=the-channel-to-post-in
```

```sh
node index.js
```

### Discord application

1. Create an application at the [Developer Portal](https://discord.com/developers/applications) and add a bot.
2. Under **Bot → Privileged Gateway Intents**, enable **Server Members Intent**. The bot reads role membership, so it will not start without it.
3. Invite it with the `bot` scope and **View Channel**, **Send Messages**, **Embed Links**, **Read Message History** and **Manage Messages** (the last one is only needed to pin).

## Configuration

Configuration lives at the top of `index.js`.

**Which roles become cards** — `roleName` must match the Discord role name exactly:

```js
const ROLE_CONFIG = [
  { team: 'Casual RoW • Sat 14', emoji: '🟥', roleName: 'RoW S14' },
  { team: 'Casual RoW • Sat 20', emoji: '🟥', roleName: 'RoW S20' },
  { team: 'Casual RoW • Sun 20', emoji: '🟦', roleName: 'RoW U20' },
];
```

**Look and feel:**

```js
const THEME = {
  title: 'BTX • EXP(Shell) - row teams',
  subtitle: 'Auto-updating team rosters',
  footer: 'Yammy Dashboard Bot',
  color: 0x8e44ad,
  maxNamesPerTeam: 18,   // beyond this, the card shows "+N more"
  useInlineCards: true,  // 3 cards per row, with spacer fields between rows
};
```

**Point of contact**, listed at the bottom of the embed:

```js
const CONTACTS = ['Boscat', 'Radoux', 'HoneyFox', 'Enchantress'];
```

Names are sorted case-insensitively with `localeCompare`, so the roster order is stable and doesn't jump around between updates.

## Notes

`maxNamesPerTeam` exists because Discord caps an embed field at 1024 characters. With `useInlineCards`, Discord fits three fields per row, and the bot inserts an invisible spacer field after every third card so rows stay aligned when a team has fewer members than its neighbours.

## License

ISC © [Yash Raj](https://github.com/yashpyraj)
