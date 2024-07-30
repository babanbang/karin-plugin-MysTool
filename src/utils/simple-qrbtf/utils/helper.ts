let seed = 0;

let idNum = 0;

export function rand(min: number, max: number) {
    seed = (seed * 9301 + 49297) % 233280;
    return min + (seed / 233280.0) * (max - min);
}

export function getIdNum() {
    idNum += 1;
    return idNum.toString();
}

export function getExactValue(value: any, defaultValue: any) {
    if (typeof value != 'string') return value;
    if (value.length <= 0) value = defaultValue;
    if (!isNaN(value)) value = parseInt(value);
    return value;
}

export function arrToStr(arr: string[]): string {
    return arr
        .reduce<string[]>((result, curr) => {
            if (curr && curr.length > 0) result.push(curr);
            return result;
        }, [])
        .join('\n');
}
