require("dotenv").config();
var express = require("express");
var router = express.Router();

// Database configuration - supports both PostgreSQL and SQLite
const DB_TYPE = process.env.DB_TYPE || "postgresql";

let db;
if (DB_TYPE === "postgresql") {
  const { Pool } = require("pg");
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  console.log("Using PostgreSQL database");
} else {
  const sqlite3 = require("sqlite3").verbose();
  const path = require("path");
  const dbPath = process.env.SQLITE_PATH || "./recipe.sqlite";
  console.log("Using SQLite database at:", dbPath);
}

/* Helper function to build WHERE clause dynamically */
function buildWhereClause(filters, params) {
  const conditions = [];
  let paramCount = 0;

  if (filters.cuisine) {
    paramCount++;
    conditions.push(`LOWER("Cuisine") = LOWER($${paramCount})`);
    params.push(filters.cuisine);
  }

  if (filters.course) {
    paramCount++;
    conditions.push(`LOWER("Course") = LOWER($${paramCount})`);
    params.push(filters.course);
  }

  if (filters.diet) {
    paramCount++;
    conditions.push(`LOWER("Diet") = LOWER($${paramCount})`);
    params.push(filters.diet);
  }

  if (filters.search) {
    paramCount++;
    conditions.push(
      `(LOWER("RecipeName") LIKE LOWER($${paramCount}) OR LOWER("TranslatedRecipeName") LIKE LOWER($${paramCount}))`
    );
    params.push(`%${filters.search}%`);
  }

  return conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
}

/* GET API stats and available filters */
router.get("/stats", async function (req, res, next) {
  try {
    if (DB_TYPE === "postgresql") {
      // Get total count
      const totalCount = await db.query(
        "SELECT COUNT(*) as count FROM recipes"
      );

      // Get unique cuisines with count
      const cuisines = await db.query(
        `SELECT "Cuisine", COUNT(*) as count 
         FROM recipes 
         WHERE "Cuisine" IS NOT NULL AND "Cuisine" != ''
         GROUP BY "Cuisine" 
         ORDER BY count DESC`
      );

      // Get unique courses with count
      const courses = await db.query(
        `SELECT "Course", COUNT(*) as count 
         FROM recipes 
         WHERE "Course" IS NOT NULL AND "Course" != ''
         GROUP BY "Course" 
         ORDER BY count DESC`
      );

      // Get unique diets with count
      const diets = await db.query(
        `SELECT "Diet", COUNT(*) as count 
         FROM recipes 
         WHERE "Diet" IS NOT NULL AND "Diet" != ''
         GROUP BY "Diet" 
         ORDER BY count DESC`
      );

      res.json({
        totalRecipes: parseInt(totalCount.rows[0].count),
        cuisines: cuisines.rows,
        courses: courses.rows,
        diets: diets.rows,
        endpoints: {
          "/recipes": "Get all recipes with optional filters",
          "/recipes/:id": "Get a specific recipe by ID",
          "/search": "Search recipes by name",
          "/stats": "Get API statistics and available filters",
          "/cuisines": "Get list of all cuisines",
          "/courses": "Get list of all courses",
          "/diets": "Get list of all diets",
        },
        filters: {
          cuisine: "Filter by cuisine (e.g., ?cuisine=North Indian Recipes)",
          course: "Filter by course (e.g., ?course=Dinner)",
          diet: "Filter by diet (e.g., ?diet=Vegetarian)",
          search: "Search by recipe name (e.g., ?search=curry)",
          page: "Page number (default: 1)",
          limit: "Results per page (default: 20, max: 100)",
        },
      });
    } else {
      return res.status(501).json({
        error: "Stats endpoint only available for PostgreSQL",
      });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

/* GET all cuisines */
router.get("/cuisines", async function (req, res, next) {
  try {
    if (DB_TYPE === "postgresql") {
      const result = await db.query(
        `SELECT "Cuisine", COUNT(*) as count 
         FROM recipes 
         WHERE "Cuisine" IS NOT NULL AND "Cuisine" != ''
         GROUP BY "Cuisine" 
         ORDER BY count DESC`
      );
      res.json({
        total: result.rows.length,
        cuisines: result.rows,
      });
    } else {
      return res.status(501).json({
        error: "Cuisines endpoint only available for PostgreSQL",
      });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

/* GET all courses */
router.get("/courses", async function (req, res, next) {
  try {
    if (DB_TYPE === "postgresql") {
      const result = await db.query(
        `SELECT "Course", COUNT(*) as count 
         FROM recipes 
         WHERE "Course" IS NOT NULL AND "Course" != ''
         GROUP BY "Course" 
         ORDER BY count DESC`
      );
      res.json({
        total: result.rows.length,
        courses: result.rows,
      });
    } else {
      return res.status(501).json({
        error: "Courses endpoint only available for PostgreSQL",
      });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

/* GET all diets */
router.get("/diets", async function (req, res, next) {
  try {
    if (DB_TYPE === "postgresql") {
      const result = await db.query(
        `SELECT "Diet", COUNT(*) as count 
         FROM recipes 
         WHERE "Diet" IS NOT NULL AND "Diet" != ''
         GROUP BY "Diet" 
         ORDER BY count DESC`
      );
      res.json({
        total: result.rows.length,
        diets: result.rows,
      });
    } else {
      return res.status(501).json({
        error: "Diets endpoint only available for PostgreSQL",
      });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

/* GET specific recipe by ID */
router.get("/recipes/:id", async function (req, res, next) {
  try {
    const recipeId = parseInt(req.params.id);

    if (isNaN(recipeId)) {
      return res.status(400).json({
        error: "Invalid recipe ID",
      });
    }

    if (DB_TYPE === "postgresql") {
      const result = await db.query(
        `SELECT id, "RecipeName", "TranslatedRecipeName", 
                "Ingredients", "TranslatedIngredients",
                "PrepTimeInMins", "CookTimeInMins", "TotalTimeInMins",
                "Servings", "Cuisine", "Course", "Diet",
                "Instructions", "TranslatedInstructions",
                "URL", "ImageURL", created_at
         FROM recipes 
         WHERE id = $1`,
        [recipeId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Recipe not found",
        });
      }

      res.json(result.rows[0]);
    } else {
      const sqlite3 = require("sqlite3").verbose();
      const path = require("path");
      const sqliteDb = new sqlite3.Database(
        path.resolve(__dirname, "../recipe.sqlite")
      );

      sqliteDb.get(
        `SELECT * FROM recipe WHERE id = ?`,
        [recipeId],
        (err, row) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Database error" });
          }

          if (!row) {
            return res.status(404).json({
              error: "Recipe not found",
            });
          }

          res.json(row);
        }
      );

      sqliteDb.close();
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

/* GET all recipes with dynamic filters and pagination */
router.get("/recipes", async function (req, res, next) {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Filter parameters
    const filters = {
      cuisine: req.query.cuisine,
      course: req.query.course,
      diet: req.query.diet,
      search: req.query.search,
    };

    // Sorting parameters
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = (req.query.sortOrder || 'asc').toLowerCase();

    // Validate sorting parameters
    const validSortFields = ['name', 'prepTime', 'cookTime', 'totalTime', 'servings'];
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        error: `Invalid sortBy field. Must be one of: ${validSortFields.join(', ')}`,
      });
    }

    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({
        error: "sortOrder must be either 'asc' or 'desc'",
      });
    }

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({
        error: "Page number must be greater than 0",
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: "Limit must be between 1 and 100",
      });
    }

    if (DB_TYPE === "postgresql") {
      const params = [];
      const whereClause = buildWhereClause(filters, params);

      // Build ORDER BY clause based on sortBy parameter
      let orderByClause;
      switch (sortBy) {
        case 'prepTime':
          orderByClause = `ORDER BY CAST("PrepTimeInMins" AS INTEGER) ${sortOrder.toUpperCase()}`;
          break;
        case 'cookTime':
          orderByClause = `ORDER BY CAST("CookTimeInMins" AS INTEGER) ${sortOrder.toUpperCase()}`;
          break;
        case 'totalTime':
          orderByClause = `ORDER BY CAST("TotalTimeInMins" AS INTEGER) ${sortOrder.toUpperCase()}`;
          break;
        case 'servings':
          orderByClause = `ORDER BY CAST("Servings" AS INTEGER) ${sortOrder.toUpperCase()}`;
          break;
        case 'name':
        default:
          orderByClause = `ORDER BY "RecipeName" ${sortOrder.toUpperCase()}`;
          break;
      }

      // Get total count with filters
      const countQuery = `SELECT COUNT(*) FROM recipes ${whereClause}`;
      const countResult = await db.query(countQuery, params);
      const totalRecipes = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalRecipes / limit);

      // Get recipes for current page with filters
      const dataParams = [...params, limit, offset];
      const dataQuery = `
        SELECT id, "RecipeName", "TranslatedRecipeName", 
                "Ingredients", "TranslatedIngredients",
                "PrepTimeInMins", "CookTimeInMins", "TotalTimeInMins",
                "Servings", "Cuisine", "Course", "Diet",
                "Instructions", "TranslatedInstructions",
                "URL", "ImageURL", created_at
         FROM recipes 
         ${whereClause}
         ${orderByClause}
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      const result = await db.query(dataQuery, dataParams);

      res.json({
        page: page,
        limit: limit,
        totalRecipes: totalRecipes,
        totalPages: totalPages,
        sortBy: sortBy,
        sortOrder: sortOrder,
        filters: filters,
        recipes: result.rows,
      });
    } else {
      const sqlite3 = require("sqlite3").verbose();
      const dbPath = require("path");
      const sqliteDb = new sqlite3.Database(
        dbPath.resolve(__dirname, "../recipe.sqlite")
      );

      const whereParts = [];
      const whereParams = [];

      if (filters.cuisine) {
        whereParts.push(`LOWER(Cuisine) = LOWER(?)`);
        whereParams.push(filters.cuisine);
      }

      if (filters.course) {
        whereParts.push(`LOWER(Course) = LOWER(?)`);
        whereParams.push(filters.course);
      }

      if (filters.diet) {
        whereParts.push(`LOWER(Diet) = LOWER(?)`);
        whereParams.push(filters.diet);
      }

      if (filters.search) {
        whereParts.push(`(LOWER(RecipeName) LIKE LOWER(?) OR LOWER(TranslatedRecipeName) LIKE LOWER(?))`);
        const searchTerm = `%${filters.search}%`;
        whereParams.push(searchTerm, searchTerm);
      }

      const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

      let orderBy;
      switch (sortBy) {
        case 'prepTime':
          orderBy = `CAST(PrepTimeInMins AS INTEGER) ${sortOrder.toUpperCase()}`;
          break;
        case 'cookTime':
          orderBy = `CAST(CookTimeInMins AS INTEGER) ${sortOrder.toUpperCase()}`;
          break;
        case 'totalTime':
          orderBy = `CAST(TotalTimeInMins AS INTEGER) ${sortOrder.toUpperCase()}`;
          break;
        case 'servings':
          orderBy = `CAST(Servings AS INTEGER) ${sortOrder.toUpperCase()}`;
          break;
        case 'name':
        default:
          orderBy = `RecipeName ${sortOrder.toUpperCase()}`;
          break;
      }

      const countQuery = `SELECT COUNT(*) as count FROM recipe ${whereClause}`;
      sqliteDb.get(countQuery, whereParams, (err, row) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: "Database error" });
        }

        const totalRecipes = row.count;
        const totalPages = Math.ceil(totalRecipes / limit);
        const dataQuery = `SELECT * FROM recipe ${whereClause} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`;

        sqliteDb.all(dataQuery, whereParams, (err, rows) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Database error" });
          }

          res.json({
            page: page,
            limit: limit,
            totalRecipes: totalRecipes,
            totalPages: totalPages,
            sortBy: sortBy,
            sortOrder: sortOrder,
            filters: filters,
            recipes: rows,
          });
        });
      });

      sqliteDb.close();
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

/* GET recipe search with pagination */
router.get("/search", async function (req, res, next) {
  try {
    const searchQuery = req.query.q;

    if (!searchQuery || searchQuery.trim().length === 0) {
      return res.status(400).json({
        error: "Query parameter 'q' is required and cannot be empty",
      });
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({
        error: "Page number must be greater than 0",
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: "Limit must be between 1 and 100",
      });
    }

    if (DB_TYPE === "postgresql") {
      // Get total count of search results
      const countResult = await db.query(
        `SELECT COUNT(*) FROM recipes 
         WHERE LOWER("RecipeName") LIKE LOWER($1) 
         OR LOWER("TranslatedRecipeName") LIKE LOWER($1)`,
        [`%${searchQuery}%`]
      );
      const totalRecipes = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalRecipes / limit);

      // PostgreSQL query with pagination
      const result = await db.query(
        `SELECT id, "RecipeName", "TranslatedRecipeName", 
                "Ingredients", "TranslatedIngredients",
                "PrepTimeInMins", "CookTimeInMins", "TotalTimeInMins",
                "Servings", "Cuisine", "Course", "Diet",
                "Instructions", "TranslatedInstructions",
                "URL", "ImageURL", created_at
         FROM recipes 
         WHERE LOWER("RecipeName") LIKE LOWER($1) 
         OR LOWER("TranslatedRecipeName") LIKE LOWER($1)
         ORDER BY "RecipeName" 
         LIMIT $2 OFFSET $3`,
        [`%${searchQuery}%`, limit, offset]
      );

      res.json({
        page: page,
        limit: limit,
        totalRecipes: totalRecipes,
        totalPages: totalPages,
        searchQuery: searchQuery,
        recipes: result.rows,
      });
    } else {
      // SQLite query (fallback)
      const sqlite3 = require("sqlite3").verbose();
      const path = require("path");
      const sqliteDb = new sqlite3.Database(
        path.resolve(__dirname, "../recipe.sqlite")
      );

      // Get total count of search results
      const countQuery = `SELECT COUNT(*) as count FROM recipe WHERE RecipeName LIKE '%${searchQuery}%'`;

      sqliteDb.get(countQuery, [], (err, row) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: "Database error" });
        }

        const totalRecipes = row.count;
        const totalPages = Math.ceil(totalRecipes / limit);

        // Get recipes for current page
        const SQLquery = `SELECT * FROM recipe WHERE RecipeName LIKE '%${searchQuery}%' ORDER BY RecipeName LIMIT ${limit} OFFSET ${offset}`;

        sqliteDb.all(SQLquery, [], (err, rows) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Database error" });
          }

          res.json({
            page: page,
            limit: limit,
            totalRecipes: totalRecipes,
            totalPages: totalPages,
            searchQuery: searchQuery,
            recipes: rows,
          });
        });

        sqliteDb.close();
      });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

/* GET recipe with original and translated comparison */
router.get("/recipes/:id/translations", async function (req, res, next) {
  try {
    const recipeId = parseInt(req.params.id);

    if (isNaN(recipeId)) {
      return res.status(400).json({
        error: "Invalid recipe ID",
      });
    }

    if (DB_TYPE === "postgresql") {
      const result = await db.query(
        `SELECT id, "RecipeName", "TranslatedRecipeName", 
                "Ingredients", "TranslatedIngredients",
                "Instructions", "TranslatedInstructions",
                "PrepTimeInMins", "CookTimeInMins", "TotalTimeInMins",
                "Servings", "Cuisine", "Course", "Diet",
                "URL", "ImageURL", created_at
         FROM recipes 
         WHERE id = $1`,
        [recipeId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Recipe not found",
        });
      }

      const recipe = result.rows[0];

      // Format the response to show original vs translated
      res.json({
        id: recipe.id,
        recipeName: {
          original: recipe.RecipeName,
          translated: recipe.TranslatedRecipeName,
        },
        ingredients: {
          original: recipe.Ingredients,
          translated: recipe.TranslatedIngredients,
        },
        instructions: {
          original: recipe.Instructions,
          translated: recipe.TranslatedInstructions,
        },
        metadata: {
          prepTimeInMins: recipe.PrepTimeInMins,
          cookTimeInMins: recipe.CookTimeInMins,
          totalTimeInMins: recipe.TotalTimeInMins,
          servings: recipe.Servings,
          cuisine: recipe.Cuisine,
          course: recipe.Course,
          diet: recipe.Diet,
          url: recipe.URL,
          imageURL: recipe.ImageURL,
          createdAt: recipe.created_at,
        },
      });
    } else {
      const sqlite3 = require("sqlite3").verbose();
      const path = require("path");
      const sqliteDb = new sqlite3.Database(
        path.resolve(__dirname, "../recipe.sqlite")
      );

      sqliteDb.get(
        `SELECT * FROM recipe WHERE id = ?`,
        [recipeId],
        (err, row) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Database error" });
          }

          if (!row) {
            return res.status(404).json({
              error: "Recipe not found",
            });
          }

          res.json({
            id: row.id,
            recipeName: {
              original: row.RecipeName,
              translated: row.TranslatedRecipeName || row.RecipeName,
            },
            ingredients: {
              original: row.Ingredients,
              translated: row.TranslatedIngredients || row.Ingredients,
            },
            instructions: {
              original: row.Instructions,
              translated: row.TranslatedInstructions || row.Instructions,
            },
            metadata: {
              prepTimeInMins: row.PrepTimeInMins,
              cookTimeInMins: row.CookTimeInMins,
              totalTimeInMins: row.TotalTimeInMins,
              servings: row.Servings,
              cuisine: row.Cuisine,
              course: row.Course,
              diet: row.Diet,
              url: row.URL,
              imageURL: row.ImageURL,
            },
          });
        }
      );

      sqliteDb.close();
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

/* GET only original (untranslated) recipe data */
router.get("/recipes/:id/original", async function (req, res, next) {
  try {
    const recipeId = parseInt(req.params.id);

    if (isNaN(recipeId)) {
      return res.status(400).json({
        error: "Invalid recipe ID",
      });
    }

    if (DB_TYPE === "postgresql") {
      const result = await db.query(
        `SELECT id, "RecipeName", 
                "Ingredients",
                "Instructions",
                "PrepTimeInMins", "CookTimeInMins", "TotalTimeInMins",
                "Servings", "Cuisine", "Course", "Diet",
                "URL", "ImageURL", created_at
         FROM recipes 
         WHERE id = $1`,
        [recipeId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Recipe not found",
        });
      }

      res.json(result.rows[0]);
    } else {
      const sqlite3 = require("sqlite3").verbose();
      const path = require("path");
      const sqliteDb = new sqlite3.Database(
        path.resolve(__dirname, "../recipe.sqlite")
      );

      sqliteDb.get(
        `SELECT id, RecipeName, 
                Ingredients,
                Instructions,
                PrepTimeInMins, CookTimeInMins, TotalTimeInMins,
                Servings, Cuisine, Course, Diet, URL, ImageURL
         FROM recipe WHERE id = ?`,
        [recipeId],
        (err, row) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Database error" });
          }

          if (!row) {
            return res.status(404).json({
              error: "Recipe not found",
            });
          }

          res.json(row);
        }
      );

      sqliteDb.close();
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

/* GET only translated (English) recipe data */
router.get("/recipes/:id/translated", async function (req, res, next) {
  try {
    const recipeId = parseInt(req.params.id);

    if (isNaN(recipeId)) {
      return res.status(400).json({
        error: "Invalid recipe ID",
      });
    }

    if (DB_TYPE === "postgresql") {
      const result = await db.query(
        `SELECT id, "TranslatedRecipeName" as "RecipeName", 
                "TranslatedIngredients" as "Ingredients", 
                "TranslatedInstructions" as "Instructions",
                "PrepTimeInMins", "CookTimeInMins", "TotalTimeInMins",
                "Servings", "Cuisine", "Course", "Diet",
                "URL", "ImageURL", created_at
         FROM recipes 
         WHERE id = $1`,
        [recipeId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Recipe not found",
        });
      }

      res.json(result.rows[0]);
    } else {
      const sqlite3 = require("sqlite3").verbose();
      const path = require("path");
      const sqliteDb = new sqlite3.Database(
        path.resolve(__dirname, "../recipe.sqlite")
      );

      sqliteDb.get(
        `SELECT id, TranslatedRecipeName as RecipeName, 
                TranslatedIngredients as Ingredients, 
                TranslatedInstructions as Instructions,
                PrepTimeInMins, CookTimeInMins, TotalTimeInMins,
                Servings, Cuisine, Course, Diet, URL, ImageURL
         FROM recipe WHERE id = ?`,
        [recipeId],
        (err, row) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Database error" });
          }

          if (!row) {
            return res.status(404).json({
              error: "Recipe not found",
            });
          }

          res.json(row);
        }
      );

      sqliteDb.close();
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

/* Root endpoint - API documentation */
router.get("/", async function (req, res, next) {
  res.json({
    message: "Indian Recipe API",
    version: "2.0",
    endpoints: {
      "/": "API documentation (this page)",
      "/stats": "Get API statistics and available filters",
      "/recipes": "Get all recipes with optional filters and pagination",
      "/recipes/:id": "Get a specific recipe by ID",
      "/recipes/:id/translations":
        "Get recipe with original and translated side-by-side comparison",
      "/recipes/:id/original":
        "Get only the original (untranslated) recipe data",
      "/recipes/:id/translated":
        "Get only the translated (English) recipe data",
      "/search?q=term": "Search recipes by name",
      "/cuisines": "Get list of all cuisines with counts",
      "/courses": "Get list of all courses with counts",
      "/diets": "Get list of all diets with counts",
    },
    filterParameters: {
      cuisine:
        "Filter recipes by cuisine (e.g., ?cuisine=North Indian Recipes)",
      course: "Filter recipes by course (e.g., ?course=Dinner)",
      diet: "Filter recipes by diet (e.g., ?diet=Vegetarian)",
      search: "Search in recipe name (e.g., ?search=curry)",
      page: "Page number for pagination (default: 1)",
      limit: "Results per page (default: 20, max: 100)",
      sortBy: "Sort recipes by field: name, prepTime, cookTime, totalTime, servings (default: name)",
      sortOrder: "Sort order: asc or desc (default: asc)",
    },
    examples: {
      getAllRecipes: "/recipes",
      paginatedRecipes: "/recipes?page=2&limit=50",
      vegetarianRecipes: "/recipes?diet=Vegetarian",
      dinnerRecipes: "/recipes?course=Dinner",
      northIndianRecipes: "/recipes?cuisine=North Indian Recipes",
      combinedFilters: "/recipes?diet=Vegetarian&course=Dinner&page=1&limit=20",
      sortByCookTime: "/recipes?sortBy=cookTime&sortOrder=asc",
      sortByTotalTime: "/recipes?sortBy=totalTime&sortOrder=desc",
      quickRecipes: "/recipes?sortBy=totalTime&sortOrder=asc&limit=10",
      sortByPrepTime: "/recipes?sortBy=prepTime&sortOrder=asc",
      vegetarianSortedByCookTime: "/recipes?diet=Vegetarian&sortBy=cookTime&sortOrder=asc",
      searchRecipes: "/search?q=curry",
      getRecipeById: "/recipes/123",
      getRecipeTranslations: "/recipes/123/translations",
      getOriginalRecipe: "/recipes/123/original",
      getTranslatedRecipe: "/recipes/123/translated",
      getStats: "/stats",
    },
  });
});

module.exports = router;
