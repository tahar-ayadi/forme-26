import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:3000/vetements";

function App() {
  const [vetements, setVetements] = useState([]);
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

  useEffect(() => {
    async function chargerVetements() {
      try {
        const reponse = await fetch(API_URL);

        if (!reponse.ok) {
          throw new Error("Le serveur n'a pas pu charger les vêtements.");
        }

        const donnees = await reponse.json();
        setVetements(donnees);
      } catch {
        setErreur("Impossible de joindre l'API. Vérifie que le serveur est démarré.");
      } finally {
        setChargement(false);
      }
    }

    chargerVetements();
  }, []);

  function modifierFormulaire(evenement) {
    const { name, value } = evenement.target;

    setFormulaire((formulaireActuel) => ({
      ...formulaireActuel,
      [name]: value,
    }));
  }

  async function ajouterVetement(evenement) {
    evenement.preventDefault();
    setActionEnCours(true);
    setMessageGerant("");

    try {
      const reponse = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formulaire,
          prix: Number(formulaire.prix),
          disponible: true,
        }),
      });

      const resultat = await reponse.json();

      if (!reponse.ok) {
        throw new Error(resultat.error || "L'ajout a échoué.");
      }

      setVetements((listeActuelle) => [...listeActuelle, resultat]);
      setFormulaire({ nom: "", prix: "", categorie: "", image_url: "" });
      setMessageGerant("Le vêtement a bien été ajouté.");
    } catch (erreurAjout) {
      setMessageGerant(erreurAjout.message);
    } finally {
      setActionEnCours(false);
    }
  }

  async function changerDisponibilite(vetement) {
    setActionEnCours(true);
    setMessageGerant("");

    try {
      const reponse = await fetch(`${API_URL}/${vetement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: vetement.nom,
          prix: Number(vetement.prix),
          categorie: vetement.categorie,
          image_url: vetement.image_url,
          disponible: !vetement.disponible,
        }),
      });

      const resultat = await reponse.json();

      if (!reponse.ok) {
        throw new Error(resultat.error || "La modification a échoué.");
      }

      setVetements((listeActuelle) =>
        listeActuelle.map((article) =>
          article.id === vetement.id ? resultat : article
        )
      );

      setMessageGerant("La disponibilité a été modifiée.");
    } catch (erreurModification) {
      setMessageGerant(erreurModification.message);
    } finally {
      setActionEnCours(false);
    }
  }

  async function supprimerVetement(id) {
    setActionEnCours(true);
    setMessageGerant("");

    try {
      const reponse = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!reponse.ok) {
        const resultat = await reponse.json();
        throw new Error(resultat.error || "La suppression a échoué.");
      }

      setVetements((listeActuelle) =>
        listeActuelle.filter((article) => article.id !== id)
      );

      setMessageGerant("Le vêtement a bien été supprimé.");
    } catch (erreurSuppression) {
      setMessageGerant(erreurSuppression.message);
    } finally {
      setActionEnCours(false);
    }
  }

  if (chargement) {
    return <p className="message-page">Chargement de la collection...</p>;
  }

  if (erreur) {
    return <p className="message-page message-erreur">{erreur}</p>;
  }

  return (
    <main>
      <header className="entete">
        <a className="logo" href="/" aria-label="Forme 26, accueil">
          FORME <span>26</span>
        </a>

        <p className="signature">LE STYLE EN MOUVEMENT</p>

        <nav className="navigation">
          <button
            className={page === "boutique" ? "actif" : ""}
            onClick={() => setPage("boutique")}
          >
            Boutique
          </button>
          <button
            className={page === "gerant" ? "actif" : ""}
            onClick={() => {
              setPage("gerant");
              setMessageGerant("");
            }}
          >
            Gérant
          </button>
        </nav>
      </header>

      {page === "boutique" ? (
        <>
          <section className="introduction">
            <p className="surtitre">COLLECTION 2026</p>
            <h1>Les essentiels<br />qui changent tout.</h1>
            <p className="description">
              Des pièces pensées pour bouger, vivre et affirmer son style.
            </p>
          </section>

          <section className="collection">
            <div className="titre-collection">
              <h2>La sélection</h2>
              <p>{vetements.length} pièce(s)</p>
            </div>

            {vetements.length === 0 ? (
              <p className="message-vide">
                La collection arrive bientôt. Repasse nous voir !
              </p>
            ) : (
              <div className="grille">
                {vetements.map((vetement) => (
                  <article
                    className={`carte ${vetement.disponible ? "" : "indisponible"}`}
                    key={vetement.id}
                  >
                    <div className="cadre-image">
                      <img src={vetement.image_url} alt={vetement.nom} />
                      {!vetement.disponible && (
                        <span className="badge-indisponible">ÉPUISÉ</span>
                      )}
                    </div>

                    <div className="infos-carte">
                      <div>
                        <p className="categorie">{vetement.categorie}</p>
                        <h3>{vetement.nom}</h3>
                      </div>
                      <p className="prix">
                        {Number(vetement.prix).toFixed(2)} €
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="gestion">
          <p className="surtitre">ESPACE ÉQUIPE</p>
          <h1>Gérer la collection</h1>
          <p className="description-gestion">
            Ajoute un vêtement ou modifie ceux de la boutique.
          </p>

          <form className="formulaire" onSubmit={ajouterVetement}>
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

            <button className="bouton-ajouter" disabled={actionEnCours}>
              Ajouter à la boutique
            </button>
          </form>

          {messageGerant && <p className="message-gerant">{messageGerant}</p>}

          <h2 className="titre-gerant">Vêtements enregistrés</h2>

          {vetements.length === 0 ? (
            <p>Aucun vêtement dans la collection.</p>
          ) : (
            <div className="liste-gerant">
              {vetements.map((vetement) => (
                <article className="ligne-gerant" key={vetement.id}>
                  <img src={vetement.image_url} alt="" />

                  <div className="details-gerant">
                    <h3>{vetement.nom}</h3>
                    <p>
                      {vetement.categorie} · {Number(vetement.prix).toFixed(2)} €
                    </p>
                    <p>
                      Statut : {vetement.disponible ? "Disponible" : "Épuisé"}
                    </p>
                  </div>

                  <button
                    className="bouton-secondaire"
                    onClick={() => changerDisponibilite(vetement)}
                    disabled={actionEnCours}
                  >
                    {vetement.disponible ? "Marquer épuisé" : "Rendre disponible"}
                  </button>

                  <button
                    className="bouton-supprimer"
                    onClick={() => supprimerVetement(vetement.id)}
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
    </main>
  );
}

export default App;