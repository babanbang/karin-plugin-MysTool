export default class AttrItem {
  constructor (ds) {
    this.base = ds.base * 1 || 0
    this.plus = ds.plus * 1 || 0
    this.pct = ds.pct * 1 || 0
    this.inc = ds.inc * 1 || 0
  }

  static create (ds) {
    return new AttrItem(ds)
  }

  toString () {
    return (this.base || 0) + (this.plus || 0) + ((this.base || 0) * (this.pct || 0) / 100)
  }
}
