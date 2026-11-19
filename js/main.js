(() => {
  const slides = [...document.querySelectorAll('.slide')];
  let current = 1, busy = false;

  function goTo(n) {
    if (busy || n === current || n < 1 || n > slides.length) return;
    busy = true;
    const from = slides[current - 1], to = slides[n - 1];
    from.classList.add('is-leaving');
    from.classList.remove('is-active');
    to.classList.add('is-active');
    current = n;
    to.dispatchEvent(new CustomEvent('slide:enter'));
    setTimeout(() => { from.classList.remove('is-leaving'); busy = false; }, 750);
  }

  // Slide 1: clicking the heart goes to slide 2 (hover scale is pure CSS)
  document.getElementById('heart').addEventListener('click', () => goTo(2));

  // Slide 2: stack of sleeves. Clicking the top one slides it away;
  // clicking the last one goes to slide 3.
  const sleeves = [...document.querySelectorAll('#sleeves .sleeve')];
  let top = 0;

  function showSleeve(i) {
    top = i;
    sleeves.forEach((s, j) => {
      s.classList.toggle('is-out', j < i);
      s.classList.toggle('is-top', j === i);
      s.disabled = j !== i;
    });
  }

  sleeves.forEach((s, i) => s.addEventListener('click', () => {
    if (i !== top) return;
    if (i < sleeves.length - 1) {
      showSleeve(i + 1);
      sleeves[i + 1].focus({ preventScroll: true });
    } else {
      s.classList.add('is-out');   // last sleeve slides away too, then move on
      s.disabled = true;
      setTimeout(() => goTo(3), 450);
    }
  }));

  // Every time slide 2 opens, the stack starts again from the first sleeve
  document.getElementById('slide-2').addEventListener('slide:enter', () => showSleeve(0));
  showSleeve(0);

  // Slide 3: confetti. Each paper piece is its own element, cropped from confetti.png,
  // so the pieces can fall separately and land exactly on the Figma layout.
  const slide3 = document.getElementById('slide-3');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pct = (v, total) => `${v / total * 100}%`;
  const pieces = (window.CONFETTI_PIECES || []).map(([x, y, w, h]) => {
    const el = document.createElement('span');
    Object.assign(el.style, {
      left: pct(x, 1920), top: pct(y, 1080), width: pct(w, 1920), height: pct(h, 1080),
      backgroundSize: `${1920 / w * 100}% ${1080 / h * 100}%`,
      backgroundPosition: `${w === 1920 ? 0 : x / (1920 - w) * 100}% ${h === 1080 ? 0 : y / (1080 - h) * 100}%`,
    });
    document.getElementById('confetti').appendChild(el);
    return { el, y, h };
  });

  function dropConfetti() {
    if (reduceMotion) return;
    const rand = (a, b) => a + Math.random() * (b - a);
    pieces.forEach(({ el, y, h }) => {
      // Start just above the top edge (1080 frame px = 100cqh), with a little sideways drift and spin
      const lift = (y + h) / 10.8 + rand(4, 40);
      const sway = rand(-6, 6), spin = rand(-260, 260);
      el.animate([
        { transform: `translate(${sway}cqh, -${lift}cqh) rotate(${spin}deg)` },
        { transform: `translate(${-sway * .35}cqh, .8cqh) rotate(${spin * .08}deg)`, offset: .82 },
        { transform: 'none' },
      ], { duration: rand(1500, 2600), delay: rand(150, 900), easing: 'cubic-bezier(.35,.55,.45,1)', fill: 'backwards' });
    });
  }

  // Slide 3: drag the left skull into the right one ("slide to unlock") to go back to slide 1
  const handle = document.getElementById('skull-handle');
  const target = document.getElementById('skull-target');
  const GAP = 974.95 - (766.05 + 145.2);   // frame px between the skulls in Figma
  const CONTACT = GAP + 18;                // how far to drag before they "collide"
  let drag = null, done = false;

  const frameScale = () => document.getElementById('stage').clientWidth / 1920;

  function resetSkulls() {
    done = false; drag = null;
    handle.classList.remove('is-dragging', 'is-returning', 'is-hit');
    target.classList.remove('is-hit');
    handle.style.transform = '';
  }

  function collide() {
    done = true; drag = null;
    handle.classList.remove('is-dragging', 'is-returning');
    handle.classList.add('is-hit');
    handle.style.transform = `translateX(${CONTACT * frameScale()}px)`;
    target.classList.add('is-hit');
    setTimeout(() => goTo(1), 550);
  }

  handle.addEventListener('pointerdown', e => {
    if (done || current !== 3) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    drag = { startX: e.clientX, id: e.pointerId };
    handle.classList.remove('is-returning');
    handle.classList.add('is-dragging');
  });
  handle.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const s = frameScale();
    const dx = Math.min(Math.max(e.clientX - drag.startX, 0), CONTACT * s);
    handle.style.transform = `translateX(${dx}px)`;
    if (dx >= CONTACT * s - 0.5) collide();
  });
  const release = e => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    handle.classList.remove('is-dragging');
    handle.classList.add('is-returning');   // not far enough: spring back
    handle.style.transform = '';
  };
  handle.addEventListener('pointerup', release);
  handle.addEventListener('pointercancel', release);
  handle.addEventListener('transitionend', () => handle.classList.remove('is-returning'));
  // Keyboard (Enter / Space): play the collision without dragging. Pointer clicks have detail > 0.
  handle.addEventListener('click', e => { if (e.detail === 0 && !done && current === 3) collide(); });

  slide3.addEventListener('slide:enter', () => { resetSkulls(); dropConfetti(); });

  // Back / next buttons on later slides
  document.querySelectorAll('[data-goto]').forEach(b =>
    b.addEventListener('click', () => goTo(Number(b.dataset.goto))));

  // Arrow keys for convenience
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' && current > 1) goTo(current + 1);
    if (e.key === 'ArrowLeft' && current > 1) goTo(current - 1);
  });
})();
