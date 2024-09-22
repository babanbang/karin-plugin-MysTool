import { GameList } from "..";

export const enum GsWeaponType {
	/** 弓 */
	bow = 'bow',
	/** 法器 */
	catalyst = 'catalyst',
	/** 双手剑 */
	claymore = 'claymore',
	/** 长柄武器 */
	polearm = 'polearm',
	/** 单手剑 */
	sword = 'sword'
}

export const enum SrWeaponType {
	/** 存护 */
	/** 丰饶 */
	/** 毁灭 */
	/** 同协 */
	/** 虚无 */
	/** 巡猎 */
	/** 智识 */
}

export const enum ZzzWeaponType {
	/** 异常 */
	/** 强攻 */
	/** 防护 */
	/** 击破 */
	/** 支援 */
}

export type WeaponType<g extends GameList> = {
	[GameList.Gs]: GsWeaponType;
	[GameList.Sr]: SrWeaponType;
	[GameList.Zzz]: ZzzWeaponType;
}[g]

export interface WeaponBaseInfo<g extends GameList> {
	id: number
	name: string
	type: WeaponType<g>
	rarity: number
}