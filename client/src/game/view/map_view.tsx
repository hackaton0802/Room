import { Container, FederatedPointerEvent } from 'pixi.js'
import { useEffect } from "react";
import { useTick } from '@pixi/react';
import { playerMager } from '@/game/data_mgr/player_mgr';
import { GetTileKey, mapMager } from "@/game/data_mgr/map_mgr";
import { View } from '../model/view';
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
        const clickPos = event.getLocalPosition(container);
        const self = playerMager.getSelf()
        if (self) {
            const tileKey = GetTileKey(clickPos.x, clickPos.y);
            const tile = mapMager.getTile(tileKey)
            if (!tile) {
                return
            }
        }
    }


    let syncAccumulator = 0;
    useTick((delta) => {
        syncAccumulator += delta.deltaMS;
        if (syncAccumulator >= 1000) {
            mapMager.updateScreen(View.VIEW_WIDTH, View.VIEW_HEIGHT)
            syncAccumulator = 0;
            const self = playerMager.getSelf()
            if (self) {
                handlePlayerMove(self.x, self.y)
            }
        }
    })

    return null;
};
