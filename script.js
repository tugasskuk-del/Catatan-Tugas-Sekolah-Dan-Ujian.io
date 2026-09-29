const TASK_KEY = "catatTugas.tasks.v1";
const SESSION_KEY = "catatTugas.session.v1";
const USER_KEY = "catatTugas.user.v1";

document.addEventListener("DOMContentLoaded", () => {
  const page = location.pathname.split("/").pop() || "index.html";

  if (page === "index.html" || page === "") {
    if (localStorage.getItem(SESSION_KEY) === "true") {
      // Keep the login page accessible, but don't force-redirect on file:// paths.
    }
    initLogin();
  } else if (page === "dashboard.html") {
    if (localStorage.getItem(SESSION_KEY) !== "true") {
      location.href = "index.html";
      return;
    }
    initDashboard();
  }
});

function initLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  const password = document.getElementById("password");
  const toggle = document.getElementById("togglePassword");
  const alertBox = document.getElementById("loginAlert");

  toggle?.addEventListener("click", () => {
    const visible = password.type === "text";
    password.type = visible ? "password" : "text";
    toggle.innerHTML = `<i class="bi bi-eye${visible ? "" : "-slash"}"></i>`;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const pass = password.value;
    if (username === "admin" && pass === "admin123") {
      localStorage.setItem(SESSION_KEY, "true");
      localStorage.setItem(USER_KEY, username);
      location.href = "dashboard.html";
    } else {
      alertBox.textContent = "Username atau password salah. Coba akun demo: admin / admin123.";
      alertBox.classList.remove("d-none");
    }
  });
}

function initDashboard() {
  const tasks = getTasks();
  setupNavigation();
  setupSidebar();
  setupForm();
  setupFilters();
  document.getElementById("logoutBtn")?.addEventListener("click", logout);
  document.getElementById("todayText").textContent = new Intl.DateTimeFormat("id-ID", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric"
  }).format(new Date());
  document.getElementById("userLabel").textContent = localStorage.getItem(USER_KEY) || "Admin";
  renderAll();
}

function getTasks() {
  try { return JSON.parse(localStorage.getItem(TASK_KEY)) || []; }
  catch { return []; }
}
function saveTasks(tasks) {
  localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
  renderAll();
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function setupNavigation() {
  document.querySelectorAll("[data-view]").forEach(el => {
    el.addEventListener("click", () => {
      const view = el.dataset.view;
      showView(view);
    });
  });
  window.addEventListener("hashchange", () => showView(location.hash.replace("#","") || "dashboard"));
  showView(location.hash.replace("#","") || "dashboard");
}

function showView(view) {
  const allowed = ["dashboard","tugas","tambah"];
  if (!allowed.includes(view)) view = "dashboard";
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(`view-${view}`)?.classList.add("active");
  document.querySelectorAll(".side-nav a").forEach(a => a.classList.toggle("active", a.dataset.view === view));
  const labels = {
    dashboard:["OVERVIEW","Dashboard"],
    tugas:["TASK MANAGER","Semua Tugas"],
    tambah:[document.getElementById("taskId")?.value ? "EDIT TASK" : "TASK MANAGER", document.getElementById("taskId")?.value ? "Edit Tugas" : "Tambah Tugas"]
  };
  document.getElementById("pageKicker").textContent = labels[view][0];
  document.getElementById("pageTitle").textContent = labels[view][1];
  closeSidebar();
  if (view === "tambah" && !document.getElementById("taskId").value) {
    document.getElementById("formTitle").textContent = "Tambah Tugas";
    document.getElementById("formKicker").textContent = "TASK MANAGER";
  }
}

function setupSidebar() {
  document.getElementById("openSidebar")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebarOverlay").classList.add("show");
  });
  document.getElementById("closeSidebar")?.addEventListener("click", closeSidebar);
  document.getElementById("sidebarOverlay")?.addEventListener("click", closeSidebar);
}
function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebarOverlay")?.classList.remove("show");
}

function setupFilters() {
  document.getElementById("searchInput")?.addEventListener("input", renderAll);
  document.getElementById("statusFilter")?.addEventListener("change", renderAll);
}

function setupForm() {
  const photoInput = document.getElementById("taskPhoto");
  const removePhoto = document.getElementById("removePhoto");
  photoInput?.addEventListener("change", handlePhotoChange);
  removePhoto?.addEventListener("click", () => clearPhotoPreview(true));

  const form = document.getElementById("taskForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const tasks = getTasks();
    const id = document.getElementById("taskId").value;
    const data = {
      name: val("studentName"), className: val("className"), major: val("major"),
      subject: val("subject"), title: val("taskTitle"), deadline: val("deadline"),
      notes: val("notes"), done: val("initialStatus") === "done",
      photo: document.getElementById("taskPhoto").dataset.photo || ""

    };
    if (id) {
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) tasks[index] = {...tasks[index], ...data, updatedAt: Date.now()};
      showToast("Tugas berhasil diperbarui.");
    } else {
      tasks.unshift({id:uid(), ...data, createdAt:Date.now(), updatedAt:Date.now()});
      showToast("Tugas berhasil disimpan.");
    }
    saveTasks(tasks);
    resetForm();
    location.hash = "tugas";
    showView("tugas");
  });
  document.getElementById("cancelEdit").addEventListener("click", () => {
    resetForm();
    location.hash = "tugas";
    showView("tugas");
  });
}

function val(id) { return document.getElementById(id).value.trim(); }

function renderAll() {
  const tasks = getTasks();
  const done = tasks.filter(t => t.done).length;
  document.getElementById("statTotal").textContent = tasks.length;
  document.getElementById("statDone").textContent = done;
  document.getElementById("statTodo").textContent = tasks.length - done;
  document.getElementById("statProgress").textContent = tasks.length ? Math.round(done/tasks.length*100) + "%" : "0%";
  renderList("recentTasks", tasks.slice(0,5));
  const q = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const filter = document.getElementById("statusFilter")?.value || "all";
  const filtered = tasks.filter(t => {
    const text = `${t.name} ${t.className} ${t.major} ${t.subject} ${t.title}`.toLowerCase();
    return (!q || text.includes(q)) && (filter === "all" || (filter === "done" ? t.done : !t.done));
  });
  renderList("allTasks", filtered);
}

function renderList(containerId, tasks) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!tasks.length) {
    el.innerHTML = `<div class="empty-state"><i class="bi bi-inbox"></i><h4>Belum ada tugas</h4><p class="mb-0">Tambahkan tugas pertama kamu untuk mulai mencatat.</p></div>`;
    return;
  }
  el.innerHTML = tasks.map(task => taskHTML(task)).join("");
  el.querySelectorAll("[data-action='toggle']").forEach(b => b.addEventListener("click", () => toggleTask(b.dataset.id)));
  el.querySelectorAll("[data-action='edit']").forEach(b => b.addEventListener("click", () => editTask(b.dataset.id)));
  el.querySelectorAll("[data-action='delete']").forEach(b => b.addEventListener("click", () => deleteTask(b.dataset.id)));
}

function taskHTML(t) {
  const deadline = t.deadline ? new Date(t.deadline + "T00:00:00").toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : "Tanpa deadline";
  const photoHTML = t.photo
    ? `<img class="task-photo" src="${t.photo}" alt="Foto tugas">`
    : `<div class="task-photo-placeholder" title="Tidak ada foto"><i class="bi bi-image"></i></div>`;
  return `<article class="task-item">
    <button class="status-toggle ${t.done ? "done" : "todo"}" data-action="toggle" data-id="${t.id}" title="${t.done ? "Tandai belum dikerjakan" : "Tandai sudah dikerjakan"}">${t.done ? "✓" : "×"}</button>
    ${photoHTML}
    <div class="task-main">
      <div class="task-title">${escapeHTML(t.title)}</div>
      <div class="task-meta"><span>${escapeHTML(t.subject)}</span><span>${escapeHTML(t.name)}</span><span>${escapeHTML(t.className)}</span><span>${escapeHTML(t.major)}</span><span>${deadline}</span></div>
    </div>
    <span class="badge-status ${t.done ? "badge-done" : "badge-todo"}">${t.done ? "Sudah" : "Belum"}</span>
    <div class="task-actions">
      <button class="icon-btn" data-action="edit" data-id="${t.id}" title="Edit"><i class="bi bi-pencil"></i></button>
      <button class="icon-btn delete" data-action="delete" data-id="${t.id}" title="Hapus"><i class="bi bi-trash3"></i></button>
    </div>
  </article>`;
}

function toggleTask(id) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  task.updatedAt = Date.now();
  saveTasks(tasks);
  showToast(task.done ? "Tugas ditandai sudah dikerjakan." : "Tugas ditandai belum dikerjakan.");
}
function editTask(id) {
  const t = getTasks().find(x => x.id === id);
  if (!t) return;
  document.getElementById("taskId").value=t.id;
  document.getElementById("studentName").value=t.name;
  document.getElementById("className").value=t.className;
  document.getElementById("major").value=t.major;
  document.getElementById("subject").value=t.subject;
  document.getElementById("taskTitle").value=t.title;
  document.getElementById("deadline").value=t.deadline || "";
  document.getElementById("initialStatus").value=t.done ? "done" : "todo";
  document.getElementById("notes").value=t.notes || "";
  setPhotoPreview(t.photo || "");
  document.getElementById("formTitle").textContent="Edit Tugas";
  document.getElementById("formKicker").textContent="EDIT TASK";
  location.hash="tambah";
  showView("tambah");
}
function deleteTask(id) {
  const t = getTasks().find(x => x.id === id);
  if (!t) return;
  if (!confirm(`Hapus tugas "${t.title}"?`)) return;
  saveTasks(getTasks().filter(x => x.id !== id));
  showToast("Tugas berhasil dihapus.");
}
function resetForm() {
  document.getElementById("taskForm").reset();
  document.getElementById("taskId").value="";
  document.getElementById("initialStatus").value="todo";
  clearPhotoPreview(false);
  document.getElementById("formTitle").textContent="Tambah Tugas";
  document.getElementById("formKicker").textContent="TASK MANAGER";
}
function showToast(message) {
  const toastEl=document.getElementById("appToast");
  if (!toastEl) return;
  document.getElementById("toastMessage").textContent=message;
  bootstrap.Toast.getOrCreateInstance(toastEl,{delay:2200}).show();
}
function logout() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
  location.href="index.html";
}
function handlePhotoChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("File harus berupa gambar.");
    event.target.value = "";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    alert("Ukuran foto maksimal 2 MB.");
    event.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => setPhotoPreview(reader.result);
  reader.readAsDataURL(file);
}

function setPhotoPreview(dataUrl) {
  const input = document.getElementById("taskPhoto");
  const preview = document.getElementById("photoPreview");
  const img = document.getElementById("photoPreviewImg");
  if (!input || !preview || !img) return;
  input.dataset.photo = dataUrl || "";
  if (dataUrl) {
    img.src = dataUrl;
    preview.classList.remove("d-none");
  } else {
    preview.classList.add("d-none");
    img.removeAttribute("src");
  }
}

function clearPhotoPreview(clearInput = true) {
  const input = document.getElementById("taskPhoto");
  if (!input) return;
  input.dataset.photo = "";
  if (clearInput) input.value = "";
  const preview = document.getElementById("photoPreview");
  const img = document.getElementById("photoPreviewImg");
  preview?.classList.add("d-none");
  if (img) img.removeAttribute("src");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}