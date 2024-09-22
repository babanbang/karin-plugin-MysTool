import lodash from "node-karin/lodash";
import { ElementType, GameList } from "@/types";

export class BaseFormat<g extends GameList> {
	/** 默认元素 */
	#defElem: ElementType<g>
	/** 元素属性映射, 名称=>elem */
	#elemMap: Map<string, ElementType<g>> = new Map()
	/** 标准元素名 */
	#elemTitleMap: Map<ElementType<g>, string> = new Map()
	constructor(elemAlias: { [key in ElementType<g>]: string[] }) {
		this.#defElem = Object.keys(elemAlias)[0] as ElementType<g>
		lodash.forEach(elemAlias, (txt, key) => {
			this.#elemMap.set(key, key as ElementType<g>)
			this.#elemTitleMap.set(key as ElementType<g>, txt[0])
			txt.forEach(t => this.#elemMap.set(t, key as ElementType<g>))
		})
	}

	/** 根据名称获取元素key */
	elem(elem: string) {
		return this.#elemMap.get(elem.toLowerCase()) || this.#defElem
	}

	/** 根据key获取元素名 */
	elemName(elem: string) {
		return this.#elemTitleMap.get(this.elem(elem))
	}
}