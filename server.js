/* Serveur Agence Mitantsoa : code de confirmation, demandes, dossiers, registre Excel */
require("dotenv").config();
const express=require("express"),multer=require("multer"),cors=require("cors"),helmet=require("helmet"),
 rateLimit=require("express-rate-limit"),nodemailer=require("nodemailer"),ExcelJS=require("exceljs"),
 crypto=require("crypto"),fs=require("fs"),path=require("path");
const {PORT=3000,HOST="127.0.0.1",ALLOWED_ORIGIN,MODE_TEST="true",ADMIN_USER,ADMIN_PASS,NOTIF_EMAIL,
 SMTP_HOST,SMTP_PORT=587,SMTP_USER,SMTP_PASS,MAIL_FROM,BREVO_API_KEY,SMS_SENDER="Mitantsoa"}=process.env;

const DATA=path.join(__dirname,"data"),REG=path.join(DATA,"registre.jsonl");
fs.mkdirSync(path.join(DATA,"dossiers"),{recursive:true});
const app=express();app.set("trust proxy",1);app.use(helmet());
app.use(cors({origin:ALLOWED_ORIGIN?ALLOWED_ORIGIN.split(",").map(s=>s.trim()):false}));
app.use((req,res,next)=>{res.on("finish",()=>console.log(new Date().toLocaleTimeString(),req.method,req.url,res.statusCode));next()});
app.use(express.static(path.join(__dirname,"fiche")));
app.use(express.json({limit:"2mb"}));
const lim=n=>rateLimit({windowMs:15*60*1000,max:n,standardHeaders:true,legacyHeaders:false});

/* ---------- Outils ---------- */
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
const gen=()=>{const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return[...crypto.randomBytes(8)].map(b=>a[b%a.length]).join("")};
const phone=s=>{s=String(s).replace(/[\s.\-()]/g,"");if(s.startsWith("+"))return s.slice(1);if(s.startsWith("00"))return s.slice(2);
 if(/^0(692|693)/.test(s))return"262"+s.slice(1);if(s.startsWith("0"))return"33"+s.slice(1);return s};
const norm=d=>String(d).includes("@")?String(d).trim().toLowerCase():phone(d);
const tr=SMTP_HOST?nodemailer.createTransport({host:SMTP_HOST,port:+SMTP_PORT,secure:+SMTP_PORT==465,auth:{user:SMTP_USER,pass:SMTP_PASS}}):null;
const mail=(to,subject,text)=>{if(!tr)throw new Error("SMTP non configuré");return tr.sendMail({from:MAIL_FROM||SMTP_USER,to,subject,text})};
if(tr)tr.verify().then(()=>console.log("SMTP : connexion OK")).catch(e=>console.log("SMTP : ERREUR",e.message));else console.log("SMTP : non configuré (aucun e-mail ne sera envoyé)");
const sms=async(num,content)=>{if(!BREVO_API_KEY)throw new Error("SMS non configuré");
 const r=await fetch("https://api.brevo.com/v3/transactionalSMS/sms",{method:"POST",headers:{"api-key":BREVO_API_KEY,"content-type":"application/json"},
  body:JSON.stringify({sender:SMS_SENDER,recipient:num,content,type:"transactional"})});
 if(!r.ok)throw new Error("SMS HTTP "+r.status)};

/* ---------- 1. Code de confirmation (8 caractères) ---------- */
const otps=new Map(),verified=new Map();
app.post("/envoi",lim(15),async(req,res)=>{
 const {action,canal,dest}=req.body||{};
 if(typeof dest!=="string"||dest.length<5||dest.length>120)return res.status(400).json({ok:false});
 const k=norm(dest);
 if(action==="envoyer"){
  const o=otps.get(k);if(o&&Date.now()-o.sent<30000)return res.status(429).json({ok:false});
  const code=gen();otps.set(k,{hash:sha(code),exp:Date.now()+(15 * 60 * 1000),tries:0,sent:Date.now()});
  try{
   if(MODE_TEST==="true")console.log(`[TEST] code pour ${k} : ${code}`);
   else if(canal==="email")await mail(dest,"Votre code de confirmation",`Votre code Agence Mitantsoa : ${code} (valable 15 minutes).`);
   else await sms(k,`Agence Mitantsoa : votre code de confirmation est ${code} (valable 15 min).`);
  }catch(e){console.error("Envoi du code :",e.message);return res.status(502).json({ok:false})}
  return res.json({ok:true});
 }
 if(action==="verifier"){
  const o=otps.get(k),c=String(req.body.code||"").toUpperCase();
  if(!o||Date.now()>o.exp||++o.tries>5){otps.delete(k);return res.json({ok:false})}
  if(sha(c)!==o.hash)return res.json({ok:false});
  otps.delete(k);verified.set(k,Date.now());return res.json({ok:true});
 }
 res.status(400).json({ok:false});
});
// une demande n'est acceptée que si le téléphone ou l'e-mail a été vérifié depuis moins de 2 h
const isVerified=d=>[d&&d.tel,d&&d.email].filter(Boolean).some(x=>{const t=verified.get(norm(x));return t&&Date.now()-t<2*3600e3});

/* --- Conversion HTML -> PDF (nécessite : npm install puppeteer) --- */
let puppeteer=null;try{puppeteer=require("puppeteer")}catch(e){console.log("puppeteer absent : fiche et lettre resteront en HTML")}
let nav=null;
const navigateur=async()=>nav||(nav=await puppeteer.launch({headless:true}));
async function htmlToPdf(html,sortie){
 if(!puppeteer)throw new Error("puppeteer non installé");
 const p=await (await navigateur()).newPage();
 try{
  await p.setJavaScriptEnabled(false);                 // sécurité : aucun script du document n'est exécuté
  await p.setRequestInterception(true);                // sécurité : aucun accès réseau ni fichier
  p.on("request",r=>/^(data:|about:)/.test(r.url())?r.continue():r.abort());
  await p.setContent(html,{waitUntil:"load",timeout:20000});
  await p.pdf({path:sortie,format:"A4",printBackground:true,preferCSSPageSize:true,margin:{top:0,right:0,bottom:0,left:0}});
 }finally{await p.close()}
}

/* ---------- 2. Demandes et registre ---------- */

const REF=/^DEM-\d{8}-[A-Z0-9]{4}$/;
const dossierDir=ref=>{const d=path.join(DATA,"dossiers",ref);fs.mkdirSync(d,{recursive:true});return d};
const ajouter=(d,statut)=>{const r=d.demande||{},l=r.lt||{};
 fs.appendFileSync(REG,JSON.stringify({ref:d.reference,date:new Date().toISOString(),nom:d.nom,prenom:d.prenom,naissance:d.naissance,tel:d.tel,email:d.email,adresse:d.adresse,pole:r.pole,aide:r.aide,motif:d.motif,situation:(l.sit||[]).join(", "),statut,fichiers:(d._fichiers||[]).join(" | ")})+"\n");
 async function ecrireExcel(){
 const wb=await classeur();
 try{await wb.xlsx.writeFile(XLSX_PATH)}
 catch(e){
  if(e.code!=="EBUSY"&&e.code!=="EPERM")throw e;
  const copie=XLSX_PATH.replace(".xlsx","_a_jour.xlsx");
  await wb.xlsx.writeFile(copie);
  console.log("Excel ouvert : copie à jour enregistrée dans",copie);
 }
}
}
/* ---------- 3. Dossier complet (fiche, lettre, pièces) ---------- */
const up=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1048576,files:25}});
const NOM=/^(DEM-\d{8}-[A-Z0-9]{4})_\d{2}(?:-\d{2})?_[A-Za-z0-9-]{1,40}\.(pdf|png|jpg|html)$/;
const MAGIC={pdf:[0x25,0x50,0x44,0x46],png:[0x89,0x50,0x4e,0x47],jpg:[0xff,0xd8,0xff]};
const fichierOk=(f,ref)=>{const m=NOM.exec(f.originalname);if(!m||m[1]!==ref)return false;return m[2]==="html"||MAGIC[m[2]].every((b,i)=>f.buffer[i]===b)};
app.post("/dossier",lim(30),up.fields([{name:"fiche",maxCount:1},{name:"lettre",maxCount:1},{name:"pieces",maxCount:20}]),async(req,res)=>{
 try{
  const ref=req.body.reference,d=JSON.parse(req.body.donnees||"{}");
  if(!REF.test(ref||"")||d.reference!==ref||!isVerified(d))return res.status(403).json({ok:false});
  const fichiers=Object.values(req.files||{}).flat();
  if(fichiers.some(f=>!fichierOk(f,ref)))return res.status(400).json({ok:false,erreur:"fichier refusé"});
  const dir=dossierDir(ref),noms=[];
  for(const f of fichiers){
   if(f.originalname.endsWith(".html")){                // fiche et lettre : conversion en PDF
    const pdf=f.originalname.replace(/\.html$/,".pdf");
    try{await htmlToPdf(f.buffer.toString("utf8"),path.join(dir,pdf));noms.push(pdf);continue}
    catch(e){console.error("PDF :",e.message)}          // si la conversion échoue, on garde le HTML
   }
   fs.writeFileSync(path.join(dir,f.originalname),f.buffer);noms.push(f.originalname);
  }
  fs.writeFileSync(path.join(dir,ref+"_donnees.json"),JSON.stringify(d,null,1));
  d._fichiers=noms;ajouter(d,"Dossier complet");
  if(NOTIF_EMAIL&&tr)mail(NOTIF_EMAIL,"Nouveau dossier "+ref,`Dossier ${ref} reçu (${noms.length} fichiers) : ${d.prenom||""} ${d.nom||""} - ${(d.demande||{}).aide||""}`).catch(e=>console.error(e.message));
  res.json({ok:true});
 }catch(e){console.error(e.message);res.status(500).json({ok:false})}
});


/* ---------- 4. Registre Excel (protégé par mot de passe) ---------- */
const eq=(a,b)=>crypto.timingSafeEqual(Buffer.from(sha(a||"")),Buffer.from(sha(b||"")));
const auth=(req,res,next)=>{
 if(!ADMIN_USER||!ADMIN_PASS)return res.status(503).send("Accès admin non configuré");
 const [u,...p]=Buffer.from((req.headers.authorization||"").split(" ")[1]||"","base64").toString().split(":");
 if(eq(u,ADMIN_USER)&&eq(p.join(":"),ADMIN_PASS))return next();
 res.set("WWW-Authenticate",'Basic realm="Registre"').status(401).send("Accès refusé");
};

/* ---------- Registre Excel (enregistré aussi dans data/Registre_Mitantsoa.xlsx) ---------- */

const XLSX_PATH=path.join(DATA,"Registre_Mitantsoa.xlsx");
const frDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||"")?s.split("-").reverse().join("/"):(s||"");
async function classeur(){
 const l=fs.existsSync(REG)?fs.readFileSync(REG,"utf8").split("\n").filter(Boolean).map(x=>JSON.parse(x)):[];
 const m=new Map();
 l.forEach(x=>{const o=m.get(x.ref)||{debut:x.date};for(const k in x)if(x[k]!==""&&x[k]!=null)o[k]=x[k];m.set(x.ref,o)});
 const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet("Demandes");
 ws.columns=[{header:"N°",key:"n",width:6},{header:"Numéro de demande",key:"ref",width:24},{header:"Date",key:"d",width:12},{header:"Heure",key:"h",width:8},
  {header:"Nom",key:"nom",width:20},{header:"Prénom",key:"prenom",width:18},{header:"Date de naissance",key:"nai",width:14},{header:"Téléphone",key:"tel",width:15},
  {header:"E-mail",key:"email",width:28},{header:"Adresse",key:"adresse",width:34},{header:"Pôle",key:"pole",width:28},{header:"Aide demandée",key:"aide",width:24},
  {header:"Motif",key:"motif",width:40},{header:"Situation",key:"situation",width:30},{header:"Statut",key:"statut",width:16},{header:"Fichiers reçus",key:"fichiers",width:50}];
 [...m.values()].forEach((x,i)=>{const t=new Date(x.debut);
  ws.addRow({...x,n:i+1,d:t.toLocaleDateString("fr-FR"),h:t.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),nai:frDate(x.naissance)})});
 const b={style:"thin",color:{argb:"FF999999"}};
 ws.eachRow(r=>r.eachCell(c=>{c.border={top:b,left:b,bottom:b,right:b};c.alignment={vertical:"top",wrapText:true}}));
 const h=ws.getRow(1);h.height=28;
 h.eachCell(c=>{c.font={bold:true,color:{argb:"FFFFFFFF"},size:12};c.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF24463B"}};c.alignment={vertical:"middle",horizontal:"center",wrapText:true}});
 ws.views=[{state:"frozen",ySplit:1,xSplit:2}];ws.autoFilter={from:"A1",to:"P1"};
 return wb;
}
async function ecrireExcel(){await (await classeur()).xlsx.writeFile(XLSX_PATH)}
app.get("/admin/registre.xlsx",lim(30),auth,async(req,res)=>{
 const wb=await classeur();
 res.set({"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":'attachment; filename="Registre_Signatures_Mitantsoa.xlsx"'});
 await wb.xlsx.write(res);res.end();
});
 
/* ---------- Vérifier un numéro de demande : http://127.0.0.1:3000/admin/verifier/DEM-AAAAMMJJ-XXXX ---------- */
app.get("/admin/verifier/:ref",lim(60),auth,(req,res)=>{
 const ref=String(req.params.ref||"").toUpperCase(),E=s=>String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 if(!REF.test(ref))return res.status(400).send("Numéro invalide : format attendu DEM-AAAAMMJJ-XXXX");
 const dir=path.join(DATA,"dossiers",ref),ok=fs.existsSync(dir);let d={};
 if(ok)try{d=JSON.parse(fs.readFileSync(path.join(dir,ref+"_donnees.json"),"utf8"))}catch(e){}
 const r=d.demande||{};
 res.send(`<!doctype html><meta charset="utf-8"><title>Vérification ${E(ref)}</title><body style="font-family:Arial,sans-serif;max-width:560px;margin:30px auto;line-height:1.6"><h2 style="color:${ok?"#24463B":"#B3382C"}">${ok?"✔ Demande trouvée":"✖ Numéro introuvable"} : ${E(ref)}</h2>${ok?`<p><b>${E(d.prenom)} ${E(d.nom)}</b><br>${E(r.aide)} (${E(r.pole)})<br>${E(d.tel)} · ${E(d.email)}</p><p>Fichiers enregistrés :</p><ul>${fs.readdirSync(dir).map(f=>"<li>"+E(f)+"</li>").join("")}</ul>`:"<p>Aucun dossier enregistré avec ce numéro.</p>"}</body>`);
});

app.get("/",(q,r)=>r.send("Serveur Agence Mitantsoa : en ligne"));
app.listen(PORT,HOST,()=>console.log(`Serveur Mitantsoa sur http://${HOST}:${PORT} (MODE_TEST=${MODE_TEST})`));

app.use(express.static("D:/MitantsoaAgency/fiche-mitantsoa/fiche-mitantsoa"));

const app=express();app.set("trust proxy",1);
app.use(helmet({
 contentSecurityPolicy:{
  directives:{
   ...helmet.contentSecurityPolicy.getDefaultDirectives(),
   "connect-src":["'self'","https://data.geopf.fr"]
  }
 }
}));
