import { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";
import { ModelType, Platform } from "@/types";

interface InputAreaProps {
  activeModel: ModelType;
  onSend: (content: string, platforms?: Platform[]) => void;
  isLoading: boolean;
}

const platforms: Platform[] = ["facebook", "linkedin", "twitter"];

const platformLabels: Record<Platform, string> = {
  facebook: "Facebook",
  linkedin: "LinkedIn",
  twitter: "X (Twitter)",
};

export function InputArea({ activeModel, onSend, isLoading }: InputAreaProps) {
  const [input, setInput] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["facebook", "linkedin", "twitter"]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAsknow = activeModel === "asknow";

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + "px";
    }
  }, [input]);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    if (!isAsknow && selectedPlatforms.length === 0) return;
    onSend(input.trim(), isAsknow ? undefined : selectedPlatforms);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = input.trim().length > 0 && !isLoading && (isAsknow || selectedPlatforms.length > 0);

  return (
    <div className="border-t border-white/10 bg-[#0d0d0d]/80 backdrop-blur-xl px-4 py-4">
      <div className="max-w-3xl mx-auto">

        {/* Platform selector for PostGen */}
        {!isAsknow && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-white/35 font-medium">Generate for:</span>
            <div className="flex gap-2 flex-wrap">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border",
                    selectedPlatforms.includes(p)
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "bg-white/5 border-white/10 text-white/30 hover:border-white/20 hover:text-white/50"
                  )}
                >
                  {platformLabels[p]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Box */}
        <div className={cn(
          "flex items-end gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
          isAsknow
            ? "bg-white/5 border-white/10 focus-within:border-violet-500/40 focus-within:bg-violet-500/5"
            : "bg-white/5 border-white/10 focus-within:border-emerald-500/40 focus-within:bg-emerald-500/5"
        )}>
          {/* Icon */}
          <div className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mb-0.5",
            isAsknow ? "text-violet-400" : "text-emerald-400"
          )}>
            {isAsknow ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAsknow
                ? "Ask me anything I'll find the best answer for you..."
                : "Paste a website URL or describe a topic for your posts..."
            }
            rows={1}
            className="flex-1 bg-transparent text-white/90 placeholder-white/25 text-sm resize-none outline-none leading-relaxed min-h-[24px] max-h-[180px] overflow-y-auto"
          />

          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 mb-0.5",
              canSend
                ? isAsknow
                  ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white hover:from-violet-400 hover:to-indigo-500 shadow-lg shadow-violet-500/25"
                  : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/25"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Spacer */}
        <div className="mt-1" />
      </div>
    </div>
  );
}
