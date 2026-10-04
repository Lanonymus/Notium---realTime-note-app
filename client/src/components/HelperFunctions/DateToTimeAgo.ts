


const DateToTimeAgo = (dateString: string) : string => {
    const past = new Date(dateString).getTime()
    const now = Date.now()

    const seconds = Math.floor((now - past) / 1000)


    // jeśli data jest z przeszłości lub mniejsza niż 60 sekund

    if (seconds < 60) {
        return "Opened a moment ago"
    }

    // Definicja przedziałów w sekundach
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 }
    ];

    for(const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds)
        if(count >= 1) {
            const plural = count === 1 ? '' : 's'
            return `Opened ${count} ${interval.label}${plural} ago`
        }
    }


    return "Opened a moment ago"

}

export default DateToTimeAgo;