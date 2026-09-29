"""Демо-дані кабінету студента «Клодитет».

Усі дані вигадані. Серверна частина рендерить із них сторінки,
а клієнтська (static/js/app.js) отримує їх як SEED і зберігає
зміни користувача в localStorage — так імітується робота бекенду.
"""

UNIVERSITY = {
    "name": "Клодитет",
    "full_name": "Національний університет «Клодитет»",
    "semester": "Осінній семестр 2026/2027",
    "semester_start": "2026-09-01",
    "semester_end": "2026-12-25",
    "session": "Екзаменаційна сесія: 4–22 січня 2027",
}

STUDENT = {
    "first_name": "Петро",
    "first_name_vocative": "Петре",
    "last_name": "Лось",
    "patronymic": "Андрійович",
    "initials": "ПЛ",
    "student_id": "КЛ-2024-03117",
    "record_book": "№ 24-0317",
    "faculty": "Факультет комп'ютерних наук та штучного інтелекту",
    "specialty": "122 Комп'ютерні науки",
    "program": "Інженерія програмного забезпечення та AI",
    "degree": "Бакалавр",
    "course": 3,
    "group": "КН-31",
    "study_form": "Денна",
    "funding": "Державне замовлення (бюджет)",
    "enrolled": "2024",
    "graduation": "2028",
    "birth_date": "14.03.2006",
    "email": "p.los@student.klodytet.edu.ua",
    "personal_email": "petro.los2006@gmail.com",
    "phone": "+380 67 123 45 67",
    "address": "м. Київ, вул. Академіка Глушкова, 40, гуртожиток №2, кімн. 417",
    "curator": "доц. Коваль Ірина Миколаївна",
    "dean": "проф. Литвиненко Сергій Петрович",
    "rating_place": 3,
    "group_size": 27,
    "attendance": 96,
}

# ---------------------------------------------------------------- дисципліни
COURSES = [
    {
        "id": "ml",
        "title": "Машинне навчання",
        "teacher": "доц. Коваль Ірина Миколаївна",
        "teacher_short": "доц. Коваль І. М.",
        "ects": 5,
        "control": "Екзамен",
        "points": 34,
        "max_so_far": 38,
        "attendance": 100,
        "description": "Класичні методи машинного навчання: регресія, класифікація, кластеризація, ансамблі, оцінювання моделей та основи нейромереж.",
        "modules": [
            {"title": "Вступ і постановка задач ML", "done": True},
            {"title": "Лінійна та логістична регресія", "done": True},
            {"title": "Дерева рішень і ансамблі", "done": False},
            {"title": "Кластеризація та зниження розмірності", "done": False},
            {"title": "Нейронні мережі: основи", "done": False},
        ],
        "materials": [
            {"title": "Лекція 1–4 (слайди)", "kind": "PDF", "size": "8,4 МБ"},
            {"title": "Ноутбук: лінійна регресія з нуля", "kind": "IPYNB", "size": "312 КБ"},
            {"title": "Датасет: ціни на житло Києва", "kind": "CSV", "size": "1,2 МБ"},
        ],
        "control_points": [
            {"title": "Лабораторні роботи (5 × 8)", "max": 40, "got": 22},
            {"title": "Домашні завдання (2 × 5)", "max": 10, "got": 5},
            {"title": "Модульна контрольна", "max": 10, "got": 7},
            {"title": "Екзамен", "max": 40, "got": None},
        ],
    },
    {
        "id": "db",
        "title": "Бази даних",
        "teacher": "ст. викл. Мельник Олег Васильович",
        "teacher_short": "ст. викл. Мельник О. В.",
        "ects": 5,
        "control": "Екзамен",
        "points": 29,
        "max_so_far": 32,
        "attendance": 94,
        "description": "Реляційна модель, SQL, нормалізація, транзакції та індекси; огляд NoSQL-рішень і проєктування схем для реальних застосунків.",
        "modules": [
            {"title": "Реляційна модель і алгебра", "done": True},
            {"title": "SQL: DDL, DML, JOIN", "done": True},
            {"title": "Нормалізація", "done": False},
            {"title": "Транзакції та ізоляція", "done": False},
            {"title": "NoSQL та розподілені БД", "done": False},
        ],
        "materials": [
            {"title": "Конспект лекцій", "kind": "PDF", "size": "5,1 МБ"},
            {"title": "Схема навчальної БД «Університет»", "kind": "SQL", "size": "48 КБ"},
        ],
        "control_points": [
            {"title": "Лабораторні роботи (6 × 6)", "max": 36, "got": 17},
            {"title": "Тести на лекціях", "max": 14, "got": 12},
            {"title": "Проєкт схеми БД", "max": 10, "got": None},
            {"title": "Екзамен", "max": 40, "got": None},
        ],
    },
    {
        "id": "arch",
        "title": "Архітектура програмного забезпечення",
        "teacher": "проф. Шевченко Дмитро Олегович",
        "teacher_short": "проф. Шевченко Д. О.",
        "ects": 5,
        "control": "Екзамен",
        "points": 27,
        "max_so_far": 30,
        "attendance": 92,
        "description": "Архітектурні стилі та патерни, мікросервіси, подієво-орієнтовані системи, ADR, якісні атрибути та компроміси.",
        "modules": [
            {"title": "Якісні атрибути і компроміси", "done": True},
            {"title": "Шарова та гексагональна архітектура", "done": True},
            {"title": "Мікросервіси та інтеграція", "done": False},
            {"title": "Event-driven та CQRS", "done": False},
        ],
        "materials": [
            {"title": "Шаблон ADR", "kind": "MD", "size": "6 КБ"},
            {"title": "Кейс: архітектура кабінету студента", "kind": "PDF", "size": "2,3 МБ"},
        ],
        "control_points": [
            {"title": "Практичні роботи (4 × 10)", "max": 40, "got": 18},
            {"title": "Командний проєкт", "max": 20, "got": 9},
            {"title": "Екзамен", "max": 40, "got": None},
        ],
    },
    {
        "id": "net",
        "title": "Комп'ютерні мережі",
        "teacher": "доц. Бондар Віктор Петрович",
        "teacher_short": "доц. Бондар В. П.",
        "ects": 4,
        "control": "Залік",
        "points": 31,
        "max_so_far": 35,
        "attendance": 95,
        "description": "Модель OSI і стек TCP/IP, маршрутизація, DNS, HTTP/2 і HTTP/3, безпека мереж, практика з Wireshark і Cisco Packet Tracer.",
        "modules": [
            {"title": "OSI та TCP/IP", "done": True},
            {"title": "IP-адресація і підмережі", "done": True},
            {"title": "Маршрутизація", "done": False},
            {"title": "Прикладний рівень і безпека", "done": False},
        ],
        "materials": [
            {"title": "Лабораторний практикум", "kind": "PDF", "size": "3,7 МБ"},
            {"title": "Топологія для Packet Tracer", "kind": "PKT", "size": "220 КБ"},
        ],
        "control_points": [
            {"title": "Лабораторні роботи (5 × 12)", "max": 60, "got": 23},
            {"title": "Тести", "max": 20, "got": 8},
            {"title": "Підсумковий тест", "max": 20, "got": None},
        ],
    },
    {
        "id": "web",
        "title": "Веб-технології",
        "teacher": "ас. Ткаченко Марина Романівна",
        "teacher_short": "ас. Ткаченко М. Р.",
        "ects": 4,
        "control": "Залік",
        "points": 36,
        "max_so_far": 38,
        "attendance": 100,
        "description": "HTML5, сучасний CSS, JavaScript, HTTP, Flask і REST API, доступність та розгортання статичних сайтів на GitHub Pages.",
        "modules": [
            {"title": "HTML5 і семантика", "done": True},
            {"title": "CSS Grid, Flexbox, адаптивність", "done": True},
            {"title": "JavaScript і DOM", "done": True},
            {"title": "Flask і шаблони Jinja", "done": False},
            {"title": "Деплой: GitHub Pages і CI", "done": False},
        ],
        "materials": [
            {"title": "Стартовий репозиторій Flask", "kind": "ZIP", "size": "92 КБ"},
            {"title": "Чекліст доступності WCAG 2.2", "kind": "PDF", "size": "410 КБ"},
        ],
        "control_points": [
            {"title": "Практичні роботи (5 × 10)", "max": 50, "got": 28},
            {"title": "Курсовий міні-проєкт", "max": 30, "got": 8},
            {"title": "Захист проєкту", "max": 20, "got": None},
        ],
    },
    {
        "id": "eng",
        "title": "Англійська мова (B2)",
        "teacher": "Гончар Тетяна Сергіївна",
        "teacher_short": "Гончар Т. С.",
        "ects": 3,
        "control": "Залік",
        "points": 30,
        "max_so_far": 33,
        "attendance": 90,
        "description": "Професійна англійська для ІТ: технічна документація, код-рев'ю, мітинги, презентації та співбесіди.",
        "modules": [
            {"title": "Technical writing", "done": True},
            {"title": "Meetings & stand-ups", "done": True},
            {"title": "Presentations", "done": False},
            {"title": "Job interviews", "done": False},
        ],
        "materials": [
            {"title": "Vocabulary list: Software Engineering", "kind": "PDF", "size": "180 КБ"},
        ],
        "control_points": [
            {"title": "Робота на заняттях", "max": 40, "got": 24},
            {"title": "Есеї (2 × 10)", "max": 20, "got": 6},
            {"title": "Підсумкова презентація", "max": 40, "got": None},
        ],
    },
    {
        "id": "prob",
        "title": "Теорія ймовірностей та математична статистика",
        "teacher": "доц. Савченко Людмила Григорівна",
        "teacher_short": "доц. Савченко Л. Г.",
        "ects": 4,
        "control": "Екзамен",
        "points": 25,
        "max_so_far": 30,
        "attendance": 96,
        "description": "Випадкові величини, розподіли, граничні теореми, оцінювання параметрів, перевірка гіпотез і регресійний аналіз.",
        "modules": [
            {"title": "Ймовірнісний простір", "done": True},
            {"title": "Випадкові величини", "done": True},
            {"title": "Граничні теореми", "done": False},
            {"title": "Статистичне оцінювання", "done": False},
        ],
        "materials": [
            {"title": "Збірник задач", "kind": "PDF", "size": "6,0 МБ"},
            {"title": "Таблиці розподілів", "kind": "PDF", "size": "350 КБ"},
        ],
        "control_points": [
            {"title": "Практичні заняття", "max": 30, "got": 17},
            {"title": "Індивідуальне завдання", "max": 15, "got": 8},
            {"title": "Модульна контрольна", "max": 15, "got": None},
            {"title": "Екзамен", "max": 40, "got": None},
        ],
    },
]

ELECTIVES = [
    {"id": "el-cv", "title": "Комп'ютерний зір", "teacher": "доц. Коваль І. М.", "ects": 5, "seats": 30, "taken": 24},
    {"id": "el-llm", "title": "Великі мовні моделі та AI-агенти", "teacher": "проф. Шевченко Д. О.", "ects": 5, "seats": 30, "taken": 29},
    {"id": "el-cloud", "title": "Хмарні обчислення та DevOps", "teacher": "доц. Бондар В. П.", "ects": 5, "seats": 25, "taken": 11},
    {"id": "el-sec", "title": "Кібербезпека вебзастосунків", "teacher": "ас. Ткаченко М. Р.", "ects": 5, "seats": 25, "taken": 19},
    {"id": "el-mobile", "title": "Мобільна розробка під Android", "teacher": "ст. викл. Мельник О. В.", "ects": 5, "seats": 20, "taken": 20},
    {"id": "el-product", "title": "Продуктовий менеджмент в ІТ", "teacher": "Гончар Т. С.", "ects": 5, "seats": 35, "taken": 8},
]

# ------------------------------------------------------------------- розклад
PAIRS = [
    {"n": 1, "start": "08:30", "end": "09:50"},
    {"n": 2, "start": "10:10", "end": "11:30"},
    {"n": 3, "start": "11:50", "end": "13:10"},
    {"n": 4, "start": "13:30", "end": "14:50"},
    {"n": 5, "start": "15:00", "end": "16:20"},
]

DAYS = ["Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця"]

# week: both | num (чисельник) | den (знаменник)
SCHEDULE = [
    {"day": 0, "pair": 1, "course": "arch", "kind": "Лекція", "room": "201", "week": "both"},
    {"day": 0, "pair": 2, "course": "prob", "kind": "Лекція", "room": "310", "week": "both"},
    {"day": 0, "pair": 3, "course": "net", "kind": "Лабораторна", "room": "215", "week": "num"},
    {"day": 0, "pair": 3, "course": "web", "kind": "Лабораторна", "room": "220", "week": "den"},
    {"day": 1, "pair": 2, "course": "ml", "kind": "Лекція", "room": "412", "week": "both"},
    {"day": 1, "pair": 3, "course": "db", "kind": "Лабораторна", "room": "305", "week": "both"},
    {"day": 1, "pair": 4, "course": "eng", "kind": "Практика", "room": "118", "week": "both"},
    {"day": 2, "pair": 1, "course": "net", "kind": "Лекція", "room": "201", "week": "both"},
    {"day": 2, "pair": 2, "course": "web", "kind": "Лекція", "room": "Онлайн", "week": "both"},
    {"day": 2, "pair": 3, "course": "prob", "kind": "Практика", "room": "310", "week": "both"},
    {"day": 3, "pair": 2, "course": "db", "kind": "Лекція", "room": "412", "week": "both"},
    {"day": 3, "pair": 3, "course": "ml", "kind": "Лабораторна", "room": "305", "week": "both"},
    {"day": 3, "pair": 4, "course": "arch", "kind": "Практика", "room": "220", "week": "num"},
    {"day": 4, "pair": 1, "course": "eng", "kind": "Практика", "room": "118", "week": "den"},
    {"day": 4, "pair": 2, "course": "ml", "kind": "Практика", "room": "305", "week": "both"},
    {"day": 4, "pair": 4, "course": "curator", "kind": "Кураторська година", "room": "101", "week": "num"},
]

# ------------------------------------------------------------ залікова книжка
GRADE_HISTORY = [
    {
        "title": "1 семестр · 2024/2025",
        "items": [
            ("Вища математика", 7, "Екзамен", 92),
            ("Програмування (Python)", 6, "Екзамен", 95),
            ("Дискретна математика", 5, "Екзамен", 88),
            ("Історія та культура України", 3, "Залік", 90),
            ("Англійська мова (A2+)", 3, "Залік", 94),
            ("Вступ до ІТ-професії", 4, "Залік", 97),
            ("Фізичне виховання", 2, "Залік", 85),
        ],
    },
    {
        "title": "2 семестр · 2024/2025",
        "items": [
            ("Вища математика, ч. 2", 6, "Екзамен", 85),
            ("Об'єктно-орієнтоване програмування (Java)", 6, "Екзамен", 93),
            ("Алгоритми та структури даних", 6, "Екзамен", 90),
            ("Англійська мова (B1)", 3, "Залік", 91),
            ("Фізика", 5, "Екзамен", 82),
            ("Філософія", 4, "Залік", 88),
        ],
    },
    {
        "title": "3 семестр · 2025/2026",
        "items": [
            ("Операційні системи", 6, "Екзамен", 89),
            ("Лінійна алгебра", 5, "Екзамен", 84),
            ("Алгоритми, ч. 2", 5, "Екзамен", 94),
            ("Англійська мова (B1+)", 3, "Залік", 96),
            ("Архітектура комп'ютерів", 5, "Екзамен", 87),
            ("Економіка ІТ-бізнесу", 3, "Залік", 91),
            ("Проєктний практикум", 3, "Залік", 98),
        ],
    },
    {
        "title": "4 семестр · 2025/2026",
        "items": [
            ("Чисельні методи", 5, "Екзамен", 86),
            ("Системне програмування", 6, "Екзамен", 92),
            ("UX/UI-дизайн", 4, "Залік", 95),
            ("Англійська мова (B2)", 3, "Залік", 93),
            ("Правознавство", 3, "Залік", 90),
            ("Soft skills і командна робота", 3, "Залік", 97),
            ("Курсова робота з ООП", 3, "Диф. залік", 99),
            ("Навчальна практика", 3, "Диф. залік", 100),
        ],
    },
]


def ects_letter(score):
    if score >= 90:
        return "A"
    if score >= 82:
        return "B"
    if score >= 74:
        return "C"
    if score >= 64:
        return "D"
    if score >= 60:
        return "E"
    return "FX"


def national_grade(score, control):
    if control == "Залік":
        return "Зараховано" if score >= 60 else "Не зараховано"
    if score >= 90:
        return "Відмінно"
    if score >= 74:
        return "Добре"
    if score >= 60:
        return "Задовільно"
    return "Незадовільно"


def build_grades():
    semesters = []
    total_weighted = 0
    total_ects = 0
    for sem in GRADE_HISTORY:
        rows = []
        s_weighted = 0
        s_ects = 0
        for title, ects, control, score in sem["items"]:
            rows.append({
                "title": title,
                "ects": ects,
                "control": control,
                "score": score,
                "letter": ects_letter(score),
                "national": national_grade(score, control),
            })
            s_weighted += score * ects
            s_ects += ects
        semesters.append({
            "title": sem["title"],
            "rows": rows,
            "ects": s_ects,
            "average": round(s_weighted / s_ects, 1),
        })
        total_weighted += s_weighted
        total_ects += s_ects
    return {
        "semesters": semesters,
        "average": round(total_weighted / total_ects, 1),
        "ects_earned": total_ects,
        "ects_total": 240,
    }


# ------------------------------------------------------------------ завдання
# due_in: скільки днів від «сьогодні» (від'ємне — вже минуло)
ASSIGNMENTS = [
    {"id": "a1", "course": "db", "title": "Лабораторна №3: нормалізація схеми до 3НФ", "kind": "Лабораторна", "due_in": 3, "max": 6, "status": "in_progress",
     "text": "Нормалізуйте надану схему бази даних бібліотеки до третьої нормальної форми. Додайте ER-діаграму та SQL-скрипт створення таблиць."},
    {"id": "a2", "course": "ml", "title": "Домашнє завдання: лінійна регресія з нуля", "kind": "Домашнє завдання", "due_in": 7, "max": 5, "status": "new",
     "text": "Реалізуйте градієнтний спуск для лінійної регресії без sklearn. Порівняйте результат із LinearRegression на датасеті цін на житло."},
    {"id": "a3", "course": "eng", "title": "Есей: Software Architecture Patterns", "kind": "Есей", "due_in": 10, "max": 10, "status": "new",
     "text": "Write a 400–500 word essay comparing two architecture patterns you would choose for a student portal. Use at least five terms from the vocabulary list."},
    {"id": "a4", "course": "web", "title": "Практична №4: Flask і шаблони Jinja", "kind": "Практична", "due_in": 5, "max": 10, "status": "new",
     "text": "Створіть Flask-застосунок з базовим шаблоном, трьома сторінками та спільною навігацією. Посилання на репозиторій додайте в коментар."},
    {"id": "a5", "course": "arch", "title": "Практична №3: ADR для вибору бази даних", "kind": "Практична", "due_in": 12, "max": 10, "status": "new",
     "text": "Опишіть архітектурне рішення щодо вибору СУБД для кабінету студента у форматі ADR: контекст, варіанти, рішення, наслідки."},
    {"id": "a6", "course": "prob", "title": "Індивідуальне завдання №2", "kind": "Індивідуальне", "due_in": 14, "max": 8, "status": "new",
     "text": "Варіант 17. Розв'яжіть задачі 2.3, 2.8, 2.11 зі збірника. Оформіть розв'язки у PDF."},
    {"id": "a7", "course": "ml", "title": "Лабораторна №2: логістична регресія", "kind": "Лабораторна", "due_in": -6, "max": 8, "status": "graded", "grade": 7,
     "feedback": "Добра робота. Варто було нормалізувати ознаки перед навчанням — це прискорило б збіжність.",
     "text": "Побудуйте класифікатор спаму на основі логістичної регресії. Оцініть precision, recall та F1."},
    {"id": "a8", "course": "net", "title": "Лабораторна №2: підмережі та VLSM", "kind": "Лабораторна", "due_in": -3, "max": 12, "status": "submitted",
     "text": "Спроєктуйте адресний план для мережі кампусу з використанням VLSM. Перевірте конфігурацію в Packet Tracer."},
    {"id": "a9", "course": "web", "title": "Практична №3: адаптивна верстка", "kind": "Практична", "due_in": -10, "max": 10, "status": "graded", "grade": 10,
     "feedback": "Відмінно! Чиста семантика, гарна доступність, Lighthouse 100.",
     "text": "Зверстайте адаптивну сторінку-портфоліо з використанням CSS Grid і Flexbox."},
]

# -------------------------------------------------------------- повідомлення
MESSAGES = [
    {
        "id": "t1", "with": "доц. Коваль Ірина Миколаївна", "role": "Куратор групи, викладач ML", "unread": True,
        "items": [
            {"from": "them", "text": "Петре, добрий день. Нагадую, що у п'ятницю кураторська година — обговорюємо вибір дисциплін на весняний семестр.", "ago_min": 180},
        ],
    },
    {
        "id": "t2", "with": "Деканат ФКНШІ", "role": "Методист Олійник Н. В.", "unread": True,
        "items": [
            {"from": "them", "text": "Шановні студенти 3 курсу! Запис на вибіркові дисципліни відкрито до 15 жовтня. Вибір здійснюється в розділі «Дисципліни».", "ago_min": 1440},
        ],
    },
    {
        "id": "t3", "with": "ст. викл. Мельник Олег Васильович", "role": "Бази даних", "unread": False,
        "items": [
            {"from": "me", "text": "Олеже Васильовичу, чи можна в лабораторній №3 використати PostgreSQL замість MySQL?", "ago_min": 2900},
            {"from": "them", "text": "Так, звісно. Головне — щоб скрипт запускався без помилок. Діаграму можна зробити в dbdiagram.io.", "ago_min": 2700},
            {"from": "me", "text": "Дякую!", "ago_min": 2690},
        ],
    },
    {
        "id": "t4", "with": "Бібліотека Клодитету", "role": "Абонемент", "unread": False,
        "items": [
            {"from": "them", "text": "Нагадуємо: термін повернення книги «Clean Architecture» спливає через 5 днів. Продовжити можна в розділі «Бібліотека».", "ago_min": 4320},
        ],
    },
    {
        "id": "t5", "with": "Студентська рада", "role": "Оргкомітет ClaudeHack", "unread": False,
        "items": [
            {"from": "them", "text": "Привіт! Реєстрація на хакатон ClaudeHack 2026 відкрита. Тема цього року — AI-агенти для освіти. Команди до 4 осіб.", "ago_min": 7200},
        ],
    },
]

RECIPIENTS = [
    "доц. Коваль Ірина Миколаївна",
    "ст. викл. Мельник Олег Васильович",
    "проф. Шевченко Дмитро Олегович",
    "доц. Бондар Віктор Петрович",
    "ас. Ткаченко Марина Романівна",
    "Гончар Тетяна Сергіївна",
    "доц. Савченко Людмила Григорівна",
    "Деканат ФКНШІ",
    "Бібліотека Клодитету",
    "Студмістечко (гуртожитки)",
]

# ------------------------------------------------------------------- фінанси
FINANCE = {
    "scholarship": {"kind": "Академічна стипендія", "amount": 2000, "until": "31.12.2026", "card": "ПриватБанк •••• 4417"},
    "invoices": [
        {"id": "inv-dorm-10", "title": "Проживання в гуртожитку №2 · жовтень", "amount": 1150, "due": "10.10.2026", "status": "unpaid"},
        {"id": "inv-lib", "title": "Штраф бібліотеки за прострочення (3 дні)", "amount": 45, "due": "15.10.2026", "status": "unpaid"},
        {"id": "inv-cloud", "title": "Додатковий курс «AWS Cloud Practitioner»", "amount": 2400, "due": "20.10.2026", "status": "unpaid"},
        {"id": "inv-dorm-09", "title": "Проживання в гуртожитку №2 · вересень", "amount": 1150, "due": "10.09.2026", "status": "paid", "paid_at": "05.09.2026"},
    ],
    "history": [
        {"date": "25.09.2026", "title": "Академічна стипендія · вересень", "amount": 2000},
        {"date": "05.09.2026", "title": "Оплата: гуртожиток, вересень", "amount": -1150},
        {"date": "28.08.2026", "title": "Академічна стипендія · серпень", "amount": 2000},
        {"date": "12.08.2026", "title": "Оплата: гуртожиток, серпень", "amount": -1150},
        {"date": "25.07.2026", "title": "Академічна стипендія · липень", "amount": 2000},
        {"date": "25.06.2026", "title": "Академічна стипендія · червень", "amount": 2000},
    ],
}

# ------------------------------------------------------------------- довідки
DOCUMENT_TYPES = [
    {"id": "study", "title": "Довідка з місця навчання", "days": "1 робочий день", "note": "Для подання за місцем вимоги, у Пенсійний фонд, банк тощо."},
    {"id": "tck", "title": "Довідка для ТЦК та СП (форма №20)", "days": "2 робочі дні", "note": "Підтвердження навчання для військового обліку."},
    {"id": "income", "title": "Довідка про розмір стипендії", "days": "2 робочі дні", "note": "Доходи за останні 6 місяців, для субсидії або соцвиплат."},
    {"id": "transcript", "title": "Академічна довідка (транскрипт)", "days": "5 робочих днів", "note": "Перелік дисциплін, кредитів ECTS та оцінок. Можна англійською."},
    {"id": "dorm", "title": "Довідка про проживання в гуртожитку", "days": "1 робочий день", "note": "Для реєстрації місця проживання."},
]

DOCUMENT_REQUESTS = [
    {"id": "d-1001", "type": "study", "purpose": "Банк (відкриття рахунку)", "copies": 1, "delivery": "Електронна з КЕП", "status": "ready", "created": "12.09.2026"},
    {"id": "d-1002", "type": "tck", "purpose": "ТЦК та СП за місцем реєстрації", "copies": 2, "delivery": "Паперова в деканаті", "status": "issued", "created": "02.09.2026"},
]

# ------------------------------------------------------------------ бібліотека
BOOKS = [
    {"id": "b1", "title": "Clean Architecture", "author": "Роберт Мартін", "year": 2017, "topic": "Архітектура", "copies": 4, "available": 1},
    {"id": "b2", "title": "Designing Data-Intensive Applications", "author": "Мартін Клеппман", "year": 2017, "topic": "Бази даних", "copies": 5, "available": 0},
    {"id": "b3", "title": "Hands-On Machine Learning", "author": "Орельєн Жерон", "year": 2022, "topic": "Машинне навчання", "copies": 6, "available": 3},
    {"id": "b4", "title": "Комп'ютерні мережі", "author": "Ендрю Таненбаум", "year": 2021, "topic": "Мережі", "copies": 8, "available": 5},
    {"id": "b5", "title": "Flask Web Development", "author": "Мігель Грінберг", "year": 2018, "topic": "Веб", "copies": 3, "available": 2},
    {"id": "b6", "title": "Теорія ймовірностей і математична статистика", "author": "Гмурман В. Є.", "year": 2003, "topic": "Математика", "copies": 12, "available": 9},
    {"id": "b7", "title": "Deep Learning", "author": "Ян Гудфеллоу та ін.", "year": 2016, "topic": "Машинне навчання", "copies": 3, "available": 1},
    {"id": "b8", "title": "Database System Concepts", "author": "Зільбершац, Корт, Сударшан", "year": 2019, "topic": "Бази даних", "copies": 4, "available": 2},
    {"id": "b9", "title": "Грокаємо алгоритми", "author": "Адітья Бхаргава", "year": 2024, "topic": "Алгоритми", "copies": 7, "available": 4},
    {"id": "b10", "title": "Building Microservices", "author": "Сем Ньюмен", "year": 2021, "topic": "Архітектура", "copies": 2, "available": 1},
    {"id": "b11", "title": "Eloquent JavaScript", "author": "Марейн Гавербеке", "year": 2024, "topic": "Веб", "copies": 5, "available": 5},
    {"id": "b12", "title": "AI Engineering", "author": "Чіп Г'юєн", "year": 2025, "topic": "Машинне навчання", "copies": 2, "available": 0},
]

LOANS = [
    {"book": "b1", "taken": "15.09.2026", "due_in": 5, "renewals": 0},
    {"book": "b6", "taken": "03.09.2026", "due_in": 20, "renewals": 1},
]

# ------------------------------------------------------------------ оголошення
ANNOUNCEMENTS = [
    {"tag": "ДЕКАНАТ", "title": "Вибір дисциплін на весняний семестр", "text": "Запис відкрито до 15 жовтня в розділі «Дисципліни»."},
    {"tag": "БІБЛІОТЕКА", "title": "Доступ до O'Reilly Learning", "text": "Увійдіть корпоративним акаунтом через портал бібліотеки."},
    {"tag": "СТУДРАДА", "title": "Хакатон ClaudeHack 2026", "text": "17–18 жовтня, коворкінг корпусу Б. Реєстрація командами до 4 осіб."},
]

NOTIFICATIONS = [
    {"id": "n1", "text": "Оцінено: Лабораторна №2 з машинного навчання — 7/8", "ago_min": 50, "read": False, "link": "assignments.html"},
    {"id": "n2", "text": "Нове повідомлення від доц. Коваль І. М.", "ago_min": 180, "read": False, "link": "messages.html"},
    {"id": "n3", "text": "Довідка з місця навчання готова до завантаження", "ago_min": 1500, "read": False, "link": "documents.html"},
    {"id": "n4", "text": "Нарахована стипендія за вересень: 2 000 грн", "ago_min": 5760, "read": True, "link": "finance.html"},
]


def course_map():
    m = {c["id"]: c for c in COURSES}
    m["curator"] = {"id": "curator", "title": "Кураторська година", "teacher_short": "доц. Коваль І. М."}
    return m


def seed():
    """Дані, які отримує клієнтська частина (window.SEED)."""
    cm = course_map()
    return {
        "student": STUDENT,
        "university": UNIVERSITY,
        "courses": {k: {"title": v["title"], "teacher": v["teacher_short"]} for k, v in cm.items()},
        "pairs": PAIRS,
        "schedule": SCHEDULE,
        "assignments": ASSIGNMENTS,
        "messages": MESSAGES,
        "recipients": RECIPIENTS,
        "finance": FINANCE,
        "documentTypes": DOCUMENT_TYPES,
        "documentRequests": DOCUMENT_REQUESTS,
        "books": BOOKS,
        "loans": LOANS,
        "electives": ELECTIVES,
        "notifications": NOTIFICATIONS,
        "grades": build_grades(),
    }
