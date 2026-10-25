/* Pôles d'activité : choix du pôle et de l'aide, formulaire adapté à chaque aide, documents, message */
(()=>{
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
const FQ=["Ponctuelle","1 à 2 fois par semaine","3 à 5 fois par semaine","Tous les jours"],MO=["Matin","Midi","Après-midi","Soir","Week-end"];
const POLES={
med:{t:"Accompagnement médico-social",d:"Aide au quotidien, soins de confort et soutien des proches, à domicile.",aides:{
 dom:{t:"Aide à domicile",d:"Accompagnement dans les gestes du quotidien (entretien du logement, courses, préparation des repas, aide à la mobilité) pour préserver l’autonomie à la maison.",c:[
  ["c","taches","Tâches souhaitées",["Ménage","Courses","Préparation des repas","Aide au lever / coucher","Aide à la mobilité","Accompagnement aux sorties","Entretien du linge"]],
  ["r","freq","Fréquence souhaitée",FQ],["c","moments","Moments de la journée",MO],["n","heures","Heures souhaitées par semaine"],["d","debut","Date de début souhaitée"]]},
 soig:{t:"Aide-soignant·e",d:"Soins d’hygiène et de confort, surveillance de l’état de santé et coordination avec les professionnels de santé impliqués dans le suivi.",c:[
  ["c","soins","Soins souhaités",["Toilette et confort","Nursing","Soins palliatifs","Prise en charge de la douleur","Coordination médicale"]],
  ["r","presc","Une prescription médicale existe-t-elle ?",["Oui","Non","Je ne sais pas"]],["t","pros","Professionnels de santé impliqués (médecin, infirmier, kiné…)"],
  ["r","freq","Fréquence souhaitée",FQ],["c","moments","Moments de la journée",MO],["d","debut","Date de début souhaitée"]]},
 fam:{t:"Accompagnement de familles",d:"Écoute, orientation et soutien aux proches aidants, qui portent souvent seuls la charge mentale d’une situation difficile.",c:[
  ["c","besoins","Votre besoin",["Écoute","Orientation des aidants","Répit","Soutien moral"]],["t","aide","Qui est la personne que vous aidez ? (lien, situation)"],
  ["r","duree","Depuis combien de temps êtes-vous aidant ?",["Moins de 6 mois","6 mois à 2 ans","Plus de 2 ans"]],
  ["r","contact","Mode d’échange souhaité",["Par téléphone","À mon domicile","Par e-mail","En visioconférence"]],["t","dispo","Vos disponibilités (jours, horaires)"]]}}},
adm:{t:"Accompagnement administratif",d:"Aide pour vos dossiers, courriers et démarches, en ligne ou sur place.",aides:{
 adm:{t:"Aide administrative",d:"Constitution et suivi de dossiers, correspondance avec les organismes, classement et mise à jour des documents importants.",c:[
  ["c","dossiers","Dossiers concernés",["Dossiers CAF / CPAM","Retraite","Impôts","Classement de documents","Courriers"]],
  ["c","action","Ce que vous souhaitez que l’agence fasse",["Constituer le dossier","Suivre le dossier","Rédiger les courriers","Classer et mettre à jour mes documents"]],
  ["t","orga","Organismes concernés (CAF, CPAM, CARSAT, impôts…)"],["r","urgence","Degré d’urgence",["Urgent (échéance proche)","Dans le mois","Pas urgent"]],["d","echeance","Date limite éventuelle"]]},
 dem:{t:"Aide à toute démarche",d:"Accompagnement pas à pas dans les démarches en ligne ou sur place : organismes sociaux, santé, logement, ou toute autre demande.",c:[
  ["c","demarches","Démarches concernées",["Démarches en ligne","Guichets (sur place)","Logement","Santé","MDPH / APA","Autre démarche"]],
  ["a","precis","Décrivez la démarche précise et l’organisme concerné"],["r","mode","Accompagnement souhaité",["À distance (téléphone / visio)","À mon domicile","Sur place avec moi, à l’organisme"]],
  ["r","internet","Disposez-vous d’un ordinateur ou smartphone et d’internet ?",["Oui","Non","Partiellement"]],["d","echeance","Date limite éventuelle"]]},
 tech:{t:"Conseil technique",d:"Explications claires sur les droits, les procédures et les options possibles, pour décider en connaissance de cause.",c:[
  ["c","sujets","Sujets",["Droits","Simulation d’aides","Explication de courriers","Orientation"]],["a","question","Votre question ou situation en quelques lignes"],
  ["r","format","Réponse souhaitée",["Rendez-vous téléphonique","Rendez-vous à mon domicile","Réponse écrite par e-mail"]],["d","echeance","Date limite éventuelle"]]}}}};
const ALL={};Object.values(POLES).forEach(p=>Object.assign(ALL,p.aides));
const fld=(k,[t,n,l,o])=>{const nm=k+"_"+n;
 if(t=="c"||t=="r")return `<div class="full"><span class="f">${l}</span><div class="chips${t=="c"?" sq":""}" data-n="${nm}" data-t="${t=="c"?"checkbox":"radio"}" data-v="${o.join("|")}"></div></div>`;
 if(t=="a")return `<label class="f full">${l}<textarea name="${nm}" rows="3"></textarea></label>`;
 return `<label class="f">${l}<input type="${t=="d"?"date":t=="n"?"number":"text"}" name="${nm}"${t=="n"?' min="0" max="168" step="0.5"':""}></label>`};
const card=(n,v,t,d)=>`<label class="pcard"><input type="radio" name="${n}" value="${v}"><span><b>${t}</b><small>${d}</small></span></label>`;

const st=document.createElement("style");
st.textContent=`.pc{display:grid;gap:12px;grid-template-columns:1fr 1fr;margin-top:6px}.pc.three{grid-template-columns:repeat(3,1fr)}@media(max-width:700px){.pc,.pc.three{grid-template-columns:1fr}}
.pcard{position:relative;display:block;cursor:pointer}.pcard input{position:absolute;opacity:0;pointer-events:none}
.pcard span{display:block;height:100%;padding:14px 16px;border:1.5px solid var(--b);border-radius:14px;background:#fff;transition:.15s}
.pcard span:hover{border-color:var(--g)}.pcard b{display:block;color:var(--g);font-size:15px;margin-bottom:4px}.pcard small{display:block;color:var(--ts);font-size:12.5px;line-height:1.4}
.pcard input:checked+span{border-color:var(--o);background:#FFF9EE;box-shadow:0 0 0 3px rgba(185,120,30,.25)}.pcard input:focus-visible+span{outline:2px solid var(--g)}
.pc.err{outline:2px solid #B3382C;outline-offset:4px;border-radius:14px}
.expl{background:#fff;border-left:4px solid var(--o);border-radius:8px;padding:10px 14px;font-size:13.5px;color:var(--ts);margin:12px 0 0}`;
document.head.appendChild(st);

const F=q("#f"),T=t=>qa(".step").find(s=>s.dataset.t==t);
qa(".step")[0].insertAdjacentHTML("beforebegin",`<section class="step" data-t="Votre demande"><h2>Votre demande</h2><p class="sub">Choisissez d’abord le pôle d’activité, puis l’aide qui correspond à votre besoin.</p>
<div class="pc" data-r>${Object.entries(POLES).map(([k,p])=>card("pole",k,p.t,p.d)).join("")}</div>
<p class="expl"><b>Comment choisir ?</b> Le pôle <b>médico-social</b> s’adresse aux personnes qui ont besoin d’aide dans la vie quotidienne ou pour leur santé. Le pôle <b>administratif</b> s’adresse à celles qui ont besoin d’aide pour leurs dossiers, courriers et démarches.</p>
<div id="az" hidden style="margin-top:18px"><p class="sec" style="margin-top:0">Quelle aide souhaitez-vous ?</p><div class="pc three" id="ac" data-r></div><p class="expl" id="ad" hidden></p></div></section>`);
T("Logement et environnement").insertAdjacentHTML("beforebegin",`<section class="step" data-t="Détails de votre demande"><h2 id="dt">Détails de votre demande</h2><p class="sub">Précisez ce que vous attendez : plus c’est détaillé, mieux nous préparons votre accompagnement.</p>
<label class="f">Motif principal de la demande <em>*</em><textarea name="motif" maxlength="900" rows="3" required></textarea></label>
<div id="af">${Object.entries(ALL).map(([k,a])=>`<div class="aideform" data-a="${k}" hidden><div class="g" style="margin-top:16px">${a.c.map(f=>fld(k,f)).join("")}</div></div>`).join("")}</div>
<p class="sec">Documents joints à votre demande</p>
<span class="f">Comment nous les transmettrez-vous ?</span><div class="chips sq" data-n="doc_mode" data-t="checkbox" data-v="Par e-mail|Par courrier postal|Remis en main propre|Aucun document à transmettre"></div>
<p class="expl">E-mail : jrayan.mitantsoanyhaja@gmail.com<br>Courrier : Agence Mitantsoa, 12, rue Fernand Léger, 14123 IFS. Indiquez votre nom et le numéro de demande reçu à la fin de cette fiche.</p>
<span class="f" style="display:block;margin-top:14px">Documents que vous joindrez</span><div class="chips sq" data-n="doc_liste" data-t="checkbox" data-v="Pièce d’identité|Avis d’imposition|Justificatif de domicile|Certificat médical|Ordonnance / prescription|Courriers ou dossiers à traiter|Attestations (CAF, CPAM, retraite…)|RIB|Autres documents"></div>
<label class="f" style="margin-top:16px">Message supplémentaire<textarea name="message" maxlength="900" rows="4" placeholder="Toute précision utile : horaires, difficultés, souhaits particuliers…"></textarea></label></section>`);
T("Besoins et autonomie")?.remove();   // remplacé par le formulaire adapté à chaque aide

const pk=()=>(F.querySelector("input[name=pole]:checked")||{}).value,ak=()=>(F.querySelector("input[name=aide]:checked")||{}).value;
const skip=()=>qa(".step").forEach(s=>{if(pk()=="adm"&&["Logement et environnement","Aides déjà en place"].includes(s.dataset.t))s.dataset.skip="1";else delete s.dataset.skip});
F.addEventListener("change",e=>{
 if(e.target.name=="pole"){q("#ac").innerHTML=Object.entries(POLES[pk()].aides).map(([k,a])=>card("aide",k,a.t,a.d)).join("");q("#az").hidden=false;q("#ad").hidden=true;qa(".aideform").forEach(x=>x.hidden=true);skip()}
 if(e.target.name=="aide"){const A=ALL[ak()];qa(".aideform").forEach(x=>x.hidden=x.dataset.a!=ak());q("#ad").hidden=false;q("#ad").innerHTML=`<b>${A.t}</b> : ${A.d}<br><i>${A.c[0][3].join(" · ")}</i>`;q("#dt").textContent="Détails : "+A.t;skip()}
 e.target.closest(".pc")?.classList.remove("err")});

window.collecterDemande=()=>{
 const fd=new FormData(F),k=ak(),A=ALL[k],rep=[];
 A.c.forEach(([t,n,l])=>{const v=fd.getAll(k+"_"+n).filter(Boolean);if(v.length)rep.push({q:l,v})});
 return {cle:pk(),pole:POLES[pk()].t,aide:A.t,reponses:rep,docs_mode:fd.getAll("doc_mode"),docs:fd.getAll("doc_liste"),message:fd.get("message")||""}};
})();
