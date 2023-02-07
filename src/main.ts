import * as dotenv from "dotenv";
import { Client, Events, IntentsBitField, VoiceBasedChannel } from "discord.js";
import {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel,
    VoiceConnectionStatus
} from "@discordjs/voice";

dotenv.config({ path: "../.env" });

let connectedToday = false;

async function connectToChannel(channel: VoiceBasedChannel) {
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator
    });
    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        connectedToday = true;
        return connection;
    } catch (e) {
        connection.destroy();
        throw e;
    }
}

//  ==========================================PLAYER==========================================
const player = createAudioPlayer();

function playSong() {
    // const resource = createAudioResource("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
    const resource = createAudioResource("../assets/legend.ogg");
    player.play(resource);
    return entersState(player, AudioPlayerStatus.Playing, 5000);
}

//  ==========================================PLAYER==========================================


const client = new Client({ intents: [IntentsBitField.Flags.GuildVoiceStates, IntentsBitField.Flags.Guilds] });

client.on("ready", async () => {
    try {
        await playSong();
    } catch (e) {
        console.error(e);
    }
});


client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (connectedToday) return;
    if (oldState.channelId === null && oldState.member.user.tag == process.env.LEGEND) {
        console.log(`Dmytro is happy to see ${oldState.member.user.tag}`);
        const channel = newState.member.voice.channel;
        if (channel) {
            try {
                const connection = await connectToChannel(channel);
                connection.subscribe(player);
                await entersState(player, AudioPlayerStatus.Idle, 60000);
                connection.destroy();
            } catch (e) {
                console.error(e);
            }
        }
    }
});

void client.login(process.env.DISCORD_TOKEN);
