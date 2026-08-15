import { useEffect, useState } from 'react'

function read<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key)
        return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
        return fallback
    }
}

export default function useLocalStorage<T>(key: string, initial: T) {
    const [value, setValue] = useState<T>(() => read(key, initial))

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch {
        }
    }, [key, value])

    return [value, setValue] as const
}
