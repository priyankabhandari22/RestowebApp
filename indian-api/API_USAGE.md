# Indian Recipe API - Usage Guide

> **API by:** [Sachinart](https://github.com/Sachinart)  
> **Repository:** [Indian-Recipe-API-with-Images](https://github.com/Soham156/Indian-Recipe-API-with-Images)  
> **Credits:** Original dataset from [Kaggle](https://www.kaggle.com/kanishk307/6000-indian-food-recipes-dataset), recipes from [Archana's Kitchen](https://www.archanaskitchen.com/)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the API Server

```bash
npm start
```

The API will run on `http://localhost:3000` by default.

### 3. Deploy to Production (Optional)

For production use, you can deploy to:

- **Heroku**: Easy deployment with free tier
- **Railway**: Modern hosting platform
- **Render**: Free hosting for APIs
- **DigitalOcean**: VPS hosting
- **AWS/Azure/GCP**: Cloud platforms

---

## API Endpoints

### Search Recipes

**Endpoint:** `GET /`

**Query Parameters:**

- `q` (required): Search query for recipe name

**Example Request:**

```
GET http://localhost:3000/?q=biryani
```

**Example Response:**

```json
[
  {
    "RecipeName": "Chicken Biryani",
    "TranslatedRecipeName": "...",
    "Ingredients": "...",
    "TranslatedIngredients": "...",
    "PrepTimeInMins": "...",
    "CookTimeInMins": "...",
    "TotalTimeInMins": "...",
    "Servings": "...",
    "Cuisine": "...",
    "Course": "...",
    "Diet": "...",
    "Instructions": "...",
    "TranslatedInstructions": "...",
    "URL": "..."
  }
]
```

---

## Using the API from Other Websites

### JavaScript (Vanilla)

```javascript
// Using Fetch API
async function searchRecipes(query) {
  try {
    const response = await fetch(
      `http://localhost:3000/?q=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching recipes:", error);
  }
}

// Usage
searchRecipes("biryani").then((recipes) => {
  recipes.forEach((recipe) => {
    console.log(recipe.RecipeName);
  });
});
```

### JavaScript (jQuery)

```javascript
$.ajax({
  url: "http://localhost:3000/",
  method: "GET",
  data: { q: "biryani" },
  success: function (data) {
    console.log(data);
  },
  error: function (error) {
    console.error("Error:", error);
  },
});
```

### React

```jsx
import { useState, useEffect } from "react";

function RecipeSearch() {
  const [recipes, setRecipes] = useState([]);
  const [query, setQuery] = useState("");

  const searchRecipes = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search recipes..."
      />
      <button onClick={searchRecipes}>Search</button>

      <div>
        {recipes.map((recipe, index) => (
          <div key={index}>
            <h3>{recipe.RecipeName}</h3>
            <p>
              {recipe.Cuisine} - {recipe.Course}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Vue.js

```vue
<template>
  <div>
    <input v-model="query" placeholder="Search recipes..." />
    <button @click="searchRecipes">Search</button>

    <div v-for="recipe in recipes" :key="recipe.RecipeName">
      <h3>{{ recipe.RecipeName }}</h3>
      <p>{{ recipe.Cuisine }} - {{ recipe.Course }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      query: "",
      recipes: [],
    };
  },
  methods: {
    async searchRecipes() {
      try {
        const response = await fetch(
          `http://localhost:3000/?q=${encodeURIComponent(this.query)}`
        );
        this.recipes = await response.json();
      } catch (error) {
        console.error("Error:", error);
      }
    },
  },
};
</script>
```

### Python (Requests)

```python
import requests

def search_recipes(query):
    try:
        response = requests.get(f'http://localhost:3000/?q={query}')
        data = response.json()
        return data
    except Exception as e:
        print(f'Error: {e}')
        return None

# Usage
recipes = search_recipes('biryani')
for recipe in recipes:
    print(recipe['RecipeName'])
```

### cURL

```bash
curl "http://localhost:3000/?q=biryani"
```

---

## CORS Configuration

The API is configured to accept requests from any origin (`*`).

### Restrict to Specific Domains (Recommended for Production)

To only allow specific websites, modify `app.js`:

```javascript
const corsOptions = {
  origin: ["https://yourwebsite.com", "https://another-site.com"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};
```

---

## Environment Configuration

### Custom Port

Set a custom port using environment variable:

**Windows PowerShell:**

```powershell
$env:PORT=8080; npm start
```

**Linux/Mac:**

```bash
PORT=8080 npm start
```

### Production Environment

```powershell
$env:NODE_ENV="production"; npm start
```

---

## Deployment Tips

### 1. Use Environment Variables

Never hardcode the API URL in your frontend. Use environment variables:

```javascript
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";
```

### 2. Enable HTTPS in Production

Always use HTTPS for production deployments to secure data transmission.

### 3. Add Rate Limiting (Optional)

Install and configure rate limiting to prevent abuse:

```bash
npm install express-rate-limit
```

### 4. Add API Key Authentication (Optional)

For private use, add API key authentication to restrict access.

---

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Make sure the API server is running
2. Check that CORS is enabled in `app.js`
3. Verify the origin is allowed in corsOptions

### Connection Refused

- Ensure the API is running (`npm start`)
- Check the correct port (default: 3000)
- Verify firewall settings

### No Results

- Check that the database file exists
- Verify the search query parameter is correct
- Check server logs for errors

---

## License

ISC

---

**Indian Recipe API** - Built with ❤️ for Indian food lovers  
Created by [Sachinart](https://github.com/Sachinart) | [GitHub Repository](https://github.com/Soham156/Indian-Recipe-API-with-Images)
