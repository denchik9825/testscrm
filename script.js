/* =========================================================
   СОХРАНЕНИЕ ДАННЫХ (localStorage)
   Все функции чтения/записи массива лидов.
   ========================================================= */
const STORAGE_KEY = "crm_leads";

function loadLeads() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveLeads(leads) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

/* =========================================================
   ОТРИСОВКА СПИСКА (интерфейс, зависящий от данных)
   ========================================================= */
const leadsListEl = document.getElementById("leadsList");
const emptyHintEl = document.getElementById("emptyHint");

function renderLeads() {
  const leads = loadLeads();
  leadsListEl.querySelectorAll(".lead-card").forEach(el => el.remove());
  emptyHintEl.style.display = leads.length ? "none" : "block";

  leads.slice().reverse().forEach(lead => {
    const card = document.createElement("div");
    card.className = "lead-card";
    card.dataset.id = lead.id;

    const sourceClass = lead.source === "Холодный" ? "source-cold" : "source-warm";

    card.innerHTML = `
      <div>
        <div class="lead-name">${escapeHtml(lead.name)}</div>
        <div class="lead-phone">${escapeHtml(lead.phone)}</div>
      </div>
      <div class="lead-actions">
        <button class="del-btn" data-action="delete">Удалить</button>
      </div>
      <div class="lead-meta">
        <span class="badge ${sourceClass}">${escapeHtml(lead.source)}</span>
        <span class="badge">${escapeHtml(lead.owner)}</span>
        <span class="badge">${escapeHtml(lead.stage)}</span>
        ${lead.tzRequested ? '<span class="badge tz">ТЗ запрошено</span>' : ""}
      </div>
      <div class="stage-select">
        <label>Изменить этап:</label>
        <select data-action="change-stage">
          ${["Новый лид","Квалифицирован","Назначена консультация","Отказ"]
            .map(s => `<option ${s === lead.stage ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </div>
    `;

    leadsListEl.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Клик по кнопке "Удалить"
leadsListEl.addEventListener("click", (e) => {
  if (e.target.dataset.action === "delete") {
    const id = e.target.closest(".lead-card").dataset.id;
    const leads = loadLeads().filter(l => l.id !== id);
    saveLeads(leads);
    renderLeads();
  }
});

// Доп. задание, вариант 1: изменение этапа сделки прямо в карточке
leadsListEl.addEventListener("change", (e) => {
  if (e.target.dataset.action === "change-stage") {
    const id = e.target.closest(".lead-card").dataset.id;
    const leads = loadLeads();
    const lead = leads.find(l => l.id === id);
    if (lead) {
      lead.stage = e.target.value;
      saveLeads(leads);
      renderLeads();
    }
  }
});

/* =========================================================
   ЛОГИКА КНОПКИ «СОХРАНИТЬ» (валидация + добавление)
   ========================================================= */
const form = document.getElementById("leadForm");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const formMsg = document.getElementById("formMsg");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  // Проверка обязательных полей
  const nameField = document.getElementById("fieldName");
  const phoneField = document.getElementById("fieldPhone");
  nameField.classList.toggle("invalid", !name);
  phoneField.classList.toggle("invalid", !phone);

  if (!name || !phone) {
    formMsg.textContent = "Заполните обязательные поля: имя и телефон.";
    formMsg.className = "error";
    return;
  }

  // Формируем объект лида и сохраняем
  const lead = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    phone,
    source: document.getElementById("source").value,
    owner: document.getElementById("owner").value,
    stage: document.getElementById("stage").value,
    tzRequested: document.getElementById("tzRequested").checked,
    createdAt: new Date().toISOString()
  };

  const leads = loadLeads();
  leads.push(lead);
  saveLeads(leads); // localStorage переживает обновление страницы

  renderLeads();
  sendLeadToApi(lead); // доп. задание — см. ниже (демо-запрос, не обязателен)

  formMsg.textContent = "Лид сохранён.";
  formMsg.className = "success";
  form.reset();
  nameField.classList.remove("invalid");
  phoneField.classList.remove("invalid");
});

/* =========================================================
   ДОП. ЗАДАНИЕ (вариант 2) — отправка через API
   Показывает, КАК лид можно было бы отправить на внешний сервер
   (например, Google Apps Script Web App, который пишет в Google Таблицу).
   Реальной телефонии/CRM нет — запрос уходит на демонстрационный
   URL-заглушку и не влияет на сохранение (оно уже сделано в localStorage).
   ========================================================= */
const API_URL = "https://script.google.com/macros/s/ВАШ_ID_СКРИПТА/exec"; // заглушка

async function sendLeadToApi(lead) {
  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors", // т.к. URL фиктивный, реального ответа не будет
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    });
    console.log("Запрос на API отправлен (демо, URL фиктивный):", lead);
  } catch (err) {
    console.log("API-запрос демонстрационный, реального сервера нет:", err.message);
  }
}

// Выводим пример запроса в блок <details>, чтобы было видно без чтения кода
document.getElementById("apiDemoCode").textContent =
`fetch("${API_URL}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(lead)
});

// Такой Web App в Google Apps Script принимает POST-запрос
// и дописывает строку с данными лида в Google Таблицу.
// В этой демке localStorage — основное хранилище,
// а запрос выше только показывает, куда можно передать те же данные.`;

/* =========================================================
   ИНИЦИАЛИЗАЦИЯ — рендерим сохранённые лиды при загрузке
   ========================================================= */
renderLeads();
