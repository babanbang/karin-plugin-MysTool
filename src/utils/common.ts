import { common } from '#Karin'

export default {
  /**
 * 休眠函数
 * @param ms 毫秒
 */
  sleep (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  },

  makeForward (elements, Uin = '', Nick = '') {
    return common.makeForward(elements, Uin, Nick)
  }
}
