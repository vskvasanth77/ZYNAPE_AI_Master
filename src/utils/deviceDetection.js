const cores = navigator.hardwareConcurrency || 4;
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const narrow = window.innerWidth < 768;
const isLowEnd = cores <= 4 || isMobile || narrow;

export const device = {
  isMobile,
  isLowEnd,
  prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  pointerCoarse: window.matchMedia("(pointer: coarse)").matches,
};

export const quality = {
  particleCount:    isLowEnd ? 900 : 2800,
  pixelRatio:       isLowEnd ? 1 : Math.min(window.devicePixelRatio, 2),
  enableShadows:    !isLowEnd,
  enableDomainViz:  !isLowEnd || window.innerWidth >= 480,
  robotDetail:      isLowEnd ? "low" : "high",
};
