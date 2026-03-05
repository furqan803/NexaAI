import { cn } from "@/utils/cn";
import { ModelType } from "@/types";

interface WelcomeScreenProps {
  activeModel: ModelType;
  onExampleClick: (text: string) => void;
}

const asknowExamples = [
  "What is artificial intelligence?",
  "Latest tech news in 2025",
  "How does machine learning work?",
  "Best programming languages to learn",
];

const postgenExamples = [
  "https://openai.com",
  "https://github.com/trending",
  "Write posts about AI trends 2025",
  "Create posts about remote work benefits",
];

const asknowFeatures = [
  { icon: "🌐", label: "Web Search" },
  { icon: "⚡", label: "Real-time Answers" },
  { icon: "🧠", label: "Smart AI" },
  { icon: "💬", label: "Conversational" },
];

const postgenFeatures = [
  { icon: "🔗", label: "URL to Posts" },
  { icon: "📘", label: "Facebook" },
  { icon: "💼", label: "LinkedIn" },
  { icon: "🐦", label: "X / Twitter" },
];

export function WelcomeScreen({ activeModel, onExampleClick }: WelcomeScreenProps) {
  const isAsknow = activeModel === "asknow";
  const features = isAsknow ? asknowFeatures : postgenFeatures;
  const examples = isAsknow ? asknowExamples : postgenExamples;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 h-full overflow-hidden">
      {/* Icon */}
      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-2xl text-2xl",
          isAsknow
            ? "bg-gradient-to-br from-violet-500 to-indigo-700 shadow-violet-500/25"
            : "bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/25"
        )}
      >
        {isAsknow ? "🔍" : "✍️"}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white mb-2 text-center tracking-tight">
        {isAsknow ? "AskNow AI" : "Post Gen"}
      </h1>

      {/* Subtitle */}
      <p className="text-white/40 text-center text-sm mb-2 max-w-md leading-relaxed font-medium">
        {isAsknow
          ? "Your intelligent search companion"
          : "Your social media content creator"}
      </p>
      <p className="text-white/25 text-center text-xs mb-6 max-w-sm leading-relaxed">
        {isAsknow
          ? "Ask any question and get accurate, up-to-date answers backed by real-time web search results."
          : "Paste any website link or describe a topic — get ready-to-post content for all your social platforms instantly."}
      </p>

      {/* Feature Pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {features.map((item) => (
          <span
            key={item.label}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
              isAsknow
                ? "bg-violet-500/8 border-violet-500/20 text-violet-300"
                : "bg-emerald-500/8 border-emerald-500/20 text-emerald-300"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </span>
        ))}
      </div>

      {/* Example prompts */}
      <div className="w-full max-w-xl">
        <p className="text-xs text-white/20 uppercase tracking-widest font-medium text-center mb-3">
          ✨ Try these examples
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {examples.map((example, i) => (
            <button
              key={i}
              onClick={() => onExampleClick(example)}
              className={cn(
                "text-left px-3 py-2.5 rounded-xl border text-sm transition-all duration-200 group",
                isAsknow
                  ? "bg-violet-500/4 border-violet-500/15 text-white/50 hover:text-white hover:bg-violet-500/10 hover:border-violet-500/35"
                  : "bg-emerald-500/4 border-emerald-500/15 text-white/50 hover:text-white hover:bg-emerald-500/10 hover:border-emerald-500/35"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs transition-all group-hover:translate-x-0.5",
                    isAsknow
                      ? "text-violet-500 group-hover:text-violet-300"
                      : "text-emerald-500 group-hover:text-emerald-300"
                  )}
                >
                  →
                </span>
                <span className="truncate">{example}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
