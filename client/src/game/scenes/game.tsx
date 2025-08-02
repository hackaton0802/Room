import { useApplication } from '@pixi/react'
import { Container } from "pixi.js";
import { MapView } from '../view/map_view';
import { PlayerView } from '../view/player_view';
import { Camera } from '@/game/model/camera';
import { View } from '../model/view';


export function GameScene() {
    const { app } = useApplication();

    const worldWidth = app.screen.width;
    const worldHeight = app.screen.height;
    View.Resize(worldWidth, worldHeight);

    const cameraContainer = new Container();
    const mapLayer = new Container();
    const playerLayer = new Container();
    cameraContainer.addChild(mapLayer, playerLayer);
    app.stage.addChild(cameraContainer);

    const camera = new Camera(
        cameraContainer,
        worldWidth,
        worldHeight,
        worldWidth,
        worldHeight
    );

    // 添加帧循环
    app.ticker.add(() => {
        camera.update();
    });

    console.log('Game init');
    return (
        <>
            <MapView container={mapLayer} />
            {/* <PlayerView container={playerLayer} camera={camera} /> */}
        </>
    );
}