import { segment } from '#Karin'

export default {
  makeForward (elements, Uin = '', Nick = '') {
    const message = []
    if (!Array.isArray(elements)) {
      elements = [elements]
    }

    for (let element of elements) {
      if (typeof element === 'string') {
        element = segment.text(element)
      }
      if (Array.isArray(element)) {
        message.push(this.makeForward(element))
      } else {
        message.push([element])
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
