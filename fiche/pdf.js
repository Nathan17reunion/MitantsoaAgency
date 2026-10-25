/* Génère la fiche complétée (en-tête entreprise + signature du demandeur + cachet) : aperçu, PDF et impression */
(async()=>{
const CACHET_URL="Cachet_Agence_Mitantsoa.html";   // fichier du cachet (même dossier)
const ENT={adresse:"12, rue Fernand Léger, 14123 IFS",tel:"+33 7 45 26 19 86",mail:"jrayan.mitantsoanyhaja@gmail.com",
 siret:"",ape:"",sap:""};                            // à compléter : les lignes vides ne s'affichent pas

const zone=document.getElementById("pdfzone"),raw=JSON.parse(sessionStorage.getItem("mit-derniere")||"null");
if(!zone)return;
if(!raw||!raw.data){zone.innerHTML='<p style="text-align:center;color:#B3382C;font-weight:600">La fiche complète n’a pas été transmise à cette page. Refaites la demande depuis fiche.html (vérifiez que fiche.js contient « data:d »).</p>';return}
const d=raw.data,sg=d.signature||{};
const E=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fr=s=>s?s.split("-").reverse().join("/"):"";
const row=(k,v)=>v?`<div class="r"><span>${k}</span><b>${E(v)}</b></div>`:"";
const li=a=>a&&a.length?`<ul>${a.map(x=>`<li>${E(x)}</li>`).join("")}</ul>`:"";
const sec=(n,t,b)=>`<section><h3><i>${n}</i>${t}</h3>${b}</section>`;
const age=(s=>{if(!s)return"";const b=new Date(s),n=new Date();let a=n.getFullYear()-b.getFullYear();if(n<new Date(n.getFullYear(),b.getMonth(),b.getDate()))a--;return a+" ans"})(d.naissance);
const autre=(v,a)=>v=="Autre"&&a?"Autre : "+a:v;
const quand=sg.date?new Date(sg.date).toLocaleString("fr-FR",{dateStyle:"long",timeStyle:"short"}):raw.quand;

let cachet=window.CACHET_SVG||"";
if(!cachet)try{cachet=new DOMParser().parseFromString(await(await fetch(CACHET_URL)).text(),"text/html").querySelector("#cachet-svg")?.outerHTML||""}catch(e){}

const css=`
#pdfzone{margin-top:26px}
#pdfzone .bar{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:14px}
#pdfzone .scroll{overflow-x:auto;padding-bottom:10px}
.sheet{width:210mm;min-height:297mm;margin:0 auto;display:grid;grid-template-columns:62mm 1fr;background:linear-gradient(to right,#152E26 62mm,#fff 62mm);box-shadow:0 6px 24px rgba(0,0,0,.18);font:10px/1.45 Arial,Helvetica,sans-serif;color:#2A2620;text-align:left}
.side{color:#FCFAF4;padding:12mm 7mm}
.side svg.lg{width:76px;height:76px;display:block;margin-bottom:5mm}
.side h1{font-size:14px;letter-spacing:.12em;margin:0 0 1mm;color:#fff}
.side p{margin:0 0 5mm;color:#E7C393;font-size:9px}
.side h4{margin:5mm 0 1mm;font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:#E7C393;border-top:1px solid rgba(231,195,147,.4);padding-top:3mm}
.side div,.side li{font-size:9px;overflow-wrap:anywhere}
.side ul{margin:0;padding-left:12px}
.main{padding:12mm 12mm 10mm 10mm;display:flex;flex-direction:column}
.kick{color:#B9781E;font-weight:700;letter-spacing:.14em;font-size:9px}
.main h2{font-size:19px;color:#24463B;margin:1mm 0 3mm;line-height:1.15}
.meta{background:#F6F1E7;border-left:4px solid #B9781E;padding:2mm 3mm;font-size:9px;margin-bottom:3mm}
.main h3{font-size:11px;color:#fff;background:#24463B;margin:4mm 0 1mm;padding:1.4mm 3mm;border-radius:2mm;break-after:avoid}
.main h3 i{font-style:normal;color:#E7C393;margin-right:6px}
.r{display:flex;gap:8px;padding:1mm 0;border-bottom:1px solid #E8DFC9;break-inside:avoid}
.r span{width:33mm;flex:none;color:#5B564B}.r b{font-weight:600;overflow-wrap:anywhere}
.main ul{margin:1mm 0 0;padding:0;list-style:none}
.main li{padding:.4mm 0}.main li:before{content:"\\2714";color:#24463B;margin-right:6px}
.sigblock{margin-top:auto;padding-top:8mm;display:flex;justify-content:space-between;align-items:flex-end;gap:6mm;break-inside:avoid}
.sigbox{flex:1;font-size:9px}
.sigbox .sg{min-height:17mm;border-bottom:1.5px solid #24463B;margin:1mm 0 1.5mm;display:flex;align-items:flex-end}
.sigbox .sg img{max-height:17mm;max-width:100%}
.sigbox .sg span{font:italic 22px "Brush Script MT","Segoe Script",cursive}
.stamp .cap{font:bold 8px/1.3 Arial,sans-serif;margin-bottom:1.5mm;color:#24463B}.stamp{width:60mm;line-height:0;flex:none}.stamp svg{width:100%;height:auto;display:block}
.note{font-size:8px;color:#5B564B;margin-top:4mm;border-top:1px solid #E8DFC9;padding-top:2mm}
.flow{width:100%;border-collapse:collapse}.flow td{padding:0}.sp{height:0}
@page{size:A4;margin:0}@page letter{size:A4;margin:20mm 22mm}
@media print{.top,#done,.foot{display:none!important}body{background:#fff}.wrap{max-width:none;padding:0}#pdfzone{margin:0}#pdfzone .bar{display:none}#pdfzone .scroll{overflow:visible;padding:0}.sheet{box-shadow:none;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.sheet{display:block;min-height:0;background:none}.side{position:fixed;left:0;top:0;bottom:0;width:62mm;box-sizing:border-box;background:#152E26;-webkit-print-color-adjust:exact;print-color-adjust:exact}.main{display:block;min-height:0;margin-left:62mm;padding:0 12mm 0 10mm}.sp{height:12mm}.r,.sigblock,.main li,.meta{break-inside:avoid;page-break-inside:avoid}.main h3{break-after:avoid;page-break-after:avoid}.sigblock{margin-top:10mm;padding-top:0}.letter{page:letter;position:relative;z-index:2;background:#fff;padding:0!important;width:auto!important;min-height:257mm}}`;

const side=`<aside class="side">
<svg class="lg" viewBox="0 0 200 200" fill="none" stroke="#FCFAF4" stroke-linecap="round" stroke-linejoin="round"><circle cx="100" cy="100" r="90" stroke-width="8"/><path d="M52 148L52 66L100 116L148 66L148 148" stroke-width="15"/><path d="M100 52V158M100 62C132 66 132 90 100 94C68 98 68 122 100 126C120 129 126 143 108 154" stroke="#E7C393" stroke-width="6"/><path d="M100 18C100 18 114 34 114 43A14 14 0 0 1 86 43C86 34 100 18 100 18Z" fill="#E7C393" stroke="none"/></svg>
<h1>AGENCE MITANTSOA</h1><p>Services à la personne</p>
<h4>Adresse</h4><div>${E(ENT.adresse)}</div>
<h4>Contact</h4><div>Tél : ${E(ENT.tel)}</div><div>${E(ENT.mail)}</div>
<h4>Entreprise</h4>${ENT.siret?`<div>N° SIRET : ${E(ENT.siret)}</div>`:""}${ENT.ape?`<div>Code APE : ${E(ENT.ape)}</div>`:""}${ENT.sap?`<div>N° SAP : ${E(ENT.sap)}</div>`:""}<div>Micro-entreprise</div>
<h4>Nos services</h4><ul><li>Aide à domicile</li><li>Aide aux repas et aux courses</li><li>Accompagnement</li><li>Ménage et entretien</li><li>Soins de nursing</li><li>Conseil voyage La Réunion et Madagascar</li></ul>
</aside>`;

const D=d.demande||{},med=D.cle!="adm";
const demande=()=>row("Pôle d’activité",D.pole)+row("Aide demandée",D.aide)+row("Motif principal",d.motif)+(D.reponses||[]).map(r=>row(r.q,r.v.join(", "))).join("")+row("Envoi des documents",(D.docs_mode||[]).join(", "))+row("Documents joints",(D.docs||[]).join(", "))+row("Message supplémentaire",D.message);
const sheet=`<div class="sheet">${side}<div class="main"><table class="flow"><thead><tr><td class="sp"></td></tr></thead><tfoot><tr><td class="sp"></td></tr></tfoot><tbody><tr><td>
<div class="kick">FICHE DE RENSEIGNEMENTS</div><h2>${E(D.aide?"Demande : "+D.aide:"Demande d’aide à la personne")}</h2>
<div class="meta">Référence : <b>${E(d.reference)}</b> · Établie le ${E(quand)}</div>
${sec(1,"Identité du demandeur (bénéficiaire)",row("Nom de naissance",d.nom)+row("Nom marital",d.nom_marital)+row("Prénom(s)",d.prenom)+row("Date de naissance",fr(d.naissance)+(age?" ("+age+")":""))+row("Sexe",d.sexe)+row("Adresse",d.adresse)+row("Téléphone",d.tel)+row("E-mail",d.email)+row("N° Sécurité sociale",d.nss)+row("Caisse de retraite",autre(d.caisse,d.caisse_autre)))}
${sec(2,"Personne à contacter / Aidant principal",d.aidant_nom||d.aidant_tel||d.aidant_adresse?row("Nom et prénom",d.aidant_nom)+row("Lien",autre(d.lien,d.lien_autre))+row("Téléphone",d.aidant_tel)+row("Adresse",d.aidant_adresse):row("","Aucune personne différente du demandeur"))}
${sec(3,"Votre demande",demande())}
${med?sec(4,"Logement et environnement",row("Type de logement",d.logement)+row("Statut",d.statut)+row("Étage / Accès",d.acces+(d.ascenseur?" (ascenseur : "+d.ascenseur+")":""))+row("Environnement",d.commerces)+row("Mode de vie",d.vie)):""}
${med?sec(5,"Aides déjà en place",li(d.aides)+row("Volume horaire actuel",d.heures?d.heures+" h / semaine":"")):""}
<div class="sigblock">
<div class="sigbox"><b>Pour le demandeur : signature</b><div class="sg">${sg.mode=="draw"?`<img src="${sg.valeur}" alt="Signature">`:`<span>${E(sg.valeur)}</span>`}</div>
Signée électroniquement le ${E(quand)}<br>Identité confirmée par code reçu ${sg.canal=="email"?"par e-mail":"par SMS"}.</div>
<div class="stamp"><div class="cap">Pour l’Agence Mitantsoa : cachet et signature du Directeur</div>${cachet||'<div style="height:30mm;border:1px dashed #999;border-radius:3mm;display:flex;align-items:center;justify-content:center;font:9px Arial;color:#999">Cachet de l’entreprise</div>'}</div>
</div>
<div class="note">Cette fiche est à joindre à la lettre de demande officielle et aux pièces justificatives (avis d’imposition, certificat médical, etc.).</div>
</td></tr></tbody></table></div></div>`;

zone.innerHTML=`<style>${css}</style><div class="bar no-print"><button class="btn bp" id="prtpdf">Imprimer / Enregistrer en PDF</button></div><p class="no-print" style="text-align:center;font-size:13px;color:#5B564B;margin:0 0 12px">Pour garder une copie : dans la fenêtre d’impression, choisissez « Enregistrer au format PDF ».</p><div class="scroll">${sheet}</div>`;
const imprimer=()=>{
 const f=document.createElement("iframe");f.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0";document.body.appendChild(f);
 const w=f.contentWindow;w.document.open();
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Fiche_${d.reference}</title><style>body{margin:0}${css}</style></head><body>${sheet}</body></html>`);
 w.document.close();
 setTimeout(()=>{w.focus();w.print();setTimeout(()=>f.remove(),2000)},400)};
document.getElementById("prtpdf").onclick=imprimer;
})();
