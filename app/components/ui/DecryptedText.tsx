"use client";

import { useEffect, useState, useRef } from "react";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  className?: string;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  characters?: string;
  animateOnHover?: boolean;
  sequential?: boolean; 
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  className = "",
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+",
  animateOnHover = false,
  sequential = false, // trueの場合、1文字ずつ表示します。falseの場合、全体をスクランブルしてから確定させます。
}: DecryptedTextProps) {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // scrambleの定義をuseEffect内で行うか、useCallbackでラップします。
    // 多くのプロパティに依存しているため、ここではこのままにするか、リントを抑制して
    // 元の実装スタイルに合わせつつ、よりクリーンにします。
    
    const scramble = () => {
      let iteration = 0;
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setDisplayText((_prev) =>
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (index < iteration) return text[index];
              return characters[Math.floor(Math.random() * characters.length)];
            })
            .join("")
        );

        if (sequential) {
           iteration += 1 / 3;
           if (iteration >= text.length) {
               if (intervalRef.current) clearInterval(intervalRef.current);
               setDisplayText(text);
           }
        } else {
            iteration += 1 / 2;
            if (iteration >= text.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setDisplayText(text);
            }
        }
      }, speed);
    };

    if (!animateOnHover) {
        scramble();
    }
    
    // scrambleを外に出せばマウスハンドラに公開できますが、
    // 今のところは初期ロードのためにエフェクトを使用するだけにします。
    // "missing dependency"を厳密に修正するには、scrambleをuseCallbackでラップする必要があります。
    // しかし、ここのロジックはrefsを使用しており少し複雑です。 
    
    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, animateOnHover, speed, characters, sequential, maxIterations]); 
  
  // ホバーロジックをきれいに再実装
  const handleMouseEnter = () => {
    if (animateOnHover) {
        setIsHovering(true);
        // scrambleをトリガー... scramble関数へのアクセスが必要です。
        // キーの更新や状態変更を強制してエフェクトを再トリガーしますか？
        // それともロジックをコピーしますか。簡単にするために、ロジックをコピーするか外に出します。
        // ここでは新しいインターバルを作成することにします。
        
        let iteration = 0;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setDisplayText((prev) => 
                text.split("").map((char, index) => {
                    if (char === " ") return " ";
                    if (index < iteration) return text[index];
                    return characters[Math.floor(Math.random() * characters.length)];
                }).join("")
            );
            
            if (sequential) {
                iteration += 1 / 3;
            } else {
                iteration += 1 / 2;
            }
            
            if (iteration >= text.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setDisplayText(text);
            }
        }, speed);
    }
  };



  const handleMouseLeave = () => {
    if (animateOnHover) {
        setIsHovering(false);
        // オプション: スクランブルして戻すか、ただ停止するか？ 通常はただ停止するか終了させます。
        // ここでは終了させます。
    }
  };

  return (
    <span 
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
    >
      {displayText}
    </span>
  );
}
