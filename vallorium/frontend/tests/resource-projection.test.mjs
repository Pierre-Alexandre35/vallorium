import assert from "node:assert/strict";
import test from "node:test";
import { projectResources } from "../src/features/villages/utils/project-resources.ts";

const village = {
  receivedAt: 1000,
  resources: { wood: 100, clay: 100, iron: 100, crop: 100 },
  production: { wood: 3600, clay: 3600, iron: 3600, crop: 3600 },
  capacities: { wood: 200, clay: 200, iron: 200, crop: 200 },
};
test("a delayed callback includes all elapsed production", () => {
  assert.equal(projectResources(village, 31000).wood, 130);
  assert.equal(village.resources.wood, 100);
});
test("storage caps apply after a long absence", () => {
  assert.equal(projectResources(village, 9999999).wood, 200);
});
test("a fresh snapshot rebases even when integer balances are unchanged", () => {
  assert.equal(
    projectResources({ ...village, receivedAt: 31000 }, 32000).wood,
    101,
  );
});
test("new snapshots cannot produce negative elapsed time", () => {
  assert.equal(projectResources(village, 0).wood, 100);
});
