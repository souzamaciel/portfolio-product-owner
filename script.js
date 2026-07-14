const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const progress = document.createElement('div');
progress.className = 'scroll-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.prepend(progress);

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  nav.addEventListener('click', event => {
    if (event.target.matches('a')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

const revealTargets = document.querySelectorAll(
  '[data-reveal], .case-hero, .case-section, .decision-heading, .decision-item, .skills-section'
);

revealTargets.forEach(element => {
  if (!element.hasAttribute('data-reveal')) element.classList.add('motion-reveal');
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

revealTargets.forEach(element => observer.observe(element));

const toolCards = [...document.querySelectorAll('.tool')];

toolCards.forEach(card => {
  card.addEventListener('click', event => {
    event.stopPropagation();
    const shouldActivate = !card.classList.contains('is-active');
    toolCards.forEach(tool => tool.classList.remove('is-active'));
    card.classList.toggle('is-active', shouldActivate);
  });

  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      card.click();
    }
  });
});

document.addEventListener('click', () => {
  toolCards.forEach(card => card.classList.remove('is-active'));
});

const heroTitle = document.querySelector('.hero h1');
const portrait = document.querySelector('.portrait-wrap img');
const projectCards = [...document.querySelectorAll('.project-card')];
const parallaxImages = [...document.querySelectorAll('.project-media img, .case-hero img, .decision-visual img')];
const buildStory = document.querySelector('[data-build-story]');
const buildSteps = [...document.querySelectorAll('[data-build-step]')];
const buildLayers = [...document.querySelectorAll('[data-build-layer]')];
const buildCounter = document.querySelector('[data-build-counter]');
const caseStories = [...document.querySelectorAll('[data-case-story]')];
let ticking = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateProductBuild() {
  if (!buildStory || !buildSteps.length) return;

  const viewportFocus = innerHeight * 0.54;
  let activeIndex = 0;
  let closestDistance = Infinity;

  buildSteps.forEach((step, index) => {
    const rect = step.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportFocus);
    if (distance < closestDistance) {
      closestDistance = distance;
      activeIndex = index;
    }
  });

  const activeStep = activeIndex + 1;
  buildStory.dataset.step = String(activeStep);
  if (buildCounter) buildCounter.textContent = `${String(activeStep).padStart(2, '0')} / ${String(buildSteps.length).padStart(2, '0')}`;

  buildSteps.forEach((step, index) => {
    step.classList.toggle('is-active', index === activeIndex);
    step.classList.toggle('is-complete', index < activeIndex);
    if (index === activeIndex) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
  });

  buildLayers.forEach(layer => {
    layer.classList.toggle('is-built', Number(layer.dataset.buildLayer) <= activeStep);
  });

  const firstRect = buildSteps[0].getBoundingClientRect();
  const lastRect = buildSteps[buildSteps.length - 1].getBoundingClientRect();
  const firstCenter = firstRect.top + firstRect.height / 2;
  const lastCenter = lastRect.top + lastRect.height / 2;
  const buildProgress = clamp((viewportFocus - firstCenter) / Math.max(lastCenter - firstCenter, 1), 0, 1);
  buildStory.style.setProperty('--build-progress', String(buildProgress));
}

function updateCaseStories() {
  caseStories.forEach(story => {
    const steps = [...story.querySelectorAll('[data-case-decision]')];
    const stage = story.querySelector('.decision-product-stage');
    const scenes = [...story.querySelectorAll('[data-decision-scene]')];
    const counter = story.querySelector('[data-case-counter]');
    const caption = story.querySelector('[data-case-caption]');
    if (!steps.length || !stage || !scenes.length) return;

    const viewportFocus = innerHeight * 0.54;
    let activeIndex = 0;
    let closestDistance = Infinity;

    steps.forEach((step, index) => {
      const rect = step.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - viewportFocus);
      if (distance < closestDistance) {
        closestDistance = distance;
        activeIndex = index;
      }
    });

    const active = steps[activeIndex];
    const title = active.querySelector('h3')?.textContent || '';

    if (counter) counter.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
    if (caption && caption.textContent !== title) caption.textContent = title;

    steps.forEach((step, index) => {
      step.classList.toggle('is-active', index === activeIndex);
      step.classList.toggle('is-complete', index < activeIndex);
      if (index === activeIndex) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });

    scenes.forEach((scene, index) => {
      scene.classList.toggle('is-active', index === activeIndex);
      scene.setAttribute('aria-hidden', String(index !== activeIndex));
    });

    const previousIndex = Number(story.dataset.activeDecision || '0');
    if (previousIndex !== activeIndex + 1) {
      story.dataset.activeDecision = String(activeIndex + 1);
      stage.classList.remove('is-changing');
      requestAnimationFrame(() => stage.classList.add('is-changing'));
    }
  });
}

function updateScrollEffects() {
  const top = scrollY;
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  const pageProgress = scrollable > 0 ? top / scrollable : 0;

  progress.style.transform = `scaleX(${pageProgress})`;
  if (header) header.classList.toggle('scrolled', top > 12);
  updateProductBuild();
  updateCaseStories();

  if (!reduceMotion && innerWidth > 700) {
    if (heroTitle) {
      const heroProgress = clamp(top / Math.max(innerHeight, 1), 0, 1);
      heroTitle.style.transform = `translate3d(0, ${heroProgress * -58}px, 0)`;
      heroTitle.style.opacity = String(1 - heroProgress * 0.42);
    }

    if (portrait) {
      const rect = portrait.getBoundingClientRect();
      const offset = clamp((innerHeight - rect.top) / (innerHeight + rect.height), 0, 1);
      portrait.style.transform = `translate3d(0, ${(offset - 0.5) * -34}px, 0) scale(1.035)`;
    }

    projectCards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const centerDistance = Math.abs(rect.top + rect.height / 2 - innerHeight / 2);
      const proximity = 1 - clamp(centerDistance / innerHeight, 0, 1);
      card.style.setProperty('--card-shift', `${(1 - proximity) * 10}px`);
      card.style.setProperty('--card-scale', String(0.985 + proximity * 0.015));
      card.style.setProperty('--card-shadow-y', `${8 + proximity * 18}px`);
      card.style.setProperty('--card-shadow-blur', `${22 + proximity * 34}px`);
      card.style.setProperty('--card-shadow-alpha', String(0.025 + proximity * 0.055));
    });

    parallaxImages.forEach(image => {
      const container = image.parentElement;
      const rect = container.getBoundingClientRect();
      if (rect.bottom < -80 || rect.top > innerHeight + 80) return;
      const normalized = (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight;
      image.style.setProperty('--image-parallax', `${clamp(normalized * -34, -26, 26)}px`);
    });

  }

  ticking = false;
}

function requestScrollUpdate() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(updateScrollEffects);
  }
}

addEventListener('scroll', requestScrollUpdate, { passive: true });
addEventListener('resize', requestScrollUpdate, { passive: true });
updateScrollEffects();

const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

if (finePointer && !reduceMotion) {
  const cursorDot = document.createElement('div');
  const cursorRing = document.createElement('div');
  const cursorLabel = document.createElement('span');
  cursorDot.className = 'cursor-dot';
  cursorRing.className = 'cursor-ring';
  cursorDot.setAttribute('aria-hidden', 'true');
  cursorRing.setAttribute('aria-hidden', 'true');
  cursorRing.append(cursorLabel);
  document.body.append(cursorDot, cursorRing);

  let pointerX = innerWidth / 2;
  let pointerY = innerHeight / 2;
  let ringX = pointerX;
  let ringY = pointerY;

  function renderCursor() {
    ringX += (pointerX - ringX) * 0.18;
    ringY += (pointerY - ringY) * 0.18;
    cursorDot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
    cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(renderCursor);
  }

  addEventListener('pointermove', event => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    document.documentElement.classList.add('cursor-active');
  }, { passive: true });

  document.documentElement.addEventListener('mouseleave', () => {
    document.documentElement.classList.remove('cursor-active');
  });

  document.querySelectorAll('a, button, .tool').forEach(element => {
    element.addEventListener('pointerenter', () => {
      const isProject = element.classList.contains('project-card');
      cursorRing.classList.add('is-interactive');
      cursorRing.classList.toggle('has-label', isProject);
      cursorLabel.textContent = isProject ? 'Ver case →' : '';
    });

    element.addEventListener('pointerleave', () => {
      cursorRing.classList.remove('is-interactive', 'has-label');
      cursorLabel.textContent = '';
    });
  });

  document.querySelectorAll('.primary-action, .secondary-action, .text-link').forEach(element => {
    element.classList.add('cursor-magnetic');

    element.addEventListener('pointermove', event => {
      const rect = element.getBoundingClientRect();
      const offsetX = event.clientX - (rect.left + rect.width / 2);
      const offsetY = event.clientY - (rect.top + rect.height / 2);
      element.style.transform = `translate3d(${clamp(offsetX * 0.12, -7, 7)}px, ${clamp(offsetY * 0.12, -7, 7)}px, 0)`;
    });

    element.addEventListener('pointerleave', () => {
      element.style.transform = '';
    });
  });

  renderCursor();
}
