import { ReactElement, useState } from "react";
import { cn } from "@/utils/cn";
import { Message, Platform } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const platformIcons: Record<Platform, ReactElement> = {
  facebook: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  linkedin: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  twitter: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
};

const platformConfig: Record<Platform, { gradient: string; bg: string; label: string }> = {
  facebook: {
    gradient: "from-blue-600 to-blue-700",
    bg: "bg-blue-500/8 border-blue-500/20",
    label: "Facebook",
  },
  linkedin: {
    gradient: "from-sky-600 to-blue-700",
    bg: "bg-sky-500/8 border-sky-500/20",
    label: "LinkedIn",
  },
  twitter: {
    gradient: "from-slate-600 to-slate-700",
    bg: "bg-slate-500/8 border-slate-500/20",
    label: "X (Twitter)",
  },
};

interface MessageBubbleProps {
  message: Message;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy"}
      className={cn(
        "p-1.5 rounded-lg transition-all text-xs flex items-center gap-1",
        copied
          ? "text-green-400 bg-green-500/10"
          : "text-white/25 hover:text-white/60 hover:bg-white/8"
      )}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-xs">Copied</span>
        </>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
      )}
    </button>
  );
}

export function MessageBubble({ message, onEditMessage }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isAsknow = message.model === "asknow";
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [isHovered, setIsHovered] = useState(false);

  // ── User message ──────────────────────────────────────────────────────────
  if (isUser) {
    return (
      <div
        className="flex justify-end mb-5 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Edit button — shows on hover */}
        {isHovered && !isEditing && (
          <button
            onClick={() => {
              setEditText(message.content);
              setIsEditing(true);
            }}
            className="self-center mr-2 p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/8 transition-all"
            title="Edit message"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </button>
        )}

        <div className="max-w-[80%] md:max-w-[68%]">
          {isEditing ? (
            <div className="bg-white/5 border border-white/15 rounded-2xl p-3">
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none resize-none min-h-[40px]"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (editText.trim() && onEditMessage) {
                      onEditMessage(message.id, editText.trim());
                    }
                    setIsEditing(false);
                  }
                  if (e.key === "Escape") {
                    setIsEditing(false);
                  }
                }}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editText.trim() && onEditMessage) {
                      onEditMessage(message.id, editText.trim());
                    }
                    setIsEditing(false);
                  }}
                  className={cn(
                    "px-3 py-1 text-xs rounded-lg text-white font-medium transition-all",
                    isAsknow
                      ? "bg-violet-600 hover:bg-violet-500"
                      : "bg-emerald-600 hover:bg-emerald-500"
                  )}
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white",
                  isAsknow
                    ? "bg-gradient-to-br from-violet-600 to-indigo-700"
                    : "bg-gradient-to-br from-emerald-600 to-teal-700"
                )}
              >
                {message.content}
              </div>
              <p className="text-xs text-white/20 mt-1 text-right">
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Loading animation ─────────────────────────────────────────────────────
  if (message.isLoading) {
    return (
      <div className="flex gap-3 mb-5">
        <div className="px-4 py-3.5">
          <div className="flex gap-1.5 items-center">
            {[0, 150, 300].map((delay) => (
              <div
                key={delay}
                className={cn(
                  "w-2 h-2 rounded-full animate-bounce",
                  isAsknow ? "bg-violet-400" : "bg-emerald-400"
                )}
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
            <span className="text-xs text-white/30 ml-1">
              {isAsknow ? "Searching the web..." : "Crafting your posts..."}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── AskNow AI response ────────────────────────────────────────────────────
  if (isAsknow) {
    return (
      <div className="flex gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <div className="py-3">
            <div className="flex items-center justify-end mb-1">
              <CopyButton text={message.content} />
            </div>
            <div className="text-sm text-white/80 leading-relaxed break-words prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
          <p className="text-xs text-white/20 mt-1.5 ml-1">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    );
  }

  // ── Post Gen response ─────────────────────────────────────────────────────
  const platforms = (message.platforms ?? []) as Platform[];
  const posts = (message.posts ?? {}) as Record<Platform, string>;

  // If content has error text
  if (message.content && message.content.startsWith("❌")) {
    return (
      <div className="flex gap-3 mb-5">
        <div className="flex-1">
          <div className="bg-red-500/5 border border-red-500/15 rounded-2xl px-4 py-3.5">
            <p className="text-sm text-red-300/80">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-5">
      <div className="flex-1 min-w-0">
        <div className="py-3">
          <div className="space-y-4">
            {platforms.map((platform) => (
              <div
                key={platform}
                className={cn("rounded-xl border p-4", platformConfig[platform].bg)}
              >
                {/* Platform header */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r text-white text-xs font-semibold",
                      platformConfig[platform].gradient
                    )}
                  >
                    {platformIcons[platform]}
                    {platformConfig[platform].label}
                  </div>
                  <CopyButton text={posts[platform] ?? ""} />
                </div>

                {/* Post content */}
                <div className="text-sm text-white/75 leading-relaxed break-words prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10">
                  {posts[platform] ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {posts[platform]}
                    </ReactMarkdown>
                  ) : (
                    "Post content not available"
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/20 mt-1.5 ml-1">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
