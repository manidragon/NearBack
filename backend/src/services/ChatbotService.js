require("dotenv").config();
const fs = require("fs");
const ProductService = require("./ProductService");

class ChatboatService {
  // The client gets the API key from the environment variable `GEMINI_API_KEY`.

  async chatService(contents) {
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });
    console.log(response.text);
    return response.text;
  }

  async askProductQuestion(productId, userQuestion) {
    try {
      const product = await ProductService.findProductById(productId);

      console.log("product ", product);
      if (!product) {
        return "Sorry, the product you're asking about does not exist.";
      }

      const productDetails = JSON.stringify(product);

      console.log("product ", productDetails);

      const { GoogleGenAI } = await import("@google/genai");

      const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

      const prompt = `
        You are an eCommerce assistant. 
        Answer the customer's question based only on the product details below.

        --- PRODUCT DETAILS ---
        ${productDetails}
        -----------------------

        Question: ${userQuestion}
        Answer:
      `;

      const contents = [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
      });

      const text = response.text;

      return text;
    } catch (error) {
      console.error("AI Error:", error);
      throw Error(error);
    }
  }
}

module.exports = new ChatboatService();
