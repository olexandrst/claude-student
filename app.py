"""Клодитет — прототип кабінету студента.

Запуск локально:   python app.py            → http://127.0.0.1:5000
Статична збірка:   python freeze.py         → ./build (для GitHub Pages)
"""
from flask import Flask, render_template

import data

app = Flask(__name__)

# Маршрути мають суфікс .html, щоб однакові відносні посилання працювали
# і на Flask-сервері, і в статичній збірці на GitHub Pages.
NAV = [
    {"endpoint": "dashboard", "path": "/dashboard.html", "title": "Головна", "icon": "home"},
    {"endpoint": "schedule", "path": "/schedule.html", "title": "Розклад", "icon": "calendar"},
    {"endpoint": "grades", "path": "/grades.html", "title": "Оцінки", "icon": "star"},
    {"endpoint": "courses", "path": "/courses.html", "title": "Дисципліни", "icon": "book"},
    {"endpoint": "assignments", "path": "/assignments.html", "title": "Завдання", "icon": "check"},
    {"endpoint": "messages", "path": "/messages.html", "title": "Повідомлення", "icon": "mail"},
    {"endpoint": "finance", "path": "/finance.html", "title": "Фінанси", "icon": "wallet"},
    {"endpoint": "documents", "path": "/documents.html", "title": "Довідки", "icon": "file"},
    {"endpoint": "library", "path": "/library.html", "title": "Бібліотека", "icon": "library"},
]


@app.context_processor
def inject_globals():
    return {
        "nav": NAV,
        "student": data.STUDENT,
        "university": data.UNIVERSITY,
        "seed": data.seed(),
    }


@app.route("/")
@app.route("/index.html")
def login():
    return render_template("login.html")


@app.route("/dashboard.html")
def dashboard():
    return render_template(
        "dashboard.html",
        page="dashboard",
        courses=data.COURSES,
        grades=data.build_grades(),
        announcements=data.ANNOUNCEMENTS,
    )


@app.route("/schedule.html")
def schedule():
    return render_template(
        "schedule.html",
        page="schedule",
        pairs=data.PAIRS,
        days=data.DAYS,
        schedule=data.SCHEDULE,
        course_map=data.course_map(),
    )


@app.route("/grades.html")
def grades():
    return render_template(
        "grades.html",
        page="grades",
        grades=data.build_grades(),
        courses=data.COURSES,
    )


@app.route("/courses.html")
def courses():
    return render_template(
        "courses.html",
        page="courses",
        courses=data.COURSES,
        electives=data.ELECTIVES,
    )


@app.route("/assignments.html")
def assignments():
    return render_template("assignments.html", page="assignments")


@app.route("/messages.html")
def messages():
    return render_template("messages.html", page="messages")


@app.route("/finance.html")
def finance():
    return render_template("finance.html", page="finance", finance=data.FINANCE)


@app.route("/documents.html")
def documents():
    return render_template("documents.html", page="documents", types=data.DOCUMENT_TYPES)


@app.route("/library.html")
def library():
    return render_template("library.html", page="library")


@app.route("/profile.html")
def profile():
    return render_template("profile.html", page="profile")


@app.route("/404.html")
def not_found_page():
    return render_template("404.html"), 404


@app.errorhandler(404)
def not_found(_):
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(debug=True)
