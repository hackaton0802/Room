import { useEffect, useState } from 'react'
import { GameScene } from './game'
import { animManager } from '../resource_mgr/anim_mgr';
import { spriteMager } from '../resource_mgr/sprite_mgr';

export function GameEntry() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const loadResources = async () => {
            try {
                await Promise.all([
                    animManager.preload(),
                    spriteMager.preload(),
                ]);

                if (isMounted) {
                    setIsReady(true);
                }
            } catch (error) {
                console.error('资源加载失败:', error);
            }
        };

        loadResources();
        return () => {
            isMounted = false;
        };
    }, []);

    return <>
        {isReady && <GameScene />}
    </>
}
