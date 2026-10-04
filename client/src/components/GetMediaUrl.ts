


const API_URL = 'http://localhost:8000' //process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const getMediaUrl = (projectID: string, fileName: string) => {
    return `${API_URL}/api/media/${projectID}/${fileName}`;
}
