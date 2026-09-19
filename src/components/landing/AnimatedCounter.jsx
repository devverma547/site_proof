import React, { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

const PREFERS_REDUCED_MOTION = typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function AnimatedCounter({ value, suffix = '', prefix = '', duration = 2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  // Extract integer value from string or number
  const numericValue = typeof value === 'number'
    ? value
    : parseFloat(value.toString().replace(/[^0-9.]/g, '')) || 0;

  useEffect(() => {
    if (!isInView) return;
    const span = ref.current;
    if (!span) return;

    if (PREFERS_REDUCED_MOTION) {
      span.textContent = `${prefix}${numericValue.toLocaleString()}${suffix}`;
      return;
    }

    let startTime;
    let animationFrame;

    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing out cubic function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      // PERF: write directly to the DOM instead of 60 React re-renders/sec
      span.textContent = `${prefix}${Math.floor(easeOut * numericValue).toLocaleString()}${suffix}`;

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      } else {
        span.textContent = `${prefix}${numericValue.toLocaleString()}${suffix}`;
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isInView, numericValue, duration, prefix, suffix]);

  return (
    <span ref={ref} className="font-mono">
      {prefix}0{suffix}
    </span>
  );
}
