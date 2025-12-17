import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ThreadComposer from "../components/ThreadComposer";
import * as api from "../api/threads";
import { vi } from "vitest";

vi.spyOn(api, "createThread").mockImplementation(async (p: any) => ({
  id: 1,
  ...p,
  authorId: null,
  createdAt: new Date().toISOString(),
  status: "published",
}));

describe("ThreadComposer", () => {
  it("validates and submits", async () => {
    render(<ThreadComposer />);
    fireEvent.change(screen.getByLabelText(/Заголовок/i), { target: { value: "My title" } });
    fireEvent.change(screen.getByLabelText(/Текст/i), { target: { value: "This is long enough body" } });
    fireEvent.click(screen.getByRole("button", { name: /Опубликовать/i }));
    await waitFor(() => expect(api.createThread).toHaveBeenCalled());
  });
});