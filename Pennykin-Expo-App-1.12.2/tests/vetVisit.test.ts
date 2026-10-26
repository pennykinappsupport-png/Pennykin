import assert from "node:assert/strict";
import test from "node:test";
import { VET_CHECK_MS, VET_TREAT_MS, VET_HAPPY_MS, vetStageDelay, vetVisitReducer, type VetVisit } from "../src/vetVisit";

function start(): VetVisit { return vetVisitReducer(null, { type: "START", id: "visit" })!; }
function ready(): VetVisit { return vetVisitReducer(start(), { type: "CHECKED", id: "visit" })!; }

test("check-up lasts one second then waits for explicit treatment", () => {
  assert.equal(vetStageDelay(start()), VET_CHECK_MS);
  assert.equal(VET_CHECK_MS, 1000);
  const visit = ready();
  assert.equal(visit.stage, "treat");
  assert.equal(visit.applied, false);
  assert.equal(vetStageDelay(visit), null);
});

test("rapid treatment presses enter the applying stage only once", () => {
  const visit = vetVisitReducer(ready(), { type: "TREAT", id: "visit" })!;
  assert.equal(visit.stage, "treating");
  assert.equal(vetVisitReducer(visit, { type: "TREAT", id: "visit" }), visit);
  assert.equal(vetStageDelay(visit), null);
  assert.equal(vetVisitReducer(visit, { type: "TREAT_FINISHED", id: "visit" }), visit);
});

test("soothing is available only after a successful treatment and its animation", () => {
  let visit = vetVisitReducer(ready(), { type: "TREAT", id: "visit" })!;
  visit = vetVisitReducer(visit, { type: "APPLIED", id: "visit" })!;
  assert.equal(visit.applied, true);
  assert.equal(vetStageDelay(visit), VET_TREAT_MS);
  assert.equal(vetVisitReducer(visit, { type: "SOOTHE", id: "visit" }), visit);
  visit = vetVisitReducer(visit, { type: "TREAT_FINISHED", id: "visit" })!;
  assert.equal(visit.stage, "soothe");
  assert.equal(vetStageDelay(visit), null);
  visit = vetVisitReducer(visit, { type: "SOOTHE", id: "visit" })!;
  assert.equal(visit.stage, "happy");
  assert.equal(vetStageDelay(visit), VET_HAPPY_MS);
  assert.equal(vetVisitReducer(visit, { type: "TREAT", id: "visit" }), visit);
});

test("failure permits retry; a committed treatment cannot be reverted for another charge", () => {
  const applying = vetVisitReducer(ready(), { type: "TREAT", id: "visit" })!;
  assert.equal(vetVisitReducer(applying, { type: "FAILED", id: "visit" })?.stage, "treat");
  const applied = vetVisitReducer(applying, { type: "APPLIED", id: "visit" })!;
  assert.equal(vetVisitReducer(applied, { type: "FAILED", id: "visit" }), applied);
  assert.equal(vetVisitReducer(applied, { type: "APPLIED", id: "visit" }), applied);
  assert.equal(vetVisitReducer(applied, { type: "START", id: "visit" }), applied);
});

test("stale async results cannot affect a closed or later visit", () => {
  assert.equal(vetVisitReducer(null, { type: "APPLIED", id: "visit" }), null);
  const next = vetVisitReducer(start(), { type: "START", id: "next" })!;
  assert.equal(vetVisitReducer(next, { type: "APPLIED", id: "visit" }), next);
  assert.equal(vetVisitReducer(next, { type: "CHECKED", id: "visit" }), next);
  assert.equal(vetVisitReducer(next, { type: "CLEAR" }), null);
});

test("treatment and soothe cannot skip the examination", () => {
  const visit = start();
  assert.equal(vetVisitReducer(visit, { type: "TREAT", id: "visit" }), visit);
  assert.equal(vetVisitReducer(visit, { type: "SOOTHE", id: "visit" }), visit);
  assert.equal(visit.applied, false);
});
