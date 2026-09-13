/* LE SEUL FICHIER À OUVRIR pour changer le contenu.
   Les chiffres, le déroulé, les notes de l'orateur, le rythme.

   Tout vient de sources/brief-seminaire.md. Aucun chiffre n'est écrit en dur
   dans index.html : si une valeur bouge, elle bouge ici et nulle part ailleurs.

   Vingt-six écrans, et volontairement peu de chiffres affichés : le brief
   demandait un chiffre par idée, pas un tableau de bord. Ce qui n'est pas à
   l'écran est dans les notes, et c'est l'orateur qui le dit. */

/* 'presenter' : on avance au clic, chaque étape révèle un élément.
   'auto'      : tout se déroule à l'horloge, pour un écran d'accueil. */
var MODE = 'presenter';

/* Multiplie toutes les durées. 1.3 ralentit tout de 30 %. */
var TEMPO = 1;

/* Ouvrir les notes de l'orateur au chargement. Utile pour répéter. */
var NOTES_AT_START = false;

/* Durée visée en minutes : 45 de contenu, 15 de questions. Pilote le minuteur. */
var TARGET_MINUTES = 60;

/* ══════════════ LES CHIFFRES ══════════════
   Arrêtés au 31 août 2026. Source : brief-seminaire.md. */
var DATA = {

  activite: { clients: 2400, ticket: 12000, jours: 47 },

  /* Le montant financé chaque mois, en M€, sur douze mois glissants.
     Les barres portent le propos ; une seule valeur est écrite à l'écran. */
  production: {
    mois: ['sept.', 'oct.', 'nov.', 'déc.', 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août'],
    valeurs: [7.4, 8.1, 8.8, 9.6, 9.0, 10.4, 12.1, 13.6, 15.9, 18.2, 19.4, 22.0],
    aout: 22
  },

  /* Les clients par région, posés sur la carte. Les coordonnées sont celles de
     la préfecture ; la bulle est proportionnelle, aucun chiffre n'est écrit. */
  regions: [
    { nom: 'Île-de-France',   lon: 2.35,  lat: 48.86, clients: 520 },
    { nom: 'Rhône',           lon: 4.84,  lat: 45.76, clients: 350 },
    { nom: 'Provence',        lon: 5.37,  lat: 43.30, clients: 230 },
    { nom: 'Gironde',         lon: -0.58, lat: 44.84, clients: 210 },
    { nom: 'Occitanie',       lon: 1.44,  lat: 43.60, clients: 190 },
    { nom: 'Hauts-de-France', lon: 3.06,  lat: 50.63, clients: 175 },
    { nom: 'Pays de la Loire',lon: -1.55, lat: 47.22, clients: 160 },
    { nom: 'Grand Est',       lon: 7.75,  lat: 48.58, clients: 145 },
    { nom: 'Bretagne',        lon: -1.68, lat: 48.11, clients: 120 },
    { nom: 'Bourgogne',       lon: 5.04,  lat: 47.32, clients: 110 },
    { nom: 'Normandie',       lon: 1.10,  lat: 49.44, clients: 95 },
    { nom: 'Centre',          lon: 1.90,  lat: 47.90, clients: 95 }
  ],

  /* Le tunnel de souscription, en part des demandes reçues. Les pertes
     descendent, le flux principal continue. Un seul chiffre écrit : le bout. */
  funnel: {
    etapes: [
      { nom: 'Demandes reçues',    valeur: 100 },
      { nom: 'Dossiers complets',  valeur: 72, perte: 'Abandon en route' },
      { nom: 'Accordés',           valeur: 58, perte: 'Refusés' },
      { nom: 'Financés',           valeur: 54, perte: 'Jamais tirés' }
    ]
  },

  /* Le risque : le message numéro un de la matinée. */
  qualite: { defaut: 0.9, defautAvant: 1.6 },

  /* Le marché. */
  marche: {
    bce: 4.6, bceAvant: 3.9,
    bceCourbe: [3.9, 4.0, 4.15, 4.25, 4.4, 4.55, 4.6]
  },

  /* La concurrence. Deux acteurs, deux menaces, un seul chiffre. */
  trame: { commission: 1.9 },

  /* Ce que rapporte et ce que coûte un dossier de 12 000 € sur 47 jours. */
  dossier: {
    commission: 372, commissionTaux: 3.1,
    risque: 108, refi: 71, service: 58, marge: 135
  },
  dossier2027: { marge: 212 },

  /* Le point d'équilibre. Le seul chiffre que tout le monde doit retenir. */
  equilibre: { dossiers: 5500 },

  /* D'où viennent les clients, aujourd'hui et en cible. */
  mix: {
    canaux: [
      { nom: 'Partenariats', ton: 'c1' },
      { nom: 'Direct',       ton: 'c2' },
      { nom: 'Courtiers',    ton: 'c3' },
      { nom: 'Parrainage',   ton: 'c4' }
    ],
    aujourdhui: [38, 34, 20, 8],
    cible: [55, 25, 12, 8]
  },

  /* Le moteur de risque v3. */
  risqueV3: { defaut: 0.6, defautAvant: 0.9 },

  /* Le chemin jusqu'à l'équilibre. Seules les deux bornes sont chiffrées. */
  trajectoire: [
    { nom: 'août 2026',  valeur: 1833, ton: 'nous',  muet: false },
    { nom: 'déc. 2026',  valeur: 2400, ton: 'nous',  muet: true },
    { nom: 'juin 2027',  valeur: 3800, ton: 'cible', muet: true },
    { nom: 'déc. 2027',  valeur: 5500, ton: 'cible', muet: false }
  ],

  nonChoix: ['Pas d’international.', 'Pas de compte de paiement.', 'Pas de carte.'],

  squads: [
    { nom: 'Financement',  quoi: 'ce que le client voit' },
    { nom: 'Risque',       quoi: 'décider, recouvrer' },
    { nom: 'Distribution', quoi: 'l’API, les partenaires' },
    { nom: 'Plateforme',   quoi: 'le socle commun' }
  ]
};

/* ══════════════ LE DÉROULÉ ══════════════ */
var SLIDES = [

  { id: 'opening', title: 'Ouverture', chapter: 'Ouverture',
    steps: [400], seconds: 25,
    notes: 'Ne pas lire le titre. Bonjour, on est 85, c’est la quatrième rentrée.\n'
         + 'La journée : plénière jusqu’à 10 h 45, ateliers par squad, déjeuner,\n'
         + 'le chantier stock en grand groupe à 14 h, clôture à 16 h.\n'
         + 'Une heure ici : 45 minutes et on garde le quart d’heure de questions.' },

  { id: 'promesse', title: 'Trois choses', chapter: 'Ouverture',
    steps: [400, 1500, 2800, 4100], seconds: 75,
    notes: 'Annoncer les trois messages, puis les tenir dans l’ordre.\n'
         + 'Un : on a doublé et la machine tient. Deux : le marché s’est durci.\n'
         + 'Trois : on sait ce qui nous mène à l’équilibre. Ne pas développer ici.' },

/* ─────────── OÙ NOUS EN SOMMES ─────────── */

  { id: 'chapitre-bilan', title: 'Où nous en sommes', chapter: 'Où nous en sommes',
    steps: [400], seconds: 15,
    notes: 'Respirer. Changement de sujet.' },

  { id: 'production', title: 'Ce qu’on finance', chapter: 'Où nous en sommes',
    steps: [500, 1800, 3200], seconds: 120,
    notes: 'Commencer par la production, c’est le chiffre qui parle à tout le monde.\n'
         + 'Laisser les barres monter avant de parler. 9 M€ en janvier, 22 en août.\n'
         + 'Le point : ce n’est pas un pic, c’est huit mois de suite.\n'
         + 'Depuis 2022 : 390 M€ passés dans la trésorerie de vraies entreprises.' },

  { id: 'carte', title: 'La carte', chapter: 'Où nous en sommes',
    steps: [500, 1600, 3000, 4600], seconds: 150,
    notes: 'On ne l’avait jamais montrée. Laisser le contour se tracer, puis les\n'
         + 'bulles arriver : une par région, proportionnelle au nombre de clients.\n'
         + '2 400 PME actives contre 1 100 il y a un an. Un tiers en Île-de-France,\n'
         + 'et c’est notre angle mort : la moitié des départements est vide.\n'
         + 'Ne pas commenter chaque bulle, laisser la salle regarder.' },

  { id: 'sankey', title: 'Le tunnel', chapter: 'Où nous en sommes',
    steps: [500, 1800, 3200, 4600, 6000], seconds: 180,
    notes: 'Le tunnel de souscription en entier, de la demande au virement.\n'
         + 'Étape par étape, en disant où part chaque perte.\n'
         + 'Sur 100 demandes : 28 abandonnent avant d’avoir un dossier complet,\n'
         + '14 sont refusées, 4 accordés ne tirent jamais l’argent.\n'
         + 'Reste 54. Le gros de la perte est au début, pas à la décision :\n'
         + 'c’est un sujet produit, pas un sujet risque. La décision, elle, tombe\n'
         + 'en 4 heures et 92 % des dossiers passent sans personne dessus.' },

  { id: 'defaut', title: 'Le défaut', chapter: 'Où nous en sommes',
    steps: [400, 1500, 2700], seconds: 120,
    notes: 'Le taux de défaut passe de 1,6 % à 0,9 %. Marquer un temps d’arrêt ici.\n'
         + 'On a doublé le volume ET baissé le risque, dans un marché où les\n'
         + 'défaillances d’entreprises augmentent de 14 %. C’est le vrai exploit\n'
         + 'de l’année, et personne dans la boîte ne s’en rend compte.' },

  { id: 'video', title: 'Atelier Ferré', chapter: 'Où nous en sommes',
    steps: [400], seconds: 15,
    notes: 'BASCULER SUR LA VIDÉO : Atelier Ferré, le menuisier de Nantes, 2 minutes.\n'
         + 'Ne rien dire par-dessus. Reprendre la parole sur le marché.' },

/* ─────────── LE MARCHÉ A BOUGÉ ─────────── */

  { id: 'chapitre-marche', title: 'Le marché a bougé', chapter: 'Le marché',
    steps: [400], seconds: 15,
    notes: 'Changement de ton. On passe de ce qu’on maîtrise à ce qu’on subit.' },

  { id: 'taux', title: 'Le coût de l’argent', chapter: 'Le marché',
    steps: [500, 2200, 3600], seconds: 130,
    notes: 'La BCE est passée de 3,9 % à 4,6 % en un an. C’est le prix auquel on\n'
         + 'emprunte l’argent qu’on prête. Notre marge commerciale n’a pas bougé,\n'
         + 'c’est le coût en face qui monte : 1,1 M€ de plus sur l’année, à volume\n'
         + 'égal. Important pour les commerciaux : on ne leur demande pas de vendre\n'
         + 'plus cher, on leur dit pourquoi on ne vendra pas moins cher.' },

  { id: 'concurrence', title: 'Les deux menaces', chapter: 'Le marché',
    steps: [400, 1500, 2800], seconds: 140,
    notes: 'Deux menaces, de natures différentes.\n'
         + 'Trame a levé 40 M€ en juin et affiche 1,9 % contre nos 3,1 %.\n'
         + 'Ils achètent de la part de marché avec l’argent de leurs investisseurs.\n'
         + 'Novéa, la filiale du groupe bancaire, s’est lancée en mars, trois mois\n'
         + 'offerts, distribution par les agences. On ne les croise pas encore dans\n'
         + 'nos dossiers perdus. Ça ne durera pas, et leur force c’est la distribution.' },

  { id: 'alignement', title: 'On ne s’aligne pas', chapter: 'Le marché',
    steps: [400, 1600], seconds: 90,
    notes: 'La question va venir : est-ce qu’on baisse nos prix ? Non.\n'
         + 'À 1,9 %, avec nos coûts d’aujourd’hui, chaque dossier nous ferait perdre\n'
         + 'neuf euros. La démonstration arrive tout de suite après.\n'
         + 'Poser la réponse ici, ne pas la justifier encore.\n'
         + 'Et la bonne nouvelle : le délai de paiement moyen reste à 51 jours.\n'
         + 'Le problème qu’on résout ne disparaît pas.' },

/* ─────────── L’ÉQUATION ─────────── */

  { id: 'equation', title: 'L’équation', chapter: 'L’équation',
    steps: [400, 1400, 2500, 3600, 4700, 6000], seconds: 220,
    notes: 'La partie que je veux que tout le monde comprenne, pas seulement la\n'
         + 'finance. Un dossier moyen : 12 000 € sur 47 jours. Quatre termes.\n'
         + 'La commission, 372 €, c’est le seul terme positif.\n'
         + 'Le risque, 108 € : pas une provision comptable, de l’argent qui ne\n'
         + 'revient pas. C’était 192 € l’an dernier.\n'
         + 'Le refinancement, 71 € : la BCE de tout à l’heure, ramenée à un dossier.\n'
         + 'Le service, 58 € : les 8 % de dossiers regardés à la main, le support,\n'
         + 'le recouvrement, les machines. C’est là que la tech agit.\n'
         + 'Reste 135 €. Au prix de Trame, la commission tombe à 228 € et la marge\n'
         + 'devient négative de neuf euros. Ce n’est pas une posture, c’est une\n'
         + 'soustraction. Dérouler lentement, terme par terme.' },

  { id: 'equilibre', title: 'L’équilibre', chapter: 'L’équation',
    steps: [400, 1600, 2900], seconds: 130,
    notes: 'La maison coûte 816 000 € par mois à faire tourner, à 85 personnes,\n'
         + 'et ça ne dépend pas du nombre de dossiers. Donc l’équilibre tient en un\n'
         + 'chiffre : 5 500 dossiers par mois. On en fait trois fois moins.\n'
         + 'C’est le seul chiffre à retenir de la matinée. Laisser le silence après.' },

  { id: 'pause', title: 'Pause', chapter: 'L’équation',
    steps: [400, 1200], seconds: 15,
    notes: 'Cinq minutes. Annoncer l’heure de reprise à voix haute.' },

/* ─────────── LES TROIS PARIS ─────────── */

  { id: 'chapitre-paris', title: 'Les trois paris', chapter: 'Les trois paris',
    steps: [400], seconds: 15,
    notes: 'La deuxième moitié. À partir d’ici, tout le monde doit savoir dans quel\n'
         + 'pari il joue.' },

  { id: 'paris', title: 'Les trois, ensemble', chapter: 'Les trois paris',
    steps: [400, 1300, 2300, 3300], seconds: 130,
    notes: 'Les trois d’un coup, puis on les reprend.\n'
         + 'Le stock : financer ce que nos clients achètent, pas seulement ce qu’ils\n'
         + 'facturent. Le marché est environ quatre fois l’affacturage sur le même\n'
         + 'portefeuille. Livraison visée au deuxième trimestre 2027, après le moteur.\n'
         + 'L’API : aller là où les PME sont déjà, dans leur outil comptable.\n'
         + 'Le moteur v3 : il rend les deux autres possibles, le dire tout de suite.' },

  { id: 'api-mix', title: 'Le mix', chapter: 'Les trois paris',
    steps: [400, 1500, 4200, 5600], seconds: 150,
    notes: 'Laisser l’anneau se construire avant de parler : c’est d’où viennent les\n'
         + 'clients aujourd’hui. Les partenariats en portent 38 %.\n'
         + 'Trois éditeurs de comptabilité identifiés, deux discussions avancées,\n'
         + 'rien de signé, donc pas de noms.\n'
         + 'Puis faire basculer l’anneau : 55 % en cible. Le direct ne baisse pas en\n'
         + 'volume, il baisse en part. C’est une addition, pas un remplacement.' },

  { id: 'risque-v3', title: 'Le moteur', chapter: 'Les trois paris',
    steps: [400, 1600, 2900], seconds: 110,
    notes: 'Le moteur de risque v3 : décider plus vite et se tromper moins, les deux\n'
         + 'à la fois. 0,9 % de défaut aujourd’hui, 0,6 % visés, pendant que\n'
         + 'l’automatisation passe de 92 à 98 %. C’est ce qui rend le pari difficile,\n'
         + 'et c’est ce qui rend le financement de stock envisageable.' },

  { id: 'marge-2027', title: 'La marge en 2027', chapter: 'Les trois paris',
    steps: [400, 1600, 3000], seconds: 120,
    notes: 'Ce que les trois paris font à l’équation : 135 € aujourd’hui, 212 € en\n'
         + 'cible. Le risque baisse de 108 à 72 €, le service de 58 à 30 € grâce à\n'
         + 'l’automatisation, le refinancement de 71 à 58 € grâce au fonds de dette.\n'
         + 'La commission, elle, ne bouge pas. Personne ne vend plus cher.' },

  { id: 'trajectoire', title: 'Le chemin', chapter: 'Les trois paris',
    steps: [500, 1800, 3000, 4200], seconds: 140,
    notes: 'Le chemin en dossiers par mois : 1 833 aujourd’hui, 5 500 fin 2027.\n'
         + 'Quinze mois, trois fois plus. Les deux barres en pointillés ne sont pas\n'
         + 'encore arrivées, c’est voulu.\n'
         + 'Ce n’est pas une courbe d’investisseur, c’est le plan sur lequel les\n'
         + 'quatre squads s’engagent cet après-midi.' },

  { id: 'non-choix', title: 'Ce qu’on ne fait pas', chapter: 'Les trois paris',
    steps: [400, 1400, 2400, 3400], seconds: 100,
    notes: 'La question revient à chaque séminaire, alors je la prends avant qu’elle\n'
         + 'ne vienne. Pas d’international, pas de compte de paiement, pas de carte.\n'
         + 'On finance, c’est tout. Dire que c’est un choix, pas un renoncement.' },

/* ─────────── L’ORGANISATION ─────────── */

  { id: 'chapitre-orga', title: 'L’organisation', chapter: 'L’organisation',
    steps: [400], seconds: 15,
    notes: 'Le vrai changement de l’année pour les équipes. Prendre le temps.' },

  { id: 'squads', title: 'Quatre squads', chapter: 'L’organisation',
    steps: [400, 1300, 2200, 3100, 4000], seconds: 150,
    notes: 'Quatre squads produit à partir de janvier. Chacune porte un bout des\n'
         + 'trois paris, et une seule métrique.\n'
         + 'Les affectations sortent vendredi, personne ne les découvre ici.\n'
         + 'On sera 85 aujourd’hui, 120 fin 2027, avec douze personnes à Lyon en\n'
         + 'janvier, opérations et support : un deuxième bassin de recrutement,\n'
         + 'pas une délocalisation.\n'
         + 'Et le comité crédit du mardi s’ouvre à tous : je veux que les gens du\n'
         + 'produit voient de vrais dossiers. La WBR du lundi ne change pas.' },

  { id: 'merci', title: 'Merci', chapter: 'L’organisation',
    steps: [400, 1400], seconds: 45,
    notes: 'Finir sur l’équipe, pas sur un tableau de chiffres.\n'
         + 'Dire un mot des départs de l’année, sans en faire un sujet.\n'
         + 'Deux phrases, puis se taire et laisser venir la première question.' },

  { id: 'questions', title: 'Questions', chapter: 'Questions',
    steps: [400], seconds: 10,
    notes: 'Quinze minutes. Rester debout, ne pas se rasseoir.' }
];
