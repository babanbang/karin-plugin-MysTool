export default class Base {
	_get!: (key: any) => any
	_set!: (key: any, value: any) => any
	constructor(COLUMNS_KEY: string[]) {
		return new Proxy(this, {
			get(self, key, receiver) {
				if (typeof key === 'string' && COLUMNS_KEY.includes(key)) {
					return self._get.call(receiver, key)
				} else {
					return Reflect.get(self, key, receiver)
				}
			},
			set(target, key, newValue, receiver) {
				if (typeof key === 'string' && COLUMNS_KEY.includes(key)) {
					target._set.call(receiver, key, newValue)
					return true
				} else {
					return Reflect.set(target, key, newValue, receiver)
				}
			}
		})
	}
}