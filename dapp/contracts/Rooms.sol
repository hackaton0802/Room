// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Rooms is ERC721URIStorage {
    struct Room {
        string roomName;
        uint256 posX;
        uint256 posY;
    }

    struct Player {
        string name;
        uint256 posX;
        uint256 posY;
        uint256 roomId;
        bool isInRoom;
    }

    uint256 private roomCount;
    mapping(uint256 => Room) private rooms;
    mapping(uint256 => address[]) private roomPlayers;
    mapping(address => Player) private playerInfo;

    constructor() ERC721("RoomNFT", "Room") {}

    // 事件
    event RoomCreated(address indexed creator, uint256 indexed roomId);
    event PlayerEntered(address indexed player, uint256 indexed roomId, string name);
    event PlayerMoved(address indexed player, uint256 indexed roomId, uint256 posX, uint256 posY);

    /// 获取所有房间 ID 和名字
    function getAllRooms() external view returns (uint256[] memory ids_, string[] memory names_) {
        ids_ = new uint256[](roomCount);
        names_ = new string[](roomCount);

        for (uint256 i = 0; i < roomCount; i++) {
            ids_[i] = i + 1;
            names_[i] = rooms[i + 1].roomName;
        }

        return (ids_, names_);
    }

    /// 创建房间
    function createRoom(string calldata _name) external {
        roomCount++;
        uint256 roomId = roomCount;

        rooms[roomId] = Room(_name, 0, 0);
        _safeMint(msg.sender, roomId);

        emit RoomCreated(msg.sender, roomId);
    }

    /// 玩家进入房间，设置初始位置
    function enterRoom(uint256 _roomId, string calldata _name) external {
        require(_roomId > 0 && _roomId <= roomCount, "Room does not exist");

        // 添加到房间内玩家列表
        if (!playerInfo[msg.sender].isInRoom) {
            roomPlayers[_roomId].push(msg.sender);
        }

        playerInfo[msg.sender] = Player({
            name: _name,
            posX: 0,
            posY: 0,
            roomId: _roomId,
            isInRoom: true
        });

        emit PlayerEntered(msg.sender, _roomId, _name);
    }

    /// 获取当前房间内其他人的信息
    function getRoomPlayers(uint256 _roomId) external view returns (address[] memory addrs,string[] memory names,uint256[] memory xs,uint256[] memory ys) {
        require(_roomId > 0 && _roomId <= roomCount, "Room does not exist");

        address[] memory players = roomPlayers[_roomId];
        uint256 count = players.length;

        addrs = new address[](count);
        names = new string[](count);
        xs = new uint256[](count);
        ys = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            address player = players[i];
            Player memory p = playerInfo[player];
            addrs[i] = player;
            names[i] = p.name;
            xs[i] = p.posX;
            ys[i] = p.posY;
        }
    }

    /// 玩家移动
    function move(uint256 _x, uint256 _y) external {
        require(playerInfo[msg.sender].isInRoom, "Player not in room");

        playerInfo[msg.sender].posX = _x;
        playerInfo[msg.sender].posY = _y;

        emit PlayerMoved(msg.sender, playerInfo[msg.sender].roomId, _x, _y);
    }
}
