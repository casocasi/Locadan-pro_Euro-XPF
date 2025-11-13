// =============================
// Données locales (initialisation)
// =============================
let data = {
  proprietaires: JSON.parse(localStorage.getItem("proprietaires") || "[]"),
  biens: JSON.parse(localStorage.getItem("biens") || "[]"),
  locataires: JSON.parse(localStorage.getItem("locataires") || "[]"),
  loyers: JSON.parse(localStorage.getItem("loyers") || "[]"),
  encaissements: JSON.parse(localStorage.getItem("encaissements") || "[]"),
  quittances: JSON.parse(localStorage.getItem("quittances") || "[]"),
  revisions: JSON.parse(localStorage.getItem("revisions") || "[]"),
  depenses: JSON.parse(localStorage.getItem("depenses") || "[]"),
  documents: JSON.parse(localStorage.getItem("documents") || "[]")
};

// =============================
// DEVISE AFFICHAGE + CONVERSION
// =============================
const DEVISE_KEY   = "devise_display";         // € ou XPF
const TAUX_EUR_XPF = 119.33;                   // fixe

let CURRENT_DEVISE = localStorage.getItem(DEVISE_KEY) || "€";

// formate un montant (€ stocké en mémoire) vers la devise choisie
function fmtDevise(montantEUR){
  const val = parseFloat(montantEUR)||0;
  if(CURRENT_DEVISE === "€") return `€${val.toFixed(2)}`;
  return `${Math.ceil(val * TAUX_EUR_XPF / 1000) * 1000} XPF`;
}

// toggle € ↔ XPF
function toggleDevise(){
  CURRENT_DEVISE = CURRENT_DEVISE === "€" ? "XPF" : "€";
  localStorage.setItem(DEVISE_KEY, CURRENT_DEVISE);
  document.getElementById("devise-label").textContent = CURRENT_DEVISE;
  refreshAll();
}

// branchement du bouton (dashboard uniquement)
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-devise");
  if(btn){
    btn.addEventListener("click", toggleDevise);
    document.getElementById("devise-label").textContent = CURRENT_DEVISE;
  }
});

// =============================
// Helpers
// =============================
function safeGet(id){ return document.getElementById(id); }
function saveData(){ for(const k in data) localStorage.setItem(k, JSON.stringify(data[k])); }
function fmtAmount(v){ return (Number(v)||0).toFixed(2); }
function fmtDateFR(d){ if(!d) return ""; const t = new Date(d); return t.toLocaleDateString("fr-FR"); }
function escapeHtml(s){ if(s===undefined||s===null) return ""; return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

// =============================
// NAVIGATION
// =============================
const menuButtons = document.querySelectorAll("aside button");
function showSection(id){
  document.querySelectorAll("main section").forEach(sec=>sec.classList.remove("active"));
  const el = document.getElementById(id);
  if(el) el.classList.add("active");
  menuButtons.forEach(b => b.classList.toggle("active", b.id === ("btn-" + id.split("-")[1])));
}
safeGet("btn-dashboard") && (safeGet("btn-dashboard").onclick = ()=> showSection("section-dashboard"));
safeGet("btn-proprietaires") && (safeGet("btn-proprietaires").onclick = ()=> showSection("section-proprietaires"));
safeGet("btn-biens") && (safeGet("btn-biens").onclick = ()=> showSection("section-biens"));
safeGet("btn-locataires") && (safeGet("btn-locataires").onclick = ()=> showSection("section-locataires"));
safeGet("btn-loyers") && (safeGet("btn-loyers").onclick = ()=> showSection("section-loyers"));
safeGet("btn-encaissements") && (safeGet("btn-encaissements").onclick = ()=> showSection("section-encaissements"));
safeGet("btn-depenses") && (safeGet("btn-depenses").onclick = ()=> showSection("section-depenses"));
safeGet("btn-quittances") && (safeGet("btn-quittances").onclick = ()=> showSection("section-quittances"));
safeGet("btn-revisions") && (safeGet("btn-revisions").onclick = ()=> showSection("section-revisions"));
safeGet("btn-documents") && (safeGet("btn-documents").onclick = ()=> showSection("section-documents"));

// =============================
// DASHBOARD
// =============================
function refreshDashboard(){
  safeGet("dash-proprietaires-count").textContent = data.proprietaires.length;
  safeGet("dash-biens-count").textContent = data.biens.length;
  safeGet("dash-locataires-count").textContent = data.locataires.length;
  safeGet("dash-encaissements-count").textContent = data.encaissements.length;
  const totalEnc = data.encaissements.reduce((s,e)=> s + Number(e.montant||0), 0);
  safeGet("dash-encaissements-total").textContent = fmtDevise(totalEnc);

  const totalLoyers = data.loyers.reduce((s,l) => s + Number(l.montant||0), 0);
  const percent = totalLoyers > 0 ? Math.min(100, Math.round((totalEnc/totalLoyers)*100)) : 0;
  animateProgress(percent);
  refreshTauxRemplissage();
}

function animateProgress(target) {
  const circle = safeGet("progress-circle");
  if (!circle) return;
  let current = 0;
  const step = () => {
    current += Math.ceil((target - current) / 5);
    if (current > target) current = target;
    let color = "#10b981";
    if (current < 40) color = "#dc2626";
    else if (current < 70) color = "#f59e0b";
    circle.style.background = `conic-gradient(${color} ${current}%, #e5e7eb 0%)`;
    circle.textContent = current + "%";
    if (current < target) requestAnimationFrame(step);
  };
  step();
}

function refreshEncaissementsSummary(){
  const total = data.encaissements.reduce((s,e)=> s + Number(e.montant||0), 0);
  const dateStr = new Date().toLocaleDateString("fr-FR");
  const elTotal = safeGet("encaissements-total");
  const elDate = safeGet("encaissements-date");
  if(elTotal) elTotal.textContent = fmtDevise(total);
  if(elDate) elDate.textContent = dateStr;
}

function refreshDepensesSummary(){
  const total = (Array.isArray(data.depenses) ? data.depenses : []).reduce((s,d)=> s + (Number(d.montant)||0), 0);
  const elTotal = safeGet("depenses-total");
  const elDate = safeGet("depenses-date");
  const dashEl = safeGet("dash-depenses-total");
  if(elTotal) elTotal.textContent = fmtDevise(total);
  if(elDate) elDate.textContent = new Date().toLocaleDateString("fr-FR");
  if(dashEl) dashEl.textContent = fmtDevise(total);
}

function refreshTauxRemplissage() {
  const totalBiens = data.biens.length;
  const totalLocataires = data.locataires.length;
  const taux = totalBiens > 0 ? Math.min(100, Math.round((totalLocataires / totalBiens) * 100)) : 0;
  const el = document.getElementById("taux-remplissage");
  if (el) el.textContent = taux + "%";
}

// =============================
// GENERIC TABLE RENDER
// =============================
function renderTable(name, fields){
  const tbody = safeGet(name + "-table-body");
  if(!tbody) return;
  tbody.innerHTML = "";

  let items = Array.isArray(data[name]) ? data[name].slice() : [];

  if(name === "encaissements"){
    items.sort((a,b)=> {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });
  }

  items.forEach((item, renderIndex) => {
    let originalIndex = (name === "encaissements") ? data.encaissements.findIndex(x => x === item) : renderIndex;

    const tr = document.createElement("tr");
    fields.forEach(f => {
      const td = document.createElement("td");
      if(f === "date") td.textContent = item[f] ? fmtDateFR(item[f]) : "";
      else if(f === "montant" || f === "loyer" || f === "ancien" || f === "nouveau") td.textContent = fmtDevise(item[f]);
      else td.textContent = item[f] || "";
      tr.appendChild(td);
    });

    const tdAction = document.createElement("td");
    tdAction.style.textAlign = "center";
    tdAction.innerHTML = `<button class="btn" data-act="edit">✏️</button><button class="btn danger" data-act="del">🗑️</button>`;
    tr.appendChild(tdAction);

    tdAction.querySelector("[data-act='edit']").onclick = () => openModal(name, originalIndex);
    tdAction.querySelector("[data-act='del']").onclick = () => {
      if(!confirm("Confirmer la suppression ?")) return;
      data[name].splice(originalIndex, 1);
      saveData(); refreshAll();
    };

    if(name === "encaissements" || name === "depenses" || name === "quittances" || name === "revisions"){
      const printBtn = document.createElement("button");
      printBtn.className = "btn print"; printBtn.textContent = "🖨️"; printBtn.style.marginLeft = "6px";
      printBtn.onclick = () => {
        if(name==="encaissements") printSingleEncaissement(item);
        if(name==="depenses") printSingleDepense(item);
        if(name==="quittances") printSingleQuittance(item);
        if(name==="revisions") printSingleRevision(item);
      };
      tdAction.appendChild(printBtn);
    }

    tbody.appendChild(tr);
  });
}

// =============================
// MODAL (Ajouter / Éditer)
// =============================
const modal = safeGet("modal-container");
const modalContent = safeGet("modal-content");
function openModal(type, idx = null){
  if(!modal || !modalContent) return;
  modal.style.display = "flex";
  modalContent.innerHTML = "";

  const fieldsMap = {
    proprietaires: [{id:"nom",label:"Nom"},{id:"prenom",label:"Prénom"},{id:"tel",label:"Téléphone"},{id:"email",label:"Email"}],
    biens: [{id:"bien",label:"Bien"},{id:"adresse",label:"Adresse"},{id:"type",label:"Type",type:"select",options:["Appartement","Maison","Studio","Local"]},{id:"surface",label:"Surface (m²)"},{id:"chambres",label:"Chambres"},{id:"infos",label:"Infos"},{id:"loyer",label:"Loyer (€)"}],
    locataires: [{id:"nom",label:"Nom"},{id:"prenom",label:"Prénom"},{id:"tel",label:"Téléphone"},{id:"notes",label:"Notes"}],
    loyers: [{id:"locataire",label:"Locataire",type:"select",optionsFrom:"locataires",optionValue:"nom"},{id:"bien",label:"Bien",type:"select",optionsFrom:"biens",optionValue:"bien"},{id:"montant",label:"Montant (€)"},{id:"date",label:"Date",type:"date"}],
    encaissements: [{id:"date",label:"Date",type:"date"},{id:"locataire",label:"Locataire",type:"select",optionsFrom:"locataires",optionValue:"nom"},{id:"bien",label:"Bien",type:"select",optionsFrom:"biens",optionValue:"bien"},{id:"methode",label:"Méthode",type:"select",options:["Virement","Chèque","Espèces"]},{id:"montant",label:"Montant (€)"}],
    quittances: [{id:"locataire",label:"Locataire",type:"select",optionsFrom:"locataires",optionValue:"nom"},{id:"montant",label:"Montant (€)"},{id:"date",label:"Date de paiement",type:"date"}],
    revisions: [{id:"bien",label:"Bien",type:"select",optionsFrom:"biens",optionValue:"bien"},{id:"ancien",label:"Ancien Loyer (€)"},{id:"nouveau",label:"Nouveau Loyer (€)"},{id:"date",label:"Date de révision",type:"date"}],
    depenses: [{ id: "date", label: "Date", type: "date" },{ id: "categorie", label: "Catégorie", type: "select", options: ["Réparations","Assurances","Charges","Taxes","Autres"] },{ id: "description", label: "Description" },{ id: "montant", label: "Montant (€)" }]
  };

  const item = (idx !== null && Array.isArray(data[type])) ? data[type][idx] : {};
  const title = idx !== null ? `Éditer ${type}` : `Ajouter ${type}`;

  const win = document.createElement("div");
  win.className = "modal-window";
  let inner = `<div class="modal-head">${escapeHtml(title)} <button id="modal-close" class="btn ghost">✖</button></div><div class="modal-body">`;

  (fieldsMap[type] || []).forEach(f=>{
    inner += `<label>${escapeHtml(f.label)}</label>`;
    if(f.type === "select"){
      inner += `<select id="modal-${f.id}" class="mb-2">`;
      if(f.options && Array.isArray(f.options)){
        f.options.forEach(opt => {
          const sel = (item[f.id] && item[f.id] === opt) ? "selected" : "";
          inner += `<option value="${escapeHtml(opt)}" ${sel}>${escapeHtml(opt)}</option>`;
        });
      } else if(f.optionsFrom && Array.isArray(data[f.optionsFrom])){
        const key = f.optionValue || Object.keys(data[f.optionsFrom][0]||{})[0] || null;
        data[f.optionsFrom].forEach(obj => {
          const val = key ? (obj[key] || "") : JSON.stringify(obj);
          const sel = (item[f.id] && item[f.id] === val) ? "selected" : "";
          inner += `<option value="${escapeHtml(val)}" ${sel}>${escapeHtml(val)}</option>`;
        });
      }
      inner += `</select>`;
    } else {
      const inputType = f.type === "date" ? "date" : "text";
      const value = (f.type === "date" && item[f.id]) ? new Date(item[f.id]).toISOString().split("T")[0] : (item[f.id] || "");
      inner += `<input type="${inputType}" id="modal-${f.id}" value="${escapeHtml(value)}">`;
    }
  });

  inner += `<div class="modal-actions"><button id="cancel-btn" class="btn ghost">Annuler</button><button id="save-btn" class="btn primary">💾 Enregistrer</button></div></div>`;
  win.innerHTML = inner;
  modalContent.appendChild(win);

  safeGet("modal-close").onclick = closeModal;
  safeGet("cancel-btn").onclick = closeModal;

  safeGet("save-btn").onclick = () => {
    try {
      const newItem = {};
      (fieldsMap[type] || []).forEach(f=>{
        const el = safeGet(`modal-${f.id}`);
        newItem[f.id] = el ? el.value.trim() : "";
      });

      if(idx !== null && Array.isArray(data[type])) data[type][idx] = newItem;
      else if(Array.isArray(data[type])) data[type].push(newItem);

      saveData();
      refreshAll();
    } catch (e) {
      console.error("Erreur lors de la sauvegarde :", e);
    } finally {
	  closeModal();
    }
  };

  makeModalDraggable(win);
  const firstInput = win.querySelector("input,select,textarea,button");
  if(firstInput) firstInput.focus();
}

function closeModal(){  
  if(!modal) return;
  modal.style.display = "none";
  modalContent.innerHTML = "";
}

function makeModalDraggable(win){
  if(!win) return;
  if(win._dragAttached) return;
  win._dragAttached = true;
  const head = win.querySelector(".modal-head");
  if(!head) return;
  let dragging = false, offX=0, offY=0;
  head.addEventListener("mousedown", (e)=>{
    dragging = true;
    const rect = win.getBoundingClientRect();
    offX = e.clientX - rect.left;
    offY = e.clientY - rect.top;
    win.style.position = "absolute";
    win.style.zIndex = 9999;
    document.body.style.userSelect = "none";
  });
  document.addEventListener("mousemove", (e)=>{
    if(!dragging) return;
    win.style.left = (e.clientX - offX) + "px";
    win.style.top = (e.clientY - offY) + "px";
  });
  document.addEventListener("mouseup", ()=>{
    dragging = false;
    document.body.style.userSelect = "auto";
  });
}

// =============================
// RENDER FUNCTIONS
// =============================
function renderProprietaires(){ renderTable("proprietaires", ["nom","prenom","tel","email"]); }
function renderBiens(){ renderTable("biens", ["bien","adresse","type","surface","chambres","infos","loyer"]); }
function renderLocataires(){ renderTable("locataires", ["nom","prenom","tel","notes"]); }
function renderLoyers(){ renderTable("loyers", ["locataire","bien","montant","date"]); }
function renderEncaissements(){ renderTable("encaissements", ["date","locataire","bien","methode","montant"]); }
function renderQuittances(){ renderTable("quittances", ["locataire","montant","date"]); }
function renderRevisions(){ renderTable("revisions", ["bien","ancien","nouveau","date"]); }
function renderDepenses(){ renderTable("depenses", ["date", "categorie", "description", "montant"]); }
function renderDocuments(){ renderDocumentsTable(); }

// =============================
// DOCUMENTS (IndexedDB)
// =============================
const DOC_DB_NAME = "locadan-docs";
const DOC_DB_STORE = "documents";
let docsDB = null;

function initDocsDB() {
  return new Promise((resolve, reject) => {
    if (docsDB) return resolve(docsDB);
    const req = indexedDB.open(DOC_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DOC_DB_STORE)) {
        const store = db.createObjectStore(DOC_DB_STORE, { keyPath: "id", autoIncrement: true });
        store.createIndex("name", "name", { unique: false });
      }
    };
    req.onsuccess = (e) => { docsDB = e.target.result; resolve(docsDB); };
    req.onerror = (e) => reject(e.target.error);
  });
}

async function addFilesToDocsDB(files) {
  await initDocsDB();
  return new Promise((resolve, reject) => {
    const tx = docsDB.transaction(DOC_DB_STORE, "readwrite");
    const store = tx.objectStore(DOC_DB_STORE);
    for (const f of files) {
      store.add({ name: f.name, size: f.size, type: f.type, date: new Date().toISOString(), blob: f });
    }
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
}

async function getAllDocsFromDB() {
  await initDocsDB();
  return new Promise((resolve, reject) => {
    const tx = docsDB.transaction(DOC_DB_STORE, "readonly");
    const store = tx.objectStore(DOC_DB_STORE);
    const req = store.getAll();
    req.onsuccess = (e) => resolve(e.target.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function deleteDocFromDB(id) {
  await initDocsDB();
  return new Promise((resolve, reject) => {
    const tx = docsDB.transaction(DOC_DB_STORE, "readwrite");
    const store = tx.objectStore(DOC_DB_STORE);
    store.delete(Number(id));
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
}

function openBlobInNewTab(blob, filename) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "fichier";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

async function renderDocumentsTable() {
  const tbody = safeGet("documents-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const docs = await getAllDocsFromDB();

  if (docs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="padding:12px;color:#6b7280;text-align:center">Aucun document importé</td></tr>`;
    return;
  }

  docs.forEach(d => {
    const size = (d.size / 1024 / 1024).toFixed(1) + " Mo";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(d.name)}</td>
      <td>${size}</td>
      <td style="text-align:center">
        <button class="btn" data-act="download" data-id="${d.id}">⬇️ Télécharger</button>
        <button class="btn" data-act="view" data-id="${d.id}">👁️ Visualiser</button>
        <button class="btn danger" data-act="del" data-id="${d.id}">🗑️ Supprimer</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button").forEach(btn => {
    const act = btn.dataset.act, id = btn.dataset.id;
    btn.onclick = async () => {
      const docs = await getAllDocsFromDB();
      const d = docs.find(x => x.id == id);
      if (!d) return alert("Fichier introuvable");
      if (act === "view") openBlobInNewTab(d.blob, d.name);
      if (act === "download") downloadBlob(d.blob, d.name);
      if (act === "del" && confirm("Supprimer ce document ?")) {
        await deleteDocFromDB(id);
        await renderDocumentsTable();
      }
    };
  });
}

safeGet("btn-import-doc") && (safeGet("btn-import-doc").onclick = async () => {
  const input = safeGet("file-input");
  if (!input.files.length) return alert("Veuillez choisir un fichier.");
  await addFilesToDocsDB(input.files);
  input.value = "";
  await renderDocumentsTable();
});

// =============================
// PDF PRINT FUNCTIONS
// =============================
function printSingleQuittance(q){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFillColor(102,51,153); doc.rect(0,0,210,30,"F");
  doc.setTextColor(255,255,255); doc.setFontSize(20); doc.text("QUITTANCE",105,18,{align:"center"});
  doc.setTextColor(0,0,0); doc.setFontSize(12);
  let y = 48;
  doc.text(`Locataire : ${q.locataire||"N/A"}`,20,y); y+=8;
  doc.text(`Montant : ${fmtDevise(q.montant||0)}`,20,y); y+=8;
  doc.text(`Date : ${q.date? fmtDateFR(q.date) : ""}`,20,y); y+=12;
  doc.setFont("helvetica","italic"); doc.text("Cette quittance atteste le paiement du loyer.",20,y,{maxWidth:170}); y+=18;
  doc.setFont("helvetica","normal"); doc.text(`Fait à __________________, le ${new Date().toLocaleDateString("fr-FR")}`,20,y); y+=20;
  doc.text("Signature du propriétaire :",20,y); doc.line(80,y+2,150,y+2);
  window.open(URL.createObjectURL(doc.output("blob")), "_blank");
}

function printSingleRevision(r){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFillColor(0,102,204); doc.rect(0,0,210,30,"F");
  doc.setTextColor(255,255,255); doc.setFontSize(20); doc.text("RÉVISION DE LOYER",105,18,{align:"center"});
  doc.setTextColor(0,0,0); doc.setFontSize(12);
  let y=48;
  doc.text(`Bien : ${r.bien||"N/A"}`,20,y); y+=8;
  doc.text(`Ancien : ${fmtDevise(r.ancien||0)}`,20,y); y+=8;
  doc.text(`Nouveau : ${fmtDevise(r.nouveau||0)}`,20,y); y+=8;
  doc.text(`Date : ${r.date? fmtDateFR(r.date) : ""}`,20,y); y+=12;
  doc.setFont("helvetica","italic"); doc.text("Cette révision atteste que le montant du loyer est modifié.",20,y,{maxWidth:170}); y+=18;
  doc.setFont("helvetica","normal"); doc.text(`Fait à __________________, le ${new Date().toLocaleDateString("fr-FR")}`,20,y); y+=20;
  doc.text("Signature du propriétaire :",20,y); doc.line(80,y+2,150,y+2);
  window.open(URL.createObjectURL(doc.output("blob")), "_blank");
}

function printSingleEncaissement(e){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFillColor(0,102,204); doc.rect(0,0,210,30,"F");
  doc.setTextColor(255,255,255); doc.setFontSize(18); doc.text("ENCAISSEMENT",105,18,{align:"center"});
  doc.setTextColor(0,0,0); doc.setFontSize(12);
  let y=48;
  doc.text(`Date : ${e.date? fmtDateFR(e.date):""}`,20,y); y+=8;
  doc.text(`Locataire : ${e.locataire||""}`,20,y); y+=8;
  doc.text(`Bien : ${e.bien||""}`,20,y); y+=8;
  doc.text(`Méthode : ${e.methode||""}`,20,y); y+=8;
  doc.text(`Montant : ${fmtDevise(e.montant||0)}`,20,y);
  window.open(URL.createObjectURL(doc.output("blob")), "_blank");
}

function printSingleDepense(depense){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFillColor(204, 0, 0);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("DÉPENSE", 105, 18, { align: "center" });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  let y = 48;
  doc.text(`Date : ${depense.date ? fmtDateFR(depense.date) : ""}`, 20, y); y += 8;
  doc.text(`Catégorie : ${depense.categorie || ""}`, 20, y); y += 8;
  doc.text(`Description : ${depense.description || ""}`, 20, y); y += 8;
  doc.text(`Montant : ${fmtDevise(depense.montant||0)}`, 20, y);
  window.open(URL.createObjectURL(doc.output("blob")), "_blank");
}

// =============================
// GLOBAL PDF EXPORTS
// =============================
safeGet("btn-print-pdf") && (safeGet("btn-print-pdf").onclick = ()=>{
  const enc = data.encaissements.slice().sort((a,b)=> (b.date?new Date(b.date).getTime():0) - (a.date?new Date(a.date).getTime():0));
  if(enc.length === 0){ alert("Aucun encaissement à imprimer."); return; }
  const { jsPDF } = window.jspdf; const doc = new jsPDF();
  doc.setFillColor(0,102,204); doc.rect(0,0,210,25,"F");
  doc.setTextColor(255,255,255); doc.setFontSize(16); doc.text("Historique des Encaissements",105,15,{align:"center"});
  doc.setTextColor(0,0,0); doc.setFontSize(11); doc.text(`Date du rapport : ${new Date().toLocaleDateString("fr-FR")}`,14,34);
  let y=46; doc.setFont("helvetica","bold"); doc.text("Date",14,y); doc.text("Locataire",50,y); doc.text("Bien",110,y); doc.text("Méthode",150,y); doc.text("Montant",190,y,{align:"right"});
  doc.setFont("helvetica","normal"); y+=8;
  let total=0;
  enc.forEach(item=>{
    doc.text(item.date? fmtDateFR(item.date):"",14,y);
    doc.text(item.locataire||"",50,y);
    doc.text(item.bien||"",110,y);
    doc.text(item.methode||"",150,y);
    doc.text(fmtDevise(item.montant||0),190,y,{align:"right"});
    total += Number(item.montant||0);
    y+=8;
    if(y>270){ doc.addPage(); y=20; }
  });
  doc.setFont("helvetica","bold"); doc.text("TOTAL :",140,y+8); doc.text(fmtDevise(total),190,y+8,{align:"right"});
  window.open(URL.createObjectURL(doc.output("blob")), "_blank");
});

safeGet("btn-print-depenses") && (safeGet("btn-print-depenses").onclick = () => {
  const depenses = data.depenses.slice().sort((a, b) => (b.date ? new Date(b.date) - new Date(a.date) : 0));
  if (depenses.length === 0) { alert("Aucune dépense à imprimer."); return; }
  const { jsPDF } = window.jspdf; const doc = new jsPDF();
  doc.setFillColor(204, 0, 0); doc.rect(0, 0, 210, 25, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.text("Historique des Dépenses", 105, 15, { align: "center" });
  doc.setTextColor(0, 0, 0); doc.setFontSize(11); doc.text(`Date du rapport : ${new Date().toLocaleDateString("fr-FR")}`, 14, 34);
  let y = 46; doc.setFont("helvetica", "bold");
  doc.text("Date", 14, y); doc.text("Catégorie", 50, y); doc.text("Description", 100, y); doc.text("Montant", 190, y, { align: "right" });
  y += 8; doc.setFont("helvetica", "normal"); let total = 0;
  depenses.forEach((d) => {
    doc.text(d.date ? fmtDateFR(d.date) : "", 14, y);
    doc.text(d.categorie || "", 50, y);
    doc.text((d.description || "").substring(0, 40), 100, y);
    doc.text(fmtDevise(d.montant||0), 190, y, { align: "right" });
    total += Number(d.montant) || 0; y += 8; if (y > 270) { doc.addPage(); y = 20; }
  });
  doc.setFont("helvetica", "bold"); doc.text("TOTAL :", 140, y + 8); doc.text(fmtDevise(total), 190, y + 8, { align: "right" });
  window.open(URL.createObjectURL(doc.output("blob")), "_blank");
});

safeGet("btn-print-quittance") && (safeGet("btn-print-quittance").onclick = ()=>{
  const q = data.quittances.slice();
  if(q.length===0){ alert("Aucune quittance à imprimer."); return; }
  const { jsPDF } = window.jspdf; const doc = new jsPDF();
  doc.setFillColor(102,51,153); doc.rect(0,0,210,25,"F");
  doc.setTextColor(255,255,255); doc.setFontSize(16); doc.text("Historique des Quittances",105,15,{align:"center"});
  doc.setTextColor(0,0,0); doc.setFontSize(11); doc.text(`Date du rapport : ${new Date().toLocaleDateString("fr-FR")}`,14,34);
  let y=46; doc.setFont("helvetica","bold"); doc.text("Locataire",14,y); doc.text("Montant",100,y); doc.text("Date",160,y);
  doc.setFont("helvetica","normal"); y+=8;
  q.forEach(item=>{
    doc.text(item.locataire||"",14,y); doc.text(fmtDevise(item.montant||0),100,y); doc.text(item.date? fmtDateFR(item.date):"",160,y);
    y+=8; if(y>270){doc.addPage(); y=20;}
  });
  window.open(URL.createObjectURL(doc.output("blob")), "_blank");
});

safeGet("btn-print-revisions") && (safeGet("btn-print-revisions").onclick = ()=>{
  const r = data.revisions.slice();
  if(r.length===0){ alert("Aucune révision à imprimer."); return; }
  const { jsPDF } = window.jspdf; const doc = new jsPDF();
  doc.setFillColor(0,102,0); doc.rect(0,0,210,25,"F");
  doc.setTextColor(255,255,255); doc.setFontSize(16); doc.text("Historique des Révisions de Loyers",105,15,{align:"center"});
  doc.setTextColor(0,0,0); doc.setFontSize(11); doc.text(`Date du rapport : ${new Date().toLocaleDateString("fr-FR")}`,14,34);
  let y=46; doc.setFont("helvetica","bold"); doc.text("Bien",14,y); doc.text("Ancien",80,y); doc.text("Nouveau",120,y); doc.text("Date",170,y);
  doc.setFont("helvetica","normal"); y+=8;
  r.forEach(item=>{
    doc.text(item.bien||"",14,y); doc.text(fmtDevise(item.ancien||0),80,y); doc.text(fmtDevise(item.nouveau||0),120,y); doc.text(item.date?fmtDateFR(item.date):"",170,y);
    y+=8; if(y>270){doc.addPage();y=20;}
  });
  window.open(URL.createObjectURL(doc.output("blob")), "_blank");
});

// =============================
// ADD BUTTONS
// =============================
safeGet("btn-add-proprietaire") && (safeGet("btn-add-proprietaire").onclick = ()=> openModal("proprietaires"));
safeGet("btn-add-bien") && (safeGet("btn-add-bien").onclick = ()=> openModal("biens"));
safeGet("btn-add-locataire") && (safeGet("btn-add-locataire").onclick = ()=> openModal("locataires"));
safeGet("btn-add-loyer") && (safeGet("btn-add-loyer").onclick = ()=> openModal("loyers"));
safeGet("btn-add-encaissement") && (safeGet("btn-add-encaissement").onclick = ()=> openModal("encaissements"));
safeGet("btn-add-quittance") && (safeGet("btn-add-quittance").onclick = ()=> openModal("quittances"));
safeGet("btn-add-revision") && (safeGet("btn-add-revision").onclick = ()=> openModal("revisions"));
safeGet("btn-add-depense") && (safeGet("btn-add-depense").onclick = ()=> openModal("depenses"));

// =============================
// BADGES NOMBRES DANS LE MENU
// =============================
function refreshBadgeCounts(){
  const badges = {
    "btn-proprietaires": data.proprietaires.length,
    "btn-biens": data.biens.length,
    "btn-locataires": data.locataires.length,
    "btn-encaissements": data.encaissements.length,
    "btn-depenses": data.depenses.length,
  };
  for(let id in badges){
    const btn = safeGet(id);
    if(btn){
      let b = btn.querySelector('.badge');
      if(!b){ b = document.createElement('span'); b.className='badge'; btn.appendChild(b); }
      b.textContent = badges[id];
    }
  }
}

// =============================
// REFRESH ALL
// =============================
function refreshAll() {
  renderProprietaires();
  renderBiens();
  renderLocataires();
  renderLoyers();
  renderEncaissements();
  renderDepenses();
  renderQuittances();
  renderRevisions();
  renderDocuments();
  refreshDashboard();
  refreshEncaissementsSummary();
  refreshDepensesSummary();
  refreshBadgeCounts();
}

// =============================
// SAUVEGARDE / RESTAURATION
// =============================
function backupData() {
  try {
    const exportObj = { ...data };
    const jsonStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "locadan_sauvegarde.json";
    a.click();
    URL.revokeObjectURL(url);
    alert("✅ Sauvegarde effectuée avec succès !");
  } catch (err) {
    console.error(err);
    alert("❌ Erreur lors de la sauvegarde.");
  }
}

function restoreData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!imported || typeof imported !== "object") {
          alert("❌ Fichier invalide !");
          return;
        }
        Object.keys(data).forEach(k => {
          if (imported[k]) data[k] = imported[k];
        });
        saveData();
        refreshAll();
        alert("✅ Données restaurées avec succès !");
      } catch (err) {
        console.error(err);
        alert("❌ Erreur lors de la restauration du fichier !");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// =============================
// INIT
// =============================
(function init(){
  refreshAll();
  showSection("section-dashboard");
})();
