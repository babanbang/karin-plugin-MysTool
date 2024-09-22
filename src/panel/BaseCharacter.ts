import { CharBaseInfo, GameList } from "@/types";
import { BasePanel } from "./BasePanel";

export class BaseCharacter<g extends GameList> extends BasePanel<g>{
	id: CharBaseInfo<g>['id']
	name: CharBaseInfo<g>['name']
	/** 元素 */
	elem: CharBaseInfo<g>['elem']
	/** 稀有度 */
	rarity: CharBaseInfo<g>['rarity'];
	/** 武器类型 */
	weapon: CharBaseInfo<g>['weapon'];
	/** 天赋ID对应 */
	talentId: CharBaseInfo<g>['talentId'];
	/** 天赋加成对应命座 */
	talentCons: CharBaseInfo<g>['talentCons'];

	constructor(game: g, Info: CharBaseInfo<g>) {
		super(game)

		this.id = Info.id
		this.name = Info.name
		this.elem = Info.elem
		this.rarity = Info.rarity
		this.weapon = Info.weapon
		this.talentId = Info.talentId
		this.talentCons = Info.talentCons
	}
}