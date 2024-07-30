export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};

export function merge<T>(target: DeepPartial<T>, ...sources: (DeepPartial<T> | undefined)[]): T {
    for (const source of sources) {
        if (!source) {
            continue;
        }
        Object.assign(target, source);
    }
    return target as T;
}
