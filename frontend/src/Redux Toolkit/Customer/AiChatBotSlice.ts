// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Customer\AiChatBotSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../Config/Api";

// ✅ Define message interface for type safety
interface ChatMessage {
  role: "user" | "assistant" | "res";
  message: string;
  timestamp?: Date;
}

// Define the initial state using an interface
interface AiChatBotState {
  response: string | null;
  loading: boolean;
  error: string | null;
  messages: ChatMessage[];
}

const initialState: AiChatBotState = {
  response: null,
  loading: false,
  error: null,
  messages: [],
};

// ✅ FIXED: Changed productId from number to string (MongoDB _id is string)
export const chatBot = createAsyncThunk<
  any,
  {
    prompt: any;
    productId: string | null | undefined;  // ✅ Changed from number to string
    userId: string | null  // ✅ Also changed userId to string if it's MongoDB _id
  }
>(
  "aiChatBot/generateResponse",
  async ({ prompt, productId, userId }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("jwt");

      // Build params object only with valid values
      const params: Record<string, string> = {};
      if (userId) params.userId = userId;
      if (productId) params.productId = productId;  // ✅ Now string, no conversion needed

      const response = await api.post("/chat", prompt, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        params,  // ✅ Use built params object
      });
      console.log("response ", productId, response.data);
      return response.data;
    } catch (error: any) {
      console.log("error ", error.response);
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate chatbot response"
      );
      
    }
  }
);

// ✅ FIXED: Changed productId from any/number to string
export const askProductQuestion = createAsyncThunk<
  string,  // ✅ Return type is string (the answer)
  { productId: string; question: string }  // ✅ Both are strings
>(
  "aiChatBot/askProductQuestion",
  async ({ productId, question }, { rejectWithValue }) => {
    try {
      const response = await api.post<{ answer: string }>(
        `/chat/product/${productId}`,  // ✅ productId is string, safe for URL
        { question }
      );
      console.log("chat answer ----- ", response.data);
      return response.data.answer;

    } catch (error: any) {
      console.log("error --- ", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to get answer";
      return rejectWithValue(message);
    }
  }
);

// Create the slice
const aiChatBotSlice = createSlice({
  name: "aiChatBot",
  initialState,
  reducers: {
    // ✅ Added action to clear messages
    clearMessages: (state) => {
      state.messages = [];
      state.response = null;
      state.error = null;
    },
    // ✅ Added action to add message manually
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(chatBot.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        const { prompt } = action.meta.arg;

        const userPrompt: ChatMessage = {
          message: prompt.prompt || prompt,
          role: "user",
          timestamp: new Date()
        };
        state.messages = [...state.messages, userPrompt];
      })
      .addCase(chatBot.fulfilled, (state, action) => {
        state.loading = false;
        // Handle different response formats
        const botResponse = action.payload?.response || action.payload?.message || action.payload;
        state.response = botResponse;

        const assistantMsg: ChatMessage = {
          message: botResponse,
          role: "assistant",
          timestamp: new Date()
        };
        state.messages = [...state.messages, assistantMsg];
      })
      .addCase(chatBot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;

        const errorMsg: ChatMessage = {
          message: action.payload as string || "Something went wrong",
          role: "assistant",
          timestamp: new Date()
        };
        state.messages = [...state.messages, errorMsg];
      })
      .addCase(askProductQuestion.pending, (state, action) => {
        state.loading = true;
        state.messages.push({
          role: "user",
          message: action.meta.arg.question,
          timestamp: new Date()
        });
      })
      .addCase(
        askProductQuestion.fulfilled,
        (state, action) => {
          state.loading = false;
          console.log("ans - ", action.payload);
          state.messages.push({
            role: "res",
            message: action.payload,
            timestamp: new Date()
          });
        }
      )
      .addCase(askProductQuestion.rejected, (state, action) => {
        state.loading = false;
        state.messages.push({
          role: "res",
          message: action.payload as string || "Failed to get answer",
          timestamp: new Date()
        });
      });
  },
});

// ✅ Export actions
export const { clearMessages, addMessage } = aiChatBotSlice.actions;

// Export the reducer
export default aiChatBotSlice.reducer;