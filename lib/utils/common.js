import { segment } from '#Karin'

export default {
  /**
 * 休眠函数
 * @param ms 毫秒
 */
  sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  },

  makeForward (elements, Uin = '', Nick = '') {
    const message = []
    if (!Array.isArray(elements)) {
      elements = [elements]
    }

    for (let element of elements) {
      if (typeof element === 'string') {
        message.push([segment.text(element)])
      } else {
        if (Array.isArray(element)) {
          message.push(this.makeForward(element))
        } else {
          message.push([element])
        }
      }
    }

    return message.map((msg) => {
      if (!Array.isArray(msg)) {
        msg = [msg]
      }
      return segment.node(Uin, Nick, msg)
    })
  }
}
