/* Réglages communs aux pages fiche.html et enregistrement.html */
/* ===== RÉGLAGES ===== */
const CFG={
 TEST:false,        // true = le code s'affiche à l'écran (essai). false = envoi réel via ENVOI
 ENVOI:"https://mitantsoaagency.onrender.com/envoi",         // adresse de votre serveur qui envoie/vérifie le code (SMS ou e-mail)
 ENREG:"https://mitantsoaagency.onrender.com/enreg",         // (facultatif) adresse qui reçoit la demande enregistrée
 DOSSIER:"https://mitantsoaagency.onrender.com/dossier",   // adresse de votre serveur qui reçoit le dossier complet (bouton Envoyer)
 ACCUEIL:""        // adresse de la page d'accueil (vide = page précédente)
};
function home(){if(CFG.ACCUEIL)location.href=CFG.ACCUEIL;else if(history.length>1)history.back();else location.href="/"}
