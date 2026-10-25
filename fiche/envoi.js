/* Lettre de demande, pièces justificatives, impression (fiche + lettre) et envoi. À charger APRÈS pdf.js */
(()=>{
const t0=setInterval(()=>{if(document.querySelector("#prtpdf")&&document.querySelector(".sheet")){clearInterval(t0);go()}},100);
function go(){
const raw=JSON.parse(sessionStorage.getItem("mit-derniere")||"null");if(!raw||!raw.data)return;
const d=raw.data,D=d.demande||{},L=D.lt||{},sg=d.signature||{},ref=d.reference,MAIL="jrayan.mitantsoanyhaja@gmail.com";
const CERFA="https://www.formulaires.service-public.gouv.fr/gf/cerfa_16301.do";
const E=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fr=s=>s?s.split("-").reverse().join("/"):"",civ=d.sexe=="Femme"?"Madame":"Monsieur",ne=d.sexe=="Femme"?"née":"né";
const dt=sg.date?new Date(sg.date).toLocaleDateString("fr-FR",{dateStyle:"long"}):"";
const INTRO={dom:"Je souhaite être accompagné(e) dans les gestes de mon quotidien afin de préserver mon autonomie à mon domicile.",
 soig:"Je souhaite bénéficier de soins d’hygiène et de confort, avec une attention portée à mon état de santé et un lien avec les professionnels qui me suivent.",
 fam:"Je souhaite être écouté(e), orienté(e) et soutenu(e) dans mon rôle de proche aidant.",
 adm:"Je souhaite être aidé(e) pour constituer et suivre mes dossiers, répondre à mes courriers et classer mes documents importants.",
 dem:"Je souhaite être accompagné(e), pas à pas, dans mes démarches en ligne ou sur place.",
 tech:"Je souhaite obtenir des explications claires sur mes droits, les procédures et les options possibles, afin de décider en connaissance de cause."};
 
/* ---- Lettre ---- */
const lettre=`<div class="letter">
<div class="lt-top"><div><b>${E(d.prenom)} ${E(d.nom)}</b><br>${E(d.adresse)}<br>Tél : ${E(d.tel)}<br>${E(d.email)}</div>
<div class="lt-r"><b>Agence Mitantsoa</b><br>12, rue Fernand Léger<br>14123 IFS<br>${MAIL}<br><br>Le ${E(dt)}</div></div>
<p class="lt-ref">Réf. : <b>${E(ref)}</b><br>Objet : <b>Demande d’accompagnement – ${E(D.aide)}</b></p>
<p>Madame, Monsieur,</p>
<p>Je soussigné(e) ${civ} ${E(d.prenom)} ${E(d.nom)}, ${ne} le ${E(fr(d.naissance))}, demeurant ${E(d.adresse)}, me permets de solliciter l’Agence Mitantsoa, au titre du pôle « ${E(D.pole)} », pour l’aide suivante : <b>${E(D.aide)}</b>.</p>
<p>${E(INTRO[D.k]||"")}</p>
<p><b>Ma situation :</b> ${E((L.sit||[]).join(", ")||"—")}. ${E(L.texte)}${L.depuis?" Cette situation dure "+E(L.depuis.replace(/^depuis\s*/i,"depuis "))+".":""}${L.attente?" J’attends de l’agence : "+E(L.attente)+".":""}</p>
<p><b>Motif de ma demande :</b> ${E(d.motif)}</p>
${(D.reponses||[]).length?`<p><b>Mes attentes :</b></p><ul>${D.reponses.map(r=>`<li>${E(r.q)} : ${E(r.v.join(", "))}</li>`).join("")}</ul>`:""}
<p>Je vous transmets ${E((D.docs_mode||[]).join(", ").toLowerCase()||"mes documents")} les pièces suivantes : ${E((D.docs||[]).join(", ")||"voir la liste des pièces jointes")}.${D.cerfa?" Je joins également une copie du formulaire officiel Cerfa n° 16301*01 (demande d’aides à l’autonomie à domicile), que j’ai rempli.":""}</p>
${D.message?`<p><b>Précisions :</b> ${E(D.message)}</p>`:""}
<p>Dans l’attente de votre réponse, je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.</p>
<div class="lt-sg"><div>Signature de ${E(d.prenom)} ${E(d.nom)}<div class="sgl">${sg.mode=="draw"?`<img src="${sg.valeur}" alt="Signature">`:`<span>${E(sg.valeur)}</span>`}</div></div></div>
<p class="lt-pj">Pièces jointes : fiche de renseignements n° ${E(ref)}${D.cerfa?" ; Cerfa n° 16301*01":""} ; pièces justificatives.</p></div>`;
const lcss=`.letter{width:210mm;min-height:297mm;margin:16px auto 0;padding:20mm 22mm;box-sizing:border-box;background:#fff;color:#2A2620;font:12px/1.6 Arial,Helvetica,sans-serif;text-align:left;box-shadow:0 6px 24px rgba(0,0,0,.18);break-before:page;page-break-before:always}
.letter p{margin:0 0 3.2mm}.letter ul{margin:0 0 3.2mm;padding-left:18px}.lt-top{display:flex;justify-content:space-between;gap:10mm;margin-bottom:10mm}.lt-r{text-align:right}
.lt-ref{border-left:4px solid #B9781E;background:#F6F1E7;padding:2mm 3mm}.lt-sg{margin-top:8mm}.sgl{min-height:18mm;border-bottom:1.5px solid #24463B;width:70mm;display:flex;align-items:flex-end}
.sgl img{max-height:18mm;max-width:100%}.sgl span{font:italic 24px "Brush Script MT","Segoe Script",cursive}.lt-pj{margin-top:8mm;font-size:10.5px;color:#5B564B}`;
const zone=document.querySelector("#pdfzone");
const st=document.createElement("style");st.textContent=lcss;zone.appendChild(st);
const sc=document.createElement("div");sc.className="scroll";sc.innerHTML=lettre;zone.querySelector(".scroll").after(sc);
 
/* ---- Pièces justificatives ---- */
const B=[["Piece-identite","Pièce d’identité : CNI (recto/verso), passeport ou titre de séjour",1],["Justificatif-domicile","Justificatif de domicile"],["Avis-imposition","Dernier avis d’imposition (AVI), toutes les pages"],["RIB","Relevé d’identité bancaire (RIB)"]];
const X={dom:[["Certificat-medical","Certificat médical ou ordonnance"],["Attestation-retraite","Attestation de caisse de retraite ou notification d’aide existante"]],
 soig:[["Ordonnance","Ordonnance ou prescription médicale"],["Attestation-droits","Attestation de droits (carte Vitale / CPAM)"]],
 fam:[["Livret-famille","Livret de famille ou justificatif du lien avec la personne aidée"],["Certificat-medical","Certificat médical de la personne aidée"]],
 adm:[["Courriers","Courriers ou dossiers à traiter"],["Attestation","Attestation CAF / CPAM / retraite"]],
 dem:[["Courrier-organisme","Courrier de l’organisme concerné"],["Notification","Notification MDPH / APA, si existante"]],
 tech:[["Courrier-a-expliquer","Courrier ou document à expliquer"]]};
const SL=[];let n=3;
if(D.cerfa)SL.push({slug:"Cerfa-16301",label:"Formulaire Cerfa n° 16301*01 rempli",req:1,num:"03",cerfa:1});
else SL.push({slug:"Cerfa-16301",label:"Formulaire Cerfa n° 16301*01 rempli (facultatif)",num:"03",cerfa:1});
[...B,...(X[D.k]||[]),...(D.cerfa?[["Decision-protection","Décision de justice (mise sous protection), si concerné"],["Taxe-fonciere","Avis de taxe foncière, si concerné"]]:[]),["Autre-document","Autre document utile"]].forEach(([slug,label,req])=>SL.push({slug,label,req,num:String(++n).padStart(2,"0")}));
const up=document.createElement("div");up.className="no-print up";
up.innerHTML=`<style>.up{max-width:210mm;margin:22px auto 0;background:#fff;border:1px solid #DACBA3;border-radius:14px;padding:18px 20px;text-align:left}.up h3{margin:0 0 4px;color:#24463B}.up p{margin:0 0 12px;font-size:13px;color:#5B564B}.slot{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center;padding:8px 0;border-top:1px solid #EDE4D0;font-size:13.5px}.slot em{grid-column:1/-1;font-style:normal;font-size:12px;color:#5B564B}.slot em.ok{color:#24463B}.slot em.bad{color:#B3382C}@media(max-width:600px){.slot{grid-template-columns:1fr}}#sendmsg{text-align:center;font-weight:600;font-size:14px;margin:10px 0 0}</style>
<h3>Pièces justificatives</h3><p>Formats acceptés : PDF, PNG ou JPG · 10 Mo maximum par fichier. Chaque fichier sera renommé automatiquement avec le numéro ${E(ref)}. <a href="${CERFA}" target="_blank" rel="noopener">Ouvrir le Cerfa n° 16301</a></p>
${SL.map((s,i)=>`<label class="slot"><span>${E(s.label)}${s.req?" <b style='color:#B9781E'>*</b>":""}</span><input type="file" data-i="${i}" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"><em></em></label>`).join("")}`;
zone.querySelector(".bar").before(up);
up.addEventListener("change",e=>{const i=e.target.dataset.i,s=SL[i],f=e.target.files[0],em=e.target.nextElementSibling;s.file=null;em.className="";em.textContent="";if(!f)return;
 const ext=(f.name.split(".").pop()||"").toLowerCase().replace("jpeg","jpg");
 if(!["pdf","png","jpg"].includes(ext)){em.className="bad";em.textContent="Format refusé : PDF, PNG ou JPG uniquement.";e.target.value="";return}
 if(f.size>10*1048576){em.className="bad";em.textContent="Fichier trop lourd (10 Mo maximum).";e.target.value="";return}
 s.file=f;s.name=`${ref}_${s.num}_${s.slug}.${ext}`;em.className="ok";em.textContent="Sera enregistré sous : "+s.name});
 
/* ---- Boutons : Imprimer / Télécharger  |  Envoyer ---- */
const bar=zone.querySelector(".bar"),pb=document.querySelector("#prtpdf");
pb.textContent="Imprimer / Télécharger";
bar.insertAdjacentHTML("beforeend",`<button class="btn bp" id="btn-send" type="button">Envoyer</button>`);
zone.insertAdjacentHTML("beforeend",`<p id="sendmsg" class="no-print" role="status"></p>`);
const msg=(t,ok)=>{const m=document.querySelector("#sendmsg");m.textContent=t;m.style.color=ok?"#24463B":"#B3382C";return false};
const sheetHtml=document.querySelector(".sheet").outerHTML,css=zone.querySelector("style").textContent+lcss;
pb.onclick=()=>{const f=document.createElement("iframe");f.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0";document.body.appendChild(f);
 const w=f.contentWindow;w.document.open();
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${ref}_01-02_Fiche-et-lettre-de-demande</title><style>body{margin:0}${css}.letter{margin:0!important;box-shadow:none!important}.sheet{margin:0!important;box-shadow:none!important}</style></head><body>${sheetHtml}${lettre}</body></html>`);
 w.document.close();setTimeout(()=>{w.focus();w.print();setTimeout(()=>f.remove(),2000)},400)};
const dl=(b,nm)=>{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=nm;a.click()};
document.querySelector("#btn-send").onclick=async()=>{
 const miss=SL.find(s=>s.req&&!s.file);if(miss)return msg("Pièce obligatoire manquante : "+miss.label);
 const fd=new FormData();fd.append("reference",ref);fd.append("donnees",JSON.stringify(d));
 fd.append("fiche",new Blob([`<!doctype html><meta charset="utf-8"><style>${css}</style>${sheetHtml}`],{type:"text/html"}),`${ref}_01_Fiche-renseignements.html`);
 fd.append("lettre",new Blob([`<!doctype html><meta charset="utf-8"><style>${css}</style>${lettre}`],{type:"text/html"}),`${ref}_02_Lettre-demande.html`);
 SL.filter(s=>s.file).forEach(s=>fd.append("pieces",s.file,s.name));
 if(typeof CFG!=="undefined"&&CFG.DOSSIER){
  try{const r=await fetch(CFG.DOSSIER,{method:"POST",body:fd});
   if(r.status==409){const j=await r.json();return msg(`Une demande existe déjà avec votre e-mail pour cette aide (n° ${j.ref}). Suivez votre demande : un e-mail vous a été envoyé.`)}
   if(!r.ok)throw 0;location.href="envoye.html"}catch(e){msg("Envoi impossible pour le moment. Réessayez ou utilisez Imprimer / Télécharger.")}
 }else{
  SL.filter(s=>s.file).forEach(s=>dl(s.file,s.name));
  msg("Envoi automatique non configuré : vos pièces ont été téléchargées avec leur nom officiel. Joignez-les, avec le PDF imprimé (fiche et lettre), à l’e-mail qui s’ouvre.",1);
  setTimeout(()=>location.href=`mailto:${MAIL}?subject=${encodeURIComponent("Dossier "+ref)}&body=${encodeURIComponent("Bonjour,\n\nVeuillez trouver mon dossier "+ref+" en pièces jointes.\n")}`,800)}};
}})();
