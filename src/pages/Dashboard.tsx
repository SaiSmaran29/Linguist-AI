import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  detectedLanguages?: string[];
  translatedText?: string;
  isTranslating?: boolean;
  isError?: boolean;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
};

export default function Dashboard() {
  const initialMessage: Message = {
    id: "init",
    text: "Hello! I'm ready to assist with your code-mixed translations. Simply type your sentence in the box below, and I'll break it down for you.",
    isUser: false,
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length > 1 && !currentChatId) {
      const newId = Date.now().toString();
      const firstUserMsg = messages.find(m => m.isUser);
      const title = firstUserMsg 
        ? firstUserMsg.text.substring(0, 30) + (firstUserMsg.text.length > 30 ? "..." : "") 
        : "New Translation";
      setChatHistory(prev => [{ id: newId, title, messages }, ...prev]);
      setCurrentChatId(newId);
    } else if (messages.length > 1 && currentChatId) {
      setChatHistory(prev => prev.map(chat => chat.id === currentChatId ? { ...chat, messages } : chat));
    }
  }, [messages, currentChatId]);

  const handleNewTranslation = () => {
    setMessages([initialMessage]);
    setCurrentChatId(null);
  };

  const loadChat = (chat: ChatSession) => {
    setMessages(chat.messages);
    setCurrentChatId(chat.id);
  };

  const deleteChat = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    setChatHistory((prev) => prev.filter((chat) => chat.id !== id));
    if (currentChatId === id) {
      handleNewTranslation();
    }
  };

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true);
    } else if (localStorage.getItem("theme") === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInputValue((prev) => prev + (prev ? " " : "") + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Could not start recording", e);
      }
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputValue((prev) => prev + (prev ? "\n" : "") + content);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text) return;

    const userMessage: Message = { id: Date.now().toString(), text, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "56px";
    }

    setIsTyping(true);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      setIsTyping(false);

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: data.translated_text,
            isUser: false,
            detectedLanguages: data.detected_languages,
            translatedText: data.translated_text,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), text: `Error: ${data.error}`, isUser: false, isError: true },
        ]);
      }
    } catch (e) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: "Network error occurred.", isUser: false, isError: true },
      ]);
    }
  };

  const handleQuickPrompt = (text: string) => {
    setInputValue(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="bg-light-background text-on-background font-body-md overflow-hidden h-screen flex transition-colors duration-300 dark:bg-surface dark:text-on-surface">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-white/80 dark:bg-surface-container-high/80 backdrop-blur-xl border-r border-light-outline-variant dark:border-outline-variant flex flex-col p-stack-md shrink-0 z-40">
        <div className="mb-stack-lg flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              translate
            </span>
          </div>
          <div>
            <h1 className="font-display-lg text-headline-md font-bold text-primary dark:text-primary leading-tight">
              Linguist AI
            </h1>
            <p className="font-body-sm text-body-sm text-light-outline dark:text-on-surface-variant/70">
              Premium Plan
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          <button 
            onClick={handleNewTranslation}
            className="flex items-center gap-3 px-4 py-3 text-primary dark:text-primary bg-primary/10 dark:bg-primary/20 rounded-lg border-l-4 border-primary w-full active:scale-[0.98] transition-transform duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined">add</span>
            <span className="font-body-md text-body-md font-semibold">New Translation</span>
          </button>
          <div className="pt-stack-md pb-2 px-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-light-outline dark:text-outline">
              Recent History
            </span>
          </div>
          {chatHistory.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 dark:text-on-surface-variant italic">
              No recent translations
            </div>
          ) : (
            chatHistory.map((chat) => (
              <div key={chat.id} className="relative group w-full flex items-center">
                <button 
                  onClick={() => loadChat(chat)}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-light-surface-container dark:hover:bg-surface-container rounded-lg transition-all duration-200 w-full active:scale-[0.98] cursor-pointer pr-10 ${
                    currentChatId === chat.id 
                      ? "bg-light-surface-container dark:bg-surface-container text-primary font-semibold" 
                      : "text-on-surface-variant"
                  }`}
                >
                  <span className={`material-symbols-outlined shrink-0 ${currentChatId === chat.id ? "text-primary" : "text-primary/70"}`}>history</span>
                  <span className={`font-body-md text-body-md truncate text-left ${currentChatId === chat.id ? "text-primary dark:text-primary" : "text-slate-700 dark:text-on-surface"}`}>
                    {chat.title}
                  </span>
                </button>
                <button
                  onClick={(e) => deleteChat(e, chat.id)}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-error dark:text-outline hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all cursor-pointer"
                  title="Delete Chat"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))
          )}
        </nav>
        <div className="mt-auto border-t border-light-outline-variant dark:border-outline-variant pt-stack-md space-y-1">
          <button className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-light-surface-container dark:hover:bg-surface-container rounded-lg transition-all w-full cursor-pointer">
            <span className="material-symbols-outlined text-light-outline dark:text-outline">settings</span>
            <span className="font-body-md text-body-md text-slate-700 dark:text-on-surface">Settings</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-light-surface-container dark:hover:bg-surface-container rounded-lg transition-all w-full cursor-pointer">
            <span className="material-symbols-outlined text-light-outline dark:text-outline">help</span>
            <span className="font-body-md text-body-md text-slate-700 dark:text-on-surface">Help</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 ml-64 flex flex-col h-screen relative bg-light-surface dark:bg-surface-container-lowest transition-colors duration-300">
        {/* TopAppBar */}
        <header className="flex justify-between items-center h-16 px-gutter w-full sticky top-0 z-30 bg-white/80 dark:bg-surface-container-high/80 backdrop-blur-xl border-b border-light-outline-variant dark:border-outline-variant">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-on-surface-variant">
              <span className="font-bold text-primary">Chat v4.2</span>
              <span className="h-4 w-px bg-light-outline-variant dark:bg-outline-variant"></span>
              <div className="flex gap-4">
                <a className="text-primary font-bold border-b-2 border-primary pb-1 font-body-sm text-body-sm" href="#">
                  Models
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 p-2 px-3 hover:bg-light-surface-container dark:hover:bg-surface-container rounded-full text-slate-600 dark:text-on-surface-variant transition-colors border border-light-outline-variant dark:border-outline-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] dark:hidden">
                dark_mode
              </span>
              <span className="material-symbols-outlined text-[20px] hidden dark:inline">
                light_mode
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider dark:hidden">
                Dark
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider hidden dark:inline">
                Light
              </span>
            </button>
            <div className="relative hidden lg:block">
              <input
                className="bg-light-surface-container dark:bg-surface-container-low border border-light-outline-variant dark:border-outline-variant rounded-full px-4 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-on-surface"
                placeholder="Search interactions..."
                type="text"
              />
              <span className="material-symbols-outlined absolute right-3 top-1.5 text-light-outline dark:text-outline text-sm">
                search
              </span>
            </div>
            <button className="p-2 hover:bg-light-surface-container dark:hover:bg-surface-container rounded-full text-slate-600 dark:text-on-surface-variant transition-colors cursor-pointer">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-8 h-8 rounded-full overflow-hidden border border-light-outline-variant dark:border-outline-variant bg-slate-200 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              >
                <span className="material-symbols-outlined text-slate-500 text-sm">person</span>
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-container-high border border-light-outline-variant dark:border-outline-variant rounded-xl shadow-lg py-1 z-50">
                  <button onClick={() => { setIsProfileOpen(false); /* Profile logic */ }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-on-surface hover:bg-light-surface-container dark:hover:bg-surface-container transition-colors cursor-pointer">
                    Profile
                  </button>
                  <button onClick={() => { setIsProfileOpen(false); navigate("/login"); }} className="w-full text-left px-4 py-2 text-sm text-error hover:bg-light-surface-container dark:hover:bg-surface-container transition-colors cursor-pointer">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <section className="flex-1 overflow-y-auto px-gutter py-stack-lg space-y-stack-lg max-w-4xl mx-auto w-full scroll-smooth">
          {messages.length === 1 && (
            <div className="text-center py-12 max-w-2xl mx-auto space-y-4">
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary-container rounded-2xl mx-auto flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-slate-800 dark:text-on-surface">
                NLP Code-Mixed Assistant
              </h2>
              <p className="text-slate-600 dark:text-on-surface-variant">
                I specialize in understanding and translating hybrid languages like Hinglish, Tanglish, and
                Spanglish. How can I help you today?
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                <button
                  onClick={() => handleQuickPrompt("Kya scene hai tonight?")}
                  className="px-4 py-2 bg-white dark:bg-surface-container-high border border-light-outline-variant dark:border-outline-variant rounded-full text-sm hover:border-primary hover:text-primary dark:hover:border-primary transition-all shadow-sm dark:text-on-surface cursor-pointer"
                >
                  "Kya scene hai tonight?"
                </button>
                <button
                  onClick={() => handleQuickPrompt("I need to verify the credentials logic.")}
                  className="px-4 py-2 bg-white dark:bg-surface-container-high border border-light-outline-variant dark:border-outline-variant rounded-full text-sm hover:border-primary hover:text-primary dark:hover:border-primary transition-all shadow-sm dark:text-on-surface cursor-pointer"
                >
                  "I need to verify the credentials logic."
                </button>
                <button
                  onClick={() => handleQuickPrompt("Explain code-mixing in AI.")}
                  className="px-4 py-2 bg-white dark:bg-surface-container-high border border-light-outline-variant dark:border-outline-variant rounded-full text-sm hover:border-primary hover:text-primary dark:hover:border-primary transition-all shadow-sm dark:text-on-surface cursor-pointer"
                >
                  "Explain code-mixing in AI."
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6 flex flex-col">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 message-in ${msg.isUser ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                    msg.isUser
                      ? "bg-primary text-white"
                      : "bg-primary/20 dark:bg-primary-container text-primary dark:text-on-primary-container"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: msg.isUser ? "'FILL' 0" : "'FILL' 1" }}
                  >
                    {msg.isUser ? "person" : "smart_toy"}
                  </span>
                </div>
                <div
                  className={`p-4 rounded-2xl shadow-sm max-w-[80%] font-body-md ${
                    msg.isUser
                      ? "bg-primary text-white rounded-tr-none"
                      : "bg-white dark:bg-surface-container-high border border-light-outline-variant dark:border-outline-variant text-slate-800 dark:text-on-surface rounded-tl-none"
                  }`}
                >
                  <p className={`${msg.isError ? "text-error" : ""}`}>{msg.text}</p>
                  {!msg.isUser && msg.id !== "init" && !msg.isError && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="bg-primary/10 dark:bg-surface-container text-primary font-label-md text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">
                        TRANSLATED
                      </span>
                      {msg.detectedLanguages && msg.detectedLanguages.length > 0 && (
                        <span className="bg-slate-100 dark:bg-surface-container-highest text-slate-600 dark:text-on-surface-variant font-label-md text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">language</span>
                          {msg.detectedLanguages.join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                  {!msg.isUser && msg.id === "init" && (
                    <div className="mt-2 flex items-center gap-2">
                       <span className="bg-primary/10 dark:bg-surface-container text-primary font-label-md text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">
                        SYSTEM READY
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-4 message-in">
                <div className="w-8 h-8 rounded-lg bg-primary/20 dark:bg-primary-container flex-shrink-0 flex items-center justify-center text-primary dark:text-on-primary-container">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    smart_toy
                  </span>
                </div>
                <div className="bg-white dark:bg-surface-container-high border border-light-outline-variant dark:border-outline-variant p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 h-[56px]">
                  <div className="w-2 h-2 bg-primary/40 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-primary/40 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-primary/40 rounded-full typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </section>

        {/* Input Area */}
        <footer className="p-gutter pt-0 pb-6 w-full max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/40 rounded-[28px] blur opacity-25 group-focus-within:opacity-100 transition duration-500"></div>
            <div className="relative bg-white dark:bg-surface-container-high border border-light-outline-variant dark:border-outline-variant rounded-[24px] shadow-lg flex flex-col p-2 transition-all group-focus-within:border-primary">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none focus:ring-0 resize-none px-4 py-3 font-body-md text-slate-800 dark:text-on-surface placeholder:text-light-outline/60 dark:placeholder:text-outline/60 outline-none"
                placeholder="Enter code-mixed text (e.g., Hindi + English, Telugu + English)..."
                rows={1}
                style={{ minHeight: "56px", maxHeight: "200px" }}
              />
              <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={toggleRecording}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${isRecording ? "bg-red-100 text-error dark:bg-red-900/30" : "text-slate-500 dark:text-on-surface-variant hover:bg-light-surface-container dark:hover:bg-surface-container"}`}
                    title="Voice Input"
                  >
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                  <button onClick={handleFileClick} className="p-2 text-slate-500 dark:text-on-surface-variant hover:bg-light-surface-container dark:hover:bg-surface-container rounded-lg transition-colors cursor-pointer" title="Upload Document">
                    <span className="material-symbols-outlined">attach_file</span>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.json,.md,.csv" />
                  <button className="p-2 text-slate-500 dark:text-on-surface-variant hover:bg-light-surface-container dark:hover:bg-surface-container rounded-lg transition-colors cursor-pointer" title="Settings">
                    <span className="material-symbols-outlined">tune</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-light-outline dark:text-outline font-label-md">
                    {inputValue.length} / 2000
                  </span>
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-primary disabled:opacity-50 text-white p-2.5 rounded-xl flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      send
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-[11px] text-light-outline dark:text-outline mt-3 font-label-md">
            Linguist AI can make mistakes. Verify important information.
          </p>
        </footer>
      </main>
    </div>
  );
}
