require("dotenv").config();
const fs = require("fs");
const csv = require("csv-parser");
const { Pool } = require("pg");

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function createTable() {
  console.log("Creating recipes table...");

  const createTableQuery = `
        DROP TABLE IF EXISTS recipes;
        
        CREATE TABLE recipes (
            id SERIAL PRIMARY KEY,
            "Srno" INTEGER,
            "RecipeName" VARCHAR(500),
            "TranslatedRecipeName" VARCHAR(500),
            "Ingredients" TEXT,
            "TranslatedIngredients" TEXT,
            "PrepTimeInMins" VARCHAR(50),
            "CookTimeInMins" VARCHAR(50),
            "TotalTimeInMins" VARCHAR(50),
            "Servings" VARCHAR(50),
            "Cuisine" VARCHAR(100),
            "Course" VARCHAR(100),
            "Diet" VARCHAR(100),
            "Instructions" TEXT,
            "TranslatedInstructions" TEXT,
            "URL" TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_recipe_name ON recipes USING gin(to_tsvector('english', "RecipeName"));
        CREATE INDEX idx_cuisine ON recipes("Cuisine");
        CREATE INDEX idx_course ON recipes("Course");
    `;

  try {
    await pool.query(createTableQuery);
    console.log("✅ Table created successfully!");
  } catch (err) {
    console.error("❌ Error creating table:", err);
    throw err;
  }
}

async function importData() {
  const csvFile = "IndianFoodDataset.csv";

  if (!fs.existsSync(csvFile)) {
    console.error(`❌ CSV file not found: ${csvFile}`);
    console.log(
      "Please ensure IndianFoodDataset.csv is in the project root directory."
    );
    return;
  }

  console.log(`\nImporting data from ${csvFile}...`);

  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        console.log(`Found ${results.length} recipes to import`);

        let imported = 0;
        let failed = 0;

        for (const recipe of results) {
          try {
            await pool.query(
              `INSERT INTO recipes (
                                "Srno", "RecipeName", "TranslatedRecipeName", "Ingredients", 
                                "TranslatedIngredients", "PrepTimeInMins", "CookTimeInMins",
                                "TotalTimeInMins", "Servings", "Cuisine", "Course", 
                                "Diet", "Instructions", "TranslatedInstructions", "URL"
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
              [
                recipe.Srno || null,
                recipe.RecipeName || "",
                recipe.TranslatedRecipeName || "",
                recipe.Ingredients || "",
                recipe.TranslatedIngredients || "",
                recipe.PrepTimeInMins || null,
                recipe.CookTimeInMins || null,
                recipe.TotalTimeInMins || null,
                recipe.Servings || null,
                recipe.Cuisine || "",
                recipe.Course || "",
                recipe.Diet || "",
                recipe.Instructions || "",
                recipe.TranslatedInstructions || "",
                recipe.URL || "",
              ]
            );
            imported++;

            if (imported % 100 === 0) {
              console.log(`Imported ${imported} recipes...`);
            }
          } catch (err) {
            failed++;
            console.error(
              `Error importing recipe: ${recipe.RecipeName}`,
              err.message
            );
          }
        }

        console.log(`\n✅ Import completed!`);
        console.log(`   Successful: ${imported}`);
        console.log(`   Failed: ${failed}`);

        resolve();
      })
      .on("error", (error) => {
        console.error("❌ Error reading CSV:", error);
        reject(error);
      });
  });
}

async function migrate() {
  try {
    console.log("🚀 Starting migration to Neon PostgreSQL...\n");
    console.log(
      "Database URL:",
      process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@")
    );

    await createTable();
    await importData();

    console.log("\n🎉 Migration completed successfully!");

    // Test query
    const result = await pool.query("SELECT COUNT(*) FROM recipes");
    console.log(`\n📊 Total recipes in database: ${result.rows[0].count}`);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
  } finally {
    await pool.end();
    console.log("\n👋 Database connection closed");
  }
}

// Run migration
migrate();
