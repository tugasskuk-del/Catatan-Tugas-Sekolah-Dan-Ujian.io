/* SiTugas.id — frontend-only school task manager */
(() => {
  'use strict';
  const KEYS = { users:'siTugas_users', tasks:'siTugas_tugas', submissions:'siTugas_pengumpulan', session:'siTugas_session', personal:'siTugas_personal' };
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const uid = () => (crypto?.randomUUID?.() || 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
  const read = (key, fallback=[]) => { try { const v=JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = d => d ? new Date(d+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '-';
  const fmtDateTime = d => d ? new Date(d).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}) : '-';
  const bytes = n => n < 1024*1024 ? (n/1024).toFixed(0)+' KB' : (n/1024/1024).toFixed(2)+' MB';
  const notify = (title, text, icon='success') => Swal.fire({title,text,icon,confirmButtonColor:'#4f46e5'});
  const current = () => read(KEYS.session, null);
  const users = () => read(KEYS.users);
  const tasks = () => read(KEYS.tasks);
  const submissions = () => read(KEYS.submissions);
  const personal = () => read(KEYS.personal);
  const isAdminEmail = email => email.toLowerCase().includes('admin') || email.toLowerCase()==='admin@gmail.com';
  const hash = password => btoa(unescape(encodeURIComponent(password)));
  const icon = (name, cls='') => `<i data-lucide="${name}" class="${cls}"></i>`;
  const refreshIcons = () => window.lucide?.createIcons();

  function saveSession(user){ write(KEYS.session,{id:user.id,email:user.email,role:user.role,name:user.name,avatar:user.avatar}); }
  function logout(){ localStorage.removeItem(KEYS.session); render(); }
  function render(){
    const user=current();
    if(!user) return renderLogin();
    renderShell(user);
  }
  function renderLogin(){
    $('#app').innerHTML = `
      <main class="login-bg">
        <section class="login-card">
          <div class="flex items-center gap-3 mb-8"><div class="brand-mark">${icon('graduation-cap')}</div><div><div class="text-xl font-extrabold tracking-tight">SiTugas<span class="text-indigo-600">.id</span></div><div class="text-xs text-slate-400 font-semibold">Belajar lebih teratur, tugas lebih mudah</div></div></div>
          <div id="login-view">
            <h1 class="text-2xl font-extrabold mb-2">Selamat datang 👋</h1><p class="text-sm text-slate-500 mb-7">Masuk untuk mengelola tugas sekolahmu.</p>
            <form id="login-form">
              <div class="form-group"><label class="field-label">Email</label><input class="field" name="email" type="email" placeholder="nama@email.com" required autocomplete="email"></div>
              <div class="form-group"><label class="field-label">Password</label><input class="field" name="password" type="password" placeholder="Masukkan password" required autocomplete="current-password"></div>
              <button class="btn btn-primary w-full py-3 mt-2" type="submit">Masuk ${icon('arrow-right')}</button>
            </form>
            <p class="text-center text-sm text-slate-500 mt-6">Belum punya akun? <button id="show-register" class="font-extrabold text-indigo-600">Daftar sekarang</button></p>
          </div>
          <div class="mt-7 rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs leading-relaxed text-amber-800">${icon('shield-alert','inline w-4 h-4 mr-1')} Ini login simulasi untuk tugas sekolah, jangan gunakan password Gmail asli Anda. Password hanya disimpan sebagai hash demo di browser ini.</div>
          <p class="text-center text-[11px] text-slate-400 mt-5">SiTugas.id • Prototype frontend-only</p>
        </section>
      </main>`;
    $('#login-form').addEventListener('submit', e=>{
      e.preventDefault(); const fd=new FormData(e.currentTarget), email=String(fd.get('email')).trim().toLowerCase(), password=String(fd.get('password'));
      const user=users().find(u=>u.email===email && u.password_hash===hash(password));
      if(!user) return notify('Login gagal','Email atau password tidak cocok.','error');
      saveSession(user); render();
    });
    $('#show-register').addEventListener('click', renderRegister);
    refreshIcons();
  }
  function renderRegister(){
    $('#login-view').innerHTML = `
      <h1 class="text-2xl font-extrabold mb-2">Buat akun baru</h1><p class="text-sm text-slate-500 mb-7">Daftar sebagai siswa atau admin demo.</p>
      <form id="register-form">
        <div class="form-group"><label class="field-label">Nama lengkap</label><input class="field" name="name" required maxlength="60" placeholder="Nama kamu"></div>
        <div class="form-group"><label class="field-label">Email</label><input class="field" name="email" type="email" required placeholder="nama@email.com"></div>
        <div class="form-group"><label class="field-label">Password simulasi</label><input class="field" name="password" type="password" minlength="4" required placeholder="Minimal 4 karakter"></div>
        <button class="btn btn-primary w-full py-3 mt-2" type="submit">Daftar ${icon('user-plus')}</button>
      </form>
      <p class="text-center text-sm text-slate-500 mt-6">Sudah punya akun? <button id="show-login" class="font-extrabold text-indigo-600">Masuk</button></p>`;
    $('#register-form').addEventListener('submit',e=>{
      e.preventDefault(); const fd=new FormData(e.currentTarget), name=String(fd.get('name')).trim(), email=String(fd.get('email')).trim().toLowerCase(), password=String(fd.get('password'));
      if(users().some(u=>u.email===email)) return notify('Email sudah terdaftar','Gunakan email lain atau masuk ke akunmu.','warning');
      const role=isAdminEmail(email)?'ADMIN':'SISWA';
      const user={id:uid(),email,password_hash:hash(password),role,name,avatar:name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()};
      write(KEYS.users,[...users(),user]); saveSession(user); render();
    });
    $('#show-login').addEventListener('click',renderLogin); refreshIcons();
  }

  function renderShell(user){
    const admin=user.role==='ADMIN';
    const nav=admin?[['dashboard','layout-dashboard','Dashboard'],['tasks','clipboard-list','Kelola Tugas'],['submissions','inbox','Pengumpulan Siswa'],['students','users','Daftar Siswa'],['settings','settings','Pengaturan']]:[['dashboard','layout-dashboard','Dashboard'],['tasks','clipboard-list','Daftar Tugas'],['personal','notebook-pen','Tugas Pribadi']];
    const active=window.appPage || 'dashboard';
    $('#app').innerHTML=`
      <div class="app-shell">
        <aside class="sidebar">
          <div class="flex items-center gap-3 px-2 mb-10"><div class="brand-mark">${icon('graduation-cap')}</div><div><div class="font-extrabold text-lg">SiTugas<span class="text-indigo-600">.id</span></div><div class="text-[10px] text-slate-400 font-bold tracking-wider">SCHOOL TASK MANAGER</div></div></div>
          <div class="text-[10px] font-extrabold text-slate-400 tracking-widest px-3 mb-3">MENU UTAMA</div>
          <nav class="space-y-1">${nav.map(([id,ic,label])=>`<button data-page="${id}" class="nav-link w-full ${active===id?'active':''}">${icon(ic)}<span>${label}</span>${id==='submissions'&&pendingCount()?`<span class="ml-auto rounded-full bg-rose-500 text-white text-[10px] px-2 py-0.5">${pendingCount()}</span>`:''}</button>`).join('')}</nav>
          <div class="mt-auto rounded-2xl bg-indigo-50 p-4"><div class="text-xs font-extrabold text-indigo-900 mb-1">Tetap produktif!</div><p class="text-[11px] text-indigo-700 leading-relaxed">Satu tugas yang selesai adalah satu langkah lebih dekat ke tujuanmu.</p></div>
          <div class="flex items-center gap-3 border-t border-slate-100 pt-4 mt-5"><div class="avatar">${esc(user.avatar||'U')}</div><div class="min-w-0 flex-1"><div class="text-xs font-extrabold truncate">${esc(user.name)}</div><div class="text-[10px] text-slate-400 truncate">${esc(user.email)}</div></div><button id="logout" title="Logout" class="text-slate-400 hover:text-rose-500">${icon('log-out')}</button></div>
        </aside>
        <main class="main-area">
          <header class="topbar"><div><div class="font-extrabold text-slate-800">${admin?'Pusat Kontrol Admin':'Ruang Belajar'}</div><div class="text-xs text-slate-400">${new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div></div><div class="flex items-center gap-3"><span class="top-email text-xs text-slate-500">${esc(user.email)}</span><span class="badge ${admin?'badge-revision':'badge-neutral'}">${admin?'ADMIN':'SISWA'}</span><button id="logout-mobile" class="lg:hidden text-slate-400">${icon('log-out')}</button></div></header>
          <div id="page-content" class="content-wrap"></div>
        </main>
        <nav class="mobile-nav">${nav.map(([id,ic,label])=>`<button data-page="${id}" class="${active===id?'active':''}">${icon(ic)}<span>${label}</span></button>`).join('')}<button id="mobile-logout">${icon('log-out')}<span>Keluar</span></button></nav>
      </div>`;
    $$('[data-page]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
    ['logout','logout-mobile','mobile-logout'].forEach(id=>$('#'+id)?.addEventListener('click',()=>Swal.fire({title:'Keluar dari akun?',text:'Kamu perlu login kembali untuk masuk.',icon:'question',showCancelButton:true,confirmButtonText:'Logout',cancelButtonText:'Batal',confirmButtonColor:'#e11d48'}).then(r=>{if(r.isConfirmed)logout();})));
    renderPage(user,active); refreshIcons();
  }
  function go(page){window.appPage=page;renderShell(current());}
  function pendingCount(){return submissions().filter(s=>s.status==='MENUNGGU_DIPERIKSA').length;}
  function statCard(label,value,ic,tint,sub='') { return `<div class="stat-card"><div class="flex items-center justify-between mb-4"><span class="text-xs font-bold text-slate-500">${label}</span><span class="stat-icon ${tint}">${icon(ic)}</span></div><div class="text-3xl font-extrabold tracking-tight">${value}</div><div class="text-[11px] text-slate-400 mt-1">${sub}</div></div>`; }
  function renderPage(user,page){
    const root=$('#page-content'); if(!root)return;
    if(user.role==='ADMIN'){
      if(page==='tasks') return adminTasks(root);
      if(page==='submissions') return adminSubmissions(root);
      if(page==='students') return adminStudents(root);
      if(page==='settings') return adminSettings(root);
      return adminDashboard(root,user);
    }
    if(page==='personal') return studentPersonal(root,user);
    return studentDashboard(root,user);
  }
  function adminDashboard(root,user){
    const allS=submissions(), allT=tasks();
    root.innerHTML=`<div class="mb-7"><h1 class="text-2xl font-extrabold">Selamat datang, Admin 👋</h1><p class="text-sm text-slate-500 mt-1">Pantau aktivitas tugas dan pengumpulan siswa dari satu tempat.</p></div>
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-7">${statCard('Total Siswa Terdaftar',users().filter(u=>u.role==='SISWA').length,'users','bg-blue-50 text-blue-600','Akun siswa')}${statCard('Total Tugas Dibuat',allT.length,'clipboard-list','bg-violet-50 text-violet-600','Tugas resmi')}${statCard('Tugas Dikumpulkan',allS.length,'inbox','bg-emerald-50 text-emerald-600','Semua pengumpulan')}${statCard('Perlu Diperiksa',pendingCount(),'clock-3','bg-amber-50 text-amber-600','Menunggu penilaian')}</div>
      <div class="grid xl:grid-cols-5 gap-5"><section class="panel xl:col-span-3"><div class="flex justify-between items-center mb-4"><div><h2 class="font-extrabold">Pengumpulan terbaru</h2><p class="text-xs text-slate-400 mt-1">Aktivitas yang masuk dari siswa</p></div><button class="btn btn-soft" data-go="submissions">Lihat semua ${icon('arrow-up-right')}</button></div>${allS.length?`<div class="space-y-3">${allS.slice().sort((a,b)=>new Date(b.tanggal_kumpul)-new Date(a.tanggal_kumpul)).slice(0,5).map(s=>submissionMini(s)).join('')}</div>`:empty('inbox','Belum ada pengumpulan','Pengumpulan siswa akan muncul di sini.')}</section><section class="panel xl:col-span-2"><h2 class="font-extrabold mb-1">Akses cepat</h2><p class="text-xs text-slate-400 mb-5">Kelola aktivitas kelas dengan cepat.</p><button class="btn btn-primary w-full mb-3" id="quick-create">${icon('plus')} Buat tugas baru</button><button class="btn btn-outline w-full" data-go="students">${icon('users')} Lihat daftar siswa</button><div class="mt-6 rounded-xl bg-indigo-50 p-4"><div class="font-bold text-sm text-indigo-900">Alur dua arah aktif</div><p class="text-xs text-indigo-700 mt-1 leading-relaxed">Tugas admin tampil di akun siswa. Setelah siswa mengumpulkan, admin dapat memeriksa file dan memberi status.</p></div></section></div>`;
    $('#quick-create').onclick=()=>taskModal(); $$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
  }
  function empty(ic,title,desc){return `<div class="empty-state">${icon(ic)}<div class="font-bold text-slate-500">${title}</div><div class="text-xs mt-1">${desc}</div></div>`;}
  function submissionMini(s){return `<div class="flex items-center gap-3 py-2"><div class="avatar">${esc((s.siswa_nama||'?').slice(0,2).toUpperCase())}</div><div class="min-w-0 flex-1"><div class="text-sm font-bold truncate">${esc(s.siswa_nama)}</div><div class="text-xs text-slate-400 truncate">${esc(taskTitle(s.tugas_id))} • ${fmtDateTime(s.tanggal_kumpul)}</div></div>${statusBadge(s.status)}</div>`;}
  function taskTitle(id){return tasks().find(t=>t.id===id)?.judul || personal().find(t=>t.id===id)?.judul || '(Tugas dihapus)';}
  function statusBadge(status){const map={MENUNGGU_DIPERIKSA:['badge-wait','Menunggu diperiksa'],SELESAI:['badge-done','Selesai'],REVISI:['badge-revision','Perlu revisi']};const [c,l]=map[status]||['badge-neutral',status||'-'];return `<span class="badge ${c}">${l}</span>`;}

  function adminTasks(root){
    const list=tasks().slice().sort((a,b)=>new Date(b.dibuat_pada)-new Date(a.dibuat_pada));
    root.innerHTML=`<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6"><div><h1 class="text-2xl font-extrabold">Kelola Tugas</h1><p class="text-sm text-slate-500 mt-1">Buat dan atur tugas resmi untuk seluruh siswa.</p></div><button id="create-task" class="btn btn-primary">${icon('plus')} Buat Tugas Baru</button></div>
      <section class="panel"><div class="flex items-center justify-between mb-4"><h2 class="font-extrabold">Semua tugas <span class="text-slate-400 font-semibold">(${list.length})</span></h2><span class="text-xs text-slate-400">Terbaru lebih dulu</span></div>${list.length?`<div class="table-wrap"><table><thead><tr><th>Judul tugas</th><th>Mata pelajaran</th><th>Deadline</th><th>Dibuat</th><th>Aksi</th></tr></thead><tbody>${list.map(t=>`<tr><td><div class="font-bold text-slate-700">${esc(t.judul)}</div><div class="text-[11px] text-slate-400 max-w-xs truncate">${esc(t.deskripsi_lengkap||'')}</div></td><td>${esc(t.mapel)}</td><td>${fmtDate(t.deadline)}</td><td>${fmtDateTime(t.dibuat_pada)}</td><td><div class="flex gap-2"><button class="btn btn-soft" data-edit="${t.id}">Edit</button><button class="btn btn-danger" data-delete="${t.id}">Hapus</button></div></td></tr>`).join('')}</tbody></table></div>`:empty('clipboard-list','Belum ada tugas','Klik “Buat Tugas Baru” untuk memulai.')}</section>`;
    $('#create-task').onclick=()=>taskModal();
    $$('[data-edit]').forEach(b=>b.onclick=()=>taskModal(tasks().find(t=>t.id===b.dataset.edit)));
    $$('[data-delete]').forEach(b=>b.onclick=()=>deleteTask(b.dataset.delete));
  }
  async function deleteTask(id){const r=await Swal.fire({title:'Hapus tugas ini?',text:'Pengumpulan terkait tetap tersimpan untuk riwayat.',icon:'warning',showCancelButton:true,confirmButtonText:'Hapus',cancelButtonText:'Batal',confirmButtonColor:'#e11d48'});if(r.isConfirmed){write(KEYS.tasks,tasks().filter(t=>t.id!==id));go('tasks');}}
  function taskModal(existing=null,personalMode=false){
    const t=existing||{}, subjects=['MTK','IPA','IPS','B. Indonesia','B. Inggris','TIK','Lainnya'];
    showModal(existing?'Edit tugas':personalMode?'Catat tugas pribadi':'Buat tugas baru',`
      <form id="task-form">
        <div class="form-group"><label class="field-label">Judul tugas</label><input class="field" name="judul" required maxlength="100" value="${esc(t.judul||'')}" placeholder="Contoh: Latihan persamaan kuadrat"></div>
        <div class="form-group"><label class="field-label">Mata pelajaran</label><select class="field" name="mapel">${subjects.map(s=>`<option ${t.mapel===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="form-group"><label class="field-label">Deskripsi / instruksi</label><textarea class="field" name="deskripsi" rows="4" placeholder="Tulis detail tugas di sini...">${esc(t.deskripsi_lengkap||'')}</textarea></div>
        <div class="form-group"><label class="field-label">Deadline</label><input class="field" name="deadline" type="date" required value="${esc(t.deadline||'')}"></div>
      </form>`, 'Simpan tugas',()=>{
        const f=$('#task-form');if(!f.reportValidity())return false;const fd=new FormData(f);
        const obj={id:t.id||uid(),judul:String(fd.get('judul')).trim(),mapel:fd.get('mapel'),deskripsi_lengkap:String(fd.get('deskripsi')).trim(),deadline:fd.get('deadline'),dibuat_oleh:current().email,dibuat_pada:t.dibuat_pada||new Date().toISOString(),untuk_semua_siswa:!personalMode};
        write(personalMode?KEYS.personal:KEYS.tasks,existing?(personalMode?personal():tasks()).map(x=>x.id===obj.id?obj:x):[...(personalMode?personal():tasks()),obj]);closeModal();render();notify('Tersimpan','Data tugas berhasil disimpan.');
      });
  }
  function adminSubmissions(root){
    const list=submissions().slice().sort((a,b)=>new Date(b.tanggal_kumpul)-new Date(a.tanggal_kumpul));
    root.innerHTML=`<div class="mb-6"><h1 class="text-2xl font-extrabold">Pengumpulan Siswa</h1><p class="text-sm text-slate-500 mt-1">Periksa file tugas dan berikan hasil penilaian kepada siswa.</p></div><section class="panel"><div class="flex items-center justify-between mb-4"><h2 class="font-extrabold">Semua pengumpulan <span class="text-slate-400">(${list.length})</span></h2><span class="badge badge-wait">${pendingCount()} menunggu</span></div>${list.length?`<div class="table-wrap"><table><thead><tr><th>Nama siswa</th><th>Judul tugas</th><th>Waktu kumpul</th><th>File ZIP</th><th>Foto</th><th>Status & aksi</th></tr></thead><tbody>${list.map(s=>`<tr><td><div class="font-bold text-slate-700">${esc(s.siswa_nama)}</div><div class="text-[11px] text-slate-400">${esc(s.siswa_email)}</div></td><td>${esc(taskTitle(s.tugas_id))}</td><td>${fmtDateTime(s.tanggal_kumpul)}</td><td>${s.file_zip?`<button class="btn btn-soft" data-zip="${s.id}">${icon('download')} Download</button>`:'<span class="text-slate-400">Tidak ada</span>'}</td><td><button class="btn btn-outline" data-photos="${s.id}">${icon('images')} ${s.foto_files?.length||0} foto</button></td><td><div class="flex flex-col gap-2 items-start">${statusBadge(s.status)}<div class="flex gap-1"><button class="btn btn-success" data-approve="${s.id}">Setujui</button><button class="btn btn-danger" data-revise="${s.id}">Revisi</button></div></div></td></tr>`).join('')}</tbody></table></div>`:empty('inbox','Belum ada pengumpulan','Saat siswa mengirim tugas, datanya akan muncul di sini.')}</section>`;
    $$('[data-zip]').forEach(b=>b.onclick=()=>downloadZip(b.dataset.zip));
    $$('[data-photos]').forEach(b=>b.onclick=()=>photoGallery(b.dataset.photos));
    $$('[data-approve]').forEach(b=>b.onclick=()=>setSubmissionStatus(b.dataset.approve,'SELESAI'));
    $$('[data-revise]').forEach(b=>b.onclick=()=>setSubmissionStatus(b.dataset.revise,'REVISI'));
  }
  function setSubmissionStatus(id,status){write(KEYS.submissions,submissions().map(s=>s.id===id?{...s,status,diubah_pada:new Date().toISOString()}:s));go('submissions');notify(status==='SELESAI'?'Tugas disetujui':'Revisi diminta',status==='SELESAI'?'Status selesai akan terlihat di akun siswa.':'Siswa dapat melihat status revisi di dashboard.');}
  function downloadZip(id){const s=submissions().find(x=>x.id===id);if(!s?.file_zip)return notify('File tidak tersedia','Siswa tidak melampirkan file arsip.','info');downloadData(s.file_zip.base64,s.file_zip.name);}
  function downloadData(data,name){const a=document.createElement('a');a.href=data;a.download=name||'file';document.body.appendChild(a);a.click();a.remove();}
  function photoGallery(id){const s=submissions().find(x=>x.id===id);const pics=s?.foto_files||[];showModal('Foto pengumpulan',pics.length?`<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${pics.map(p=>`<a href="${p.base64}" target="_blank" class="block"><img src="${p.preview||p.base64}" alt="${esc(p.name)}" class="w-full aspect-square object-cover rounded-xl"><div class="text-xs text-slate-500 mt-1 truncate">${esc(p.name)}</div></a>`).join('')}</div>`:empty('image','Tidak ada foto','Siswa tidak melampirkan foto.'),'Tutup',closeModal);}
  function adminStudents(root){const list=users().filter(u=>u.role==='SISWA');root.innerHTML=`<div class="mb-6"><h1 class="text-2xl font-extrabold">Daftar Siswa</h1><p class="text-sm text-slate-500 mt-1">Akun siswa yang telah mendaftar pada browser ini.</p></div><section class="panel"><h2 class="font-extrabold mb-4">Siswa terdaftar (${list.length})</h2>${list.length?`<div class="table-wrap"><table><thead><tr><th>Nama siswa</th><th>Email</th><th>Jumlah pengumpulan</th><th>Bergabung</th></tr></thead><tbody>${list.map(u=>`<tr><td><div class="flex items-center gap-3"><div class="avatar">${esc(u.avatar||'S')}</div><span class="font-bold text-slate-700">${esc(u.name)}</span></div></td><td>${esc(u.email)}</td><td>${submissions().filter(s=>s.siswa_email===u.email).length}</td><td>Terdaftar</td></tr>`).join('')}</tbody></table></div>`:empty('users','Belum ada siswa','Akun siswa yang mendaftar akan ditampilkan di sini.')}</section>`;}
  function adminSettings(root){root.innerHTML=`<div class="mb-6"><h1 class="text-2xl font-extrabold">Pengaturan & Data</h1><p class="text-sm text-slate-500 mt-1">Cadangkan dan pulihkan data aplikasi di browser ini.</p></div><div class="grid md:grid-cols-2 gap-4"><section class="panel"><div class="stat-icon bg-indigo-50 text-indigo-600 mb-4">${icon('database')}</div><h2 class="font-extrabold">Backup database lokal</h2><p class="text-xs text-slate-500 mt-2 mb-5">Unduh seluruh data SiTugas.id menjadi satu file JSON untuk cadangan.</p><button id="export-data" class="btn btn-primary">${icon('download')} Export Database (.json)</button></section><section class="panel"><div class="stat-icon bg-emerald-50 text-emerald-600 mb-4">${icon('file-up')}</div><h2 class="font-extrabold">Import database</h2><p class="text-xs text-slate-500 mt-2 mb-5">Pulihkan data dari file backup JSON SiTugas.id.</p><label class="btn btn-outline">${icon('upload')} Pilih file JSON<input id="import-data" type="file" accept=".json,application/json" hidden></label></section><section class="panel md:col-span-2 border-rose-100"><div class="stat-icon bg-rose-50 text-rose-600 mb-4">${icon('trash-2')}</div><h2 class="font-extrabold">Hapus semua data</h2><p class="text-xs text-slate-500 mt-2 mb-5">Menghapus seluruh akun, tugas, dan pengumpulan dari browser ini. Tindakan ini tidak dapat dibatalkan.</p><button id="clear-data" class="btn btn-danger">${icon('trash-2')} Hapus Semua Data</button></section></div>`;
    $('#export-data').onclick=()=>{const data={version:1,exported_at:new Date().toISOString(),users:users(),tasks:tasks(),submissions:submissions(),personal:personal()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='situgas-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href);};
    $('#import-data').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.users)||!Array.isArray(data.tasks)||!Array.isArray(data.submissions))throw Error();write(KEYS.users,data.users);write(KEYS.tasks,data.tasks);write(KEYS.submissions,data.submissions);write(KEYS.personal,Array.isArray(data.personal)?data.personal:[]);notify('Import berhasil','Data backup sudah dipulihkan.');render();}catch{notify('Import gagal','File JSON tidak valid atau formatnya bukan backup SiTugas.id.','error');}};
    $('#clear-data').onclick=()=>Swal.fire({title:'Hapus seluruh data?',text:'Semua data pada browser ini akan hilang permanen.',icon:'warning',showCancelButton:true,confirmButtonText:'Ya, hapus semua',cancelButtonText:'Batal',confirmButtonColor:'#e11d48'}).then(r=>{if(r.isConfirmed){Object.values(KEYS).forEach(k=>localStorage.removeItem(k));render();}});
  }

  function studentDashboard(root,user){
    const all=tasks(), own=all.filter(t=>t.untuk_semua_siswa!==false), mine=submissions().filter(s=>s.siswa_email===user.email), done=mine.filter(s=>s.status==='SELESAI').length;
    const personalList=personal().filter(t=>t.dibuat_oleh===user.email);
    root.innerHTML=`<div class="mb-7"><h1 class="text-2xl font-extrabold">Halo, ${esc(user.name.split(' ')[0])}! 👋</h1><p class="text-sm text-slate-500 mt-1">Yuk, selesaikan tugasmu satu per satu. Kamu pasti bisa!</p></div>
      <section class="panel mb-6"><div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><div class="text-xs font-bold text-slate-500 mb-1">Progress tugas kamu</div><div class="text-xl font-extrabold">${done} dari ${own.length} tugas selesai</div><div class="text-xs text-slate-400 mt-1">${own.length?Math.round(done/own.length*100):0}% dari tugas resmi</div></div><div class="w-full sm:w-2/5"><div class="progress-track"><div class="progress-fill" style="width:${own.length?done/own.length*100:0}%"></div></div></div></div></section>
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4"><div><h2 class="font-extrabold text-lg">Tugas dari Admin</h2><p class="text-xs text-slate-400">Tugas resmi yang dibagikan untuk semua siswa</p></div><button class="btn btn-outline" id="go-personal">${icon('notebook-pen')} Tugas pribadi</button></div>
      ${own.length?`<div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">${own.map(t=>taskCard(t,user,mine.find(s=>s.tugas_id===t.id))).join('')}</div>`:empty('clipboard-list','Belum ada tugas resmi','Tugas yang dibuat admin akan muncul di sini.')}
      ${mine.some(s=>s.status==='REVISI')?`<div class="mt-6 rounded-xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-700">${icon('alert-circle','inline w-4 h-4 mr-1')} Ada tugas yang perlu diperbaiki. Periksa status pada kartu tugas.</div>`:''}`;
    $('#go-personal').onclick=()=>go('personal'); bindTaskCards(user);
  }
  function daysLeft(date){const today=new Date();today.setHours(0,0,0,0);const d=new Date(date+'T00:00:00');return Math.ceil((d-today)/86400000);}
  function deadlineLabel(date){const n=daysLeft(date);if(n<0)return `<span class="text-rose-600 font-bold">Terlambat ${Math.abs(n)} hari</span>`;if(n===0)return `<span class="text-amber-600 font-bold">Deadline hari ini</span>`;if(n<=2)return `<span class="text-amber-600 font-bold">Sisa ${n} hari lagi</span>`;return `<span class="text-slate-500">Sisa ${n} hari lagi</span>`;}
  function taskCard(t,user,sub,personalMode=false){return `<article class="task-card"><div class="flex items-start justify-between gap-3 mb-4"><span class="badge badge-neutral">${esc(t.mapel)}</span>${sub?statusBadge(sub.status):'<span class="badge badge-wait">Belum dikumpulkan</span>'}</div><h3 class="font-extrabold text-base leading-snug">${esc(t.judul)}</h3><p class="text-xs text-slate-500 mt-2 line-clamp-3">${esc(t.deskripsi_lengkap||'Tidak ada deskripsi tambahan.')}</p><div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2"><div class="text-xs"><div class="text-slate-400 mb-1">Deadline • ${fmtDate(t.deadline)}</div>${deadlineLabel(t.deadline)}</div><button class="btn ${sub?.status==='SELESAI'?'btn-outline':'btn-primary'}" data-submit="${t.id}" data-personal="${personalMode?'1':'0'}">${sub?'Lihat status':'Kerjakan / Kumpulkan'}</button></div></article>`;}
  function bindTaskCards(user){$$('[data-submit]').forEach(b=>b.onclick=()=>{const id=b.dataset.submit;const isPersonal=b.dataset.personal==='1';const existing=submissions().find(s=>s.tugas_id===id&&s.siswa_email===user.email);if(existing){showSubmissionDetail(existing);return;}submissionModal((isPersonal?personal():tasks()).find(t=>t.id===id),user);});}
  function showSubmissionDetail(s){showModal('Status pengumpulan',`<div class="space-y-3"><div class="text-sm"><span class="text-slate-400">Tugas</span><div class="font-extrabold">${esc(taskTitle(s.tugas_id))}</div></div><div>${statusBadge(s.status)}</div><div class="text-sm"><span class="text-slate-400">Dikumpulkan</span><div>${fmtDateTime(s.tanggal_kumpul)}</div></div><div class="text-sm"><span class="text-slate-400">Catatan</span><div>${esc(s.catatan_siswa||'-')}</div></div>${s.status==='REVISI'?'<div class="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">Admin meminta kamu memperbaiki tugas. Hubungi guru/admin untuk arahan revisi.</div>':''}</div>`,'Tutup',closeModal);}
  function studentPersonal(root,user){const list=personal().filter(t=>t.dibuat_oleh===user.email);const mine=submissions().filter(s=>s.siswa_email===user.email);root.innerHTML=`<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6"><div><h1 class="text-2xl font-extrabold">Tugas Pribadi Saya</h1><p class="text-sm text-slate-500 mt-1">Catat tugas sendiri agar tidak ada yang terlewat.</p></div><button id="add-personal" class="btn btn-primary">${icon('plus')} Catat Tugas Baru</button></div>${list.length?`<div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">${list.map(t=>taskCard(t,user,mine.find(s=>s.tugas_id===t.id),true)).join('')}</div>`:empty('notebook-pen','Belum ada catatan tugas','Tambahkan tugas pribadi untuk mengatur pekerjaanmu.')}`;$('#add-personal').onclick=()=>taskModal(null,true);bindTaskCards(user);}

  function submissionModal(task,user){
    if(!task)return;
    let zipFile=null, photos=[];
    showModal('Kumpulkan tugas',`
      <div class="mb-4 rounded-xl bg-indigo-50 p-3"><div class="text-[11px] font-bold text-indigo-500">${esc(task.mapel)}</div><div class="font-extrabold text-indigo-950">${esc(task.judul)}</div><div class="text-xs text-indigo-700 mt-1">Deadline: ${fmtDate(task.deadline)}</div></div>
      <form id="submission-form">
        <div class="form-group"><label class="field-label">Catatan pengerjaan</label><textarea class="field" name="catatan" rows="3" placeholder="Ceritakan singkat pengerjaan tugasmu..."></textarea></div>
        <div class="form-group"><label class="field-label">File tugas (ZIP / RAR / 7Z) • Maks. 15 MB</label><div id="zip-drop" class="drop-zone"><input id="zip-input" type="file" accept=".zip,.rar,.7z" hidden><div class="text-indigo-500 mb-2">${icon('file-archive','w-7 h-7 mx-auto')}</div><div class="text-sm font-bold text-slate-700">Klik atau tarik file ke area ini</div><div class="text-xs text-slate-400 mt-1">Format .zip, .rar, .7z</div><div id="zip-info" class="text-xs font-bold text-indigo-600 mt-3"></div></div></div>
        <div class="form-group"><label class="field-label">Foto dokumentasi (bisa banyak)</label><div class="drop-zone"><input id="photo-input" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple hidden><button type="button" id="pick-photos" class="btn btn-soft">${icon('image-plus')} Pilih foto</button><div class="text-xs text-slate-400 mt-2">JPG, PNG, JPEG, WEBP</div></div><div id="photo-previews" class="preview-grid mt-3"></div></div>
      </form>
      <p class="text-[11px] text-slate-400">File disimpan di browser perangkat ini (IndexedDB jika tersedia, dengan fallback LocalStorage). Jangan hapus data browser sebelum file dicadangkan.</p>`, 'Simpan & Kumpulkan', async()=>{
        const f=$('#submission-form');if(!f.reportValidity())return false;
        if(!zipFile&&!photos.length){const r=await Swal.fire({title:'Belum ada lampiran',text:'Kumpulkan tanpa file ZIP dan foto?',icon:'question',showCancelButton:true,confirmButtonText:'Ya, lanjutkan',cancelButtonText:'Pilih file'});if(!r.isConfirmed)return false;}
        const fd=new FormData(f);
        const item={id:uid(),tugas_id:task.id,siswa_email:user.email,siswa_nama:user.name,catatan_siswa:String(fd.get('catatan')||'').trim(),file_zip:zipFile,foto_files:photos,tanggal_kumpul:new Date().toISOString(),status:'MENUNGGU_DIPERIKSA'};
        const arr=submissions();const ix=arr.findIndex(s=>s.tugas_id===task.id&&s.siswa_email===user.email);if(ix>=0)arr[ix]=item;else arr.push(item);write(KEYS.submissions,arr);closeModal();render();notify('Tugas terkumpul!','Pengumpulanmu sudah tersimpan. Admin dapat memeriksanya.');
      });
    const input=$('#zip-input'), drop=$('#zip-drop');
    $('#zip-drop').onclick=e=>{if(e.target!==input)input.click();};
    input.onchange=()=>handleZip(input.files[0]);
    ['dragover','dragenter'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('dragover');}));
    ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('dragover');}));
    drop.addEventListener('drop',e=>handleZip(e.dataTransfer.files[0]));
    function handleZip(file){if(!file)return;const ext=file.name.split('.').pop().toLowerCase();if(!['zip','rar','7z'].includes(ext))return notify('Format tidak didukung','Pilih file ZIP, RAR, atau 7Z.','error');if(file.size>15*1024*1024)return notify('File terlalu besar','Ukuran maksimal 15 MB.','error');zipFile=file;$('#zip-info').textContent=`${file.name} • ${bytes(file.size)}`;}
    $('#pick-photos').onclick=()=>$('#photo-input').click();
    $('#photo-input').onchange=async e=>{for(const file of [...e.target.files]){if(!['image/jpeg','image/png','image/webp'].includes(file.type)){notify('Format foto tidak didukung',file.name,'error');continue;}if(file.size>8*1024*1024){notify('Foto terlalu besar',`${file.name} lebih dari 8 MB.`,'warning');continue;}photos.push({name:file.name,base64:await fileToData(file),preview:await fileToData(file)});}drawPhotos();e.target.value='';};
    function drawPhotos(){$('#photo-previews').innerHTML=photos.map((p,i)=>`<div class="preview-item"><img src="${p.preview}" alt="${esc(p.name)}"><button type="button" data-remove-photo="${i}" aria-label="Hapus foto">×</button></div>`).join('');$$('[data-remove-photo]').forEach(b=>b.onclick=()=>{photos.splice(Number(b.dataset.removePhoto),1);drawPhotos();});}
  }
  function fileToData(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}
  function showModal(title,body,actionLabel='Simpan',onAction=closeModal){
    $('#modal-root').innerHTML=`<div class="modal-backdrop" id="modal-backdrop"><section class="modal-card"><div class="modal-head"><h2 class="font-extrabold">${title}</h2><button id="modal-close" class="text-slate-400 hover:text-slate-700">${icon('x')}</button></div><div class="modal-body">${body}</div><div class="modal-foot"><button id="modal-cancel" class="btn btn-outline">Batal</button><button id="modal-action" class="btn btn-primary">${actionLabel}</button></div></section></div>`;
    $('#modal-close').onclick=closeModal;$('#modal-cancel').onclick=closeModal;$('#modal-backdrop').onclick=e=>{if(e.target.id==='modal-backdrop')closeModal();};
    $('#modal-action').onclick=()=>onAction();refreshIcons();
  }
  function closeModal(){$('#modal-root').innerHTML='';}
  // Cross-tab refresh: if another tab in this same browser changes local data, refresh the view.
  window.addEventListener('storage',e=>{if(Object.values(KEYS).includes(e.key)&&current())render();});
  // Lightweight IndexedDB helper for optional larger binary storage; the app remains functional with LocalStorage.
  window.SiTugasStorage={async putFile(key,file){return new Promise((resolve,reject)=>{if(!('indexedDB'in window)){resolve(null);return;}const req=indexedDB.open('SiTugasFiles',1);req.onupgradeneeded=()=>req.result.createObjectStore('files');req.onsuccess=()=>{const db=req.result,tx=db.transaction('files','readwrite');tx.objectStore('files').put(file,key);tx.oncomplete=()=>resolve(key);tx.onerror=()=>reject(tx.error);};req.onerror=()=>resolve(null);});}};
  render();
})();