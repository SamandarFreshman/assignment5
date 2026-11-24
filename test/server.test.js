import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import { createAppServer } from "../src/server.js";

test("a deleted student's grade request returns 404", async (t) => {
  const server = createAppServer();
  server.listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, "listening");
  const baseURL = `http://127.0.0.1:${server.address().port}`;

  const created = await fetch(`${baseURL}/transcripts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Ada" }),
  });
  assert.equal(created.status, 201);
  const { studentID } = await created.json();
  const transcriptURL = `${baseURL}/transcripts/${studentID}`;
  const gradeURL = `${transcriptURL}/CS360`;

  const added = await fetch(gradeURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grade: 85 }),
  });
  assert.equal(added.status, 201);
  assert.deepEqual(await added.json(), { studentID, course: "CS360", grade: 85 });

  const deleted = await fetch(transcriptURL, { method: "DELETE" });
  assert.equal(deleted.status, 204);

  const grade = await fetch(gradeURL);
  assert.equal(grade.status, 404);
  assert.deepEqual(await grade.json(), { error: "Grade not found" });
});
