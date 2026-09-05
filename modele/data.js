/* LE SEUL FICHIER À OUVRIR pour changer le contenu.
   Chiffres, déroulé, notes de l'orateur, rythme. */

/* 'presentateur' : on avance au clic, chaque pas révèle un élément.
   'auto'         : tout se déroule seul, comme une vidéo. */
var MODE = 'presentateur';

/* Multiplie toutes les durées et tous les délais. 1.3 ralentit de 30 %. */
var TEMPO = 1;

/* Notes de l'orateur ouvertes au démarrage. */
var NOTES_AU_DEPART = false;

/* Durée visée, en minutes. Sert au minuteur, rien d'autre. */
var DUREE_VISEE = 40;

/* Les chiffres. Un seul endroit, pour que rien ne diverge. */
var DATA = {
  marche:  { part: 96, base: 400, seuil: 0.75 },
  courbe:  { serie: [232, 268, 285, 321, 359, 402, 470, 538, 617, 708,
                     795, 848, 905, 991, 1078, 1154, 1230], debut: 2009 },
  clients: { total: 12480, hebdo: 540 }
};

/* Le déroulé. L'ordre ici est l'ordre de lecture.
     id       identifiant de la <section> dans index.html
     titre    ce qu'affiche le sommaire
     chapitre regroupe les écrans dans le sommaire, facultatif
     pas      un délai en ms par étape, en mode auto ; sa longueur
              donne le nombre de clics en mode présentateur
     duree    secondes à l'écran en mode auto
     notes    ce que dit l'orateur */
var ECRANS = [
  { id: 'ouverture', titre: 'Ouverture', chapitre: 'Introduction',
    pas: [400], duree: 8,
    notes: 'Poser le sujet en une phrase. Ne pas lire le titre à voix haute.' },

  { id: 'contexte', titre: 'Le marché', chapitre: 'Introduction',
    pas: [600, 2000, 3400], duree: 18,
    notes: 'Le chiffre clé est le 96 %. Laisser la grille se remplir avant de parler.\n'
         + 'Question fréquente : d’où vient la donnée ? Réponse : INSEE, décembre.' },

  { id: 'croissance', titre: 'La croissance', chapitre: 'Le constat',
    pas: [400, 2600], duree: 16,
    notes: 'Laisser la courbe se tracer avant de parler. Le point à retenir est la pente,\n'
         + 'pas le niveau. Source : INSEE, série annuelle des créations.' },

  { id: 'resultat', titre: 'Le résultat', chapitre: 'Le constat',
    pas: [300, 2400], duree: 14,
    notes: 'Annoncer le total avant qu’il finisse de défiler, sinon on attend le compteur.' },

  { id: 'fin', titre: 'Conclusion', chapitre: 'Conclusion',
    pas: [400, 1400], duree: 10,
    notes: 'Deux phrases, puis se taire et laisser la question venir.' }
];
