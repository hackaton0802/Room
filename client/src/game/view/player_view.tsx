import { useEffect } from 'react'
import { useTick } from '@pixi/react'
import { Container } from 'pixi.js'
import { useAuth } from '@context/auth'
import { playerMager } from '@/game/data_mgr/player_mgr'
import { Character } from '@/game/resource_mgr/anim_mgr'
import { Camera } from '@/game/model/camera'
import { contractMgr } from '../data_mgr/contract_mgr'
import { Player } from '../model/player'


export type PlayerData = {
    id: number
    x: number
    y: number
    self: boolean
    character: Character
}

type PlayerProps = {
    container: Container;
    camera: Camera;
};
export function PlayerView(props: PlayerProps) {
    const { container, camera } = props;
    const { wallet } = useAuth();
    useEffect(() => {
        contractMgr.addEvent("PlayerEntered", hanldeEnter);
        contractMgr.addEvent("PlayerMoved", hanldeMove);
    }, [])


    useTick((delta) => {
        const dt = delta.deltaMS / 1000; // delta 是以帧数为单位的（默认60fps为基准）
        const players = playerMager.getPlayers();
        for (const player of players) {
            player.update(dt);
        }
    })

    let myRoom: number = 0
    const hanldeEnter = (address: any, roomId: any, name: any): void => {
        if (wallet?.address !== address) {
            if (myRoom == 0 || myRoom !== roomId) return
        }
        if(playerMager.findPlayer(address) !== null) return
        const player = new Player(wallet?.address === address, address)
        player.setPosition(0, 0)
        playerMager.addPlayer(address, player)
        container.addChild(player)
        if (player.isLocalPlayer()) {
            myRoom = roomId
            playerMager.setSelf(player)
            if (player.sprite) {
                camera.setFollowTarget(player)
            }

            (async () => {
                const players = await contractMgr.getRoomPlayers(roomId);
                console.log("players:", players);
                for (const p of players) {
                    const address = p.address;
                    const isSelf = address === wallet?.address;
                    if (isSelf) continue;

                    const player = new Player(false, address);
                    player.setPosition(p.x, p.y);
                    playerMager.addPlayer(p.address, player);
                    container.addChild(player);
                }
            })();
        }
        console.log(`🚪 玩家进入房间：${name} (${address}) -> 房间 ${roomId.toString()}`);
    }

    const hanldeMove = (address: any, roomId: any, posX: any, posY: any): void => {
        if (wallet?.address !== address) {
            if (myRoom == 0 || myRoom !== roomId) return
        } else {
            return
        }
        
        const movePlayer = playerMager.findPlayer(address)
        if(movePlayer) {
            console.log(`🚪 玩家移动：(${address})`);
            movePlayer.setTarget(Number(posX) - contractMgr.offset, Number(posY) - contractMgr.offset)
        }
    }

    return null
}
