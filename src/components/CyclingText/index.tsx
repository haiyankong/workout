import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useRef } from 'react';

interface CyclingTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  onComplete?: () => void;
  manualStart?: boolean;
  hoverPlay?: boolean;
  interval?: number;
  step?: number;
}

export interface CyclingTextHandle {
  play: () => void;
}

const CyclingText = forwardRef<CyclingTextHandle, CyclingTextProps>(
  ({
    text,
    className,
    style,
    onComplete,
    manualStart = false,
    hoverPlay = false,
    interval = 10,
    step = 3
  }, ref) => {
    const getInitialText = (targetText: string) => {
      return targetText
        .split('')
        .map((char) => {
          if (/[A-Z]/.test(char)) return 'A';
          if (/[a-z]/.test(char)) return 'a';
          if (/[0-9]/.test(char)) return '0';
          return char;
        })
        .join('');
    };

    const [displayText, setDisplayText] = useState(() => getInitialText(text));
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const textRef = useRef(text);
    const onCompleteRef = useRef(onComplete);
    const isPlayingRef = useRef(false);

    useEffect(() => {
      textRef.current = text;
      onCompleteRef.current = onComplete;
    }, [text, onComplete]);

    const play = useCallback(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      isPlayingRef.current = true;

      const targetText = textRef.current;

      let currentChars = targetText.split('').map((char) => {
        if (/[A-Z]/.test(char)) return 'A';
        if (/[a-z]/.test(char)) return 'a';
        if (/[0-9]/.test(char)) return '0';
        return char;
      });

      setDisplayText(currentChars.join(''));

      let activeIndex = 0;

      intervalRef.current = setInterval(() => {
        while (
          activeIndex < targetText.length &&
          currentChars[activeIndex] === targetText[activeIndex]
        ) {
          activeIndex++;
        }

        if (activeIndex >= targetText.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          isPlayingRef.current = false;
          onCompleteRef.current?.();
          return;
        }

        const currentChar = currentChars[activeIndex];
        const targetChar = targetText[activeIndex];

        const charCode = currentChar.charCodeAt(0);
        const targetCode = targetChar.charCodeAt(0);

        let nextChar = currentChar;

        if (charCode < targetCode) {
           const nextCode = Math.min(charCode + step, targetCode);
           nextChar = String.fromCharCode(nextCode);
        } else if (charCode > targetCode) {
           nextChar = targetChar;
        } else {
           nextChar = targetChar;
        }

        currentChars[activeIndex] = nextChar;
        setDisplayText(currentChars.join(''));

      }, interval);
    }, [interval, step]);

    const handleMouseEnter = useCallback(() => {
      if (hoverPlay && !isPlayingRef.current) {
        play();
      }
    }, [hoverPlay, play]);

    useImperativeHandle(ref, () => ({
      play,
    }));

    useEffect(() => {
      if (!manualStart) {
        play();
      }
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [play, manualStart]);

    return (
      <span
        className={className}
        style={style}
        onMouseEnter={handleMouseEnter}
      >
        {displayText}
      </span>
    );
  }
);

CyclingText.displayName = 'CyclingText';

export default CyclingText;
