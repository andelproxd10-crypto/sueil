const KEY = "sueil-v2";
const SESSION = "sueil-abierta";
const DEMO_MODE = (() => {
  try { return new URLSearchParams(location.search).has("demo"); } catch (err) { return false; }
})();
const DEMO_NAMES = new Set(["Elena Vargas", "Camila Ruiz", "Sofía Hernández", "Rosa Méndez"]);

const CLOUD_URL = "https://rmqdfrwcnvwntabatzkw.supabase.co";
const CLOUD_KEY = "sb_publishable_uYdwwxosWdfWWe0mkqNB5w_jeTvt-q_";
const IA_URL = `${CLOUD_URL}/functions/v1/ia-chat`;

const GROUPS = [
  { id: "playera", label: "Playera", file: "playera.png", kinds: ["Blusa", "Camisa", "Playera"] },
  { id: "pantalon", label: "Pantalón", file: "pantalon.png", kinds: ["Pantalón", "Jean", "Pans", "Pantalón de vestir"] },
  { id: "vestido", label: "Vestido", file: "vestido.png", kinds: ["V. casual", "V. fiesta"] },
  { id: "falda", label: "Falda", file: "falda.png", kinds: ["Falda", "Falda corta", "Falda larga"] },
  { id: "novia", label: "Novia / XV", file: "novia.png", kinds: ["Novia", "XV años"], sketch: true },
  { id: "otro", label: "Otro", file: "otro.png", kinds: ["Otro", "Saco", "Crinolina"] },
];

const KIND_LABEL = {
  "V. casual": "Vestido casual",
  "V. fiesta": "Vestido fiesta",
};

const COLORS = [
  ["blanco", "#f7f4ee"],
  ["marfil", "#f0e2c4"],
  ["rosa", "#f2b6c6"],
  ["rojo", "#c44b4b"],
  ["coral", "#e48b78"],
  ["dorado", "#d4b15f"],
  ["verde", "#6ea38a"],
  ["azul", "#6aa0c4"],
  ["navy", "#1d4e73"],
  ["morado", "#8d6b92"],
  ["gris", "#b7c0c4"],
  ["negro", "#2a2e32"],
];

const TEMARIO = [
  "Introducción al taller",
  "Medidas y ficha",
  "Patronaje básico",
  "Corte",
  "Costura a máquina",
  "Acabados",
  "Alteraciones de vestido",
  "Entrega y cuidado",
];

const CITA_KINDS = ["Prueba", "Medidas", "Entrega", "Alteración"];

const MEASURES = [
  ["escote", "L. Escote DTE"],
  ["espalda", "Largo espalda"],
  ["pinza", "Largo pinza"],
  ["talle", "Largo talle"],
  ["busto", "Contorno busto"],
  ["cintura", "Contorno cintura"],
  ["entre", "Medida entre"],
  ["bbc", "B.B.C"],
  ["led", "L. ED"],
  ["cuello", "C. cuello"],
  ["cadera", "Contorno cadera"],
  ["largo-cadera", "Largo cadera"],
  ["largo-total", "Largo total"],
  ["largo-sisa", "Largo sisa"],
  ["sisa", "Contorno sisa"],
  ["brazo", "Contorno brazo"],
  ["puno", "Contorno puño"],
  ["pulsera", "Contorno pulsera"],
  ["codo", "Largo codo"],
  ["trazo", "Largo trazo"],
  ["tiro", "Largo tiro"],
  ["rodilla-1", "Contorno rodilla"],
  ["tobillo-1", "Contorno tobillo"],
  ["pierna", "Contorno pierna"],
  ["rodilla-2", "Contorno rodilla"],
  ["tobillo-2", "Contorno tobillo"],
];

const NAV = [
  ["hoy", "Hoy+", "hoy"],
  ["agenda", "Agenda", "agenda"],
  ["urgencias", "Urgencias", "bell"],
  ["ia", "IA", "ia"],
  ["pendientes", "Pendientes", "check"],
  ["clases", "Clases", "cap"],
  ["trazos", "Trazos", "pen"],
];

const ui = {
  view: "hoy",
  clientId: null,
  jobId: null,
  apptId: null,
  studentId: null,
  day: isoFromDate(new Date()),
  overlay: null,
  backOverlay: null,
  pendHub: "hacer",
  urgSort: "honorario",
  archTab: "entregados",
  q: { clientas: "", archivos: "", encargos: "" },
  cloud: "conectando",
  cloudError: "",
  cloudEmail: "",
  settingsNote: "",
  text: localStorage.getItem("sueil-texto") || "normal",
  brightness: Number(localStorage.getItem("sueil-brillo") || 100),
  fab: false,
  pad: null,
  confirm: null,
  draft: null,
  cita: null,
  sample: null,
  formError: "",
  toast: "",
  inkOn: false,
  pickId: "",
  iaDraft: "",
  iaBusy: false,
  iaError: "",
  iaNeedCloud: false,
  photoSlot: null,
  suggestHide: false,
  syncConfirmed: "",
  tutorialStep: 0,
  syncDismissed: "",
  syncHideNone: false,
  syncKey: "",
  syncBuffer: null,
  freshClientId: "",
  freshStudentId: "",
  badCode: false,
  codeError: "",
};

let db = null;
let cloudReady = false;
let cloudTimer = null;
let ignoreRemoteUntil = 0;
let paintKey = "";
let iaMessages = [];
let sheetPaintKey = "";
let state = load();

function isoFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return isoFromDate(d);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function amount(value) {
  return String(value ?? "0").split("+").reduce((sum, part) => {
    const n = Number(String(part).trim());
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
}

function garmentTitle(item) {
  if (!item || !item.kind) return item && item.custom ? item.custom : "";
  return item.kind;
}

function kindLabel(kind) {
  return KIND_LABEL[kind] || kind || "";
}

function garmentLabel(item) {
  const title = kindLabel(item && (item.custom && item.kind === "Otro" ? item.custom : item.kind)) || "Prenda";
  const color = String(item && item.color || "").trim();
  return color ? `${title} · ${color}` : title;
}

function groupOf(kind) {
  const k = String(kind || "").toLowerCase();
  const exact = GROUPS.find((g) => g.kinds.some((item) => item.toLowerCase() === k));
  if (exact) return exact;
  if (k.includes("novia") || k.includes("xv")) return GROUPS.find((g) => g.id === "novia");
  if (k.includes("falda")) return GROUPS.find((g) => g.id === "falda");
  if (k.includes("vest")) return GROUPS.find((g) => g.id === "vestido");
  if (k.includes("pantal") || k.includes("jean") || k === "pans") return GROUPS.find((g) => g.id === "pantalon");
  if (k.includes("blusa") || k.includes("camisa") || k.includes("playera")) return GROUPS.find((g) => g.id === "playera");
  return GROUPS.find((g) => g.id === "otro");
}

function normalizeJob(job) {
  if (job.type === "Arreglo" || /^ajuste$/i.test(String(job.type || ""))) job.type = "Alteración";
  job.dueTime = job.dueTime || "12:00";
  job.broughtShoes = !!job.broughtShoes;
  job.picky = !!job.picky;
  job.listo = !!job.listo;
  job.shoePhoto = job.shoePhoto || "";
  job.presupuesto = job.presupuesto || 0;
  job.measures = job.measures || {};
  job.note = job.note || "";
  job.drawing = job.drawing || "";
  if (!Array.isArray(job.garments) || !job.garments.length) {
    job.garments = [{ id: uid(), name: "", kind: "", custom: "", color: "", note: "", price: Number(job.price) || 0, done: false }];
  }
  job.garments = job.garments.map((item) => {
    const known = [...GROUPS.flatMap((g) => g.kinds), "Vestido"].find((kind) => kind.toLowerCase() === String(item.kind || item.name || "").trim().toLowerCase());
    const kind = item.kind || known || (item.name ? "Otro" : "");
    let custom = item.custom || (kind === "Otro" && !known ? item.name || "" : "");
    if (String(custom).trim().toLowerCase() === "vestido") custom = "";
    const next = {
      id: item.id || uid(),
      kind,
      custom,
      color: item.color || "",
      note: item.note || "",
      nameDrawing: item.nameDrawing || "",
      noteDrawing: item.noteDrawing || "",
      photo: item.photo || "",
      price: item.price || 0,
      done: !!item.done,
    };
    next.name = garmentTitle(next);
    return next;
  });
  job.price = job.garments.reduce((sum, item) => sum + amount(item.price), 0);
  return job;
}

function emptyWorkshop(access) {
  return {
    clients: [],
    jobs: [],
    appointments: [],
    students: [],
    params: { urgencyPrice: 40, dueTime: "12:00" },
    access: access || { mom: "", andres: "", dad: "" },
    profiles: { mom: "", dad: "", andres: "" },
  };
}

function load() {
  let data = emptyWorkshop();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = JSON.parse(raw);
  } catch (err) {
    console.warn(err);
  }
  const onlyExamples = (data.clients || []).length > 0 && data.clients.every((client) => DEMO_NAMES.has(client.name));
  if (onlyExamples && !DEMO_MODE) return emptyWorkshop(data.access);
  return shapeState(data);
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    alert("No cupo la copia en este aparato. Quita una foto grande o guarda una copia.");
  }
  if (cloudReady) {
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(pushCloud, 700);
  }
}

function shapeState(data) {
  data = data || {};
  data.access = data.access || { mom: "", andres: "", dad: "" };
  data.profiles = data.profiles || { mom: "", dad: "", andres: "" };
  data.clients = data.clients || [];
  data.jobs = (data.jobs || []).map(normalizeJob);
  data.appointments = (data.appointments || []).map((item) => ({
    ...item,
    id: item.id || uid(),
    done: !!item.done,
    note: item.note || "",
  }));
  data.students = Array.isArray(data.students) ? data.students : [];
  data.params = data.params || { urgencyPrice: 40, dueTime: "12:00" };
  if (data.params.urgencyPrice == null || data.params.urgencyPrice === "") data.params.urgencyPrice = 40;
  if (!data.params.dueTime) data.params.dueTime = "12:00";
  return data;
}

function hasWork(data) {
  data = data || {};
  return (data.clients || []).length + (data.jobs || []).length + (data.appointments || []).length > 0;
}

function cloudMessage(error) {
  const msg = String(error?.message || "").toLowerCase();
  if (msg.includes("invalid login") || msg.includes("invalid credentials")) return "Ese correo o esa contraseña no coincide.";
  if (msg.includes("already registered") || msg.includes("already been registered")) return "Esa cuenta ya existe. Pulsa Entrar.";
  if (msg.includes("password")) return "La contraseña necesita al menos 6 caracteres.";
  if (msg.includes("registro cerrado")) return "La entrada del taller ya fue creada. Pulsa Entrar con esa cuenta.";
  return "No se pudo entrar. Revisa el correo y la contraseña.";
}

function tableMissing(error) {
  const msg = String(error?.message || "") + String(error?.code || "");
  return msg.includes("PGRST205") || msg.includes("schema cache") || msg.includes("does not exist") || msg.includes("404");
}

async function pushCloud() {
  if (!cloudReady || !db) return;
  ignoreRemoteUntil = Date.now() + 3000;
  const { error } = await db.from("workshop").upsert({
    id: 1,
    data: state,
    updated_at: new Date().toISOString(),
  });
  if (error) console.warn(error);
}

async function pullCloud() {
  const { data, error } = await db.from("workshop").select("data").eq("id", 1).maybeSingle();
  if (error) return error;
  if (data && hasWork(data.data)) {
    state = shapeState(data.data);
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) { console.warn(err); }
  } else if (hasWork(state)) {
    await pushCloud();
  }
  return null;
}

async function joinFamily() {
  const { data: userData } = await db.auth.getUser();
  const user = userData?.user;
  if (!user) return "nosession";
  const inserted = await db.from("familia").insert({ user_id: user.id });
  if (inserted.error && tableMissing(inserted.error)) return "missing";
  const read = await db.from("familia").select("user_id").eq("user_id", user.id).maybeSingle();
  if (read.error && tableMissing(read.error)) return "missing";
  if (!read.data) {
    await db.auth.signOut();
    ui.cloud = "entrar";
    ui.cloudError = "Esta cuenta no es la del taller.";
    render();
    return "denied";
  }
  return "ok";
}

function watchCloud() {
  db.channel("sueil-workshop")
    .on("postgres_changes", { event: "*", schema: "public", table: "workshop", filter: "id=eq.1" }, (payload) => {
      if (Date.now() < ignoreRemoteUntil || !payload.new?.data) return;
      state = shapeState(payload.new.data);
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) { console.warn(err); }
      render();
    })
    .subscribe();
}

async function openCloudSession() {
  const joined = await joinFamily();
  if (joined === "missing") {
    cloudReady = false;
    ui.cloud = "";
    render();
    return;
  }
  if (joined !== "ok") return;
  await pullCloud();
  cloudReady = true;
  ui.cloud = "";
  watchCloud();
  checkAvisos();
  render();
}

async function cloudEnter(data, create) {
  ui.cloudEmail = String(data.email || "").trim();
  ui.cloudError = "";
  const password = String(data.password || "");
  const result = create
    ? await db.auth.signUp({ email: ui.cloudEmail, password })
    : await db.auth.signInWithPassword({ email: ui.cloudEmail, password });
  if (result.error) {
    ui.cloudError = cloudMessage(result.error);
    render();
    return;
  }
  if (!result.data.session) {
    ui.cloudError = "Revisa el correo, abre el mensaje y confirma la cuenta. Luego pulsa Entrar.";
    render();
    return;
  }
  await openCloudSession();
}

function seedDemoIfNeeded() {
  if (!DEMO_MODE) return;
  if ((state.clients || []).length) return;
  const c1 = { id: uid(), name: "Elena Vargas", phone: "5511111111", nameDrawing: "" };
  const c2 = { id: uid(), name: "Camila Ruiz", phone: "5522222222", nameDrawing: "" };
  const job = normalizeJob({
    id: uid(),
    clientId: c1.id,
    type: "Nuevo",
    eventDate: addDays(18),
    eventTime: "18:00",
    dueDate: addDays(6),
    dueTime: "12:00",
    price: 700,
    deposit: 300,
    urgencyFee: 40,
    presupuesto: 850,
    urgent: true,
    garments: [{ id: uid(), kind: "V. fiesta", custom: "", color: "#c44b4b", price: 700, done: false }],
    status: "activo",
    note: "Prueba de falda",
  });
  state.clients = [c1, c2];
  state.jobs = [job];
  state.appointments = [
    { id: uid(), jobId: job.id, date: addDays(0), time: "11:00", kind: "Prueba", note: "Traer zapatos", done: false },
    { id: uid(), jobId: "", date: addDays(0), time: "16:30", kind: "Medidas", note: "Camila nueva", done: false },
  ];
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) {}
}

async function startCloud() {
  if (DEMO_MODE) {
    sessionStorage.setItem(SESSION, "1");
    seedDemoIfNeeded();
    ui.cloud = "";
    cloudReady = false;
    render();
    return;
  }
  try {
    if (!window.supabase?.createClient) {
      ui.cloud = "";
      render();
      return;
    }
    db = window.supabase.createClient(CLOUD_URL, CLOUD_KEY, {
      auth: { persistSession: true, storageKey: "sueil-cloud" },
    });
    const { data } = await db.auth.getSession();
    if (data.session?.user?.email) ui.cloudEmail = data.session.user.email;
    if (!data.session) {
      ui.cloud = "entrar";
      render();
      return;
    }
    await openCloudSession();
  } catch (err) {
    console.warn(err);
    ui.cloud = "";
    render();
  }
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function money(n) {
  const value = Math.round(Number(n) || 0);
  return "$" + value.toLocaleString("es-MX");
}

function phoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function fold(value) {
  return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function phoneMatch(client, digits) {
  const theirs = phoneDigits(client && client.phone);
  if (theirs.length < 7 || digits.length < 7) return false;
  return theirs === digits || theirs.endsWith(digits) || digits.endsWith(theirs);
}

function nameMatch(client, folded) {
  const theirs = fold(client && client.name);
  if (!theirs || folded.length < 2) return false;
  if (theirs === folded || theirs.startsWith(folded)) return true;
  return theirs.split(/\s+/).some((word) => word.startsWith(folded));
}

function nameStill(client, folded) {
  const theirs = fold(client && client.name);
  if (!folded) return true;
  if (!theirs) return false;
  return theirs === folded || theirs.startsWith(folded) || folded.startsWith(theirs);
}

function resetSync(confirmedId) {
  ui.syncConfirmed = confirmedId || "";
  ui.syncDismissed = "";
  ui.syncHideNone = false;
  ui.syncKey = "";
  ui.syncBuffer = null;
}

function noteSyncTyping(name, phone) {
  const key = fold(name) + "|" + phoneDigits(phone);
  if (key !== ui.syncKey) ui.syncHideNone = false;
  if (ui.syncDismissed) {
    const dismissed = clientById(ui.syncDismissed);
    const folded = fold(name);
    const digits = phoneDigits(phone);
    const still = dismissed && ((digits.length >= 7 && phoneMatch(dismissed, digits)) || (folded.length >= 2 && nameMatch(dismissed, folded)));
    if (!still) ui.syncDismissed = "";
  }
  ui.syncKey = key;
}

function findSync(name, phone, excludeId) {
  const folded = fold(name);
  const digits = phoneDigits(phone);
  const enough = folded.length >= 2 || digits.length >= 7;
  const pool = state.clients.filter((client) => client.id !== excludeId && client.id !== ui.syncDismissed && (String(client.name || "").trim() || phoneDigits(client.phone).length >= 7));
  if (digits.length >= 7) {
    const phoneOwner = pool.find((client) => phoneMatch(client, digits));
    if (phoneOwner && phoneOwner.id !== ui.syncConfirmed) return { state: "match", client: phoneOwner, via: "phone" };
  }
  if (ui.syncConfirmed) {
    const chosen = clientById(ui.syncConfirmed);
    if (chosen && chosen.id !== excludeId && nameStill(chosen, folded)) return { state: "confirmed", client: chosen, via: "" };
  }
  if (!enough) return { state: "idle", client: null, via: "" };
  const phoneHits = digits.length >= 7 ? pool.filter((client) => phoneMatch(client, digits)) : [];
  const nameHits = folded.length >= 2 ? pool.filter((client) => nameMatch(client, folded)) : [];
  let client = null;
  let via = "";
  if (phoneHits.length) {
    client = phoneHits.find((item) => nameHits.some((hit) => hit.id === item.id)) || phoneHits[0];
    via = "phone";
  } else if (nameHits.length) {
    client = nameHits.find((item) => fold(item.name) === folded) || nameHits.find((item) => fold(item.name).startsWith(folded)) || nameHits[0];
    via = "name";
  }
  if (!client) return { state: "none", client: null, via: "" };
  if (ui.syncConfirmed === client.id) return { state: "confirmed", client, via };
  return { state: "match", client, via };
}

function fichaName(client) {
  if (ui.syncBuffer && ui.syncBuffer.id === client.id) return ui.syncBuffer.name;
  return client.name || "";
}

function fichaPhone(client) {
  if (ui.syncBuffer && ui.syncBuffer.id === client.id) return ui.syncBuffer.phone;
  return client.phone || "";
}

function syncContext() {
  if (ui.overlay === "cita" && ui.cita) return { name: ui.cita.person || "", phone: ui.cita.phone || "", exclude: "", mode: "form" };
  if ((ui.overlay === "encargo" || ui.overlay === "clienta") && ui.draft) return { name: ui.draft.person || "", phone: ui.draft.phone || "", exclude: "", mode: "form" };
  if (!ui.overlay && ui.view === "clientas" && ui.clientId) {
    const client = clientById(ui.clientId);
    if (client) return { name: fichaName(client), phone: fichaPhone(client), exclude: client.id, mode: "ficha" };
  }
  return null;
}

function syncBlocks(lookup) {
  if (!lookup) return false;
  return lookup.state === "match" || lookup.state === "none";
}

function syncBannerHtml(lookup, mode) {
  if (!lookup || lookup.state === "idle" || lookup.state === "confirmed") return "";
  if (lookup.state === "match" && lookup.client) {
    const hint = lookup.via === "phone"
      ? `Teléfono en Clientas: ${lookup.client.phone || "sin número"} · Confirma para rellenar`
      : `Está en Clientas${lookup.client.phone ? " · " + lookup.client.phone : ""} · Confirma para rellenar`;
    return `<div class="suggest" role="status">
      <p><strong>¿Es ${esc(lookup.client.name || "esta clienta")}?</strong></p>
      <p class="meta">${esc(hint)}</p>
      <div class="row">
        <button class="btn" type="button" data-confirm-client="${esc(lookup.client.id)}">Confirmar</button>
        <button class="btn-ghost" type="button" data-suggest-no>No</button>
      </div>
    </div>`;
  }
  if (lookup.state === "none" && mode === "form" && !ui.syncHideNone) {
    return `<div class="suggest" role="status">
      <p><strong>Sin match en Clientas</strong></p>
      <p class="meta">Puedes crear la clienta con este nombre y teléfono.</p>
      <div class="row">
        <button class="btn plum" type="button" data-action="crear-clienta-sync">Crear clienta</button>
        <button class="btn-ghost" type="button" data-action="seguir-editando">Seguir editando</button>
      </div>
    </div>`;
  }
  return "";
}

function syncSaveNote(lookup) {
  if (!lookup || lookup.state === "idle" || lookup.state === "confirmed") return "";
  if (lookup.state === "match") return `<p class="meta">Confirma antes de guardar.</p>`;
  return `<p class="meta">Crea la clienta antes de guardar.</p>`;
}

function applyLinkedClient(client) {
  const openJob = state.jobs.find((job) => job.clientId === client.id && job.status !== "entregado");
  if (ui.overlay === "cita" && ui.cita) {
    ui.cita.person = client.name || ui.cita.person || "";
    ui.cita.phone = client.phone || ui.cita.phone || "";
    ui.cita.jobId = openJob ? openJob.id : "";
  }
  if (ui.draft && ui.overlay !== "cita") {
    ui.draft.person = client.name || ui.draft.person || "";
    ui.draft.phone = client.phone || ui.draft.phone || "";
    if (ui.draft.job && !state.jobs.some((job) => job.id === ui.draft.job.id)) ui.draft.job.clientId = client.id;
  }
  ui.clientId = client.id;
}

function clientById(id) {
  return state.clients.find((c) => c.id === id);
}

function jobById(id) {
  return state.jobs.find((j) => j.id === id);
}

function jobsOf(clientId) {
  return state.jobs.filter((j) => j.clientId === clientId && j.status !== "oculto");
}

function clientName(job) {
  const client = job && clientById(job.clientId);
  return client ? client.name || "Clienta" : "Clienta";
}

function urgencyPrice() {
  return amount(state.params && state.params.urgencyPrice) || 40;
}

function totalOf(job) {
  if (!job) return 0;
  const extra = job.urgent ? amount(job.urgencyFee) : 0;
  const price = (job.garments || []).reduce((sum, item) => sum + amount(item.price), 0);
  return price + extra;
}

function dueOf(job) {
  return totalOf(job) - amount(job && job.deposit);
}

function garmentSummary(job) {
  const names = (job.garments || []).map((item) => {
    if (item.kind === "Otro" && item.custom) return item.custom;
    return kindLabel(item.kind);
  }).filter(Boolean);
  if (names.length) return names.join(" · ");
  return prettyType(job.type);
}

function prettyType(type) {
  const t = String(type || "");
  if (/ajuste|arreglo/i.test(t)) return "Alteración";
  return t || "Encargo";
}

function isListo(job) {
  if (!job || job.status === "entregado") return false;
  if (job.listo) return true;
  const items = (job.garments || []).filter((item) => item.kind || item.custom);
  return items.length > 0 && items.every((item) => item.done);
}

function statusOf(job) {
  if (!job) return "pendiente";
  if (job.status === "entregado") return "entregado";
  if (job.urgent) return "urgente";
  if (isListo(job)) return "listo";
  return "pendiente";
}

function statusLabel(job) {
  return { pendiente: "Pendiente", listo: "Listo", urgente: "Urgente", entregado: "Entregado" }[statusOf(job)];
}

function daysFromToday(iso) {
  if (!iso) return 99;
  const [y, m, d] = String(iso).split("-").map(Number);
  const [ty, tm, td] = addDays(0).split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86400000);
}

function lateDays(iso) {
  return Math.max(0, -daysFromToday(iso));
}

function severity(job) {
  const n = daysFromToday(job.dueDate);
  if (n <= 1) return "CRÍTICO";
  if (n <= 3) return "ALTA";
  return "MEDIA";
}

function shortDate(iso) {
  if (!iso) return "Sin fecha";
  const [y, m, d] = iso.split("-").map(Number);
  const mon = new Date(y, m - 1, d).toLocaleDateString("es-MX", { month: "short" }).replace(".", "");
  return `${d} ${mon}`;
}

function longDate(iso) {
  if (!iso) return "Sin fecha";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
}

function weekDays(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(date);
    x.setDate(date.getDate() + i);
    return isoFromDate(x);
  });
}

function dayName(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", { weekday: "short" }).replace(".", "").slice(0, 3).toUpperCase();
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function matches(q, ...fields) {
  const n = String(q || "").trim().toLowerCase();
  if (!n) return true;
  return fields.join(" ").toLowerCase().includes(n);
}

function apptUrgent(appt) {
  const job = jobById(appt.jobId);
  return !!(job && job.urgent && job.status !== "entregado");
}

function sortCitas(list) {
  return [...list].sort((a, b) => {
    const rank = Number(apptUrgent(b)) - Number(apptUrgent(a));
    if (rank) return rank;
    if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
    return String(a.time || "").localeCompare(String(b.time || ""));
  });
}

function hoyCitas(dayIso) {
  const day = dayIso || addDays(0);
  return state.appointments.filter((a) => a.date === day).sort((a, b) => String(a.time).localeCompare(String(b.time)));
}

function hoyJobs(dayIso) {
  const day = dayIso || addDays(0);
  return state.jobs
    .filter((job) => job.status !== "entregado" && job.dueDate === day)
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || String(a.dueTime).localeCompare(String(b.dueTime)));
}

function urgentJobs() {
  const list = state.jobs.filter((job) => job.urgent && job.status !== "entregado");
  if (ui.urgSort === "fecha") {
    list.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)) || String(a.dueTime).localeCompare(String(b.dueTime)));
  } else if (ui.urgSort === "cliente") {
    list.sort((a, b) => clientName(a).localeCompare(clientName(b), "es"));
  } else {
    list.sort((a, b) => totalOf(b) - totalOf(a) || String(a.dueDate).localeCompare(String(b.dueDate)));
  }
  return list;
}

function pendHacer() {
  const today = addDays(0);
  const citas = state.appointments
    .filter((a) => a.date && a.date < today && !a.done)
    .map((a) => ({ type: "cita", item: a, late: lateDays(a.date) }));
  const jobs = state.jobs
    .filter((job) => job.status !== "entregado" && job.dueDate && job.dueDate < today && !isListo(job))
    .map((job) => ({ type: "encargo", item: job, late: lateDays(job.dueDate) }));
  return [...citas, ...jobs].sort((a, b) => b.late - a.late);
}

function pendRecoger() {
  return state.jobs
    .filter((job) => job.status !== "entregado" && isListo(job))
    .sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")));
}

function codesReady() {
  const access = state.access || {};
  return Boolean(access.mom && access.andres && access.dad);
}

function svg(name) {
  const paths = {
    hoy: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/><path d="M12 13v3"/>',
    agenda: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/><circle cx="12" cy="15" r="1.6"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    check: '<path d="M8 7h12M8 12h12M8 17h8"/><path d="M4 7l1.2 1.2M4 12l1.2 1.2"/>',
    cap: '<path d="M3 10 12 6l9 4-9 4-9-4z"/><path d="M7 12v4c2 1.5 8 1.5 10 0v-4"/>',
    pen: '<path d="M4 20l1.2-4.2L16.2 4.8 19.2 8 8.2 19z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    box: '<path d="M4 8l8-4 8 4-8 4-8-4z"/><path d="M4 8v8l8 4 8-4V8"/>',
    gift: '<rect x="4" y="10" width="16" height="9" rx="1"/><path d="M12 10v9M4 14h16M12 10c-2-3-6-2-5 .2M12 10c2-3 6-2 5 .2"/>',
    user: '<circle cx="12" cy="8" r="3"/><path d="M5 19c1.4-3 3.6-4.5 7-4.5S17.6 16 19 19"/>',
    users: '<circle cx="9" cy="9" r="3"/><circle cx="16" cy="10" r="2.2"/><path d="M4 19c1-3 3-4.5 5.5-4.5S14 16 15 19M14 14.5c1.6 0 3 .8 4 2.5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6 5.8 18.2"/>',
    folder: '<path d="M3 7h6l2 2h10v10H3z"/>',
    cam: '<path d="M4 8h3l2-2h6l2 2h3v10H4z"/><circle cx="12" cy="13" r="3"/>',
    image: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 16l4.5-4 3.5 3 2-2 6 5"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
    back: '<path d="M15 5 8 12l7 7"/>',
    cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    check2: '<circle cx="12" cy="12" r="8"/><path d="M8 12l2.5 2.5L16 9"/>',
    alert: '<path d="M12 4 3 19h18z"/><path d="M12 10v4M12 16.5v.5"/>',
    dress: '<path d="M9 4l3 2 3-2 2 4-2 1 3 12H6L9 9 7 8z"/>',
  };
  const body = paths[name] || paths.box;
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

function colorHex(name) {
  const n = String(name || "").trim().toLowerCase();
  if (n.startsWith("#") && n.length >= 4) return n;
  const found = COLORS.find((item) => String(item[0]).toLowerCase() === n);
  return found ? found[1] : "#d5e6ec";
}

function flagOn(key, legacy) {
  const value = localStorage.getItem(key);
  if (value === null) return localStorage.getItem(legacy) === "1";
  return value === "1";
}

function setFlag(key, on) {
  localStorage.setItem(key, on ? "1" : "0");
}

function rememberFocus() {
  const el = document.activeElement;
  if (!el || !el.dataset || !el.dataset.keep) return null;
  return { keep: el.dataset.keep, start: el.selectionStart, end: el.selectionEnd };
}

function restoreFocus(mem) {
  if (!mem) return;
  const el = document.querySelector(`[data-keep="${mem.keep}"]`);
  if (!el) return;
  el.focus();
  if (typeof mem.start === "number" && el.setSelectionRange) {
    try { el.setSelectionRange(mem.start, mem.end); } catch (err) { /* date inputs */ }
  }
}

function patchSyncSlot() {
  const slot = document.querySelector("[data-sync-slot]");
  if (!slot) return;
  const mode = slot.dataset.syncSlot || "form";
  let lookup;
  if (mode === "ficha" && ui.clientId) {
    const client = clientById(ui.clientId);
    if (!client) return;
    lookup = findSync(fichaName(client), fichaPhone(client), client.id);
  } else {
    const ctx = syncContext();
    if (!ctx) return;
    lookup = findSync(ctx.name, ctx.phone, ctx.exclude || "");
  }
  slot.innerHTML = syncBannerHtml(lookup, mode);
  const note = document.querySelector("[data-sync-note]");
  if (note) note.innerHTML = syncSaveNote(lookup);
  const save = document.querySelector("[data-save-clienta]");
  if (save) save.disabled = syncBlocks(lookup);
}

function render() {
  applyBody();
  const root = document.getElementById("app");
  if (!root) return;
  const mem = rememberFocus();
  if (ui.cloud === "conectando" || ui.cloud === "entrar") {
    root.innerHTML = nubeHtml();
    restoreFocus(mem);
    return;
  }
  if (codesReady() && sessionStorage.getItem(SESSION) !== "1") {
    root.innerHTML = entradaHtml();
    restoreFocus(mem);
    return;
  }
  const sig = `${ui.view}|${ui.overlay || ""}|${ui.fab ? 1 : 0}|ia:${ui.iaBusy ? 1 : 0}:${iaMessages.length}`;
  const flip = sig !== paintKey;
  paintKey = sig;
  const bright = ui.brightness === 100 ? "" : `filter:brightness(${ui.brightness / 100})`;
  root.innerHTML = `
    <div class="app ${ui.view === "menu" ? "app-menu" : ""}" style="${bright}">
      <div class="scroll-pane">
        ${ui.view === "menu" ? "" : topbarHtml()}
        <main class="stage ${flip ? "rise" : ""}">${screenHtml()}</main>
      </div>
      <div class="chrome" aria-hidden="false">
        ${dockHtml()}
        ${fabHtml()}
      </div>
      ${overlayHtml()}
      ${ui.toast ? `<div class="toast">${esc(ui.toast)}</div>` : ""}
      <input id="cam" class="sr" type="file" accept="image/*" capture="environment" data-file="cam">
      <input id="gal" class="sr" type="file" accept="image/*" data-file="gal">
    </div>`;
  afterPaint();
  restoreFocus(mem);
}

function applyBody() {
  const names = [];
  if (ui.text === "compacto") names.push("text-compact");
  if (ui.text === "grande") names.push("text-large");
  document.body.className = names.join(" ");
}

function nubeHtml() {
  if (ui.cloud === "conectando") {
    return `<section class="gate"><p class="kicker">Sueil</p><h1>Conectando el taller</h1><p>Un momento.</p></section>`;
  }
  return `
    <section class="gate">
      <img src="brand/sueil-logo-navy.png" alt="Sueil" style="height:92px">
      <h1>Entrada del taller</h1>
      <p>Mamá, papá y Andrés entran cada quien con su correo.</p>
      <form class="form" data-form="nube">
        <label>Correo<input name="email" type="email" required autocomplete="username" value="${esc(ui.cloudEmail)}" data-keep="email"></label>
        <label>Contraseña<input name="password" type="password" required minlength="6" autocomplete="current-password"></label>
        ${ui.cloudError ? `<p class="warn">${esc(ui.cloudError)}</p>` : ""}
        <div class="row">
          <button class="btn" type="submit">Entrar</button>
          <button class="btn-ghost" type="submit" name="crear" value="1">Crear entrada</button>
        </div>
      </form>
    </section>`;
}

function entradaHtml() {
  return `
    <section class="gate">
      <img src="brand/sueil-logo-navy.png" alt="Sueil" style="height:92px">
      <h1>Código de acceso</h1>
      <p>Mamá, Oscar o Andrés. Cada quien con el suyo.</p>
      <form class="form" data-form="entrar">
        <label>Código<input name="code" type="password" required autocomplete="off"></label>
        ${ui.badCode ? `<p class="warn">Ese código no es de la familia.</p>` : ""}
        <button class="btn" type="submit">Entrar</button>
      </form>
    </section>`;
}

function topbarHtml() {
  return `
    <header class="topbar stage" style="padding-bottom:0">
      <button class="brand" type="button" data-go="menu" aria-label="Menú Sueil">
        <img src="brand/sueil-logo-navy.png" alt="Sueil alta costura">
      </button>
      <p class="atelier">Sueños e ilusiones</p>
    </header>`;
}

function dockHtml() {
  const pending = pendHacer().length;
  return `<nav class="dock" aria-label="Secciones">
    ${NAV.map(([id, label, icon]) => {
      const on = ui.view === id;
      if (id === "ia") {
        return `<button type="button" class="dock-btn ia ${on ? "on" : ""}" data-go="ia" aria-current="${on ? "page" : "false"}" aria-label="IA">IA</button>`;
      }
      const badge = id === "pendientes" && pending ? `<em class="dotn">${pending > 9 ? "9+" : pending}</em>` : "";
      return `<button type="button" class="dock-btn ${on ? "on" : ""}" data-go="${id}" aria-current="${on ? "page" : "false"}">${svg(icon)}<span>${label}</span>${badge}</button>`;
    }).join("")}
  </nav>`;
}

function fabHtml() {
  const items = [
    ["encargo-nuevo", "Nuevo encargo", "box"],
    ["encargos", "Ver encargos", "box"],
    ["cita-nueva", "Nueva cita", "cal"],
    ["clienta-nueva", "Nueva clienta", "user"],
    ["clientas", "Clientas", "users"],
    ["archivos", "Archivos", "folder"],
    ["ajustes", "Ajustes", "gear"],
  ];
  return `
    ${ui.fab ? `<div class="fab-menu">
      ${items.map(([action, label, icon]) => `<button type="button" data-fab="${action}">${esc(label)}<span class="bubble">${svg(icon)}</span></button>`).join("")}
    </div>` : ""}
    <button class="fab" type="button" data-fab="toggle" aria-label="${ui.fab ? "Cerrar" : "Crear"}">${svg(ui.fab ? "close" : "plus")}</button>`;
}

function screenHtml() {
  if (ui.view === "menu") return menuHtml();
  if (ui.view === "hoy") return hoyHtml();
  if (ui.view === "agenda") return agendaHtml();
  if (ui.view === "urgencias") return urgenciasHtml();
  if (ui.view === "pendientes") return pendientesHtml();
  if (ui.view === "clases") return soonHtml("Clases", "Las clases y el temario vuelven pronto. Por ahora esta pantalla solo avisa.");
  if (ui.view === "clientas") return clientasHtml();
  if (ui.view === "archivos") return archivosHtml();
  if (ui.view === "ajustes") return ajustesHtml();
  if (ui.view === "encargos") return encargosHtml();
  if (ui.view === "ia") return iaHtml();
  if (ui.view === "trazos") return soonHtml("Trazos", "Se abre cuando estén los materiales del plano. Por ahora el botón solo avisa.");
  return hoyHtml();
}

function iaHtml() {
  const familyOk = sessionStorage.getItem(SESSION) === "1";
  const cloudOn = !!(cloudReady && ui.cloudEmail);
  const bubbles = iaMessages.length
    ? iaMessages.map((msg) => `
        <div class="ia-bubble ${msg.role === "user" ? "me" : "bot"}">
          <p>${esc(msg.content).replace(/\n/g, "<br>")}</p>
        </div>`).join("")
    : `<div class="ia-bubble bot"><p>Hola. Soy la IA de Sueil. Pregunta por encargos, citas, medidas, urgencias, Falda aparte o CM. Habla como quieras; yo ayudo sin sermón.</p></div>`;
  return `
    <div class="screen-head">
      <div>
        <h1>IA</h1>
        <p class="lede">Asistente del taller · letra grande · sin voz todavía</p>
      </div>
    </div>
    <section class="ia-chat" aria-label="Chat de la IA">
      <div class="ia-log" data-ia-log>${bubbles}</div>
      ${ui.iaError ? `<p class="warn ia-warn">${esc(ui.iaError)}</p>` : ""}
      ${!familyOk ? `
        <div class="ia-gate">
          <p class="meta">Primero entra con el <b>código de la familia</b>.</p>
        </div>` : ""}
      ${familyOk && !cloudOn ? `
        <div class="ia-gate">
          <p class="meta">Puedes chatear con el código. Si quieres cuenta del almacén: <button class="btn-ghost" type="button" data-action="ia-login" style="display:inline;min-height:auto;padding:4px 8px">abrir Ajustes</button>.</p>
        </div>` : ""}
      <form class="ia-compose" data-form="ia">
        <label class="ia-label" for="ia-draft">Tu mensaje</label>
        <textarea id="ia-draft" name="message" data-keep="ia-draft" data-ia-draft rows="3" placeholder="Ej. ¿Falda va aparte del vestido?" ${ui.iaBusy || !familyOk ? "disabled" : ""}>${esc(ui.iaDraft)}</textarea>
        <div class="ia-actions">
          <button class="btn" type="submit" ${ui.iaBusy || !familyOk ? "disabled" : ""}>${ui.iaBusy ? "Pensando…" : "Enviar"}</button>
          <button class="btn-ghost" type="button" data-action="ia-clear" ${ui.iaBusy || !iaMessages.length ? "disabled" : ""}>Limpiar</button>
        </div>
      </form>
    </section>`;
}

async function iaAuthHeaders() {
  // Preferimos JWT de correo; si no hay sesión (InPrivate / solo código), usamos la apikey pública.
  let token = CLOUD_KEY;
  let mode = "anon";
  if (db) {
    try {
      const { data: sess } = await db.auth.getSession();
      if (sess?.session?.access_token) {
        token = sess.session.access_token;
        mode = "user";
      }
    } catch (err) { /* anon */ }
  }
  return {
    mode,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: CLOUD_KEY,
    },
  };
}

async function sendIaChat(text) {
  const message = String(text || "").trim();
  if (!message || ui.iaBusy) return;
  if (sessionStorage.getItem(SESSION) !== "1") {
    ui.iaError = "Entra con el código de la familia para usar la IA.";
    render();
    return;
  }
  ui.iaDraft = "";
  ui.iaError = "";
  ui.iaNeedCloud = false;
  iaMessages.push({ role: "user", content: message });
  ui.iaBusy = true;
  render();
  try {
    const auth = await iaAuthHeaders();
    const res = await fetch(IA_URL, {
      method: "POST",
      headers: auth.headers,
      body: JSON.stringify({
        messages: iaMessages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    let body = null;
    try { body = await res.json(); } catch (err) { body = null; }
    if (!res.ok) {
      const code = body && body.code;
      const status = (body && body.status) || res.status;
      const xai = body && body.xai;
      const detail = [
        (body && body.error) || "",
        status ? `[${status}]` : "",
        xai ? `— ${xai}` : "",
        (body && body.model) ? `(${body.model})` : "",
      ].filter(Boolean).join(" ");
      if (res.status === 401 || code === "auth") {
        ui.iaNeedCloud = true;
        throw new Error(detail || "Entra con el código de la familia o el correo del taller.");
      }
      if (code === "no_xai_key") {
        throw new Error(detail || "Falta la clave de la IA en el almacén. Avísale a Andrés.");
      }
      throw new Error(detail || "No se pudo hablar con la IA.");
    }
    const reply = String(body?.reply || "").trim();
    if (!reply) throw new Error("Respuesta vacía.");
    iaMessages.push({ role: "assistant", content: reply });
  } catch (err) {
    ui.iaError = (err && err.message) || "Algo falló. Intenta otra vez.";
    if (iaMessages.length && iaMessages[iaMessages.length - 1].role === "user" && iaMessages[iaMessages.length - 1].content === message) {
      iaMessages.pop();
      ui.iaDraft = message;
    }
  }
  ui.iaBusy = false;
  render();
}

function menuHtml() {
  return `
    <section class="menu">
      <img src="brand/sueil-logo-blanco.png" alt="Sueil alta costura">
      <p class="menu-tag">Sueños e ilusiones</p>
    </section>`;
}

function soonHtml(title, text) {
  return `
    <section class="soon">
      <p class="kicker">${esc(title)}</p>
      <h1>Coming soon</h1>
      <p class="lede">${esc(text)}</p>
    </section>`;
}

function hoyDayBlock(dayIso, label) {
  const citas = hoyCitas(dayIso);
  const jobs = hoyJobs(dayIso);
  return `
    <div class="hoy-day">
      <p class="date-chip"><i></i> ${esc(label)} · ${esc(shortDate(dayIso))}</p>
      <div class="hoy-grid">
        <section>
          <p class="panel-title">${svg("cal")} Citas</p>
          ${citas.length ? `<ol class="timeline">${citas.map(citaTimeline).join("")}</ol>` : `<p class="empty">No hay citas.</p>`}
        </section>
        <section>
          <p class="panel-title">${svg("box")} Encargos</p>
          <div class="cards">${jobs.length ? jobs.map(hoyJobCard).join("") : `<p class="empty">No hay encargos.</p>`}</div>
        </section>
      </div>
    </div>`;
}

function hoyHtml() {
  const today = addDays(0);
  const tomorrow = addDays(1);
  return `
    <div class="screen-head">
      <div>
        <h1>Hoy y mañana</h1>
        <p class="lede">Lo de hoy y lo de mañana, juntos.</p>
      </div>
    </div>
    ${hoyDayBlock(today, "Hoy")}
    ${hoyDayBlock(tomorrow, "Mañana")}`;
}

function citaTimeline(appt) {
  const job = jobById(appt.jobId);
  const name = job ? clientName(job) : "Cita";
  return `
    <li>
      <time>${esc(appt.time || "")}</time>
      <div class="rail"><span></span></div>
      <button class="t-card ${appt.done ? "done" : ""}" type="button" data-open-appt="${esc(appt.id)}">
        <div class="who">${esc(name)}</div>
        <div class="sub">— ${esc(appt.kind || "Cita")}</div>
      </button>
    </li>`;
}

function hoyJobCard(job) {
  const st = statusOf(job);
  return `
    <article class="card row-card">
      <span class="avatar soft">${svg(st === "listo" ? "check2" : st === "urgente" ? "alert" : "box")}</span>
      <button class="hit" type="button" data-open-job="${esc(job.id)}">
        <div class="who">${esc(clientName(job))}</div>
        <div class="sub">— ${esc(garmentSummary(job))}</div>
      </button>
      <button class="pill ${esc(st)}" type="button" data-pill="${esc(job.id)}">${esc(statusLabel(job))}</button>
    </article>`;
}

function agendaHtml() {
  const days = weekDays(ui.day);
  const citas = sortCitas(state.appointments.filter((a) => a.date === ui.day));
  return `
    <p class="kicker">Agenda</p>
    <h1 class="date-title">${esc(longDate(ui.day))}</h1>
    <div class="days" style="margin:14px 0">
      ${days.map((day) => `<button type="button" class="day ${day === ui.day ? "on" : ""}" data-day="${day}">${esc(dayName(day))}</button>`).join("")}
    </div>
    <p class="kicker">Orden · urgencia, luego hora</p>
    <div class="cards">
      ${citas.length ? citas.map(agendaRow).join("") : `<p class="empty">Este día no tiene citas.</p>`}
    </div>`;
}

function agendaRow(appt) {
  const job = jobById(appt.jobId);
  const urgent = apptUrgent(appt);
  const icon = appt.kind === "Entrega" ? "gift" : appt.kind === "Alteración" ? "pen" : "dress";
  const sub = job ? `${appt.kind || "Cita"} · ${garmentSummary(job)}` : (appt.kind || "Cita");
  return `
    <article class="card row-card ${appt.done ? "done" : ""}">
      <span class="avatar soft">${svg(icon)}</span>
      <button class="hit" type="button" data-open-appt="${esc(appt.id)}">
        <div class="who">${esc(appt.time || "")} · ${esc(job ? clientName(job) : "Cita")}</div>
        <div class="sub">${esc(sub)}</div>
      </button>
      ${urgent ? `<span class="pill critico">Urgente</span>` : ""}
    </article>`;
}

function urgenciasHtml() {
  const jobs = urgentJobs();
  const late = state.jobs.filter((job) => job.status !== "entregado" && job.dueDate && job.dueDate < addDays(0)).length;
  const filters = [["honorario", "Por honorario"], ["fecha", "Por fecha"], ["cliente", "Por cliente"]];
  return `
    <div class="screen-head">
      <div>
        <h1>Urgencias</h1>
        <p class="lede">Entregas que no pueden esperar. Aquí están todos los días.</p>
      </div>
    </div>
    ${late ? `<button class="banner" type="button" data-go="pendientes">${late === 1 ? "Hay 1 atrasada" : `Hay ${late} atrasadas`} · ver Pendientes</button>` : ""}
    <div class="filters">
      ${filters.map(([id, label]) => `<button type="button" class="filter ${ui.urgSort === id ? "on" : ""}" data-urg="${id}">${label}</button>`).join("")}
    </div>
    <div class="cards" style="margin-top:12px">
      ${jobs.length ? jobs.map(urgRow).join("") : `<p class="empty">No hay urgencias abiertas.</p>`}
    </div>`;
}

function urgRow(job) {
  const sev = severity(job);
  return `
    <button class="urg-card ${sev === "CRÍTICO" ? "critico" : ""}" type="button" data-open-job="${esc(job.id)}">
      <span>
        <strong>${esc(clientName(job))}</strong>
        <div class="sub">${esc(prettyType(garmentSummary(job)))}</div>
      </span>
      <span class="when">
        <div>Entrega: ${esc(shortDate(job.dueDate))}</div>
        <div class="sev">${esc(sev)}</div>
      </span>
    </button>`;
}

function pendientesHtml() {
  const hacer = pendHacer();
  const recoger = pendRecoger();
  const rows = ui.pendHub === "recoger" ? recoger.map(recogerRow) : hacer.map(atrasadoRow);
  return `
    <div class="screen-head">
      <div>
        <h1>Pendientes</h1>
        <p class="lede">${ui.pendHub === "recoger" ? "Listos, la clienta todavía no recoge." : "Citas y encargos que se han pasado."}</p>
      </div>
    </div>
    <div class="filters">
      <button type="button" class="filter ${ui.pendHub === "hacer" ? "on" : ""}" data-pend="hacer">Por hacer</button>
      <button type="button" class="filter ${ui.pendHub === "recoger" ? "on" : ""}" data-pend="recoger">Por recoger</button>
    </div>
    <div class="cards" style="margin-top:12px">
      ${rows.length ? rows.join("") : `<p class="empty">${ui.pendHub === "recoger" ? "Nada listo por recoger." : "Nada atrasado."}</p>`}
    </div>`;
}

function atrasadoRow(row) {
  if (row.type === "cita") {
    const appt = row.item;
    const job = jobById(appt.jobId);
    return `
      <article class="card row-card">
        <span class="tag-late">ATRASADO</span>
        <button class="hit" type="button" data-open-appt="${esc(appt.id)}">
          <div class="who">${esc(job ? clientName(job) : "Cita")}</div>
          <div class="sub">Cita de ${esc((appt.kind || "cita").toLowerCase())}</div>
          <div class="sub">Debía: ${esc(shortDate(appt.date))}</div>
        </button>
        <span class="late">lleva ${row.late} ${row.late === 1 ? "día" : "días"}</span>
      </article>`;
  }
  const job = row.item;
  return `
    <article class="card row-card">
      <span class="tag-late">ATRASADO</span>
      <button class="hit" type="button" data-open-job="${esc(job.id)}">
        <div class="who">${esc(clientName(job))}</div>
        <div class="sub">Encargo: ${esc(garmentSummary(job))}</div>
        <div class="sub">Debía: ${esc(shortDate(job.dueDate))}</div>
      </button>
      <span class="late">lleva ${row.late} ${row.late === 1 ? "día" : "días"}</span>
    </article>`;
}

function recogerRow(job) {
  const late = lateDays(job.dueDate);
  return `
    <article class="card row-card">
      <span class="pill listo">LISTO</span>
      <button class="hit" type="button" data-open-job="${esc(job.id)}">
        <div class="who">${esc(clientName(job))}</div>
        <div class="sub">${esc(garmentSummary(job))}</div>
        <div class="sub">${job.dueDate ? `Entrega ${esc(shortDate(job.dueDate))}` : "Sin fecha"}</div>
      </button>
      ${late ? `<span class="late">lleva ${late} días</span>` : `<span class="meta">Por recoger</span>`}
    </article>`;
}

function clasesHtml() {
  const students = state.students || [];
  return `
    <div class="screen-head">
      <div>
        <h1>Clases</h1>
        <p class="lede">Alumnas y temario</p>
      </div>
      <button class="icon-btn" type="button" data-action="temario" aria-label="Temario">${svg("cap")}</button>
    </div>
    ${students.length ? `<div class="cards two">${students.map(studentCard).join("")}</div>` : `<p class="empty">Todavía no hay alumnas. Nueva alumna abre una ficha. No se borra ninguna clienta.</p>`}
    <div class="row" style="margin-top:12px"><button class="btn" type="button" data-action="alumna-nueva">Nueva alumna</button></div>`;
}

function studentCard(student) {
  const topics = TEMARIO.map((title, index) => {
    const mark = (student.progress || {})[index] || "";
    const suffix = mark === "hecha" ? " ✓" : mark === "curso" ? " — en curso" : mark === "proxima" ? " — próxima" : "";
    return `<li>${esc(title)}${esc(suffix)}</li>`;
  }).slice(0, 3);
  return `
    <button class="card student" type="button" data-student="${esc(student.id)}">
      <div class="row-card" style="display:flex">
        <span class="avatar plum">${esc(initials(student.name))}</span>
        <strong class="who">${esc(student.name || "Alumna")}</strong>
        <span class="pill ${student.status === "nueva" ? "" : "listo"}">${student.status === "nueva" ? "Nueva" : "Activa"}</span>
      </div>
      <ol>${topics.join("")}</ol>
    </button>`;
}

function clientasHtml() {
  const q = ui.q.clientas;
  const list = state.clients
    .filter((c) => matches(q, c.name, c.phone))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "es"));
  const selected = clientById(ui.clientId) || list[0];
  return `
    <div class="screen-head">
      <div>
        <p class="kicker">Sueil</p>
        <h1>Clientas</h1>
      </div>
      <p class="meta">${state.clients.length} ${state.clients.length === 1 ? "clienta" : "clientas"}</p>
    </div>
    <div class="row"><button class="btn" type="button" data-action="clienta-nueva">Nueva clienta</button></div>
    <label class="search">
      ${svg("search")}
      <input data-keep="q" data-q="clientas" type="search" placeholder="Buscar clienta..." value="${esc(q)}">
    </label>
    <div class="split ${ui.clientId ? "show-detail" : ""}" style="margin-top:14px">
      <div class="cards pane-list">
        ${list.length ? list.map((c) => clientRow(c, selected && c.id === selected.id)).join("") : `<p class="empty">No hay clientas con ese nombre.</p>`}
      </div>
      <div class="pane-detail">${selected ? fichaPane(selected) : `<p class="empty">Elige una clienta.</p>`}</div>
    </div>`;
}

function clientRow(client, on) {
  return `
    <article class="card row-card" style="${on ? "background:#e7f6f4" : ""}">
      <span class="avatar ${on ? "plum" : ""}">${esc(initials(client.name))}</span>
      <button class="hit" type="button" data-open-client="${esc(client.id)}">
        <div class="who">${esc(client.name || "Sin nombre")}</div>
        <div class="sub">${esc(client.phone || "Sin teléfono")}</div>
      </button>
      <button class="btn-ghost" type="button" data-open-client="${esc(client.id)}">Abrir ficha</button>
    </article>`;
}

function fichaPane(client) {
  const jobs = jobsOf(client.id).filter((job) => job.status !== "entregado");
  const job = jobs[0];
  return `
    <article class="card">
      <button class="btn-ghost only-phone" type="button" data-action="clientas-lista" style="margin-bottom:8px">Volver a la lista</button>
      <h2 style="font-family:var(--serif);font-size:40px;margin:0;color:var(--navy)">${esc(fichaName(client) || "Clienta")}</h2>
      <label>Nombre<input data-keep="ficha-name" data-client-field="name" value="${esc(fichaName(client))}" placeholder="Nombre"></label>
      <label>Teléfono<input data-keep="ficha-phone" data-client-field="phone" type="tel" value="${esc(fichaPhone(client))}" placeholder="Teléfono"></label>
      <div data-sync-slot="ficha">${syncBannerHtml(findSync(fichaName(client), fichaPhone(client), client.id), "ficha")}</div>
      <div class="row">
        <button class="btn" type="button" data-action="encargo-de-clienta">Nuevo encargo</button>
        <button class="btn" type="button" data-action="cita-de-clienta">Nueva cita</button>
      </div>
      ${job ? `
        <button class="card" type="button" data-open-job="${esc(job.id)}" style="margin-top:12px">
          <div class="sub">${esc(prettyType(job.type))}</div>
          <div class="who">${esc(garmentSummary(job))}</div>
          <div class="sub">Fecha de entrega</div>
          <div class="who">${esc(longDate(job.dueDate))}</div>
        </button>` : `<p class="empty">Sin encargos abiertos.</p>`}
      <div class="cards" style="margin-top:10px">
        ${jobsOf(client.id).map((item) => `<button class="btn-ghost" type="button" data-open-job="${esc(item.id)}">${esc(garmentSummary(item))} · ${esc(statusLabel(item))}</button>`).join("")}
      </div>
      ${confirmBtn("client", client.id, "Eliminar clienta")}
    </article>`;
}

function archivosHtml() {
  const tabs = [
    ["entregados", "Entregados", "check2"],
    ["clientas", "Clientas", "users"],
    ["citas", "Citas", "cal"],
    ["encargos", "Encargos", "box"],
    ["historial", "Historial", "folder"],
  ];
  return `
    <div class="screen-head">
      <h1>Archivos</h1>
    </div>
    <label class="search">${svg("search")}<input data-keep="qa" data-q="archivos" type="search" placeholder="Buscar..." value="${esc(ui.q.archivos)}"></label>
    <div class="arch-tabs">
      ${tabs.map(([id, label, icon]) => `<button type="button" class="arch-tab ${ui.archTab === id ? "on" : ""}" data-arch="${id}">${svg(icon)}<span>${label}</span></button>`).join("")}
    </div>
    <div class="cards">${archivoList()}</div>
    <div class="row" style="margin-top:12px">
      <button class="btn-ghost" type="button" data-go="agenda">Ver citas</button>
      <button class="btn-ghost" type="button" data-go="encargos">Ver encargos</button>
      <button class="btn-ghost" type="button" data-go="pendientes">Pendientes</button>
    </div>`;
}

function archivoList() {
  const q = ui.q.archivos;
  if (ui.archTab === "clientas") {
    const list = state.clients.filter((c) => matches(q, c.name, c.phone));
    if (!list.length) return `<p class="empty">Nada en clientas.</p>`;
    return list.map((c) => `<button class="card" type="button" data-open-client="${esc(c.id)}"><div class="who">${esc(c.name)}</div><div class="sub">${esc(c.phone || "")}</div></button>`).join("");
  }
  if (ui.archTab === "citas") {
    const list = sortCitas(state.appointments).filter((a) => {
      const job = jobById(a.jobId);
      return matches(q, job ? clientName(job) : "", a.kind, a.note, a.date);
    });
    if (!list.length) return `<p class="empty">Nada en citas.</p>`;
    return list.map((a) => {
      const job = jobById(a.jobId);
      return `<button class="card" type="button" data-open-appt="${esc(a.id)}"><div class="who">${esc(job ? clientName(job) : "Cita")}</div><div class="sub">${esc(shortDate(a.date))} · ${esc(a.time)} · ${esc(a.kind || "")}</div></button>`;
    }).join("");
  }
  let jobs = state.jobs;
  if (ui.archTab === "entregados") jobs = jobs.filter((j) => j.status === "entregado");
  if (ui.archTab === "encargos") jobs = jobs.filter((j) => j.status !== "entregado");
  jobs = jobs.filter((j) => matches(q, clientName(j), garmentSummary(j), j.type, j.note));
  jobs = [...jobs].sort((a, b) => String(b.dueDate || "").localeCompare(String(a.dueDate || "")));
  if (!jobs.length) return `<p class="empty">Nada en este archivo.</p>`;
  return jobs.map((job) => `<button class="card" type="button" data-open-job="${esc(job.id)}"><div class="who">${esc(clientName(job))}</div><div class="sub">${esc(garmentSummary(job))} · ${esc(shortDate(job.dueDate))} · ${esc(statusLabel(job))}</div></button>`).join("");
}

function encargosHtml() {
  const q = ui.q.encargos;
  const jobs = state.jobs
    .filter((job) => job.status !== "entregado" && matches(q, clientName(job), garmentSummary(job), job.note))
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || String(a.dueDate).localeCompare(String(b.dueDate)) || String(a.dueTime).localeCompare(String(b.dueTime)));
  return `
    <div class="screen-head"><h1>Encargos</h1></div>
    <p class="lede">Urgencia primero, luego la fecha de entrega.</p>
    <label class="search">${svg("search")}<input data-keep="qe" data-q="encargos" type="search" placeholder="Buscar encargo..." value="${esc(q)}"></label>
    <div class="cards" style="margin-top:12px">
      ${jobs.length ? jobs.map((job) => `
        <button class="card row-card" type="button" data-open-job="${esc(job.id)}">
          <img src="brand/${groupOf(job.garments && job.garments[0] && job.garments[0].kind).file}" alt="" width="52" height="52">
          <span><span class="who">${esc(clientName(job))}</span><span class="sub">${esc(garmentSummary(job))}</span></span>
          <span class="pill ${esc(statusOf(job))}">${esc(statusLabel(job))}</span>
        </button>`).join("") : `<p class="empty">No hay encargos abiertos.</p>`}
    </div>`;
}

function ajustesHtml() {
  const sizes = [["compacto", "Pequeño"], ["normal", "Mediano"], ["grande", "Grande"]];
  return `
    <h1>Ajustes</h1>
    <p class="kicker">Sueil</p>
    ${ui.settingsNote ? `<p class="warn">${esc(ui.settingsNote)}</p>` : ""}
    <p class="kicker">Ayuda</p>
    <div class="settings-list">
      <button class="set-row" type="button" data-action="tutorial">Cómo usar Sueil</button>
    </div>
    <p class="kicker">Pantalla</p>
    <div class="card">
      <div class="choice">${sizes.map(([id, label]) => `<button type="button" class="kind ${ui.text === id ? "on" : ""}" data-text="${id}">${label}</button>`).join("")}</div>
      <label>Brillo de pantalla<input type="range" min="70" max="130" value="${esc(ui.brightness)}" data-bright></label>
    </div>
    <p class="kicker">Avisos</p>
    <div class="settings-list">
      ${switchRow("Avisos de citas", flagOn("sueil-avisos-citas", "sueil-avisos"), "avisos-citas")}
      ${switchRow("Avisos de urgencias", flagOn("sueil-avisos-urgencias", "sueil-avisos"), "avisos-urgencias")}
      ${switchRow("Sonido", localStorage.getItem("sueil-sonido") === "1", "sonido")}
    </div>
    <p class="meta">${esc(avisosStatus())}</p>
    <p class="kicker">Estadísticas y parámetros</p>
    <div class="settings-list">
      <button class="set-row" type="button" data-action="stats">Estadísticas del taller</button>
      <button class="set-row" type="button" data-action="params">Parámetros</button>
    </div>
    <p class="kicker">Precios</p>
    <button class="card" type="button" data-action="precios" style="width:100%">
      <div class="meta">Precio de urgencia</div>
      <div class="who">${esc(money(urgencyPrice()))}</div>
      <p class="formula">Total encargo = suma de prendas + urgencia</p>
    </button>
    <p class="kicker">Códigos y perfiles</p>
    <div class="settings-list">
      <button class="set-row" type="button" data-action="codigos">Códigos de acceso</button>
      <button class="set-row" type="button" data-action="perfiles">Perfiles de familia</button>
    </div>
    <p class="kicker">Cuenta</p>
    <div class="settings-list">
      <button class="set-row" type="button" data-action="cuenta">Correo y copia</button>
      <button class="set-row" type="button" data-action="salir">Cerrar sesión</button>
    </div>`;
}

function switchRow(label, on, action) {
  return `<button class="set-row" type="button" data-switch="${action}"><span>${esc(label)}</span><span class="switch ${on ? "on" : ""}" aria-hidden="true"><i></i></span></button>`;
}

function overlayHtml() {
  if (!ui.overlay) return "";
  const body = {
    fab: "",
    cita: citaFormHtml(),
    "cita-detalle": citaDetalleHtml(),
    encargo: encargoFormHtml(),
    resumen: resumenHtml(),
    selector: selectorHtml(),
    notas: notasHtml(),
    medidas: medidasHtml(),
    recibo: reciboHtml(),
    cromatico: cromaticoHtml(),
    stats: statsHtml(),
    params: paramsHtml(),
    precios: preciosHtml(),
    codigos: codigosHtml(),
    perfiles: perfilesHtml(),
    cuenta: cuentaHtml(),
    clienta: clientaFormHtml(),
    alumna: alumnaFormHtml(),
    "alumna-ficha": alumnaFichaHtml(),
    temario: temarioHtml(),
    tutorial: tutorialHtml(),
  }[ui.overlay] || "";
  if (!body) return "";
  const wide = ui.overlay === "medidas" || ui.overlay === "notas" || ui.overlay === "selector" || ui.overlay === "tutorial" || ui.overlay === "encargo";
  const sheetSig = `${ui.overlay || ""}|${wide ? 1 : 0}`;
  const sheetAnim = sheetSig !== sheetPaintKey;
  sheetPaintKey = sheetSig;
  return `<div class="backdrop" data-backdrop="1"><section class="sheet ${wide ? "wide" : ""}${sheetAnim ? " sheet-in" : ""}" role="dialog">${body}</section></div>`;
}

const TUTORIAL_STEPS = [
  {
    title: "Bienvenida",
    text: "Esto es Sueil, la agenda del taller. Aquí se anotan citas, encargos, clientas y clases. Puedes volver a este tutorial cuando quieras desde Ajustes.",
  },
  {
    title: "Barra de abajo",
    text: "Hoy+ · Agenda · Urgencias · IA · Pendientes · Clases · Trazos. Toca cada botón para cambiar de pantalla. IA abre el chat del taller (con correo del almacén). Clases y Trazos todavía dicen Coming soon.",
  },
  {
    title: "Botón +",
    text: "El botón redondo de la esquina sirve para crear. Con él abres una cita nueva o un encargo nuevo sin perderte en el menú.",
  },
  {
    title: "Hoy y Agenda",
    text: "Hoy muestra lo de este día. Agenda ordena primero las urgencias, luego el día, y dentro del día por hora. Toca una cita o un encargo para verlo.",
  },
  {
    title: "Urgencias y Pendientes",
    text: "Urgencias junta lo que no puede esperar. Pendientes tiene dos partes: lo que falta por hacer, y lo listo que aún no vienen a recoger.",
  },
  {
    title: "Nuevo encargo",
    text: "Escribe nombre o teléfono: si ya existe la clienta, Sueil pregunta «¿Es…?». Elige prendas con los dibujos, fechas de evento y entrega, fotos con Tomar foto o Galería, y notas en la hoja grande.",
  },
  {
    title: "Clientas y Clases",
    text: "En Clientas está la lista y el botón Nueva clienta. En Clases están las alumnas, Nueva alumna y el temario del libro.",
  },
  {
    title: "Ajustes",
    text: "Ahí cambias el tamaño de letra, el brillo, avisos, precios, parámetros y este tutorial. Si algo se ve chico, sube la letra a Grande.",
  },
];

function tutorialHtml() {
  const total = TUTORIAL_STEPS.length;
  const step = Math.max(0, Math.min(ui.tutorialStep || 0, total - 1));
  const item = TUTORIAL_STEPS[step];
  const first = step === 0;
  const last = step === total - 1;
  return `
    ${closeBtn()}
    <p class="kicker">Tutorial · ${step + 1} de ${total}</p>
    <h2>${esc(item.title)}</h2>
    <p class="tutorial-text">${esc(item.text)}</p>
    <div class="tutorial-dots" aria-hidden="true">${TUTORIAL_STEPS.map((_, i) => `<i class="${i === step ? "on" : ""}"></i>`).join("")}</div>
    <div class="row tutorial-nav">
      ${first
        ? `<button class="btn-ghost" type="button" data-action="tutorial-skip">Saltar</button>`
        : `<button class="btn-ghost" type="button" data-action="tutorial-prev">Anterior</button>`}
      ${last
        ? `<button class="btn" type="button" data-action="tutorial-done">Listo</button>`
        : `<button class="btn" type="button" data-action="tutorial-next">Siguiente</button>`}
    </div>`;
}

function openTutorial(step) {
  ui.tutorialStep = typeof step === "number" ? step : 0;
  openOverlay("tutorial", null);
}

function finishTutorial() {
  try { localStorage.setItem("sueil-tutorial-visto", "1"); } catch (err) {}
  ui.overlay = null;
  ui.backOverlay = null;
  ui.tutorialStep = 0;
  render();
}

function closeBtn() {
  return `<button class="close" type="button" data-close="1" aria-label="Cerrar">${svg("close")}</button>`;
}

function citaFormHtml() {
  const cita = ui.cita || {};
  const lookup = findSync(cita.person, cita.phone, "");
  const blocked = syncBlocks(lookup);
  return `
    ${closeBtn()}
    <h2>${cita.id ? "Editar cita" : "Nueva cita"}</h2>
    <label>Nombre<input data-keep="cita-person" data-bind="cita.person" value="${esc(cita.person || "")}" placeholder="Nombre"></label>
    <label>Teléfono<input data-keep="cita-phone" data-bind="cita.phone" type="tel" value="${esc(cita.phone || "")}" placeholder="Se rellena al confirmar..."></label>
    <div data-sync-slot="form">${syncBannerHtml(lookup, "form")}</div>
    <div class="grid-2">
      <label>Fecha<input data-bind="cita.date" data-render="1" type="date" value="${esc(cita.date || ui.day)}"></label>
      <label>Hora<input data-bind="cita.time" data-render="1" type="time" value="${esc(cita.time || "10:00")}"></label>
    </div>
    <p class="meta">Tipo</p>
    <div class="kinds">${CITA_KINDS.map((kind) => `<button type="button" class="kind ${cita.kind === kind ? "on" : ""}" data-cita-kind="${esc(kind)}">${esc(kind.toLowerCase())}</button>`).join("")}</div>
    <label>Notas<input data-keep="cnote" data-bind="cita.note" value="${esc(cita.note || "")}" placeholder="Notas de la cita..."></label>
    ${ui.formError ? `<p class="warn">${esc(ui.formError)}</p>` : ""}
    ${syncSaveNote(lookup)}
    <div class="row"><button class="btn" type="button" data-action="guardar-cita" ${blocked ? "disabled" : ""}>Guardar</button><button class="btn-ghost" type="button" data-close="1">Cancelar</button></div>`;
}

function citaDetalleHtml() {
  const appt = state.appointments.find((item) => item.id === ui.apptId);
  if (!appt) return `${closeBtn()}<p class="empty">Esa cita ya no está.</p>`;
  const job = jobById(appt.jobId);
  const client = job ? clientById(job.clientId) : null;
  return `
    ${closeBtn()}
    <p class="kicker">Resumen</p>
    <h2>${esc(client ? client.name : (appt.person || "Cita"))}</h2>
    <p class="lede">${esc(longDate(appt.date))} · ${esc(appt.time || "")}</p>
    <span class="pill on">${esc((appt.kind || "cita").toLowerCase())}</span>
    <p class="meta" style="margin-top:12px">${esc(appt.note || "Sin notas")}</p>
    ${job ? `<button class="card" type="button" data-open-job="${esc(job.id)}" style="width:100%;margin-top:12px;text-align:left"><div class="who">Ver encargo</div><div class="sub">${esc(garmentSummary(job))}</div></button>` : `<button class="btn" type="button" data-action="encargo-nuevo" style="width:100%;margin-top:12px">Crear encargo</button>`}
    <div class="row" style="margin-top:12px">
      <button class="btn-ghost" type="button" data-action="editar-cita">Editar</button>
      <button class="btn" type="button" data-action="cita-hecha">${appt.done ? "Reabrir" : "Marcar hecha"}</button>
      <button class="btn-ghost" type="button" data-close="1">Cerrar</button>
    </div>`;
}

function sketchTipo(job) {
  const t = String(job.type || "").toLowerCase();
  if (t.includes("alter") || t.includes("arreglo") || t.includes("ajuste")) return "alteracion";
  return "nuevo";
}

function sketchDesc(job) {
  const g = (job.garments || []).find((item) => item.kind || item.custom);
  if (g) return garmentLabel(g);
  return String(job.type || "").trim() && !/^encargo$/i.test(job.type) ? job.type : "";
}

function encargoFormHtml() {
  // Layout literal del "Detalle de encargo" del sketch-circuito-encargo (también para Nuevo).
  const draft = ui.draft;
  if (!draft) return "";
  const job = draft.job;
  const lookup = findSync(draft.person, draft.phone, "");
  const blocked = syncBlocks(lookup);
  const existing = state.jobs.some((item) => item.id === job.id);
  const garments = (job.garments || []).filter((item) => item.kind || item.custom || item.photo || amount(item.price));
  const presupuesto = amount(job.presupuesto) || garments.reduce((sum, item) => sum + amount(item.price), 0);
  const urg = job.urgent ? amount(job.urgencyFee) || urgencyPrice() : 0;
  const totalPagar = Math.max(0, presupuesto + urg - amount(job.deposit));
  return `
    ${closeBtn()}
    <p class="kicker">${existing ? "Detalle de encargo" : "Nuevo encargo"}</p>
    <h2 class="detalle-title">
      <input class="name-inline" data-keep="encargo-person" data-bind="draft.person" list="clientas-list" value="${esc(draft.person || "")}" placeholder="Nombre de la clienta">
      <button type="button" class="badge-cm ${job.picky ? "" : "ghost"}" data-action="toggle-cm" title="CM">CM</button>
    </h2>
    <datalist id="clientas-list">${(state.clients || []).map((c) => `<option value="${escAttr(c.name || "")}"></option>`).join("")}</datalist>
    <input type="hidden" data-bind="draft.phone" value="${esc(draft.phone || "")}">
    <div data-sync-slot="form">${syncBannerHtml(lookup, "form")}</div>
    <p class="field-label">Prendas</p>
    <div class="prendas-list">
      ${(garments.length ? garments : [{ id: "empty", kind: "", custom: "", color: "", price: 0 }]).map((item) => `
        <div class="prenda-row">
          <label class="check tiny"><input type="checkbox" data-garment-done="${esc(item.id)}" ${item.done ? "checked" : ""} ${item.id === "empty" ? "disabled" : ""}></label>
          <button class="prenda-kind" type="button" data-action="agregar-prenda">${esc(item.kind || item.custom ? garmentLabel(item) : "Elegir prenda")}</button>
          <button class="color-wheel" type="button" data-pick-color="${esc(item.id === "empty" ? "" : item.id)}" aria-label="Color" title="Toca · abre cromático">
            <span class="wheel"></span>
            <span class="swatch mini" style="background:${escAttr(colorHex(item.color))}"></span>
          </button>
          ${item.id === "empty" ? `<span class="prenda-price">$0</span>` : `<button class="prenda-price" type="button" data-num="price" data-id="${esc(item.id)}">${esc(money(amount(item.price)))}</button>`}
          ${item.id !== "empty" ? `<button class="btn-ghost tiny" type="button" data-drop-garment="${esc(item.id)}">×</button>` : ""}
        </div>`).join("")}
      <button class="btn sky add-prenda" type="button" data-action="agregar-prenda">+ Agregar prenda</button>
    </div>
    ${photoButtons("garment", (garments[0] && garments[0].id) || ui.pickId || "")}
    ${(garments[0] && garments[0].photo) ? `<img class="shot" src="${escAttr(garments[0].photo)}" alt="Foto prenda">` : ""}
    ${ui.pad && ui.pad.kind === "price" ? padBlock("price") : ""}
    <div class="grid-2 notas-medidas">
      <button class="soft-box" type="button" data-action="notas">
        <span class="meta">Notas</span>
        <span>${esc(job.note || "Sin notas aún")}</span>
      </button>
      <button class="soft-box" type="button" data-action="medidas">
        <span class="meta">Medidas</span>
        <span>Abrir medidas</span>
      </button>
    </div>
    <div class="grid-2 fechas-box">
      <label class="soft-box on">Fecha de entrega
        <input data-bind="job.dueDate" data-render="1" type="date" value="${esc(job.dueDate || "")}">
        <input data-bind="job.dueTime" data-render="1" type="time" value="${esc(job.dueTime || "12:00")}">
      </label>
      <label class="soft-box">Fecha del evento
        <input data-bind="job.eventDate" data-render="1" type="date" value="${esc(job.eventDate || "")}">
      </label>
    </div>
    <div class="row toggles">
      <label class="check"><input type="checkbox" data-bind="job.broughtShoes" ${job.broughtShoes ? "checked" : ""}> Trajo zapatos</label>
      <label class="check"><input type="checkbox" data-bind="job.urgent" data-render="1" ${job.urgent ? "checked" : ""}> Urgente</label>
    </div>
    <div class="money-grid">
      <button type="button" data-num="presupuesto"><span class="meta">Presupuesto</span><b>${esc(money(presupuesto || amount(job.presupuesto)))}</b></button>
      <button type="button" data-num="deposit"><span class="meta">Anticipo</span><b>${esc(money(amount(job.deposit)))}</b></button>
      <button type="button" data-num="urgency" ${job.urgent ? "" : "disabled"}><span class="meta">Urgencia</span><b>${esc(money(urg))}</b></button>
    </div>
    ${ui.pad && ["presupuesto", "deposit", "urgency"].includes(ui.pad.kind) ? padBlock() : ""}
    <p class="total-pay">Total a pagar <b>${esc(money(totalPagar))}</b></p>
    ${ui.formError ? `<p class="warn">${esc(ui.formError)}</p>` : ""}
    ${syncSaveNote(lookup)}
    <div class="row wrap-actions">
      <button class="btn-ghost" type="button" data-action="recibo">Recibo</button>
      <button class="btn-ghost" type="button" data-action="notas">Notas</button>
      <button class="btn-ghost" type="button" data-action="medidas">Medidas</button>
      ${existing ? `<button class="btn" type="button" data-action="entregar">${job.status === "entregado" ? "Reabrir" : "Marcar entregado"}</button>` : ""}
      <button class="btn" type="button" data-action="guardar-encargo" ${blocked ? "disabled" : ""}>${existing ? "Guardar" : "Guardar"}</button>
      <button class="btn plum" type="button" data-close="1">${existing ? "Cerrar" : "Cancelar"}</button>
    </div>`;
}

function escAttr(value) {
  return esc(value).replace(/"/g, "&quot;");
}

function photoButtons(part, id) {
  return `<div class="photo-row">
    <button class="btn sky" type="button" data-cam="${part}" data-id="${esc(id || "")}">${svg("cam")} Tomar foto</button>
    <button class="btn-ghost" type="button" data-gal="${part}" data-id="${esc(id || "")}">${svg("image")} Galería</button>
  </div>`;
}

function selectorHtml() {
  const group = GROUPS.find((item) => item.id === ui.pickGroup) || null;
  if (!group) {
    return `${closeBtn()}<h2>Prenda</h2><div class="g-icons">${GROUPS.map((g) => `<button type="button" class="g-icon ${g.sketch ? "sketch" : ""}" data-group="${g.id}"><img src="brand/${g.file}" alt=""><span>${esc(g.label)}</span></button>`).join("")}</div>`;
  }
  return `
    ${closeBtn()}
    <button class="btn-ghost" type="button" data-group="">Grupos</button>
    <h2>${esc(group.label)}</h2>
    <div class="cards">
      ${group.kinds.map((kind) => `<button class="kind-card" type="button" data-kind="${esc(kind)}"><img src="brand/${group.file}" alt=""><span>${esc(kindLabel(kind))}</span></button>`).join("")}
    </div>
    ${group.id === "otro" ? `<label>Cuál es<input data-keep="custom" data-bind="draft.custom" value="${esc((ui.draft && ui.draft.custom) || "")}" placeholder="Escribe la prenda"></label>` : ""}`;
}

function resumenHtml() {
  const job = jobById(ui.jobId);
  if (!job) return `${closeBtn()}<p class="empty">Ese encargo ya no está.</p>`;
  const client = clientById(job.clientId);
  const garment = (job.garments || []).find((item) => item.kind || item.photo) || (job.garments || [])[0];
  const group = groupOf(garment && garment.kind);
  return `
    ${closeBtn()}
    <p class="kicker">Encargo</p>
    <h2>${esc(client ? client.name : "Clienta")} ${job.picky ? `<span class="badge-cm">CM</span>` : ""}</h2>
    <div class="resumen-top">
      <div>
        <p class="meta" style="margin:0 0 6px">Encargo</p>
        <span class="pill ${esc(statusOf(job))}">${esc(statusLabel(job))}</span>
      </div>
      <div class="resumen-media">
        <button type="button" class="g-hit" data-action="abrir-completo" aria-label="Abrir completo">
          <img src="brand/${group.file}" alt="${esc(group.label)}" width="88" height="88">
          <span class="plus-dot">+</span>
        </button>
        <button class="color-side compact" type="button" data-pick-color="${esc((garment && garment.id) || "")}">
          <span class="swatch big" style="background:${escAttr(colorHex(garment && garment.color))}"></span>
          <span>Color</span>
        </button>
      </div>
      <div class="resumen-dates">
        <div>Evento ${esc(shortDate(job.eventDate))}</div>
        <div>Entrega ${esc(shortDate(job.dueDate))} ${esc(job.dueTime || "")}</div>
      </div>
    </div>
    <p class="who">Total ${esc(money(totalOf(job)))}</p>
    <div class="row wrap-actions">
      <button class="btn" type="button" data-action="abrir-completo">Abrir completo</button>
      <button class="btn-ghost" type="button" data-action="recibo">Recibo</button>
      <button class="btn-ghost" type="button" data-action="notas">Notas</button>
      <button class="btn-ghost" type="button" data-close="1">Cerrar</button>
      <button class="btn-ghost" type="button" data-action="medidas">Medidas</button>
      <button class="btn plum" type="button" data-action="entregar">${job.status === "entregado" ? "Volver a activar" : "Marcar entregado"}</button>
      ${client ? `<button class="btn-ghost" type="button" data-open-client="${esc(client.id)}">Ficha</button>` : ""}
    </div>
    ${confirmBtn("job", job.id, "Eliminar encargo")}`;
}

function notasHtml() {
  const job = moneyJob();
  if (!job) return `${closeBtn()}<p class="empty">No hay encargo.</p>`;
  const live = !ui.draft || ui.overlay === "notas" && ui.backOverlay === "resumen";
  return `
    ${closeBtn()}
    <h2>Notas</h2>
    <p class="meta">Hoja grande, con el teclado.</p>
    <textarea class="note-sheet" data-keep="note" ${live ? `data-live="note"` : `data-bind="job.note"`}>${esc(job.note || "")}</textarea>
    <div class="row"><button class="btn-ghost" type="button" data-action="lapiz">${ui.inkOn ? "Ocultar lápiz" : "Hoja con lápiz"}</button></div>
    ${ui.inkOn ? `<canvas class="pad" data-sheet></canvas><button class="btn-ghost" type="button" data-action="limpiar-lapiz">Limpiar lápiz</button>` : ""}
    <button class="btn" type="button" data-close="1">Listo</button>`;
}

function medidasHtml() {
  const job = moneyJob();
  if (!job) return `${closeBtn()}<p class="empty">No hay encargo.</p>`;
  return `
    ${closeBtn()}
    <h2>Medidas</h2>
    ${MEASURES.map(([key, label]) => `
      <button class="measure ${padOpen("measure", "", key) ? "on" : ""}" type="button" data-num="measure" data-key="${esc(key)}">
        <span>${esc(label)}</span><b>${esc((job.measures && job.measures[key]) || "—")}</b>
      </button>
      ${padOpen("measure", "", key) ? keypadHtml() : ""}`).join("")}
    <button class="btn" type="button" data-close="1">Listo</button>`;
}

function reciboHtml() {
  const job = moneyJob();
  if (!job) return `${closeBtn()}<p class="empty">No hay recibo.</p>`;
  const rows = (job.garments || []).filter((item) => item.kind || amount(item.price)).map((item) =>
    `<div class="money-line"><span>${esc(garmentLabel(item))}</span><button class="btn-ghost" type="button" data-num="price" data-id="${esc(item.id)}">${esc(money(amount(item.price)))}</button></div>`);
  const ejemplo = !!job.ejemplo;
  return `
    ${closeBtn()}
    <h2>Recibo</h2>
    <p class="lede">${ejemplo ? "Ejemplo. No está guardado." : esc(clientName(job))}</p>
    ${rows.join("") || `<p class="meta">Sin precios de prenda todavía.</p>`}
    ${job.urgent ? `<div class="money-line"><span>Urgencia</span><button class="btn-ghost" type="button" data-num="urgency">${esc(money(amount(job.urgencyFee)))}</button></div>` : ""}
    <div class="money-line"><span>Total</span><b>${esc(money(totalOf(job)))}</b></div>
    <div class="money-line"><span>Anticipo</span><button class="btn-ghost" type="button" data-num="deposit">${esc(money(amount(job.deposit)))}</button></div>
    <div class="money-line"><span>Pendiente</span><b>${esc(money(dueOf(job)))}</b></div>
    <p class="formula">Total = prendas + urgencia</p>
    ${padBlock()}
    ${ejemplo ? "" : `<button class="btn" type="button" data-action="compartir">Compartir</button>`}`;
}

function cromaticoHtml() {
  const job = moneyJob();
  const garment = currentGarment(job);
  const hex = colorHex(garment && garment.color) || "#103f63";
  if (!garment) {
    return `
      ${closeBtn()}
      <h2>Color</h2>
      <p class="warn">Primero agrega una prenda. Luego elige el color.</p>
      <button class="btn" type="button" data-action="agregar-prenda">Elegir prenda</button>`;
  }
  return `
    ${closeBtn()}
    <h2>Color</h2>
    <p class="meta">Para ${esc(garmentLabel(garment))}</p>
    <div class="swatches">
      ${COLORS.map(([name, hexValue]) => `<button class="swatch ${garment.color === name || garment.color === hexValue ? "on" : ""}" type="button" data-swatch="${esc(name)}" style="background:${hexValue}" aria-label="${esc(name)}"></button>`).join("")}
    </div>
    <label>Rueda<input type="color" data-hue value="${esc(hex.startsWith("#") ? hex : "#103f63")}"></label>
    <p class="meta color-chosen">Elegido: ${esc(garment.color || "ninguno")}</p>
    <button class="btn" type="button" data-close="1">Listo</button>`;
}

function currentGarment(job) {
  if (!job) return null;
  return (job.garments || []).find((item) => item.id === ui.pickId) || [...(job.garments || [])].reverse().find((item) => item.kind || item.custom) || job.garments[0];
}

function statsHtml() {
  const now = new Date();
  const monthStart = isoFromDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = isoFromDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const monthTotal = spanCharged(monthStart, monthEnd);
  return `
    ${closeBtn()}
    <h2>Estadísticas</h2>
    <p class="meta">Suma de encargos por fecha de entrega. El total de cada uno es prendas + urgencia.</p>
    ${stat("Esta semana", money(spanCharged(addDays(0), addDays(6))))}
    ${stat("Este mes", money(monthTotal))}
    ${stat("Anotado en " + now.getFullYear(), money(spanCharged(`${now.getFullYear()}-01-01`, `${now.getFullYear()}-12-31`)))}
    ${stat("Estimado anual", money(monthTotal * 12))}
    ${stat("Clientas", String(state.clients.length))}
    ${stat("Encargos abiertos", String(state.jobs.filter((job) => job.status !== "entregado").length))}
    ${stat("Urgencias", String(state.jobs.filter((job) => job.urgent && job.status !== "entregado").length))}`;
}

function stat(label, value) {
  return `<div class="stat"><span>${esc(label)}</span><b>${esc(value)}</b></div>`;
}

function spanCharged(start, end) {
  return state.jobs.filter((job) => job.dueDate >= start && job.dueDate <= end).reduce((sum, job) => sum + totalOf(job), 0);
}

function paramsHtml() {
  const due = (state.params && state.params.dueTime) || "12:00";
  return `
    ${closeBtn()}
    <h2>Parámetros</h2>
    <div class="card"><p class="who">Orden de la agenda</p><p>Primero la urgencia, luego el día, y dentro del día por hora.</p></div>
    <div class="card"><p class="who">Alteración</p><p>En el taller se dice alteración.</p></div>
    <div class="card"><p class="who">Total</p><p class="formula">Prendas + urgencia.</p></div>
    <label>Hora de entrega de un encargo nuevo<input data-param="dueTime" type="time" value="${esc(due)}"></label>
    <button class="btn" type="button" data-action="precios">Precio de urgencia ${esc(money(urgencyPrice()))}</button>`;
}

function preciosHtml() {
  return `
    ${closeBtn()}
    <h2>Precios</h2>
    <p class="meta">Precio de urgencia</p>
    <p class="who" style="font-size:64px;margin:0">${esc(money(urgencyPrice()))}</p>
    <div class="row">
      <button class="btn-ghost" type="button" data-step="-5">− 5</button>
      <button class="btn-ghost" type="button" data-step="5">+ 5</button>
      <button class="btn" type="button" data-num="urgencyPrice">Teclado</button>
    </div>
    ${padOpen("urgencyPrice") ? keypadHtml() : ""}
    <p class="formula">Total encargo = suma de prendas + urgencia</p>
    <button class="btn" type="button" data-action="ejemplo-recibo">Ver ejemplo en recibo</button>`;
}

function codigosHtml() {
  const access = state.access || { mom: "", dad: "", andres: "" };
  return `
    ${closeBtn()}
    <h2>Códigos</h2>
    <p class="meta">Sirven para saber quién abrió la agenda en un aparato que ya entró.</p>
    <form data-form="codigos">
      <label>Mamá<input name="mom" type="password" required value="${esc(access.mom)}" autocomplete="off"></label>
      <label>Oscar<input name="dad" type="password" required value="${esc(access.dad)}" autocomplete="off"></label>
      <label>Andrés<input name="andres" type="password" required value="${esc(access.andres)}" autocomplete="off"></label>
      ${ui.codeError ? `<p class="warn">${esc(ui.codeError)}</p>` : ""}
      <button class="btn" type="submit">Guardar códigos</button>
    </form>`;
}

function perfilesHtml() {
  return `
    ${closeBtn()}
    <h2>Perfiles</h2>
    <p class="meta">Cada quien con su correo. Este aparato entró con ${esc(ui.cloudEmail || "nadie")}.</p>
    ${profileForm("mom", "Mamá")}
    ${profileForm("dad", "Oscar")}
    ${profileForm("andres", "Andrés")}`;
}

function profileForm(who, label) {
  const saved = (state.profiles && state.profiles[who]) || "";
  const email = saved || (who === "andres" ? ui.cloudEmail : "");
  return `
    <form class="form" data-form="perfil">
      <p class="who">${esc(label)}</p>
      <input type="hidden" name="who" value="${who}">
      <label>Correo<input name="email" type="email" required value="${esc(email)}" autocomplete="off"></label>
      <label>Contraseña<input name="password" type="password" required minlength="6" autocomplete="new-password" placeholder="Su contraseña"></label>
      <button class="btn-ghost" type="submit">${email ? "Guardar entrada" : "Crear entrada"}</button>
    </form>`;
}

function cuentaHtml() {
  return `
    ${closeBtn()}
    <h2>Cuenta</h2>
    <p class="meta">${cloudReady ? "El almacén está conectado." : "Este aparato guarda una copia local."} ${esc(ui.cloudEmail || "")}</p>
    <form data-form="correo">
      <label>Correo nuevo<input name="email" type="email" required value="${esc(ui.cloudEmail)}"></label>
      <button class="btn-ghost" type="submit">Cambiar correo</button>
    </form>
    <form data-form="clave">
      <label>Contraseña nueva<input name="password" type="password" required minlength="6"></label>
      <label>Otra vez<input name="again" type="password" required minlength="6"></label>
      <button class="btn-ghost" type="submit">Cambiar contraseña</button>
    </form>
    <button class="btn" type="button" data-action="backup">Guardar copia</button>
    <p class="meta">La copia baja un archivo. No borra clientas, encargos ni citas.</p>`;
}

function clientaFormHtml() {
  const draft = ui.draft || { person: "", phone: "" };
  const lookup = findSync(draft.person, draft.phone, "");
  const blocked = syncBlocks(lookup);
  return `
    ${closeBtn()}
    <h2>Nueva clienta</h2>
    <label>Nombre<input data-keep="clienta-person" data-bind="draft.person" value="${esc(draft.person || "")}"></label>
    <label>Teléfono<input data-keep="clienta-phone" data-bind="draft.phone" type="tel" value="${esc(draft.phone || "")}"></label>
    <div data-sync-slot="form">${syncBannerHtml(lookup, "form")}</div>
    ${ui.formError ? `<p class="warn">${esc(ui.formError)}</p>` : ""}
    <div data-sync-note>${syncSaveNote(lookup)}</div>
    <button class="btn" type="button" data-action="guardar-clienta" data-save-clienta ${blocked ? "disabled" : ""}>Guardar</button>`;
}

function alumnaFormHtml() {
  const draft = ui.draft || { person: "" };
  return `
    ${closeBtn()}
    <h2>Nueva alumna</h2>
    <label>Nombre<input data-keep="person" data-bind="draft.person" value="${esc(draft.person || "")}"></label>
    ${ui.formError ? `<p class="warn">${esc(ui.formError)}</p>` : ""}
    <button class="btn" type="button" data-action="guardar-alumna">Guardar</button>`;
}

function alumnaFichaHtml() {
  const student = (state.students || []).find((item) => item.id === ui.studentId);
  if (!student) return `${closeBtn()}<p class="empty">Esa ficha ya no está.</p>`;
  student.progress = student.progress || {};
  return `
    ${closeBtn()}
    <h2>${esc(student.name || "Alumna")}</h2>
    <label>Nombre<input data-keep="alumna" data-student-name value="${esc(student.name || "")}" placeholder="Nombre de la alumna"></label>
    <p class="meta">Toca una clase para cambiar: en curso, hecha, próxima.</p>
    ${TEMARIO.map((title, index) => {
      const mark = student.progress[index] || "";
      const suffix = mark === "hecha" ? " ✓" : mark === "curso" ? " — en curso" : mark === "proxima" ? " — próxima" : "";
      return `<button class="topic ${esc(mark)}" type="button" data-topic="${index}">${index + 1}. ${esc(title)}${esc(suffix)}</button>`;
    }).join("")}
    ${confirmBtn("student", student.id, "Quitar alumna")}`;
}

function temarioHtml() {
  return `
    ${closeBtn()}
    <h2>Temario</h2>
    <p class="meta">Curso de costura · taller Sueil</p>
    <ol>${TEMARIO.map((title, index) => `<li style="font-size:1.2rem;margin:8px 0">${String(index + 1).padStart(2, "0")} ${esc(title)}</li>`).join("")}</ol>`;
}

function confirmBtn(kind, id, label) {
  const armed = ui.confirm && ui.confirm.kind === kind && ui.confirm.id === id;
  if (!armed) return `<button class="btn-ghost" type="button" data-delete="${kind}" data-id="${esc(id)}">${esc(label)}</button>`;
  return `<div class="row"><button class="btn plum" type="button" data-delete="${kind}" data-id="${esc(id)}">Sí, eliminar</button><button class="btn-ghost" type="button" data-delete="cancel">Cancelar</button></div>`;
}

function padOpen(kind, id, key) {
  const pad = ui.pad;
  return Boolean(pad && pad.kind === kind && (pad.id || "") === (id || "") && (pad.key || "") === (key || ""));
}

function padBlock(kind) {
  if (!ui.pad) return "";
  if (kind && ui.pad.kind !== kind) return "";
  return keypadHtml();
}

function keypadHtml() {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "+"];
  return `
    <div class="keypad">
      <p>${esc(ui.pad.label)}</p>
      <p class="keypad-value">${esc(ui.pad.value || "0")}</p>
      <div class="keys">${keys.map((key) => `<button type="button" data-press="${key}">${key}</button>`).join("")}</div>
      <div class="row">
        <button type="button" class="btn-ghost" data-press="back">Borrar</button>
        <button type="button" class="btn" data-press="ok">Listo</button>
      </div>
    </div>`;
}

function moneyJob() {
  if (ui.sample) return ui.sample;
  if (ui.draft && ui.draft.job && ui.overlay !== "resumen" && ui.overlay !== "cita" && ui.overlay !== "cita-detalle") return ui.draft.job;
  return jobById(ui.jobId);
}

function editingIsLive(job) {
  return !!job && state.jobs.includes(job);
}

function makeJob(clientId) {
  return normalizeJob({
    id: uid(),
    clientId: clientId || "",
    type: "Encargo",
    eventDate: addDays(30),
    eventTime: "18:00",
    dueDate: addDays(20),
    dueTime: (state.params && state.params.dueTime) || "12:00",
    price: 0,
    deposit: 0,
    urgencyFee: 0,
    presupuesto: 0,
    urgent: false,
    listo: false,
    broughtShoes: false,
    picky: false,
    measures: {},
    garments: [],
    status: "activo",
    note: "",
    drawing: "",
  });
}

function applyStatus(job, status) {
  job.status = "activo";
  if (status === "listo") {
    job.listo = true;
    job.urgent = false;
    (job.garments || []).forEach((item) => { if (item.kind || item.custom) item.done = true; });
  } else if (status === "urgente") {
    job.urgent = true;
    job.listo = false;
    if (!amount(job.urgencyFee)) job.urgencyFee = urgencyPrice();
  } else {
    job.urgent = false;
    job.listo = false;
    job.urgencyFee = 0;
  }
}

function openEncargo(id, full) {
  const existing = id ? jobById(id) : null;
  const job = existing ? JSON.parse(JSON.stringify(existing)) : makeJob(ui.clientId || "");
  const client = clientById(job.clientId);
  ui.jobId = job.id;
  if (job.clientId) ui.clientId = job.clientId;
  ui.draft = {
    person: client ? client.name || "" : "",
    phone: client ? client.phone || "" : "",
    custom: "",
    job,
    full: true,
  };
  ui.sample = null;
  ui.formError = "";
  resetSync(client && String(client.name || "").trim() ? client.id : "");
  ui.overlay = "encargo";
  ui.backOverlay = null;
  ui.fab = false;
  render();
}

function openCita(appt) {
  const job = appt ? jobById(appt.jobId) : (ui.jobId ? jobById(ui.jobId) : null);
  const client = job ? clientById(job.clientId) : (ui.clientId ? clientById(ui.clientId) : null);
  ui.cita = appt ? {
    id: appt.id,
    person: client ? client.name : "",
    phone: client ? client.phone || "" : "",
    jobId: appt.jobId,
    date: appt.date,
    time: appt.time,
    kind: appt.kind || "Prueba",
    note: appt.note || "",
  } : {
    person: client ? client.name : "",
    phone: client ? client.phone || "" : "",
    jobId: job ? job.id : "",
    date: ui.day || addDays(0),
    time: "10:00",
    kind: "Prueba",
    note: "",
  };
  ui.formError = "";
  resetSync(client && String(client.name || "").trim() ? client.id : "");
  ui.overlay = "cita";
  ui.fab = false;
  render();
}

function openOverlay(name, back) {
  ui.backOverlay = back === undefined ? ui.overlay : back;
  ui.overlay = name;
  ui.fab = false;
  render();
}

function closeTop() {
  const nested = ["selector", "cromatico", "medidas", "notas", "recibo", "temario"];
  if (nested.includes(ui.overlay) && ui.backOverlay) {
    ui.overlay = ui.backOverlay;
    ui.backOverlay = null;
    ui.pad = null;
    if (ui.overlay !== "recibo") ui.sample = null;
    render();
    return;
  }
  if (ui.overlay === "tutorial") {
    finishTutorial();
    return;
  }
  ui.overlay = null;
  ui.backOverlay = null;
  ui.draft = null;
  ui.cita = null;
  ui.sample = null;
  ui.pad = null;
  ui.formError = "";
  ui.fab = false;
  ui.inkOn = false;
  ui.syncBuffer = null;
  sheetPaintKey = "";
  resetSync("");
  render();
}

function go(view) {
  ui.view = view;
  ui.overlay = null;
  ui.fab = false;
  ui.draft = null;
  ui.cita = null;
  ui.sample = null;
  ui.pad = null;
  ui.confirm = null;
  ui.syncBuffer = null;
  if (view !== "clientas") ui.formError = "";
  render();
}

function setPath(root, path, value) {
  const parts = path.split(".");
  let cur = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (!cur[parts[i]]) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function onField(event) {
  const el = event.target;
  if (!el || !el.dataset) return;
  if (el.dataset.q) {
    ui.q[el.dataset.q] = el.value;
    // Re-filtrar lista sin animación de entrada (paintKey estable).
    render();
    return;
  }
  if (el.dataset.iaDraft != null) {
    ui.iaDraft = el.value;
    return;
  }
  if (el.dataset.bright != null) {
    ui.brightness = Number(el.value) || 100;
    localStorage.setItem("sueil-brillo", String(ui.brightness));
    const app = document.querySelector(".app");
    if (app) app.style.filter = ui.brightness === 100 ? "" : `brightness(${ui.brightness / 100})`;
    return;
  }
  if (el.dataset.live === "note") {
    const job = jobById(ui.jobId);
    if (job) {
      job.note = el.value;
      persist();
    }
    return;
  }
  if (el.dataset.param) {
    state.params[el.dataset.param] = el.value;
    persist();
    return;
  }
  if (el.dataset.sketchDesc != null) {
    if (!ui.draft || !ui.draft.job) return;
    const text = el.value.trim();
    const job = ui.draft.job;
    job.garments = job.garments || [];
    let g = job.garments.find((item) => item.kind || item.custom) || job.garments[0];
    if (!g) {
      g = { id: uid(), name: "", kind: "Otro", custom: text, color: "", note: "", price: 0, done: false };
      job.garments.push(g);
    } else {
      g.kind = "Otro";
      g.custom = text;
    }
    if (!sketchTipo(job) || sketchTipo(job) === "nuevo") {
      if (!String(job.type || "").toLowerCase().includes("alter")) job.type = text || "Nuevo";
    }
    return;
  }
  if (el.dataset.garmentDone != null) {
    const job = moneyJob();
    if (!job || el.dataset.garmentDone === "empty") return;
    const item = (job.garments || []).find((garment) => garment.id === el.dataset.garmentDone);
    if (item) {
      item.done = !!el.checked;
      if (editingIsLive(job)) persist();
    }
    return;
  }
  if (el.dataset.hue != null) {
    const garment = currentGarment(moneyJob());
    if (garment) {
      garment.color = el.value;
      if (editingIsLive(moneyJob())) persist();
    }
    const note = document.querySelector(".sheet .color-chosen");
    if (note) note.textContent = "Elegido: " + el.value;
    return;
  }
  if (el.dataset.clientField && ui.clientId) {
    const client = clientById(ui.clientId);
    if (client) {
      const nextName = el.dataset.clientField === "name" ? el.value : fichaName(client);
      const nextPhone = el.dataset.clientField === "phone" ? el.value : fichaPhone(client);
      noteSyncTyping(nextName, nextPhone);
      const lookup = findSync(nextName, nextPhone, client.id);
      if (lookup.state === "match") ui.syncBuffer = { id: client.id, name: nextName, phone: nextPhone };
      else {
        client.name = nextName;
        client.phone = nextPhone;
        ui.syncBuffer = null;
        persist();
      }
      patchSyncSlot();
    }
    return;
  }
  if (el.dataset.studentName != null) {
    const student = (state.students || []).find((item) => item.id === ui.studentId);
    if (student) {
      student.name = el.value;
      persist();
    }
    return;
  }
  if (!el.dataset.bind) return;
  if (el.type === "checkbox" && event.type !== "change") return;
  if (el.type !== "checkbox" && event.type === "change" && el.type !== "date" && el.type !== "time") return;
  const value = el.type === "checkbox" ? el.checked : el.value;
  if (el.dataset.bind.startsWith("cita.") && ui.cita) setPath(ui.cita, el.dataset.bind.slice(5), value);
  if (el.dataset.bind.startsWith("draft.") && ui.draft) setPath(ui.draft, el.dataset.bind.slice(6), value);
  if (el.dataset.bind.startsWith("job.") && ui.draft && ui.draft.job) {
    const key = el.dataset.bind.slice(4);
    ui.draft.job[key] = value;
    if (key === "urgent" && value && !amount(ui.draft.job.urgencyFee)) {
      ui.draft.job.urgencyFee = urgencyPrice();
    }
    if (key === "urgent" && !value) ui.draft.job.urgencyFee = 0;
  }
  if (["draft.person", "draft.phone", "cita.person", "cita.phone"].includes(el.dataset.bind)) {
    const ctx = syncContext();
    if (ctx) noteSyncTyping(ctx.name, ctx.phone);
    patchSyncSlot();
  }
  if (el.dataset.bind === "draft.custom" && ui.draft && ui.draft.job && ui.pickId) {
    const item = ui.draft.job.garments.find((garment) => garment.id === ui.pickId);
    if (item && item.kind === "Otro") item.custom = el.value;
  }
  // Solo re-montar para checkbox/fecha/hora o campos que lo piden; nunca en texto libre.
  if (el.type === "checkbox" || el.type === "date" || el.type === "time" || el.dataset.render === "1") render();
}

function onClick(event) {
  const btn = event.target.closest("button, [data-open-job], [data-open-client], [data-open-appt]");
  if (event.target.dataset && event.target.dataset.backdrop) {
    closeTop();
    return;
  }
  if (!btn) return;
  if (btn.dataset.close != null) { closeTop(); return; }
  if (btn.dataset.go) { go(btn.dataset.go); return; }
  if (btn.dataset.fab) { onFab(btn.dataset.fab); return; }
  if (btn.dataset.day) { ui.day = btn.dataset.day; render(); return; }
  if (btn.dataset.urg) { ui.urgSort = btn.dataset.urg; render(); return; }
  if (btn.dataset.pend) { ui.pendHub = btn.dataset.pend; render(); return; }
  if (btn.dataset.arch) { ui.archTab = btn.dataset.arch; render(); return; }
  if (btn.dataset.openJob) { openResumen(btn.dataset.openJob); return; }
  if (btn.dataset.openAppt) { openAppt(btn.dataset.openAppt); return; }
  if (btn.dataset.openClient) { openClient(btn.dataset.openClient); return; }
  if (btn.dataset.pill) { onPill(btn.dataset.pill); return; }
  if (btn.dataset.text) {
    ui.text = btn.dataset.text;
    localStorage.setItem("sueil-texto", ui.text);
    render();
    return;
  }
  if (btn.dataset.switch) { onSwitch(btn.dataset.switch); return; }
  if (btn.dataset.citaKind && ui.cita) { ui.cita.kind = btn.dataset.citaKind; render(); return; }
  if (btn.dataset.status && ui.draft) { applyStatus(ui.draft.job, btn.dataset.status); render(); return; }
  if (btn.dataset.group != null) { ui.pickGroup = btn.dataset.group; ui.overlay = "selector"; ui.backOverlay = ui.backOverlay || "encargo"; render(); return; }
  if (btn.dataset.kind) { pickKind(btn.dataset.kind); return; }
  if (btn.dataset.confirmClient) { confirmClient(btn.dataset.confirmClient); return; }
  if (btn.dataset.suggestNo != null) { dismissSync(); return; }
  if (btn.dataset.sketchTipo) {
    if (!ui.draft || !ui.draft.job) return;
    ui.draft.job.type = btn.dataset.sketchTipo === "alteracion" ? "Alteración" : "Nuevo";
    render();
    return;
  }
  if (btn.dataset.dropGarment) { dropGarment(btn.dataset.dropGarment); return; }
  if (btn.dataset.pickColor != null) {
    const id = btn.dataset.pickColor;
    if (id) ui.pickId = id;
    const job = moneyJob();
    const garment = currentGarment(job);
    if (!garment) {
      toast("Primero elige una prenda");
      ui.pickGroup = null;
      openOverlay("selector", ui.overlay || "encargo");
      return;
    }
    ui.pickId = garment.id;
    openOverlay("cromatico");
    return;
  }
  if (btn.dataset.cam) { shoot(btn.dataset.cam, btn.dataset.id, "cam"); return; }
  if (btn.dataset.gal) { shoot(btn.dataset.gal, btn.dataset.id, "gal"); return; }
  if (btn.dataset.num) { openPad(btn); return; }
  if (btn.dataset.press) { pressKey(btn.dataset.press); return; }
  if (btn.dataset.swatch) { paintColor(btn.dataset.swatch); return; }
  if (btn.dataset.step) { stepPrice(Number(btn.dataset.step)); return; }
  if (btn.dataset.student) { ui.studentId = btn.dataset.student; openOverlay("alumna-ficha", null); return; }
  if (btn.dataset.topic != null) { cycleTopic(Number(btn.dataset.topic)); return; }
  if (btn.dataset.delete) { onDelete(btn.dataset.delete, btn.dataset.id); return; }
  if (btn.dataset.action) { onAction(btn.dataset.action); }
}

function onFab(action) {
  if (action === "toggle") { ui.fab = !ui.fab; render(); return; }
  ui.fab = false;
  if (action === "cita-nueva") { ui.clientId = null; ui.jobId = null; openCita(null); return; }
  if (action === "encargo-nuevo") { ui.clientId = null; openEncargo(null, false); return; }
  if (action === "clienta-nueva") { startClienta(); return; }
  if (action === "encargos" || action === "archivos" || action === "ajustes" || action === "clientas") go(action);
}

function openResumen(id) {
  const job = jobById(id);
  if (!job) return;
  ui.jobId = job.id;
  ui.clientId = job.clientId;
  ui.draft = null;
  ui.sample = null;
  ui.overlay = "resumen";
  ui.backOverlay = null;
  ui.fab = false;
  render();
}

function openAppt(id) {
  const appt = state.appointments.find((item) => item.id === id);
  ui.apptId = id;
  if (appt && appt.jobId && jobById(appt.jobId)) {
    openResumen(appt.jobId);
    return;
  }
  // Cita sin encargo: resumen compacto (no el formulario largo).
  ui.overlay = "cita-detalle";
  ui.fab = false;
  render();
}

function openClient(id) {
  ui.clientId = id;
  ui.view = "clientas";
  ui.overlay = null;
  ui.fab = false;
  const jobs = jobsOf(id);
  ui.jobId = jobs[0] ? jobs[0].id : null;
  render();
}

function onPill(id) {
  const job = jobById(id);
  if (!job) return;
  if (statusOf(job) === "pendiente") {
    job.listo = true;
    persist();
    render();
    return;
  }
  openResumen(id);
}

function onSwitch(name) {
  if (name === "sonido") {
    setFlag("sueil-sonido", localStorage.getItem("sueil-sonido") !== "1");
    render();
    return;
  }
  const key = name === "avisos-citas" ? "sueil-avisos-citas" : "sueil-avisos-urgencias";
  const next = !flagOn(key, "sueil-avisos");
  if (next) enableAvisos().then(() => { setFlag(key, true); render(); });
  else { setFlag(key, false); render(); }
}

function pickKind(kind) {
  if (!ui.draft || !ui.draft.job) openEncargo(ui.jobId, false);
  const job = ui.draft.job;
  const custom = kind === "Otro" ? (ui.draft.custom || "") : "";
  if (ui.pickId) {
    const item = job.garments.find((garment) => garment.id === ui.pickId);
    if (item) {
      item.kind = kind;
      item.custom = custom;
      item.name = garmentTitle(item);
    }
  } else {
    const item = { id: uid(), kind, custom, color: "", note: "", photo: "", price: 0, done: false, name: kind };
    job.garments.push(item);
    ui.pickId = item.id;
  }
  ui.overlay = "encargo";
  ui.backOverlay = null;
  render();
}

function dropGarment(id) {
  if (!ui.draft) return;
  ui.draft.job.garments = ui.draft.job.garments.filter((item) => item.id !== id);
  render();
}

function dismissSync() {
  const ctx = syncContext();
  const lookup = ctx ? findSync(ctx.name, ctx.phone, ctx.exclude) : null;
  if (lookup && lookup.client) ui.syncDismissed = lookup.client.id;
  ui.formError = "";
  if (ctx && ctx.mode === "ficha" && ui.syncBuffer && ui.syncBuffer.id === ctx.exclude) {
    const client = clientById(ctx.exclude);
    if (client) {
      client.name = ui.syncBuffer.name;
      client.phone = ui.syncBuffer.phone;
      persist();
    }
    ui.syncBuffer = null;
  }
  render();
}

function confirmClient(id) {
  const client = clientById(id);
  if (!client) return;
  ui.formError = "";
  ui.syncHideNone = false;
  if (!ui.overlay && ui.view === "clientas" && ui.clientId && ui.clientId !== client.id) {
    const leaving = ui.clientId;
    const leavingClient = clientById(leaving);
    ui.syncBuffer = null;
    if (leavingClient && ui.freshClientId === leaving && !String(leavingClient.name || "").trim() && !String(leavingClient.phone || "").trim() && !jobsOf(leaving).length) {
      state.clients = state.clients.filter((item) => item.id !== leaving);
      ui.freshClientId = "";
      persist();
    }
    ui.syncConfirmed = client.id;
    ui.syncDismissed = "";
    openClient(client.id);
    return;
  }
  ui.syncConfirmed = client.id;
  ui.syncDismissed = "";
  applyLinkedClient(client);
  render();
}

function startClienta() {
  ui.syncBuffer = null;
  if (ui.freshClientId) {
    const existing = clientById(ui.freshClientId);
    if (existing && !String(existing.name || "").trim() && !String(existing.phone || "").trim() && !jobsOf(existing.id).length) {
      resetSync("");
      openClient(existing.id);
      return;
    }
  }
  const client = { id: uid(), name: "", phone: "", nameDrawing: "" };
  state.clients.push(client);
  ui.freshClientId = client.id;
  resetSync("");
  ui.formError = "";
  persist();
  openClient(client.id);
}

function startAlumna() {
  state.students = state.students || [];
  if (ui.freshStudentId) {
    const existing = state.students.find((item) => item.id === ui.freshStudentId);
    if (existing && !String(existing.name || "").trim()) {
      ui.studentId = existing.id;
      ui.view = "clases";
      ui.draft = null;
      ui.formError = "";
      openOverlay("alumna-ficha", null);
      return;
    }
  }
  const student = { id: uid(), name: "", status: "nueva", progress: {} };
  state.students.push(student);
  ui.freshStudentId = student.id;
  ui.studentId = student.id;
  ui.view = "clases";
  ui.draft = null;
  ui.formError = "";
  persist();
  openOverlay("alumna-ficha", null);
}

function createFromSync() {
  const ctx = syncContext();
  if (!ctx || ctx.mode !== "form") return;
  const name = String(ctx.name || "").trim();
  const phone = String(ctx.phone || "").trim();
  if (!name) {
    ui.formError = "Escribe el nombre para crear la clienta.";
    render();
    return;
  }
  let client = state.clients.find((item) => fold(item.name) === fold(name));
  if (!client && ui.freshClientId) {
    const fresh = clientById(ui.freshClientId);
    if (fresh && !String(fresh.name || "").trim() && !jobsOf(fresh.id).length) client = fresh;
  }
  if (!client) {
    client = { id: uid(), name, phone, nameDrawing: "" };
    state.clients.push(client);
  } else if (!String(client.name || "").trim()) client.name = name;
  if (phone && (!String(client.phone || "").trim() || client.id === ui.freshClientId)) client.phone = phone;
  persist();
  ui.syncConfirmed = client.id;
  ui.syncDismissed = "";
  ui.syncHideNone = false;
  ui.formError = "";
  applyLinkedClient(client);
  render();
}

function shoot(part, id, which) {
  ui.photoSlot = { part, id: id || ui.pickId || "" };
  const input = document.getElementById(which === "cam" ? "cam" : "gal");
  if (input) input.click();
}

function openPad(btn) {
  const kind = btn.dataset.num;
  const job = moneyJob();
  let value = "";
  let label = "Número";
  if (kind === "price" && job) {
    const item = (job.garments || []).find((garment) => garment.id === btn.dataset.id) || currentGarment(job);
    value = item ? String(item.price || "") : "";
    label = "Precio";
    ui.pickId = item ? item.id : "";
  }
  if (kind === "deposit" && job) { value = String(job.deposit || ""); label = "Anticipo"; }
  if (kind === "urgency" && job) { value = String(job.urgencyFee || ""); label = "Urgencia"; }
  if (kind === "presupuesto" && job) { value = String(job.presupuesto || ""); label = "Presupuesto"; }
  if (kind === "urgencyPrice") { value = String(urgencyPrice()); label = "Precio de urgencia"; }
  if (kind === "measure" && job) {
    value = (job.measures && job.measures[btn.dataset.key]) || "";
    label = (MEASURES.find(([key]) => key === btn.dataset.key) || [, "Medida"])[1];
    // id vacío: padOpen("measure","",key) debe coincidir (pickId de prenda rompía el teclado)
    ui.pad = { kind, id: "", key: btn.dataset.key || "", value, label };
    render();
    return;
  }
  ui.pad = { kind, id: btn.dataset.id || ui.pickId || "", key: btn.dataset.key || "", value, label };
  render();
}

function writePad(value) {
  const pad = ui.pad;
  if (!pad) return;
  const job = moneyJob();
  if (pad.kind === "urgencyPrice") {
    state.params.urgencyPrice = value;
    pad.value = value;
    persist();
    return;
  }
  if (!job) return;
  if (pad.kind === "deposit") job.deposit = value;
  if (pad.kind === "urgency") job.urgencyFee = value;
  if (pad.kind === "presupuesto") job.presupuesto = value;
  if (pad.kind === "measure") {
    job.measures = job.measures || {};
    job.measures[pad.key] = value;
  }
  if (pad.kind === "price") {
    const item = (job.garments || []).find((garment) => garment.id === pad.id);
    if (item) item.price = value;
    job.price = (job.garments || []).reduce((sum, garment) => sum + amount(garment.price), 0);
  }
  pad.value = value;
  if (editingIsLive(job) || pad.kind === "urgencyPrice") persist();
}

function refreshPadUi() {
  const pad = ui.pad;
  if (!pad) return;
  const valueEl = document.querySelector(".keypad-value");
  if (valueEl) valueEl.textContent = pad.value || "0";
  if (pad.kind === "measure" && pad.key) {
    const b = document.querySelector(`button[data-num="measure"][data-key="${pad.key}"] b`);
    if (b) b.textContent = pad.value || "—";
  }
  const moneyKinds = { presupuesto: "presupuesto", deposit: "deposit", urgency: "urgency", price: "price" };
  if (moneyKinds[pad.kind]) {
    const sel = pad.kind === "price" && pad.id
      ? `button[data-num="price"][data-id="${pad.id}"]`
      : `button[data-num="${pad.kind}"] b, button[data-num="${pad.kind}"]`;
    const el = document.querySelector(sel);
    if (el) {
      const target = el.tagName === "B" ? el : el.querySelector("b") || el;
      if (target.tagName === "B") target.textContent = money(amount(pad.value));
      else if (pad.kind === "price") target.textContent = money(amount(pad.value));
    }
  }
}

function pressKey(key) {
  if (!ui.pad) return;
  if (key === "ok") { ui.pad = null; render(); return; }
  let value = ui.pad.value || "";
  if (key === "back") value = value.slice(0, -1);
  else if (value.length < 18) value += key;
  writePad(value);
  // No re-montar toda la app en cada dígito (rompía teclado y animaba el sheet).
  if (document.querySelector(".keypad")) refreshPadUi();
  else render();
}

function paintColor(name) {
  const garment = currentGarment(moneyJob());
  if (!garment) return;
  garment.color = name;
  if (editingIsLive(moneyJob())) persist();
  render();
}

function stepPrice(delta) {
  const next = Math.max(0, urgencyPrice() + delta);
  state.params.urgencyPrice = next;
  persist();
  render();
}

function cycleTopic(index) {
  const student = (state.students || []).find((item) => item.id === ui.studentId);
  if (!student) return;
  student.progress = student.progress || {};
  const order = ["", "curso", "hecha", "proxima"];
  const now = student.progress[index] || "";
  student.progress[index] = order[(order.indexOf(now) + 1) % order.length];
  const marks = Object.values(student.progress);
  student.status = marks.some((mark) => mark === "hecha" || mark === "curso") ? "activa" : "nueva";
  persist();
  render();
}

function onDelete(kind, id) {
  if (kind === "cancel") { ui.confirm = null; render(); return; }
  if (!ui.confirm || ui.confirm.kind !== kind || ui.confirm.id !== id) {
    ui.confirm = { kind, id };
    render();
    return;
  }
  ui.confirm = null;
  if (kind === "appt") removeAppt(id);
  if (kind === "job") removeJob(id);
  if (kind === "client") removeClient(id);
  if (kind === "student") {
    state.students = (state.students || []).filter((item) => item.id !== id);
    ui.overlay = null;
    persist();
    render();
  }
}

function removeAppt(id) {
  state.appointments = state.appointments.filter((item) => item.id !== id);
  ui.overlay = null;
  persist();
  render();
}

function removeJob(id) {
  state.appointments = state.appointments.filter((item) => item.jobId !== id);
  state.jobs = state.jobs.filter((item) => item.id !== id);
  ui.overlay = null;
  ui.jobId = null;
  persist();
  render();
}

function removeClient(id) {
  const jobIds = new Set(jobsOf(id).map((job) => job.id));
  state.appointments = state.appointments.filter((item) => !jobIds.has(item.jobId));
  state.jobs = state.jobs.filter((job) => job.clientId !== id);
  state.clients = state.clients.filter((client) => client.id !== id);
  ui.clientId = null;
  ui.jobId = null;
  ui.overlay = null;
  ui.view = "clientas";
  persist();
  render();
}

function onAction(action) {
  if (action === "guardar-cita") return saveCita();
  if (action === "guardar-encargo") return commitEncargo();
  if (action === "guardar-clienta") return saveClientForm();
  if (action === "guardar-alumna") return saveAlumna();
  if (action === "editar-cita") {
    const appt = state.appointments.find((item) => item.id === ui.apptId);
    if (appt) openCita(appt);
    return;
  }
  if (action === "cita-hecha") {
    const appt = state.appointments.find((item) => item.id === ui.apptId);
    if (!appt) return;
    appt.done = !appt.done;
    persist();
    closeTop();
    return;
  }
  if (action === "encargo-de-clienta") { openEncargo(null, false); return; }
  if (action === "cita-de-clienta") { openCita(null); return; }
  if (action === "clientas-lista") { ui.clientId = null; render(); return; }
  if (action === "expandir" && ui.draft) { ui.draft.full = true; render(); return; }
  if (action === "abrir-completo") { openEncargo(ui.jobId, true); return; }
  if (action === "notas") { ui.inkOn = false; openOverlay("notas"); return; }
  if (action === "medidas") { openOverlay("medidas"); return; }
  if (action === "recibo") { ui.sample = null; openOverlay("recibo"); return; }
  if (action === "color") {
    const job = moneyJob();
    const garment = currentGarment(job);
    if (!garment) {
      toast("Primero elige una prenda");
      ui.pickGroup = null;
      openOverlay("selector", ui.overlay === "encargo" ? "encargo" : ui.overlay);
      return;
    }
    ui.pickId = garment.id;
    openOverlay("cromatico");
    return;
  }
  if (action === "agregar-prenda") {
    ui.pickGroup = null;
    openOverlay("selector", ui.overlay === "cromatico" ? (ui.backOverlay || "encargo") : (ui.overlay || "encargo"));
    return;
  }
  if (action === "toggle-cm") {
    const job = moneyJob();
    if (job) {
      job.picky = !job.picky;
      if (ui.draft && ui.draft.job) ui.draft.job.picky = job.picky;
      if (editingIsLive(job)) persist();
      render();
    }
    return;
  }
  if (action === "lapiz") { ui.inkOn = !ui.inkOn; render(); return; }
  if (action === "limpiar-lapiz") {
    const job = moneyJob();
    if (job) {
      job.drawing = "";
      if (editingIsLive(job)) persist();
      render();
    }
    return;
  }
  if (action === "entregar") {
    const job = jobById(ui.jobId);
    if (!job) return;
    job.status = job.status === "entregado" ? "activo" : "entregado";
    persist();
    toast(job.status === "entregado" ? "Entregado" : "Otra vez activo");
    return;
  }
  if (action === "compartir") return shareReceipt();
  if (action === "stats") return openOverlay("stats", null);
  if (action === "params") return openOverlay("params", null);
  if (action === "precios") return openOverlay("precios", null);
  if (action === "codigos") return openOverlay("codigos", null);
  if (action === "perfiles") return openOverlay("perfiles", null);
  if (action === "cuenta") return openOverlay("cuenta", null);
  if (action === "temario") return openOverlay("temario", null);
  if (action === "ia-clear") {
    iaMessages = [];
    ui.iaError = "";
    ui.iaDraft = "";
    render();
    return;
  }
  if (action === "tutorial") return openTutorial(0);
  if (action === "tutorial-next") {
    ui.tutorialStep = Math.min((ui.tutorialStep || 0) + 1, TUTORIAL_STEPS.length - 1);
    render();
    return;
  }
  if (action === "tutorial-prev") {
    ui.tutorialStep = Math.max((ui.tutorialStep || 0) - 1, 0);
    render();
    return;
  }
  if (action === "tutorial-done" || action === "tutorial-skip") return finishTutorial();
  if (action === "clienta-nueva") return startClienta();
  if (action === "alumna-nueva") return startAlumna();
  if (action === "crear-clienta-sync") return createFromSync();
  if (action === "seguir-editando") {
    ui.syncHideNone = true;
    render();
    return;
  }
  if (action === "ejemplo-recibo") {
    ui.sample = {
      ejemplo: true,
      id: "ejemplo",
      clientId: "",
      type: "Ejemplo",
      urgent: true,
      urgencyFee: urgencyPrice(),
      deposit: 300,
      garments: [{ id: "ej", kind: "V. fiesta", price: 700, color: "rosa", done: false }],
      status: "activo",
      note: "",
    };
    openOverlay("recibo", "precios");
    return;
  }
  if (action === "backup") return downloadBackup();
  if (action === "salir") return signOut();
}

function guardSync(name, phone) {
  const lookup = findSync(name, phone, "");
  if (!syncBlocks(lookup)) return false;
  ui.syncHideNone = false;
  ui.formError = lookup.state === "match"
    ? "Confirma si es " + (lookup.client.name || "esa clienta") + "."
    : "Crea la clienta antes de guardar.";
  render();
  return true;
}

function saveCita() {
  const cita = ui.cita;
  if (!cita) return;
  if (guardSync(cita.person, cita.phone)) return;
  const phone = String(cita.phone || "");
  if (phoneDigits(phone).length < 10) {
    ui.formError = "Para agendar necesita el número telefónico.";
    render();
    return;
  }
  if (!String(cita.person || "").trim() || !cita.date || !cita.time) {
    ui.formError = "Escribe el nombre, la fecha y la hora.";
    render();
    return;
  }
  const clash = state.appointments.some((item) => item.id !== cita.id && item.date === cita.date && item.time === cita.time);
  if (clash) {
    ui.formError = "Esa fecha y esa hora ya tienen cita.";
    render();
    return;
  }
  const jobId = jobForAppointment({
    person: cita.person,
    phone,
    jobId: cita.jobId,
    clientId: ui.syncConfirmed,
    date: cita.date,
    time: cita.time,
    kind: cita.kind,
  });
  if (cita.id) {
    const appt = state.appointments.find((item) => item.id === cita.id);
    if (appt) Object.assign(appt, { jobId, date: cita.date, time: cita.time, kind: cita.kind, note: cita.note || "" });
  } else {
    state.appointments.push({ id: uid(), jobId, date: cita.date, time: cita.time, kind: cita.kind || "Prueba", note: cita.note || "", done: false });
  }
  ui.day = cita.date;
  ui.formError = "";
  ui.cita = null;
  ui.overlay = null;
  ui.view = "agenda";
  persist();
  render();
}

function jobForAppointment(data) {
  const linked = data.clientId ? clientById(data.clientId) : null;
  if (linked) {
    if (data.phone && phoneDigits(data.phone).length >= 10) linked.phone = String(data.phone).trim();
    let job = data.jobId && jobById(data.jobId);
    if (!job || job.clientId !== linked.id) {
      job = state.jobs.find((item) => item.clientId === linked.id && item.status !== "entregado");
    }
    if (!job) {
      job = makeJob(linked.id);
      state.jobs.push(job);
    }
    ui.clientId = linked.id;
    ui.jobId = job.id;
    return job.id;
  }
  if (data.jobId && jobById(data.jobId)) {
    const job = jobById(data.jobId);
    const client = clientById(job.clientId);
    if (client && data.phone && !String(client.phone || "").trim()) client.phone = data.phone;
    return data.jobId;
  }
  const name = String(data.person || "").trim();
  let client = state.clients.find((item) => fold(item.name) === fold(name));
  if (!client) {
    client = { id: uid(), name, phone: data.phone || "", nameDrawing: "" };
    state.clients.push(client);
  } else if (data.phone) client.phone = data.phone;
  let job = state.jobs.find((item) => item.clientId === client.id && item.status !== "entregado");
  if (!job) {
    job = makeJob(client.id);
    state.jobs.push(job);
  }
  ui.clientId = client.id;
  ui.jobId = job.id;
  return job.id;
}

function commitEncargo() {
  const draft = ui.draft;
  if (!draft) return;
  const name = String(draft.person || "").trim();
  const phone = String(draft.phone || "").trim();
  if (guardSync(name, phone)) return;
  if (!name) { ui.formError = "Escribe el nombre."; render(); return; }
  let client = (ui.syncConfirmed && clientById(ui.syncConfirmed)) || state.clients.find((item) => fold(item.name) === fold(name));
  if (!client && phoneDigits(phone).length < 10 && !draft.job.clientId) {
    ui.formError = "Para una clienta nueva hace falta el teléfono.";
    render();
    return;
  }
  if (!client) {
    client = { id: uid(), name, phone, nameDrawing: "" };
    state.clients.push(client);
  } else if (phone) client.phone = phone;
  const job = draft.job;
  job.clientId = client.id;
  job.garments = (job.garments || []).filter((item) => item.kind || item.custom || item.photo || amount(item.price));
  if (!job.garments.length) job.garments = [{ id: uid(), kind: "", custom: "", color: "", note: "", price: 0, done: false, photo: "" }];
  const wasAlter = sketchTipo(job) === "alteracion";
  job.type = wasAlter ? "Alteración" : (garmentSummary(job) || "Nuevo");
  job.price = job.garments.reduce((sum, item) => sum + amount(item.price), 0);
  const existing = state.jobs.find((item) => item.id === job.id);
  if (existing) Object.assign(existing, job);
  else state.jobs.push(job);
  ui.jobId = job.id;
  ui.clientId = client.id;
  ui.draft = null;
  ui.formError = "";
  ui.overlay = "resumen";
  persist();
  render();
}

function saveClientForm() {
  const name = String(ui.draft && ui.draft.person || "").trim();
  const phone = String(ui.draft && ui.draft.phone || "").trim();
  if (guardSync(name, phone)) return;
  if (!name) { ui.formError = "Escribe el nombre."; render(); return; }
  if (ui.syncConfirmed && clientById(ui.syncConfirmed)) {
    const chosen = clientById(ui.syncConfirmed);
    if (phone && !String(chosen.phone || "").trim()) chosen.phone = phone;
    persist();
    openClient(chosen.id);
    return;
  }
  let client = state.clients.find((item) => fold(item.name) === fold(name));
  if (!client) {
    client = { id: uid(), name, phone, nameDrawing: "" };
    state.clients.push(client);
  } else if (phone) client.phone = phone;
  persist();
  openClient(client.id);
}

function saveAlumna() {
  const name = String(ui.draft && ui.draft.person || "").trim();
  if (!name) { ui.formError = "Escribe el nombre."; render(); return; }
  const student = { id: uid(), name, status: "nueva", progress: {} };
  state.students = state.students || [];
  state.students.push(student);
  ui.studentId = student.id;
  ui.draft = null;
  ui.overlay = "alumna-ficha";
  persist();
  render();
}

function shareReceipt() {
  const job = jobById(ui.jobId);
  if (!job) return;
  const lines = [`Sueil`, clientName(job), ...((job.garments || []).map((item) => `${garmentLabel(item)} ${money(amount(item.price))}`))];
  if (job.urgent) lines.push(`Urgencia ${money(amount(job.urgencyFee))}`);
  lines.push(`Total ${money(totalOf(job))}`, `Anticipo ${money(amount(job.deposit))}`, `Pendiente ${money(dueOf(job))}`);
  const text = lines.join("\n");
  const done = () => toast("Recibo copiado");
  if (navigator.share) {
    navigator.share({ title: "Sueil", text }).catch(() => navigator.clipboard?.writeText(text).then(done).catch(() => toast(text)));
    return;
  }
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(() => toast("No se pudo copiar"));
}

function downloadBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `sueil-copia-${addDays(0)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast("Copia lista");
}

function toast(message) {
  ui.toast = message;
  render();
  setTimeout(() => {
    if (ui.toast === message) {
      ui.toast = "";
      render();
    }
  }, 1400);
}

async function signOut() {
  try { if (db) await db.auth.signOut(); } catch (err) { console.warn(err); }
  sessionStorage.removeItem(SESSION);
  cloudReady = false;
  ui.cloud = "entrar";
  ui.overlay = null;
  render();
}

function onSubmit(event) {
  const form = event.target;
  if (!form || !form.dataset || !form.dataset.form) return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  if (form.dataset.form === "nube") cloudEnter(data, event.submitter && event.submitter.name === "crear");
  if (form.dataset.form === "entrar") enterCode(data);
  if (form.dataset.form === "codigos") saveCodes(data);
  if (form.dataset.form === "perfil") saveProfile(data);
  if (form.dataset.form === "correo") changeEmail(data);
  if (form.dataset.form === "clave") changePassword(data);
  if (form.dataset.form === "ia") sendIaChat(data.message || ui.iaDraft);
}

function enterCode(data) {
  const code = String(data.code || "").trim();
  const access = state.access || {};
  const who = code === access.mom ? "mamá" : code === access.dad ? "Oscar" : code === access.andres ? "Andrés" : "";
  if (!who) { ui.badCode = true; render(); return; }
  ui.badCode = false;
  ui.who = who;
  sessionStorage.setItem(SESSION, "1");
  ui.view = "hoy";
  render();
}

function saveCodes(data) {
  const mom = String(data.mom || "").trim();
  const dad = String(data.dad || "").trim();
  const andres = String(data.andres || "").trim();
  if (new Set([mom, dad, andres]).size < 3) {
    ui.codeError = "Los tres códigos tienen que ser distintos.";
    render();
    return;
  }
  state.access = { mom, dad, andres };
  ui.codeError = "";
  ui.settingsNote = "Códigos guardados.";
  sessionStorage.setItem(SESSION, "1");
  persist();
  ui.overlay = null;
  ui.view = "ajustes";
  render();
}

async function saveProfile(data) {
  const who = data.who;
  const label = { mom: "mamá", dad: "Oscar", andres: "Andrés" }[who] || "esa persona";
  const email = String(data.email || "").trim();
  const password = String(data.password || "");
  state.profiles = state.profiles || { mom: "", dad: "", andres: "" };
  if (password.length < 6) {
    ui.settingsNote = "La contraseña de " + label + " necesita al menos 6 caracteres.";
    render();
    return;
  }
  const current = (ui.cloudEmail || "").toLowerCase();
  const previous = String(state.profiles[who] || "").toLowerCase();
  if (db && current && (email.toLowerCase() === current || previous === current)) {
    const update = { password };
    if (email.toLowerCase() !== current) update.email = email;
    const { error } = await db.auth.updateUser(update);
    if (!error) {
      state.profiles[who] = email;
      ui.cloudEmail = email.toLowerCase() === current ? ui.cloudEmail : email;
      persist();
    }
    ui.settingsNote = error ? "No se pudo guardar la entrada de " + label + "." : "Listo. La entrada de " + label + " quedó guardada.";
    render();
    return;
  }
  if (!window.supabase?.createClient) {
    ui.settingsNote = "No se pudo crear la entrada.";
    render();
    return;
  }
  const guest = window.supabase.createClient(CLOUD_URL, CLOUD_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "sueil-alta" },
  });
  const result = await guest.auth.signUp({ email, password });
  if (result.error) {
    const msg = String(result.error.message || "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      state.profiles[who] = email;
      persist();
      ui.settingsNote = "Ese correo ya existe. " + label + " entra con él y su contraseña.";
    } else if (msg.includes("registro cerrado")) {
      ui.settingsNote = "El almacén todavía solo deja una cuenta. Falta pegar el paso de las tres entradas.";
    } else ui.settingsNote = "No se pudo crear la entrada de " + label + ".";
    render();
    return;
  }
  if (result.data.session && result.data.user) {
    const inserted = await guest.from("familia").insert({ user_id: result.data.user.id });
    await guest.auth.signOut();
    state.profiles[who] = email;
    persist();
    ui.settingsNote = inserted.error && inserted.error.code !== "23505"
      ? "La cuenta de " + label + " se creó, pero el almacén todavía no la deja entrar."
      : "Listo. " + label + " entra con su correo.";
    render();
    return;
  }
  state.profiles[who] = email;
  persist();
  ui.settingsNote = "Revisa el correo de " + label + " y confirma. Después entra con ese correo.";
  render();
}

async function changeEmail(data) {
  const email = String(data.email || "").trim();
  if (!db) { ui.settingsNote = "Todavía no hay cuenta del taller en este aparato."; render(); return; }
  const { error } = await db.auth.updateUser({ email });
  ui.settingsNote = error ? "No se pudo cambiar el correo." : "Revisa el correo nuevo y confirma el cambio.";
  render();
}

async function changePassword(data) {
  const password = String(data.password || "");
  const again = String(data.again || "");
  if (password.length < 6) { ui.settingsNote = "La contraseña necesita al menos 6 caracteres."; render(); return; }
  if (password !== again) { ui.settingsNote = "Las dos contraseñas no coinciden."; render(); return; }
  if (!db) { ui.settingsNote = "Todavía no hay cuenta del taller en este aparato."; render(); return; }
  const { error } = await db.auth.updateUser({ password });
  ui.settingsNote = error ? "No se pudo cambiar la contraseña." : "Contraseña cambiada.";
  render();
}

function avisosStatus() {
  if (!("Notification" in window)) return "Este teléfono no muestra avisos desde la página.";
  if (Notification.permission === "denied") return "Están bloqueados. En el iPhone: Ajustes, Notificaciones, y permite Sueil.";
  if (!flagOn("sueil-avisos-citas", "sueil-avisos") && !flagOn("sueil-avisos-urgencias", "sueil-avisos")) return "Todavía apagados en este aparato.";
  if (Notification.permission === "granted") return "Encendidos. Avisan de la cita y si hay un urgente para hoy.";
  return "Pulsa el aviso y acepta el permiso.";
}

async function registerWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try { return await navigator.serviceWorker.register("sw.js"); } catch (err) { console.warn(err); return null; }
}

function toldAlready(tag) {
  try { return JSON.parse(localStorage.getItem("sueil-avisados") || "[]").includes(tag); } catch (err) { return false; }
}

function markTold(tag) {
  let raw = [];
  try { raw = JSON.parse(localStorage.getItem("sueil-avisados") || "[]"); } catch (err) { raw = []; }
  raw.push(tag);
  localStorage.setItem("sueil-avisados", JSON.stringify(raw.slice(-80)));
}

async function ping(title, body, tag) {
  if (toldAlready(tag)) return;
  markTold(tag);
  if (localStorage.getItem("sueil-sonido") === "1" && navigator.vibrate) navigator.vibrate(80);
  const ready = await registerWorker();
  const active = ready && navigator.serviceWorker.controller;
  if (active) { active.postMessage({ type: "aviso", title, body, tag }); return; }
  if (ready) { await ready.showNotification(title, { body, tag, lang: "es" }); return; }
  new Notification(title, { body, tag, lang: "es" });
}

function minutesUntil(date, time) {
  if (!date) return 9999;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = String(time || "00:00").split(":").map(Number);
  return (new Date(y, m - 1, d, hh || 0, mm || 0).getTime() - Date.now()) / 60000;
}

function checkAvisos() {
  const citasOn = flagOn("sueil-avisos-citas", "sueil-avisos");
  const urgOn = flagOn("sueil-avisos-urgencias", "sueil-avisos");
  if (!citasOn && !urgOn) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const today = addDays(0);
  if (citasOn) {
    state.appointments.forEach((appt) => {
      if (appt.date !== today || appt.done) return;
      const mins = minutesUntil(appt.date, appt.time);
      const job = jobById(appt.jobId);
      const who = job ? clientName(job) : "Cita";
      const line = `${appt.time} · ${who} · ${appt.kind || "Cita"}`;
      if (mins <= 60 && mins > 0) ping("Cita en menos de una hora", line, `soon:${appt.id}:${today}`);
      if (mins <= 0 && mins > -20) ping("Cita ahora", line, `now:${appt.id}:${today}`);
    });
  }
  if (urgOn) {
    state.jobs.forEach((job) => {
      if (!job.urgent || job.status === "entregado" || job.dueDate !== today) return;
      ping("Urgente para hoy", `${clientName(job)} · ${garmentSummary(job)}`, `urgent:${job.id}:${today}`);
    });
  }
}

async function enableAvisos() {
  if (!("Notification" in window)) {
    ui.settingsNote = "Este navegador no muestra avisos.";
    render();
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    localStorage.setItem("sueil-avisos", "0");
    ui.settingsNote = "No se activaron. En el iPhone abre Sueil desde el ícono de inicio.";
    render();
    return;
  }
  localStorage.setItem("sueil-avisos", "1");
  ui.settingsNote = "Avisos encendidos en este aparato.";
  await registerWorker();
  checkAvisos();
}

function readPhoto(input) {
  const file = input.files && input.files[0];
  input.value = "";
  if (!file || !ui.photoSlot) return;
  const slot = ui.photoSlot;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      const photo = canvas.toDataURL("image/jpeg", 0.72);
      const job = moneyJob();
      if (!job) return;
      if (slot.part === "shoe") job.shoePhoto = photo;
      if (slot.part === "garment") {
        let item = (job.garments || []).find((garment) => garment.id === slot.id);
        if (!item) {
          item = { id: uid(), kind: "", custom: "", color: "", note: "", price: 0, done: false, photo: "" };
          job.garments = job.garments || [];
          job.garments.push(item);
        }
        item.photo = photo;
        ui.pickId = item.id;
      }
      if (editingIsLive(job)) persist();
      render();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function afterPaint() {
  document.querySelectorAll("[data-file]").forEach((input) => {
    input.onchange = () => readPhoto(input);
  });
  const canvas = document.querySelector("[data-sheet]");
  if (canvas) setupPad(canvas, moneyJob());
  const log = document.querySelector("[data-ia-log]");
  if (log) log.scrollTop = log.scrollHeight;
}

function setupPad(canvas, job) {
  if (!job) return;
  const ctx = canvas.getContext("2d");
  const w = 1200;
  const h = 760;
  canvas.width = w;
  canvas.height = h;
  ctx.fillStyle = "#c3e0e5";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#69adc6";
  ctx.lineWidth = 1;
  for (let y = 56; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(36, y);
    ctx.lineTo(w - 36, y);
    ctx.stroke();
  }
  if (job.drawing) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, w, h);
    img.src = job.drawing;
  }
  let drawing = false;
  const point = (event) => {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * (w / rect.width), y: (event.clientY - rect.top) * (h / rect.height) };
  };
  canvas.onpointerdown = (event) => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const p = point(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  canvas.onpointermove = (event) => {
    if (!drawing) return;
    const p = point(event);
    ctx.strokeStyle = "#103f63";
    ctx.lineWidth = event.pointerType === "pen" ? 2.4 : 3.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const finish = () => {
    if (!drawing) return;
    drawing = false;
    job.drawing = canvas.toDataURL("image/jpeg", 0.72);
    if (editingIsLive(job)) persist();
  };
  canvas.onpointerup = finish;
  canvas.onpointercancel = finish;
}

function boot() {
  document.addEventListener("click", onClick);
  document.addEventListener("input", onField);
  document.addEventListener("change", onField);
  document.addEventListener("submit", onSubmit);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && ui.overlay) closeTop();
  });
  render();
  startCloud();
  registerWorker();
  setInterval(checkAvisos, 60000);
  try {
    if (localStorage.getItem("sueil-tutorial-visto") !== "1") {
      setTimeout(() => {
        if (!ui.overlay) openTutorial(0);
      }, 700);
    }
  } catch (err) {}
}

if (typeof document !== "undefined") boot();
