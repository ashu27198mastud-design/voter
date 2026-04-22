'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, UserLocation } from '../types';
import { askElectionQuestion } from '@/services/ai';
import { QuerySchema } from '../lib/validation';
import { sanitizeHtml } from '../lib/security';

interface ChatInterfaceProps {
  location: UserLocation | null;
}

/**
 * ChatInterface Component
 * A floating, accessible chat bubble in the bottom right corner.
 * Integrates with Gemini API for answering election-specific questions.
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({ location }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{
      id: 'welcome-msg',
      text: "Hi! I'm your VotePath Assistant. I can help you understand your personalized election roadmap and civic duties.",
      sender: 'ai',
      timestamp: Date.now()
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    try {
        // Validate input
        const validated = QuerySchema.parse({ query: inputValue });
        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            text: validated.query,
            sender: 'user',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        // Fetch AI response
        const responseText = await askElectionQuestion(validated.query, location || undefined);

        const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            text: responseText,
            sender: 'ai',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, aiMsg]);
    } catch (err: unknown) {
        // Handle validation errors or API errors
        console.error("Chat error:", err);
        const errorMsg: ChatMessage = {
            id: `error-${Date.now()}`,
            text: "I cannot process that question right now. Please ensure it is related to the election process.",
            sender: 'ai',
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" onKeyDown={handleKeyDown}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-100 w-80 sm:w-96 h-[32rem] mb-4 flex flex-col overflow-hidden"
            role="dialog"
            aria-label="Election Assistant Chat"
          >
            {/* Header */}
            <div className="bg-election-blue-600 text-white p-4 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                VotePath Assistant
              </h3>
              <button 
                onClick={handleToggle}
                className="text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded"
                aria-label="Close chat"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3" aria-live="polite">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.sender === 'user' 
                      ? 'bg-election-blue-500 text-white rounded-tr-sm self-end' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm self-start shadow-sm'
                  }`}
                >
                  {msg.sender === 'ai' ? (
                    <div className="prose prose-sm prose-blue">
                      {/* Extract text parts and potential JSON block */}
                      {(() => {
                        const jsonRegex = /```json\s*([\s\S]*?)```|\[\s*\{\s*"event"[\s\S]*\}\s*\]/;
                        const match = msg.text.match(jsonRegex);
                        
                        if (match) {
                          const jsonStr = match[1] || match[0];
                          try {
                            const events = JSON.parse(jsonStr);
                            const cleanText = msg.text.replace(jsonRegex, '').replace(/```json|```/g, '').trim();
                            
                            return (
                              <>
                                {cleanText && <div dangerouslySetInnerHTML={{ __html: cleanText }} className="mb-3" />}
                                <div className="space-y-2 mt-2">
                                  {events.map((ev: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">{ev.date}</div>
                                      <div className="font-bold text-gray-900">{ev.event}</div>
                                      {ev.description && <div className="text-xs text-gray-600 mt-1">{ev.description}</div>}
                                    </div>
                                  ))}
                                </div>
                              </>
                            );
                          } catch (e) {
                            return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.text) }} />;
                          }
                        }
                        return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.text) }} />;
                      })()}
                    </div>
                  ) : (
                    <p className="text-sm">{msg.text}</p>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="bg-white border border-gray-200 text-gray-500 rounded-2xl rounded-tl-sm self-start p-3 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  <span className="sr-only">AI is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 shrink-0">
              <div className="relative flex items-center">
                <label htmlFor="chat-input" className="sr-only">Type your question</label>
                <input
                  ref={inputRef}
                  id="chat-input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about the voting process..."
                  className="w-full pl-4 pr-12 py-3 rounded-full border border-gray-200 focus:border-election-blue-500 focus:ring-2 focus:ring-election-blue-100 outline-none text-sm bg-gray-50 focus:bg-white transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 p-2 bg-election-blue-500 text-white rounded-full hover:bg-election-blue-600 disabled:opacity-50 disabled:hover:bg-election-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-election-blue-500 transition-colors"
                  aria-label="Send message"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <button
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-label="Toggle Election Guide Chat"
        className="w-16 h-16 bg-election-amber-500 hover:bg-election-amber-600 text-white rounded-full shadow-[0_8px_24px_rgba(251,140,0,0.3)] flex items-center justify-center transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-election-amber-200"
      >
        {isOpen ? (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  );
};
