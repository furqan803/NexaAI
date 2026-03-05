import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MessageBubble } from "@/components/MessageBubble";
import { InputArea } from "@/components/InputArea";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { AuthModal } from "@/components/AuthModal";
import { askNowQuery, generatePosts, generateConversationTitle } from "@/services/aiService";
import { supabase } from "../lib/supabaseClient";
import { cn } from "@/utils/cn";
import { Message, ModelType, Platform, Conversation } from "@/types";

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const FREE_PROMPT_LIMIT = 2;

interface AuthUser {
  name: string;
  email: string;
}

export function App() {
  // ── Auth State ─────────────────────────────────────────────────────────────
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Initial session check
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
          email: user.email || ""
        });
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "User",
          email: session.user.email || ""
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch Conversations on Login ───────────────────────────────────────────
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: convos, error: convosError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (convosError) {
        console.error("Error fetching conversations:", convosError);
        return;
      }

      if (convos && convos.length > 0) {
        const { data: msgs, error: msgsError } = await supabase
          .from('messages')
          .select('*')
          .eq('user_id', authUser.id)
          .order('timestamp', { ascending: true });

        if (msgsError) {
          console.error("Error fetching messages:", msgsError);
          return;
        }

        const formattedConversations: Conversation[] = convos.map(c => ({
          id: c.id,
          title: c.title,
          createdAt: new Date(c.created_at),
          messages: (msgs || [])
            .filter(m => m.conversation_id === c.id)
            .map(m => ({
              id: m.id,
              role: m.role,
              content: m.content,
              model: m.model as ModelType,
              timestamp: new Date(m.timestamp),
              platforms: m.platforms,
              posts: m.posts,
            }))
        }));

        setConversations(formattedConversations);
      }
    };

    fetchHistory();
  }, [user]);

  // ── App State ──────────────────────────────────────────────────────────────
  const [activeModel, setActiveModel] = useState<ModelType>("asknow");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toolDropdownOpen, setToolDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [guestPromptCount, setGuestPromptCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem("nexaai_guest_prompts") || "0", 10);
    } catch {
      return 0;
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;
  const messages = activeConversation?.messages ?? [];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Auth Handlers ──────────────────────────────────────────────────────────
  const handleAuth = useCallback((authUser: AuthUser) => {
    setUser(authUser);
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setConversations([]);
    setActiveConversationId(null);
  }, []);

  // ── Chat Handlers ──────────────────────────────────────────────────────────
  const createNewConversation = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const handleModelChange = useCallback((model: ModelType) => {
    setActiveModel(model);
    setActiveConversationId(null);
    setSidebarOpen(false);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setSidebarOpen(false); // Optional: close sidebar on mobile if selected

    // Update the active model based on the conversation's last message
    const convo = conversations.find((c) => c.id === id);
    if (convo && convo.messages.length > 0) {
      // Find the last assistant message to determine tool used
      const lastMessage = convo.messages[convo.messages.length - 1];
      if (lastMessage && lastMessage.model) {
        setActiveModel(lastMessage.model);
      }
    }
  }, [conversations]);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) setActiveConversationId(null);

      // Sync with Supabase if logged in
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await supabase.from('conversations').delete().eq('id', id);
      }
    },
    [activeConversationId]
  );

  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );

    // Sync with Supabase if logged in
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await supabase.from('conversations').update({ title: newTitle }).eq('id', id);
    }
  }, []);

  const handleShareConversation = useCallback((id: string) => {
    const convo = conversations.find((c) => c.id === id);
    if (!convo) return;

    // Simple text formatting for sharing
    const textToShare = convo.messages
      .filter((m) => !m.isLoading && m.content)
      .map((m) => `${m.role === "user" ? "You" : "AI"}:\n${m.content}`)
      .join("\n\n---\n\n");

    navigator.clipboard.writeText(`Conversation: ${convo.title}\n\n${textToShare}`)
      .then(() => alert("Conversation copied to clipboard!"))
      .catch((err) => console.error("Failed to copy:", err));
  }, [conversations]);

  const handleSend = useCallback(
    async (content: string, platforms?: Platform[]) => {
      if (isLoading) return;

      // Check if guest user has exceeded free prompt limit
      if (!user) {
        if (guestPromptCount >= FREE_PROMPT_LIMIT) {
          setAuthModalOpen(true);
          return;
        }
        const newCount = guestPromptCount + 1;
        setGuestPromptCount(newCount);
        localStorage.setItem("nexaai_guest_prompts", String(newCount));
      }

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        model: activeModel,
        timestamp: new Date(),
        platforms,
      };

      const loadingId = generateId();
      const loadingMessage: Message = {
        id: loadingId,
        role: "assistant",
        content: "",
        model: activeModel,
        timestamp: new Date(),
        isLoading: true,
      };

      let conversationId = activeConversationId;

      if (!conversationId) {
        const newConvo: Conversation = {
          id: generateId(),
          title: "New Chat",
          messages: [userMessage, loadingMessage],
          createdAt: new Date(),
        };
        setConversations((prev) => [newConvo, ...prev]);
        setActiveConversationId(newConvo.id);
        conversationId = newConvo.id;

        // Fire & forget title generation
        generateConversationTitle(content).then((title) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === conversationId ? { ...c, title } : c))
          );
        });
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, userMessage, loadingMessage] }
              : c
          )
        );
      }

      setIsLoading(true);

      try {
        let currentConvoId = conversationId;
        const { data: { user: authUser } } = await supabase.auth.getUser();

        // 1. If it's a new conversation and user is logged in, create it in Supabase first
        if (!activeConversationId && authUser) {
          const { data: newConvoData, error: convoError } = await supabase
            .from('conversations')
            .insert([{ user_id: authUser.id, title: "New Chat" }])
            .select()
            .single();

          if (convoError) throw convoError;
          currentConvoId = newConvoData.id;
          setActiveConversationId(currentConvoId);

          // Update the local state with the actual Supabase ID
          setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, id: currentConvoId! } : c));
        }

        // 2. Save user message to Supabase
        if (authUser && currentConvoId) {
          await supabase.from("messages").insert([
            {
              conversation_id: currentConvoId,
              user_id: authUser.id,
              role: "user",
              content,
              model: activeModel,
            }
          ]);
        }

        let assistantMessage: Message;

        if (activeModel === "asknow") {
          const answer = await askNowQuery(content);
          assistantMessage = {
            id: generateId(),
            role: "assistant",
            content: answer,
            model: "asknow",
            timestamp: new Date(),
            isLoading: false,
          };
        } else {
          const selectedPlatforms = platforms ?? (["facebook", "linkedin", "twitter"] as Platform[]);
          const posts = await generatePosts(content, selectedPlatforms);
          assistantMessage = {
            id: generateId(),
            role: "assistant",
            content: "",
            model: "postgen",
            timestamp: new Date(),
            platforms: selectedPlatforms,
            posts,
            isLoading: false,
          };
        }

        // 3. Save assistant message to Supabase
        if (authUser && currentConvoId) {
          await supabase.from("messages").insert([
            {
              conversation_id: currentConvoId,
              user_id: authUser.id,
              role: assistantMessage.role,
              content: assistantMessage.content,
              model: assistantMessage.model,
              platforms: assistantMessage.platforms,
              posts: assistantMessage.posts,
            }
          ]);
        }

        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConvoId
              ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === loadingId ? assistantMessage : m
                ),
              }
              : c
          )
        );

        // Update title if it's still "New Chat"
        if (!activeConversationId) {
          generateConversationTitle(content).then(async (title) => {
            setConversations((prev) =>
              prev.map((c) => (c.id === currentConvoId ? { ...c, title } : c))
            );
            if (authUser && currentConvoId) {
              await supabase.from('conversations').update({ title }).eq('id', currentConvoId);
            }
          });
        }
      } catch (err) {
        const errorText =
          err instanceof Error ? `❌ ${err.message}` : "❌ Something went wrong. Please try again.";

        setConversations((prev) =>
          prev.map((c) =>
            c.id === (activeConversationId || conversationId)
              ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === loadingId
                    ? { ...m, content: errorText, isLoading: false }
                    : m
                ),
              }
              : c
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, activeModel, activeConversationId, user]
  );

  const handleExampleClick = useCallback(
    (text: string) => {
      handleSend(
        text,
        activeModel === "postgen" ? ["facebook", "linkedin", "twitter"] : undefined
      );
    },
    [handleSend, activeModel]
  );

  const handleEditMessage = useCallback(
    (messageId: string, newContent: string) => {
      if (!activeConversationId) return;

      // Remove the edited message and everything after it
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConversationId) return c;
          const idx = c.messages.findIndex((m) => m.id === messageId);
          if (idx === -1) return c;
          return { ...c, messages: c.messages.slice(0, idx) };
        })
      );

      // Re-send with new content
      handleSend(
        newContent,
        activeModel === "postgen" ? ["facebook", "linkedin", "twitter"] : undefined
      );
    },
    [activeConversationId, handleSend, activeModel]
  );

  // ── Main App ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#141414] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeModel={activeModel}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={createNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onShareConversation={handleShareConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user ?? { name: "Guest", email: "" }}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-[#141414]/90 backdrop-blur-xl">
          {/* Mobile menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/8 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Tool Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setToolDropdownOpen(!toolDropdownOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all shadow-sm",
                activeModel === "asknow"
                  ? "bg-violet-500/10 border-violet-500/20 text-violet-300 hover:bg-violet-500/20"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20"
              )}
            >
              {activeModel === "asknow" ? (
                <>
                  <span className="text-base">🔍</span>
                  AskNow AI
                </>
              ) : (
                <>
                  <span className="text-base">✍️</span>
                  Post Gen
                </>
              )}
              <svg className={cn("w-4 h-4 ml-1 transition-transform duration-200", toolDropdownOpen ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {toolDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setToolDropdownOpen(false)} />
                <div className="absolute top-full mt-2 left-0 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                  <button
                    onClick={() => { handleModelChange("asknow"); setToolDropdownOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                      activeModel === "asknow" ? "bg-white/5 text-violet-300 font-medium" : "text-white/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="text-base">🔍</span>
                    AskNow AI
                  </button>
                  <button
                    onClick={() => { handleModelChange("postgen"); setToolDropdownOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors border-t border-white/5",
                      activeModel === "postgen" ? "bg-white/5 text-emerald-300 font-medium" : "text-white/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="text-base">✍️</span>
                    Post Gen
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex-1" />

          {/* Auth / Greeting */}
          {user ? (
            <p className="hidden sm:block text-xs text-white/30 font-medium">
              Welcome back, <span className="text-white/60">{user.name.split(" ")[0]}</span> 👋
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-sm text-white/50 hover:text-white/80 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all font-medium"
              >
                Log in
              </button>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-1.5 rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all font-semibold shadow-lg shadow-violet-500/20"
              >
                Sign up
              </button>
            </div>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen activeModel={activeModel} onExampleClick={handleExampleClick} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} onEditMessage={handleEditMessage} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <InputArea activeModel={activeModel} onSend={handleSend} isLoading={isLoading} />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuth={(u) => { handleAuth(u); setAuthModalOpen(false); }}
      />
    </div>
  );
}
