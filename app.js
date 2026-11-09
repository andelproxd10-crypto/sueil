const KEY = "sueil-v2";
const SESSION = "sueil-abierta";
const DEMO_NAMES = new Set(["Elena Vargas", "Camila Ruiz", "Sofía Hernández", "Rosa Méndez"]);

const CLOUD_URL = "https://rmqdfrwcnvwntabatzkw.supabase.co";
const CLOUD_KEY = "sb_publishable_uYdwwxosWdfWWe0mkqNB5w_jeTvt-q_";

const ui = {
  view: "slides",
  slide: 0,
  clientId: null,
  jobId: null,
  day: isoFromDate(new Date()),
  panel: null,
  cloud: "conectando",
  cloudError: "",
  cloudEmail: "",
  settingsNote: "",
  text: localStorage.getItem("sueil-texto") || "normal",
};

let db = null;
let cloudReady = false;
let cloudTimer = null;
let ignoreRemoteUntil = 0;

const GARMENT_KINDS = [
  "Blusa",
  "Camisa",
  "Pantalón",
  "Pans",
  "Jean",
  "Saco",
  "V. casual",
  "V. fiesta",
  "Novia",
  "XV años",
  "Falda",
  "Otro",
];

let state = load();
persist();

const slides = [
  {
    kicker: "Sueil",
    title: "La agenda del taller",
    body: [
      "Una aplicación para anotar las citas, los encargos y las medidas.",
      "Se usa en una tablet, con lápiz. Entran mamá, papá y Andrés, cada quien con su código.",
    ],
  },
  {
    kicker: "Quién entra",
    title: "Solo la familia",
    body: [
      "Entran tres personas de la familia, cada una con su código: mamá, papá y Andrés.",
      "Eso se puede agregar después, si ella lo quiere, conectado a esta misma agenda.",
    ],
  },
  {
    kicker: "Al abrir",
    title: "Primero, lo que urge",
    body: [
      "Arriba van los trabajos de esta semana. Los marcados como urgentes quedan primero, y entre ellos, el que se entrega antes.",
      "Abajo están las citas de hoy. El cargo extra de la urgencia queda anotado en el encargo.",
    ],
  },
  {
    kicker: "La cita",
    title: "No es solo una hora",
    body: [
      "Al tocar una cita se abre la persona: teléfono, tipo de trabajo, fecha del evento y fecha de entrega.",
      "También el precio, el anticipo y lo que falta por cobrar.",
    ],
  },
  {
    kicker: "Las medidas",
    title: "Una hoja, como el cuaderno",
    body: [
      "Las medidas van en una lista, con teclado. Lo que se escribe a mano va en una hoja en blanco, con el lápiz.",
    ],
  },
  {
    kicker: "Más adelante",
    title: "Los botones llegan poco a poco",
    body: [
      "Lo que ella repita se convierte en botones, para tocar en vez de escribir todo. Como la tablet de un pedido, donde cada elección abre la siguiente.",
      "La hoja se queda para lo especial. El plano del vestido entra cuando ella pase las fórmulas.",
    ],
  },
  {
    kicker: "Si algo pasa",
    title: "La tablet se puede cambiar",
    body: [
      "Los datos del taller no viven solo en la tablet. Si se daña, se compra otra, se abre el mismo enlace y se entra.",
      "Además se puede guardar una copia en esta computadora. En este boceto, los ejemplos se quedan guardados aquí.",
    ],
  },
  {
    kicker: "Ahora",
    title: "Este boceto ya se puede tocar",
    body: [
      "La agenda empieza vacía. En Clientas se anota a la persona, y desde ahí se agenda.",
    ],
  },
];

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

function freshExamples() {
  const elena = uid();
  const camila = uid();
  const sofia = uid();
  const rosa = uid();
  const vestidoElena = uid();
  const novia = uid();
  const crinolina = uid();
  const arreglo = uid();
  return {
    clients: [
      { id: elena, name: "Elena Vargas", phone: "619 555 0142" },
      { id: camila, name: "Camila Ruiz", phone: "619 555 0178" },
      { id: sofia, name: "Sofía Hernández", phone: "619 555 0194" },
      { id: rosa, name: "Rosa Méndez", phone: "619 555 0118" },
    ],
    jobs: [
      {
        id: vestidoElena,
        clientId: elena,
        type: "Vestido de XV",
        eventDate: addDays(18),
        eventTime: "17:00",
        dueDate: addDays(6),
        dueTime: "11:00",
        broughtShoes: true,
        picky: true,
        measures: {},
        garments: [
          { id: uid(), name: "Vestido", note: "Lazo más corto.", price: 700, done: false },
          { id: uid(), name: "Velo", note: "", price: 150, done: true },
        ],
        price: 850,
        deposit: 300,
        urgencyFee: 40,
        urgent: true,
        status: "activo",
        note: "Quiere el lazo un poco más corto.",
        drawing: "",
      },
      {
        id: novia,
        clientId: camila,
        type: "Vestido de novia",
        eventDate: addDays(60),
        eventTime: "16:00",
        dueDate: addDays(45),
        dueTime: "12:00",
        broughtShoes: true,
        picky: false,
        measures: {},
        garments: [
          { id: uid(), name: "Vestido", note: "", price: 1400, done: false },
        ],
        price: 1400,
        deposit: 500,
        urgencyFee: 0,
        urgent: false,
        status: "activo",
        note: "",
        drawing: "",
      },
      {
        id: crinolina,
        clientId: sofia,
        type: "Crinolina",
        eventDate: addDays(8),
        eventTime: "19:00",
        dueDate: addDays(4),
        dueTime: "15:00",
        broughtShoes: false,
        picky: false,
        measures: {},
        garments: [
          { id: uid(), name: "Crinolina", note: "", price: 220, done: false },
        ],
        price: 220,
        deposit: 80,
        urgencyFee: 15,
        urgent: true,
        status: "activo",
        note: "",
        drawing: "",
      },
      {
        id: arreglo,
        clientId: rosa,
        type: "Alteración",
        eventTime: "16:00",
        dueTime: "12:00",
        broughtShoes: false,
        picky: false,
        measures: {},
        garments: [
          { id: uid(), name: "Dobladillo", note: "Subir el ruedo.", price: 70, done: false },
        ],
        eventDate: addDays(9),
        dueDate: addDays(2),
        price: 70,
        deposit: 0,
        urgencyFee: 0,
        urgent: false,
        status: "activo",
        note: "Subir el dobladillo.",
        drawing: "",
      },
    ],
    appointments: [
      { id: uid(), jobId: vestidoElena, date: addDays(0), time: "10:00", kind: "Prueba" },
      { id: uid(), jobId: crinolina, date: addDays(0), time: "16:30", kind: "Medidas" },
      { id: uid(), jobId: arreglo, date: addDays(2), time: "12:00", kind: "Entrega" },
    ],
    access: { mom: "", andres: "", dad: "" },
  };
}

const MEASURES = [
  ["escote", "L. Escote DTE"],
  ["espalda", "Largo espa"],
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

function amount(value) {
  return String(value ?? "0").split("+").reduce((sum, part) => {
    const n = Number(String(part).trim());
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
}

function normalizeJob(job) {
  if (job.type === "Arreglo") job.type = "Alteración";
  job.dueTime = job.dueTime || "12:00";
  job.broughtShoes = !!job.broughtShoes;
  job.picky = !!job.picky;
  job.shoePhoto = job.shoePhoto || "";
  job.presupuesto = job.presupuesto || 0;
  job.measures = job.measures || {};
  if (!Array.isArray(job.garments) || !job.garments.length) {
    job.garments = [{ id: uid(), name: "", kind: "", custom: "", color: "", note: "", price: Number(job.price) || 0, done: false }];
  }
  job.garments = job.garments.map((item) => {
    const known = GARMENT_KINDS.find((kind) => kind.toLowerCase() === String(item.kind || item.name || "").trim().toLowerCase());
    const kind = item.kind || known || (item.name ? "Otro" : "");
    const custom = item.custom || (kind === "Otro" && !known ? item.name || "" : "");
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
    access: access || { mom: "", andres: "", dad: "" },
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
  if (onlyExamples) return emptyWorkshop(data.access);
  return shapeState(data);
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    alert("No cupo la copia en esta computadora. Borra una hoja grande o guarda una copia descargada.");
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
  data.appointments = (data.appointments || []).map((item) => ({ ...item, id: item.id || uid() }));
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

async function startCloud() {
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

function longDate(iso) {
  if (!iso) return "Sin fecha";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function clientById(id) {
  return state.clients.find((c) => c.id === id);
}

function jobById(id) {
  return state.jobs.find((j) => j.id === id);
}

function jobsOf(clientId) {
  return state.jobs.filter((j) => j.clientId === clientId);
}

function when(date, time) {
  if (!date) return "Sin fecha";
  return `${longDate(date)}${time ? " · " + time : ""}`;
}

function codesReady() {
  const access = state.access || {};
  return Boolean(access.mom && access.andres && access.dad);
}

function garmentTitle(item) {
  if (!item) return "";
  if (item.kind === "Otro") return String(item.custom || "").trim() || "Otro";
  if (item.kind) return item.kind;
  return String(item.name || "").trim();
}

function garmentLabel(item) {
  const title = garmentTitle(item) || "Prenda";
  const color = String(item?.color || "").trim();
  return color ? `${title} · ${color}` : title;
}

function phoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function balance(job) {
  const extra = job.urgent ? amount(job.urgencyFee) : 0;
  return amount(job.presupuesto) - amount(job.deposit) + extra;
}

function charged(job) {
  const extra = job.urgent ? amount(job.urgencyFee) : 0;
  const price = (job.garments || []).reduce((sum, item) => sum + amount(item.price), 0);
  return price + extra;
}

function span(start, end) {
  return state.jobs
    .filter((job) => job.dueDate >= start && job.dueDate <= end)
    .reduce((sum, job) => sum + charged(job), 0);
}

function gananciasHtml() {
  const now = new Date();
  const weekStart = addDays(0);
  const weekEnd = addDays(6);
  const monthStart = isoFromDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = isoFromDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const yearStart = `${now.getFullYear()}-01-01`;
  const yearEnd = `${now.getFullYear()}-12-31`;
  const monthTotal = span(monthStart, monthEnd);
  return `
    <h2>Ganancias</h2>
    <p class="lede">Suma de los encargos según su fecha de entrega. El año estimado multiplica este mes por 12.</p>
    <div class="cards">
      <div class="card"><div class="meta">Esta semana</div><div class="who">${esc(money(span(weekStart, weekEnd)))}</div></div>
      <div class="card"><div class="meta">Este mes</div><div class="who">${esc(money(monthTotal))}</div></div>
      <div class="card"><div class="meta">Anotado en ${now.getFullYear()}</div><div class="who">${esc(money(span(yearStart, yearEnd)))}</div></div>
      <div class="card"><div class="meta">Estimado anual</div><div class="who">${esc(money(monthTotal * 12))}</div></div>
    </div>`;
}

function pendingText(job) {
  const items = job.garments || [];
  const left = items.filter((item) => !item.done).length;
  if (!items.length) return "Sin prendas";
  if (!left) return `${items.length === 1 ? "1 prenda" : items.length + " prendas"} · listas`;
  return left === 1 ? "Falta 1 prenda" : `Faltan ${left} prendas`;
}

function weekJobs() {
  const start = addDays(0);
  const end = addDays(6);
  return state.jobs
    .filter((j) => j.status !== "entregado" && j.dueDate >= start && j.dueDate <= end)
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.dueDate.localeCompare(b.dueDate));
}

function nubeHtml() {
  if (ui.cloud === "conectando") {
    return `
      <section class="gate">
        <p class="kicker">Sueil</p>
        <h1>Conectando el taller</h1>
        <p>Un momento.</p>
      </section>`;
  }
  return `
    <section class="gate">
      <p class="kicker">Sueil</p>
      <h1>Entrada del taller</h1>
      <p>Cada quien entra con su propio correo y su contraseña. Mamá, papá y Andrés no comparten la misma cuenta.</p>
      <form class="form" data-form="nube" style="margin-top:18px">
        <label>Correo<input name="email" type="email" required autocomplete="username" value="${esc(ui.cloudEmail)}"></label>
        <label>Contraseña<input name="password" type="password" required minlength="6" autocomplete="current-password"></label>
        ${ui.cloudError ? `<p class="warn">${esc(ui.cloudError)}</p>` : ""}
        <div class="row">
          <button class="btn" type="submit">Entrar</button>
          <button class="btn ghost" type="submit" name="crear" value="1">Crear entrada</button>
        </div>
      </form>
    </section>`;
}

function bodyClass() {
  const names = [];
  if (ui.view !== "slides" && ui.cloud !== "conectando" && ui.cloud !== "entrar") names.push("app-mode");
  if (ui.text === "compacto") names.push("text-compact");
  if (ui.text === "grande") names.push("text-large");
  return names.join(" ");
}

function captureCita() {
  const form = document.querySelector("[data-form=cita]");
  if (!form) return;
  const data = Object.fromEntries(new FormData(form));
  ui.apptDraft = {
    person: data.person || "",
    jobId: data.jobId || "",
    date: data.date || ui.day,
    time: data.time || "10:00",
    kind: data.kind || "Prueba",
  };
}

function render() {
  if (ui.panel === "cita") captureCita();
  if (ui.cloud === "conectando" || ui.cloud === "entrar") {
    document.body.className = bodyClass();
    document.getElementById("app").innerHTML = nubeHtml();
    bind();
    return;
  }
  const y = window.scrollY;
  if (codesReady() && sessionStorage.getItem(SESSION) !== "1") {
    document.body.className = bodyClass();
    document.getElementById("app").innerHTML = entradaHtml();
    bind();
    return;
  }
  document.body.className = bodyClass();
  document.getElementById("app").innerHTML = ui.view === "slides" ? slidesHtml() : appHtml();
  bind();
  if (ui.pad) window.scrollTo(0, y);
}

function entradaHtml() {
  return `
    <section class="gate">
      <p class="kicker">Sueil</p>
      <h1>Código de acceso</h1>
      <p>Mamá, Oscar o Andrés. Cada quien entra con el suyo.</p>
      <form class="form" data-form="entrar" style="margin-top:18px">
        <label>Código<input name="code" type="password" required autocomplete="off"></label>
        ${ui.badCode ? `<p class="warn">Ese código no es de la familia.</p>` : ""}
        <button class="btn" type="submit">Entrar</button>
      </form>
    </section>`;
}

function profileForm(who, label) {
  const saved = (state.profiles && state.profiles[who]) || "";
  const email = saved || (who === "andres" ? ui.cloudEmail : "");
  const here = ui.cloudEmail && email && email.toLowerCase() === ui.cloudEmail.toLowerCase();
  return `
    <form class="form" data-form="perfil">
      <p class="who">${esc(label)}${here ? " · este aparato" : ""}</p>
      <input type="hidden" name="who" value="${who}">
      <label>Correo<input name="email" type="email" required autocomplete="off" value="${esc(email)}" placeholder="su correo"></label>
      <label>Contraseña<input name="password" type="password" required minlength="6" autocomplete="new-password" placeholder="su contraseña"></label>
      <button class="btn ghost" type="submit">${email ? "Guardar entrada" : "Crear entrada"}</button>
    </form>`;
}

function ajustesHtml() {
  const access = state.access || { mom: "", andres: "", dad: "" };
  const sizes = [["compacto", "Compacta"], ["normal", "Normal"], ["grande", "Grande"]];
  return `
    <h2>Configuración</h2>
    <p class="lede">Cada quien con su correo. El tamaño de la letra, los códigos, la copia y las ganancias.</p>
    ${ui.settingsNote ? `<p class="warn">${esc(ui.settingsNote)}</p>` : ""}
    <p class="section-title">Avisos</p>
    <p class="meta">${esc(avisosStatus())}</p>
    <div class="row">
      <button class="btn" type="button" data-action="avisos-on">Activar avisos</button>
      <button class="btn ghost" type="button" data-action="avisos-off">Apagar</button>
    </div>
    <p class="section-title">Pantalla</p>
    <p class="meta">En el teléfono usa Compacta: menos letra y menos espacio, para que la ficha quepa. Grande es para la tablet. El tamaño se queda en este aparato.</p>
    <div class="choice">
      ${sizes.map(([id, label]) => `<button type="button" data-text="${id}" class="${ui.text === id ? "on" : ""}">${label}</button>`).join("")}
    </div>
    <p class="section-title">Tres entradas</p>
    <p class="meta">Mamá, papá y Andrés tienen cada uno su correo y su contraseña. Este aparato entró con ${esc(ui.cloudEmail || "nadie")}.</p>
    ${profileForm("mom", "Mamá")}
    ${profileForm("dad", "Oscar")}
    ${profileForm("andres", "Andrés")}
    <p class="section-title">Códigos de la agenda</p>
    <p class="meta">Son aparte del correo. Sirven para saber quién abrió la agenda en un aparato que ya entró.</p>
    <form class="form" data-form="codigos">
      <label>Código de mamá<input name="mom" type="password" required value="${esc(access.mom)}" autocomplete="off"></label>
      <label>Código de Oscar<input name="dad" type="password" required value="${esc(access.dad)}" autocomplete="off"></label>
      <label>Código de Andrés<input name="andres" type="password" required value="${esc(access.andres)}" autocomplete="off"></label>
      ${ui.codeError ? `<p class="warn">${esc(ui.codeError)}</p>` : ""}
      <button class="btn" type="submit">Guardar códigos</button>
    </form>
    <p class="section-title">Copia en este aparato</p>
    <p class="meta">Descarga un archivo con las clientas, las citas y las hojas. El almacén sigue teniendo la copia de todos los días.</p>
    <button class="btn ghost" type="button" data-action="backup">Guardar copia</button>
    ${gananciasHtml()}`;
}

function slidesHtml() {
  const slide = slides[ui.slide];
  const last = ui.slide === slides.length - 1;
  return `
    <div class="slide-screen">
      <section class="slide">
        <p class="kicker">${esc(slide.kicker)}</p>
        <h1>${esc(slide.title)}</h1>
        ${slide.body.map((p) => `<p>${esc(p)}</p>`).join("")}
      </section>
      <footer class="slide-footer">
        <div class="dots">
          ${slides.map((_, i) => `<button class="dot ${i === ui.slide ? "on" : ""}" data-slide="${i}" aria-label="Lámina ${i + 1}"></button>`).join("")}
        </div>
        <div class="row">
          <button class="btn ghost" data-action="prev" ${ui.slide === 0 ? "disabled" : ""}>Anterior</button>
          ${last
            ? `<button class="btn" data-action="enter">Ver el boceto</button>`
            : `<button class="btn" data-action="next">Siguiente</button>`}
        </div>
      </footer>
    </div>`;
}

function appHtml() {
  return `
    <div class="device">
      <div class="tablet">
        <header class="topbar">
          <button class="brand" data-action="slides">Sueil<span>alta costura</span></button>
          <nav>
            ${nav("hoy", "Hoy")}
            ${nav("agenda", "Agenda")}
            ${nav("clientas", "Clientas")}
            ${nav("ajustes", "Ajustes")}
          </nav>
        </header>
        <main class="screen">${screenHtml()}</main>
      </div>
    </div>`;
}

function nav(view, label) {
  return `<button class="nav-btn ${ui.view === view ? "on" : ""}" data-go="${view}">${label}</button>`;
}

function screenHtml() {
  if (ui.view === "hoy") return hoyHtml();
  if (ui.view === "agenda") return agendaHtml();
  if (ui.view === "clientas") return clientasHtml();
  if (ui.view === "ganancias") ui.view = "ajustes";
  if (ui.view === "ajustes" || ui.view === "codigos") return ajustesHtml();
  return fichaHtml();
}

function hoyHtml() {
  const jobs = weekJobs();
  const citas = state.appointments
    .filter((a) => a.date === addDays(0))
    .sort((a, b) => a.time.localeCompare(b.time));
  return `
    <h2>Hoy</h2>
    <p class="lede">${esc(longDate(addDays(0)))}. Para anotar a alguien, entra a Clientas.${cloudReady ? " Los cambios se guardan en el almacén." : ""}</p>
    <p class="section-title">Esta semana</p>
    <div class="cards">
      ${jobs.length ? jobs.map(jobCard).join("") : `<p class="empty">No hay entregas en los próximos 7 días.</p>`}
    </div>
    <p class="section-title">Citas de hoy</p>
    <div class="cards">
      ${citas.length ? citas.map(citaCard).join("") : `<p class="empty">Hoy no hay citas.</p>`}
    </div>`;
}

function statusBadges(job, weekLabel) {
  const label = job.status === "entregado" ? "Entregado" : job.urgent ? "Urgente" : weekLabel || "Activo";
  return `
    <div class="badges">
      <span class="badge ${job.urgent ? "" : "quiet"}">${esc(label)}</span>
      ${job.broughtShoes ? `<span class="badge quiet">Trajo zapatos</span>` : ""}
      ${job.picky ? `<span class="asterisk" title="Cliente mamón">*</span>` : ""}
    </div>`;
}

function jobCard(job) {
  const client = clientById(job.clientId);
  return `
    <button class="card ${job.urgent ? "glow" : ""}" data-open-job="${job.id}">
      ${statusBadges(job, "Esta semana")}
      <div class="who">${esc(client ? client.name : "Clienta")}</div>
      <div class="meta">${esc(job.type)} · entrega ${esc(when(job.dueDate, job.dueTime))}</div>
      <div class="meta">${esc(pendingText(job))} · total a pagar ${esc(money(balance(job)))}${job.urgent && job.urgencyFee ? ` · urgencia ${esc(money(job.urgencyFee))}` : ""}</div>
    </button>`;
}

function deleteButton(kind, id, label) {
  const armed = ui.confirm && ui.confirm.kind === kind && ui.confirm.id === id;
  if (!armed) return `<button class="text-btn" type="button" data-delete="${kind}" data-id="${id}">${label}</button>`;
  return `<span class="row">
    <button class="text-btn" type="button" data-delete="${kind}" data-id="${id}">Sí, eliminar</button>
    <button class="text-btn" type="button" data-delete="cancel">Cancelar</button>
  </span>`;
}

function citaCard(appt) {
  const job = jobById(appt.jobId);
  const client = job ? clientById(job.clientId) : null;
  return `
    <div class="card">
      <button class="card-hit" type="button" data-open-job="${job ? job.id : ""}">
        <div class="who">${esc(when(appt.date, appt.time))} · ${esc(appt.kind)}</div>
        <div class="meta">${esc(client ? client.name : "")}${job ? ` · ${esc(job.type)}` : ""}</div>
      </button>
      ${deleteButton("appt", appt.id, "Eliminar cita")}
    </div>`;
}

function agendaHtml() {
  const days = Array.from({ length: 7 }, (_, i) => addDays(i));
  const citas = state.appointments
    .filter((a) => a.date === ui.day)
    .sort((a, b) => a.time.localeCompare(b.time));
  const todas = [...state.appointments].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return `
    <h2>Agenda</h2>
    <p class="lede">Siete días, con la hora del taller.</p>
    <div class="choice">
      ${days.map((day) => {
        const [y, m, d] = day.split("-").map(Number);
        const label = new Date(y, m - 1, d).toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });
        return `<button class="day ${day === ui.day ? "on" : ""}" data-day="${day}">${esc(label)}</button>`;
      }).join("")}
    </div>
    <div class="row"><button class="btn" data-panel="cita">Nueva cita</button></div>
    ${panelHtml()}
    <p class="section-title">Este día</p>
    <div class="cards">
      ${citas.length ? citas.map(citaCard).join("") : `<p class="empty">Este día no tiene citas.</p>`}
    </div>
    <p class="section-title">Todas las citas</p>
    <div class="cards">
      ${todas.length ? todas.map(citaCard).join("") : `<p class="empty">Todavía no hay citas.</p>`}
    </div>`;
}

function clientasHtml() {
  return `
    <h2>Clientas</h2>
    <p class="lede">La persona se anota una vez. Cada vestido o alteración es un encargo, y dentro van las prendas.</p>
    <div class="row"><button class="btn" data-action="create-client">Nueva clienta</button></div>
    ${panelHtml()}
    <div class="cards" style="margin-top:14px">
      ${state.clients.length ? state.clients.map((c) => `
        <button class="card" data-open-client="${c.id}">
          <div class="who">${c.nameDrawing ? `<img class="thumb" alt="" src="${c.nameDrawing}">` : esc(c.name || "Clienta")}</div>
          <div class="meta">${esc(c.phone || "Sin teléfono")} · ${jobsOf(c.id).length === 1 ? "1 encargo" : `${jobsOf(c.id).length} encargos`}</div>
        </button>`).join("") : `<p class="empty">Todavía no hay clientas.</p>`}
    </div>`;
}

function fichaHtml() {
  const client = clientById(ui.clientId);
  if (!client) return `<p class="empty">Elige una clienta.</p>`;
  const jobs = jobsOf(client.id);
  const job = jobById(ui.jobId) || jobs[0];
  if (job) ui.jobId = job.id;
  return `
    <button class="back" data-go="clientas">Volver a clientas</button>
    <h2>${esc(client.name || "Clienta")}</h2>
    <div class="pad-head">
      <p class="section-title" style="margin:0">Nombre, con el lápiz</p>
      <button class="text-btn" type="button" data-clear="client">Limpiar hoja</button>
    </div>
    <canvas class="ink" data-ink="client"></canvas>
    <button class="num ${padOpen("phone") ? "on" : ""}" data-num="phone">Teléfono <b>${esc(client.phone || "0")}</b></button>
    ${padAfter("phone")}
    <div class="row">
      <button class="btn" data-panel="encargo">Nuevo encargo</button>
      <button class="btn ghost" data-panel="cita">Nueva cita</button>
      ${deleteButton("client", client.id, "Eliminar clienta")}
    </div>
    ${panelHtml()}
    ${job ? jobEditor(job, jobs) : `<p class="empty">Agrega el primer encargo.</p>`}`;
}

function jobEditor(job, jobs) {
  const kinds = ["Vestido", "Vestido de XV", "Vestido de novia", "Crinolina", "Alteración"];
  return `
    <div class="split" style="margin-top:16px">
      <div class="cards">
        ${jobs.map((item) => `
          <button class="card ${item.urgent ? "glow" : ""}" data-select-job="${item.id}">
            ${statusBadges(item, "Activo")}
            <div class="who">${esc(item.type)}</div>
            <div class="meta">Entrega ${esc(when(item.dueDate, item.dueTime))}</div>
            <div class="meta">${esc(pendingText(item))}</div>
          </button>`).join("")}
      </div>
      <div class="form">
        <p class="section-title">Encargo</p>
        <div class="choice">
          ${kinds.map((kind) => `<button data-type="${esc(kind)}" class="${job.type === kind ? "on" : ""}">${esc(kind)}</button>`).join("")}
        </div>
        <div class="grid-2">
          <label>Fecha del evento<input type="date" data-field="eventDate" value="${esc(job.eventDate)}"></label>
          <label>Fecha de entrega<input type="date" data-field="dueDate" value="${esc(job.dueDate)}"></label>
          <label>Hora de entrega<input type="time" data-field="dueTime" value="${esc(job.dueTime)}"></label>
        </div>
        <button class="num ${padOpen("presupuesto") ? "on" : ""}" type="button" data-num="presupuesto">Presupuesto <b>${esc(money(amount(job.presupuesto)))}</b></button>
        ${padAfter("presupuesto")}
        <button class="num ${padOpen("deposit") ? "on" : ""}" type="button" data-num="deposit">Anticipo <b>${esc(money(amount(job.deposit)))}</b></button>
        ${padAfter("deposit")}
        <label class="check"><input type="checkbox" data-urgent ${job.urgent ? "checked" : ""}> Marcar como urgente</label>
        ${job.urgent ? `<button class="num ${padOpen("urgency") ? "on" : ""}" type="button" data-num="urgency">Cargo por urgencia <b>${esc(money(amount(job.urgencyFee)))}</b></button>${padAfter("urgency")}` : ""}
        <div class="money"><span>Total a pagar</span><b>${esc(money(balance(job)))}</b></div>
        <label class="check"><input type="checkbox" data-flag="broughtShoes" ${job.broughtShoes ? "checked" : ""}> Trajo zapatos</label>
        <label class="photo">Foto del zapato, opcional<input type="file" accept="image/*" data-photo="shoe"></label>
        ${job.shoePhoto ? `<img class="shot" alt="Zapato" src="${job.shoePhoto}">` : ""}
        <label class="check"><input type="checkbox" data-flag="picky" ${job.picky ? "checked" : ""}> Cliente mamón</label>
        <p class="section-title">Prendas</p>
        <p class="meta">Elige la prenda y escribe el color. La nota se escribe con el lápiz. El precio, con el teclado.</p>
        ${(job.garments || []).map((item) => `
          <div class="garment">
            <button class="tick ${item.done ? "on" : ""}" type="button" data-done="${item.id}" aria-label="${item.done ? "Hecha" : "Pendiente"}">${item.done ? "✓" : ""}</button>
            <div>
              <p class="meta">${esc(garmentLabel(item))}</p>
              <div class="garment-pick">
                <label>Prenda
                  <select data-garment="${item.id}" data-part="kind">
                    <option value="" ${item.kind ? "" : "selected"}>Elige</option>
                    ${GARMENT_KINDS.map((kind) => `<option value="${esc(kind)}" ${item.kind === kind ? "selected" : ""}>${esc(kind)}</option>`).join("")}
                  </select>
                </label>
                <label>Color
                  <input data-garment="${item.id}" data-part="color" type="text" value="${esc(item.color || "")}" placeholder="Color de la prenda">
                </label>
              </div>
              ${item.kind === "Otro" ? `<label>Cuál es<input data-garment="${item.id}" data-part="custom" type="text" value="${esc(item.custom || "")}" placeholder="Escribe la prenda"></label>` : ""}
              <div class="pad-head">
                <p class="section-title" style="margin:0">Nota</p>
                <button class="text-btn" type="button" data-clear="garment-note" data-id="${item.id}">Limpiar hoja</button>
              </div>
              <canvas class="ink" data-ink="garment-note" data-id="${item.id}"></canvas>
              <button class="num ${padOpen("price", item.id) ? "on" : ""}" type="button" data-num="price" data-id="${item.id}">Precio <b>${esc(money(amount(item.price)))}</b></button>
              ${padAfter("price", item.id)}
              <label class="photo">Foto de la prenda, opcional<input type="file" accept="image/*" data-photo="garment" data-id="${item.id}"></label>
              ${item.photo ? `<img class="shot" alt="Prenda" src="${item.photo}">` : ""}
            </div>
          </div>`).join("")}
        <button class="btn ghost" data-action="add-garment">Agregar prenda</button>
        <div class="row">
          <button class="btn ghost" data-action="deliver">${job.status === "entregado" ? "Volver a activar" : "Marcar entregado"}</button>
          ${deleteButton("job", job.id, "Eliminar encargo")}
        </div>
        <p class="section-title">Medidas</p>
        <div class="measure-list">
          ${MEASURES.map(([key, label]) => `
            <div>
              <button class="measure ${padOpen("measure", "", key) ? "on" : ""}" type="button" data-num="measure" data-key="${key}">
                <span>${esc(label)}</span>
                <b>${esc(job.measures[key] || "—")}</b>
              </button>
              ${padAfter("measure", "", key)}
            </div>`).join("")}
        </div>
        <div class="pad-wrap">
          <div class="pad-head">
            <div>
              <p class="section-title" style="margin:0">Hoja de notas</p>
              <p class="meta">Escribe con el lápiz. En esta computadora, con el mouse.</p>
            </div>
            <button class="text-btn" data-action="clear-pad">Limpiar hoja</button>
          </div>
          <canvas class="pad" data-sheet></canvas>
        </div>
        <p class="section-title">Citas de este encargo</p>
        <div class="cards">
          ${state.appointments.filter((a) => a.jobId === job.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map((a) => `
            <div class="card">
              <div class="who">${esc(when(a.date, a.time))}</div>
              <div class="meta">${esc(a.kind)}</div>
              ${deleteButton("appt", a.id, "Eliminar cita")}
            </div>
          `).join("") || `<p class="empty">Sin citas todavía.</p>`}
        </div>
      </div>
    </div>`;
}

function panelHtml() {
  if (ui.panel === "clienta") {
    return `
      <form class="form" data-form="clienta" style="margin-top:14px">
        <div class="grid-2">
          <label>Nombre<input name="name" type="text" required placeholder="Nombre de la clienta"></label>
          <label>Teléfono<input name="phone" type="tel" placeholder="Teléfono"></label>
        </div>
        <button class="btn" type="submit">Guardar clienta</button>
      </form>`;
  }
  if (ui.panel === "encargo") {
    return `
      <form class="form" data-form="encargo" style="margin-top:14px">
        <p class="lede">Después eliges el tipo. Las prendas y las medidas quedan en la ficha.</p>
        <button class="btn" type="submit">Crear encargo</button>
      </form>`;
  }
  if (ui.panel === "cita") {
    const draft = ui.apptDraft || {};
    const options = state.jobs.filter((j) => j.status !== "entregado").map((j) => {
      const client = clientById(j.clientId);
      const name = (client?.name || "").trim() || "Sin nombre";
      const picked = draft.jobId || ui.jobId;
      const selected = j.id === picked ? "selected" : "";
      return `<option value="${j.id}" ${selected}>${esc(name)} · ${esc(j.type)}</option>`;
    }).join("");
    const kindNow = draft.kind || "Prueba";
    return `
      <form class="form" data-form="cita" style="margin-top:14px">
        <label>Persona<input name="person" type="text" placeholder="Escribe el nombre" autocomplete="name" value="${esc(draft.person || "")}"></label>
        ${options ? `<label>O elige uno que ya existe<select name="jobId"><option value="">Usar el nombre de arriba</option>${options}</select></label>` : `<p class="meta">Al guardar se anota la persona y su encargo.</p>`}
        <button class="num ${padOpen("apptPhone") ? "on" : ""}" type="button" data-num="apptPhone">Teléfono <b>${esc(ui.apptPhone || "0")}</b></button>
        ${padAfter("apptPhone")}
        <div class="grid-2">
          <label>Fecha<input name="date" type="date" required value="${esc(draft.date || ui.day)}"></label>
          <label>Hora<input name="time" type="time" required value="${esc(draft.time || "10:00")}"></label>
        </div>
        <div class="choice">
          ${["Prueba", "Medidas", "Entrega", "Consulta"].map((kind) => `
            <button type="button" data-kind="${esc(kind)}" class="${kind === kindNow ? "on" : ""}">${esc(kind)}</button>`).join("")}
        </div>
        <input type="hidden" name="kind" value="${esc(kindNow)}">
        ${ui.apptError ? `<p class="warn">${esc(ui.apptError)}</p>` : ""}
        ${ui.clash ? `<p class="warn">Esa fecha y esa hora ya tienen cita. Cambia el horario.</p>` : ""}
        <button class="btn" type="submit">Guardar cita</button>
      </form>`;
  }
  return "";
}

function bind() {
  document.querySelectorAll("[data-slide]").forEach((btn) => {
    btn.onclick = () => { ui.slide = Number(btn.dataset.slide); render(); };
  });
  document.querySelectorAll("[data-go]").forEach((btn) => {
    btn.onclick = () => { ui.view = btn.dataset.go; ui.panel = null; ui.confirm = null; render(); };
  });
  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.onclick = () => actions[btn.dataset.action]();
  });
  document.querySelectorAll("[data-panel]").forEach((btn) => {
    btn.onclick = () => {
      const next = ui.panel === btn.dataset.panel ? null : btn.dataset.panel;
      if (next === "cita") {
        ui.apptPhone = "";
        ui.apptDraft = null;
        ui.apptError = "";
        ui.clash = false;
        if (ui.pad && ui.pad.kind === "apptPhone") ui.pad = null;
      }
      ui.panel = next;
      render();
    };
  });
  document.querySelectorAll("[data-day]").forEach((btn) => {
    btn.onclick = () => { ui.day = btn.dataset.day; render(); };
  });
  document.querySelectorAll("[data-open-client]").forEach((btn) => {
    btn.onclick = () => openClient(btn.dataset.openClient);
  });
  document.querySelectorAll("[data-open-job]").forEach((btn) => {
    btn.onclick = () => openJob(btn.dataset.openJob);
  });
  document.querySelectorAll("[data-select-job]").forEach((btn) => {
    btn.onclick = () => { ui.jobId = btn.dataset.selectJob; render(); };
  });
  document.querySelectorAll("[data-type]").forEach((btn) => {
    btn.onclick = () => {
      const job = jobById(ui.jobId);
      if (!job) return;
      job.type = btn.dataset.type;
      persist();
      render();
    };
  });
  document.querySelectorAll("[data-kind]").forEach((btn) => {
    btn.onclick = () => {
      const form = btn.closest("form");
      form.querySelector("[name=kind]").value = btn.dataset.kind;
      form.querySelectorAll("[data-kind]").forEach((item) => item.classList.toggle("on", item === btn));
    };
  });
  document.querySelectorAll("[data-field]").forEach((field) => {
    field.addEventListener("change", () => {
      const job = jobById(ui.jobId);
      if (!job) return;
      job[field.dataset.field] = field.type === "number" ? Number(field.value) : field.value;
      persist();
      render();
    });
  });
  const note = document.querySelector("textarea[data-field=note]");
  if (note) {
    note.addEventListener("input", () => {
      const job = jobById(ui.jobId);
      if (!job) return;
      job.note = note.value;
      persist();
    });
  }
  const urgent = document.querySelector("[data-urgent]");
  if (urgent) {
    urgent.onchange = () => {
      const job = jobById(ui.jobId);
      job.urgent = urgent.checked;
      if (!job.urgent) job.urgencyFee = 0;
      else if (!job.urgencyFee) job.urgencyFee = 5;
      persist();
      render();
    };
  }
  document.querySelectorAll("form").forEach((form) => {
    form.onsubmit = (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      if (form.dataset.form === "clienta") saveClient(data);
      if (form.dataset.form === "encargo") saveJob();
      if (form.dataset.form === "cita") saveAppt(data);
      if (form.dataset.form === "entrar") enterCode(data);
      if (form.dataset.form === "codigos") saveCodes(data);
      if (form.dataset.form === "nube") cloudEnter(data, event.submitter?.name === "crear");
      if (form.dataset.form === "correo") changeEmail(data);
      if (form.dataset.form === "clave") changePassword(data);
      if (form.dataset.form === "perfil") saveProfile(data);
    };
  });
  document.querySelectorAll("[data-flag]").forEach((box) => {
    box.onchange = () => {
      const job = jobById(ui.jobId);
      if (!job) return;
      job[box.dataset.flag] = box.checked;
      persist();
      render();
    };
  });
  document.querySelectorAll("[data-done]").forEach((btn) => {
    btn.onclick = () => {
      const job = jobById(ui.jobId);
      const item = job && job.garments.find((garment) => garment.id === btn.dataset.done);
      if (!item) return;
      item.done = !item.done;
      persist();
      render();
    };
  });
  document.querySelectorAll("[data-text]").forEach((btn) => {
    btn.onclick = () => {
      ui.text = btn.dataset.text;
      localStorage.setItem("sueil-texto", ui.text);
      ui.settingsNote = "";
      render();
    };
  });
  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = () => {
      const kind = btn.dataset.delete;
      const id = btn.dataset.id;
      if (kind === "cancel") {
        ui.confirm = null;
        render();
        return;
      }
      if (!ui.confirm || ui.confirm.kind !== kind || ui.confirm.id !== id) {
        ui.confirm = { kind, id };
        render();
        return;
      }
      ui.confirm = null;
      if (kind === "appt") removeAppt(id);
      if (kind === "job") removeJob(id);
      if (kind === "client") removeClient(id);
    };
  });
  document.querySelectorAll("[data-garment]").forEach((field) => {
    const saveGarment = (redraw) => {
      const job = jobById(ui.jobId);
      const item = job && job.garments.find((garment) => garment.id === field.dataset.garment);
      if (!item) return;
      const part = field.dataset.part;
      item[part] = part === "price" ? Number(field.value) : field.value;
      if (part === "kind" && item.kind !== "Otro") item.custom = "";
      item.name = garmentTitle(item);
      job.price = job.garments.reduce((sum, garment) => sum + amount(garment.price), 0);
      persist();
      if (redraw) render();
    };
    field.addEventListener("change", () => saveGarment(field.tagName === "SELECT"));
    if (field.tagName === "INPUT") field.addEventListener("input", () => saveGarment(false));
  });
  document.querySelectorAll("[data-measure]").forEach((field) => {
    field.addEventListener("change", () => {
      const job = jobById(ui.jobId);
      if (!job) return;
      job.measures[field.dataset.measure] = field.value;
      persist();
    });
  });
  const canvas = document.querySelector("[data-sheet]");
  if (canvas) setupPad(canvas, jobById(ui.jobId));
  document.querySelectorAll("[data-ink]").forEach((ink) => setupInk(ink));
  document.querySelectorAll("[data-clear]").forEach((btn) => {
    btn.onclick = () => clearInk(btn.dataset.clear, btn.dataset.id);
  });
  document.querySelectorAll("[data-num]").forEach((btn) => {
    btn.onclick = () => openPad(btn);
  });
  document.querySelectorAll("[data-press]").forEach((btn) => {
    btn.onclick = () => pressKey(btn.dataset.press);
  });
  document.querySelectorAll("[data-photo]").forEach((input) => {
    input.onchange = () => readPhoto(input);
  });
}

const actions = {
  prev() { ui.slide = Math.max(0, ui.slide - 1); render(); },
  next() { ui.slide = Math.min(slides.length - 1, ui.slide + 1); render(); },
  enter() { ui.view = "hoy"; render(); },
  slides() { ui.view = "slides"; render(); },
  examples() {
    const access = state.access;
    state = freshExamples();
    state.jobs = state.jobs.map(normalizeJob);
    state.access = access || state.access;
    persist();
    ui.view = "hoy";
    render();
  },
  clear() {
    const access = state.access;
    state = { clients: [], jobs: [], appointments: [], access };
    persist();
    render();
  },
  codigos() { ui.view = "ajustes"; ui.codeError = ""; ui.settingsNote = ""; render(); },
  "create-client"() {
    const client = { id: uid(), name: "", phone: "", nameDrawing: "" };
    state.clients.push(client);
    persist();
    openClient(client.id);
  },
  "add-garment"() {
    const job = jobById(ui.jobId);
    if (!job) return;
    job.garments.push({ id: uid(), name: "", kind: "", custom: "", color: "", note: "", price: 0, done: false });
    persist();
    render();
  },
  "avisos-on"() { enableAvisos(); },
  "avisos-off"() { disableAvisos(); },
  backup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sueil-copia-${addDays(0)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  },
  deliver() {
    const job = jobById(ui.jobId);
    if (!job) return;
    job.status = job.status === "entregado" ? "activo" : "entregado";
    persist();
    render();
  },
  "clear-pad"() {
    const job = jobById(ui.jobId);
    if (!job) return;
    job.drawing = "";
    persist();
    render();
  },
};

function openClient(id) {
  ui.clientId = id;
  ui.jobId = jobsOf(id)[0]?.id || null;
  ui.view = "ficha";
  ui.panel = null;
  render();
}

function openJob(id) {
  const job = jobById(id);
  if (!job) return;
  ui.jobId = job.id;
  ui.clientId = job.clientId;
  ui.view = "ficha";
  ui.panel = null;
  render();
}

function saveClient(data) {
  const name = String(data.name || "").trim();
  if (!name) return;
  const client = { id: uid(), name, phone: String(data.phone || "").trim() };
  state.clients.push(client);
  persist();
  openClient(client.id);
}

function enterCode(data) {
  const code = String(data.code || "").trim();
  const access = state.access || {};
  const who = code === access.mom ? "mamá" : code === access.dad ? "Oscar" : code === access.andres ? "Andrés" : "";
  if (!who) {
    ui.badCode = true;
    render();
    return;
  }
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
  ui.view = "ajustes";
  render();
}

function makeJob(clientId) {
  return normalizeJob({
    id: uid(),
    clientId,
    type: "Vestido",
    eventDate: addDays(30),
    eventTime: "18:00",
    dueDate: addDays(20),
    dueTime: "12:00",
    price: 0,
    deposit: 0,
    urgencyFee: 0,
    urgent: false,
    broughtShoes: false,
    picky: false,
    measures: {},
    garments: [],
    status: "activo",
    note: "",
    drawing: "",
  });
}

function saveJob() {
  const job = makeJob(ui.clientId);
  state.jobs.push(job);
  persist();
  ui.jobId = job.id;
  ui.panel = null;
  render();
}

function removeAppt(id) {
  state.appointments = state.appointments.filter((item) => item.id !== id);
  persist();
  render();
}

function removeJob(id) {
  const job = jobById(id);
  state.appointments = state.appointments.filter((item) => item.jobId !== id);
  state.jobs = state.jobs.filter((item) => item.id !== id);
  if (job && ui.jobId === id) ui.jobId = jobsOf(job.clientId)[0]?.id || null;
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
  ui.panel = null;
  ui.view = "clientas";
  persist();
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
  if (current && (email.toLowerCase() === current || previous === current)) {
    const update = { password };
    if (email.toLowerCase() !== current) update.email = email;
    const { error } = await db.auth.updateUser(update);
    if (!error) {
      state.profiles[who] = email;
      ui.cloudEmail = email.toLowerCase() === current ? ui.cloudEmail : email;
      persist();
    }
    ui.settingsNote = error
      ? "No se pudo guardar la entrada de " + label + "."
      : "Listo. La entrada de " + label + " quedó en este aparato.";
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
    } else {
      ui.settingsNote = "No se pudo crear la entrada de " + label + ".";
    }
    render();
    return;
  }
  if (result.data.session && result.data.user) {
    const inserted = await guest.from("familia").insert({ user_id: result.data.user.id });
    await guest.auth.signOut();
    state.profiles[who] = email;
    persist();
    if (inserted.error && inserted.error.code !== "23505") {
      ui.settingsNote = "La cuenta de " + label + " se creó, pero el almacén todavía no la deja entrar. Falta el paso de las tres entradas.";
    } else {
      ui.settingsNote = "Listo. " + label + " entra con su correo, no con el tuyo.";
    }
    render();
    return;
  }
  state.profiles[who] = email;
  persist();
  ui.settingsNote = "Revisa el correo de " + label + " y confirma. Después entra con ese correo.";
  render();
}

function avisosStatus() {
  if (!("Notification" in window)) return "Este teléfono no muestra avisos desde la página.";
  if (Notification.permission === "denied") return "Están bloqueados. En el iPhone: Ajustes, Notificaciones, y permite Sueil.";
  if (!localStorage.getItem("sueil-avisos")) return "Todavía apagados en este aparato.";
  if (Notification.permission === "granted") return "Encendidos. Avisan una hora antes de la cita, a la hora, y si hay un urgente para hoy.";
  return "Pulsa Activar avisos y acepta el permiso.";
}

async function registerWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("sw.js");
  } catch (err) {
    console.warn(err);
    return null;
  }
}

function toldAlready(tag) {
  try {
    return JSON.parse(localStorage.getItem("sueil-avisados") || "[]").includes(tag);
  } catch (err) {
    return false;
  }
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
  const ready = await registerWorker();
  const active = ready && navigator.serviceWorker.controller;
  if (active) {
    active.postMessage({ type: "aviso", title, body, tag });
    return;
  }
  if (ready) {
    await ready.showNotification(title, { body, tag, lang: "es" });
    return;
  }
  new Notification(title, { body, tag, lang: "es" });
}

function minutesUntil(date, time) {
  if (!date) return 9999;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = String(time || "00:00").split(":").map(Number);
  return (new Date(y, m - 1, d, hh || 0, mm || 0).getTime() - Date.now()) / 60000;
}

function checkAvisos() {
  if (localStorage.getItem("sueil-avisos") !== "1") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const today = addDays(0);
  (state.appointments || []).forEach((appt) => {
    if (appt.date !== today) return;
    const mins = minutesUntil(appt.date, appt.time);
    const job = jobById(appt.jobId);
    const client = job ? clientById(job.clientId) : null;
    const who = (client && client.name) || "Cita";
    const line = `${appt.time} · ${who} · ${appt.kind || "Cita"}`;
    if (mins <= 60 && mins > 0) ping("Cita en menos de una hora", line, `soon:${appt.id}:${today}`);
    if (mins <= 0 && mins > -20) ping("Cita ahora", line, `now:${appt.id}:${today}`);
  });
  (state.jobs || []).forEach((job) => {
    if (!job.urgent || job.status === "entregado" || job.dueDate !== today) return;
    const client = clientById(job.clientId);
    ping("Urgente para hoy", `${(client && client.name) || "Clienta"} · ${job.type} · ${job.dueTime || ""}`, `urgent:${job.id}:${today}`);
  });
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
    ui.settingsNote = "No se activaron. En el iPhone abre Sueil desde el ícono de la pantalla de inicio y vuelve a pulsar Activar avisos.";
    render();
    return;
  }
  localStorage.setItem("sueil-avisos", "1");
  ui.settingsNote = "Avisos encendidos en este aparato.";
  await registerWorker();
  checkAvisos();
  render();
}

function disableAvisos() {
  localStorage.setItem("sueil-avisos", "0");
  ui.settingsNote = "Avisos apagados en este aparato.";
  render();
}

async function changeEmail(data) {
  const email = String(data.email || "").trim();
  ui.codeError = "";
  if (!db) {
    ui.settingsNote = "Todavía no hay cuenta del taller en este aparato.";
    render();
    return;
  }
  const { error } = await db.auth.updateUser({ email });
  ui.settingsNote = error
    ? "No se pudo cambiar el correo. Usa uno distinto al de ahora."
    : "Revisa el correo nuevo y confirma el cambio.";
  render();
}

async function changePassword(data) {
  const password = String(data.password || "");
  const again = String(data.again || "");
  if (password.length < 6) {
    ui.settingsNote = "La contraseña necesita al menos 6 caracteres.";
    render();
    return;
  }
  if (password !== again) {
    ui.settingsNote = "Las dos contraseñas no coinciden.";
    render();
    return;
  }
  if (!db) {
    ui.settingsNote = "Todavía no hay cuenta del taller en este aparato.";
    render();
    return;
  }
  const { error } = await db.auth.updateUser({ password });
  ui.settingsNote = error
    ? "No se pudo cambiar la contraseña."
    : "Contraseña cambiada. En los otros aparatos entra con esta.";
  render();
}

function jobForAppointment(data) {
  const phone = String(data.phone || "").trim();
  if (data.jobId && jobById(data.jobId)) {
    const job = jobById(data.jobId);
    const client = clientById(job.clientId);
    if (client && phone) client.phone = phone;
    return data.jobId;
  }
  const name = String(data.person || "").trim();
  if (!name) return "";
  let client = state.clients.find((item) => (item.name || "").trim().toLowerCase() === name.toLowerCase());
  if (!client) {
    client = { id: uid(), name, phone, nameDrawing: "" };
    state.clients.push(client);
  } else if (phone) client.phone = phone;
  let job = state.jobs.find((item) => item.clientId === client.id && item.status !== "entregado");
  if (!job) {
    job = makeJob(client.id);
    state.jobs.push(job);
  }
  return job.id;
}

function saveAppt(data) {
  const named = String(data.person || "").trim();
  const existing = data.jobId && jobById(data.jobId);
  const phone = ui.apptPhone || "";
  if (phoneDigits(phone).length < 10) {
    ui.apptError = "Para agendar necesita el número telefónico.";
    ui.clash = false;
    window.alert("Para agendar necesita el número telefónico.");
    render();
    return;
  }
  if ((!existing && !named) || !data.date || !data.time) {
    ui.apptError = "Escribe el nombre de la persona.";
    ui.clash = false;
    render();
    return;
  }
  data.phone = phone;
  const clash = state.appointments.some((item) => item.date === data.date && item.time === data.time);
  if (clash) {
    ui.clash = true;
    ui.apptError = "";
    render();
    return;
  }
  const jobId = jobForAppointment(data);
  ui.clash = false;
  ui.apptError = "";
  state.appointments.push({
    id: uid(),
    jobId,
    date: data.date,
    time: data.time,
    kind: data.kind || "Prueba",
  });
  persist();
  ui.panel = null;
  ui.apptPhone = "";
  ui.apptDraft = null;
  ui.day = data.date;
  const job = jobById(jobId);
  ui.jobId = job.id;
  ui.clientId = job.clientId;
  ui.view = "agenda";
  render();
}

function padOpen(kind, id = "", key = "") {
  const pad = ui.pad;
  return Boolean(pad && pad.kind === kind && (pad.id || "") === id && (pad.key || "") === key);
}

function padAfter(kind, id = "", key = "") {
  return padOpen(kind, id, key) ? keypadHtml() : "";
}

function keypadHtml() {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "+"];
  return `
    <div class="keypad">
      <p>${esc(ui.pad.label)}</p>
      <p class="keypad-value">${esc(ui.pad.value || "0")}</p>
      <div class="keys">
        ${keys.map((key) => `<button type="button" data-press="${key}">${key}</button>`).join("")}
      </div>
      <div class="row">
        <button type="button" class="btn ghost" data-press="back">Borrar</button>
        <button type="button" class="btn" data-press="ok">Listo</button>
      </div>
    </div>`;
}

function openPad(btn) {
  const kind = btn.dataset.num;
  const job = jobById(ui.jobId);
  const client = clientById(ui.clientId);
  let value = "";
  let label = "Número";
  if (kind === "apptPhone") {
    value = ui.apptPhone || "";
    label = "Teléfono";
  }
  if (kind === "phone" && client) {
    value = client.phone || "";
    label = "Teléfono";
  }
  if (kind === "presupuesto" && job) {
    value = String(job.presupuesto || "");
    label = "Presupuesto";
  }
  if (kind === "deposit" && job) {
    value = String(job.deposit || "");
    label = "Anticipo";
  }
  if (kind === "urgency" && job) {
    value = String(job.urgencyFee || "");
    label = "Cargo de urgencia";
  }
  if (kind === "price" && job) {
    const item = job.garments.find((garment) => garment.id === btn.dataset.id);
    value = item ? String(item.price || "") : "";
    label = "Precio";
  }
  if (kind === "measure" && job) {
    value = job.measures[btn.dataset.key] || "";
    label = MEASURES.find(([key]) => key === btn.dataset.key)?.[1] || "Medida";
  }
  ui.pad = { kind, id: btn.dataset.id || "", key: btn.dataset.key || "", value, label };
  render();
  const keypad = document.querySelector(".keypad");
  if (keypad) keypad.scrollIntoView({ block: "nearest" });
}

function writePad(value) {
  const pad = ui.pad;
  if (!pad) return;
  const job = jobById(ui.jobId);
  const client = clientById(ui.clientId);
  if (pad.kind === "apptPhone") {
    ui.apptPhone = value;
    pad.value = value;
    return;
  }
  if (pad.kind === "phone" && client) client.phone = value;
  if (pad.kind === "presupuesto" && job) job.presupuesto = value;
  if (pad.kind === "deposit" && job) job.deposit = value;
  if (pad.kind === "urgency" && job) job.urgencyFee = value;
  if (pad.kind === "price" && job) {
    const item = job.garments.find((garment) => garment.id === pad.id);
    if (item) item.price = value;
    job.price = job.garments.reduce((sum, garment) => sum + amount(garment.price), 0);
  }
  if (pad.kind === "measure" && job) job.measures[pad.key] = value;
  pad.value = value;
  persist();
}

function pressKey(key) {
  if (!ui.pad) return;
  if (key === "ok") {
    ui.pad = null;
    render();
    return;
  }
  let value = ui.pad.value || "";
  if (key === "back") value = value.slice(0, -1);
  else if (value.length < 18) value += key;
  writePad(value);
  render();
}

function readPhoto(input) {
  const file = input.files && input.files[0];
  if (!file) return;
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
      const job = jobById(ui.jobId);
      if (!job) return;
      if (input.dataset.photo === "shoe") job.shoePhoto = photo;
      if (input.dataset.photo === "garment") {
        const item = job.garments.find((garment) => garment.id === input.dataset.id);
        if (item) item.photo = photo;
      }
      persist();
      render();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function clearInk(kind, id) {
  if (kind === "client") {
    const client = clientById(ui.clientId);
    if (client) client.nameDrawing = "";
  } else {
    const item = jobById(ui.jobId)?.garments.find((garment) => garment.id === id);
    if (!item) return;
    if (kind === "garment-name") item.nameDrawing = "";
    else item.noteDrawing = "";
  }
  persist();
  render();
}

function setupInk(canvas) {
  const kind = canvas.dataset.ink;
  const id = canvas.dataset.id;
  const read = () => {
    if (kind === "client") return clientById(ui.clientId)?.nameDrawing || "";
    const item = jobById(ui.jobId)?.garments.find((garment) => garment.id === id);
    if (!item) return "";
    return kind === "garment-name" ? item.nameDrawing : item.noteDrawing;
  };
  const write = (value) => {
    if (kind === "client") {
      const client = clientById(ui.clientId);
      if (client) client.nameDrawing = value;
      return;
    }
    const item = jobById(ui.jobId)?.garments.find((garment) => garment.id === id);
    if (!item) return;
    if (kind === "garment-name") item.nameDrawing = value;
    else item.noteDrawing = value;
  };
  paintInk(canvas, read(), write);
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
  drawLines(ctx, w, h);
  if (job.drawing) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, w, h);
    img.src = job.drawing;
  }
  let drawing = false;
  const point = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (w / rect.width),
      y: (event.clientY - rect.top) * (h / rect.height),
    };
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
    ctx.lineWidth = event.pointerType === "pen" ? 2.4 : 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const finish = () => {
    if (!drawing) return;
    drawing = false;
    job.drawing = canvas.toDataURL("image/jpeg", 0.72);
    persist();
  };
  canvas.onpointerup = finish;
  canvas.onpointercancel = finish;
}

function paintInk(canvas, saved, write) {
  const ctx = canvas.getContext("2d");
  const w = 900;
  const h = 280;
  canvas.width = w;
  canvas.height = h;
  ctx.fillStyle = "#c3e0e5";
  ctx.fillRect(0, 0, w, h);
  if (saved) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, w, h);
    img.src = saved;
  }
  let drawing = false;
  const point = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (w / rect.width),
      y: (event.clientY - rect.top) * (h / rect.height),
    };
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
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const finish = () => {
    if (!drawing) return;
    drawing = false;
    write(canvas.toDataURL("image/jpeg", 0.72));
    persist();
  };
  canvas.onpointerup = finish;
  canvas.onpointercancel = finish;
}

function drawLines(ctx, w, h) {
  ctx.strokeStyle = "#69adc6";
  ctx.lineWidth = 1;
  for (let y = 56; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(36, y);
    ctx.lineTo(w - 36, y);
    ctx.stroke();
  }
}

document.addEventListener("keydown", (event) => {
  if (ui.view !== "slides") return;
  if (event.key === "ArrowRight") actions.next();
  if (event.key === "ArrowLeft") actions.prev();
});

render();
startCloud();
registerWorker();
setInterval(checkAvisos, 60000);
