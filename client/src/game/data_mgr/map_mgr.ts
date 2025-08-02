import { Tile } from '../model/tile';
import { View } from '../model/view';
import { SPRITE_ID, spriteMager } from '../resource_mgr/sprite_mgr';
import { playerMager } from './player_mgr';

export function TileKey(gridX: number, gridY: number): number {
    const offset = 45000;  // 偏移量
    const positiveGridX = gridX + offset;  // 将负数转为正数
    const positiveGridY = gridY + offset;  // 将负数转为正数

    return positiveGridX * offset + positiveGridY;  // 生成唯一键
}

export function GetGrid(x: number, y: number): [number, number] {
    return [Math.floor(x / View.TILE_SIZE), Math.floor(y / View.TILE_SIZE)];
}

export function GetTileKey(x: number, y: number): number {
    return TileKey(Math.floor(x / View.TILE_SIZE), Math.floor(y / View.TILE_SIZE));
}

export function IsNearGrid(x1: number, y1: number, x2: number, y2: number) {
    return Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1;
}
export class MapManager {
    private oldScreenWidth = 0;
    private oldScreenHeight = 0;
    private RADIUS_X = 20;
    private RADIUS_Y = 20;
    private lastTileX = Infinity;
    private lastTileY = Infinity;

    public editMode: boolean = false;
    private mapData = new Map<number, Tile>();
    private newTiles = new Set<Tile>();
    private delTiles = new Set<Tile>();

    private terrainData = new Map<number, number>();
    private editModeTerrainData = new Map<number, number>();
    constructor() { }
    updateScreen(width: number, height: number) {
        if (this.oldScreenWidth === width && this.oldScreenHeight === height) return;
        this.RADIUS_X = Math.ceil(width / View.TILE_SIZE / 2 * 1.4);
        this.RADIUS_Y = Math.ceil(height / View.TILE_SIZE / 2 * 1.4);
        this.oldScreenWidth = width;
        this.oldScreenHeight = height;
    }
    updateMapAroundPlayer(x: number, y: number): boolean {
        const [tileX, tileY] = GetGrid(x, y);

        const moved = Math.abs(tileX - this.lastTileX) > 3 || Math.abs(tileY - this.lastTileY) > 3;
        if (!moved) return false; // 没有明显移动就不更新

        this.newTiles.clear();
        this.delTiles.clear();

        this.lastTileX = tileX;
        this.lastTileY = tileY;

        const top = tileY - this.RADIUS_Y;
        const bottom = tileY + this.RADIUS_Y;
        const left = tileX - this.RADIUS_X;
        const right = tileX + this.RADIUS_X;

        const visibleKeys = new Set<number>();
        for (let tileY = top; tileY <= bottom; tileY++) {
            for (let tileX = left; tileX <= right; tileX++) {
                const k = TileKey(tileX, tileY);
                visibleKeys.add(k);
                if (!this.mapData.has(k)) {
                    let terrain = this.terrainData.get(k) ?? Number(SPRITE_ID.EARTH);
                    if (this.editMode) {
                        terrain = this.editModeTerrainData.get(k) ?? terrain;
                    }
                    const newTile = new Tile(terrain)
                    newTile.x = tileX * View.TILE_SIZE;
                    newTile.y = tileY * View.TILE_SIZE;

                    this.newTiles.add(newTile);
                    this.mapData.set(k, newTile);
                }
            }
        }

        for (const [k, tile] of this.mapData) {
            if (!visibleKeys.has(k)) {
                this.mapData.delete(k);
                this.delTiles.add(tile);
            }
        }
        return true;
    }

    updateTile(tileKey: number, type: SPRITE_ID) {
        this.terrainData.set(tileKey, type);
    }

    updateEditModeTile(tileKey: number, type: SPRITE_ID) {
        this.editModeTerrainData.set(tileKey, type);
    }

    quitEditMode() {
        for (let [k, _] of this.editModeTerrainData) {
            if (this.mapData.has(k)) {
                let terrain = this.terrainData.get(k) ?? Number(SPRITE_ID.EARTH);

                this.getTile(k)?.updateSprite(spriteMager.getSrpite(terrain));
            }
        }
        this.editMode = false;
        this.editModeTerrainData.clear();
    }

    getAddTiles() {
        return this.newTiles;
    }

    getDelTiles() {
        return this.delTiles;
    }

    getTile(key: number) {
        return this.mapData.get(key);
    }

    getEditModeTerrainArrays(): [number[], number[]] {
        const keys: number[] = [];
        const values: number[] = [];

        this.editModeTerrainData.forEach((value, key) => {
            keys.push(key);
            values.push(value);
        });

        return [keys, values];
    }
}

export const mapMager = new MapManager();