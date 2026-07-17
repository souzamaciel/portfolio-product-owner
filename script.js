const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const progress = document.createElement('div');
progress.className = 'scroll-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.prepend(progress);

if (toggle && nav) {
  const setMenuOpen = open => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open);
  };

  toggle.addEventListener('click', () => {
    setMenuOpen(!nav.classList.contains('open'));
  });

  nav.addEventListener('click', event => {
    if (event.target.matches('a')) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('click', event => {
    if (nav.classList.contains('open') && !header?.contains(event.target)) setMenuOpen(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      setMenuOpen(false);
      toggle.focus();
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
  card.setAttribute('role', 'button');
  card.setAttribute('aria-pressed', 'false');

  card.addEventListener('click', event => {
    event.stopPropagation();
    const shouldActivate = !card.classList.contains('is-active');
    toolCards.forEach(tool => tool.classList.remove('is-active'));
    card.classList.toggle('is-active', shouldActivate);
    toolCards.forEach(tool => tool.setAttribute('aria-pressed', String(tool.classList.contains('is-active'))));
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
  toolCards.forEach(card => card.setAttribute('aria-pressed', 'false'));
});

const heroTitle = document.querySelector('.hero h1');
const portrait = document.querySelector('.portrait-wrap img');
const parallaxImages = [...document.querySelectorAll('.project-media img:not(.case-concept-image), .case-hero img, .decision-visual img')];
const buildStory = document.querySelector('[data-build-story]');
const buildSteps = [...document.querySelectorAll('[data-build-step]')];
const buildLayers = [...document.querySelectorAll('[data-build-layer]')];
const buildCounter = document.querySelector('[data-build-counter]');
const caseStories = [...document.querySelectorAll('[data-case-story]')];
const stageTimers = new WeakMap();
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
      clearTimeout(stageTimers.get(stage));
      stageTimers.set(stage, setTimeout(() => stage.classList.remove('is-changing'), 700));
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
