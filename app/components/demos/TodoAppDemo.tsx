"use client";

import { useState } from "react";

export default function TodoAppDemo() {
  // --- Start of Ported Logic from GitHub ---
  type Todo = {
    inputValue: string;
    id: number;
    checked: boolean;
  };

  const [inputValue, setInputValue] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newTodo: Todo = {
      inputValue: inputValue,
      id: todos.length,
      checked: false,
    };

    setTodos([newTodo, ...todos]);
    setInputValue("");
  };

  const handleEdit = (id: number, inputValue: string) => {
    const newTodos = todos.map((todo) => {
      if (todo.id === id) {
        todo.inputValue = inputValue;
      }
      return todo;
    });
    setTodos(newTodos);
  };

  const handleChecked = (id: number, checked: boolean) => {
    const newTodos = todos.map((todo) => {
      if (todo.id === id) {
        todo.checked = !checked;
      }
      return todo;
    });
    setTodos(newTodos);
  };

  const handleDelete = (id: number) => {
    const newTodos = todos.filter((todo) => todo.id !== id);
    setTodos(newTodos);
  };
  // --- End of Ported Logic ---

  // Presentation State for the Demo Container
  const [viewMode, setViewMode] = useState<"design" | "source">("design");

  // The source code string to display in "Source" mode
  // Using the exact content fetched from the GitHub repository
  const tsCode = `import React, { useState } from 'react';
import './App.css';

function App() {
  const [inputValue, setInputValue] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);

  type Todo = {
    inputValue: string;
    id: number;
    checked: boolean;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newTodo: Todo = {
      inputValue: inputValue,
      id: todos.length,
      checked: false,
    };

    setTodos([newTodo, ...todos]);
    setInputValue("");
  };

  const handleEdit = (id: number, inputValue: string) => {
    const newTodos = todos.map((todo) => {
      if (todo.id === id) {
        todo.inputValue = inputValue;
      }
      return todo;
    });
    setTodos(newTodos);
  };

  const handleChecked = (id: number, checked: Boolean) => {
    const newTodos = todos.map((todo) => {
      if (todo.id === id) {
        todo.checked = !checked;
      }
      return todo;
    });
    setTodos(newTodos);
  };

  const handleDelete = (id: number) => {
    const newTodos = todos.filter((todo) => todo.id !== id);
    setTodos(newTodos);
  };

  return (
    <div className="App">
      <div>
        <h2>Todoリスト with Typescript</h2>
        <form onSubmit={(e) => handleSubmit(e)}>
          <input type="text" onChange={(e) => handleChange(e)} className="inputText" />
          <input type="submit" value="作成" className="submitButton" />
        </form>
        <ul className="todoList">
          {todos.map((todo) => (
            <li key={todo.id}>
              <input
                type="text"
                onChange={(e) => handleEdit(todo.id, e.target.value)}
                className="inputText"
                value={todo.inputValue}
                disabled={todo.checked}
              />
              <input
                type="checkbox"
                onChange={(e) => handleChecked(todo.id, todo.checked)}
              />
              <button onClick={() => handleDelete(todo.id)}>消</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;`;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-zinc-700 bg-[#1e1e1e] font-mono shadow-2xl flex flex-col h-[400px]">
      {/* Title Bar & Tabs */}
      <div className="flex h-8 items-center justify-between bg-zinc-800 px-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-blue-600 text-[9px] font-bold flex items-center justify-center text-white">TS</div>
          <span className="text-xs text-zinc-200">App.tsx</span>
        </div>
        <div className="flex gap-2">
           <button 
             type="button"
             onClick={() => setViewMode("design")}
             aria-pressed={viewMode === "design"}
             aria-label="プレビュー表示に切り替え"
             className={`px-2 py-0.5 text-[10px] rounded ${viewMode === "design" ? "bg-zinc-700 text-white" : "text-zinc-300 hover:text-zinc-100"}`}
           >
             Preview
           </button>
           <button 
             type="button"
             onClick={() => setViewMode("source")}
             aria-pressed={viewMode === "source"}
             aria-label="コード表示に切り替え"
             className={`px-2 py-0.5 text-[10px] rounded ${viewMode === "source" ? "bg-zinc-700 text-white" : "text-zinc-300 hover:text-zinc-100"}`}
           >
             Code
           </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {/* Design View - Ported App Logic with styled approximation */}
        <div className={`absolute inset-0 p-4 overflow-auto transition-opacity duration-300 flex flex-col items-center justify-start ${viewMode === "design" ? "opacity-100 z-10" : "opacity-0 pointer-events-none"}`}>
          
          {/* Equivalent to <div className="App"> */}
          <div className="w-full text-center">
            
            <h2 className="text-lg mb-4 text-zinc-100 font-bold">Todoリスト with Typescript</h2>
            
            <form onSubmit={handleSubmit} className="mb-6 flex gap-2 justify-center">
              <label htmlFor="todo-new-task" className="sr-only">新しいタスク</label>
              <input 
                id="todo-new-task"
                type="text" 
                onChange={handleChange} 
                className="p-2 rounded bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm focus:outline-none focus:border-blue-500" 
                value={inputValue}
                placeholder="新しいタスク"
              />
              <input 
                type="submit" 
                value="作成" 
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm cursor-pointer hover:bg-blue-500 transition-colors" 
              />
            </form>

            <ul className="w-full flex flex-col gap-2 p-0 list-none">
              {todos.map((todo) => (
                <li key={todo.id} className="flex items-center gap-2 w-full bg-zinc-900/50 p-2 rounded border border-zinc-800">
                  <input
                    type="text"
                    onChange={(e) => handleEdit(todo.id, e.target.value)}
                    className="flex-1 p-1 bg-transparent border-b border-transparent focus:border-zinc-500 text-zinc-200 text-sm outline-none disabled:text-zinc-500 disabled:line-through"
                    value={todo.inputValue}
                    disabled={todo.checked}
                    aria-label={`Todo ${todo.id + 1} の内容`}
                  />
                  <input
                    type="checkbox"
                    onChange={() => handleChecked(todo.id, todo.checked)}
                    checked={todo.checked}
                    className="cursor-pointer"
                    aria-label={`Todo ${todo.id + 1} を完了済みにする`}
                  />
                  <button 
                    type="button"
                    onClick={() => handleDelete(todo.id)}
                    aria-label={`Todo ${todo.id + 1} を削除`}
                    className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded hover:bg-red-500/20 transition-colors"
                  >
                    消
                  </button>
                </li>
              ))}
            </ul>

          </div>

        </div>
        
        {/* Source View - Exact Source Code */}
        <div className={`absolute inset-0 bg-[#1e1e1e] p-4 overflow-auto scrollbar-thin scrollbar-thumb-zinc-600 transition-opacity duration-300 ${viewMode === "source" ? "opacity-100 z-10" : "opacity-0 pointer-events-none"}`}>
            <pre className="text-[10px] leading-relaxed font-mono text-zinc-300 whitespace-pre">
              {tsCode.split('\n').map((line, i) => (
                <div key={i}>
                  <span className="text-zinc-600 select-none mr-3 w-4 inline-block text-right">{i + 1}</span>
                  <span>
                    {line.split(/("(?:[^"\\]|\\.)*")|\b(interface|const|let|var|return|function|if|else|import|from|export|default|type)\b|\b(string|number|boolean|void|any)\b|(\s+)|([^"\s\w]+)|(\w+)/g).filter(Boolean).map((token, j) => {
                       if (!token) return null;
                       if (token.startsWith('"') || token.startsWith("'")) return <span key={j} className="text-orange-400">{token}</span>;
                       if (/^(interface|const|let|var|return|function|if|else|import|from|export|default|type)$/.test(token)) return <span key={j} className="text-pink-400">{token}</span>;
                       if (/^(string|number|boolean|void|any|Boolean)$/.test(token)) return <span key={j} className="text-blue-400">{token}</span>;
                       if (/^[A-Z]/.test(token)) return <span key={j} className="text-yellow-300">{token}</span>;
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
