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
const testPrivateKey = import.meta.env.VITE_PRIVATE_KEY;

export class ContractManager {
    private roomContract: ethers.Contract;
    private roomId: number = 0;
    constructor() {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        this.roomContract = new ethers.Contract(roomContractAddress, roomAbi, provider);
    }

    reload(privateKey: string) {
        if (testPrivateKey) {
            privateKey = testPrivateKey;
        }
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        this.roomContract = new ethers.Contract(roomContractAddress, roomAbi, wallet);

        this.roomContract.on("PlayerEntered", (player, roomId, name) => {
            console.log(`🚪 玩家进入房间：${name} (${player}) -> 房间 ${roomId.toString()}`);
        });
    }

    async createRoom(name: string) {
        try {
            const tx = await this.roomContract.createRoom(name);
            console.log("Transaction sent:", tx.hash);

            const receipt = await tx.wait();
            console.log("Transaction mined:", receipt.transactionHash);

            const iface = new ethers.Interface(roomAbi);
            let roomId: number | null = null;

            for (const log of receipt.logs) {
                // 只解析当前合约地址的事件
                if (log.address.toLowerCase() === String(this.roomContract.target).toLowerCase()) {
                    try {
                        const parsed = iface.parseLog(log); // 如果不能解析会 throw
                        if (parsed && parsed.name === "RoomCreated") {
                            roomId = Number(parsed.args.roomId);
                            console.log(`Room created! ID: ${roomId}, creator: ${parsed.args.creator}`);
                            break;
                        }
                    } catch {
                        // 不是 RoomCreated 事件，跳过
                    }
                }
            }

            if (roomId === null) {
                console.warn("RoomCreated event not found in logs.");
            }

            return roomId;
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



    async getAllRooms() {
        return await this.roomContract.getAllRooms();
    }
}

export const contractMgr = new ContractManager();
