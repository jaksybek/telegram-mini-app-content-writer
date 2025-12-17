export type ThreadCreatePayload = { title: string; body: string; tags?: string[] };
export type Thread = {
  id: string;
  title: string;
  body: string;
  authorId?: string | null;
  createdAt: string;
  status?: string | null;
};

export async function createThread(payload: ThreadCreatePayload): Promise<Thread> {
  const res = await fetch("/api/threads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`createThread failed: ${res.status} ${text}`);
  }
  return res.json();
}
