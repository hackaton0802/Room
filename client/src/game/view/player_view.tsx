import { use, useEffect } from 'react'
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
    }, [])

    let syncAccumulator = 0;
    useTick((delta) => {
        syncAccumulator += delta.deltaMS;
        if (syncAccumulator >= 100) {
            syncAccumulator = 0;

            const self = playerMager.getSelf()
            if (self && self.updateMe()) {

            }
        }
    })

    const hanldeEnter = (address:any, roomId:any, name:any): void => {
        console.log(`🚪 玩家进入房间：${name} (${address}) -> 房间 ${roomId.toString()}`);

        console.log('wallet:', wallet);
        const player = new Player(true)
        player.setPosition(0, 0)
        playerMager.addPlayer(address, player)
        container.addChild(player)
        if (player.isLocalPlayer()) {
            playerMager.setSelf(player)
            if (player.sprite) {
                camera.setFollowTarget(player)
            }
        }
    }

    return null
}
