import { useEffect, useState } from "react";
import "./App.css";
import {
  EasterEggToast,
} from "./components/EasterEggs";
import { useEasterEggs } from "./components/useEasterEggs";

// VITE_API_URL prime ; sinon API locale en dev et API Render en production.
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:3000"
    : "https://maison-traac.onrender.com");
const API_URL = `${API_BASE_URL.replace(/\/+$/, "")}/vetements`;

const TAILLES = ["XS", "S", "M", "L", "XL"];

// Mots de la catégorie qui classent un article dans « Accessoires » (ex. « Femme – sac »)
const MOTS_ACCESSOIRES = ["accessoire", "sac"];

// Le panier ne garde que la référence ; prix, nom et image viennent du catalogue.
function lirePanierSauvegarde() {
  try {
    const sauvegarde = JSON.parse(
      localStorage.getItem("panier-forme26") || "[]"
    );

    if (!Array.isArray(sauvegarde)) {
      return [];
    }

    return sauvegarde
      .filter(
        (article) =>
          article &&
          (typeof article.id === "number" ||
            typeof article.id === "string") &&
          TAILLES.includes(article.taille) &&
          Number.isInteger(article.quantite) &&
          article.quantite > 0
      )
      .map(({ id, taille, quantite }) => ({ id, taille, quantite }));
  } catch {
    return [];
  }
}

function App() {
  const [vetements, setVetements] = useState([]);
  const {
    revelation,
    handleLogoClick,
    closeRevelation,
    showCopyConfirmation,
  } = useEasterEggs();

  // PANIER
  const [panier, setPanier] = useState(lirePanierSauvegarde);

  const [panierOuvert, setPanierOuvert] = useState(false);

  // CODE PROMO DE BIENVENUE
  const [codePromo, setCodePromo] = useState("");
  const [promoApplique, setPromoApplique] = useState(false);
  const [messagePromo, setMessagePromo] = useState("");
  const [codeCopie, setCodeCopie] = useState(false);

  // APERÇU DU PRODUIT
  const [produitSelectionne, setProduitSelectionne] = useState(null);
  const [tailleSelectionnee, setTailleSelectionnee] = useState("");
  const [messageProduit, setMessageProduit] = useState("");

  // BOUTIQUE ET GÉRANT
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [page, setPage] = useState("boutique");
  const [messageGerant, setMessageGerant] = useState("");
  const [actionEnCours, setActionEnCours] = useState(false);

  // FILTRE ET RECHERCHE (HOMME / FEMME & TYPES)
  const [recherche, setRecherche] = useState("");
  const [genreFiltre, setGenreFiltre] = useState("Tous");
  const [typeFiltre, setTypeFiltre] = useState("Tous");

  // Les 3 premières pièces disponibles, mises en avant dans l'introduction
  const vetementsHero = vetements
    .filter((v) => v.disponible && v.image_url)
    .slice(0, 3);

  const vetementsFiltres = vetements.filter((v) => {
    const texte = `${v.nom} ${v.categorie}`.toLowerCase();

    // Filtre de genre
    const matchGenre =
      genreFiltre === "Tous" ||
      (genreFiltre === "Homme" && texte.includes("homme")) ||
      (genreFiltre === "Femme" && texte.includes("femme"));

    // Filtre de type de produit
    const estChaussure = texte.includes("chaussure");
    const estAccessoire = MOTS_ACCESSOIRES.some((mot) => texte.includes(mot));

    const matchType =
      typeFiltre === "Tous" ||
      (typeFiltre === "Chaussures" && estChaussure) ||
      (typeFiltre === "Accessoires" && estAccessoire) ||
      (typeFiltre === "Vêtements" && !estChaussure && !estAccessoire);

    // Filtre par texte de recherche
    const matchNom = v.nom.toLowerCase().includes(recherche.toLowerCase());

    return matchGenre && matchType && matchNom;
  });

  const [formulaire, setFormulaire] = useState({
    nom: "",
    prix: "",
    categorie: "",
    image_url: "",
    description: "",
  });

  // Retirer la réduction lorsque le panier est vide
  useEffect(() => {
    if (panier.length === 0) {
      const resetPromo = window.setTimeout(() => {
        setPromoApplique(false);
        setMessagePromo("");
      }, 0);

      return () => window.clearTimeout(resetPromo);
    }

    return undefined;
  }, [panier.length]);

  // SAUVEGARDE DU PANIER
  useEffect(() => {
    localStorage.setItem(
      "panier-forme26",
      JSON.stringify(panier)
    );
  }, [panier]);

  // CHARGEMENT DES VÊTEMENTS
  useEffect(() => {
    async function chargerVetements() {
      try {
        const reponse = await fetch(API_URL);

        if (!reponse.ok) {
          throw new Error(
            "Le serveur n'a pas pu charger les vêtements."
          );
        }

        const donnees = await reponse.json();
        setVetements(donnees);

        // Retirer du panier les articles supprimés ou épuisés depuis la dernière visite
        setPanier((ancienPanier) =>
          ancienPanier.filter((article) =>
            donnees.some(
              (vetement) =>
                String(vetement.id) === String(article.id) &&
                vetement.disponible
            )
          )
        );
      } catch {
        setErreur(
          "Impossible de joindre l'API. Vérifie que le serveur est démarré."
        );
      } finally {
        setChargement(false);
      }
    }

    chargerVetements();
  }, []);

  // OUVRIR L'APERÇU D'UN VÊTEMENT
  function ouvrirApercu(vetement) {
    setProduitSelectionne(vetement);
    setTailleSelectionnee("");
    setMessageProduit("");
  }

  function fermerApercu() {
    setProduitSelectionne(null);
    setTailleSelectionnee("");
    setMessageProduit("");
  }

  // AJOUTER UN ARTICLE AU PANIER AVEC SA TAILLE
  function ajouterAuPanier(vetement, taille) {
    if (!vetement.disponible) {
      setMessageProduit("Cet article est indisponible.");
      return;
    }

    if (!taille) {
      setMessageProduit(
        "Choisis une taille avant de continuer."
      );
      return;
    }

    setPanier((ancienPanier) => {
      const articleExistant = ancienPanier.find(
        (article) =>
          String(article.id) === String(vetement.id) &&
          article.taille === taille
      );

      if (articleExistant) {
        return ancienPanier.map((article) =>
          String(article.id) === String(vetement.id) &&
          article.taille === taille
            ? {
                ...article,
                quantite: article.quantite + 1,
              }
            : article
        );
      }

      return [
        ...ancienPanier,
        {
          id: vetement.id,
          taille,
          quantite: 1,
        },
      ];
    });

    fermerApercu();
  }

  // MODIFIER LA QUANTITÉ
  function modifierQuantite(id, taille, variation) {
    const panierMisAJour = panier
      .map((article) =>
        String(article.id) === String(id) &&
        article.taille === taille
          ? {
              ...article,
              quantite: article.quantite + variation,
            }
          : article
      )
      .filter((article) => article.quantite > 0);

    setPanier(panierMisAJour);
    if (panierMisAJour.length === 0) {
      setPromoApplique(false);
      setMessagePromo("");
    }
  }

  // SUPPRIMER UNE VARIANTE DU PANIER
  function supprimerDuPanier(id, taille) {
    const panierMisAJour = panier.filter(
      (article) =>
        !(
          String(article.id) === String(id) &&
          article.taille === taille
        )
      );

    setPanier(panierMisAJour);
    if (panierMisAJour.length === 0) {
      setPromoApplique(false);
      setMessagePromo("");
    }
  }

  // ARTICLES DU PANIER AVEC LES DONNÉES À JOUR DU CATALOGUE
  const articlesPanier = panier.flatMap((article) => {
    const vetement = vetements.find(
      (v) => String(v.id) === String(article.id)
    );

    return vetement?.disponible
      ? [{ ...vetement, taille: article.taille, quantite: article.quantite }]
      : [];
  });

  // COMPTEUR DU PANIER
  const nombreArticles = articlesPanier.reduce(
    (total, article) =>
      total + Number(article.quantite || 0),
    0
  );

  // TOTAL
  const totalPanier = articlesPanier.reduce(
    (total, article) =>
      total +
      Number(article.prix || 0) *
        Number(article.quantite || 0),
    0
  );

  const montantReduction = promoApplique ? totalPanier * 0.25 : 0;
  const totalAvecReduction = Math.max(0, totalPanier - montantReduction);

  function appliquerCodePromo(evenement) {
    evenement.preventDefault();
    if (codePromo.trim().toUpperCase() === "TRAAC25") {
      setPromoApplique(true);
      setCodePromo("TRAAC25");
      setMessagePromo("Code TRAAC25 appliqué : -25 % sur ton panier !");
    } else {
      setPromoApplique(false);
      setMessagePromo("Ce code promo n'est pas valide.");
    }
  }

  async function copierCodePromo() {
    try {
      await navigator.clipboard.writeText("TRAAC25");
      setCodeCopie(true);
      showCopyConfirmation();
      window.setTimeout(() => setCodeCopie(false), 1800);
    } catch {
      setCodePromo("TRAAC25");
      setMessagePromo("Code TRAAC25 prêt à être copié.");
    }
  }

  // FORMULAIRE GÉRANT
  function modifierFormulaire(evenement) {
    const { name, value } = evenement.target;

    setFormulaire((formulaireActuel) => ({
      ...formulaireActuel,
      [name]: value,
    }));
  }

  // AJOUTER UN VÊTEMENT À LA BOUTIQUE
  async function ajouterVetement(evenement) {
    evenement.preventDefault();
    setActionEnCours(true);
    setMessageGerant("");

    try {
      const reponse = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formulaire,
          prix: Number(formulaire.prix),
          disponible: true,
        }),
      });

      const resultat = await reponse.json();

      if (!reponse.ok) {
        throw new Error(
          resultat.error || "L'ajout a échoué."
        );
      }

      setVetements((listeActuelle) => [
        ...listeActuelle,
        resultat,
      ]);

      setFormulaire({
        nom: "",
        prix: "",
        categorie: "",
        image_url: "",
        description: "",
      });

      setMessageGerant(
        "Le vêtement a bien été ajouté."
      );
    } catch (erreurAjout) {
      setMessageGerant(erreurAjout.message);
    } finally {
      setActionEnCours(false);
    }
  }

  // MODIFIER LA DISPONIBILITÉ
  async function changerDisponibilite(vetement) {
    setActionEnCours(true);
    setMessageGerant("");

    try {
      const reponse = await fetch(
        `${API_URL}/${vetement.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nom: vetement.nom,
            prix: Number(vetement.prix),
            categorie: vetement.categorie,
            image_url: vetement.image_url,
            disponible: !vetement.disponible,
          }),
        }
      );

      const resultat = await reponse.json();

      if (!reponse.ok) {
        throw new Error(
          resultat.error || "La modification a échoué."
        );
      }

      setVetements((listeActuelle) =>
        listeActuelle.map((article) =>
          String(article.id) === String(vetement.id)
            ? resultat
            : article
        )
      );

      if (!resultat.disponible) {
        const panierMisAJour = panier.filter(
          (article) =>
            String(article.id) !== String(vetement.id)
        );
        setPanier(panierMisAJour);
        if (panierMisAJour.length === 0) {
          setPromoApplique(false);
          setMessagePromo("");
        }

        if (
          String(produitSelectionne?.id) ===
          String(vetement.id)
        ) {
          fermerApercu();
        }
      }

      setMessageGerant(
        "La disponibilité a été modifiée."
      );
    } catch (erreurModification) {
      setMessageGerant(erreurModification.message);
    } finally {
      setActionEnCours(false);
    }
  }

  // SUPPRIMER UN VÊTEMENT
  async function supprimerVetement(id) {
    setActionEnCours(true);
    setMessageGerant("");

    try {
      const reponse = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!reponse.ok) {
        const resultat = await reponse.json();

        throw new Error(
          resultat.error || "La suppression a échoué."
        );
      }

      setVetements((listeActuelle) =>
        listeActuelle.filter(
          (article) => String(article.id) !== String(id)
        )
      );

      setPanier((ancienPanier) =>
        ancienPanier.filter(
          (article) => String(article.id) !== String(id)
        )
      );

      if (
        String(produitSelectionne?.id) === String(id)
      ) {
        fermerApercu();
      }

      setMessageGerant(
        "Le vêtement a bien été supprimé."
      );
    } catch (erreurSuppression) {
      setMessageGerant(erreurSuppression.message);
    } finally {
      setActionEnCours(false);
    }
  }

  // FERMER LES FENÊTRES AVEC ÉCHAP
  useEffect(() => {
    function gererToucheClavier(evenement) {
      if (evenement.key === "Escape") {
        fermerApercu();
        setPanierOuvert(false);
      }
    }

    window.addEventListener(
      "keydown",
      gererToucheClavier
    );

    return () => {
      window.removeEventListener(
        "keydown",
        gererToucheClavier
      );
    };
  }, []);

  if (chargement) {
    return (
      <p className="message-page">
        Chargement de la collection...
      </p>
    );
  }

  if (erreur) {
    return (
      <p className="message-page message-erreur">
        {erreur}
      </p>
    );
  }

  return (
    <main>
      {/* OFFRE DE BIENVENUE ANIMÉE */}
      <section className="bandeau-bienvenue" aria-label="Offre de bienvenue">
        <div className="bandeau-defilement" aria-hidden="true">
          <span>OFFRE DE BIENVENUE</span>
          <span className="bandeau-separateur">✦</span>
          <span>-25 % SUR TA PREMIÈRE COMMANDE</span>
          <span className="bandeau-separateur">✦</span>
          <span>CODE PROMO : TRAAC25</span>
          <span className="bandeau-separateur">✦</span>
          <span>OFFRE DE BIENVENUE</span>
          <span className="bandeau-separateur">✦</span>
          <span>-25 % SUR TA PREMIÈRE COMMANDE</span>
          <span className="bandeau-separateur">✦</span>
          <span>CODE PROMO : TRAAC25</span>
          <span className="bandeau-separateur">✦</span>
        </div>
        <div className="bandeau-action">
          <span>BIENVENUE CHEZ MAISON TRAAC — -25 %</span>
          <button type="button" onClick={copierCodePromo} aria-label="Copier le code promo TRAAC25">
            {codeCopie ? "CODE COPIÉ ✓" : "TRAAC25 · COPIER"}
          </button>
        </div>
      </section>

      {/* =====================================
          EN-TÊTE
      ====================================== */}
      <header className="entete">
        <a
          className="logo logo-maison"
          href="/"
          aria-label="Maison TRAAC, accueil"
          onClick={(e) => {
            e.preventDefault();
            setPage("boutique");
          }}
          onClickCapture={handleLogoClick}
        >
          <span className="logo-maison-texte">Maison</span>
          <span className="logo-traac">TRAAC</span>
        </a>

        <p className="signature">
          LE STYLE EN MOUVEMENT
        </p>

        <nav className="navigation">
          <button
            className={
              page === "boutique" ? "actif" : ""
            }
            onClick={() => setPage("boutique")}
          >
            Boutique
          </button>

          <button
            className={
              page === "gerant" ? "actif" : ""
            }
            onClick={() => {
              setPage("gerant");
              setMessageGerant("");
            }}
          >
            Gérant
          </button>

          <button
            type="button"
            className={`bouton-panier ${
              panierOuvert ? "actif" : ""
            }`}
            onClick={() =>
              setPanierOuvert(!panierOuvert)
            }
          >
            <span aria-hidden="true">🛍</span>
            Panier
            <span className="compteur-panier">
              {nombreArticles}
            </span>
          </button>
        </nav>
      </header>

      {/* =====================================
          BOUTIQUE
      ====================================== */}
      {page === "boutique" ? (
        <>
          <section className="introduction">
            <div className="hero-texte">
              <p className="surtitre">
                COLLECTION 2026 · HOMME &amp; FEMME
              </p>

              <h1>
                Les essentiels
                <br />
                <span className="hero-accent">
                  qui changent tout.
                </span>
              </h1>

              <p className="description">
                Des pièces pensées pour bouger, vivre et
                affirmer son style. Des coupes nettes, des
                matières qui durent, du matin au soir.
              </p>

              <div className="hero-actions">
                <a className="hero-bouton" href="#selection">
                  Découvrir la sélection ↓
                </a>

                <button
                  type="button"
                  className="hero-bouton hero-bouton-secondaire"
                  onClick={copierCodePromo}
                >
                  {codeCopie
                    ? "Code TRAAC25 copié ✓"
                    : "−25 % avec TRAAC25"}
                </button>
              </div>

              <ul className="hero-atouts">
                <li>{vetements.length} pièces Homme &amp; Femme</li>
                <li>
                  Tailles {TAILLES[0]} à {TAILLES[TAILLES.length - 1]}
                </li>
                <li>−25 % sur ta première commande</li>
              </ul>
            </div>

            {/* 3 pièces disponibles du catalogue : un clic ouvre l'aperçu */}
            {vetementsHero.length > 0 && (
              <div className="hero-visuels">
                {vetementsHero.map((vetement) => (
                  <button
                    key={vetement.id}
                    type="button"
                    className="hero-visuel"
                    onClick={() => ouvrirApercu(vetement)}
                    aria-label={`Voir ${vetement.nom}`}
                  >
                    <img src={vetement.image_url} alt="" />
                    <span className="hero-prix">
                      {Number(vetement.prix).toFixed(2)} €
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="collection" id="selection">
            <div className="titre-collection">
              <h2>La sélection</h2>
              <p>{vetementsFiltres.length} pièce(s)</p>
            </div>

            {/* BARRE DE RECHERCHE ET NOUVEAUX FILTRES */}
            <div className="zone-filtres">
              <input
                type="text"
                placeholder="Rechercher un modèle..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="champ-recherche"
              />

              <div className="groupes-filtres">
                {/* Filtre Genre */}
                <div className="boutons-filtres">
                  {["Tous", "Homme", "Femme"].map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      className={`bouton-filtre ${genreFiltre === genre ? "actif" : ""}`}
                      onClick={() => setGenreFiltre(genre)}
                    >
                      {genre}
                    </button>
                  ))}
                </div>

                {/* Filtre Type d'article */}
                <div className="boutons-filtres">
                  {["Tous", "Vêtements", "Accessoires", "Chaussures"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`bouton-filtre ${typeFiltre === type ? "actif" : ""}`}
                      onClick={() => setTypeFiltre(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {vetementsFiltres.length === 0 ? (
              <p className="message-vide">
                Aucun vêtement ne correspond à ta recherche.
              </p>
            ) : (
              <div className="grille">
                {vetementsFiltres.map((vetement) => (
                  <article
                    className={`carte ${
                      vetement.disponible
                        ? ""
                        : "indisponible"
                    }`}
                    key={vetement.id}
                  >
                    {/* Cliquer sur l'image ouvre l'aperçu */}
                    <button
                      type="button"
                      className="image-produit-cliquable"
                      onClick={() =>
                        ouvrirApercu(vetement)
                      }
                      aria-label={`Voir ${vetement.nom}`}
                    >
                      <div className="cadre-image">
                        <img
                          src={vetement.image_url}
                          alt={vetement.nom}
                        />

                        {!vetement.disponible && (
                          <span className="badge-indisponible">
                            ÉPUISÉ
                          </span>
                        )}

                        {vetement.disponible && (
                          <span className="etiquette-apercu">
                            VOIR LE PRODUIT ↗
                          </span>
                        )}
                      </div>
                    </button>

                    <div className="infos-carte">
                      <button
                        type="button"
                        className="nom-produit-cliquable"
                        onClick={() =>
                          ouvrirApercu(vetement)
                        }
                      >
                        <span className="categorie">
                          {vetement.categorie}
                        </span>
                        <h3>{vetement.nom}</h3>
                      </button>

                      <p className="prix">
                        {Number(vetement.prix).toFixed(2)} €
                      </p>
                    </div>

                    <button
                      type="button"
                      className="bouton-ajouter"
                      disabled={!vetement.disponible}
                      onClick={() =>
                        ouvrirApercu(vetement)
                      }
                    >
                      {vetement.disponible
                        ? "Choisir ma taille "
                        : "Indisponible"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        /* =====================================
            ESPACE GÉRANT
        ====================================== */
        <section className="gestion">
          <p className="surtitre">ESPACE ÉQUIPE</p>

          <h1>Gérer la collection</h1>

          <p className="description-gestion">
            Ajoute un vêtement ou modifie ceux de la
            boutique.
          </p>

          <form
            className="formulaire"
            onSubmit={ajouterVetement}
          >
            <label>
              Nom du vêtement
              <input
                name="nom"
                value={formulaire.nom}
                onChange={modifierFormulaire}
                placeholder="Ex. Veste oversize"
                required
              />
            </label>

            <label>
              Prix en euros
              <input
                name="prix"
                type="number"
                min="0"
                step="0.01"
                value={formulaire.prix}
                onChange={modifierFormulaire}
                placeholder="Ex. 79.99"
                required
              />
            </label>

            <label>
              Catégorie
              <input
                name="categorie"
                value={formulaire.categorie}
                onChange={modifierFormulaire}
                placeholder="Ex. Femme - veste"
                required
              />
            </label>

            <label>
              Adresse de l’image
              <input
                name="image_url"
                type="url"
                value={formulaire.image_url}
                onChange={modifierFormulaire}
                placeholder="https://..."
                required
              />
            </label>

            <label className="champ-description">
              Description (facultative)
              <textarea
                name="description"
                value={formulaire.description}
                onChange={modifierFormulaire}
                placeholder="Matière, coupe, conseils pour la porter..."
                maxLength={2000}
                rows={4}
              />
            </label>

            <button
              className="bouton-ajouter"
              disabled={actionEnCours}
            >
              {actionEnCours
                ? "Enregistrement..."
                : "Ajouter à la boutique"}
            </button>
          </form>

          {messageGerant && (
            <p className="message-gerant">
              {messageGerant}
            </p>
          )}

          <h2 className="titre-gerant">
            Vêtements enregistrés
          </h2>

          {vetements.length === 0 ? (
            <p>Aucun vêtement dans la collection.</p>
          ) : (
            <div className="liste-gerant">
              {vetements.map((vetement) => (
                <article
                  className="ligne-gerant"
                  key={vetement.id}
                >
                  <img
                    src={vetement.image_url}
                    alt=""
                  />

                  <div className="details-gerant">
                    <h3>{vetement.nom}</h3>

                    <p>
                      {vetement.categorie} ·{" "}
                      {Number(vetement.prix).toFixed(2)} €
                    </p>

                    <p>
                      Statut :{" "}
                      {vetement.disponible
                        ? "Disponible"
                        : "Épuisé"}
                    </p>
                  </div>

                  <button
                    className="bouton-secondaire"
                    onClick={() =>
                      changerDisponibilite(vetement)
                    }
                    disabled={actionEnCours}
                  >
                    {vetement.disponible
                      ? "Marquer épuisé"
                      : "Rendre disponible"}
                  </button>

                  <button
                    className="bouton-supprimer"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Supprimer « ${vetement.nom} » de la collection ?`
                        )
                      ) {
                        supprimerVetement(vetement.id);
                      }
                    }}
                    disabled={actionEnCours}
                  >
                    Supprimer
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =====================================
          APERÇU DU PRODUIT
      ====================================== */}
      {produitSelectionne && (
        <div
          className="fond-apercu"
          onMouseDown={(evenement) => {
            if (evenement.target === evenement.currentTarget) {
              fermerApercu();
            }
          }}
        >
          <section
            className="fenetre-apercu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titre-apercu"
          >
            <button
              type="button"
              className="fermer-apercu"
              onClick={fermerApercu}
              aria-label="Fermer l'aperçu"
            >
              ×
            </button>

            <div className="apercu-image">
              <img
                src={produitSelectionne.image_url}
                alt={produitSelectionne.nom}
              />

              {!produitSelectionne.disponible && (
                <span className="badge-indisponible">
                  ÉPUISÉ
                </span>
              )}
            </div>

            <div className="apercu-informations">
              <p className="surtitre">
                {produitSelectionne.categorie ||
                  "COLLECTION MAISON TRAAC"}
              </p>

              <h2 id="titre-apercu">
                {produitSelectionne.nom}
              </h2>

              <p className="prix-apercu">
                {Number(
                  produitSelectionne.prix
                ).toFixed(2)}{" "}
                €
              </p>

              <div className="description-produit">
                <h3>Description</h3>

                <p>
                  {produitSelectionne.description ||
                    `Découvre ${produitSelectionne.nom}, une pièce de la collection Maison TRAAC pensée pour associer confort, style et liberté de mouvement. Un essentiel facile à porter au quotidien.`}
                </p>
              </div>

              <div className="choix-tailles">
                <div className="titre-tailles">
                  <h3>Choisis ta taille</h3>
                  <span>
                    {tailleSelectionnee
                      ? `Taille ${tailleSelectionnee}`
                      : "Taille obligatoire"}
                  </span>
                </div>

                <div
                  className="grille-tailles"
                  role="group"
                  aria-label="Choisir une taille"
                >
                  {TAILLES.map((taille) => (
                    <button
                      key={taille}
                      type="button"
                      className={
                        tailleSelectionnee === taille
                          ? "taille-selectionnee"
                          : ""
                      }
                      aria-pressed={
                        tailleSelectionnee === taille
                      }
                      onClick={() => {
                        setTailleSelectionnee(taille);
                        setMessageProduit("");
                      }}
                    >
                      {taille}
                    </button>
                  ))}
                </div>
              </div>

              {messageProduit && (
                <p className="message-produit">
                  {messageProduit}
                </p>
              )}

              <button
                type="button"
                className="bouton-ajouter bouton-ajouter-apercu"
                disabled={!produitSelectionne.disponible}
                onClick={() =>
                  ajouterAuPanier(
                    produitSelectionne,
                    tailleSelectionnee
                  )
                }
              >
                {produitSelectionne.disponible
                  ? "Ajouter au panier →"
                  : "Article indisponible"}
              </button>
              
            </div>
          </section>
        </div>
      )}

      {/* =====================================
          PANNEAU PANIER
      ====================================== */}
      {panierOuvert && (
        <>
          <button
            type="button"
            className="fond-panier"
            aria-label="Fermer le panier"
            onClick={() => setPanierOuvert(false)}
          />

          <aside
            className="panneau-panier"
            aria-label="Mon panier"
          >
            <div className="entete-panier">
              <div>
                <p className="surtitre">MAISON TRAAC</p>
                <h2>Mon panier</h2>
                <p>{nombreArticles} article(s)</p>
              </div>

              <button
                type="button"
                className="fermer-panier"
                onClick={() => setPanierOuvert(false)}
                aria-label="Fermer le panier"
              >
                ×
              </button>
            </div>

            {articlesPanier.length === 0 ? (
              <div className="panier-vide">
                <p className="icone-panier-vide">🛍</p>
                <h3>Ton panier est vide</h3>
                <p>
                  Découvre la collection et trouve tes
                  essentiels.
                </p>

                <button
                  type="button"
                  className="bouton-ajouter"
                  onClick={() => setPanierOuvert(false)}
                >
                  Continuer mes achats
                </button>
              </div>
            ) : (
              <>
                <div className="contenu-panier">
                  {articlesPanier.map((article) => (
                    <article
                      className="article-panier"
                      key={`${article.id}-${article.taille}`}
                    >
                      <img
                        src={article.image_url}
                        alt={article.nom}
                      />

                      <div className="details-panier">
                        <h3>{article.nom}</h3>

                        <p className="categorie">
                          {article.categorie}
                        </p>

                        <p className="taille-dans-panier">
                          Taille :{" "}
                          <strong>
                            {article.taille || "Non définie"}
                          </strong>
                        </p>

                        <p className="prix-panier">
                          {Number(article.prix).toFixed(2)} €
                        </p>

                        <div className="quantite-panier">
                          <button
                            type="button"
                            onClick={() =>
                              modifierQuantite(
                                article.id,
                                article.taille,
                                -1
                              )
                            }
                            aria-label="Diminuer la quantité"
                          >
                            −
                          </button>

                          <span>{article.quantite}</span>

                          <button
                            type="button"
                            onClick={() =>
                              modifierQuantite(
                                article.id,
                                article.taille,
                                1
                              )
                            }
                            aria-label="Augmenter la quantité"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="supprimer-panier"
                        onClick={() =>
                          supprimerDuPanier(
                            article.id,
                            article.taille
                          )
                        }
                        aria-label={`Supprimer ${article.nom}, taille ${article.taille}`}
                      >
                        ×
                      </button>
                    </article>
                  ))}
                </div>

                <div className="bas-panier">
                  <form className="formulaire-promo" onSubmit={appliquerCodePromo}>
                    <label htmlFor="code-promo">Code promo</label>
                    <div className="champ-promo">
                      <input
                        id="code-promo"
                        type="text"
                        value={codePromo}
                        onChange={(e) => {
                          setCodePromo(e.target.value);
                          setMessagePromo("");
                        }}
                        placeholder="Entre TRAAC25"
                        autoComplete="off"
                        aria-label="Code promo"
                      />
                      <button type="submit" disabled={promoApplique}>
                        {promoApplique ? "APPLIQUÉ" : "APPLIQUER"}
                      </button>
                    </div>
                    {messagePromo && (
                      <p className={`message-promo ${promoApplique ? "promo-valide" : "promo-invalide"}`}>
                        {messagePromo}
                      </p>
                    )}
                  </form>

                  <div className="ligne-total ligne-sous-total">
                    <span>Sous-total</span>
                    <strong>{totalPanier.toFixed(2)} €</strong>
                  </div>

                  {promoApplique && (
                    <div className="ligne-total ligne-reduction">
                      <span>Réduction TRAAC25 (−25 %)</span>
                      <strong>−{montantReduction.toFixed(2)} €</strong>
                    </div>
                  )}

                  <div className="ligne-total total-final">
                    <span>Total</span>
                    <strong>{totalAvecReduction.toFixed(2)} €</strong>
                  </div>

                  <p className="note-panier">
                    Frais de livraison non inclus.
                  </p>

                  <button
                    type="button"
                    className="bouton-commande"
                    onClick={() =>
                      window.open(
                        "https://youtu.be/dQw4w9WgXcQ?list=RDdQw4w9WgXcQ",
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    Passer la commande →
                  </button>

                  <button
                    type="button"
                    className="continuer-achats"
                    onClick={() => setPanierOuvert(false)}
                  >
                    Continuer mes achats
                  </button>
                </div>
              </>
            )}
          </aside>
        </>
      )}

      <EasterEggToast
        revelation={revelation}
        onClose={closeRevelation}
      />

      {/* PIED DE PAGE — MAISON TRAAC */}
      <footer className="footer-signature">
        <span className="footer-logo">
          Maison <strong>TRAAC</strong>
        </span>
        <p className="footer-slogan">LE STYLE EN MOUVEMENT</p>
        <span className="copyright">© 2026 — TOUS DROITS RÉSERVÉS</span>
      </footer>
    </main>
  );
}

export default App;