"use client";

import React, { useState, useEffect, useRef, FormEvent } from "react";
import { useDraggable } from "@/hooks/useDraggable";
import {
  SparklesIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  ChevronDoubleUpIcon,
} from "@heroicons/react/24/outline";
import { askUgandaRentalExpert, generateListingDescription } from "@/lib/api";
import { toast } from "react-hot-toast";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  createdAt: string;
}

const HubScoutWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <>
      {!isOpen && (
        <button
          className="fixed bottom-6 left-6 z-50 p-4 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 shadow-xl text-white hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-pink-400"
          aria-label="Launch AI Hub Scout Assistant"
          onClick={handleToggle}
        >
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-7 h-7 animate-pulse group-hover:animate-none" />
            <span className="sr-only">Hub Scout AI</span>
          </div>
        </button>
      )}

      {mounted && isOpen && <DraggableChatWindow onClose={handleToggle} />}
    </>
  );
};

// --- Resizer Component ---
interface ResizerProps {
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const Resizer: React.FC<ResizerProps> = ({ onMouseDown }) => (
  <div
    className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize bg-pink-500 hover:bg-pink-600 rounded-tl-xl flex items-center justify-center text-white p-1 shadow-inner"
    onMouseDown={(e) => {
      e.stopPropagation(); // Prevent drag
      onMouseDown(e);
    }}
  >
    <ChevronDoubleUpIcon className="w-3 h-3 transform -rotate-45" />
  </div>
);
// ----------------------------------

interface ChatWindowProps {
  onClose: () => void;
}

const DraggableChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  const chatRef = useRef<HTMLDivElement>(null);
  const draggableChat = useDraggable({
    initialPosition: {
      x: typeof window !== "undefined" ? window.innerWidth - 380 : 50,
      y: typeof window !== "undefined" ? window.innerHeight - 500 : 50,
    },
  });

  const [width, setWidth] = useState(320);
  const [height, setHeight] = useState(384);
  const [isResizing, setIsResizing] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now().toString(),
      content:
        "Hello! I am Hub Scout AI, your personal assistant for rentals in Uganda. How can I help you today?",
      sender: "ai",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [tab, setTab] = useState<"ask" | "generate">("ask");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages, width, height]);

  // Combine refs
  const setRefs = (el: HTMLDivElement | null) => {
    draggableChat.targetRef.current = el;
    chatRef.current = el;
  };

  // --- Resizing ---
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !chatRef.current) return;

      const rect = chatRef.current.getBoundingClientRect();
      const MIN_WIDTH = 300;
      const MIN_HEIGHT = 200;

      setWidth(Math.max(MIN_WIDTH, e.clientX - rect.left));
      setHeight(Math.max(MIN_HEIGHT, e.clientY - rect.top));
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // --- Message handlers ---
  const handleAskSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setNewMessage("");
    setIsTyping(true);

    try {
      const res = await askUgandaRentalExpert({ question: content });
      const aiMsg: Message = {
        id: Date.now().toString() + "-ai",
        content: res.answer,
        sender: "ai",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to get response from Hub Scout AI.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setNewMessage("");
    setIsTyping(true);

    try {
      const res = await generateListingDescription({ basicDetails: content });
      const aiMsg: Message = {
        id: Date.now().toString() + "-ai",
        content: res.generatedDescription,
        sender: "ai",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate listing description.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      ref={setRefs}
      style={{
        ...draggableChat.style,
        width: `${width}px`,
        height: `${height}px`,
      }}
      className="bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl flex flex-col overflow-hidden border border-purple-500/50 fixed z-50 transition-shadow duration-100"
    >
      {/* Header - ONLY draggable area */}
      <div
        onPointerDown={draggableChat.onPointerDown}
        className="flex items-center justify-between p-3 bg-gray-800/80 text-white border-b border-purple-500/30 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center space-x-2">
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-pink-400" />
          <h3 className="text-sm font-semibold text-gray-100">Hub Scout AI</h3>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex">
        <button
          className={`flex-1 py-1 text-sm ${
            tab === "ask"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-300"
          }`}
          onClick={() => setTab("ask")}
        >
          Ask AI
        </button>
        <button
          className={`flex-1 py-1 text-sm ${
            tab === "generate"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-300"
          }`}
          onClick={() => setTab("generate")}
        >
          Generate Description
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-2 rounded-lg text-sm shadow-md max-w-[75%] ${
                msg.sender === "user"
                  ? "bg-purple-600/70 text-white rounded-bl-none"
                  : "bg-gray-800/70 text-white rounded-br-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="p-2 rounded-lg text-sm bg-gray-800/60 text-white animate-pulse">
              Hub Scout AI is typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={tab === "ask" ? handleAskSubmit : handleGenerateSubmit}
        className="p-3 border-t border-purple-500/30 bg-gray-800/80 flex space-x-2"
      >
        <input
          type="text"
          placeholder={
            tab === "ask" ? "Ask Hub Scout AI..." : "Enter listing details..."
          }
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
        />
        <button
          type="submit"
          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <PaperAirplaneIcon className="w-5 h-5 transform rotate-45 -mt-1" />
        </button>
      </form>

      {/* Resizer */}
      <Resizer onMouseDown={startResize} />
    </div>
  );
};

export default HubScoutWidget;
