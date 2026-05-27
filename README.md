# Workout

A standalone static site that brings exercise notes, the current training plan, and training history into one place.

## Source Files

- `content/exercise-notes.md`: source file for the exercise library. Markdown `#` headings become categories, `##` headings become exercises, and `###` or deeper headings stay inside the exercise details.
- `content/current-plan.md`: source file for the current training plan.
- `data/training-log.csv`: source file for training history.
- `media/`: exercise images, GIFs, and videos.

The site reads generated files in `data/*.js`, which are created by `tools/rebuild.mjs`.

## Use

Open `index.html` directly in a browser.

## Update

After editing the source files above, run:

```powershell
npm run rebuild
```

This regenerates the exercise library, current plan, and training history data used by the page.

To create the same publishable directory used by GitHub Pages, run:

```powershell
npm run build
```

The generated site is written to `dist/`, which does not need to be committed.

## GitHub Pages

This project is configured with GitHub Actions. After a push to `main` or `master`, GitHub will:

1. Read `content/exercise-notes.md`
2. Read `content/current-plan.md`
3. Read `data/training-log.csv`
4. Generate the data files used by the site
5. Publish `dist/` to GitHub Pages

On first setup, open the repository's `Settings` -> `Pages` and set `Build and deployment` -> `Source` to `GitHub Actions`.
