

export async function extractNotes(
  projectId: string, 
  signal?: AbortSignal): Promise<string> 
{
    const response = await fetch("http://localhost:8000/api/extractFiles", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        projectId,
      }),
      signal,
    });

    const result = await response.json()

    if (!response.ok || !result?.success || !result.notes) {
      throw new Error(result?.message || "Couldn't extract notes");
    }

    return result.notes;
}