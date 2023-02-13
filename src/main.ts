import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "..",".env")});
import { Client, Events, IntentsBitField, VoiceBasedChannel } from "discord.js";
import {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel,
    VoiceConnectionStatus
} from "@discordjs/voice";
import * as dayjs from "dayjs";


const cooldownStates = {
    [process.env.LEGEND]: {
        onCooldown: false,
        timer: dayjs(),
    },
    [process.env.PRINCESS]: {
        onCooldown: false,
        timer: dayjs(),
    }
};

async function connectToChannel(channel: VoiceBasedChannel, whoHasConnected: string) {
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator
    });
    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        cooldownStates[whoHasConnected].timer = dayjs().add(2, "minute");
        cooldownStates[whoHasConnected].onCooldown = true;
        return connection;
    } catch (e) {
        connection.destroy();
        throw e;
    }
}

function cooldownCheck(whoToCheck: string){
    if (dayjs().isAfter(cooldownStates[whoToCheck].timer)) cooldownStates[whoToCheck].onCooldown = false;
}

function playSong(player: AudioPlayer, path: string) {
    const resource = createAudioResource(path);
    player.play(resource);
    return entersState(player, AudioPlayerStatus.Playing, 5000);
}

const client = new Client({ intents: [IntentsBitField.Flags.GuildVoiceStates, IntentsBitField.Flags.Guilds] });

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    //  Terminate if event is not triggered by one of preferred users;
    const { LEGEND, PRINCESS } = process.env;
    const { tag } = oldState.member.user;
    if (!([LEGEND, PRINCESS]).includes(tag)) return;
    cooldownCheck(tag);

    if (cooldownStates[tag].onCooldown) return;
    const path = tag === LEGEND ? "../assets/legend.ogg" : "../assets/princess.ogg";
    if (oldState.channelId === null) {
        const channel = newState.member.voice.channel;
        if (channel) {
            try {
                const player = createAudioPlayer();
                const connection = await connectToChannel(channel, tag);
                connection.subscribe(player);
                await playSong(player, path);
                await entersState(player, AudioPlayerStatus.Idle, 60000);
                connection.destroy();
                player.stop();
            } catch (e) {
                console.error(e);
            }
        }
    }
});

void client.login(process.env.DISCORD_TOKEN);
