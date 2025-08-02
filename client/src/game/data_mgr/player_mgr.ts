import { Player } from '../model/player';

export class PlayerManager {
    private players = new Map<string, Player>();  // ⬅ 使用地址作为 key
    private self: Player | null = null;

    constructor() {}

    setSelf(player: Player | null) {
        this.self = player;
    }

    getSelf(): Player | null {
        return this.self;
    }

    getPlayers(): Player[] {
        return Array.from(this.players.values());
    }

    hasPlayer(address: string): boolean {
        return this.players.has(address);  // 确保地址统一格式
    }

    findPlayer(address: string): Player | null {
        console.log('findPlayer', this.players.get(address));
        return this.players.get(address) || null;
    }

    addPlayer(address: string, player: Player) {
        this.players.set(address, player);
    }

    removePlayer(address: string) {
        this.players.delete(address);
    }

}

export const playerMager = new PlayerManager();
