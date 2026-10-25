/* Étape « Votre lettre de demande » (situation de la personne) + rappel du Cerfa n° 16301. À charger APRÈS poles.js et AVANT fiche.js */
(()=>{
const F=document.querySelector("#f"),T=t=>[...document.querySelectorAll(".step")].find(s=>s.dataset.t==t);
const LIEN="https://www.formulaires.service-public.gouv.fr/gf/cerfa_16301.do";
T("Signature et validation").insertAdjacentHTML("beforebegin",`<section class="step" data-t="Votre lettre de demande"><h2>Votre lettre de demande</h2>
<p class="sub">La lettre est préremplie avec vos informations. Expliquez simplement pourquoi vous faites appel à nous : toute situation est légitime (âge, santé, handicap, emploi du temps chargé, isolement…).</p>
<span class="f">Votre situation <em>*</em></span><div class="chips sq" data-n="lt_sit" data-t="checkbox" data-v="Vieillissement / perte d’autonomie|Maladie ou handicap|Retour d’hospitalisation / convalescence|Manque de temps (travail, famille)|Proche aidant fatigué|Isolement|Déménagement ou arrivée récente|Autre situation" data-r></div>
<label class="f" style="margin-top:14px">Expliquez votre situation avec vos mots <em>*</em><textarea name="lt_texte" rows="5" maxlength="900" required></textarea></label>
<div class="g" style="margin-top:14px"><label class="f">Depuis quand ?<input type="text" name="lt_depuis" placeholder="ex : depuis 3 mois"></label><label class="f">Ce que vous attendez de l’agence<input type="text" name="lt_attente"></label></div>
<p class="expl" id="cerfa-note"></p></section>`);
const age=()=>{const v=F.naissance.value;if(!v)return 0;const b=new Date(v),n=new Date();let a=n.getFullYear()-b.getFullYear();if(n<new Date(n.getFullYear(),b.getMonth(),b.getDate()))a--;return a};
const cerfa=()=>age()>=60||[...F.querySelectorAll("input[name=lt_sit]:checked")].some(x=>/Vieillissement/.test(x.value));
const maj=()=>{document.querySelector("#cerfa-note").innerHTML=cerfa()
 ?`<b>Formulaire officiel à remplir :</b> Cerfa n° 16301*01 « Demande d’aides à l’autonomie à domicile pour les personnes âgées » (APA / accompagnement à domicile de la caisse de retraite). <a href="${LIEN}" target="_blank" rel="noopener">Ouvrir le formulaire</a>. Remplissez-le, puis joignez-en une copie à la fin de cette demande. Le dossier officiel s’envoie à votre caisse de retraite ou à votre département : l’agence peut vous aider à le constituer.`
 :`Le Cerfa n° 16301 concerne les personnes âgées (60 ans et plus) qui demandent l’APA ou l’accompagnement à domicile d’une caisse de retraite. Il n’est pas nécessaire dans votre situation, sauf si vous souhaitez faire cette demande : <a href="${LIEN}" target="_blank" rel="noopener">formulaire officiel</a>.`};
F.addEventListener("change",maj);F.addEventListener("input",maj);maj();
const old=window.collecterDemande;
window.collecterDemande=()=>{const r=old(),fd=new FormData(F);
 r.k=(F.querySelector("input[name=aide]:checked")||{}).value;
 r.lt={sit:fd.getAll("lt_sit"),texte:fd.get("lt_texte")||"",depuis:fd.get("lt_depuis")||"",attente:fd.get("lt_attente")||""};
 r.cerfa=cerfa();return r};
})();
