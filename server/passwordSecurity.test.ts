import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { MemStorage } from "./storage";

test("createUser stores bcrypt hashes instead of plaintext passwords", async () => {
  const storage = new MemStorage();
  await storage.ready;
  const user = await storage.createUser({
    username: "hash-test-user",
    password: "strong-password",
    role: "student",
  });

  assert.notEqual(user.password, "strong-password");
  assert.equal(await bcrypt.compare("strong-password", user.password), true);
  assert.equal(await bcrypt.compare("wrong-password", user.password), false);
});