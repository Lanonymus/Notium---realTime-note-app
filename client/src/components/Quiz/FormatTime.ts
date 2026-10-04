


export const FormatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = timeInSeconds % 60

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, '0')}`
}