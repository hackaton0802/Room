import { Container, AnimatedSprite, SCALE_MODES, Texture, Sprite, Graphics } from 'pixi.js'
import { AnimShowType, animManager, Character } from '@/game/resource_mgr/anim_mgr'
import { View } from './view'
import { SPRITE_ID } from '../resource_mgr/sprite_mgr'

export enum Direction {
    UP = 1,
    DOWN = 2,
    LEFT = 3,
    RIGHT = 4,
}

export enum MoveType {
    IDLE = 0,
    WALK = 1,
    RUN = 2,
}

export class Player extends Container {
    private isLocal: boolean
    private character: Character = Character.HUMAN1
    public sprite: AnimatedSprite | undefined

    public moveStatus: MoveType = MoveType.IDLE;
    public currentFacing: Direction = Direction.DOWN

    private currentAnimKey: string | null = null
    private keysPressed = new Set<string>()
    private keyPressed: string = ''

    private targetX: number | null = null;
    private targetY: number | null = null;
    private speed: number = 100; // 每秒移动100像素（可调整）
    constructor(isLocal = false) {
        super()
        this.isLocal = isLocal

        this.setAnim(AnimShowType.IDLE_FRONT)

        if (isLocal) {
            window.addEventListener('keydown', this.onKeyDown)
            window.addEventListener('keyup', this.onKeyUp)
        }
    }

    destroy(options?: any): void {
        if (this.isLocal) {
            window.removeEventListener('keydown', this.onKeyDown)
            window.removeEventListener('keyup', this.onKeyUp)
        }
        super.destroy(options)
    }
    private onKeyDown = (e: KeyboardEvent) => {
        this.keysPressed.add(e.key)
        this.keyPressed = e.key
    }

    private onKeyUp = (e: KeyboardEvent) => {
        this.keysPressed.delete(e.key)
        if (e.key == this.keyPressed) {
            this.keyPressed = ''
        }
    }
    setTarget(x: number, y: number) {
        this.targetX = x;
        this.targetY = y;
    }
    update(dt: number) {
        if (this.targetX === null || this.targetY === null) {
            this.moveStatus = MoveType.IDLE;
            this.updateAnimation();
            return;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const step = this.speed * dt;

        if (dist <= step) {
            // 到达目标点
            this.x = this.targetX;
            this.y = this.targetY;
            this.targetX = null;
            this.targetY = null;
            this.moveStatus = MoveType.IDLE;
        } else {
            // 沿方向移动
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * step;
            this.y += Math.sin(angle) * step;
            this.moveStatus = MoveType.WALK;

            // 设置朝向
            if (Math.abs(dy) > Math.abs(dx)) {
                this.currentFacing = dy > 0 ? Direction.DOWN : Direction.UP;
            } else {
                this.currentFacing = dx > 0 ? Direction.RIGHT : Direction.LEFT;
            }

            if (this.currentFacing === Direction.LEFT) {
                this.setDirection(-1);
            } else if (this.currentFacing === Direction.RIGHT) {
                this.setDirection(1);
            }
        }

        this.updateAnimation();
    }

    private setAnim(animKey: AnimShowType) {
        if (this.currentAnimKey === animKey) return
        this.currentAnimKey = animKey

        const textures = animManager.get(this.character, animKey)
        if (!textures) return

        if (!this.sprite) {
            this.sprite = new AnimatedSprite(textures)
            this.sprite.anchor.set(0.5)
            this.sprite.animationSpeed = 0.07
            this.sprite.loop = true
            // this.sprite.scale.set(2)
            this.sprite.setSize(View.PLAYER_SIZE, View.PLAYER_SIZE)
            this.sprite.texture.source.scaleMode = SCALE_MODES.NEAREST;
            this.addChild(this.sprite)
        } else {
            this.sprite.textures = textures
            this.sprite.texture.source.scaleMode = SCALE_MODES.NEAREST;
        }

        this.sprite.play()
    }

    public updateAnimation() {
        let anim: AnimShowType = AnimShowType.IDLE_FRONT

        if (this.moveStatus != MoveType.IDLE) {
            switch (this.currentFacing) {
                case Direction.DOWN: anim = AnimShowType.WALK_FRONT; break
                case Direction.UP: anim = AnimShowType.WALK_BACK; break
                case Direction.RIGHT: case Direction.LEFT: anim = AnimShowType.WALK_RIGHT; break
            }
        } else {
            switch (this.currentFacing) {
                case Direction.DOWN: anim = AnimShowType.IDLE_FRONT; break
                case Direction.UP: anim = AnimShowType.IDLE_BACK; break
                case Direction.RIGHT: case Direction.LEFT: anim = AnimShowType.IDLE_RIGHT; break
            }
        }

        this.setAnim(anim)
    }

    setDirection(dir: number) {
        if (this.sprite) {
            this.sprite.scale.x = Math.abs(this.sprite.scale.x) * dir
        }
    }

    setPosition(x: number, y: number) {
        this.position.set(x, y)
    }

    isLocalPlayer() {
        return this.isLocal
    }
}