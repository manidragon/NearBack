const ChatbotService = require("../services/ChatbotService.js");
const ChatboatService = require("../services/ChatbotService.js");

class ChatboatController {
  async simpleChat(req, res) {
    try {
      const message = req.body.message;

      const contents = [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ];

      const data = await ChatboatService.chatService(contents);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async askProductQuestionController(req, res) {
    try {
      const { productId } = req.params;
      const { question } = req.body;

      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }

      const answer = await ChatbotService.askProductQuestion(
        productId,
        question
      );

      res.status(200).json({ answer });
    } catch (error) {
      console.error("Controller Error:", error);
      res
        .status(500)
        .json({
          message: "Something went wrong while processing the question",
        });
    }
  }
}

module.exports = new ChatboatController();
