export function safeCompare<T>(a: T | null | undefined, b: T | null | undefined, type: 'number' | 'string' | 'date' | 'boolean'): number {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    switch (type) {
        case 'number':
            return (a as number) - (b as number);
        case 'date':
        case 'string':
            return String(a).localeCompare(String(b));
        case 'boolean':
            // false < true 기준으로 정렬 (false가 먼저)
            return (a === b) ? 0 : a ? 1 : -1;
    }
}

export function sortByKey<T extends Record<string, unknown>>(
    a: T,
    b: T,
    key: keyof T,
    order: 'asc' | 'desc',
    type: 'number' | 'string' | 'date' | 'boolean'
): number {
    const valA = a[key];
    const valB = b[key];

    const result = safeCompare(valA, valB, type);
    return order === 'asc' ? result : -result;
}