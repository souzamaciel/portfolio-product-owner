const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let userInteractedSinceLoad = false;
['wheel', 'touchstart', 'keydown'].forEach(evt =>
  addEventListener(evt, () => { userInteractedSinceLoad = true; }, { once: true, passive: true })
);

function scrollToHashTarget() {
  if (!location.hash || userInteractedSinceLoad) return;
  let target;
  try {
    target = document.querySelector(location.hash);
  } catch {
    return;
  }
  if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
}

scrollToHashTarget();
addEventListener('pageshow', scrollToHashTarget);
addEventListener('load', scrollToHashTarget);
// Reforça a posição correta por alguns segundos: alguns navegadores tentam o
// salto nativo para a âncora tardiamente (ex.: ao interagir com view transitions),
// sobrescrevendo a rolagem já corrigida.
[0, 60, 150, 300, 600, 1000, 1500, 2500].forEach(delay => setTimeout(scrollToHashTarget, delay));

const progresso = document.createElement('div');
progresso.className = 'progresso';
progresso.setAttribute('aria-hidden', 'true');
document.body.prepend(progresso);

let progressoTicking = false;

function updateProgresso() {
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  progresso.style.transform = `scaleX(${scrollable > 0 ? scrollY / scrollable : 0})`;
  progressoTicking = false;
}

addEventListener('scroll', () => {
  if (!progressoTicking) {
    progressoTicking = true;
    requestAnimationFrame(updateProgresso);
  }
}, { passive: true });
updateProgresso();

const heroTitle = document.querySelector('.hero-title');

if (heroTitle && !reduceMotion) {
  let wordIndex = 0;
  heroTitle.querySelectorAll('.hero-line').forEach(line => {
    [...line.childNodes].forEach(node => {
      if (node.nodeType !== Node.TEXT_NODE) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          node.classList.add('w');
          node.style.setProperty('--wd', `${wordIndex++ * 60}ms`);
        }
        return;
      }
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part.trim()) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        const span = document.createElement('span');
        span.className = 'w';
        span.style.setProperty('--wd', `${wordIndex++ * 60}ms`);
        span.textContent = part;
        frag.appendChild(span);
      });
      line.replaceChild(frag, node);
    });
  });
  requestAnimationFrame(() => requestAnimationFrame(() => heroTitle.classList.add('is-in')));
}

const ANEXO_DESIGN_WIDTH = 1100;

function scaleAnexos() {
  document.querySelectorAll('.anexo-canvas').forEach(canvas => {
    const inner = canvas.querySelector('.anexo-scale');
    if (inner) inner.style.transform = `scale(${canvas.clientWidth / ANEXO_DESIGN_WIDTH})`;
  });
}

scaleAnexos();
addEventListener('resize', scaleAnexos, { passive: true });
addEventListener('load', scaleAnexos);

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));

document.querySelectorAll('.copy-email').forEach(button => {
  const label = button.textContent;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.email);
    } catch {
      const helper = document.createElement('textarea');
      helper.value = button.dataset.email;
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      helper.remove();
    }
    button.textContent = 'Copiado ✓';
    button.classList.add('copied');
    setTimeout(() => {
      button.textContent = label;
      button.classList.remove('copied');
    }, 1800);
  });
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const buildStory = document.querySelector('[data-build-story]');
const buildSteps = [...document.querySelectorAll('[data-build-step]')];
const buildLayers = [...document.querySelectorAll('[data-build-layer]')];
const buildCounter = document.querySelector('[data-build-counter]');
const caseStories = [...document.querySelectorAll('[data-case-story]')];

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

  const stage = buildStory.querySelector('.build-stage');
  if (stage) {
    const firstRect = buildSteps[0].getBoundingClientRect();
    const lastRect = buildSteps[buildSteps.length - 1].getBoundingClientRect();
    const firstCenter = firstRect.top + firstRect.height / 2;
    const lastCenter = lastRect.top + lastRect.height / 2;
    const buildProgress = clamp((viewportFocus - firstCenter) / Math.max(lastCenter - firstCenter, 1), 0, 1);
    stage.style.setProperty('--stage-progress', String(buildProgress));
  }
}

function updateCaseStories() {
  caseStories.forEach(story => {
    const steps = [...story.querySelectorAll('[data-case-decision]')];
    const stage = story.querySelector('.decision-stage');
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
    const title = active.querySelector('h3, h4')?.textContent || '';

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

    const firstRect = steps[0].getBoundingClientRect();
    const lastRect = steps[steps.length - 1].getBoundingClientRect();
    const firstCenter = firstRect.top + firstRect.height / 2;
    const lastCenter = lastRect.top + lastRect.height / 2;
    const stageProgress = clamp((viewportFocus - firstCenter) / Math.max(lastCenter - firstCenter, 1), 0, 1);
    stage.style.setProperty('--stage-progress', String(stageProgress));
  });
}

if (buildStory || caseStories.length) {
  let storyTicking = false;
  const updateStories = () => {
    updateProductBuild();
    updateCaseStories();
    storyTicking = false;
  };
  addEventListener('scroll', () => {
    if (!storyTicking) {
      storyTicking = true;
      requestAnimationFrame(updateStories);
    }
  }, { passive: true });
  addEventListener('resize', updateStories, { passive: true });
  updateStories();
}

const themeToggle = document.querySelector('.theme-toggle');

if (themeToggle) {
  const applyTheme = theme => {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
  };

  applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (!localStorage.getItem('theme')) applyTheme(event.matches ? 'dark' : 'light');
  });
}
