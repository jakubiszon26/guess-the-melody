import React, { useState, useEffect } from "react";

const formatTime = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  return `${minutes}:${paddedSeconds}`;
};

// 💡 Komponent timera
const CountdownTimer = ({
  initialTimeInMs = 0,
  isRunning = false,
  onTimerEnd,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeInMs);

  useEffect(() => {
    setTimeRemaining(initialTimeInMs);
  }, [initialTimeInMs]);

  useEffect(() => {
    if (!isRunning || initialTimeInMs <= 0) {
      if (!isRunning && initialTimeInMs > 0) {
        setTimeRemaining(initialTimeInMs);
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeRemaining((prevTime) => {
        const newTime = prevTime - 1000;

        if (newTime <= 0) {
          clearInterval(timerId);
          onTimerEnd?.();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [initialTimeInMs, isRunning, onTimerEnd]);

  return (
    <h2 className="text-4xl font-mono text-yellow-400">
      {formatTime(timeRemaining)}
    </h2>
  );
};

export default CountdownTimer;
