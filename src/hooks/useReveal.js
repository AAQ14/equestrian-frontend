import { useEffect } from 'react';

// Scroll reveal, like the Bridge theme: every element with the class "reveal"
// fades up the first time it scrolls into view.
// IntersectionObserver tells us when an element becomes visible on screen.
export default function useReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // Animate only once.
          }
        });
      },
      { threshold: 0.15 } // 15% of the element must be visible.
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect(); // Clean up when the page closes.
  }, []);
}
