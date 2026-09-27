import { useCallback, useEffect, useState } from 'react'

/** Frame-index player for the transient animation (play / pause / reset / scrub). */
export function usePlayback(frameCount: number, fps = 12) {
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setFrame((f) => {
        if (f >= frameCount - 1) {
          setPlaying(false)
          return f
        }
        return f + 1
      })
    }, 1000 / fps)
    return () => window.clearInterval(id)
  }, [playing, frameCount, fps])

  const play = useCallback(() => {
    setFrame((f) => (f >= frameCount - 1 ? 0 : f))
    setPlaying(true)
  }, [frameCount])
  const pause = useCallback(() => setPlaying(false), [])
  const reset = useCallback(() => {
    setPlaying(false)
    setFrame(0)
  }, [])

  // clamp during render when the result (and thus frame count) shrinks
  return { frame: Math.min(frame, Math.max(0, frameCount - 1)), setFrame, playing, play, pause, reset }
}
