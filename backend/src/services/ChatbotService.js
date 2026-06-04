require("dotenv").config();
const ProductService = require("./ProductService");

class ChatboatService {

  async chatService(contents) {
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    return response.text;
  }

  async askProductQuestion(productId, userQuestion) {
    try {

      const product = await ProductService.findProductById(productId);

      if (!product) {
        return "Sorry, the product you're asking about does not exist.";
      }

      const firstVariant = product.variants?.[0] || {};
      const firstOffer = firstVariant.offers?.[0] || {};

      const specs =
        firstVariant.specifications instanceof Map
          ? Object.fromEntries(firstVariant.specifications)
          : firstVariant.specifications || {};

      const highlights =
        product.highlights instanceof Map
          ? Object.fromEntries(product.highlights)
          : product.highlights || {};

      const productDetails = `
Product Name: ${product.title || ""}

Description:
${product.description || ""}

Color:
${firstVariant.color || ""}

Selling Price:
₹${firstOffer.sellingPrice || "Not Available"}

MRP:
₹${firstOffer.mrpPrice || "Not Available"}

Stock:
${firstOffer.stock || "Not Available"}

Specifications:
${JSON.stringify(specs, null, 2)}

Highlights:
${JSON.stringify(highlights, null, 2)}
`;

      console.log("====================================");
      console.log("PRODUCT ID:", productId);
      console.log("QUESTION:", userQuestion);
      console.log("PRODUCT DETAILS:", productDetails);
      console.log("====================================");

      const { GoogleGenAI } = await import("@google/genai");

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      const prompt = `
You are Near Look AI Shopping Assistant.

Rules:
1. Answer ONLY using the product information provided.
2. Never make up specifications, prices, colors, or features.
3. If information is unavailable, reply:
   "This information is not available for this product."
4. Keep answers short and clear.
5. Mention exact values whenever available.

PRODUCT INFORMATION:

${productDetails}

CUSTOMER QUESTION:

${userQuestion}

ANSWER:
`;

      const contents = [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
      });

      const answer = response.text;

      console.log("====================================");
      console.log("AI RESPONSE:", answer);
      console.log("====================================");

      return answer;

    } catch (error) {
      console.error("====================================");
      console.error("FULL AI ERROR:");
      console.error(error);
      console.error("====================================");

      throw error;
    }
  }
}

module.exports = new ChatboatService();