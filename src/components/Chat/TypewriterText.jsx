import React, { useState, useEffect } from 'react';

const TypewriterText = ({ text, delay = 40 }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    const words = text.split(' ');
    let currentWordIndex = 0;
    
    setDisplayedText(''); // reset on change

    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        setDisplayedText(prev => prev + (prev ? ' ' : '') + words[currentWordIndex]);
        currentWordIndex++;
      } else {
        clearInterval(interval);
      }
    }, delay);

    return () => clearInterval(interval);
  }, [text, delay]);

  return <span>{displayedText}</span>;
};

export default TypewriterText;
