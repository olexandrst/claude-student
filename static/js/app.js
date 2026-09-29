/* Клодитет — клієнтська логіка кабінету студента.
 *
 * Сайт статичний (GitHub Pages), тому «бекенд» імітується тут:
 *  - api() повертає Promise із випадковою мережевою затримкою;
 *  - стан користувача (здані завдання, листування, оплати, заявки…)
 *    зберігається в localStorage і переживає перезавантаження сторінки.
 */
(function () {
  "use strict";

  var SEED = window.SEED || {};
  var STATE_KEY = "klod.state.v1";
  var SESSION_KEY = "klod.session";
  var DAY = 86400000;
  var MONTHS_GEN = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
  var WEEKDAYS = ["неділя", "понеділок", "вівторок", "середа", "четвер", "п'ятниця", "субота"];

  /* ------------------------------------------------------------ утиліти */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function fmtDate(ts) { var d = new Date(ts); return d.getDate() + " " + MONTHS_GEN[d.getMonth()]; }
  function fmtDateNum(ts) {
    var d = new Date(ts);
    return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear();
  }
  function fmtTime(ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function fmtMoney(n) { return Math.abs(n).toLocaleString("uk-UA").replace(/,/g, " ") + " грн"; }
  function ago(ts) {
    var m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return "щойно";
    if (m < 60) return m + " хв тому";
    var h = Math.round(m / 60);
    if (h < 24) return h + " год тому";
    var d = Math.round(h / 24);
    if (d === 1) return "вчора";
    return d + " дн. тому";
  }
  function daysWord(n) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return "днів";
    if (b === 1) return "день";
    if (b >= 2 && b <= 4) return "дні";
    return "днів";
  }
  function dueText(ts) {
    var diff = Math.round((startOfDay(ts) - startOfDay(Date.now())) / DAY);
    if (diff < 0) return "прострочено на " + -diff + " " + daysWord(diff);
    if (diff === 0) return "сьогодні";
    if (diff === 1) return "завтра";
    return "через " + diff + " " + daysWord(diff);
  }
  function initials(name) {
    var parts = name.replace(/^(доц\.|проф\.|ст\. викл\.|ас\.)\s*/, "").split(/\s+/);
    return ((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "");
  }
  function param(name) { return new URLSearchParams(location.search).get(name); }
  function uid(prefix) { return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function download(filename, content, mime) {
    var blob = new Blob([content], { type: (mime || "text/plain") + ";charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csv(rows) {
    return "﻿" + rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(";");
    }).join("\r\n");
  }

  /* ------------------------------------------------------- сховище/API */
  function storage(kind) {
    try { var s = window[kind]; var k = "__t"; s.setItem(k, k); s.removeItem(k); return s; } catch (e) { return null; }
  }
  var LS = storage("localStorage");
  var SS = storage("sessionStorage");
  var memory = {};

  function buildInitialState() {
    var base = startOfDay(Date.now()).getTime();
    var now = Date.now();
    var s = {
      base: base,
      assignments: clone(SEED.assignments || []).map(function (a) {
        a.due = base + a.due_in * DAY + (23 * 60 + 59) * 60000;
        a.files = a.status === "submitted" || a.status === "graded" ? [{ name: "zvit_" + a.id + ".pdf", size: 812000 }] : [];
        if (a.status === "in_progress") a.draft = "Чернетка: ER-діаграма готова, залишилось написати SQL-скрипт.";
        return a;
      }),
      threads: clone(SEED.messages || []).map(function (t) {
        t.items.forEach(function (m) { m.ts = now - m.ago_min * 60000; delete m.ago_min; });
        return t;
      }),
      invoices: clone((SEED.finance || {}).invoices || []),
      history: clone((SEED.finance || {}).history || []),
      requests: clone(SEED.documentRequests || []).map(function (r) { r.ts = now - 10 * DAY; return r; }),
      books: clone(SEED.books || []),
      loans: clone(SEED.loans || []).map(function (l) { l.due = base + l.due_in * DAY; return l; }),
      reservations: [],
      waitlist: [],
      electives: { picked: [], confirmed: false },
      notifications: clone(SEED.notifications || []).map(function (n) { n.ts = now - n.ago_min * 60000; return n; }),
      profile: {
        personal_email: SEED.student.personal_email,
        phone: SEED.student.phone,
        address: SEED.student.address,
        prefs: { email: true, grades: true, deadlines: true, schedule: false, news: false }
      }
    };
    return s;
  }

  var state = (function () {
    try {
      var raw = LS ? LS.getItem(STATE_KEY) : memory[STATE_KEY];
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return buildInitialState();
  })();

  function save() {
    var raw = JSON.stringify(state);
    try { if (LS) LS.setItem(STATE_KEY, raw); else memory[STATE_KEY] = raw; } catch (e) {}
  }
  save();

  /* Імітація запиту до сервера: затримка 250–750 мс */
  function api(fn, min, max) {
    var t0 = performance.now();
    var delay = (min || 250) + Math.random() * ((max || 750) - (min || 250));
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try {
          var res = fn ? fn() : null;
          save();
          var el = $("#apiLatency");
          if (el) el.textContent = "API " + Math.round(performance.now() - t0) + " мс";
          resolve(res);
        } catch (e) { reject(e); }
      }, delay);
    });
  }

  function withLoading(btn, promise) {
    if (!btn) return promise;
    btn.classList.add("is-loading");
    btn.disabled = true;
    return promise.finally(function () { btn.classList.remove("is-loading"); btn.disabled = false; });
  }

  /* ---------------------------------------------------------- UI-примітиви */
  function toast(text, kind) {
    var box = $("#toasts");
    if (!box) return;
    var el = document.createElement("div");
    el.className = "toast toast--" + (kind || "ok");
    el.textContent = text;
    box.appendChild(el);
    setTimeout(function () { el.style.opacity = "0"; el.style.transition = "opacity .3s"; }, 3200);
    setTimeout(function () { el.remove(); }, 3600);
  }

  var lastFocus = null;
  function openModal(title, html, onMount) {
    var m = $("#modal");
    lastFocus = document.activeElement;
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = html;
    m.hidden = false;
    document.body.style.overflow = "hidden";
    if (onMount) onMount($("#modalBody"));
    var f = $("#modalBody input, #modalBody select, #modalBody textarea, #modalBody button");
    if (f) f.focus();
  }
  function closeModal() {
    var m = $("#modal");
    if (!m || m.hidden) return;
    m.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function confirmModal(title, text, okLabel) {
    return new Promise(function (resolve) {
      openModal(title,
        '<p class="body-sm muted-alt">' + esc(text) + '</p>' +
        '<div class="modal__actions"><button class="btn btn--ghost" type="button" data-no>Скасувати</button>' +
        '<button class="btn btn--primary" type="button" data-yes>' + esc(okLabel || "Підтвердити") + '</button></div>',
        function (body) {
          $("[data-no]", body).onclick = function () { closeModal(); resolve(false); };
          $("[data-yes]", body).onclick = function () { closeModal(); resolve(true); };
        });
    });
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModal();
      closeDropdowns();
      var a = $("#assistant"); if (a && !a.hidden) a.hidden = true;
    }
  });

  /* ------------------------------------------------------ розклад: логіка */
  var semesterStart = new Date((SEED.university || {}).semester_start || "2026-09-01");
  function mondayOf(d) { var x = startOfDay(d); var wd = (x.getDay() + 6) % 7; return new Date(x.getTime() - wd * DAY); }
  function weekNumber(d) {
    var n = Math.floor((mondayOf(d) - mondayOf(semesterStart)) / (7 * DAY)) + 1;
    return n < 1 ? 1 : n;
  }
  function weekType(d) { return weekNumber(d) % 2 === 1 ? "num" : "den"; }
  function pairByN(n) { return (SEED.pairs || []).filter(function (p) { return p.n === n; })[0]; }
  function toMinutes(hhmm) { var p = hhmm.split(":"); return +p[0] * 60 + +p[1]; }
  function lessonsFor(date) {
    var wd = (date.getDay() + 6) % 7;
    var wt = weekType(date);
    return (SEED.schedule || []).filter(function (e) {
      return e.day === wd && (e.week === "both" || e.week === wt);
    }).sort(function (a, b) { return a.pair - b.pair; });
  }
  function nextLesson() {
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    for (var i = 0; i < 14; i++) {
      var d = new Date(startOfDay(now).getTime() + i * DAY);
      var list = lessonsFor(d);
      for (var j = 0; j < list.length; j++) {
        var p = pairByN(list[j].pair);
        if (i > 0 || toMinutes(p.end) > nowMin) return { date: d, lesson: list[j], pair: p, today: i === 0 };
      }
    }
    return null;
  }
  function courseTitle(id) { return ((SEED.courses || {})[id] || {}).title || id; }
  function courseTeacher(id) { return ((SEED.courses || {})[id] || {}).teacher || ""; }

  /* --------------------------------------------------------- сесія/вхід */
  function isLoggedIn() {
    return !!((SS && SS.getItem(SESSION_KEY)) || (LS && LS.getItem(SESSION_KEY)));
  }
  function logout() {
    try { if (SS) SS.removeItem(SESSION_KEY); if (LS) LS.removeItem(SESSION_KEY); } catch (e) {}
    location.href = "index.html";
  }

  function initLogin() {
    if (isLoggedIn()) { location.replace("dashboard.html"); return; }
    var form = $("#loginForm");
    var err = $("#loginError");
    $("#togglePwd").onclick = function () {
      var p = $("#password");
      p.type = p.type === "password" ? "text" : "password";
      this.setAttribute("aria-label", p.type === "password" ? "Показати пароль" : "Сховати пароль");
    };
    $("#forgotBtn").onclick = function () {
      openModal("Відновлення пароля",
        '<p class="body-sm muted-alt">У справжній системі ми надіслали б посилання на університетську пошту. Це прототип, тому для входу підійде <b>будь-який пароль</b> із логіном <b>demo</b>.</p>' +
        '<div class="modal__actions"><button class="btn btn--primary" type="button" data-close>Зрозуміло</button></div>');
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var login = $("#login").value.trim();
      var pwd = $("#password").value;
      err.hidden = true;
      $$(".input", form).forEach(function (i) { i.classList.remove("is-invalid"); });
      var btn = $("#loginSubmit");
      withLoading(btn, api(function () {
        if (!login || !pwd) throw new Error("empty");
        if (login.toLowerCase() !== "demo") throw new Error("login");
        return { token: uid("tok"), user: "demo" };
      }, 600, 1000)).then(function (res) {
        var store = $("#remember").checked ? LS : SS;
        try { (store || SS || LS).setItem(SESSION_KEY, JSON.stringify(res)); } catch (e2) {}
        var next = param("next");
        location.href = next && /^[a-z0-9-]+\.html$/.test(next) ? next : "dashboard.html";
      }).catch(function (e2) {
        err.hidden = false;
        if (e2.message === "empty") {
          err.textContent = "Введіть логін і пароль.";
          if (!login) $("#login").classList.add("is-invalid");
          if (!pwd) $("#password").classList.add("is-invalid");
        } else {
          err.textContent = "Користувача «" + login + "» не знайдено. Для демо використайте логін demo.";
          $("#login").classList.add("is-invalid");
        }
        form.classList.remove("shake"); void form.offsetWidth; form.classList.add("shake");
      });
    });
  }

  /* -------------------------------------------------- шапка, сповіщення */
  function closeDropdowns() {
    $$(".dropdown__panel").forEach(function (p) { p.hidden = true; });
    $$("#notifBtn, #userBtn").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
  }
  function bindDropdown(btnSel, panelSel, onOpen) {
    var btn = $(btnSel), panel = $(panelSel);
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = panel.hidden;
      closeDropdowns();
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (open && onOpen) onOpen();
    });
    panel.addEventListener("click", function (e) { e.stopPropagation(); });
  }
  document.addEventListener("click", closeDropdowns);

  function notify(text, link) {
    state.notifications.unshift({ id: uid("n"), text: text, ts: Date.now(), read: false, link: link || "" });
    save();
    renderNotifications();
  }
  function renderNotifications() {
    var list = $("#notifList");
    if (!list) return;
    var unread = state.notifications.filter(function (n) { return !n.read; }).length;
    $("#notifDot").hidden = unread === 0;
    $("#notifBtn").setAttribute("aria-label", "Сповіщення" + (unread ? ", непрочитаних: " + unread : ""));
    list.innerHTML = state.notifications.slice(0, 12).map(function (n) {
      return '<li><a class="notif__item' + (n.read ? "" : " is-unread") + '" href="' + esc(n.link || "#") + '" data-id="' + n.id + '">' +
        '<span class="bullet"></span><span>' + esc(n.text) + '<span class="notif__time">' + ago(n.ts) + '</span></span></a></li>';
    }).join("") || '<li class="body-sm muted empty-line">Сповіщень немає</li>';
  }
  function renderCounters() {
    var unreadThreads = state.threads.filter(function (t) { return t.unread; }).length;
    var active = state.assignments.filter(function (a) { return a.status === "new" || a.status === "in_progress"; }).length;
    $$('[data-count="messages"]').forEach(function (el) { el.textContent = unreadThreads; el.hidden = !unreadThreads; });
    $$('[data-count="assignments"]').forEach(function (el) { el.textContent = active; el.hidden = !active; });
  }

  function initShell() {
    bindDropdown("#notifBtn", "#notifPanel");
    bindDropdown("#userBtn", "#userPanel");
    $$('[data-action="logout"]').forEach(function (b) { b.onclick = logout; });
    var readAll = $("#notifReadAll");
    if (readAll) readAll.onclick = function () {
      state.notifications.forEach(function (n) { n.read = true; });
      save(); renderNotifications();
    };
    var nl = $("#notifList");
    if (nl) nl.addEventListener("click", function (e) {
      var a = e.target.closest("[data-id]");
      if (!a) return;
      var n = state.notifications.filter(function (x) { return x.id === a.dataset.id; })[0];
      if (n) { n.read = true; save(); }
    });
    var toggle = $(".nav-toggle");
    if (toggle) toggle.onclick = function () {
      var nav = $("#mainnav");
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    };
    renderNotifications();
    renderCounters();
    initAssistant();
    processBackgroundJobs();
    setInterval(processBackgroundJobs, 5000);
  }

  /* Фонові «серверні» процеси: перевірка робіт викладачем, обробка довідок */
  function processBackgroundJobs() {
    var changed = false;
    state.assignments.forEach(function (a) {
      if (a.status === "submitted" && a.autoGradeAt && Date.now() > a.autoGradeAt) {
        a.status = "graded";
        a.grade = Math.max(Math.round(a.max * (0.75 + Math.random() * 0.25)), 1);
        a.feedback = ["Гарна робота, зауважень немає.", "Добре. Зверніть увагу на оформлення висновків.", "Чудово! Акуратний код і повні відповіді на питання."][Math.floor(Math.random() * 3)];
        delete a.autoGradeAt;
        notify("Оцінено: " + a.title + " — " + a.grade + "/" + a.max, "assignments.html");
        changed = true;
      }
    });
    state.requests.forEach(function (r) {
      if (r.status === "submitted" && r.ts && Date.now() - r.ts > 15000) { r.status = "processing"; changed = true; }
      if (r.status === "processing" && r.ts && Date.now() - r.ts > 40000) {
        r.status = "ready";
        var t = docType(r.type);
        notify((t ? t.title : "Довідка") + (r.delivery === "Електронна з КЕП" ? " готова до завантаження" : " готова, заберіть у деканаті (ауд. 104)"), "documents.html");
        changed = true;
      }
    });
    if (changed) {
      save();
      renderCounters();
      if (pageRefresh) pageRefresh();
    }
  }
  var pageRefresh = null;

  /* ------------------------------------------------------------ асистент */
  function assistantAnswer(q) {
    q = q.toLowerCase();
    if (/пар|розклад|заняття|лекці/.test(q)) {
      var n = nextLesson();
      if (!n) return "Найближчим часом занять не знайдено.";
      var when = n.today ? "сьогодні" : WEEKDAYS[n.date.getDay()] + ", " + fmtDate(n.date);
      return "Наступна пара — " + courseTitle(n.lesson.course) + " (" + n.lesson.kind.toLowerCase() + "), " + when + " о " + n.pair.start +
        (n.lesson.room === "Онлайн" ? ", онлайн." : ", ауд. " + n.lesson.room + ".") + " Викладач: " + courseTeacher(n.lesson.course).replace(/\.$/, "") + ".";
    }
    if (/дедлайн|завдан|здати|лаб/.test(q)) {
      var up = state.assignments.filter(function (a) { return a.status === "new" || a.status === "in_progress"; })
        .sort(function (a, b) { return a.due - b.due; }).slice(0, 3);
      if (!up.length) return "Усі завдання здано. Можна трохи видихнути.";
      return "Найближчі дедлайни: " + up.map(function (a) { return "«" + a.title + "» — " + dueText(a.due); }).join("; ") + ".";
    }
    if (/бал|оцін|рейтинг|gpa|успіш/.test(q)) {
      var g = SEED.grades;
      return "Ваш середній бал за 4 семестри — " + g.average + " (GPA " + (g.average / 20).toFixed(2) + "). Ви на " + SEED.student.rating_place +
        "-му місці в рейтингу групи з " + SEED.student.group_size + ". Здобуто " + g.ects_earned + " кредитів ECTS із " + g.ects_total + ".";
    }
    if (/стипенд|гроші|оплат|рахун|фінанс/.test(q)) {
      var due = state.invoices.filter(function (i) { return i.status === "unpaid"; }).reduce(function (s, i) { return s + i.amount; }, 0);
      return "Академічна стипендія — " + fmtMoney(SEED.finance.scholarship.amount) + " на місяць, наступна виплата 25 числа. До сплати зараз: " + fmtMoney(due) + ". Деталі — у розділі «Фінанси».";
    }
    if (/довідк|тцк|документ/.test(q)) return "Довідку можна замовити в розділі «Довідки». Електронна з КЕП зазвичай готова за 1–2 робочі дні.";
    if (/книг|бібліот/.test(q)) {
      return "На руках " + state.loans.length + " книги. Найближчий термін повернення — " +
        fmtDate(Math.min.apply(null, state.loans.map(function (l) { return l.due; }))) + ". Продовжити можна в розділі «Бібліотека».";
    }
    if (/сесі|екзамен/.test(q)) return SEED.university.session + ". Допуск — за умови, що накопичено щонайменше 36 балів з дисципліни.";
    if (/привіт|добр|вітаю/.test(q)) return "Вітаю, " + SEED.student.first_name_vocative + "! Питайте про розклад, дедлайни, оцінки, стипендію чи довідки.";
    return "Я поки що знаю лише про розклад, дедлайни, оцінки, фінанси, довідки й бібліотеку. Спробуйте запитати про щось із цього.";
  }
  function initAssistant() {
    var btn = $("#assistantBtn"), panel = $("#assistant");
    if (!btn) return;
    var log = $("#assistantLog");
    function push(text, me) {
      var b = document.createElement("div");
      b.className = "bubble" + (me ? " bubble--me" : "");
      b.textContent = text;
      log.appendChild(b);
      log.scrollTop = log.scrollHeight;
    }
    function ask(q) {
      if (!q.trim()) return;
      push(q, true);
      var t = document.createElement("div");
      t.className = "typing"; t.innerHTML = "<span></span><span></span><span></span>";
      log.appendChild(t); log.scrollTop = log.scrollHeight;
      api(function () { return assistantAnswer(q); }, 600, 1200).then(function (a) { t.remove(); push(a); });
    }
    btn.onclick = function () {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) {
        if (!log.children.length) push("Вітаю, " + SEED.student.first_name_vocative + "! Я Клод-асистент. Чим допомогти?");
        $("#assistantInput").focus();
      }
    };
    $("#assistantClose").onclick = function () { panel.hidden = true; btn.focus(); };
    $("#assistantChips").addEventListener("click", function (e) {
      var c = e.target.closest(".chip");
      if (c) ask(c.textContent);
    });
    $("#assistantForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var i = $("#assistantInput");
      ask(i.value); i.value = "";
    });
  }

  /* ---------------------------------------------------------- головна */
  function lessonRow(l, date) {
    var p = pairByN(l.pair);
    var now = new Date();
    var isToday = startOfDay(date).getTime() === startOfDay(now).getTime();
    var nm = now.getHours() * 60 + now.getMinutes();
    var cls = "";
    if (isToday && nm >= toMinutes(p.start) && nm <= toMinutes(p.end)) cls = " is-now";
    else if (isToday && nm > toMinutes(p.end)) cls = " is-past";
    return '<div class="lesson-row' + cls + '"><div class="lesson-row__time">' + p.start + '<span>' + p.end + '</span></div>' +
      '<div class="lesson-row__main"><span class="title-item">' + esc(courseTitle(l.course)) + '</span>' +
      '<span class="body-sm muted-alt">' + esc(l.kind) + ' · ' + (l.room === "Онлайн" ? "онлайн" : "ауд. " + esc(l.room)) + ' · ' + esc(courseTeacher(l.course)) + '</span>' +
      (cls === " is-now" ? '<span class="tag tag--tint">Зараз</span>' : "") + '</div></div>';
  }
  function initDashboard() {
    var now = new Date();
    var wt = weekType(now) === "num" ? "чисельник" : "знаменник";
    var wd = WEEKDAYS[now.getDay()];
    $("#todayLine").textContent = wd.charAt(0).toUpperCase() + wd.slice(1) + ", " + fmtDate(now) + " · " + weekNumber(now) + "-й тиждень семестру · " + wt;

    function render() {
      var today = lessonsFor(now);
      var box = $("#todayList");
      if (today.length) {
        box.innerHTML = today.map(function (l) { return lessonRow(l, now); }).join("");
      } else {
        var n = nextLesson();
        $("#todayTitle").textContent = "Сьогодні пар немає";
        box.innerHTML = '<p class="body-sm muted-alt">Відпочивайте. Наступне заняття — ' + (n ? WEEKDAYS[n.date.getDay()] + ", " + fmtDate(n.date) + ":" : "не заплановано.") + '</p>' +
          (n ? lessonRow(n.lesson, n.date) : "");
      }
      var active = state.assignments.filter(function (a) { return a.status === "new" || a.status === "in_progress"; })
        .sort(function (a, b) { return a.due - b.due; });
      $("#activeCount").textContent = active.length;
      $("#deadlineList").innerHTML = active.slice(0, 4).map(function (a) {
        var span = 14 * DAY;
        var pct = Math.max(4, Math.min(100, 100 - ((a.due - Date.now()) / span) * 100));
        return '<a class="list__item" style="text-decoration:none;color:inherit" href="assignments.html#' + a.id + '">' +
          '<span class="title-item">' + esc(a.title) + '</span>' +
          '<span class="body-sm muted-alt">' + esc(courseTitle(a.course)) + ' · ' + fmtDate(a.due) + ' (' + dueText(a.due) + ')</span>' +
          '<div class="meter"><span style="width:' + pct.toFixed(0) + '%"></span></div></a>';
      }).join("") || '<p class="body-sm muted-alt">Активних завдань немає.</p>';
    }
    api(null, 300, 600).then(render);
    pageRefresh = render;
  }

  /* ------------------------------------------------------------ розклад */
  function initSchedule() {
    var now = new Date();
    var current = weekType(now);
    var shown = current;
    var todayIdx = (now.getDay() + 6) % 7;
    $("#weekLine").textContent = SEED.university.semester + " · група " + SEED.student.group + " · зараз " + weekNumber(now) + "-й тиждень (" + (current === "num" ? "чисельник" : "знаменник") + ")";
    if (todayIdx < 5) $$('[data-day="' + todayIdx + '"]').forEach(function (el) { el.classList.add("is-today"); });

    function apply() {
      $$(".segmented__btn[data-week]").forEach(function (b) {
        var on = b.dataset.week === shown;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      $$(".lesson").forEach(function (l) {
        var w = l.dataset.week;
        l.classList.toggle("is-off", w !== "both" && w !== shown);
      });
      var nm = now.getHours() * 60 + now.getMinutes();
      $$(".lesson.is-now").forEach(function (l) { l.classList.remove("is-now"); });
      if (shown === current && todayIdx < 5) {
        (SEED.pairs || []).forEach(function (p) {
          if (nm >= toMinutes(p.start) && nm <= toMinutes(p.end)) {
            $$('.schedule__cell[data-day="' + todayIdx + '"][data-pair="' + p.n + '"] .lesson:not(.is-off)').forEach(function (l) { l.classList.add("is-now"); });
          }
        });
      }
    }
    var selDay = null;
    function renderDay() {
      var grid = $("#scheduleGrid"), box = $("#dayDetail");
      $$(".schedule__day, .schedule__cell").forEach(function (el) {
        var on = selDay !== null && +el.dataset.day === selDay;
        if (el.classList.contains("schedule__day")) {
          el.classList.toggle("is-selected", on);
          el.setAttribute("aria-pressed", String(on));
        }
      });
      if (selDay === null) { box.hidden = true; return; }
      var list = (SEED.schedule || []).filter(function (e) {
        return e.day === selDay && (e.week === "both" || e.week === shown);
      }).sort(function (a, b) { return a.pair - b.pair; });
      var days = ["Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця"];
      $("#dayTitle").textContent = days[selDay] + " · " + (shown === "num" ? "чисельник" : "знаменник") + " · пар: " + list.length;
      $("#dayList").innerHTML = list.map(function (l) {
        var p = pairByN(l.pair);
        return '<div class="lesson-row"><div class="lesson-row__time">' + p.start + '<span>' + p.end + '</span></div>' +
          '<div class="lesson-row__main"><span class="title-item">' + esc(courseTitle(l.course)) + '</span>' +
          '<span class="body-sm muted-alt">' + esc(l.kind) + ' · ' + (l.room === "Онлайн" ? "онлайн" : "ауд. " + esc(l.room)) + ' · ' + esc(courseTeacher(l.course)) + '</span></div></div>';
      }).join("") || '<p class="body-sm muted-alt">У цей день пар немає. Можна відпочити.</p>';
      box.hidden = false;
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    $$("button.schedule__day").forEach(function (b) {
      b.onclick = function () {
        var d = +b.dataset.day;
        selDay = selDay === d ? null : d;
        renderDay();
      };
    });
    $("#dayClose").onclick = function () { selDay = null; renderDay(); };
    $$(".segmented__btn[data-week]").forEach(function (b) { b.onclick = function () { shown = b.dataset.week; apply(); if (selDay !== null) renderDay(); }; });
    apply();

    $("#icsBtn").onclick = function () {
      var start = mondayOf(semesterStart);
      var until = (SEED.university.semester_end || "2026-12-25").replace(/-/g, "") + "T235959Z";
      var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Klodytet//Student Cabinet//UK", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Клодитет · " + SEED.student.group];
      (SEED.schedule || []).forEach(function (e, i) {
        var p = pairByN(e.pair);
        var d = new Date(start.getTime() + e.day * DAY + (e.week === "den" ? 7 * DAY : 0));
        var ymd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
        lines.push("BEGIN:VEVENT",
          "UID:klod-" + i + "@klodytet.edu.ua",
          "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z",
          "DTSTART;TZID=Europe/Kyiv:" + ymd + "T" + p.start.replace(":", "") + "00",
          "DTEND;TZID=Europe/Kyiv:" + ymd + "T" + p.end.replace(":", "") + "00",
          "RRULE:FREQ=WEEKLY;INTERVAL=" + (e.week === "both" ? 1 : 2) + ";UNTIL=" + until,
          "SUMMARY:" + courseTitle(e.course) + " (" + e.kind + ")",
          "LOCATION:" + (e.room === "Онлайн" ? "Онлайн" : "Ауд. " + e.room),
          "DESCRIPTION:" + courseTeacher(e.course),
          "END:VEVENT");
      });
      lines.push("END:VCALENDAR");
      download("klodytet-rozklad-" + SEED.student.group + ".ics", lines.join("\r\n"), "text/calendar");
      toast("Розклад експортовано. Імпортуйте файл у Google Calendar або Outlook");
    };
  }

  /* ------------------------------------------------------------- оцінки */
  function letterOf(s) { return s >= 90 ? "A" : s >= 82 ? "B" : s >= 74 ? "C" : s >= 64 ? "D" : s >= 60 ? "E" : "FX"; }
  function initGrades() {
    $$(".tabs [data-tab]").forEach(function (t) {
      t.onclick = function () {
        $$(".tabs [data-tab]").forEach(function (x) { x.classList.toggle("is-active", x === t); x.setAttribute("aria-selected", String(x === t)); });
        $$(".tab-panel").forEach(function (p) { p.hidden = p.dataset.panel !== t.dataset.tab; });
      };
    });
    function recalc() {
      var sum = 0, ects = 0, risky = 0;
      $$("#forecastBody tr").forEach(function (tr) {
        var inp = $("[data-final]", tr);
        var max = +inp.max;
        var v = Math.max(0, Math.min(max, +inp.value || 0));
        var total = +$("[data-have]", tr).textContent + v;
        var L = letterOf(total);
        $("[data-total]", tr).textContent = total;
        var badge = $("[data-letter]", tr);
        badge.textContent = L;
        badge.className = "grade grade--" + L.toLowerCase();
        inp.classList.toggle("is-invalid", +inp.value > max || +inp.value < 0);
        sum += total * +tr.dataset.ects; ects += +tr.dataset.ects;
        if (total < 60) risky++;
      });
      var avg = sum / ects;
      $("#forecastAvg").textContent = avg.toFixed(1);
      $("#forecastNote").textContent = risky ? "Увага: " + risky + " дисц. нижче 60 балів — ризик перескладання" :
        avg >= 90 ? "Претендуєте на підвищену академічну стипендію" : avg >= 75 ? "Стипендію буде збережено" : "Ризик втратити стипендію";
    }
    $$("[data-final]").forEach(function (i) { i.addEventListener("input", recalc); });
    recalc();
    $("#csvBtn").onclick = function () {
      var rows = [["Семестр", "Дисципліна", "ECTS", "Контроль", "Бал", "Національна шкала", "Оцінка ECTS"]];
      SEED.grades.semesters.forEach(function (s) {
        s.rows.forEach(function (r) { rows.push([s.title, r.title, r.ects, r.control, r.score, r.national, r.letter]); });
      });
      download("zalikova-" + SEED.student.last_name + ".csv", csv(rows), "text/csv");
      toast("Залікову книжку завантажено");
    };
  }

  /* --------------------------------------------------------- дисципліни */
  function initCourses() {
    var h = location.hash.slice(1);
    if (h) { var d = document.getElementById(h); if (d && d.tagName === "DETAILS") { d.open = true; d.scrollIntoView({ block: "start" }); } }
    $$("[data-download]").forEach(function (b) {
      b.onclick = function () {
        var name = b.dataset.download;
        withLoading(b, api(null, 400, 900)).then(function () {
          download(name.replace(/[^\wа-яіїєґ'\- ]+/gi, "").trim().replace(/\s+/g, "_") + ".txt",
            "Клодитет · " + b.dataset.course + "\n\n" + name + " (" + b.dataset.kind + ")\n\nЦе демо-файл прототипу кабінету студента. У робочій системі тут був би справжній навчальний матеріал.\n");
          toast("Завантажено: " + name);
        });
      };
    });

    var MAX = 2;
    var boxes = $$(".elective__check");
    var electives = SEED.electives || [];
    function seatsLeft(id) {
      var e = electives.filter(function (x) { return x.id === id; })[0];
      return e.seats - e.taken - (state.electives.picked.indexOf(id) >= 0 ? 1 : 0);
    }
    function render() {
      var picked = state.electives.picked;
      boxes.forEach(function (b) {
        var card = b.closest(".elective");
        b.checked = picked.indexOf(b.value) >= 0;
        var left = seatsLeft(b.value);
        $("[data-seats]", card).textContent = left;
        b.disabled = state.electives.confirmed || (!b.checked && (picked.length >= MAX || left <= 0));
      });
      var btn = $("#electiveSave");
      if (state.electives.confirmed) {
        $("#electiveStatus").innerHTML = "<b>Вибір підтверджено:</b> " + picked.map(function (id) {
          return esc(electives.filter(function (x) { return x.id === id; })[0].title);
        }).join(", ");
        btn.textContent = "Змінити вибір";
        btn.disabled = false;
        btn.className = "btn btn--ghost";
      } else {
        $("#electiveStatus").textContent = "Обрано " + picked.length + " з " + MAX + (picked.length < MAX ? " — оберіть ще " + (MAX - picked.length) : " — можна підтверджувати");
        btn.textContent = "Підтвердити вибір";
        btn.disabled = picked.length !== MAX;
        btn.className = "btn btn--primary";
      }
    }
    boxes.forEach(function (b) {
      b.addEventListener("change", function () {
        var p = state.electives.picked;
        if (b.checked && p.indexOf(b.value) < 0) p.push(b.value);
        if (!b.checked) state.electives.picked = p.filter(function (x) { return x !== b.value; });
        save(); render();
      });
    });
    $("#electiveSave").onclick = function () {
      var btn = this;
      if (state.electives.confirmed) {
        confirmModal("Змінити вибір?", "Підтвердження буде скасовано, а місця звільнено. Ви зможете обрати дисципліни знову до 15 жовтня.", "Змінити").then(function (ok) {
          if (!ok) return;
          api(function () { state.electives.confirmed = false; }).then(render);
        });
        return;
      }
      withLoading(btn, api(function () { state.electives.confirmed = true; }, 700, 1200)).then(function () {
        render();
        toast("Вибір дисциплін зафіксовано в деканаті");
        notify("Вибіркові дисципліни на весняний семестр підтверджено", "courses.html#electives");
      });
    };
    render();
  }

  /* ---------------------------------------------------------- завдання */
  var STATUS = {
    "new": ["Нове", "tag"],
    "in_progress": ["Чернетка", "tag"],
    "submitted": ["На перевірці", "tag tag--dark"],
    "graded": ["Оцінено", "tag tag--tint"]
  };
  function initAssignments() {
    var filter = "active";
    var course = param("course") || "";
    var sel = $("#courseFilter");
    Object.keys(SEED.courses).forEach(function (id) {
      if (id === "curator") return;
      var o = document.createElement("option");
      o.value = id; o.textContent = SEED.courses[id].title;
      sel.appendChild(o);
    });
    sel.value = course;
    sel.onchange = function () { course = sel.value; render(); };
    $$("#statusTabs [data-status]").forEach(function (t) {
      t.onclick = function () {
        filter = t.dataset.status;
        $$("#statusTabs [data-status]").forEach(function (x) { x.classList.toggle("is-active", x === t); x.setAttribute("aria-selected", String(x === t)); });
        render();
      };
    });
    var hashId = location.hash.slice(1);

    function render() {
      var list = state.assignments.filter(function (a) {
        if (course && a.course !== course) return false;
        if (filter === "active") return a.status === "new" || a.status === "in_progress";
        if (filter === "all") return true;
        return a.status === filter;
      }).sort(function (a, b) { return filter === "graded" ? b.due - a.due : a.due - b.due; });
      $("#assignmentList").innerHTML = list.map(function (a) {
        var st = STATUS[a.status];
        var soon = (a.status === "new" || a.status === "in_progress") && a.due - Date.now() < 3 * DAY;
        var side = "";
        if (a.status === "graded") side = '<span class="stat-number">' + a.grade + '<small class="muted" style="font-size:16px">/' + a.max + '</small></span>';
        else side = '<span class="task__due' + (soon ? " is-soon" : "") + '">' + (a.status === "submitted" ? "здано" : "до " + fmtDate(a.due) + " · " + dueText(a.due)) + '</span>';
        var actions = "";
        if (a.status === "new" || a.status === "in_progress") actions = '<button class="btn btn--primary btn--sm" type="button" data-submit="' + a.id + '">Здати роботу</button>';
        if (a.status === "submitted") actions = '<button class="btn btn--ghost btn--sm" type="button" data-recall="' + a.id + '">Відкликати</button>';
        return '<article class="card task" id="' + a.id + '"' + (a.id === hashId ? ' style="box-shadow:var(--shadow-featured)"' : "") + '>' +
          '<span class="tile ' + (a.status === "graded" ? "tile--tint" : a.status === "submitted" ? "tile--neutral" : "tile--brand") + '">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 11 3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg></span>' +
          '<div class="task__body">' +
          '<div class="task__meta"><span class="' + st[1] + '">' + st[0] + '</span><span class="tag">' + esc(a.kind) + '</span><span class="body-sm muted">' + esc(courseTitle(a.course)) + ' · макс. ' + a.max + ' б.</span></div>' +
          '<h2 class="title-card">' + esc(a.title) + '</h2>' +
          '<p class="body-sm muted-alt">' + esc(a.text) + '</p>' +
          (a.draft && a.status === "in_progress" ? '<p class="body-sm muted"><i>' + esc(a.draft) + '</i></p>' : "") +
          (a.files && a.files.length && a.status !== "new" && a.status !== "in_progress" ? '<p class="body-sm muted">Файли: ' + a.files.map(function (f) { return esc(f.name); }).join(", ") + (a.submittedAt ? " · " + fmtDateNum(a.submittedAt) + " " + fmtTime(a.submittedAt) : "") + '</p>' : "") +
          (a.feedback ? '<div class="task__feedback"><b>Відгук викладача:</b> ' + esc(a.feedback) + '</div>' : "") +
          '</div><div class="task__side">' + side + actions + '</div></article>';
      }).join("") || '<div class="card empty-line body-sm muted-alt">У цьому фільтрі завдань немає.</div>';
      renderCounters();
    }
    pageRefresh = render;

    $("#assignmentList").addEventListener("click", function (e) {
      var s = e.target.closest("[data-submit]");
      var r = e.target.closest("[data-recall]");
      if (s) openSubmit(s.dataset.submit);
      if (r) {
        var a = byId(state.assignments, r.dataset.recall);
        confirmModal("Відкликати роботу?", "Робота «" + a.title + "» повернеться в чернетки. Здати її знову можна до дедлайну.", "Відкликати").then(function (ok) {
          if (!ok) return;
          api(function () { a.status = "in_progress"; delete a.autoGradeAt; delete a.submittedAt; }).then(function () { render(); toast("Роботу відкликано"); });
        });
      }
    });

    function openSubmit(id) {
      var a = byId(state.assignments, id);
      var files = [];
      openModal("Здати роботу",
        '<p class="body-sm muted-alt"><b>' + esc(a.title) + '</b><br>' + esc(courseTitle(a.course)) + ' · дедлайн ' + fmtDate(a.due) + '</p>' +
        '<label class="dropzone" id="dz"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>' +
        '<span class="title-item">Перетягніть файли або натисніть, щоб обрати</span><span class="body-sm muted">PDF, DOCX, ZIP, IPYNB · до 50 МБ · файли не залишають ваш браузер</span>' +
        '<input type="file" id="fileInput" multiple></label>' +
        '<ul class="upload-list" id="uploadList"></ul>' +
        '<div class="field"><label for="subComment">Коментар для викладача</label><textarea class="input" id="subComment" placeholder="Посилання на репозиторій, примітки…">' + esc(a.draft && a.draft.indexOf("Чернетка") !== 0 ? a.draft : "") + '</textarea></div>' +
        '<label class="check"><input type="checkbox" id="honest"> Підтверджую, що роботу виконано самостійно (Кодекс академічної доброчесності)</label>' +
        '<p class="form-error" id="subErr" hidden></p>' +
        '<div class="modal__actions"><button class="btn btn--ghost" type="button" id="saveDraft">Зберегти чернетку</button><button class="btn btn--primary" type="button" id="doSubmit">Надіслати на перевірку</button></div>',
        function (body) {
          var input = $("#fileInput", body), dz = $("#dz", body);
          function addFiles(fl) {
            Array.prototype.forEach.call(fl, function (f) {
              var item = { name: f.name, size: f.size, progress: 0 };
              files.push(item);
              var li = document.createElement("li");
              li.innerHTML = '<span>' + esc(f.name) + ' <span class="muted">(' + Math.max(1, Math.round(f.size / 1024)) + ' КБ)</span></span><div class="meter"><span style="width:0"></span></div>';
              $("#uploadList", body).appendChild(li);
              var bar = $(".meter span", li);
              var t = setInterval(function () {
                item.progress = Math.min(100, item.progress + 8 + Math.random() * 25);
                bar.style.width = item.progress + "%";
                if (item.progress >= 100) { clearInterval(t); li.firstChild.insertAdjacentHTML("beforeend", ' <b class="accent">✓ завантажено</b>'); }
              }, 180);
            });
          }
          input.onchange = function () { addFiles(input.files); input.value = ""; };
          ["dragenter", "dragover"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("is-over"); }); });
          ["dragleave", "drop"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("is-over"); }); });
          dz.addEventListener("drop", function (e) { if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
          $("#saveDraft", body).onclick = function () {
            var c = $("#subComment", body).value.trim();
            withLoading(this, api(function () { a.status = "in_progress"; a.draft = c || "Чернетку збережено " + fmtDateNum(Date.now()); })).then(function () {
              closeModal(); render(); toast("Чернетку збережено");
            });
          };
          $("#doSubmit", body).onclick = function () {
            var err = $("#subErr", body);
            var comment = $("#subComment", body).value.trim();
            err.hidden = true;
            if (!files.length && !/https?:\/\//.test(comment)) { err.hidden = false; err.textContent = "Додайте хоча б один файл або посилання на репозиторій у коментарі."; return; }
            if (files.some(function (f) { return f.progress < 100; })) { err.hidden = false; err.textContent = "Зачекайте, файли ще завантажуються."; return; }
            if (!$("#honest", body).checked) { err.hidden = false; err.textContent = "Підтвердьте самостійність виконання роботи."; return; }
            withLoading(this, api(function () {
              a.status = "submitted";
              a.files = files.length ? files.map(function (f) { return { name: f.name, size: f.size }; }) : [{ name: "посилання у коментарі", size: 0 }];
              a.comment = comment;
              a.submittedAt = Date.now();
              a.autoGradeAt = Date.now() + 45000;
              delete a.draft;
            }, 800, 1400)).then(function () {
              closeModal(); render();
              toast("Роботу надіслано. Викладач отримав сповіщення");
              notify("Роботу «" + a.title + "» здано на перевірку", "assignments.html");
            });
          };
        });
    }
    render();
  }
  function byId(arr, id) { return arr.filter(function (x) { return x.id === id; })[0]; }

  /* ------------------------------------------------------ повідомлення */
  var AUTO_REPLIES = [
    "Дякую, отримала ваше повідомлення. Відповім детальніше після пари.",
    "Добрий день! Так, це можливо. Уточнимо деталі на наступному занятті.",
    "Дякую за питання. Матеріали вже додано в розділ дисципліни.",
    "Прийнято. Якщо будуть ще питання — пишіть.",
  ];
  function initMessages() {
    var activeId = null;
    var q = "";
    function lastOf(t) { return t.items[t.items.length - 1]; }
    function renderThreads() {
      var list = state.threads.slice().sort(function (a, b) { return lastOf(b).ts - lastOf(a).ts; })
        .filter(function (t) { return !q || (t.with + " " + t.role + " " + t.items.map(function (m) { return m.text; }).join(" ")).toLowerCase().indexOf(q) >= 0; });
      $("#threadList").innerHTML = list.map(function (t) {
        var l = lastOf(t);
        return '<li><button type="button" class="thread' + (t.id === activeId ? " is-active" : "") + (t.unread ? " is-unread" : "") + '" data-thread="' + t.id + '">' +
          '<span class="thread__avatar">' + esc(initials(t.with)) + '</span><span class="thread__main">' +
          '<span class="thread__name"><span>' + esc(t.with) + '</span><time>' + ago(l.ts) + '</time></span>' +
          '<span class="thread__preview">' + (l.from === "me" ? "Ви: " : "") + esc(l.text) + '</span></span></button></li>';
      }).join("") || '<li class="body-sm muted empty-line">Нічого не знайдено</li>';
      renderCounters();
    }
    function renderChat() {
      var t = byId(state.threads, activeId);
      if (!t) return;
      $("#chat").innerHTML =
        '<div class="chat__head"><span class="thread__avatar">' + esc(initials(t.with)) + '</span><div><div class="title-item">' + esc(t.with) + '</div><div class="body-sm muted">' + esc(t.role) + '</div></div></div>' +
        '<div class="chat__log" id="chatLog">' + t.items.map(function (m) {
          return '<div class="bubble' + (m.from === "me" ? " bubble--me" : "") + '">' + esc(m.text) + '<time>' + fmtDateNum(m.ts) + " " + fmtTime(m.ts) + '</time></div>';
        }).join("") + '</div>' +
        '<form class="chat__form" id="chatForm"><label class="sr-only" for="chatInput">Повідомлення</label><input class="input" id="chatInput" autocomplete="off" placeholder="Напишіть повідомлення…">' +
        '<button class="btn btn--primary btn--icon" type="submit" aria-label="Надіслати"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 3 10 14"/><path d="m21 3-7 18-4-7-7-4z"/></svg></button></form>';
      var log = $("#chatLog"); log.scrollTop = log.scrollHeight;
      $("#chatForm").addEventListener("submit", function (e) {
        e.preventDefault();
        var inp = $("#chatInput");
        var text = inp.value.trim();
        if (!text) return;
        inp.value = "";
        send(t, text);
      });
    }
    function send(t, text) {
      api(function () { t.items.push({ from: "me", text: text, ts: Date.now() }); }, 150, 350).then(function () {
        if (activeId === t.id) renderChat();
        renderThreads();
        setTimeout(function () {
          var log = $("#chatLog");
          if (activeId === t.id && log) {
            var ty = document.createElement("div"); ty.className = "typing"; ty.innerHTML = "<span></span><span></span><span></span>";
            log.appendChild(ty); log.scrollTop = log.scrollHeight;
          }
        }, 900);
        setTimeout(function () {
          var reply = /деканат/i.test(t.with) ? "Ваше звернення зареєстровано за № " + (1000 + Math.floor(Math.random() * 9000)) + ". Відповідь надійде протягом 1 робочого дня." :
            /бібліот/i.test(t.with) ? "Дякуємо! Бібліотекар опрацює запит найближчим часом." :
              AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
          t.items.push({ from: "them", text: reply, ts: Date.now() });
          if (activeId !== t.id) { t.unread = true; notify("Нове повідомлення: " + t.with, "messages.html"); }
          save();
          if (activeId === t.id) renderChat();
          renderThreads();
        }, 3200);
      });
    }
    function open(id) {
      activeId = id;
      var t = byId(state.threads, id);
      if (t.unread) { t.unread = false; save(); }
      renderThreads(); renderChat();
      if (window.innerWidth < 760) $("#chat").scrollIntoView({ behavior: "smooth" });
    }
    $("#threadList").addEventListener("click", function (e) {
      var b = e.target.closest("[data-thread]");
      if (b) open(b.dataset.thread);
    });
    $("#threadSearch").addEventListener("input", function () { q = this.value.trim().toLowerCase(); renderThreads(); });

    function compose(to) {
      openModal("Нове повідомлення",
        '<div class="field"><label for="toSel">Кому</label><select class="input" id="toSel">' +
        SEED.recipients.map(function (r) { return '<option' + (r === to ? " selected" : "") + '>' + esc(r) + '</option>'; }).join("") + '</select></div>' +
        '<div class="field"><label for="msgText">Повідомлення</label><textarea class="input" id="msgText" rows="5" placeholder="Добрий день! …"></textarea></div>' +
        '<p class="form-error" id="msgErr" hidden>Напишіть текст повідомлення.</p>' +
        '<div class="modal__actions"><button class="btn btn--ghost" type="button" data-close>Скасувати</button><button class="btn btn--primary" type="button" id="msgSend">Надіслати</button></div>',
        function (body) {
          $("#msgText", body).focus();
          $("#msgSend", body).onclick = function () {
            var text = $("#msgText", body).value.trim();
            var who = $("#toSel", body).value;
            if (!text) { $("#msgErr", body).hidden = false; return; }
            var t = state.threads.filter(function (x) { return x.with === who; })[0];
            if (!t) {
              t = { id: uid("t"), with: who, role: /деканат|бібліот|студміст/i.test(who) ? "Служба університету" : "Викладач", unread: false, items: [] };
              state.threads.push(t);
            }
            closeModal();
            activeId = t.id;
            send(t, text);
            toast("Повідомлення надіслано");
          };
        });
    }
    $("#composeBtn").onclick = function () { compose(); };
    renderThreads();
    var to = param("to");
    if (to) {
      var existing = state.threads.filter(function (x) { return x.with === to; })[0];
      if (existing) open(existing.id); else compose(to);
    } else if (state.threads.length && window.innerWidth >= 760) {
      open(state.threads.slice().sort(function (a, b) { return lastOf(b).ts - lastOf(a).ts; })[0].id);
    }
  }

  /* ------------------------------------------------------------ фінанси */
  function initFinance() {
    function render() {
      var unpaid = state.invoices.filter(function (i) { return i.status === "unpaid"; });
      var total = unpaid.reduce(function (s, i) { return s + i.amount; }, 0);
      $("#dueTotal").textContent = fmtMoney(total);
      $("#dueNote").textContent = unpaid.length ? unpaid.length + " рах. · найближчий термін " + unpaid.map(function (i) { return i.due; }).sort()[0] : "Заборгованостей немає";
      $("#invoiceList").innerHTML = state.invoices.map(function (i) {
        return '<div class="list__item"><div class="invoice"><div class="stack-8" style="gap:4px"><span class="title-item">' + esc(i.title) + '</span>' +
          '<span class="body-sm muted">' + (i.status === "paid" ? "Сплачено " + esc(i.paid_at) : "Сплатити до " + esc(i.due)) + ' · № ' + esc(i.id.toUpperCase()) + '</span></div>' +
          '<div class="toolbar"><span class="invoice__amount">' + fmtMoney(i.amount) + '</span>' +
          (i.status === "paid" ? '<button class="btn btn--ghost btn--sm" type="button" data-receipt="' + i.id + '">Квитанція</button>'
            : '<button class="btn btn--primary btn--sm" type="button" data-pay="' + i.id + '">Оплатити</button>') + '</div></div></div>';
      }).join("");
      $("#historyBody").innerHTML = state.history.map(function (h) {
        return '<tr><td>' + esc(h.date) + '</td><td>' + esc(h.title) + '</td><td class="num' + (h.amount > 0 ? " plus" : "") + '">' + (h.amount > 0 ? "+" : "−") + fmtMoney(h.amount).replace(" грн", "") + '</td></tr>';
      }).join("");
    }
    function receipt(i) {
      download("kvytantsiya-" + i.id + ".txt",
        "КВИТАНЦІЯ (ДЕМО)\n" + SEED.university.full_name + "\n\nПлатник: " + SEED.student.last_name + " " + SEED.student.first_name + " " + SEED.student.patronymic +
        "\nСтудентський квиток: " + SEED.student.student_id + "\nПризначення: " + i.title + "\nСума: " + fmtMoney(i.amount) + "\nДата оплати: " + i.paid_at +
        "\nНомер транзакції: " + (i.tx || "KL" + i.id.toUpperCase()) + "\n\nДокумент згенеровано прототипом, фінансової сили не має.\n");
    }
    $("#invoiceList").addEventListener("click", function (e) {
      var p = e.target.closest("[data-pay]"), r = e.target.closest("[data-receipt]");
      if (r) { receipt(byId(state.invoices, r.dataset.receipt)); toast("Квитанцію завантажено"); }
      if (!p) return;
      var inv = byId(state.invoices, p.dataset.pay);
      openModal("Оплата рахунку",
        '<div class="hint"><b>' + esc(inv.title) + '</b><br>Сума до сплати: <b>' + fmtMoney(inv.amount) + '</b></div>' +
        '<fieldset class="field"><legend>Спосіб оплати</legend><div class="doc-types">' +
        ['Google Pay', 'Apple Pay', 'Інтернет-банкінг (перенаправлення в банк)'].map(function (m, k) {
          return '<label class="radio-card"><input type="radio" name="pm" value="' + esc(m) + '"' + (k === 0 ? " checked" : "") + '><span class="title-item">' + esc(m) + '</span></label>';
        }).join("") + '</div></fieldset>' +
        '<p class="body-sm muted">Це демо-оплата: гроші не списуються, жодні платіжні дані не запитуються й не передаються.</p>' +
        '<div class="modal__actions"><button class="btn btn--ghost" type="button" data-close>Скасувати</button><button class="btn btn--primary" type="button" id="payBtn">Сплатити ' + fmtMoney(inv.amount) + '</button></div>',
        function (body) {
          $("#payBtn", body).onclick = function () {
            withLoading(this, api(function () {
              inv.status = "paid";
              inv.paid_at = fmtDateNum(Date.now());
              inv.tx = "KL" + Date.now().toString().slice(-8);
              state.history.unshift({ date: inv.paid_at, title: "Оплата: " + inv.title, amount: -inv.amount });
            }, 1200, 2000)).then(function () {
              closeModal(); render();
              toast("Оплату " + fmtMoney(inv.amount) + " зараховано");
              notify("Платіж зараховано: " + inv.title, "finance.html");
            });
          };
        });
    });
    $("#statementBtn").onclick = function () {
      var rows = [["Дата", "Операція", "Сума, грн"]].concat(state.history.map(function (h) { return [h.date, h.title, h.amount]; }));
      download("vypyska-" + SEED.student.last_name + ".csv", csv(rows), "text/csv");
      toast("Виписку завантажено");
    };
    render();
  }

  /* ------------------------------------------------------------ довідки */
  function docType(id) { return byId(SEED.documentTypes || [], id); }
  var REQ_STATUS = {
    submitted: ["Подано", 1],
    processing: ["В обробці", 2],
    ready: ["Готово", 3],
    issued: ["Видано", 4],
    cancelled: ["Скасовано", 0]
  };
  function initDocuments() {
    function render() {
      $("#requestList").innerHTML = state.requests.slice().sort(function (a, b) { return b.ts - a.ts; }).map(function (r) {
        var t = docType(r.type) || { title: r.type };
        var st = REQ_STATUS[r.status];
        var steps = "";
        for (var k = 1; k <= 4; k++) steps += '<span class="' + (k <= st[1] ? "is-on" : "") + '"></span>';
        var action = "";
        if (r.status === "submitted") action = '<button class="link-btn" type="button" data-cancel="' + r.id + '">Скасувати</button>';
        if (r.status === "ready" && r.delivery === "Електронна з КЕП") action = '<button class="btn btn--primary btn--sm" type="button" data-get="' + r.id + '">Завантажити</button>';
        if (r.status === "ready" && r.delivery !== "Електронна з КЕП") action = '<span class="body-sm muted">Деканат, ауд. 104</span>';
        return '<div class="list__item"><div class="list__row"><span class="title-item">' + esc(t.title) + (r.english ? " (англ.)" : "") + '</span>' +
          '<span class="' + (r.status === "ready" ? "tag tag--tint" : r.status === "cancelled" ? "tag" : "tag tag--ok") + '">' + st[0] + '</span></div>' +
          '<span class="body-sm muted-alt">№ ' + esc(r.id.toUpperCase()) + ' · ' + esc(r.purpose) + ' · ' + r.copies + ' пр. · ' + esc(r.delivery) + ' · ' + esc(r.created) + '</span>' +
          (r.status !== "cancelled" ? '<div class="status-steps" aria-hidden="true">' + steps + '</div>' : "") +
          (action ? '<div class="list__row" style="justify-content:flex-end">' + action + '</div>' : "") + '</div>';
      }).join("") || '<p class="body-sm muted-alt">Заявок ще немає.</p>';
    }
    pageRefresh = render;

    $("#docForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      var purpose = $("#purpose");
      purpose.classList.remove("is-invalid");
      if (!purpose.value.trim()) { purpose.classList.add("is-invalid"); purpose.focus(); toast("Вкажіть, куди подається довідка", "err"); return; }
      var copies = Math.max(1, Math.min(5, +$("#copies").value || 1));
      var req = {
        id: "d-" + (1003 + state.requests.length),
        type: f.elements.type.value,
        purpose: purpose.value.trim(),
        copies: copies,
        delivery: f.elements.delivery.value,
        english: $("#english").checked,
        status: "submitted",
        created: fmtDateNum(Date.now()),
        ts: Date.now()
      };
      withLoading($("button[type=submit]", f), api(function () { state.requests.push(req); }, 600, 1100)).then(function () {
        render();
        f.reset();
        toast("Заявку № " + req.id.toUpperCase() + " подано. Статус оновиться автоматично");
      });
    });

    $("#requestList").addEventListener("click", function (e) {
      var c = e.target.closest("[data-cancel]"), g = e.target.closest("[data-get]");
      if (c) {
        confirmModal("Скасувати заявку?", "Заявку буде відкликано з обробки.", "Скасувати заявку").then(function (ok) {
          if (ok) api(function () { byId(state.requests, c.dataset.cancel).status = "cancelled"; }).then(function () { render(); toast("Заявку скасовано"); });
        });
      }
      if (g) {
        var r = byId(state.requests, g.dataset.get);
        var t = docType(r.type);
        var s = SEED.student;
        var html = '<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>' + esc(t.title) + '</title>' +
          '<style>body{font-family:Georgia,serif;max-width:720px;margin:48px auto;padding:0 24px;color:#1a1a2e;line-height:1.6}h1{font-size:22px;text-align:center;text-transform:uppercase;letter-spacing:.05em}.head{text-align:center;border-bottom:2px solid #e30613;padding-bottom:12px;margin-bottom:32px}.sign{margin-top:48px;display:flex;justify-content:space-between}.stamp{border:2px solid #e30613;color:#bd0511;border-radius:8px;padding:8px 12px;font-size:12px;font-family:monospace}</style></head><body>' +
          '<div class="head"><b>' + esc(SEED.university.full_name) + '</b><br>' + esc(s.faculty) + '</div>' +
          '<h1>' + esc(t.title) + '</h1><p style="text-align:right">№ ' + esc(r.id.toUpperCase()) + ' від ' + fmtDateNum(Date.now()) + '</p>' +
          '<p>Видана <b>' + esc(s.last_name + " " + s.first_name + " " + s.patronymic) + '</b>, ' + esc(s.birth_date) + ' р. н., у тому, що він дійсно навчається на ' + s.course +
          ' курсі ' + esc(s.faculty) + ' за спеціальністю «' + esc(s.specialty) + '», освітня програма «' + esc(s.program) + '», ступінь «' + esc(s.degree) + '», форма навчання — ' + esc(s.study_form.toLowerCase()) +
          ', джерело фінансування — ' + esc(s.funding.toLowerCase()) + '. Строк навчання: 01.09.' + s.enrolled + ' — 30.06.' + s.graduation + '.</p>' +
          '<p>Довідка видана для подання: ' + esc(r.purpose) + '.</p>' +
          '<div class="sign"><span>Декан факультету<br>' + esc(s.dean) + '</span><span class="stamp">КЕП ✓ ПІДПИСАНО<br>ДЕМО-ДОКУМЕНТ</span></div>' +
          '<p style="margin-top:48px;font-size:12px;color:#6b7280">Документ згенеровано прототипом «Клодитет». Юридичної сили не має.</p></body></html>';
        download("dovidka-" + r.id + ".html", html, "text/html");
        toast("Довідку завантажено");
      }
    });
    render();
  }

  /* ---------------------------------------------------------- бібліотека */
  var COVERS = ["var(--grad-brand)", "var(--grad-dark)", "var(--grad-graphite)"];
  function initLibrary() {
    var topics = [];
    state.books.forEach(function (b) { if (topics.indexOf(b.topic) < 0) topics.push(b.topic); });
    topics.sort().forEach(function (t) { var o = document.createElement("option"); o.value = t; o.textContent = t; $("#topicFilter").appendChild(o); });

    function renderLoans() {
      var rows = state.loans.map(function (l) {
        var b = byId(state.books, l.book);
        var soon = l.due - Date.now() < 7 * DAY;
        return '<div class="list__item"><div class="list__row"><div class="stack-8" style="gap:2px"><span class="title-item">' + esc(b.title) + '</span>' +
          '<span class="body-sm muted-alt">' + esc(b.author) + ' · взято ' + esc(l.taken) + '</span></div>' +
          '<div class="toolbar"><span class="body-sm' + (soon ? " accent" : " muted-alt") + '">повернути до ' + fmtDateNum(l.due) + ' (' + dueText(l.due) + ')</span>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-renew="' + l.book + '"' + (l.renewals >= 2 ? " disabled" : "") + '>' + (l.renewals >= 2 ? "Ліміт продовжень" : "Продовжити") + '</button></div></div></div>';
      });
      state.reservations.forEach(function (r) {
        var b = byId(state.books, r.book);
        rows.push('<div class="list__item"><div class="list__row"><div class="stack-8" style="gap:2px"><span class="title-item">' + esc(b.title) + ' <span class="tag tag--tint">Заброньовано</span></span>' +
          '<span class="body-sm muted-alt">Забрати на абонементі (корп. А, ауд. 010) до ' + fmtDateNum(r.until) + '</span></div>' +
          '<button class="link-btn" type="button" data-unreserve="' + r.book + '">Скасувати бронь</button></div></div>');
      });
      state.waitlist.forEach(function (w) {
        var b = byId(state.books, w.book);
        rows.push('<div class="list__item"><div class="list__row"><div class="stack-8" style="gap:2px"><span class="title-item">' + esc(b.title) + ' <span class="tag">У черзі · ' + w.pos + '-й</span></span>' +
          '<span class="body-sm muted-alt">Повідомимо, щойно примірник повернуть</span></div>' +
          '<button class="link-btn" type="button" data-unwait="' + w.book + '">Вийти з черги</button></div></div>');
      });
      $("#loanList").innerHTML = rows.join("") || '<p class="body-sm muted-alt">Книг на руках немає.</p>';
    }
    function renderBooks() {
      var q = $("#bookSearch").value.trim().toLowerCase();
      var topic = $("#topicFilter").value;
      var only = $("#onlyAvailable").checked;
      var list = state.books.filter(function (b) {
        return (!q || (b.title + " " + b.author).toLowerCase().indexOf(q) >= 0) && (!topic || b.topic === topic) && (!only || b.available > 0);
      });
      $("#bookEmpty").hidden = list.length > 0;
      $("#bookGrid").innerHTML = list.map(function (b, i) {
        var loaned = state.loans.some(function (l) { return l.book === b.id; });
        var reserved = state.reservations.some(function (r) { return r.book === b.id; });
        var waiting = state.waitlist.some(function (w) { return w.book === b.id; });
        var btn;
        if (loaned) btn = '<span class="tag tag--ok">У вас</span>';
        else if (reserved) btn = '<span class="tag tag--tint">Заброньовано</span>';
        else if (waiting) btn = '<span class="tag">У черзі</span>';
        else if (b.available > 0) btn = '<button class="btn btn--primary btn--sm" type="button" data-reserve="' + b.id + '">Забронювати</button>';
        else btn = '<button class="btn btn--ghost btn--sm" type="button" data-wait="' + b.id + '">Стати в чергу</button>';
        return '<article class="card book"><div class="book__cover" style="background:' + COVERS[i % 3] + '">' + esc(b.title) + '</div>' +
          '<span class="title-card">' + esc(b.title) + '</span><span class="body-sm muted-alt">' + esc(b.author) + ', ' + b.year + '</span>' +
          '<span class="tag">' + esc(b.topic) + '</span>' +
          '<div class="book__foot"><span class="body-sm ' + (b.available ? "" : "muted") + '">' + (b.available ? "В наявності: " + b.available + " із " + b.copies : "Усі " + b.copies + " прим. видано") + '</span>' + btn + '</div></article>';
      }).join("");
    }
    function renderAll() { renderLoans(); renderBooks(); }

    ["input", "change"].forEach(function (ev) {
      $("#bookSearch").addEventListener(ev, renderBooks);
      $("#topicFilter").addEventListener(ev, renderBooks);
      $("#onlyAvailable").addEventListener(ev, renderBooks);
    });
    document.addEventListener("click", function (e) {
      var t;
      if ((t = e.target.closest("[data-reserve]"))) {
        var b = byId(state.books, t.dataset.reserve);
        withLoading(t, api(function () {
          if (b.available < 1) throw new Error("none");
          b.available--;
          state.reservations.push({ book: b.id, until: startOfDay(Date.now()).getTime() + 3 * DAY });
        })).then(function () { renderAll(); toast("Книгу заброньовано на 3 дні"); })
          .catch(function () { toast("Останній примірник щойно видали", "err"); renderAll(); });
      } else if ((t = e.target.closest("[data-unreserve]"))) {
        var id = t.dataset.unreserve;
        api(function () {
          state.reservations = state.reservations.filter(function (r) { return r.book !== id; });
          byId(state.books, id).available++;
        }).then(function () { renderAll(); toast("Бронювання скасовано"); });
      } else if ((t = e.target.closest("[data-wait]"))) {
        var wid = t.dataset.wait;
        withLoading(t, api(function () { state.waitlist.push({ book: wid, pos: 1 + Math.floor(Math.random() * 4) }); })).then(function () { renderAll(); toast("Вас додано до черги"); });
      } else if ((t = e.target.closest("[data-unwait]"))) {
        var uw = t.dataset.unwait;
        api(function () { state.waitlist = state.waitlist.filter(function (w) { return w.book !== uw; }); }).then(renderAll);
      } else if ((t = e.target.closest("[data-renew]"))) {
        var l = state.loans.filter(function (x) { return x.book === t.dataset.renew; })[0];
        withLoading(t, api(function () { l.due += 14 * DAY; l.renewals++; })).then(function () {
          renderAll(); toast("Термін продовжено до " + fmtDateNum(l.due));
        });
      }
    });
    renderAll();
  }

  /* ------------------------------------------------------------- профіль */
  function initProfile() {
    var p = state.profile;
    $("#pEmail").value = p.personal_email;
    $("#phone").value = p.phone;
    $("#address").value = p.address;
    $("#contactForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target, bad = null;
      $$(".input", f).forEach(function (i) {
        var ok = i.readOnly || i.checkValidity();
        i.classList.toggle("is-invalid", !ok);
        if (!ok && !bad) bad = i;
      });
      if (bad) { bad.focus(); toast("Перевірте правильність полів", "err"); return; }
      withLoading($("button[type=submit]", f), api(function () {
        p.personal_email = $("#pEmail").value.trim();
        p.phone = $("#phone").value.trim();
        p.address = $("#address").value.trim();
      }, 500, 900)).then(function () { toast("Контактні дані оновлено"); });
    });

    var newPwd = $("#newPwd");
    newPwd.addEventListener("input", function () {
      var v = newPwd.value, score = 0;
      if (v.length >= 8) score++;
      if (v.length >= 12) score++;
      if (/[A-ZА-ЯІЇЄҐ]/.test(v) && /[a-zа-яіїєґ]/.test(v)) score++;
      if (/\d/.test(v)) score++;
      if (/[^\wа-яіїєґ]/i.test(v)) score++;
      $("#pwdMeter").style.width = (score * 20) + "%";
      $("#pwdHint").textContent = ["Занадто короткий", "Слабкий", "Посередній", "Добрий", "Надійний", "Дуже надійний"][score];
    });
    $("#passwordForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      if (!$("#oldPwd").value) { toast("Введіть поточний пароль", "err"); $("#oldPwd").focus(); return; }
      if (newPwd.value.length < 8) { toast("Новий пароль має містити щонайменше 8 символів", "err"); newPwd.focus(); return; }
      if (newPwd.value !== $("#newPwd2").value) { toast("Паролі не збігаються", "err"); $("#newPwd2").classList.add("is-invalid"); return; }
      $("#newPwd2").classList.remove("is-invalid");
      withLoading($("button[type=submit]", f), api(null, 700, 1200)).then(function () {
        f.reset(); $("#pwdMeter").style.width = "0";
        toast("Пароль змінено. У демо-версії підійде будь-який пароль");
        notify("Пароль до кабінету змінено", "profile.html");
      });
    });

    $$("[data-pref]").forEach(function (c) {
      c.checked = !!p.prefs[c.dataset.pref];
      c.addEventListener("change", function () {
        api(function () { p.prefs[c.dataset.pref] = c.checked; }, 150, 300).then(function () { toast("Налаштування збережено"); });
      });
    });
    $("#resetDemo").onclick = function () {
      confirmModal("Скинути демо-дані?", "Усі ваші дії в кабінеті (здані роботи, листування, оплати, заявки, бронювання) буде видалено.", "Скинути").then(function (ok) {
        if (!ok) return;
        try { if (LS) LS.removeItem(STATE_KEY); } catch (e2) {}
        state = buildInitialState(); save();
        toast("Демо-дані скинуто");
        setTimeout(function () { location.reload(); }, 600);
      });
    };
  }

  /* --------------------------------------------------------------- старт */
  var page = document.body.dataset.page;
  if (page === "login") { if ($("#loginForm")) initLogin(); return; }
  if (!isLoggedIn()) return;
  initShell();
  var routes = {
    dashboard: initDashboard, schedule: initSchedule, grades: initGrades, courses: initCourses,
    assignments: initAssignments, messages: initMessages, finance: initFinance,
    documents: initDocuments, library: initLibrary, profile: initProfile
  };
  if (routes[page]) routes[page]();
})();
