import "dotenv/config";
import express from "express";
import cors from "cors";
import { supabase } from "./supabaseClient.js";
import { validateVetementPayload } from "./validation.js";

const app = express();
const PORT = process.env.PORT || 3000;
// Adresses autorisées à appeler l'API, séparées par des virgules
// (ex. "https://maison-traac.netlify.app,http://localhost:5173").
// Le "/" final est retiré : le navigateur envoie l'origine sans.
const FRONTEND_ORIGIN = (
  process.env.FRONTEND_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((origine) => origine.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const PUBLIC_VETEMENT_COLUMNS =
  "id, nom, prix, categorie, image_url, disponible, description";

app.disable("x-powered-by");
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  next();
});

app.use(express.json({ limit: "100kb" }));

app.get("/vetements", async (req, res) => {
  const { data, error } = await supabase
    .from("vetements")
    .select(PUBLIC_VETEMENT_COLUMNS)
    .order("id", { ascending: true });

  if (error) {
    console.error("Erreur Supabase :", error.message);
    return res.status(500).json({ error: "Impossible de récupérer les vêtements." });
  }

  return res.status(200).json(data);
});

app.post("/vetements", async (req, res) => {
  const validation = validateVetementPayload({
    ...req.body,
    disponible: req.body?.disponible ?? true,
  });

  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const { data, error } = await supabase
    .from("vetements")
    .insert(validation.value)
    .select(PUBLIC_VETEMENT_COLUMNS)
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

  const validation = validateVetementPayload(req.body);

  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const { data, error } = await supabase
    .from("vetements")
    .update(validation.value)
    .eq("id", id)
    .select(PUBLIC_VETEMENT_COLUMNS)
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
    .select("id")
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

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ error: "Le corps JSON est malformé." });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: "La requête est trop volumineuse." });
  }

  console.error("Erreur serveur inattendue :", error.message);
  return res.status(500).json({ error: "Une erreur interne est survenue." });
});

app.listen(PORT, () => {
  console.log(`API FORME 26 démarrée sur http://localhost:${PORT}`);
});
