import test from "node:test";
import assert from "node:assert/strict";
import { validateVetementPayload } from "./validation.js";

const validPayload = {
  nom: "Veste",
  prix: 79.99,
  categorie: "Femme - veste",
  image_url: "https://example.com/veste.jpg",
  disponible: true,
};

test("accepts a valid vetement payload and normalizes text", () => {
  const result = validateVetementPayload({
    ...validPayload,
    nom: "  Veste  ",
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.value, {
    ...validPayload,
    nom: "Veste",
  });
});

test("rejects invalid prices, booleans, and image protocols", () => {
  for (const payload of [
    { ...validPayload, prix: Number.NaN },
    { ...validPayload, prix: -1 },
    { ...validPayload, disponible: "true" },
    { ...validPayload, image_url: "javascript:alert(1)" },
  ]) {
    assert.equal(validateVetementPayload(payload).valid, false);
  }
});

test("keeps description optional and trims it when provided", () => {
  assert.equal(
    "description" in validateVetementPayload(validPayload).value,
    false
  );

  const result = validateVetementPayload({
    ...validPayload,
    description: "  Coupe ample.  ",
  });

  assert.equal(result.valid, true);
  assert.equal(result.value.description, "Coupe ample.");
});

test("rejects non-string and overlong descriptions", () => {
  for (const description of [42, null, "x".repeat(2001)]) {
    assert.equal(
      validateVetementPayload({ ...validPayload, description }).valid,
      false
    );
  }
});

test("rejects blank and overlong text", () => {
  assert.equal(
    validateVetementPayload({ ...validPayload, nom: " " }).valid,
    false
  );
  assert.equal(
    validateVetementPayload({ ...validPayload, categorie: "x".repeat(201) }).valid,
    false
  );
});
