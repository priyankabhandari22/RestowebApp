# Indian Recipe API

A modern REST API built with Node.js and Express.js to search and retrieve Indian food recipes with images. The database contains **6,673+ Indian recipes** scraped from [Archana's Kitchen](https://www.archanaskitchen.com/), stored in a PostgreSQL database.

## Features

- 🔍 Search 6,673+ Indian recipes
- 🖼️ Recipe images included
- 🌐 CORS enabled - ready for cross-origin requests
- 📱 Simple REST API with multiple endpoints
- 🗄️ PostgreSQL database (with SQLite fallback)
- 🚀 Easy to deploy
- 🔧 Customizable configuration
- 🎯 **Advanced Filtering** - Filter by cuisine, course, diet type
- 📊 **API Statistics** - Get recipe counts and available filters
- 📄 **Pagination Support** - Efficiently browse large result sets
- 🔎 **Dynamic Search** - Search with multiple combined filters

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/Soham156/Indian-Recipe-API-with-Images.git
cd Indian-Recipe-API-with-Images

# Install dependencies
npm install
```

### 2. Database Setup

**Option A: PostgreSQL (Recommended)**

1. Get a free PostgreSQL database from [Neon](https://neon.tech) or [Supabase](https://supabase.com)
2. Copy `.env.example` to `.env`
3. Update `DATABASE_URL` with your connection string

```bash
cp .env.example .env
# Edit .env file with your database URL
```

4. Run the migration to create tables and import data:

```bash
node migrate.js
```

**Option B: SQLite**

```bash
# Set DB_TYPE to sqlite in .env
DB_TYPE=sqlite
SQLITE_PATH=./recipe.sqlite

# Run migration
node migrate.js
```

### 3. Start the Server

```bash
npm start
```

The API will run on `http://localhost:3000`

## API Usage

### Quick Overview

For detailed documentation of all endpoints and features, see **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)**

### Available Endpoints

| Endpoint                        | Description                                      |
| ------------------------------- | ------------------------------------------------ |
| `GET /`                         | API documentation and information                |
| `GET /recipes`                  | Get all recipes with optional filters            |
| `GET /recipes/:id`              | Get a specific recipe by ID                      |
| `GET /recipes/:id/translations` | Get recipe with original & translated comparison |
| `GET /recipes/:id/original`     | Get only original (untranslated) recipe          |
| `GET /recipes/:id/translated`   | Get only translated (English) recipe             |
| `GET /search?q=term`            | Search recipes by name                           |
| `GET /stats`                    | Get API statistics and filter options            |
| `GET /cuisines`                 | List all cuisines with counts                    |
| `GET /courses`                  | List all courses with counts                     |
| `GET /diets`                    | List all diet types with counts                  |

### Quick Examples

#### 1. Get All Recipes (Paginated)

```
GET /recipes
GET /recipes?page=2&limit=50
```

#### 2. Filter Recipes

```
# Vegetarian recipes only
GET /recipes?diet=Vegetarian

# North Indian dinner recipes
GET /recipes?cuisine=North Indian Recipes&course=Dinner

# Search for curry in vegetarian recipes
GET /recipes?search=curry&diet=Vegetarian
```

#### 3. Sort Recipes

```
# Sort by cooking time (ascending - quickest first)
GET /recipes?sortBy=cookTime&sortOrder=asc

# Sort by total time (descending - longest first)
GET /recipes?sortBy=totalTime&sortOrder=desc

# Get 10 quickest recipes
GET /recipes?sortBy=totalTime&sortOrder=asc&limit=10

# Sort by prep time
GET /recipes?sortBy=prepTime&sortOrder=asc

# Combine filtering and sorting - vegetarian recipes sorted by cook time
GET /recipes?diet=Vegetarian&sortBy=cookTime&sortOrder=asc
```

**Available Sort Fields:**
- `name` - Recipe name (default)
- `prepTime` - Preparation time in minutes
- `cookTime` - Cooking time in minutes
- `totalTime` - Total time in minutes
- `servings` - Number of servings

**Sort Order:**
- `asc` - Ascending (default)
- `desc` - Descending

#### 4. Get Specific Recipe

```
# Get full recipe with both original and translated data
GET /recipes/123

# Get side-by-side comparison of original and translated
GET /recipes/123/translations

# Get only original (untranslated) recipe
GET /recipes/123/original

# Get only translated (English) recipe
GET /recipes/123/translated
```

**Example Response for `/recipes/123/translations`:**

```json
{
  "id": 123,
  "recipeName": {
    "original": "मक्के की रोटी",
    "translated": "Makke Ki Roti"
  },
  "ingredients": {
    "original": "मक्के का आटा, पानी, नमक...",
    "translated": "Corn flour, Water, Salt..."
  },
  "instructions": {
    "original": "आटा गूंधें और गोल रोटी बनाएं...",
    "translated": "Knead the dough and make round rotis..."
  },
  "metadata": {
    "prepTimeInMins": "15",
    "cookTimeInMins": "20",
    "totalTimeInMins": "35",
    "servings": "4",
    "cuisine": "North Indian Recipes",
    "course": "Main Course",
    "diet": "Vegetarian",
    "url": "https://...",
    "imageURL": "https://..."
  }
}
```

#### 4. Search Recipes

```
GET /search?q=biryani
```

#### 5. Get Statistics

```
GET /stats
GET /cuisines
GET /diets
```

### Filter & Sort Parameters

| Parameter   | Description                     | Example                         |
| ----------- | ------------------------------- | ------------------------------- |
| `diet`      | Filter by diet type             | `?diet=Vegetarian`              |
| `cuisine`   | Filter by cuisine               | `?cuisine=North Indian Recipes` |
| `course`    | Filter by course                | `?course=Dinner`                |
| `search`    | Search in recipe names          | `?search=curry`                 |
| `page`      | Page number (default: 1)        | `?page=2`                       |
| `limit`     | Results per page (max: 100)     | `?limit=50`                     |
| `sortBy`    | Sort field (see options below)  | `?sortBy=cookTime`              |
| `sortOrder` | Sort order: asc or desc         | `?sortOrder=asc`                |

**Sort Options:**
- `name` - Recipe name (default)
- `prepTime` - Preparation time
- `cookTime` - Cooking time  
- `totalTime` - Total time
- `servings` - Number of servings

### Response Format

All list endpoints return data with pagination info:

```json
{
  "page": 1,
  "limit": 20,
  "totalRecipes": 150,
  "totalPages": 8,
  "sortBy": "cookTime",
  "sortOrder": "asc",
  "filters": {
    "cuisine": null,
    "course": "Dinner",
    "diet": "Vegetarian",
    "search": null
  },
  "recipes": [
    {
      "id": 1,
      "RecipeName": "Palak Paneer",
      "TranslatedRecipeName": "Spinach with Cottage Cheese",
      "Ingredients": "...",
      "PrepTimeInMins": "15",
      "CookTimeInMins": "30",
      "Servings": "4",
      "Cuisine": "North Indian Recipes",
      "Course": "Dinner",
      "Diet": "Vegetarian",
      "ImageURL": "https://...",
      "URL": "https://..."
    }
  ]
}
```

### Legacy Search Endpoint (Deprecated)

**Note:** The `/?q=term` endpoint is now deprecated. Use `/search?q=term` instead.

**Old Endpoint:** `GET /?q=<search_query>`

**Example:**

```
http://localhost:3000/?q=biryani
```

## Using from Other Websites

The API has CORS enabled and can be called from any website. See [API_USAGE.md](API_USAGE.md) for detailed examples in:

- Vanilla JavaScript
- React
- Vue.js
- jQuery
- Python
- cURL

### Quick Example (JavaScript)

```javascript
// Search for recipes
fetch("http://localhost:3000/search?q=biryani")
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));

// Get recipe with translations
fetch("http://localhost:3000/recipes/123/translations")
  .then((response) => response.json())
  .then((recipe) => {
    console.log("Original name:", recipe.recipeName.original);
    console.log("Translated name:", recipe.recipeName.translated);
    console.log("Original ingredients:", recipe.ingredients.original);
    console.log("Translated ingredients:", recipe.ingredients.translated);
  })
  .catch((error) => console.error("Error:", error));

// Get only original recipe
fetch("http://localhost:3000/recipes/123/original")
  .then((response) => response.json())
  .then((data) => console.log(data));

// Get only translated recipe
fetch("http://localhost:3000/recipes/123/translated")
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### Test the API

Open `example.html` in your browser to see a live demo of the API in action.

## Configuration

### Custom Port

```bash
# Windows PowerShell
$env:PORT=8080; npm start

# Linux/Mac
PORT=8080 npm start
```

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=*
DATABASE_PATH=./recipe.sqlite
```

## Deployment

This API can be deployed to:

- **Vercel** - Serverless deployment (recommended) ⭐
- **Railway** - Modern hosting with PostgreSQL
- **Render** - Free API hosting with PostgreSQL
- **Heroku** - Classic platform
- **DigitalOcean** - VPS hosting

### Deploy to Vercel

1. **Install Vercel CLI** (optional):

```bash
npm i -g vercel
```

2. **Deploy**:

```bash
vercel
```

3. **Set Environment Variables** in Vercel Dashboard:

   - `DATABASE_URL` - Your PostgreSQL connection string
   - `DB_TYPE` - Set to `postgresql`
   - `NODE_ENV` - Set to `production`

4. **Important**: Use a serverless-compatible PostgreSQL database like:
   - [Neon](https://neon.tech) (recommended)
   - [Supabase](https://supabase.com)
   - [PlanetScale](https://planetscale.com)

### Deploy to Railway/Render

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Important for Production

1. **Set CORS origins**: Update CORS configuration in `app.js`
2. **Enable HTTPS**: Use hosting platform SSL (automatic on Vercel)
3. **Environment variables**: Set production `DATABASE_URL`
4. **Rate limiting**: Consider adding express-rate-limit

## Project Structure

```
Indian-Recipe-API/
├── app.js                 # Main Express application
├── routes/
│   └── index.js          # API routes
├── bin/
│   └── www               # Server startup script
├── migrate.js            # Database migration script
├── scrape-images.js      # Image URL scraper
├── create-table.sql      # PostgreSQL schema
├── vercel.json           # Vercel deployment config
├── example.html          # API demo page
├── API_USAGE.md          # Detailed API usage guide
├── .env.example          # Environment variables template
└── package.json          # Dependencies

```

## Scripts

- `npm start` - Start the API server
- `node migrate.js` - Import recipes from CSV to database
- `node scrape-images.js` - Scrape recipe images from source website

## Troubleshooting

**CORS errors:** Ensure the API is running and CORS is enabled

**Database connection failed:** Check your `DATABASE_URL` in `.env`

**No results:** Verify data was imported correctly with `node migrate.js`

**Port in use:** Change `PORT` in `.env` or stop the conflicting process

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

## License

ISC

## Credits & Acknowledgments

- **Original Dataset**: [Indian Food Dataset on Kaggle](https://www.kaggle.com/kanishk307/6000-indian-food-recipes-dataset) by Kanishk Verma
- **Recipe Source**: All recipes scraped from [Archana's Kitchen](https://www.archanaskitchen.com/) - a wonderful resource for authentic Indian recipes
- **Images**: Recipe images © Archana's Kitchen

### Disclaimer

This API is for educational and personal use. All recipe content and images are sourced from Archana's Kitchen and belong to their respective owners. If you plan to use this API commercially, please ensure you have proper permissions from the content creators.

## Support

⭐ If you find this project useful, please consider giving it a star on GitHub!

---

**Built with ❤️ for Indian food lovers**
