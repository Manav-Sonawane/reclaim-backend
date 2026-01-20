import { GoogleGenerativeAI } from "@google/generative-ai";
import Item from "../models/item.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const searchItemsAI = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Query string is required" });
    }

    // 1. Initialize Model
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing from environment.");
    }

    // Using 'gemini-flash-latest' which was confirmed in the models list
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // 2. Define prompt to extract structure
    const prompt = `
      You are a search assistant for a "Lost & Found" application.
      Analyze the following user query and extract key search filters.
      
      User Query: "${query}"

      Return ONLY a valid JSON object with the following fields (all optional, use null if not present):
      - search: (string) keywords for title/description matching (e.g. "red wallet", "iphone")
      - type: (string) "lost" or "found". If user says "I lost...", type is "lost". If "I found...", type is "found".
      - category: (string) One of: ["Electronics", "Accessories", "Documents", "Clothing", "Keys", "Other"]. Guess based on context.
      - location: (string) General location text (e.g. "Central Park").
      - country: (string) ISO country name if mentioned.
      - city: (string) City name if mentioned.

      Example Output:
      {
        "search": "red wallet",
        "type": "lost",
        "category": "Accessories",
        "location": "Central Park",
        "country": null,
        "city": "New York"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log("Gemini Raw Response:", responseText); // Debug Log
    
    // Clean markdown if present
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let filters;
    try {
        filters = JSON.parse(cleanedText);
    } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Cleaned Text:", cleanedText);
        // Fallback: Search the whole query if parsing fails
        filters = { search: query }; 
    }

    // 3. Build Database Query
    let dbQuery = { status: "open" };

    if (filters.search) {
        dbQuery.$or = [
            { title: { $regex: filters.search, $options: "i" } },
            { description: { $regex: filters.search, $options: "i" } }
        ];
    }

    if (filters.type) {
        dbQuery.type = filters.type;
    }

    if (filters.category) {
        dbQuery.category = filters.category;
    }

    if (filters.city) {
        dbQuery["location.city"] = { $regex: filters.city, $options: "i" };
    } else if (filters.location) {
        // Fallback to address search if no normalized city
        dbQuery["location.address"] = { $regex: filters.location, $options: "i" };
    }

    // 4. Execute Search
    console.log("DB Query:", dbQuery); // Debug Log
    const items = await Item.find(dbQuery).limit(5);

    // 5. Generate Summary Response
    const summaryPrompt = `
      User Query: "${query}"
      Found Items: ${JSON.stringify(items.map(i => ({ title: i.title, location: i.location.address || i.location.city })))}

      Write a helpful, friendly, short response summarizing what was found. 
      If items were found, mention the top 1-2 briefly.
      If no items found, suggest expanding the search.
      Do not include JSON, just plain text or markdown.
    `;

    const summaryResult = await model.generateContent(summaryPrompt);
    const summaryText = summaryResult.response.text();

    res.json({
        filters,
        items,
        message: summaryText
    });

  } catch (error) {
    console.error("AI Search Error:", error);
    res.status(500).json({ 
        message: "Failed to process AI search.",
        error: error.message 
    });
  }
};
