require("dotenv").config();
const fs = require("fs");
const csv = require("csv-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = process.env.SQLITE_PATH || "./recipe.sqlite";
const db = new sqlite3.Database(path.resolve(__dirname, dbPath));

db.serialize(() => {
  console.log("Creating recipe table...");
  db.run(`
    CREATE TABLE IF NOT EXISTS recipe (
      id INTEGER PRIMARY KEY,
      Srno INTEGER,
      RecipeName TEXT,
      TranslatedRecipeName TEXT,
      Ingredients TEXT,
      TranslatedIngredients TEXT,
      PrepTimeInMins TEXT,
      CookTimeInMins TEXT,
      TotalTimeInMins TEXT,
      Servings TEXT,
      Cuisine TEXT,
      Course TEXT,
      Diet TEXT,
      Instructions TEXT,
      TranslatedInstructions TEXT,
      URL TEXT,
      ImageURL TEXT,
      created_at TEXT
    )
  `);

  console.log("Table ready. Importing recipes.csv...");

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO recipe (
      id, Srno, RecipeName, TranslatedRecipeName,
      Ingredients, TranslatedIngredients,
      PrepTimeInMins, CookTimeInMins, TotalTimeInMins,
      Servings, Cuisine, Course, Diet,
      Instructions, TranslatedInstructions,
      URL, ImageURL, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  const stream = fs.createReadStream("recipes.csv").pipe(csv());

  stream.on("data", (row) => {
    stmt.run(
      row.id || null,
      row.Srno || null,
      row.RecipeName || "",
      row.TranslatedRecipeName || "",
      row.Ingredients || "",
      row.TranslatedIngredients || "",
      row.PrepTimeInMins || null,
      row.CookTimeInMins || null,
      row.TotalTimeInMins || null,
      row.Servings || null,
      row.Cuisine || "",
      row.Course || "",
      row.Diet || "",
      row.Instructions || "",
      row.TranslatedInstructions || "",
      row.URL || "",
      row.ImageURL || "",
      row.created_at || null
    );
    count++;
    if (count % 500 === 0) {
      console.log(`Imported ${count} recipes...`);
    }
  });

  stream.on("end", () => {
    stmt.finalize();
    console.log(`\n✅ Import completed! Total: ${count} recipes`);

    db.get("SELECT COUNT(*) as total FROM recipe", (err, row) => {
      if (err) console.error(err);
      else console.log(`📊 Verified: ${row.total} recipes in database`);
      db.close();
    });
  });

  stream.on("error", (err) => {
    console.error("Error reading CSV:", err);
    db.close();
  });
});
