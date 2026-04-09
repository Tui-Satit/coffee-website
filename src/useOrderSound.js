import { useEffect, useRef } from "react";

function useOrderSound(shouldPlay) {
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) return;

    const playLoud = () => {
      const audio = audioRef.current;

      audio.volume = 1.0;

      // 🔊 เล่น 3 ครั้งติดกัน (ให้รู้สึกดังขึ้น)
      audio.currentTime = 0;
      audio.play().catch(() => {});

      setTimeout(() => {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }, 300);

      setTimeout(() => {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }, 600);
    };

    if (shouldPlay) {
      playLoud();

      intervalRef.current = setInterval(() => {
        playLoud();
      }, 2500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldPlay]);

  return (
    <audio
      ref={audioRef}
      src="/sounds/alert.mp3"   // 🔥 เปลี่ยนตรงนี้ถ้าใช้ wav
      preload="auto"
    />
  );
}

export default useOrderSound;