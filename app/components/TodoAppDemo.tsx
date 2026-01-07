"use client";

import { useState } from "react";
import { FiTrash2, FiPlus, FiCheck } from "react-icons/fi";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export default function TodoAppDemo() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "Learn TypeScript", completed: true },
    { id: 2, text: "Build a Portfolio", completed: false },
    { id: 3, text: "Master Next.js", completed: false },
  ]);
  const [inputText, setInputText] = useState("");
  const [viewMode, setViewMode] = useState<"design" | "source">("design");

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setTodos([...todos, { id: Date.now(), text: inputText, completed: false }]);
    setInputText("");
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  // TypeScript Code Display
  const tsCode = `interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const TodoApp = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  const addTodo = () => {
    if (!input) return;
    const newTodo = {
      id: Date.now(),
      text: input,
      completed: false
    };
    setTodos([...todos, newTodo]);
    setInput("");
  };

  const toggle = (id: number) => {
    setTodos(todos.map(t => 
      t.id === id ? {...t, completed: !t.completed} : t
    ));
  };

  return (
    <div className="todo-container">
      {/* ... UI Implementation ... */}
    </div>
  );
};`;

  return (
    <div className="w-full max-w-[320px] overflow-hidden rounded-xl border border-zinc-700 bg-[#1e1e1e] font-mono shadow-2xl flex flex-col">
      {/* Title Bar & Tabs */}
      <div className="flex h-8 items-center justify-between bg-zinc-800 px-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500/20 text-[8px] flex items-center justify-center text-blue-500">TS</div>
          <span className="text-xs text-zinc-400">TodoApp.tsx</span>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setViewMode("design")}
             className={`px-2 py-0.5 text-[10px] rounded ${viewMode === "design" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
           >
             Preview
           </button>
           <button 
             onClick={() => setViewMode("source")}
             className={`px-2 py-0.5 text-[10px] rounded ${viewMode === "source" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
           >
             Code
           </button>
        </div>
      </div>

      <div className="relative h-[300px]">
        {/* Design View - Interactive Demo */}
        <div className={`absolute inset-0 p-4 flex flex-col transition-opacity duration-300 ${viewMode === "design" ? "opacity-100 z-10" : "opacity-0 pointer-events-none"}`}>
          
          <form onSubmit={addTodo} className="mb-4 flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Add new task..."
              className="flex-1 rounded bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 border border-zinc-700 focus:border-blue-500 focus:outline-none placeholder:text-zinc-600"
            />
            <button 
              type="submit"
              className="flex h-full items-center justify-center rounded bg-blue-600 px-3 text-white hover:bg-blue-500 transition-colors"
            >
              <FiPlus size={14} />
            </button>
          </form>

          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-zinc-700 pr-1 space-y-2">
            {todos.length === 0 && (
              <div className="text-center text-zinc-600 text-xs py-8">No tasks yet.</div>
            )}
            {todos.map(todo => (
              <div 
                key={todo.id} 
                className="group flex items-center justify-between rounded bg-zinc-900/50 p-2 border border-zinc-800 hover:border-zinc-700 transition"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <button 
                    onClick={() => toggleTodo(todo.id)}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${todo.completed ? "bg-blue-500/20 border-blue-500 text-blue-500" : "border-zinc-600 hover:border-zinc-500"} transition`}
                  >
                    {todo.completed && <FiCheck size={10} />}
                  </button>
                  <span className={`text-xs truncate ${todo.completed ? "text-zinc-500 line-through" : "text-zinc-300"}`}>
                    {todo.text}
                  </span>
                </div>
                <button 
                  onClick={() => deleteTodo(todo.id)}
                  className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-1"
                >
                  <FiTrash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Source View - TypeScript Code */}
        <div className={`absolute inset-0 bg-[#1e1e1e] p-4 overflow-auto scrollbar-thin scrollbar-thumb-zinc-600 transition-opacity duration-300 ${viewMode === "source" ? "opacity-100 z-10" : "opacity-0 pointer-events-none"}`}>
            <pre className="text-[10px] leading-relaxed font-mono text-zinc-300 whitespace-pre">
              {tsCode.split('\n').map((line, i) => (
                <div key={i}>
                  <span className="text-zinc-600 select-none mr-3 w-4 inline-block text-right">{i + 1}</span>
                  <span>
                    {line.split(/("(?:[^"\\]|\\.)*")|\b(interface|const|let|var|return|function|if|else|import|from|export|default|type)\b|\b(string|number|boolean|void|any)\b|(\s+)|([^"\s\w]+)|(\w+)/g).filter(Boolean).map((token, j) => {
                       if (!token) return null;
                       if (token.startsWith('"')) return <span key={j} className="text-orange-400">{token}</span>;
                       if (/^(interface|const|let|var|return|function|if|else|import|from|export|default|type)$/.test(token)) return <span key={j} className="text-pink-400">{token}</span>;
                       if (/^(string|number|boolean|void|any)$/.test(token)) return <span key={j} className="text-blue-400">{token}</span>;
                       if (/^[A-Z]/.test(token)) return <span key={j} className="text-yellow-300">{token}</span>; // Heuristic for types/components
                       return <span key={j}>{token}</span>;
                    })}
                  </span>
                </div>
              ))}
            </pre>
        </div>
      </div>
    </div>
  );
}
