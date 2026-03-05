import { useState, useEffect } from "react";
import { cn } from "@/utils/cn";
import { ModelType, Conversation } from "@/types";

interface SidebarProps {
  activeModel: ModelType;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onShareConversation: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string };
  onLogout: () => void;
}

export function Sidebar({
  activeModel,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onShareConversation,
  isOpen,
  onClose,
  user,
  onLogout,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Close menus if clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleRenameSubmit = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed md:relative z-30 md:z-auto inset-y-0 left-0 flex flex-col w-72 bg-[#0d0d0d] border-r border-white/10 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">NexaAI</span>
          <button onClick={onClose} className="ml-auto md:hidden text-white/40 hover:text-white/80 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>



        {/* New Chat Button */}
        <div className="px-3 pt-4">
          <button
            onClick={onNewConversation}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border",
              activeModel === "asknow"
                ? "border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/20 text-sm">No chats yet</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-white/25 uppercase tracking-widest px-2 mb-2">Recent</p>
              {conversations.map((convo) => (
                <div
                  key={convo.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredId(convo.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {editingId === convo.id ? (
                    <div className="px-3 py-2 w-full bg-white/10 rounded-xl border border-white/20">
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleRenameSubmit(convo.id)}
                        onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit(convo.id)}
                        className="w-full bg-transparent text-sm text-white outline-none"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectConversation(convo.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 pr-8",
                        activeConversationId === convo.id
                          ? "bg-white/10 text-white border border-white/20"
                          : "text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <p className="truncate font-medium">{convo.title}</p>
                    </button>
                  )}

                  {/* Three-dot menu button */}
                  {(hoveredId === convo.id || menuOpenId === convo.id) && editingId !== convo.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === convo.id ? null : convo.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all z-10"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                      </svg>
                    </button>
                  )}

                  {/* Dropdown Menu */}
                  {menuOpenId === convo.id && (
                    <div
                      className="absolute right-2 top-10 w-32 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditTitle(convo.title);
                          setEditingId(convo.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                        Rename
                      </button>

                      <button
                        onClick={() => {
                          onShareConversation(convo.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-white/5 text-white/70 hover:text-white transition-colors border-t border-white/5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                        </svg>
                        Share
                      </button>

                      <button
                        onClick={() => {
                          onDeleteConversation(convo.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors border-t border-white/5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          {/* User info + Logout */}
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-white/3 border border-white/8">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/80 truncate">{user.name}</p>
              <p className="text-xs text-white/30 truncate">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>

          {/* Developer credit */}
          <p className="text-center text-xs text-white/15 pt-1">
            Developed by <span className="text-violet-400/50 font-medium">Furqan</span>
          </p>
        </div>
      </aside>
    </>
  );
}
