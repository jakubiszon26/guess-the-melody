import React, { useEffect, useRef, useState } from "react";

const formatTime = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  return `${minutes}:${paddedSeconds}`;
};

const defer = (cb) => {
  if (!cb) return;
  if (typeof queueMicrotask === "function") {
    queueMicrotask(cb);
  } else {
    Promise.resolve().then(cb);
  }
};

// 💡 Komponent timera
const CountdownTimer = ({
  initialTimeInMs = 0,
  isRunning = false,
  onTimerEnd,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeInMs);
  const intervalRef = useRef(null);
  const endCalledRef = useRef(false);

  useEffect(() => {
    setTimeRemaining(initialTimeInMs);
    endCalledRef.current = false;
  }, [initialTimeInMs]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isRunning) {
      return;
    }

    if (initialTimeInMs <= 0) {
      setTimeRemaining(0);
      if (!endCalledRef.current) {
        endCalledRef.current = true;
        defer(() => onTimerEnd?.());
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prevTime) => {
        const newTime = Math.max(0, prevTime - 1000);
        if (newTime === 0 && !endCalledRef.current) {
          endCalledRef.current = true;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          defer(() => onTimerEnd?.());
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [initialTimeInMs, isRunning, onTimerEnd]);

  return (
    <h2 className="text-4xl font-mono text-yellow-400">
      {formatTime(timeRemaining)}
    </h2>
  );
};

export default CountdownTimer;
