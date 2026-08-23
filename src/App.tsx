import DOMPurify from "dompurify";
import { marked } from "marked";
import { useEffect, useRef, useState } from "react";
import type { AIMessage } from "./ai/types";
import type { AgentState, TaskPlan, ToolMetadata } from "./brain/types";
import type { Memory, RankedMemory } from "./memory/types";
import { loadConfig } from "./config/env";
import { ChatController } from "./services/chatController";
import {
  ConversationManager,
  type Conversation,
} from "./services/conversationManager";
import { initialAppState } from "./state/appStore";
import type {
  AIState,
  AppNotification,
  AppState,
  NavigationItem,
  NotificationKind,
} from "./shared/types";
import "./styles.css";

const config = loadConfig();
const navItems: Array<{ id: NavigationItem; label: string; icon: string }> = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "chat", label: "Chat", icon: "◌" },
  { id: "core", label: "JARVIS", icon: "◉" },
  { id: "tools", label: "Tools", icon: "⌘" },
  { id: "memory", label: "Memory", icon: "◇" },
  { id: "vision", label: "Vision", icon: "◉" },
  { id: "settings", label: "Settings", icon: "⚙" },
];
const quickActions = [
  { label: "Ask JARVIS", icon: "⌁", state: "listening" as AIState },
  { label: "System Status", icon: "◫", state: "thinking" as AIState },
  { label: "Open Apps", icon: "▦", state: "executing" as AIState },
  { label: "Search Web", icon: "⌕", state: "thinking" as AIState },
  { label: "Developer Mode", icon: "</>", state: "idle" as AIState },
];

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
function StatusIndicator({
  label,
  tone = "cyan",
}: {
  label: string;
  tone?: "cyan" | "amber" | "red";
}) {
  return (
    <span className={`status-indicator status-${tone}`}>
      <i />
      {label}
    </span>
  );
}
function GlassPanel({
  children,
  className = "",
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section className={`glass-panel ${className}`}>
      {label && (
        <p className="panel-label">
          {label}
          <span>+</span>
        </p>
      )}
      {children}
    </section>
  );
}
function ParticleField() {
  return (
    <div className="particle-field" aria-hidden="true">
      {Array.from({ length: 28 }, (_, index) => (
        <i
          key={index}
          style={
            {
              "--x": `${(index * 37) % 100}%`,
              "--y": `${(index * 61) % 100}%`,
              "--delay": `${(index % 7) * -1.4}s`,
              "--size": `${(index % 3) + 1}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
function OrbitalRings({ state }: { state: AIState }) {
  return (
    <div className={`core-visual state-${state}`} aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <div className="energy-sphere">
        <div className="core-light" />
        <div className="core-cross" />
      </div>
      <div className="core-particles">
        {Array.from({ length: 10 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
    </div>
  );
}
function AudioWaveform({ state }: { state: AIState }) {
  return (
    <div
      className={`waveform waveform-${state}`}
      aria-label={`${state} audio waveform`}
    >
      {Array.from({ length: 24 }, (_, index) => (
        <i
          key={index}
          style={
            {
              "--bar": `${18 + ((index * 17) % 55)}%`,
              "--delay": `${index * 0.035}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
function AICore({ state, onVoice }: { state: AIState; onVoice: () => void }) {
  const stateCopy: Record<AIState, string> = {
    idle: "READY",
    listening: "LISTENING...",
    thinking: "ANALYZING...",
    speaking: "SPEAKING...",
    executing: "EXECUTING...",
    success: "COMPLETE",
    warning: "CHECK REQUIRED",
    error: "ACTION FAILED",
    offline: "OFFLINE",
  };
  return (
    <div className="core-stage">
      <div className="stage-coordinate">CORE / 01</div>
      <OrbitalRings state={state} />
      <div className="core-caption">
        <span className="core-overline">JARVIS CORE</span>
        <strong>{stateCopy[state]}</strong>
        <span className="core-detail">
          {state === "idle"
            ? "Awaiting your command"
            : "Neural interface active"}
        </span>
      </div>
      <AudioWaveform state={state} />
      <button
        className="voice-button"
        onClick={onVoice}
        aria-label={
          state === "listening" ? "Stop listening" : "Activate voice interface"
        }
      >
        <span>◉</span>
        <b>{state === "listening" ? "Listening..." : "Tap to speak"}</b>
      </button>
    </div>
  );
}
function QuickActions({
  onAction,
}: {
  onAction: (state: AIState, label: string) => void;
}) {
  return (
    <GlassPanel label="QUICK ACTIONS" className="quick-panel">
      <div className="action-list">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => onAction(action.state, action.label)}
          >
            <span>{action.icon}</span>
            {action.label}
            <b>↗</b>
          </button>
        ))}
      </div>
    </GlassPanel>
  );
}
function SystemOverview({ toolCount }: { toolCount: number }) {
  return (
    <GlassPanel label="SYSTEM OVERVIEW" className="overview-panel">
      <div className="overview-grid">
        <div>
          <strong>ONLINE</strong>
          <span>SYSTEM</span>
        </div>
        <div>
          <strong>READY</strong>
          <span>AI ENGINE</span>
        </div>
        <div>
          <strong>READY</strong>
          <span>VOICE</span>
        </div>
        <div>
          <strong>{toolCount || "..."} </strong>
          <span>TOOLS</span>
        </div>
      </div>
      <div className="memory-line">
        <span>MEMORY BUFFER</span>
        <b>
          <i />
        </b>
        <em>ACTIVE</em>
      </div>
    </GlassPanel>
  );
}
function ActivityFeed() {
  return (
    <GlassPanel label="RECENT ACTIVITY" className="activity-panel">
      <div className="activity-feed">
        <p>
          <time>14:31</time>
          <span>System initialized</span>
        </p>
        <p>
          <time>14:29</time>
          <span>AI provider connected</span>
        </p>
        <p>
          <time>14:27</time>
          <span>JARVIS started</span>
        </p>
      </div>
    </GlassPanel>
  );
}
function VisionCenter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState("VISION READY");
  const [preview, setPreview] = useState<string>();
  const [source, setSource] = useState("No image selected");
  useEffect(() => () => { streamRef.current?.getTracks().forEach((track) => track.stop()); if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const selectImage = (file: File | undefined) => {
    if (!file) return;
    if (!new Set(["image/png", "image/jpeg", "image/webp"]).has(file.type) || file.size > 10 * 1024 * 1024) { setStatus("ERROR"); setSource("PNG, JPEG, or WEBP under 10 MB required"); return; }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file)); setSource(file.name); setStatus("COMPLETE");
  };
  const captureScreen = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) { setStatus("ERROR"); setSource("Screen capture is unavailable in this browser"); return; }
    setStatus("CAPTURING");
    try { const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }); streamRef.current = stream; const video = document.createElement("video"); video.srcObject = stream; await video.play(); await new Promise((resolve) => window.setTimeout(resolve, 150)); const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight; canvas.getContext("2d")?.drawImage(video, 0, 0); if (preview) URL.revokeObjectURL(preview); setPreview(canvas.toDataURL("image/png")); setSource("Screen capture"); setStatus("COMPLETE"); stream.getTracks().forEach((track) => track.stop()); streamRef.current = null; } catch { setStatus("VISION READY"); setSource("Screen capture cancelled"); }
  };
  return <div className="vision-center"><div className="vision-heading"><span>JARVIS VISION / ON DEMAND</span><StatusIndicator label={status} tone={status === "ERROR" ? "red" : status === "CAPTURING" ? "amber" : "cyan"} /></div><div className="vision-controls"><button onClick={() => inputRef.current?.click()}>＋ IMAGE</button><input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => selectImage(event.target.files?.[0])} /><button onClick={() => void captureScreen()}>◉ CAPTURE SCREEN</button></div><div className={`vision-preview ${preview ? "has-preview" : ""}`}>{preview ? <img src={preview} alt="Selected visual input" /> : <span>SCREEN ACCESS OFF<br />CAMERA OFF</span>}</div><div className="vision-source"><span>{source}</span><small>Images remain local until an analysis provider is configured.</small></div></div>;
}
function MessageList({
  messages,
  onRetry,
}: {
  messages: AIMessage[];
  onRetry: () => void;
}) {
  return (
    <div className="message-list" aria-live="polite">
      {messages.map((message) =>
        message.role === "user" ? (
          <article className="message message-user" key={message.id}>
            <div className="message-heading">
              <b>YOU</b>
              <time>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
            <p>{message.content}</p>
          </article>
        ) : (
          <article
            className={`message message-assistant message-${message.status}`}
            key={message.id}
          >
            <div className="message-heading">
              <b>
                <span>◉</span> JARVIS
              </b>
              <time>
                {message.status === "streaming"
                  ? "GENERATING"
                  : new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
              </time>
            </div>
            {message.status === "streaming" && !message.content ? (
              <p className="generating">
                <i />
                Generating response...
              </p>
            ) : (
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    marked.parse(message.content) as string,
                  ),
                }}
              />
            )}
            {message.status === "error" && (
              <button className="retry-button" onClick={onRetry}>
                ↻ RETRY
              </button>
            )}
            {message.status === "complete" && (
              <button
                className="copy-message"
                onClick={() =>
                  void navigator.clipboard?.writeText(message.content)
                }
                aria-label="Copy response"
              >
                COPY
              </button>
            )}
          </article>
        ),
      )}
    </div>
  );
}
function AgentActivity({
  state,
  plan,
  message,
}: {
  state: AgentState;
  plan?: TaskPlan;
  message: string;
}) {
  if (!plan && state === "idle") return null;
  const labels: Record<AgentState, string> = {
    idle: "STANDING BY",
    understanding: "UNDERSTANDING REQUEST",
    planning: "CREATING PLAN",
    waiting_for_permission: "WAITING FOR PERMISSION",
    executing: "EXECUTING",
    observing: "ANALYZING RESULT",
    replanning: "REPLANNING",
    responding: "FORMULATING RESPONSE",
    completed: "TASK COMPLETE",
    failed: "TASK FAILED",
    cancelled: "TASK CANCELLED",
  };
  return (
    <div className="agent-activity">
      <div className="agent-activity-heading">
        <b>JARVIS ACTIVITY</b>
        <span>{state === "executing" ? "● AGENT" : "● CHAT"}</span>
      </div>
      <p className="agent-current">
        <i />
        {message || labels[state]}
      </p>
      {plan && (
        <div className="plan-steps">
          {plan.steps.map((step) => (
            <p key={step.id}>
              <span>
                {step.status === "completed"
                  ? "✓"
                  : step.status === "running"
                    ? "●"
                    : step.status === "failed"
                      ? "!"
                      : "○"}
              </span>
              {step.description}
              <small>{step.status}</small>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
function ToolCenter({ tools }: { tools: ToolMetadata[] }) {
  const groups = [...new Set(tools.map((tool) => tool.category))];
  return (
    <div className="tool-center">
      <div className="tool-center-heading">
        <span>TOOL REGISTRY / {tools.length} REGISTERED</span>
        <b>SAFE DISCOVERY</b>
      </div>
      {groups.map((category) => (
        <div className="tool-group" key={category}>
          <h2>{category.toUpperCase()}</h2>
          {tools
            .filter((tool) => tool.category === category)
            .map((tool) => (
              <div className="tool-row" key={tool.name}>
                <span className="tool-status">●</span>
                <div>
                  <strong>{tool.displayName}</strong>
                  <small>{tool.description}</small>
                </div>
                <em>{tool.riskLevel}</em>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
function MemoryCenter({
  memories,
  onSearch,
  onForget,
  onClear,
}: {
  memories: Memory[];
  onSearch: (query: string) => void;
  onForget: (id: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const counts = memories.reduce<Record<string, number>>(
    (result, memory) => ({
      ...result,
      [memory.type]: (result[memory.type] || 0) + 1,
    }),
    {},
  );
  return (
    <div className="memory-center">
      <div className="memory-center-heading">
        <span>JARVIS MEMORY / {memories.length} ACTIVE</span>
        <b>LOCAL-FIRST</b>
      </div>
      <div className="memory-search">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            onSearch(event.target.value);
          }}
          placeholder="Search memory..."
          aria-label="Search memory"
        />
        <button onClick={onClear}>CLEAR ALL</button>
      </div>
      <div className="memory-stats">
        <div>
          <strong>{memories.length}</strong>
          <span>TOTAL</span>
        </div>
        <div>
          <strong>{counts.preference || 0}</strong>
          <span>PREFERENCES</span>
        </div>
        <div>
          <strong>{counts.project || 0}</strong>
          <span>PROJECTS</span>
        </div>
        <div>
          <strong>{counts.fact || 0}</strong>
          <span>FACTS</span>
        </div>
      </div>
      <div className="memory-list">
        <h2>RECENT MEMORIES</h2>
        {memories.length ? (
          memories.map((memory) => (
            <article className="memory-card" key={memory.id}>
              <div>
                <b>{memory.content}</b>
                <small>
                  {memory.type} · {memory.source} · confidence{" "}
                  {Math.round(memory.confidence * 100)}%
                </small>
              </div>
              <button
                onClick={() => onForget(memory.id)}
                aria-label={`Forget ${memory.content}`}
              >
                ×
              </button>
            </article>
          ))
        ) : (
          <p className="memory-empty">
            No active memories. Explicit “remember that...” requests will appear
            here.
          </p>
        )}
      </div>
    </div>
  );
}
function RightRail({
  notifications,
  onDismiss,
}: {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}) {
  return (
    <aside className="right-rail">
      <GlassPanel label="SYSTEM STATS">
        <div className="waiting-state">
          <span className="pulse-dot" />
          WAITING FOR
          <br />
          SYSTEM SERVICE
        </div>
      </GlassPanel>
      <GlassPanel label="ACTIVE TASKS">
        <div className="empty-state">
          NO ACTIVE TASKS<span>Command execution is standing by.</span>
        </div>
      </GlassPanel>
      <GlassPanel label="NOTIFICATIONS" className="notifications-panel">
        {notifications.map((notification) => (
          <div
            className={`notification notification-${notification.kind}`}
            key={notification.id}
          >
            <span>{notification.kind === "success" ? "✓" : "!"}</span>
            <div>
              <b>{notification.title}</b>
              <small>{notification.message}</small>
            </div>
            <button
              onClick={() => onDismiss(notification.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </GlassPanel>
    </aside>
  );
}
function CommandBar({
  onSubmit,
  onStop,
  state,
}: {
  onSubmit: (command: string) => void;
  onStop: () => void;
  state: AIState;
}) {
  const [value, setValue] = useState("");
  const submit = () => {
    if (value.trim() && state === "idle") {
      onSubmit(value.trim());
      setValue("");
    }
  };
  return (
    <div className={`command-bar ${state !== "idle" ? "command-active" : ""}`}>
      <span className="command-mark">⌁</span>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder="Ask JARVIS anything..."
        aria-label="Command input"
        disabled={state !== "idle"}
        rows={1}
      />
      <button
        aria-label="Attach file"
        title="Attach file"
        disabled={state !== "idle"}
      >
        ⊕
      </button>
      {state !== "idle" && state === "thinking" ? (
        <button
          aria-label="Stop generation"
          title="Stop generation"
          onClick={onStop}
        >
          ■
        </button>
      ) : (
        <button
          aria-label="Submit command"
          title="Submit command"
          onClick={submit}
          disabled={state !== "idle"}
        >
          ↗
        </button>
      )}
    </div>
  );
}
function BottomDock({
  active,
  onSelect,
}: {
  active: NavigationItem;
  onSelect: (item: NavigationItem) => void;
}) {
  return (
    <nav className="bottom-dock" aria-label="Main navigation">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`${active === item.id ? "is-active " : ""}${item.id === "core" ? "core-nav" : ""}`}
          onClick={() => onSelect(item.id)}
          aria-label={item.label}
          aria-current={active === item.id ? "page" : undefined}
        >
          <span>{item.icon}</span>
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  );
}

export function App() {
  const clock = useClock();
  const managerRef = useRef(new ConversationManager());
  const controllerRef = useRef(new ChatController());
  const abortRef = useRef<AbortController | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    managerRef.current.load(),
  );
  const [conversation, setConversation] = useState<Conversation>(
    () => managerRef.current.load()[0] || managerRef.current.create(),
  );
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [search, setSearch] = useState("");
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [plan, setPlan] = useState<TaskPlan>();
  const [agentMessage, setAgentMessage] = useState("");
  const [tools, setTools] = useState<ToolMetadata[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const memoryUrl = `${import.meta.env.VITE_CORE_URL || "http://localhost:4174"}/api/memory`;
  const loadMemories = (query = "") => {
    void fetch(`${memoryUrl}${query ? `?q=${encodeURIComponent(query)}` : ""}`)
      .then((response) =>
        response.ok
          ? (response.json() as Promise<Array<Memory | RankedMemory>>)
          : [],
      )
      .then((items) =>
        setMemories(
          items.map((item) => ("memory" in item ? item.memory : item)),
        ),
      )
      .catch(() => setMemories([]));
  };
  useEffect(() => {
    void fetch(
      `${import.meta.env.VITE_CORE_URL || "http://localhost:4174"}/api/tools`,
    )
      .then((response) =>
        response.ok ? (response.json() as Promise<ToolMetadata[]>) : [],
      )
      .then((catalog) => setTools(Array.isArray(catalog) ? catalog : []))
      .catch(() => setTools([]));
    void fetch(memoryUrl)
      .then((response) =>
        response.ok ? (response.json() as Promise<Memory[]>) : [],
      )
      .then((items) => setMemories(Array.isArray(items) ? items : []))
      .catch(() => setMemories([]));
  }, [memoryUrl]);
  const setAIState = (aiState: AIState) =>
    setAppState((current) => ({ ...current, aiState }));
  const addNotification = (
    kind: NotificationKind,
    title: string,
    message: string,
  ) =>
    setAppState((current) => ({
      ...current,
      notifications: [
        ...current.notifications,
        { id: `${Date.now()}`, kind, title, message },
      ],
    }));
  const updateConversation = (next: Conversation) => {
    setConversation(next);
    managerRef.current.upsert(next);
    setConversations(managerRef.current.load());
    setAppState((current) => ({ ...current, messages: next.messages }));
  };
  const stopGeneration = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };
  const sendMessage = async (
    content: string,
    existingMessages?: AIMessage[],
  ) => {
    if (appState.aiState === "thinking") return;
    const now = new Date().toISOString();
    const userMessage: AIMessage = existingMessages
      ? existingMessages[existingMessages.length - 1]
      : {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          role: "user",
          content,
          timestamp: now,
          status: "complete",
        };
    const assistantMessage: AIMessage = {
      id: crypto.randomUUID(),
      conversationId: conversation.id,
      role: "assistant",
      content: "",
      timestamp: now,
      status: "streaming",
    };
    const baseMessages = existingMessages || [
      ...conversation.messages,
      userMessage,
    ];
    const nextMessages = [...baseMessages, assistantMessage];
    const nextConversation = {
      ...conversation,
      title:
        conversation.title === "New conversation"
          ? managerRef.current.titleFor(content)
          : conversation.title,
      updatedAt: now,
      messages: nextMessages,
    };
    updateConversation(nextConversation);
    setAIState("thinking");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await controllerRef.current.send(
        conversation.id,
        baseMessages,
        (chunk) => {
          if (chunk.type) {
            if (chunk.state) setAgentState(chunk.state as AgentState);
            if (chunk.plan) setPlan(chunk.plan as TaskPlan);
            if (chunk.message) setAgentMessage(chunk.message);
          }
          if (chunk.content) {
            nextConversation.messages = nextConversation.messages.map(
              (message) =>
                message.id === assistantMessage.id
                  ? { ...message, content: message.content + chunk.content }
                  : message,
            );
            setConversation({ ...nextConversation });
            setAppState((current) => ({
              ...current,
              messages: nextConversation.messages,
            }));
          }
        },
        controller.signal,
      );
      nextConversation.messages = nextConversation.messages.map((message) =>
        message.id === assistantMessage.id
          ? { ...message, status: "complete" }
          : message,
      );
      updateConversation(nextConversation);
      setAIState("success");
      setAgentState("completed");
      window.setTimeout(() => {
        setAIState("idle");
        setAgentState("idle");
        setPlan(undefined);
      }, 700);
    } catch (error) {
      const cancelled = controller.signal.aborted;
      nextConversation.messages = nextConversation.messages.map((message) =>
        message.id === assistantMessage.id
          ? {
              ...message,
              status: cancelled ? "cancelled" : "error",
              content:
                message.content || (cancelled ? "Generation stopped." : ""),
            }
          : message,
      );
      updateConversation(nextConversation);
      if (!cancelled) {
        setAIState("error");
        setAgentState("failed");
        addNotification(
          "error",
          "JARVIS CONNECTION ERROR",
          error instanceof Error
            ? error.message
            : "Unable to reach the AI service.",
        );
        window.setTimeout(() => setAIState("idle"), 700);
      } else {
        setAIState("idle");
        setAgentState("cancelled");
      }
    } finally {
      abortRef.current = null;
    }
  };
  const createConversation = () => {
    const next = managerRef.current.create();
    updateConversation(next);
    setAppState((current) => ({ ...current, aiState: "idle" }));
  };
  const selectConversation = (next: Conversation) => {
    setConversation(next);
    setAppState((current) => ({
      ...current,
      messages: next.messages,
      activeNavigation: "chat",
    }));
  };
  const runAction = (aiState: AIState, label: string) => {
    if (label === "Developer Mode") {
      addNotification(
        "info",
        "DEVELOPER MODE",
        "Interface ready for inspection.",
      );
      return;
    }
    if (label === "Ask JARVIS")
      document
        .querySelector<HTMLTextAreaElement>(".command-bar textarea")
        ?.focus();
    else
      addNotification(
        "info",
        label.toUpperCase(),
        "This Phase 2 action is ready for a connected tool service.",
      );
    if (aiState === "listening") setAIState("listening");
  };
  const date = clock
    .toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
    .toUpperCase();
  const shownConversations = conversations.filter(
    (item) =>
      !search || item.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <main className="jarvis-shell">
      <ParticleField />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="hud-grid" />
      <header className="top-hud">
        <div className="brand">
          <span className="brand-mark">J</span>
          <div>
            <h1>{config.appName}</h1>
            <p>PERSONAL AI SYSTEM</p>
          </div>
        </div>
        <div className="system-online">
          <StatusIndicator label="SYSTEM ONLINE" />
          <span className="uptime">AI {config.aiModel}</span>
        </div>
        <div className="top-time">
          <strong>
            {clock.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </strong>
          <span>{date}</span>
        </div>
      </header>
      <div className="workspace">
        <aside className="left-rail">
          <GlassPanel label="CONVERSATIONS" className="history-panel">
            <input
              className="history-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
            />
            <button className="new-chat-button" onClick={createConversation}>
              ＋ NEW CHAT
            </button>
            {shownConversations.slice(0, 5).map((item) => (
              <button
                key={item.id}
                className={`history-item ${item.id === conversation.id ? "is-current" : ""}`}
                onClick={() => selectConversation(item)}
              >
                <b>{item.title}</b>
                <small>{item.messages.length} messages</small>
              </button>
            ))}
          </GlassPanel>
          <QuickActions onAction={runAction} />
          <SystemOverview toolCount={tools.length} />
          <ActivityFeed />
        </aside>
        <section className="center-hud">
          <div className="center-meta">
            <span>
              NEURAL INTERFACE /{" "}
              <b>{appState.aiState === "thinking" ? "PROCESSING" : "ACTIVE"}</b>
            </span>
            <span>
              SECURE CHANNEL <i />
            </span>
          </div>
          {appState.activeNavigation === "tools" ? (
            <ToolCenter tools={tools} />
          ) : appState.activeNavigation === "memory" ? (
            <MemoryCenter
              memories={memories}
              onSearch={loadMemories}
              onForget={(id) => {
                void fetch(`${memoryUrl}/${id}`, { method: "DELETE" }).then(
                  () => loadMemories(),
                );
              }}
              onClear={() => {
                if (window.confirm("Delete all saved memories?"))
                  void fetch(`${memoryUrl}/clear`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ confirm: true }),
                  }).then(() => loadMemories());
              }}
            />
          ) : appState.activeNavigation === "vision" ? (
            <VisionCenter />
          ) : (
            <>
              <AgentActivity
                state={agentState}
                plan={plan}
                message={agentMessage}
              />
              {conversation.messages.length > 0 && (
                <MessageList
                  messages={conversation.messages}
                  onRetry={() => {
                    const lastUserIndex = [...conversation.messages]
                      .map((message, index) => ({ message, index }))
                      .reverse()
                      .find(({ message }) => message.role === "user")?.index;
                    if (lastUserIndex !== undefined)
                      void sendMessage(
                        conversation.messages[lastUserIndex].content,
                        conversation.messages.slice(0, lastUserIndex + 1),
                      );
                  }}
                />
              )}
              {conversation.messages.length === 0 && (
                <AICore
                  state={appState.aiState}
                  onVoice={() =>
                    setAIState(
                      appState.aiState === "listening" ? "idle" : "listening",
                    )
                  }
                />
              )}
              {conversation.messages.length > 0 && (
                <div className="mini-core">
                  <OrbitalRings state={appState.aiState} />
                </div>
              )}
              <CommandBar
                onSubmit={sendMessage}
                onStop={stopGeneration}
                state={appState.aiState}
              />
            </>
          )}
        </section>
        <RightRail
          notifications={appState.notifications}
          onDismiss={(id) =>
            setAppState((current) => ({
              ...current,
              notifications: current.notifications.filter(
                (item) => item.id !== id,
              ),
            }))
          }
        />
      </div>
      <BottomDock
        active={appState.activeNavigation}
        onSelect={(activeNavigation) =>
          setAppState((current) => ({ ...current, activeNavigation }))
        }
      />
      <footer className="footer-note">
        <span>
          JARVIS OS <b>CORE PROVIDER</b>
        </span>
        <span>
          <StatusIndicator label="EVENT STREAM READY" />
        </span>
        <span>
          LATENCY <b>LOCAL</b>
        </span>
      </footer>
    </main>
  );
}
