const MAX_TEXT_LENGTH = 200;
const MAX_IMAGE_URL_LENGTH = 2048;
const MAX_DESCRIPTION_LENGTH = 2000;

function isHttpUrl(value) {
  if (typeof value !== "string" || value.length > MAX_IMAGE_URL_LENGTH) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateVetementPayload(payload) {
  const {
    nom,
    prix,
    categorie,
    image_url: imageUrl,
    disponible,
    description,
  } = payload ?? {};

  const prixNumerique = Number(prix);
  const champsInvalides =
    typeof nom !== "string" ||
    nom.trim() === "" ||
    nom.trim().length > MAX_TEXT_LENGTH ||
    prix === "" ||
    prix === null ||
    prix === undefined ||
    !Number.isFinite(prixNumerique) ||
    prixNumerique < 0 ||
    typeof categorie !== "string" ||
    categorie.trim() === "" ||
    categorie.trim().length > MAX_TEXT_LENGTH ||
    !isHttpUrl(imageUrl) ||
    typeof disponible !== "boolean" ||
    (description !== undefined &&
      (typeof description !== "string" ||
        description.trim().length > MAX_DESCRIPTION_LENGTH));

  if (champsInvalides) {
    return {
      valid: false,
      error:
        "Nom et catégorie non vides (200 caractères max), prix positif ou nul, image HTTP(S) et disponibilité booléenne sont obligatoires. La description est facultative (2000 caractères max).",
    };
  }

  const value = {
    nom: nom.trim(),
    prix: prixNumerique,
    categorie: categorie.trim(),
    image_url: imageUrl.trim(),
    disponible,
  };

  // Description absente : on garde celle déjà enregistrée (ou la valeur par défaut à l'insertion)
  if (description !== undefined) {
    value.description = description.trim();
  }

  return { valid: true, value };
}
