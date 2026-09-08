import test from "node:test";
import assert from "node:assert/strict";
import { MemStorage } from "./storage";

test("production storage creates no fixed demo accounts by default", async () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  delete process.env.BOOTSTRAP_ADMIN_USERNAME;
  delete process.env.BOOTSTRAP_ADMIN_PASSWORD;
  try {
    const storage = new MemStorage();
    await storage.ready;
    assert.deepEqual(await storage.getAllUsers(), []);
    assert.equal((await storage.getAllActiveExams()).length, 0);
  } finally {
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
});