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
    constructor() {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        this.roomContract = new ethers.Contract(roomContractAddress, roomAbi, provider);
    }

    reload(privateKey: string) {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        this.roomContract = new ethers.Contract(roomContractAddress, roomAbi, wallet);
    }

    addEvent(eventName: string, callback: (...args: any[]) => void) {
        this.roomContract.on(eventName, callback);
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
