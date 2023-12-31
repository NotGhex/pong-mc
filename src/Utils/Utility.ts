import { PrismaClient, ServerProtocol, Servers } from '@prisma/client';
import { BaseModule } from '../BaseModule.js';
import { AnySlashCommandBuilder, RecipleClient, SlashCommandBuilder } from 'reciple';
import { ButtonBuilder, ButtonStyle, Collection, SlashCommandSubcommandBuilder, inlineCode } from 'discord.js';
import { ButtonPaginationControllerResolavable } from '@falloutstudios/djs-pagination';
import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import ms from 'ms';

export class Utility extends BaseModule {
    public client!: RecipleClient;
    public prisma: PrismaClient = new PrismaClient();
    public cluster!: ClusterClient<RecipleClient>;

    public async onStart(client: RecipleClient): Promise<boolean> {
        client.options.shards = getInfo().SHARD_LIST;
        client.options.shardCount = getInfo().TOTAL_SHARDS;

        this.client = client;
        this.cluster = new ClusterClient(client);

        return true;
    }

    public createErrorMessage(message: string): string {
        return this.createLabel(message, '❌');
    }

    public createSuccessMessage(message: string): string {
        return this.createLabel(message, '✅');
    }

    public createWarningMessage(message: string): string {
        return this.createLabel(message, '⚠️');
    }

    public createLabel(message: string, emoji: string): string {
        return `${inlineCode(emoji)} ${message}`;
    }

    public stringifyHost(data: { host: string; port?: number|null; }): string {
        return `${data.host}${data.port ? (':' + data.port) : ''}`;
    }

    public parseHost(ip: string, protocol: ServerProtocol): { host: string; port: number; }
    public parseHost(ip: string, protocol?: ServerProtocol): { host: string; port?: number; } {
        const arr = ip.trim().toLowerCase().split(':');
        const host = arr.shift() || 'localhost';

        let port = arr[0] ? Number(arr.shift()) : undefined;
            port = typeof port === 'number' && isFinite(port) && !isNaN(port)
                ? port
                : protocol === 'JAVA'
                    ? 25565
                    : protocol === 'BEDROCK'
                        ? 19132
                        : undefined;

        return { host, port };
    }

    public parseServerDisplayName(data: Pick<Servers, 'name'|'host'|'port'>): string {
        return data.name || this.stringifyHost(data);
    }

    public parseBase64ImageURL(url: string): Buffer {
        const [data, base64] = url.split(',');

        const [mime, type] = (data.split(':')[1]?.split(';') ?? []).filter(Boolean);
        if (type.toLowerCase() !== 'base64') throw new Error('URL is not a valid base64');

        return Buffer.from(base64, 'base64');
    }

    public ms(value: string): number|undefined;
    public ms(value: number, long?: boolean): string;
    public ms(value: string|number, long?: boolean): string|number|undefined {
        let result: string|number|undefined; 

        try {
            result = typeof value === 'string' ? ms(value) : ms(value, { long: true });
        } catch(err) {
            result = undefined;
        }

        return result;
    }

    public paginationButtons(): ButtonPaginationControllerResolavable[] {
        return [
            { button: new ButtonBuilder().setCustomId('prev').setLabel('Previous').setStyle(ButtonStyle.Secondary), type: 'PreviousPage' },
            { button: new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Secondary), type: 'NextPage' }
        ];
    }

    public async resolveFromCachedManager<V>(id: string, manager: { cache: Collection<string, V>; fetch(key: string): Promise<V|null> }): Promise<V> {
        const data = manager.cache.get(id) ?? await manager.fetch(id);
        if (data === null) throw new Error(`Couldn't fetch (${id}) from manager`);
        return data;
    }

    public commonSlashCommandOptions<T extends SlashCommandSubcommandBuilder|AnySlashCommandBuilder>(builder: T, options?: { target?: boolean; hide?: boolean;  }): T {
        const b = builder as SlashCommandBuilder;

        if (options?.target !== false) {
            b.addUserOption(target => target
                .setName('target')
                .setDescription('User to mention')
            )
        }

        if (options?.hide !== false) {
            b.addBooleanOption(hide => hide
                .setName('hide')
                .setDescription('Hide command response')
            )
        }

        return b as T;
    }
}

export default new Utility();