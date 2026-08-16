export const getHexWithOpacity = (hex: string, opacityPercent: number): string => {
    const cleanHex = hex.replace("#", "").slice(0, 6)

    const alphaInt = Math.round((opacityPercent / 100) * 255)

    const alphaHex = alphaInt.toString(16).padStart(2, "0").toUpperCase()

    return `#${cleanHex}${alphaHex}`
}