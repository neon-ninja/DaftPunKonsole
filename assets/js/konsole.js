/*
 * #DaftPunKonsole
 * Malik Dellidj - @Dathink
 *
 * How to play:
 * You may notice that in the song all these words are used,
 * but sometimes in a different layout, e.g.
 * - Work it, make it, do it, makes us
 * - Harder, better, faster, stronger
 * Check the lyrics and the different tones to recreate over half of the song!
 * (Or hit "Guide me" and the konsole shows you which key to press when.)
 */
(function () {
  'use strict';

  // Each word maps to sound files <name><variant>.mp3. Not every word was
  // recorded at every pitch: the left-hand words have no "Low" (3) variant.
  var WORDS = {
    WorkIt:   { lyric: 'Work it',   variants: [1, 2, 4, 5] },
    MakeIt:   { lyric: 'Make it',   variants: [1, 2, 4, 5] },
    DoIt:     { lyric: 'Do it',     variants: [1, 2, 4, 5] },
    MakesUs:  { lyric: 'Makes us',  variants: [1, 2, 4, 5] },
    Harder:   { lyric: 'Harder',    variants: [1, 2, 4, 5] },
    Better:   { lyric: 'Better',    variants: [1, 2, 4, 5] },
    Faster:   { lyric: 'Faster',    variants: [1, 2, 4, 5] },
    Stronger: { lyric: 'Stronger',  variants: [1, 2, 4, 5] },
    MoreThan: { lyric: 'More than', variants: [1, 2, 3, 4, 5] },
    Hour:     { lyric: 'Hour',      variants: [1, 2, 3, 4, 5] },
    Our:      { lyric: 'Our',       variants: [1, 2, 3, 4, 5] },
    Never:    { lyric: 'Never',     variants: [1, 2, 3, 4, 5] },
    Ever:     { lyric: 'Ever',      variants: [1, 2, 3, 4, 5] },
    After:    { lyric: 'After',     variants: [1, 2, 3, 4, 5] },
    WorkIs:   { lyric: 'Work is',   variants: [1, 2, 3, 4, 5] },
    Over:     { lyric: 'Over',      variants: [1, 2, 3, 4, 5] }
  };

  var LEVEL_VARIANT = { Normal: 1, 'Pitch-1': 2, Low: 3, 'Pitch-2': 4, High: 5 };
  var LEVELS = ['Low', 'Normal', 'Pitch-1', 'Pitch-2', 'High'];

  // Keys are matched by physical position (KeyboardEvent.code), so any
  // keyboard works out of the box; the layout choice only changes the
  // letters printed on the on-screen keys.
  var BASE_LETTERS = {
    KeyQ: 'q', KeyW: 'w', KeyE: 'e', KeyR: 'r', KeyT: 't', KeyY: 'y',
    KeyU: 'u', KeyI: 'i', KeyO: 'o', KeyP: 'p',
    KeyA: 'a', KeyS: 's', KeyD: 'd', KeyF: 'f', KeyG: 'g', KeyH: 'h',
    KeyJ: 'j', KeyK: 'k', KeyL: 'l', Semicolon: ';',
    KeyZ: 'z', KeyX: 'x', KeyC: 'c', KeyV: 'v', KeyB: 'b'
  };
  var LAYOUTS = {
    qwerty: {},
    qwertz: { KeyY: 'z', KeyZ: 'y', Semicolon: 'ö' },
    azerty: { KeyQ: 'a', KeyW: 'z', KeyA: 'q', Semicolon: 'm', KeyZ: 'w' }
  };

  // Guided mode: the real lines of the song, as key sequences.
  var GUIDE_SEQS = [
    { title: 'Line 1',
      steps: [{ level: 'Normal' }, { word: 'WorkIt' }, { word: 'Harder' }, { word: 'MakeIt' }, { word: 'Better' },
              { word: 'DoIt' }, { word: 'Faster' }, { word: 'MakesUs' }, { word: 'Stronger' }] },
    { title: 'Line 2',
      steps: [{ word: 'MoreThan' }, { word: 'Ever' }, { word: 'Hour' }, { word: 'After' },
              { word: 'Hour' }, { word: 'WorkIs' }, { word: 'Never' }, { word: 'Over' }] },
    { title: 'Line 1 &middot; pitched up',
      steps: [{ level: 'Pitch-1' }, { word: 'WorkIt' }, { word: 'Harder' }, { word: 'MakeIt' }, { word: 'Better' },
              { word: 'DoIt' }, { word: 'Faster' }, { word: 'MakesUs' }, { word: 'Stronger' }] },
    { title: 'Line 2 &middot; take it low',
      steps: [{ level: 'Low' }, { word: 'MoreThan' }, { word: 'Ever' }, { word: 'Hour' }, { word: 'After' },
              { word: 'Hour' }, { word: 'WorkIs' }, { word: 'Never' }, { word: 'Over' }] },
    { title: 'Line 1 &middot; bring it home',
      steps: [{ level: 'High' }, { word: 'WorkIt' }, { word: 'Harder' }, { word: 'MakeIt' }, { word: 'Better' },
              { word: 'DoIt' }, { word: 'Faster' }, { word: 'MakesUs' }, { word: 'Stronger' }] }
  ];

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var isTouch = window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var currentLevel = 'Normal';
  var lyrics = $('#js-lyrics');

  /* ------------------------------------------------------------------ *
   * Audio: Web Audio API for low-latency, overlapping playback.
   * The context starts suspended until the first user gesture.
   * ------------------------------------------------------------------ */
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var ctx = AudioCtx ? new AudioCtx() : null;
  var gain = null;
  if (ctx) {
    gain = ctx.createGain();
    gain.gain.value = 0.8;
    gain.connect(ctx.destination);
  }
  var buffers = {};

  function soundUrl(name) { return 'assets/sounds/' + name + '.mp3'; }

  function preloadAll() {
    if (!ctx) return;
    Object.keys(WORDS).forEach(function (word) {
      WORDS[word].variants.forEach(function (v) {
        var name = word + v;
        fetch(soundUrl(name))
          .then(function (res) { return res.arrayBuffer(); })
          .then(function (data) { return ctx.decodeAudioData(data); })
          .then(function (buffer) { buffers[name] = buffer; })
          .catch(function () { /* missing file: key falls back to <audio> */ });
      });
    });
  }

  function unlockAudio() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function playSound(name) {
    if (ctx && buffers[name]) {
      var src = ctx.createBufferSource();
      src.buffer = buffers[name];
      src.connect(gain);
      src.start(0);
    } else {
      // Buffer not ready (or no Web Audio): fall back to a plain element.
      var el = new Audio(soundUrl(name));
      el.volume = 0.8;
      el.play().catch(function () {});
    }
  }

  /* ------------------------------------------------------------------ *
   * Lyrics display
   * ------------------------------------------------------------------ */
  function showLyric(text) {
    lyrics.innerHTML = '';
    var span = document.createElement('span');
    span.className = 'animated fadeOutUp';
    span.textContent = text;
    lyrics.appendChild(span);
  }

  /* ------------------------------------------------------------------ *
   * Key actions
   * ------------------------------------------------------------------ */
  function wordAvailable(word) {
    return WORDS[word].variants.indexOf(LEVEL_VARIANT[currentLevel]) !== -1;
  }

  function refreshAvailability() {
    $$('.key.word').forEach(function (el) {
      var ok = wordAvailable(el.dataset.word);
      el.classList.toggle('is-unavailable', !ok);
      el.disabled = !ok;
      if (!ok) el.title = 'No "' + currentLevel + '" recording of this word — it only appears at other pitches';
      else el.removeAttribute('title');
    });
  }

  function setLevel(level) {
    currentLevel = level;
    LEVELS.forEach(function (l) { document.body.classList.remove(l); });
    document.body.classList.add(level);
    $$('.key.lvl').forEach(function (el) {
      var on = el.dataset.level === level;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-pressed', String(on));
    });
    refreshAvailability();
    guideOnAction({ level: level });
  }

  function pressWord(el) {
    var word = el.dataset.word;
    if (!wordAvailable(word)) {
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
      return;
    }
    showLyric(WORDS[word].lyric);
    playSound(word + LEVEL_VARIANT[currentLevel]);
    guideOnAction({ word: word });
  }

  function pressKeyEl(el) {
    unlockAudio();
    if (el.dataset.level) setLevel(el.dataset.level);
    else if (el.dataset.word) pressWord(el);
    else if (el.id === 'instru-btn') toggleInstru();
  }

  /* ------------------------------------------------------------------ *
   * Instrumental (looping backing track with progress bar)
   * ------------------------------------------------------------------ */
  var instru = $('#instru');
  var instruBtn = $('#instru-btn');
  var instruBar = $('#instru-bar');
  instru.loop = true;
  instru.volume = 0.8;

  function toggleInstru() {
    if (instru.paused) instru.play().catch(function () {});
    else instru.pause();
  }
  instru.addEventListener('play', function () {
    instruBtn.classList.add('is-playing');
    instruBtn.setAttribute('aria-pressed', 'true');
  });
  instru.addEventListener('pause', function () {
    instruBtn.classList.remove('is-playing');
    instruBtn.setAttribute('aria-pressed', 'false');
  });
  instru.addEventListener('timeupdate', function () {
    if (instru.duration) {
      instruBar.style.width = (instru.currentTime / instru.duration) * 100 + '%';
    }
  });

  /* ------------------------------------------------------------------ *
   * Guided mode
   * ------------------------------------------------------------------ */
  var guide = { on: false, seq: 0, step: 0 };
  var guideIdle = $('#guide-idle');
  var guideActive = $('#guide-active');

  function guideTarget() {
    var seq = GUIDE_SEQS[guide.seq];
    return seq ? seq.steps[guide.step] : null;
  }

  function guideKeyEl(step) {
    if (!step) return null;
    if (step.word) {
      // "Hour" appears once on the board; highlight that single key.
      return $('.key.word[data-word="' + step.word + '"]');
    }
    return $('.key.lvl[data-level="' + step.level + '"]');
  }

  function clearGuideHighlight() {
    $$('.is-next').forEach(function (el) { el.classList.remove('is-next'); });
  }

  function guideRender() {
    clearGuideHighlight();
    var seq = GUIDE_SEQS[guide.seq];
    var step = guideTarget();
    if (!seq || !step) return;
    var el = guideKeyEl(step);
    if (el) el.classList.add('is-next');
    $('#guide-line').innerHTML = seq.title;
    var hint;
    if (step.level) {
      hint = 'switch the pitch to <b>' + step.level + '</b>';
    } else {
      hint = 'press <b>' + WORDS[step.word].lyric + '</b>';
      if (!isTouch) {
        var kbd = el ? el.querySelector('.kbd').textContent : '';
        if (kbd) hint += ' <span class="hint-kbd">(key ' + kbd + ')</span>';
      }
    }
    $('#guide-text').innerHTML = hint;
    $('#guide-progress').textContent = (guide.step + 1) + ' / ' + seq.steps.length;
  }

  function guideMessage(html) {
    $('#guide-line').innerHTML = '';
    $('#guide-text').innerHTML = html;
  }

  function guideStart() {
    guide.on = true;
    guide.seq = 0;
    guide.step = 0;
    guideIdle.classList.add('is-hidden');
    guideActive.classList.remove('is-hidden');
    guideRender();
  }

  function guideExit() {
    guide.on = false;
    clearGuideHighlight();
    guideActive.classList.add('is-hidden');
    guideIdle.classList.remove('is-hidden');
  }

  function guideNextSeq() {
    guide.seq += 1;
    guide.step = 0;
    if (guide.seq >= GUIDE_SEQS.length) {
      clearGuideHighlight();
      guideMessage('&#127926; You know the whole song — start the <b>Instrumental</b> and freestyle!');
      $('#guide-progress').textContent = '';
      guide.on = false;
      setTimeout(guideExit, 6000);
    } else {
      guideRender();
    }
  }

  function guideOnAction(action) {
    if (!guide.on) return;
    var step = guideTarget();
    if (!step) return;
    var hit = (step.word && step.word === action.word) ||
              (step.level && step.level === action.level);
    if (!hit) return;
    guide.step += 1;
    if (guide.step >= GUIDE_SEQS[guide.seq].steps.length) guideNextSeq();
    else guideRender();
  }

  $('#guide-start').addEventListener('click', function () { unlockAudio(); guideStart(); });
  $('#guide-exit').addEventListener('click', guideExit);
  $('#guide-skip').addEventListener('click', function () { if (guide.on) guideNextSeq(); });

  /* ------------------------------------------------------------------ *
   * Keyboard layout / modal
   * ------------------------------------------------------------------ */
  function setLayout(name) {
    var overrides = LAYOUTS[name] || {};
    Object.keys(BASE_LETTERS).forEach(function (code) {
      var el = $('[data-key="' + code + '"] .kbd');
      if (el) el.textContent = overrides[code] || BASE_LETTERS[code];
    });
    $('#keyboard').className = 'k ' + name;
  }

  function closeModal() {
    var modal = $('#modal');
    if (modal) modal.parentNode.removeChild(modal);
  }

  $$('#modal [data-layout]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      unlockAudio();
      setLayout(btn.dataset.layout);
      closeModal();
    });
  });
  $('#modal-skip').addEventListener('click', function () {
    unlockAudio();
    closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ------------------------------------------------------------------ *
   * Input wiring
   * ------------------------------------------------------------------ */
  // Pointer events cover mouse, touch and pen with no 300ms tap delay.
  $$('[data-key]').forEach(function (el) {
    if (el.classList.contains('spacer')) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      el.classList.add('is-held');
      pressKeyEl(el);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (evt) {
      el.addEventListener(evt, function () { el.classList.remove('is-held'); });
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    var code = e.code === 'Space' ? 'Space' : e.code;
    var el = $('[data-key="' + code + '"]');
    if (!el || el.classList.contains('spacer')) return;
    e.preventDefault();
    el.classList.add('is-held');
    pressKeyEl(el);
  });
  document.addEventListener('keyup', function (e) {
    var el = $('[data-key="' + e.code + '"]');
    if (el) el.classList.remove('is-held');
  });

  /* ------------------------------------------------------------------ *
   * Init
   * ------------------------------------------------------------------ */
  setLayout('qwerty');
  setLevel('Normal');
  guide.on = false; // setLevel above must not advance the guide before start
  if (isTouch) {
    document.body.classList.add('touch');
    closeModal(); // no physical keyboard to choose — straight to the pads
  }
  preloadAll();
})();
