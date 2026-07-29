import { useState, useEffect } from "react";

interface TypingLogoProps {
  text?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export default function TypingLogo({
  text = "writr",
  typingSpeed = 250,
  deletingSpeed = 150,
  pauseDuration = 3000,
  className = "",
}: TypingLogoProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const handleTyping = () => {
      if (!isDeleting) {
        // Adiciona um caractere
        const nextText = text.substring(0, displayedText.length + 1);
        setDisplayedText(nextText);

        if (nextText === text) {
          // Pausa após finalizar a digitação completa
          timer = setTimeout(() => setIsDeleting(true), pauseDuration);
          return;
        }
      } else {
        // Remove um caractere
        const nextText = text.substring(0, displayedText.length - 1);
        setDisplayedText(nextText);

        if (nextText === "") {
          // Reinicia o ciclo de digitação
          setIsDeleting(false);
        }
      }

      // Calcula a velocidade do próximo caractere
      const speed = isDeleting ? deletingSpeed : typingSpeed;
      timer = setTimeout(handleTyping, speed);
    };

    timer = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, text, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <span className="font-funnel leading-none">
        {displayedText}
      </span>
      {/* Cursor vertical com animação de pulso sutil */}
      <span 
        className="w-[3px] md:w-[5px] h-[0.75em] bg-current ml-1.5 animate-pulse" 
        style={{ animationDuration: "1s" }} 
      />
    </div>
  );
}
