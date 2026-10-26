import { useCallback, useEffect, useRef, useState } from "react";

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const INTERACTION_WINDOW = 1500;
const REVEAL_COOLDOWN = 4000;

function isTextEntryTarget(target) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable
  );
}

export function useEasterEggs() {
  const [revelation, setRevelation] = useState(null);
  const sequenceRef = useRef([]);
  const sequenceTimerRef = useRef(null);
  const revealCooldownRef = useRef(false);
  const logoClicksRef = useRef([]);
  const logoTimerRef = useRef(null);
  const revealTimerRef = useRef(null);

  const reveal = useCallback((title, detail) => {
    if (revealCooldownRef.current) {
      return;
    }

    revealCooldownRef.current = true;
    setRevelation({ title, detail });
    window.clearTimeout(revealTimerRef.current);
    revealTimerRef.current = window.setTimeout(() => {
      setRevelation(null);
      revealCooldownRef.current = false;
    }, REVEAL_COOLDOWN);
  }, []);

  const handleLogoClick = useCallback(() => {
    const now = Date.now();
    const recentClicks = logoClicksRef.current.filter(
      (clickTime) => now - clickTime < INTERACTION_WINDOW
    );
    const nextClicks = [...recentClicks, now];

    logoClicksRef.current = nextClicks;
    window.clearTimeout(logoTimerRef.current);
    logoTimerRef.current = window.setTimeout(() => {
      logoClicksRef.current = [];
    }, INTERACTION_WINDOW);

    if (nextClicks.length >= 5) {
      logoClicksRef.current = [];
      reveal(
        "Détail d'atelier trouvé",
        "La Maison garde toujours une couture secrète pour les regards attentifs."
      );
    }
  }, [reveal]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setRevelation(null);
        revealCooldownRef.current = false;
        return;
      }

      if (isTextEntryTarget(event.target)) {
        return;
      }

      const expectedKey = KONAMI_SEQUENCE[sequenceRef.current.length];
      const pressedKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      if (pressedKey === expectedKey) {
        sequenceRef.current = [...sequenceRef.current, pressedKey];
        window.clearTimeout(sequenceTimerRef.current);
        sequenceTimerRef.current = window.setTimeout(() => {
          sequenceRef.current = [];
        }, INTERACTION_WINDOW);

        if (sequenceRef.current.length === KONAMI_SEQUENCE.length) {
          sequenceRef.current = [];
          reveal(
            "Atelier secret ouvert",
            "Une pièce invisible se dessine pour celles et ceux qui connaissent le mouvement."
          );
        }
        return;
      }

      sequenceRef.current = pressedKey === KONAMI_SEQUENCE[0] ? [pressedKey] : [];
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(sequenceTimerRef.current);
      window.clearTimeout(logoTimerRef.current);
      window.clearTimeout(revealTimerRef.current);
    };
  }, [reveal]);

  return {
    revelation,
    handleLogoClick,
    closeRevelation: () => {
      setRevelation(null);
      revealCooldownRef.current = false;
    },
    showCopyConfirmation: () =>
      reveal(
        "Code en poche",
        "TRAAC25 est prêt. Une petite attention pour commencer le mouvement."
      ),
  };
}
