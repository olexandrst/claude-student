"""Збирає статичну версію сайту в ./build для GitHub Pages."""
import sys

from flask_frozen import Freezer

from app import app

app.config.update(
    FREEZER_DESTINATION="build",
    FREEZER_RELATIVE_URLS=True,
    FREEZER_REMOVE_EXTRA_FILES=True,
    FREEZER_IGNORE_404_NOT_FOUND=True,
)

freezer = Freezer(app)


@freezer.register_generator
def not_found_page():
    yield {}


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "serve":
        freezer.run(debug=True)
    else:
        urls = freezer.freeze()
        # .nojekyll — щоб GitHub Pages не обробляв сайт Jekyll'ом
        open("build/.nojekyll", "w").close()
        print(f"Готово: {len(urls)} файлів у ./build")
