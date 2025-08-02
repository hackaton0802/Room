import { useEffect } from 'react'
import { useTick } from '@pixi/react'
import { Container } from 'pixi.js'
import { useAuth } from '@context/auth'
import { playerMager } from '@/game/data_mgr/player_mgr'
import { Character } from '@/game/resource_mgr/anim_mgr'
import { Camera } from '@/game/model/camera'


export type PlayerData = {
    id: number
    x: number
    y: number
    self: boolean
    character: Character
}

type MapProps = {
    container: Container;
};
export function PlayerView() {
    useEffect(() => {

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

    return null
}
