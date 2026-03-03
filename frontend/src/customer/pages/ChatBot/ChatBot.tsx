// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\ChatBot\ChatBot.tsx
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { askProductQuestion} from "../../../Redux Toolkit/Customer/AiChatBotSlice";
import { Button, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PromptMessage from "./PromptMessage";
import ResponseMessage from "./ResponseMessage";
import CloseIcon from '@mui/icons-material/Close';

// ✅ FIXED: Changed productId from number to string (MongoDB _id is string)
interface ChatBotProps{
    handleClose:(e:any)=>void;
    productId?: string;  // ✅ Changed from number | undefined to string | undefined
}

const ChatBot = ({handleClose,productId}:ChatBotProps) => {
    const dispatch = useAppDispatch();
    const [prompt, setPrompt] = useState("");
    const chatContainerRef = useRef<HTMLDivElement>(null);
  
    const aiChatBot=useAppSelector(state=>state.aiChatBot);

    console.log("ai chat Bot",aiChatBot)

    const handleGivePrompt = (e:any) => {
        e.stopPropagation()
        
        // ✅ FIXED: productId is now string, no conversion needed
        dispatch(askProductQuestion({
            productId: productId || "",  // ✅ Pass string directly (fallback to empty string if undefined)
            question:prompt
        }))

        setPrompt("")

        console.log("prompt ", productId, prompt)
    };

    const handlePromptChange = (e: any) => {
        setPrompt(e.target.value);
    };
    
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [aiChatBot.messages]);
    
    return (
        <div className="rounded-lg">
            <div className="w-full lg:w-[40vw] h-[82vh] shadow-2xl bg-white z-50 rounded-lg">
                <div className=" h-[12%] flex justify-between items-center px-5 bg-slate-100 rounded-t-lg">
                    <div className="flex items-center gap-3 ">
                        <h1 className="logo">Near Look</h1>
                        <p>Assistant</p>
                    </div>
                    <div>
                        <IconButton 
                        onClick={handleClose}
                        color="primary"
                        >
                            <CloseIcon/>
                        </IconButton>
                    </div>
                </div>

                <div className="h-[78%] p-5 flex flex-col py-5 px-5 overflow-y-auto custom-scrollbar">
                    <p>
                        Welcome to Near Look AI Assistant, you can
                        {productId ? ` query about this Product: ${productId}` : " query about your cart, and order history here"}
                    </p>
                    
                    { aiChatBot.messages.map((item:any, index:number) =>
                        item.role == "user" ? (
                            <div ref={chatContainerRef} className="self-end" key={index}>
                                <PromptMessage message={item.message} index={index} />
                                {aiChatBot.loading && <h1 className="font-bold">Thinking ...</h1>}
                            </div>
                        ) : (
                            <div
                                ref={chatContainerRef}
                                className="self-start"
                                key={index}
                            >
                                <ResponseMessage message={item.message} />
                            </div>
                        )
                    )}
                    {aiChatBot.loading && <p>fetching data...</p>}
                </div>

                <div className="h-[10%] flex items-center">
                    <input
                        onChange={handlePromptChange}
                        value={prompt}
                        type="text"
                        placeholder="give your prompt"
                        className="rounded-bl-lg pl-5 h-full w-full bg-slate-100 border-none outline-none"
                    />
                    <Button
                        sx={{ borderRadius: "0 0 0.5rem 0" }}
                        className="h-full"
                        onClick={handleGivePrompt}
                        variant="contained"
                        disabled={aiChatBot.loading || !prompt.trim()}
                    >
                        <SendIcon />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;