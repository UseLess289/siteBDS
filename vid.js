import { animate, scroll, stagger, cubicBezier } from 'https://cdn.jsdelivr.net/npm/motion@11.11.16/+esm';

// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.innerWidth <= 768;

if (prefersReducedMotion || isMobile) {
  // Skip animations if user prefers reduced motion or on mobile
  console.log('Skipping animations - reduced motion or mobile detected');
} else {
  // Desktop animation (scroll-bound sticky technique)
  let image = document.querySelector('.scaler img');
  let firstSection = document.querySelector('main section:first-of-type');
  let layers = document.querySelectorAll('.grid > .layer');

  // Measure the natural size before animating
  const naturalWidth = image.offsetWidth;
  const naturalHeight = image.offsetHeight;

  // Get viewport dimensions in pixels
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Animate image on scroll - shrink from full screen to natural size
  scroll(
    animate(image, {
      width: [viewportWidth, naturalWidth],
      height: [viewportHeight, naturalHeight]
    }, {
      width: { easing: cubicBezier(0.65, 0, 0.35, 1) },   // GSAP power2.inOut
      height: { easing: cubicBezier(0.42, 0, 0.58, 1) }   // GSAP power1.inOut
    }),
    {
      target: firstSection,
      offset: ['start start', '80% end end']
    }
  );

  // Animate each layer with staggered timing
  // Different easing per layer: power1, power3, power4
  const scaleEasings = [
    cubicBezier(0.42, 0, 0.58, 1),  // Layer 1: GSAP power1.inOut
    cubicBezier(0.76, 0, 0.24, 1),  // Layer 2: GSAP power3.inOut
    cubicBezier(0.87, 0, 0.13, 1)   // Layer 3: GSAP power4.inOut
  ];

  layers.forEach((layer, index) => {
    // Calculate different end points for each layer
    const endOffset = `${1 - (index * 0.05)} end`;

    // fade: opacity stays 0 until 55% of scroll progress, then fades to 1
    scroll(
      animate(layer, {
        opacity: [0, 0, 1]
      }, {
        offset: [0, 0.55, 1],  // Hold at 0 until 55%, then animate to 1
        easing: cubicBezier(0.61, 1, 0.88, 1)  // GSAP sine.out
      }),
      {
        target: firstSection,
        offset: ['start start', endOffset]
      }
    );

    // reveal: scale stays 0 until 30% of scroll progress, then scales to 1
    scroll(
      animate(layer, {
        scale: [0, 0, 1]
      }, {
        offset: [0, 0.3, 1],   // Hold at 0 until 30%, then animate to 1
        easing: scaleEasings[index]  // Different power curve per layer
      }),
      {
        target: firstSection,
        offset: ['start start', endOffset]
      }
    );
  });
}