# Indian Recipe API - Complete Documentation

## Base URL

```
https://your-domain.com/
```

## Overview

A comprehensive Indian Recipe API with dynamic filtering, pagination, and detailed statistics. Search and filter through thousands of Indian recipes by cuisine, course, diet type, and more.

---

## Endpoints

### 1. API Information

**GET /**

Returns API documentation and available endpoints.

**Response:**

```json
{
  "message": "Indian Recipe API",
  "version": "2.0",
  "endpoints": { ... },
  "filterParameters": { ... },
  "examples": { ... }
}
```

---

### 2. Get All Recipes (with Filters)

**GET /recipes**

Fetch all recipes with optional filters and pagination. This is the most powerful endpoint supporting multiple filters.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Results per page (max: 100) |
| `cuisine` | string | No | - | Filter by cuisine type |
| `course` | string | No | - | Filter by course (e.g., Dinner, Lunch) |
| `diet` | string | No | - | Filter by diet type (e.g., Vegetarian) |
| `search` | string | No | - | Search in recipe names |

**Examples:**

```
GET /recipes
GET /recipes?page=2&limit=50
GET /recipes?diet=Vegetarian
GET /recipes?cuisine=North Indian Recipes
GET /recipes?course=Dinner
GET /recipes?diet=Vegetarian&course=Dinner&page=1&limit=20
GET /recipes?search=curry&diet=Vegetarian
```

**Response:**

```json
{
  "page": 1,
  "limit": 20,
  "totalRecipes": 150,
  "totalPages": 8,
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
      "TranslatedIngredients": "...",
      "PrepTimeInMins": "15",
      "CookTimeInMins": "30",
      "TotalTimeInMins": "45",
      "Servings": "4",
      "Cuisine": "North Indian Recipes",
      "Course": "Dinner",
      "Diet": "Vegetarian",
      "Instructions": "...",
      "TranslatedInstructions": "...",
      "URL": "...",
      "ImageURL": "...",
      "created_at": "2025-11-10T12:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Recipe by ID

**GET /recipes/:id**

Fetch a specific recipe by its unique ID.

**Parameters:**

- `id` (path parameter) - Recipe ID

**Example:**

```
GET /recipes/123
```

**Response:**

```json
{
  "id": 123,
  "RecipeName": "Butter Chicken",
  "TranslatedRecipeName": "Murgh Makhani",
  "Ingredients": "chicken, butter, cream, tomatoes, ...",
  "TranslatedIngredients": "...",
  "PrepTimeInMins": "30",
  "CookTimeInMins": "45",
  "TotalTimeInMins": "75",
  "Servings": "4",
  "Cuisine": "North Indian Recipes",
  "Course": "Dinner",
  "Diet": "Non Vegetarian",
  "Instructions": "...",
  "TranslatedInstructions": "...",
  "URL": "https://...",
  "ImageURL": "https://...",
  "created_at": "2025-11-10T12:00:00.000Z"
}
```

**Error Response (404):**

```json
{
  "error": "Recipe not found"
}
```

---

### 4. Search Recipes

**GET /search**

Search for recipes by name (English or translated name).

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | **Yes** | - | Search term |
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Results per page (max: 100) |

**Examples:**

```
GET /search?q=curry
GET /search?q=paneer&page=2
GET /search?q=biryani&limit=50
```

**Response:**

```json
{
  "page": 1,
  "limit": 20,
  "totalRecipes": 45,
  "totalPages": 3,
  "searchQuery": "curry",
  "recipes": [ ... ]
}
```

---

### 5. API Statistics

**GET /stats**

Get comprehensive API statistics including total recipe count and available filters with counts.

**Example:**

```
GET /stats
```

**Response:**

```json
{
  "totalRecipes": 6714,
  "cuisines": [
    { "Cuisine": "North Indian Recipes", "count": "2156" },
    { "Cuisine": "South Indian Recipes", "count": "1834" },
    { "Cuisine": "Maharashtrian Recipes", "count": "542" }
  ],
  "courses": [
    { "Course": "Dinner", "count": "3245" },
    { "Course": "Lunch", "count": "2891" },
    { "Course": "Snack", "count": "1234" }
  ],
  "diets": [
    { "Diet": "Vegetarian", "count": "5432" },
    { "Diet": "Non Vegetarian", "count": "982" },
    { "Diet": "Eggetarian", "count": "300" }
  ],
  "endpoints": { ... },
  "filters": { ... }
}
```

---

### 6. Get All Cuisines

**GET /cuisines**

Get a list of all available cuisines with recipe counts.

**Example:**

```
GET /cuisines
```

**Response:**

```json
{
  "total": 15,
  "cuisines": [
    { "Cuisine": "North Indian Recipes", "count": "2156" },
    { "Cuisine": "South Indian Recipes", "count": "1834" },
    { "Cuisine": "Maharashtrian Recipes", "count": "542" }
  ]
}
```

---

### 7. Get All Courses

**GET /courses**

Get a list of all available courses with recipe counts.

**Example:**

```
GET /courses
```

**Response:**

```json
{
  "total": 8,
  "courses": [
    { "Course": "Dinner", "count": "3245" },
    { "Course": "Lunch", "count": "2891" },
    { "Course": "Snack", "count": "1234" },
    { "Course": "Dessert", "count": "876" }
  ]
}
```

---

### 8. Get All Diets

**GET /diets**

Get a list of all available diet types with recipe counts.

**Example:**

```
GET /diets
```

**Response:**

```json
{
  "total": 5,
  "diets": [
    { "Diet": "Vegetarian", "count": "5432" },
    { "Diet": "Non Vegetarian", "count": "982" },
    { "Diet": "Eggetarian", "count": "300" },
    { "Diet": "Vegan", "count": "234" }
  ]
}
```

---

## Common Use Cases

### 1. Get All Vegetarian Recipes

```
GET /recipes?diet=Vegetarian
```

### 2. Get North Indian Dinner Recipes

```
GET /recipes?cuisine=North Indian Recipes&course=Dinner
```

### 3. Search for Vegetarian Curry Recipes

```
GET /recipes?search=curry&diet=Vegetarian
```

### 4. Get Vegetarian Lunch Recipes (Paginated)

```
GET /recipes?diet=Vegetarian&course=Lunch&page=1&limit=30
```

### 5. Find All Non-Vegetarian Recipes

```
GET /recipes?diet=Non Vegetarian
```

### 6. Get Available Filter Options

```
GET /stats
GET /cuisines
GET /courses
GET /diets
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Page number must be greater than 0"
}
```

### 404 Not Found

```json
{
  "error": "Recipe not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Database error",
  "message": "Connection timeout"
}
```

---

## Pagination Details

- Default page size: 20 recipes
- Maximum page size: 100 recipes
- Page numbers start at 1
- Response includes:
  - `page`: Current page number
  - `limit`: Results per page
  - `totalRecipes`: Total matching recipes
  - `totalPages`: Total number of pages

---

## Filter Combinations

You can combine multiple filters for precise results:

```
/recipes?diet=Vegetarian&cuisine=South Indian Recipes&course=Breakfast&page=1&limit=25
```

This returns:

- Only Vegetarian recipes
- From South Indian cuisine
- Suitable for Breakfast
- First page with 25 results

---

## Notes

1. **Case Insensitive**: All filters are case-insensitive
2. **Exact Match**: Filters use exact matching (except search which uses partial matching)
3. **Dynamic Counts**: The `/stats` endpoint provides real-time counts
4. **Performance**: Use pagination to avoid large response payloads
5. **Filter Discovery**: Use `/cuisines`, `/courses`, and `/diets` to discover available filter values

---

## Rate Limiting

Currently, there are no rate limits, but please be considerate with your API usage.

---

## Support

For issues or feature requests, please open an issue on GitHub.
