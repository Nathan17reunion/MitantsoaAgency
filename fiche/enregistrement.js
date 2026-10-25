/* Page de confirmation : affiche le résumé de la dernière demande enregistrée */
const $=s=>document.querySelector(s);
const d=JSON.parse(sessionStorage.getItem("mit-derniere")||"null");
if(d){
 $("#ref").textContent="N° "+d.ref;
 $("#donetxt").textContent=`Merci ${d.prenom}. Votre fiche a été signée et enregistrée le ${d.quand}. Conservez ce numéro.`;
}else{
 $("#done").innerHTML='<h2>Aucune demande en cours</h2><p class="sub">Remplissez d’abord la fiche de renseignements.</p><div class="nav" style="justify-content:center"><a class="btn bp" href="fiche.html" style="text-decoration:none">Aller à la fiche</a></div>';
}
if($("#home"))$("#home").onclick=home;
