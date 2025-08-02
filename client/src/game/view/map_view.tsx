import { Container, FederatedPointerEvent } from 'pixi.js'
import { useEffect } from "react";
import { useTick } from '@pixi/react';
import { playerMager } from '@/game/data_mgr/player_mgr';
import { mapMager } from "@/game/data_mgr/map_mgr";
import { View } from '../model/view';
import { contractMgr } from '../data_mgr/contract_mgr';
type MapProps = {
    container: Container;
};
export function MapView(props: MapProps) {
    const { container } = props;

    useEffect(() => {
        const self = playerMager.getSelf()
        if (self) {
            handlePlayerMove(self.x, self.y)
        }

        container.eventMode = 'dynamic';
        container.on('pointerdown', (event) => {
            clickMap(event)
        });
    }, []);
    const handlePlayerMove = (x: number, y: number) => {
        if (mapMager.updateMapAroundPlayer(x, y)) {
            for (const tile of mapMager.getAddTiles()) {
                container.addChild(tile)
            }
            for (const tile of mapMager.getDelTiles()) {
                container.removeChild(tile)
            }
        }
    };

    const clickMap = (event: FederatedPointerEvent) => {
        const self = playerMager.getSelf();
        if (!self) return;

        const local = event.getLocalPosition(container);
        self.setTarget(local.x, local.y);
        contractMgr.move(local.x, local.y);
    }


    let syncAccumulator = 0;
    useTick((delta) => {
        const self = playerMager.getSelf()
        if (!self) {
            return
        }
        syncAccumulator += delta.deltaMS;
        if (syncAccumulator >= 1000) {
            mapMager.updateScreen(View.VIEW_WIDTH, View.VIEW_HEIGHT)
            syncAccumulator = 0;

            handlePlayerMove(self.x, self.y)
        }

    })

    return null;
};
