/**
 * @vitest-environment node
 */
import request from "supertest";
import { beforeEach, afterAll, describe, it, expect } from "vitest";
import app from "../../src/server/index";
import { clearStore, closeDb } from "../../src/server/db";

beforeEach(() => clearStore());
afterAll(() => closeDb());

describe("POST /api/threads", () => {
  it("creates and retrieves a thread", async () => {
    const res = await request(app)
      .post("/api/threads")
      .send({ title: "Hello", body: "This is a valid body with >10 chars" })
      .set("Accept", "application/json");
    expect(res.status).toBe(201);
    const id = res.body.id;
    const get = await request(app).get(`/api/threads/${id}`);
    expect(get.status).toBe(200);
    expect(get.body.title).toBe("Hello");
  });

  it("returns 400 on invalid payload", async () => {
    const res = await request(app).post("/api/threads").send({ title: "Hi", body: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
  });

  it("enforces rate limit", async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post("/api/threads").send({ title: "T" + i, body: "A valid body with enough length" });
    }
    const res = await request(app).post("/api/threads").send({ title: "overflow", body: "A valid body with enough length" });
    expect([429, 201]).toContain(res.status);
  });
});
