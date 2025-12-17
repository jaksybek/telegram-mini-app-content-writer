import React, { useEffect, useState } from "react";
import { createThread, ThreadCreatePayload } from "../api/threads";

const DRAFT_KEY = "thread_draft_v1";
const CHAR_LIMIT = 5000;

export default function ThreadComposer({ onCreated }: { onCreated?: (t: any) => void }) {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setTitle(parsed.title || "");
                setBody(parsed.body || "");
            } catch {
                // ignore
            }
        }
    }, []);

    useEffect(() => {
        const data = JSON.stringify({ title, body, updatedAt: Date.now() });
        localStorage.setItem(DRAFT_KEY, data);
    }, [title, body]);

    function validate() {
        if (title.trim().length < 3) return "Заголовок должен быть не короче 3 символов";
        if (body.trim().length < 10) return "Тело треда должно быть не короче 10 символов";
        if (body.length > CHAR_LIMIT) return `Текст не должен превышать ${CHAR_LIMIT} символов`;
        return null;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const v = validate();
        if (v) {
            setError(v);
            return;
        }
        setLoading(true);
        try {
            const payload: ThreadCreatePayload = { title: title.trim(), body: body.trim() };
            const thread = await createThread(payload);
            localStorage.removeItem(DRAFT_KEY);
            setTitle("");
            setBody("");
            onCreated?.(thread);
        } catch (err: any) {
            setError(err?.message ?? "Ошибка отправки");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} aria-label="thread-composer">
            <div>
                <label htmlFor="title">Заголовок</label>
                <input id="title" aria-label="Заголовок" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </div>
            <div>
                <label htmlFor="body">Текст</label>
                <textarea id="body" aria-label="Текст" value={body} onChange={(e) => setBody(e.target.value)} />
                <div>{body.length}/{CHAR_LIMIT}</div>
            </div>
            {error && <div role="alert">{error}</div>}
            <button type="submit" disabled={loading}>{loading ? "Отправка..." : "Опубликовать"}</button>
        </form>
    );
}
