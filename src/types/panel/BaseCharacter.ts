import { GameList } from "../mys"
import { ElementType } from "./BaseElement"
import { WeaponType } from "./BaseWeapon"

export const enum GsTalentType { a = 'a', e = 'e', q = 'q' }
export const enum SrTalentType { a = 'a', e = 'e', q = 'q', t = 't', z = 'z' }

export type TalentType<g extends GameList> = {
	[GameList.Gs]: GsTalentType;
	[GameList.Sr]: SrTalentType;
	[GameList.Zzz]: GsTalentType;
}[g]

export interface CharBaseInfo<g extends GameList> {
	id: number
	name: string
	/** 元素 */
	elem: ElementType<g>
	/** 稀有度 */
	rarity: g extends GameList.Zzz ? 'S' | 'A' : 4 | 5
	/** 武器类型 */
	weapon: WeaponType<g>
	/** 天赋ID对应 */
	talentId: Map<number, TalentType<g>>
	/** 天赋加成对应命座 [命座，升级值]*/
	talentCons: Map<TalentType<g>, [number, number]>
}