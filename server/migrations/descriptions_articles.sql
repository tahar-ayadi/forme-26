ALTER TABLE vetements
ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

UPDATE vetements
SET description = CASE nom
  WHEN 'Veste urbaine' THEN 'Une veste au tissu structuré qui donne une belle tenue à la silhouette. Son style urbain se porte facilement au quotidien, ouverte sur un t-shirt ou fermée quand il fait frais.'
  WHEN 'Hoodie noir essentiel' THEN 'Confectionné dans une maille molletonnée douce, ce hoodie noir apporte confort et chaleur. Sa coupe décontractée en fait une pièce facile à associer avec un jean ou un pantalon de jogging.'
  WHEN 'Jean TRF wide leg taille basse' THEN 'Réalisé en denim, ce jean associe une taille basse à une coupe wide leg ample. Sa toile apporte une allure authentique et se porte aussi bien avec un haut ajusté qu’avec une chemise.'
  WHEN 'Sac porté épaule effet relief' THEN 'Sa matière texturée à effet relief apporte du caractère à ce sac porté épaule. Pratique au quotidien, il complète aussi bien une tenue simple qu’un look plus habillé.'
  WHEN 'Foulard à carreaux et franges' THEN 'Confectionné dans un textile léger et agréable à porter, ce foulard présente un motif à carreaux et des franges. Il se noue autour du cou ou se porte sur les épaules pour ajouter une touche de couleur.'
  WHEN 'Robe courte en maille avec ceinture' THEN 'Sa maille souple accompagne les mouvements et rend cette robe agréable à porter. La ceinture souligne la taille tandis que sa longueur courte lui donne une allure facile à porter en journée comme en soirée.'
  WHEN 'Mocassins chic à masque' THEN 'Leur matière à finition lisse et leur masque décoratif donnent à ces mocassins une allure soignée. Ils s’accordent facilement avec un pantalon habillé comme avec une tenue plus décontractée.'
  WHEN 'Chemise boxy fit inscription brodée' THEN 'Confectionnée dans un tissu souple, cette chemise présente une coupe boxy décontractée et une inscription brodée. Portez-la ouverte sur un t-shirt ou boutonnée avec un pantalon.'
  WHEN 'Blouson matelassé bimatière' THEN 'Son matelassage apporte du relief et une sensation de confort, tandis que l’association de deux matières crée un contraste visuel. Ce blouson complète facilement une tenue de saison.'
  WHEN 'T-shirt basique heavyweight blanc' THEN 'Confectionné en jersey épais heavyweight, ce t-shirt blanc offre un tombé plus structuré qu’un modèle léger. Sa coupe simple en fait une base facile à porter seule ou sous une veste.'
END
WHERE nom IN (
  'Veste urbaine',
  'Hoodie noir essentiel',
  'Jean TRF wide leg taille basse',
  'Sac porté épaule effet relief',
  'Foulard à carreaux et franges',
  'Robe courte en maille avec ceinture',
  'Mocassins chic à masque',
  'Chemise boxy fit inscription brodée',
  'Blouson matelassé bimatière',
  'T-shirt basique heavyweight blanc'
);
