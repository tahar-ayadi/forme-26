
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:3000/vetements";

const TAILLES = ["XS", "S", "M", "L", "XL"];

function App() {
  const [vetements, setVetements] = useState([]);

  // PANIER
  const [panier, setPanier] = useState(() => {
    try {
      const sauvegarde = JSON.parse(
        localStorage.getItem("panier-forme26") || "[]"
      );

      return Array.isArray(sauvegarde) ? sauvegarde : [];
    } catch {
      return [];
    }
  });

  const [panierOuvert, setPanierOuvert] = useState(false);

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

  const [formulaire, setFormulaire] = useState({
    nom: "",
    prix: "",
    categorie: "",
    image_url: "",
  });

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
      // Un même vêtement en deux tailles différentes
      // correspond à deux variantes distinctes.
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
          ...vetement,
          taille,
          quantite: 1,
        },
      ];
    });

    // IMPORTANT :
    // On ferme uniquement l'aperçu du produit.
    // On n'ouvre PAS le panier automatiquement.
    fermerApercu();
  }

  // MODIFIER LA QUANTITÉ
  function modifierQuantite(id, taille, variation) {
    setPanier((ancienPanier) =>
      ancienPanier
        .map((article) =>
          String(article.id) === String(id) &&
          article.taille === taille
            ? {
                ...article,
                quantite: article.quantite + variation,
              }
            : article
        )
        .filter((article) => article.quantite > 0)
    );
  }

  // SUPPRIMER UNE VARIANTE DU PANIER
  function supprimerDuPanier(id, taille) {
    setPanier((ancienPanier) =>
      ancienPanier.filter(
        (article) =>
          !(
            String(article.id) === String(id) &&
            article.taille === taille
          )
      )
    );
  }

  // COMPTEUR DU PANIER
  const nombreArticles = panier.reduce(
    (total, article) =>
      total + Number(article.quantite || 0),
    0
  );

  // TOTAL
  const totalPanier = panier.reduce(
    (total, article) =>
      total +
      Number(article.prix || 0) *
        Number(article.quantite || 0),
    0
  );

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

      // Si le produit devient épuisé,
      // on le retire du panier.
      if (!resultat.disponible) {
        setPanier((ancienPanier) =>
          ancienPanier.filter(
            (article) =>
              String(article.id) !== String(vetement.id)
          )
        );

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
            <p className="surtitre">
              COLLECTION 2026
            </p>

            <h1>
              Les essentiels
              <br />
              qui changent tout.
            </h1>

            <p className="description">
              Des pièces pensées pour bouger, vivre et
              affirmer son style.
            </p>
          </section>

          <section className="collection">
            <div className="titre-collection">
              <h2>La sélection</h2>
              <p>{vetements.length} pièce(s)</p>
            </div>

            {vetements.length === 0 ? (
              <p className="message-vide">
                La collection arrive bientôt.
                Repasse nous voir !
              </p>
            ) : (
              <div className="grille">
                {vetements.map((vetement) => (
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
                        ? "Choisir ma taille +"
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
                    onClick={() =>
                      supprimerVetement(vetement.id)
                    }
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

            {panier.length === 0 ? (
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
                  {panier.map((article) => (
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
                  <div className="ligne-total">
                    <span>Sous-total</span>
                    <strong>
                      {totalPanier.toFixed(2)} €
                    </strong>
                  </div>

                  <p className="note-panier">
                    Frais de livraison non inclus.
                  </p>

                  <button
                    type="button"
                    className="bouton-commande"
                    onClick={() =>
                      alert(
                        "Le paiement n'est pas encore configuré sur cette boutique."
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
