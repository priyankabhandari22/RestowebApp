-- PostgreSQL Table Creation Script for Indian Recipe API
-- Run this in your Neon PostgreSQL database

-- Drop table if exists (be careful in production!)
DROP TABLE IF EXISTS recipes;

-- Create recipes table
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

-- Create indexes for faster searches
CREATE INDEX idx_recipe_name ON recipes USING gin(to_tsvector('english', "RecipeName"));
CREATE INDEX idx_translated_name ON recipes USING gin(to_tsvector('english', "TranslatedRecipeName"));
CREATE INDEX idx_cuisine ON recipes("Cuisine");
CREATE INDEX idx_course ON recipes("Course");
CREATE INDEX idx_diet ON recipes("Diet");

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON TABLE recipes TO your_user;
-- GRANT USAGE, SELECT ON SEQUENCE recipes_id_seq TO your_user;

COMMENT ON TABLE recipes IS 'Indian food recipes database';
