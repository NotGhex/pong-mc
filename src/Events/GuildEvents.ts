import { RecipleClient } from 'reciple';
import { BaseModule } from '../BaseModule.js';
import Utility from '../Utils/Utility.js';

export class GuildEvents extends BaseModule {
    public async onStart(): Promise<boolean> {
        return true;
    }

    public async onLoad(client: RecipleClient<true>): Promise<void> {
        client.on('guildCreate', async guild => {
            Utility.prisma.guilds.create({
                data: { id: guild.id }
            });
        });

        client.on('guildDelete', async guild => {
            Utility.prisma.guilds.delete({
                where: { id: guild.id }
            });
        });
    }
}

export default new GuildEvents();