"use client";

import { useState } from "react";
import { FiX, FiMinus, FiPlus, FiDivide } from "react-icons/fi";
import { FaEquals } from "react-icons/fa6";

export default function CsharpCalculator() {
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    setOperator(op);
    setPrevValue(display);
    setNewNumber(true);
  };

  const calculate = () => {
    if (!prevValue || !operator) return;
    const current = parseFloat(display);
    const previous = parseFloat(prevValue);
    let result = 0;

    switch (operator) {
      case "+":
        result = previous + current;
        break;
      case "-":
        result = previous - current;
        break;
      case "*":
        result = previous * current;
        break;
      case "/":
        result = previous / current;
        break;
    }

    setDisplay(result.toString());
    setOperator(null);
    setPrevValue(null);
    setNewNumber(true);
  };

  const clear = () => {
    setDisplay("0");
    setPrevValue(null);
    setOperator(null);
    setNewNumber(true);
  };

  // VS Code / Visual Studio Style C# Code
  const csharpCode = `private void btn_Equal_Click(object sender, EventArgs e)
{
    double second = double.Parse(txtDisplay.Text);
    double result = 0;

    switch (operation)
    {
        case "+":
            result = first + second;
            break;
        case "-":
            result = first - second;
            break;
        case "*":
            result = first * second;
            break;
        case "/":
            if (second != 0)
                result = first / second;
            else
                MessageBox.Show("Div/0 Error");
            break;
    }
    txtDisplay.Text = result.ToString();
}`;

  const [viewMode, setViewMode] = useState<"design" | "source">("design");

  return (
    <div className="w-full max-w-[320px] overflow-hidden rounded-xl border border-zinc-700 bg-[#1e1e1e] font-mono shadow-2xl flex flex-col">
      {/* Title Bar & Tabs */}
      <div className="flex h-8 items-center justify-between bg-zinc-800 px-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/20 text-[8px] flex items-center justify-center text-red-500"></div>
          <span className="text-xs text-zinc-400">Calculator.cs [Design]</span>
        </div>
        <div className="flex gap-2">
           <button 
             type="button"
             onClick={() => setViewMode("design")}
             aria-pressed={viewMode === "design"}
             aria-label="電卓プレビュー表示に切り替え"
             className={`px-2 py-0.5 text-[10px] rounded ${viewMode === "design" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
           >
             Design
           </button>
           <button 
             type="button"
             onClick={() => setViewMode("source")}
             aria-pressed={viewMode === "source"}
             aria-label="C#ソース表示に切り替え"
             className={`px-2 py-0.5 text-[10px] rounded ${viewMode === "source" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
           >
             Source
           </button>
        </div>
      </div>

      <div className="relative">
        {/* Design View */}
        <div className={`p-4 transition-opacity duration-300 ${viewMode === "design" ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          {/* Display */}
          <div className="mb-4 flex h-16 items-end justify-end rounded-lg bg-[#000000] p-3 text-3xl text-green-400 shadow-inner ring-1 ring-zinc-800">
            {display}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-2">
            {/* Row 1 */}
            <button type="button" onClick={clear} aria-label="計算をクリア" className="col-span-2 flex h-10 items-center justify-center rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 active:translate-y-0.5">
              C
            </button>
            <button type="button" onClick={() => handleOperator("/")} aria-label="割り算" className="flex h-10 items-center justify-center rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:translate-y-0.5">
              <FiDivide size={16} />
            </button>
            <button type="button" onClick={() => handleOperator("*")} aria-label="掛け算" className="flex h-10 items-center justify-center rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:translate-y-0.5">
              <FiX size={16} />
            </button>

            {/* Row 2 */}
            <button type="button" onClick={() => handleNumber("7")} className="flex h-10 items-center justify-center rounded bg-zinc-900 text-zinc-200 hover:bg-zinc-800 active:translate-y-0.5">7</button>
            <button type="button" onClick={() => handleNumber("8")} className="flex h-10 items-center justify-center rounded bg-zinc-900 text-zinc-200 hover:bg-zinc-800 active:translate-y-0.5">8</button>
            <button type="button" onClick={() => handleNumber("9")} className="flex h-10 items-center justify-center rounded bg-zinc-900 text-zinc-200 hover:bg-zinc-800 active:translate-y-0.5">9</button>
            <button type="button" onClick={() => handleOperator("-")} aria-label="引き算" className="flex h-10 items-center justify-center rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:translate-y-0.5">
              <FiMinus size={16} />
            </button>

            {/* Row 3 */}
            <button type="button" onClick={() => handleNumber("4")} className="flex h-10 items-center justify-center rounded bg-zinc-900 text-zinc-200 hover:bg-zinc-800 active:translate-y-0.5">4</button>
            <button type="button" onClick={() => handleNumber("5")} className="flex h-10 items-center justify-center rounded bg-zinc-900 text-zinc-200 hover:bg-zinc-800 active:translate-y-0.5">5</button>
            <button type="button" onClick={() => handleNumber("6")} className="flex h-10 items-center justify-center rounded bg-zinc-900 text-zinc-200 hover:bg-zinc-800 active:translate-y-0.5">6</button>
            <button type="button" onClick={() => handleOperator("+")} aria-label="足し算" className="flex h-10 items-center justify-center rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:translate-y-0.5">
              <FiPlus size={16} />
            </button>

            {/* Row 4 */}
            <button type="button" onClick={() => handleNumber("1")} className="flex h-10 items-center justify-center rounded bg-zinc-900 text-zinc-200 hover:bg-zinc-800 active:translate-y-0.5">1</button>
            <button type="button" onClick={() => handleNumber("2")} className="flex h-10 items-center justify-center rounded bg-zinc-900 text-zinc-200 hover:bg-zinc-800 active:translate-y-0.5">2</button>
            <button type="button" onClick={() => handleNumber("3")} className="flex h-10 items-center justify-center rounded bg-zinc-900 text-zinc-200 hover:bg-zinc-800 active:translate-y-0.5">3</button>
            <button type="button" onClick={calculate} aria-label="計算結果を表示" className="row-span-2 flex items-center justify-center rounded bg-fuchsia-600/80 text-white hover:bg-fuchsia-600 active:translate-y-0.5">
              <FaEquals size={16} />
            </button>

            {/* Row 5 */}
            <button type="button" onClick={() => handleNumber("0")} className="col-span-2 flex h-10 items-center justify-center rounded bg-zinc-900 text-zinc-200 hover:bg-zinc-800 active:translate-y-0.5">0</button>
            <button type="button" onClick={() => handleNumber(".")} aria-label="小数点" className="flex h-10 items-center justify-center rounded bg-zinc-900 text-zinc-200 hover:bg-zinc-800 active:translate-y-0.5">.</button>
          </div>
        </div>
        
        {/* Source View - C# Code */}
        <div className={`absolute inset-0 bg-[#1e1e1e] p-4 overflow-auto scrollbar-thin scrollbar-thumb-zinc-600 transition-opacity duration-300 ${viewMode === "source" ? "opacity-100 z-10" : "opacity-0 pointer-events-none"}`}>
            <pre className="text-[10px] leading-relaxed font-mono text-zinc-300 whitespace-pre">
              {csharpCode.split('\n').map((line, i) => (
                <div key={i}>
                  <span className="text-zinc-600 select-none mr-3 w-4 inline-block text-right">{i + 1}</span>
                  <span>
                    {line.split(/("(?:[^"\\]|\\.)*")|\b(private|void|object|string|double|if|else|switch|case|break)\b|\b(Parse|ToString|Show)\b|(\s+)|([^"\s\w]+)|(\w+)/g).filter(Boolean).map((token, j) => {
                       if (!token) return null;
                       if (token.startsWith('"')) return <span key={j} className="text-orange-400">{token}</span>;
                       if (/^(private|void|object|string|double|if|else|switch|case|break)$/.test(token)) return <span key={j} className="text-blue-400">{token}</span>;
                       if (/^(Parse|ToString|Show)$/.test(token)) return <span key={j} className="text-yellow-300">{token}</span>;
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
