import { CommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";

export interface ICommand {
    data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
    run: (interaction: CommandInteraction) => Promise<void>;
}

export const badge: ICommand = {
    data: new SlashCommandBuilder()
        .setName("badge")
        .setDescription("I want my dev badge"),
    run: async (interaction) => {
        await interaction.reply({ content: "Enjoy your badge!"});
    }
}
