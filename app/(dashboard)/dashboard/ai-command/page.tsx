"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Message = {
    id: string;
    role: "user" | "ai";
    content: string;
};

export default function AICommandCenter() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "ai",
            content: "Hello. I am the Fitted Agency AI. What new capability should we build for your workspace today?",
        },
    ]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || loading) return;

        const userMessage = { id: Date.now().toString(), role: "user" as const, content: prompt };
        setMessages((prev) => [...prev, userMessage]);
        setPrompt("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/evolve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userMessage.content }),
            });
            const data = await res.json();

            setMessages((prev) => [
                ...prev,
                { id: Date.now().toString(), role: "ai", content: data.message },
            ]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { id: Date.now().toString(), role: "ai", content: "Error processing the evolution request. Please try again later." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl tracking-tight text-[#E8E0D4]" style={{ fontFamily: "var(--font-display)" }}>
                    Command Center
                </h1>
                <p className="text-[#8A817A] text-sm mt-2">
                    Chat with the AI below to dynamically evolve your database scheme, generate new dashboards, or construct automated pipelines on the fly.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 bg-[#131110] border border-[#2A2520] p-6 rounded-2xl flex flex-col gap-6">
                {messages.map((m) => (
                    <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${m.role === "user"
                                    ? "bg-[#D4734E] text-[#0B0B0B]"
                                    : "bg-[#1A1816] border border-[#2A2520] text-[#E8E0D4]"
                                }`}
                        >
                            {m.content}
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex w-full justify-start"
                    >
                        <div className="bg-[#1A1816] border border-[#2A2520] rounded-2xl px-5 py-3 text-sm text-[#8A817A]">
                            Evolving the platform...
                        </div>
                    </motion.div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-3 h-14">
                <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Add a 'Dietary Restrictions' column to my Contacts and build a Kanban view."
                    className="flex-1 bg-[#1A1816] border border-[#2A2520] focus:border-[#D4734E]/50 focus:outline-none focus:ring-1 focus:ring-[#D4734E]/20 text-[#E8E0D4] px-5 rounded-xl text-sm transition-all"
                />
                <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="bg-[#D4734E] text-[#0B0B0B] font-medium px-6 rounded-xl hover:bg-[#E8845D] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Execute
                </button>
            </form>
        </div>
    );
}
