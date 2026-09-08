import test from "node:test";
import assert from "node:assert/strict";
import { requireAuth } from "./auth";
import { storage } from "./storage";

test("authenticated role is revalidated on every request", async () => {
  await storage.ready;
  const user = await storage.createUser({
    username: "role-revalidation-user",
    password: "strong-password",
    role: "instructor",
  });
  const request: any = {
    session: {
      user: { id: user.id, username: user.username, role: "instructor" },
      destroy: () => undefined,
    },
  };
  const response: any = {
    status: () => response,
    json: () => response,
  };

  await requireAuth(request, response, () => undefined);
  assert.equal(request.authUser.role, "instructor");

  await storage.updateUserRole(user.id, "student");
  await requireAuth(request, response, () => undefined);
  assert.equal(request.authUser.role, "student");
  assert.equal(request.session.user.role, "student");
});