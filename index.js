// index.js
import 'dotenv/config';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

/** ==== LOOK & FEEL ==== */
const THEME = {
    title: 'BTX • EXP(Shell) - row teams',
    subtitle: 'Auto-updating team rosters',
    footer: 'Yammy Dashboard Bot',
    color: 0x8e44ad, // purple
    maxNamesPerTeam: 18,
    useInlineCards: true,
};

/** ==== TEAMS ==== */
const ROLE_CONFIG = [
    { team: 'Casual RoW • Sat 14', emoji: '🟥', roleName: 'RoW S14' },
    { team: 'Casual RoW • Sat 20', emoji: '🟥', roleName: 'RoW S20' },
    { team: 'Casual RoW • Sun 20', emoji: '🟦', roleName: 'RoW U20' },
];

/** ==== CONTACTS ==== */
const CONTACTS = ['Boscat', 'Radoux', 'HoneyFox', 'Enchantress'];

function sortNames(a, b) {
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function formatRoster(names, maxShow) {
    if (!names.length) return '_No members_';

    const shown = names.slice(0, maxShow);
    const extra = names.length - shown.length;

    const lines = [];
    shown.forEach((n, i) => {
        lines.push(`• ${n}`);
        if ((i + 1) % 6 === 0 && i !== shown.length - 1) {
            lines.push('ㅤ'); // spacing
        }
    });

    if (extra > 0) lines.push(`\n**+${extra} more**`);
    return lines.join('\n');
}

function spacerField() {
    return { name: 'ㅤ', value: 'ㅤ', inline: true };
}

async function buildTeamsEmbed(guild) {
    await guild.roles.fetch().catch(() => { });
    await guild.members.fetch({ withPresences: false }).catch(() => { });

    const embed = new EmbedBuilder()
        .setTitle(`🏷️ ${THEME.title}`)
        .setDescription(
            [
                `> **${THEME.subtitle}**`,
                '',
                '— — — — — — — — — — — — — — — —',
                'ㅤ',
            ].join('\n')
        )
        .setColor(THEME.color)
        .setTimestamp(new Date())
        .setFooter({ text: `${THEME.footer} • Last updated` });

    const teamFields = [];

    for (const cfg of ROLE_CONFIG) {
        const role = guild.roles.cache.find(r => r.name === cfg.roleName);

        if (!role) {
            teamFields.push({
                name: `${cfg.emoji} ${cfg.team}`,
                value: `❌ Role not found\n\`${cfg.roleName}\``,
                inline: THEME.useInlineCards,
            });
            continue;
        }

        const names = role.members
            .map(m => m.displayName)
            .sort(sortNames);

        teamFields.push({
            name: `${cfg.emoji} ${cfg.team}  (${role.members.size})`,
            value: formatRoster(names, THEME.maxNamesPerTeam),
            inline: THEME.useInlineCards,
        });
    }

    // Add team cards with spacing
    for (let i = 0; i < teamFields.length; i++) {
        embed.addFields(teamFields[i]);

        const endOfRow = (i + 1) % 3 === 0;
        if (THEME.useInlineCards && endOfRow && i !== teamFields.length - 1) {
            embed.addFields(spacerField());
        }
    }

    // ---- POINT OF CONTACT ----
    embed.addFields(
        spacerField(),
        {
            name: '📞 Point of Contact',
            value: CONTACTS.map(n => `• ${n}`).join('\n'),
            inline: false,
        }
    );

    return embed;
}

async function updateDashboard() {
    const guild = client.guilds.cache.get(process.env.GUILD_ID)
        || await client.guilds.fetch(process.env.GUILD_ID);

    const channel = await guild.channels.fetch(process.env.CHANNEL_ID);
    if (!channel?.isTextBased?.()) return;

    const messages = await channel.messages.fetch({ limit: 25 });
    const dashboardMsg = messages.find(
        m => m.author?.id === client.user.id && m.embeds?.length
    );

    const embed = await buildTeamsEmbed(guild);

    if (dashboardMsg) {
        await dashboardMsg.edit({ embeds: [embed] });
    } else {
        const msg = await channel.send({ embeds: [embed] });
        await msg.pin().catch(() => { });
    }
}

/** Debounce */
let updateTimer = null;
function scheduleUpdate() {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(() => updateDashboard().catch(console.error), 1500);
}

/** Events */
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    scheduleUpdate();
});

client.on('guildMemberAdd', scheduleUpdate);
client.on('guildMemberRemove', scheduleUpdate);

client.on('guildMemberUpdate', (oldMember, newMember) => {
    const oldRoles = oldMember.roles.cache.map(r => r.id).sort().join(',');
    const newRoles = newMember.roles.cache.map(r => r.id).sort().join(',');
    const nameChanged = oldMember.displayName !== newMember.displayName;

    if (oldRoles !== newRoles || nameChanged) scheduleUpdate();
});

client.on('roleCreate', scheduleUpdate);
client.on('roleDelete', scheduleUpdate);
client.on('roleUpdate', scheduleUpdate);

client.login(process.env.BOT_TOKEN);
