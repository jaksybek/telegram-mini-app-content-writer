import { randomUUID } from "crypto";

export type Thread = {
    id: string;
    title: string;
    body: string;
    authorId?: string | null;
    createdAt: string;
    status?: string | null;
};

const store = new Map<string, Thread>();

function genId() {
    return randomUUID();
}

export function createThread(data: Omit<Thread, "id" | "createdAt">): Thread {
    const id = genId();
    const thread: Thread = {
        id,
        createdAt: new Date().toISOString(),
        title: data.title,
        body: data.body,
        authorId: data.authorId ?? null,
        status: data.status ?? "published",
    };
    store.set(id, thread);
    return thread;
}

export function getThread(id: string): Thread | undefined {
    return store.get(id);
}

export function clearStore(): void {
    store.clear();
}

export function closeDb(): void {
    // no-op for in-memory store; kept for API symmetry
    return;
}
