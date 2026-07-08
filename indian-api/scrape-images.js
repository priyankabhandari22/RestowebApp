require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const { Pool } = require("pg");

// PostgreSQL connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Function to scrape image URL from recipe page
async function scrapeImageURL(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const $ = cheerio.load(data);

    // Try different selectors for Archana's Kitchen
    let imageUrl =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $(".recipe-image img").attr("src") ||
      $(".post-thumbnail img").attr("src") ||
      $('img[itemprop="image"]').attr("src") ||
      $("article img").first().attr("src");

    return imageUrl || null;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error(`  ⚠️ 404 - Page not found (broken link)`);
      return "BROKEN_LINK"; // Mark as broken link
    }
    console.error(`  ❌ Error: ${error.message}`);
    return null;
  }
}

// Main function to update recipes with image URLs
async function updateRecipeImages(limit = 100, offset = 0) {
  try {
    console.log(
      `\n🔍 Fetching recipes (limit: ${limit}, offset: ${offset})...`
    );

    // Get recipes without image URLs
    const result = await db.query(
      `SELECT id, "RecipeName", "URL" 
       FROM recipes 
       WHERE "ImageURL" IS NULL 
       ORDER BY id 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const recipes = result.rows;
    console.log(`📊 Found ${recipes.length} recipes to process`);

    if (recipes.length === 0) {
      console.log("✅ All recipes have been processed!");
      return;
    }

    let updated = 0;
    let failed = 0;

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      console.log(
        `\n[${i + 1}/${recipes.length}] Processing: ${recipe.RecipeName}`
      );

      const imageUrl = await scrapeImageURL(recipe.URL);

      if (imageUrl === "BROKEN_LINK") {
        // Set placeholder for broken links
        const placeholder =
          "https://via.placeholder.com/600x400/FF9933/FFFFFF?text=Recipe+Image";
        await db.query(`UPDATE recipes SET "ImageURL" = $1 WHERE id = $2`, [
          placeholder,
          recipe.id,
        ]);
        console.log(`  🔧 Placeholder set for broken link`);
        updated++;
      } else if (imageUrl) {
        await db.query(`UPDATE recipes SET "ImageURL" = $1 WHERE id = $2`, [
          imageUrl,
          recipe.id,
        ]);
        console.log(`  ✅ Image URL saved: ${imageUrl.substring(0, 60)}...`);
        updated++;
      } else {
        console.log(`  ❌ No image found`);
        failed++;
      }

      // Add delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    console.log(`\n📊 Batch Summary:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${recipes.length}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the script
async function main() {
  console.log("🚀 Starting image URL scraping...\n");

  // Process in batches
  const batchSize = 50;
  const totalBatches = 10; // Adjust this to process more/less recipes

  for (let batch = 0; batch < totalBatches; batch++) {
    console.log(`\n========== BATCH ${batch + 1}/${totalBatches} ==========`);
    await updateRecipeImages(batchSize, batch * batchSize);

    // Check if there are more recipes to process
    const countResult = await db.query(
      `SELECT COUNT(*) FROM recipes WHERE "ImageURL" IS NULL`
    );
    const remaining = parseInt(countResult.rows[0].count);

    console.log(`\n📊 Remaining recipes without images: ${remaining}`);

    if (remaining === 0) {
      break;
    }
  }

  // Final statistics
  const stats = await db.query(`
    SELECT 
      COUNT(*) as total,
      COUNT("ImageURL") as with_images,
      COUNT(*) - COUNT("ImageURL") as without_images
    FROM recipes
  `);

  console.log("\n🎉 Scraping completed!");
  console.log("\n📊 Final Statistics:");
  console.log(`   Total recipes: ${stats.rows[0].total}`);
  console.log(`   With images: ${stats.rows[0].with_images}`);
  console.log(`   Without images: ${stats.rows[0].without_images}`);

  await db.end();
}

main();
