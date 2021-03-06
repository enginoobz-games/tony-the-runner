import { Globals } from './Globals'
import Helpers from './Helpers';
import { PlatformData, PlatformShape } from './Types'

const { ccclass, property } = cc._decorator;
const TILE_SIZE: number = 64;

@ccclass
export default class Platform extends cc.Component {
    @property(cc.Prefab)
    dirtGrassPrefab = null;
    @property(cc.Prefab)
    dirtPrefab: cc.Prefab = null; //fill tile
    @property(cc.Prefab)
    spikePrefab = null
    @property(cc.Prefab)
    heartPrefab = null
    @property(cc.Prefab)
    shieldPrefab = null
    @property({ type: [cc.Prefab] })
    diamondPrefabs: cc.Prefab[] = []
    @property({ type: [cc.Prefab] })
    treePrefabs: cc.Prefab[] = []
    @property({ type: [cc.Prefab] })
    enemyPrefabs: cc.Prefab[] = []
    @property({ type: [cc.Prefab] })
    flyingEnemyPrefabs: cc.Prefab[] = []

    @property
    itemOffsetMin: number = 100
    @property
    itemOffsetMax: number = 200

    _active: boolean // whether visible on the screen
    // onLoad () {}

    start() {
    }

    init(data: PlatformData) {
        this._active = true;
        this.node.removeAllChildren()
        this.node.setPosition(data.x, data.y);

        // create tiles
        for (let i = 0; i < data.tilesCount; i++) {
            let tile: cc.Node
            if (data.shape == PlatformShape.VERTICAL) {
                if (i == data.tilesCount - 1) {
                    tile = cc.instantiate(this.dirtGrassPrefab);
                } else {
                    tile = cc.instantiate(this.dirtPrefab);
                }
            } else {
                tile = cc.instantiate(this.dirtGrassPrefab);
            }

            switch (data.shape) {
                case PlatformShape.HORIZONTAL:
                    tile.setPosition(i * tile.width, 0)
                    // update node size
                    this.node.width = TILE_SIZE * data.tilesCount;
                    this.node.height = TILE_SIZE;
                    break;
                case PlatformShape.VERTICAL:
                    tile.setPosition(tile.width, i * tile.height)
                    this.node.width = TILE_SIZE;
                    this.node.height = TILE_SIZE * data.tilesCount;
                    break;
                case PlatformShape.DIAGONAL_DOWN:
                    tile.setPosition(i * tile.width, (data.tilesCount - 1 - i) * tile.height)
                    this.node.width = TILE_SIZE * data.tilesCount;
                    this.node.height = TILE_SIZE * data.tilesCount;
                    // tile.name = "lastTile"
                    break;
                case PlatformShape.DIAGONAL_UP:
                    tile.setPosition(i * tile.width, i * tile.height)
                    this.node.width = TILE_SIZE * data.tilesCount;
                    this.node.height = TILE_SIZE * data.tilesCount;
                    // tile.name = "lastTile"
                    break;
                case PlatformShape.ZIC_ZAC:
                    tile.setPosition(i * tile.width, (i % 2) * tile.height)
                    this.node.width = TILE_SIZE * data.tilesCount;
                    this.node.height = TILE_SIZE * 2;
                    break;
            }

            this.node.addChild(tile)
            // if (i == data.tilesCount - 1) tile.name = "lastTile"
        }

        this.populateTiles(data)
        this.fillPlatform(data)
        // this.fillHorizontalBottom(data)
    }

    populateTiles(data: PlatformData) {
        for (let i = 0; i < data.tilesCount; i++) {
            const tile: cc.Node = this.node.children[i]
            // if (tile.name === 'fillTile') return // don't need to populate fill tiles

            switch (data.shape) {
                case PlatformShape.HORIZONTAL:
                case PlatformShape.DIAGONAL_DOWN:
                case PlatformShape.DIAGONAL_UP:
                case PlatformShape.ZIC_ZAC:
                    this.populateTile(tile)
                    break
                case PlatformShape.VERTICAL:
                    // populate only on the top tile of vertical platform
                    if (i === this.node.childrenCount - 1) {
                        this.populateTile(tile)
                    }
                    break
            }


            /* POPULATE ON SPECIFIC TILES */
            // ENEMY
            const random1: number = Math.random()
            // % on last tile of horizontal platform
            if (data.shape === PlatformShape.HORIZONTAL && i === this.node.childrenCount - 1) {
                if (random1 < 0.5) {
                    this.createEnemy(tile)
                } else {
                    // this.createFlyingEnemy(tile)
                }
            }
            // % on last tile of up diagonal platform
            if (data.shape === PlatformShape.DIAGONAL_UP && i === this.node.childrenCount - 1 && random1 < 0.3) {
                this.createEnemy(tile)
            }

            if (data.shape !== PlatformShape.VERTICAL && Math.random() < 0.2) {
                this.createFlyingEnemy(tile)
            }

            // HEART & SHIELD
            const random2: number = Math.random()
            // % on first tile
            if (i === 0 && random2 < 0.15) {
                this.createHeart(tile)
            } else if (i === 0 && 0.15 < random2 && random2 < 0.3) {
                this.createShield(tile)
            }
        }
    }

    // fill only first and last tile due to performance issue
    fillPlatform(data: PlatformData) {
        for (let i = 0; i < data.tilesCount; i++) {
            const tile: cc.Node = this.node.children[i]

            if (data.shape === PlatformShape.VERTICAL && i === 0) {
                this.fillTillBottom(tile)
            } else {
                if (i === 0 || i === data.tilesCount - 1)
                    this.fillTillBottom(tile)
            }
        }
    }

    fillTile(x: number, y: number): cc.Node {
        const filledTile: cc.Node = cc.instantiate(this.dirtPrefab);
        this.node.addChild(filledTile)
        filledTile.setPosition(x, y)

        return filledTile
    }

    fillTillBottom(tile: cc.Node) {
        const yToBottom: number = tile.y + cc.winSize.height / 2
        const tileAmount: number = yToBottom / this.dirtPrefab.data.height - 2

        for (let i = 0; i < tileAmount; i++) {
            this.fillTile(tile.x, tile.y - (i + 1) * this.dirtPrefab.data.height)
            // fillTile.name = "fillTile"
        }
    }

    // TODO
    fillHorizontalBottom(data: PlatformData) {
        if (data.tilesCount < 3 || data.shape === PlatformShape.VERTICAL) return // since first and last tile are already filled till bottom

        switch (data.shape) {
            case PlatformShape.HORIZONTAL:
            case PlatformShape.DIAGONAL_UP:
            case PlatformShape.ZIC_ZAC:
                const yToBottom: number = data.y + cc.winSize.height / 2 - 124
                this.fillTile(64, yToBottom).color = new cc.Color(255, 0, 0)
                // console.log(yToBottom)
                break
            case PlatformShape.DIAGONAL_DOWN:
                break
        }
    }

    populateTile(tile: cc.Node) {
        const random: number = Math.random()

        if (random <= 0.4) { // diamond occurrence: 40%
            if (Math.random() <= 0.3) this.createTree(tile) // tree occurence on diamond tile: 30% 
            this.createDiamond(tile)
        } else if (0.4 < random && random < 0.55) {  // spike occurence: 15%
            this.createSpike(tile)
        } else {
            if (Math.random() <= 0.5) this.createTree(tile) // tree occurence on empty tile: 50% 
        }
    }

    createHeart(tile: cc.Node) {
        const heart: cc.Node = cc.instantiate(this.heartPrefab)

        const offsetX: number = Helpers.randomBetween(-TILE_SIZE * 4, 0) // left side of tile
        const offsetY: number = Helpers.randomBetween(this.itemOffsetMin, this.itemOffsetMax)
        heart.setPosition(offsetX, offsetY)
        tile.addChild(heart)
    }

    createShield(tile: cc.Node) {
        const shield: cc.Node = cc.instantiate(this.shieldPrefab)

        const offsetX: number = Helpers.randomBetween(-TILE_SIZE * 4, 0) // left side of tile
        const offsetY: number = Helpers.randomBetween(this.itemOffsetMin, this.itemOffsetMax)
        shield.setPosition(offsetX, offsetY)
        tile.addChild(shield)
    }

    createDiamond(tile: cc.Node) {
        const random: number = Math.random()
        let diamondTypeIndex: number = null
        if (random <= 0.8) {    // diamond I probability: 80%
            diamondTypeIndex = 0
        } else if (0.8 < random && random < 0.97) {  // diamond II probability: 17%
            diamondTypeIndex = 1
        } else {    // diamond III probability: 3% 
            diamondTypeIndex = 2
        }

        const diamond: cc.Node = cc.instantiate(this.diamondPrefabs[diamondTypeIndex])

        const offsetY: number = Helpers.randomBetween(this.itemOffsetMin, this.itemOffsetMax)
        diamond.setPosition(0, offsetY)
        tile.addChild(diamond)
    }

    createEnemy(tile: cc.Node) {
        const randomIndex = Helpers.randomIntBetween(0, this.enemyPrefabs.length - 1)
        const enemy: cc.Node = cc.instantiate(this.enemyPrefabs[randomIndex])
        enemy.setPosition(0, tile.height + enemy.height / 2 - enemy.height / 2) // pre-calculate position in prefabs to reduce calculations
        tile.addChild(enemy)
    }

    createFlyingEnemy(tile: cc.Node) {
        const randomIndex = Helpers.randomIntBetween(0, this.flyingEnemyPrefabs.length - 1)
        const flyingEnemy: cc.Node = cc.instantiate(this.flyingEnemyPrefabs[randomIndex])
        flyingEnemy.setPosition(0, 100) // pre-calculate position in prefabs to reduce calculations
        tile.addChild(flyingEnemy)
    }

    createSpike(tile: cc.Node) {
        const spike: cc.Node = cc.instantiate(this.spikePrefab)
        // spike.setPosition(0, tile.height + spike.height / 2 - tile.height / 2) // pre-calculate position in prefabs to reduce calculations
        tile.addChild(spike)

        const scaleX = Helpers.randomBetween(0.5, 1)
        const scaleY = Helpers.randomBetween(0.5, 1.5)
        spike.setScale(scaleX, scaleY)
        spike.setPosition(0, tile.height + (spike.height * scaleY) / 2 - tile.height / 2)
    }

    createTree(tile: cc.Node) {
        const randomIndex = Helpers.randomIntBetween(0, this.treePrefabs.length - 1)
        const tree: cc.Node = cc.instantiate(this.treePrefabs[randomIndex])
        tile.addChild(tree)

        const scaleX = Helpers.randomBetween(1, 1.75)
        const scaleY = Helpers.randomBetween(1, 1.75)
        tree.setScale(scaleX, scaleY)
        tree.setPosition(0, tile.height + (tree.height * scaleY) / 2 - tile.height / 2)
    }

    update(dt) {
        // this.node.x -= 50 * dt;
        // this.node.children.forEach((child: cc.Node) => child.getComponent(cc.RigidBody).syncPosition(true))
        this.node.children.forEach((child: cc.Node) => child.x -= Globals.speed * dt)
        // this.node.children.forEach((child: cc.Node) => child.children.forEach((grandchild:cc.Node)=>{
        //     grandchild.x -= Globals.speed * dt / 2
        // }))
        if (this.node.x < 0 - this.node.width) {
            this._active = false
        }
    }
}
