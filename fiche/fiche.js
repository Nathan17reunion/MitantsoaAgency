/* Logique de la fiche : étapes, validation, signature, code de confirmation, enregistrement */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],F=$("#f");
$$(".chips[data-n]").forEach(c=>{const t=c.dataset.t||"radio";c.innerHTML=c.dataset.v.split("|").map(v=>`<label class="chip"><input type="${t}" name="${c.dataset.n}" value="${v}"><span>${v}</span></label>`).join("")});
const S=$$(".step");let cur=0;
function show(i){cur=i;S.forEach((s,k)=>s.classList.toggle("show",k==i));
 const V=S.filter(s=>s.dataset.skip!="1"),vi=V.indexOf(S[i]);$("#steps").innerHTML=V.map((s,k)=>`<i class="${k<vi?"done":k==vi?"on":""}"></i>`).join("");
 $("#lbl").textContent=`Étape ${vi+1} sur ${V.length} · ${S[i].dataset.t}`;
 $("#prev").textContent=i?"← Retour":"← Accueil";$("#next").hidden=i==S.length-1;
 scrollTo({top:0,behavior:"smooth"});if(i==S.length-1)initSign()}
function valid(){const s=S[cur];
 for(const e of s.querySelectorAll("input,textarea")){if(e.offsetParent===null)continue;if(!e.checkValidity()){e.reportValidity();return false}}
 const n=$("#nss").value.replace(/\s/g,"");if(cur==0&&n&&!/^\d{13,15}$/.test(n)){$("#nss").setCustomValidity("13 à 15 chiffres");$("#nss").reportValidity();$("#nss").setCustomValidity("");return false}
 for(const r of s.querySelectorAll("[data-r]")){if(!r.querySelector("input:checked")){r.classList.add("err");r.scrollIntoView({block:"center"});return false}}
 return true}
function step(n){let i=cur+n;while(S[i]&&S[i].dataset.skip=="1")i+=n;return Math.max(0,Math.min(i,S.length-1))}
$("#next").onclick=()=>valid()&&show(step(1));
$("#prev").onclick=()=>cur?show(step(-1)):home();
F.addEventListener("change",e=>{
 $$("[data-autre]").forEach(x=>{const c=F.querySelector(`input[name=${x.dataset.autre}]:checked`);x.hidden=!(c&&c.value=="Autre")});
 const a=F.querySelector("input[name=acces]:checked");$("#asc").hidden=!(a&&a.value=="Étage");
 e.target.closest(".chips")?.classList.remove("err")});
$("#noaid").onchange=e=>$("#aid").hidden=e.target.checked;
$("#dn").max=new Date().toISOString().slice(0,10);
$("#dn").onchange=e=>{const d=new Date(e.target.value),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;$("#age").textContent=isNaN(a)||a<0?"":`Âge : ${a} ans`};

/* ===== SIGNATURE ===== */
let mode="type",drew=false,dr=false;const cv=$("#cv"),cx=cv.getContext("2d");
function initSign(){if(cv.offsetWidth&&cv.width!=cv.offsetWidth){cv.width=cv.offsetWidth;cv.height=160;cx.lineWidth=2.4;cx.lineCap="round";cx.strokeStyle="#000";drew=false}
 if(!$("#sn").value){$("#sn").value=(F.prenom.value+" "+F.nom.value).trim();$("#sp").textContent=$("#sn").value}}
$("#sn").oninput=e=>$("#sp").textContent=e.target.value;
$$(".tab").forEach(b=>b.onclick=()=>{mode=b.dataset.m;$$(".tab").forEach(x=>x.classList.toggle("on",x==b));$("#pt").hidden=mode!="type";$("#pd").hidden=mode!="draw";initSign()});
const pos=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
cv.onpointerdown=e=>{dr=true;cv.setPointerCapture(e.pointerId);cx.beginPath();cx.moveTo(...pos(e))};
cv.onpointermove=e=>{if(dr){cx.lineTo(...pos(e));cx.stroke();drew=true}};
cv.onpointerup=cv.onpointercancel=()=>dr=false;
$("#clr").onclick=()=>{cx.clearRect(0,0,cv.width,cv.height);drew=false};
const sigOK=()=>mode=="type"?$("#sn").value.trim().split(/\s+/).length>=2:drew;

/* ===== CODE DE CONFIRMATION ===== */
let code=null,exp=0,tries=0,dest="";
const gen=()=>{const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return[...crypto.getRandomValues(new Uint8Array(8))].map(x=>a[x%a.length]).join("")};
const mask=d=>d.includes("@")?d.replace(/^(.).*(@.*)$/,"$1***$2"):d.replace(/\d(?=\d{2})/g,"•");

const say=(t,ok)=>{const m=$("#msg");m.textContent=t;m.className=ok?"good":"bad";return false};
const post=b=>fetch(CFG.ENVOI,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});
function cooldown(){let s=30;const b=$("#send");b.disabled=true;b.textContent="Renvoyer (30s)";const t=setInterval(()=>{b.textContent=--s>0?`Renvoyer (${s}s)`:"Renvoyer le code";if(s<=0){clearInterval(t);b.disabled=false}},1000)}
$("#send").onclick=async()=>{
 if(!$("#ok").checked)return say("Veuillez cocher l’attestation sur l’honneur.");
 if(!sigOK())return say(mode=="type"?"Saisissez votre prénom et votre nom pour signer.":"Dessinez votre signature.");
 const canal=F.canal.value;dest=canal=="sms"?F.tel.value:F.email.value;
 if(!dest)return say("Coordonnée manquante : revenez à l’étape 1.");
 if(CFG.TEST){code=gen();exp=Date.now()+(15 * 60 * 1000);tries=0;$("#test").hidden=false;$("#test b").textContent=code}
 else{try{const r=await post({action:"envoyer",canal,dest});if(!r.ok)throw new Error("le serveur répond "+r.status)}catch(e){return say("Envoi impossible ("+(e.message&&e.message!="Failed to fetch"?e.message:"serveur injoignable ou bloqué par le navigateur")+").")}}
 $("#codebox").hidden=false;$("#code").focus();cooldown();
 say(`Code envoyé ${canal=="sms"?"par SMS au ":"par e-mail à "}${mask(dest)}. Valable 10 minutes.`,true)};
$("#code").oninput=e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"");
$("#val").onclick=async()=>{
 const v=$("#code").value;if(v.length!=8)return say("Le code comporte 8 caractères.");let good;
 if(CFG.TEST){if(!code||Date.now()>exp)return say("Code expiré : demandez-en un nouveau.");if(++tries>5){code=null;return say("Trop d’essais : demandez un nouveau code.")}good=v===code}
 else{try{const r=await post({action:"verifier",dest,code:v});good=r.ok&&(await r.json()).ok}catch(e){return say("Vérification impossible, réessayez.")}}
 if(!good)return say("Code incorrect.");
 enregistrer()};

/* ===== ENREGISTREMENT ===== */
async function enregistrer(){
 const fd=new FormData(F),d={};for(const[k,v]of fd.entries())d[k]=v;
 d.besoins=fd.getAll("besoins");d.aides=fd.getAll("aides");d.demande=collecterDemande();
 const n=new Date(),p=x=>String(x).padStart(2,"0"),r=`DEM-${n.getFullYear()}${p(n.getMonth()+1)}${p(n.getDate())}-${gen().slice(0,4)}`;
 d.reference=r;d.signature={mode,valeur:mode=="type"?$("#sn").value.trim():cv.toDataURL("image/png"),canal:F.canal.value,date:n.toISOString()};
 try{const l=JSON.parse(localStorage.getItem("mit-demandes")||"[]");l.push(d);localStorage.setItem("mit-demandes",JSON.stringify(l))}catch(e){}
 if(CFG.ENREG){try{await fetch(CFG.ENREG,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)})}catch(e){}}
 sessionStorage.setItem("mit-derniere",JSON.stringify({data:d,ref:r,prenom:d.prenom,quand:`${p(n.getDate())}/${p(n.getMonth()+1)}/${n.getFullYear()} à ${p(n.getHours())}h${p(n.getMinutes())}`}));
 location.href="enregistrement.html"}
show(0);

// ---------- Suggestions d’adresse : Géoplateforme IGN ----------

(() => {
  function initialiserAdresse() {
    const inputAdresse = document.getElementById("adresse");
    const suggestionsBox = document.getElementById("adresse-suggestions");
    const inputAdresseValidee = document.getElementById("adresse-validee");

    if (!inputAdresse || !suggestionsBox || !inputAdresseValidee) {
      return;
    }

    const wrapper = inputAdresse.closest(".adresse-wrapper");
    const form = inputAdresse.closest("form");

    let timeoutId = null;
    let controleur = null;
    let versionRecherche = 0;

    function fermerSuggestions() {
      suggestionsBox.replaceChildren();
      suggestionsBox.hidden = true;
    }

    function annulerRecherche() {
      clearTimeout(timeoutId);

      if (controleur) {
        controleur.abort();
        controleur = null;
      }

      versionRecherche += 1;
    }

    inputAdresse.addEventListener("input", () => {
      annulerRecherche();
      fermerSuggestions();

      inputAdresseValidee.value = "";

      const query = inputAdresse.value.trim();

      if (query.length < 3) {
        return;
      }

      const version = versionRecherche;

      timeoutId = setTimeout(async () => {
        const requete = new AbortController();
        controleur = requete;

        const params = new URLSearchParams({
          q: query,
          index: "address",
          limit: "5"
        });

        try {
          const reponse = await fetch(
            `https://data.geopf.fr/geocodage/search/?${params}`,
            { signal: requete.signal }
          );

          if (!reponse.ok) {
            throw new Error(`Erreur HTTP ${reponse.status}`);
          }

          const data = await reponse.json();

          // Ne pas afficher les résultats d’une ancienne saisie.
          if (
            version !== versionRecherche ||
            inputAdresse.value.trim() !== query
          ) {
            return;
          }

          fermerSuggestions();

          const resultats = Array.isArray(data.features)
            ? data.features
            : [];

          resultats.forEach((feature) => {
            const label = feature.properties?.label;

            if (!label) {
              return;
            }

            const li = document.createElement("li");
            const bouton = document.createElement("button");

            bouton.type = "button";
            bouton.textContent = label;

            bouton.addEventListener("click", () => {
              annulerRecherche();

              inputAdresse.value = label;
              inputAdresseValidee.value = label;

              fermerSuggestions();
              inputAdresse.focus();
            });

            li.appendChild(bouton);
            suggestionsBox.appendChild(li);
          });

          suggestionsBox.hidden =
            suggestionsBox.childElementCount === 0;

        } catch (erreur) {
          if (
            erreur.name !== "AbortError" &&
            version === versionRecherche
          ) {
            fermerSuggestions();
            console.warn("Recherche d’adresse indisponible :", erreur);
          }
        } finally {
          if (controleur === requete) {
            controleur = null;
          }
        }
      }, 400);
    });

    // Fermer la liste lorsque l’utilisateur clique à l’extérieur.
    document.addEventListener("click", (event) => {
      if (wrapper && !wrapper.contains(event.target)) {
        annulerRecherche();
        fermerSuggestions();
      }
    });

    // Fermer la liste avec Échap.
    wrapper?.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        annulerRecherche();
        fermerSuggestions();
        inputAdresse.focus();
      }
    });

    // Fermer la liste lorsque le focus quitte le groupe.
    wrapper?.addEventListener("focusout", (event) => {
      if (!wrapper.contains(event.relatedTarget)) {
        annulerRecherche();
        fermerSuggestions();
      }
    });

    // Autoriser une adresse manuelle après confirmation.
    form?.addEventListener("submit", (event) => {
      const adresse = inputAdresse.value.trim();
      const adresseSelectionnee = inputAdresseValidee.value.trim();

      if (adresse && adresse !== adresseSelectionnee) {
        inputAdresseValidee.value = "";

        const continuer = window.confirm(
          "Vous n’avez pas sélectionné d’adresse dans les suggestions. " +
          "Voulez-vous envoyer votre demande avec l’adresse saisie ?"
        );

        if (!continuer) {
          event.preventDefault();
          inputAdresse.focus();
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialiserAdresse,
      { once: true }
    );
  } else {
    initialiserAdresse();
  }
})();

// ---------- Nom en majuscules et prénom en minuscules ----------

(() => {
  function initialiserIdentiteAidant() {
    const champs = [
      {
        element: document.getElementById("aidant-nom"),
        convertir: (texte) => texte.toLocaleUpperCase("fr-FR")
      },
      {
        element: document.getElementById("aidant-prenom"),
        convertir: (texte) => texte.toLocaleLowerCase("fr-FR")
      }
    ];

    champs.forEach(({ element, convertir }) => {
      if (!element) return;

      function convertirValeur() {
        const debut = element.selectionStart;
        const fin = element.selectionEnd;
        const valeur = element.value;
        const valeurConvertie = convertir(valeur);

        if (valeur === valeurConvertie) return;

        const nouveauDebut = debut === null
          ? null
          : convertir(valeur.slice(0, debut)).length;

        const nouvelleFin = fin === null
          ? null
          : convertir(valeur.slice(0, fin)).length;

        element.value = valeurConvertie;

        if (nouveauDebut !== null && nouvelleFin !== null) {
          element.setSelectionRange(nouveauDebut, nouvelleFin);
        }
      }

      element.addEventListener("input", (event) => {
        if (!event.isComposing) {
          convertirValeur();
        }
      });

      element.addEventListener("compositionend", convertirValeur);
      element.addEventListener("change", convertirValeur);

      convertirValeur();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialiserIdentiteAidant,
      { once: true }
    );
  } else {
    initialiserIdentiteAidant();
  }
})();

/* Nom en MAJUSCULES, prénom(s) avec l'initiale de chaque prénom en majuscule */
const enMaj = s => s.toLocaleUpperCase("fr-FR");
const enPrenom = s => s.toLocaleLowerCase("fr-FR")
  .replace(/(^|[\s'’-])(\p{L})/gu, (m, a, b) => a + b.toLocaleUpperCase("fr-FR"));
const REGLES = [
  ["[name=nom],[name=nom_marital],#aidant-nom", enMaj],
  ["[name=prenom],#aidant-prenom", enPrenom]
];
function corrige(e) {
  REGLES.forEach(([sel, fn]) => {
    if (!e.target.matches(sel)) return;
    const pos = e.target.selectionStart, v = fn(e.target.value);
    if (v !== e.target.value) { e.target.value = v; try { e.target.setSelectionRange(pos, pos); } catch (x) {} }
  });
}
document.addEventListener("input", corrige);
document.addEventListener("change", corrige);