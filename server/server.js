import "dotenv/config";
import express from "express";
import cors from "cors";
import { supabase } from "./supabaseClient.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
}));

app.use(express.json());

app.get("/vetements", async (req, res) => {
  const { data, error } = await supabase
    .from("vetements")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Erreur Supabase :", error.message);
    return res.status(500).json({ error: "Impossible de récupérer les vêtements." });
  }

  return res.status(200).json(data);
});

app.post("/vetements", async (req, res) => {
  const {
    nom,
    prix,
    categorie,
    image_url,
    disponible = true,
  } = req.body ?? {};

  const prixNumerique = Number(prix);

  const champsInvalides =
    typeof nom !== "string" ||
    nom.trim() === "" ||
    prix === "" ||
    prix === null ||
    prix === undefined ||
    !Number.isFinite(prixNumerique) ||
    prixNumerique < 0 ||
    typeof categorie !== "string" ||
    categorie.trim() === "" ||
    typeof image_url !== "string" ||
    image_url.trim() === "" ||
    typeof disponible !== "boolean";

  if (champsInvalides) {
    return res.status(400).json({
      error: "Nom, prix positif ou nul, catégorie et image sont obligatoires.",
    });
  }

  const { data, error } = await supabase
    .from("vetements")
    .insert({
      nom: nom.trim(),
      prix: prixNumerique,
      categorie: categorie.trim(),
      image_url: image_url.trim(),
      disponible,
    })
    .select()
    .single();

  if (error) {
    console.error("Erreur Supabase :", error.message);
    return res.status(500).json({ error: "Impossible d'ajouter le vêtement." });
  }

  return res.status(201).json(data);
});

app.put("/vetements/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(404).json({ error: "Vêtement introuvable." });
  }

  const {
    nom,
    prix,
    categorie,
    image_url,
    disponible,
  } = req.body ?? {};

  const prixNumerique = Number(prix);

  const champsInvalides =
    typeof nom !== "string" ||
    nom.trim() === "" ||
    prix === "" ||
    prix === null ||
    prix === undefined ||
    !Number.isFinite(prixNumerique) ||
    prixNumerique < 0 ||
    typeof categorie !== "string" ||
    categorie.trim() === "" ||
    typeof image_url !== "string" ||
    image_url.trim() === "" ||
    typeof disponible !== "boolean";

  if (champsInvalides) {
    return res.status(400).json({
      error: "Nom, prix positif ou nul, catégorie, image et disponibilité sont obligatoires.",
    });
  }

  const { data, error } = await supabase
    .from("vetements")
    .update({
      nom: nom.trim(),
      prix: prixNumerique,
      categorie: categorie.trim(),
      image_url: image_url.trim(),
      disponible,
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Erreur Supabase :", error.message);
    return res.status(500).json({ error: "Impossible de modifier le vêtement." });
  }

  if (!data) {
    return res.status(404).json({ error: "Vêtement introuvable." });
  }

  return res.status(200).json(data);
});

app.delete("/vetements/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(404).json({ error: "Vêtement introuvable." });
  }

  const { data, error } = await supabase
    .from("vetements")
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Erreur Supabase :", error.message);
    return res.status(500).json({ error: "Impossible de supprimer le vêtement." });
  }

  if (!data) {
    return res.status(404).json({ error: "Vêtement introuvable." });
  }

  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`API FORME 26 démarrée sur http://localhost:${PORT}`);
});

