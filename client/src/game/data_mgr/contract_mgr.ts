import { Log } from "ethers";
import { id, Interface } from "ethers";
import { ethers } from "ethers";

const roomAbi = [
    'function getAllRooms() external view returns (uint256[] memory ids_, string[] memory names_)',
    'function createRoom(string calldata _name) external returns (uint256)',
    'event RoomCreated(address indexed creator, uint256 indexed roomId)',
    'function enterRoom(uint256 _roomId, string calldata _name) external',
    'event PlayerEntered(address indexed player, uint256 indexed roomId, string name)',
    'function getRoomPlayers(uint256 _roomId) external view returns (address[] memory addrs,string[] memory names,uint256[] memory xs,uint256[] memory ys)',
    'function move(uint256 _x, uint256 _y) external',
    'event PlayerMoved(address indexed player, uint256 indexed roomId, uint256 posX, uint256 posY)'
];
const roomContractAddress = import.meta.env.VITE_ROOMS_ADDRESS || '';

const rpcUrl = import.meta.env.VITE_ETH_URL;

export class ContractManager {
    private roomContract: ethers.Contract;
    public offset: number = 10000;
    private latestBlockChecked = 0;
    constructor() {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        this.roomContract = new ethers.Contract(roomContractAddress, roomAbi, provider);
    }

    async reload(privateKey: string) {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        this.roomContract = new ethers.Contract(roomContractAddress, roomAbi, wallet);
        const latestBlock = await provider.getBlockNumber();
        this.latestBlockChecked = latestBlock;
    }

    addEvent(eventName: string, callback: (...args: any[]) => void) {
        this.roomContract.on(eventName, callback);
    }

    addEventPolling(
        eventName: string,
        callback: (...args: any[]) => void,
        intervalMs = 1000,
        fromBlock?: number
    ) {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const iface = new Interface(roomAbi);

        if(fromBlock !== undefined) {
            this.latestBlockChecked = fromBlock;
        }
        const BLOCK_LIMIT = 20;

        const eventSignatureMap: Record<string, string> = {
            PlayerEntered: "PlayerEntered(address,uint256,string)",
            PlayerMoved: "PlayerMoved(address,uint256,uint256,uint256)",
            RoomCreated: "RoomCreated(address,uint256)"
        };

        const eventSignature = eventSignatureMap[eventName];
        if (!eventSignature) {
            console.error(`❌ Unknown event: ${eventName}`);
            return;
        }

        const eventTopic = id(eventSignature);

        const poll = async () => {
            try {
                const latestBlock = await provider.getBlockNumber();

                // 分批处理，避免超出 block range 限制
                while (this.latestBlockChecked < latestBlock) {
                    const from = this.latestBlockChecked + 1;
                    const to = Math.min(from + BLOCK_LIMIT - 1, latestBlock);

                    const logs: Log[] = await provider.getLogs({
                        fromBlock: from,
                        toBlock: to,
                        address: roomContractAddress,
                        topics: [eventTopic],
                    });

                    for (const log of logs) {
                        try {
                            const parsed = iface.parseLog(log);
                            if (parsed) {
                                callback(...parsed.args);
                            }
                        } catch (err) {
                            console.warn("⚠️ 无法解析日志:", err);
                        }
                    }

                    this.latestBlockChecked = to;
                }
            } catch (err) {
                console.error(`Polling error for ${eventName}:`, err);
            }

            setTimeout(poll, intervalMs);
        };

        poll();
    }


    async createRoom(name: string) {
        try {
            await this.roomContract.createRoom(name);
        } catch (error) {
            console.error("Failed to create room:", error);
            return null;
        }
    }

    async enterRoom(roomId: number, playerName: string) {
        try {
            const tx = await this.roomContract.enterRoom(roomId, playerName);
            console.log("Transaction sent:", tx.hash);

            const receipt = await tx.wait();
            console.log("Transaction mined:", receipt.transactionHash);

            const iface = new ethers.Interface(roomAbi);
            let success = false;

            for (const log of receipt.logs) {
                if (log.address.toLowerCase() === String(this.roomContract.target).toLowerCase()) {
                    try {
                        const parsed = iface.parseLog(log);
                        if (parsed && parsed.name === "PlayerEntered") {
                            const enteredRoomId = Number(parsed.args.roomId);
                            const playerAddr = parsed.args.player;
                            const enteredName = parsed.args.name;
                            console.log(`✅ Player entered room! Address: ${playerAddr}, Room ID: ${enteredRoomId}, Name: ${enteredName}`);
                            success = true;
                            break;
                        }
                    } catch {
                        // 非匹配事件，跳过
                    }
                }
            }

            if (!success) {
                console.warn("⚠️ PlayerEntered event not found.");
            }

            return success;
        } catch (error) {
            console.error("Failed to enter room:", error);
            return false;
        }
    }

    async getRoomPlayers(roomId: number): Promise<{
        address: string;
        name: string;
        x: number;
        y: number;
    }[]> {
        try {
            const [addrs, names, xs, ys] = await this.roomContract.getRoomPlayers(roomId);

            const players = addrs.map((addr: string, index: number) => ({
                address: addr,
                name: names[index],
                x: Number(xs[index]) - this.offset,  // 去掉偏移，方便地图显示
                y: Number(ys[index]) - this.offset,
            }));

            return players;
        } catch (error) {
            console.error("Failed to get room players:", error);
            return [];
        }
    }


    async getAllRooms() {
        return await this.roomContract.getAllRooms();
    }

    async move(posX: number, posY: number) {
        try {
            // 先取整，再加偏移
            const finalX = Math.floor(posX) + this.offset;
            const finalY = Math.floor(posY) + this.offset;

            await this.roomContract.move(finalX, finalY);
        } catch (error) {
            console.error("Failed to move:", error);
            return null;
        }
    }
}

export const contractMgr = new ContractManager();
