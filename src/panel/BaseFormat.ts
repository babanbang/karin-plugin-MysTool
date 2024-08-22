import lodash from "node-karin/lodash";

export class BaseFormat {
    /** 默认元素 */
    #defElem: string
    /** 元素属性映射, 名称=>elem */
    #elemMap!: Record<string, string>
    /** 标准元素名 */
    #elemTitleMap!: Record<string, string>
    constructor(elemAlias: Record<string, string[]>) {
        this.#defElem = Object.keys(elemAlias)[0]
        lodash.forEach(elemAlias, (txt, key) => {
            this.#elemMap[key] = key
            this.#elemTitleMap[key] = txt[0]
            txt.forEach(t => this.#elemMap[t] = key)
        })
    }

    /** 根据名称获取元素key */
    elem(elem: string) {
        return this.#elemMap[elem.toLowerCase()] || this.#defElem
    }

    /** 根据key获取元素名 */
    elemName(elem: string) {
        return this.#elemTitleMap[this.elem(elem)]
    }
}