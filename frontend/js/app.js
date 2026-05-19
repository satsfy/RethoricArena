// RhetoricArena single-file frontend controller.

// ---------- Debate topic bank ----------
const TOPICS = [
  // AI & Tech
  { cat: 'AI & Tech', text: 'Claude is better than ChatGPT' },
  { cat: 'AI & Tech', text: 'AI will take more jobs than it creates' },
  { cat: 'AI & Tech', text: 'AI should replace human judges in criminal courts' },
  { cat: 'AI & Tech', text: 'Social media does more harm than good' },
  { cat: 'AI & Tech', text: 'Everyone should learn to code' },
  { cat: 'AI & Tech', text: 'The internet has made us less intelligent' },
  { cat: 'AI & Tech', text: 'Big Tech companies should be broken up' },
  { cat: 'AI & Tech', text: 'Open-source AI is too dangerous to be unrestricted' },
  { cat: 'AI & Tech', text: 'Smartphones have destroyed a generation' },
  { cat: 'AI & Tech', text: 'Autonomous weapons should be banned' },
  { cat: 'AI & Tech', text: 'Tech billionaires are good for humanity' },
  { cat: 'AI & Tech', text: 'Crypto will replace traditional banking' },
  { cat: 'AI & Tech', text: 'AI art is real art' },
  { cat: 'AI & Tech', text: 'We are already living in a simulation' },
  { cat: 'AI & Tech', text: 'Privacy is dead and we should accept it' },
  // Politics & Society
  { cat: 'Politics', text: 'Democracy is the worst system except for all the others' },
  { cat: 'Politics', text: 'Voting should be mandatory' },
  { cat: 'Politics', text: 'The two-party system is beyond repair' },
  { cat: 'Politics', text: 'Open borders would be good for the world' },
  { cat: 'Politics', text: 'Cancel culture has gone too far' },
  { cat: 'Politics', text: 'Political correctness is destroying free speech' },
  { cat: 'Politics', text: 'Universal basic income would do more harm than good' },
  { cat: 'Politics', text: 'The UN is irrelevant in today\'s world' },
  { cat: 'Politics', text: 'Term limits should be mandatory for all politicians' },
  { cat: 'Politics', text: 'Nationalism is a greater threat than terrorism' },
  { cat: 'Politics', text: 'Meritocracy is a myth' },
  { cat: 'Politics', text: 'Affirmative action does more harm than good' },
  { cat: 'Politics', text: 'The media is the enemy of the people' },
  { cat: 'Politics', text: 'Whistleblowers should be protected, not prosecuted' },
  { cat: 'Politics', text: 'Lobbying is legalised corruption' },
  // Economics
  { cat: 'Economics', text: 'Bitcoin is superior to altcoins' },
  { cat: 'Economics', text: 'Capitalism is the root cause of climate change' },
  { cat: 'Economics', text: 'The 40-hour work week is obsolete' },
  { cat: 'Economics', text: 'CEOs are paid too much' },
  { cat: 'Economics', text: 'Free trade does more harm to developing nations than good' },
  { cat: 'Economics', text: 'Billionaires should not exist' },
  { cat: 'Economics', text: 'Automation will solve poverty' },
  { cat: 'Economics', text: 'The housing market is broken beyond political repair' },
  { cat: 'Economics', text: 'Student loan debt should be cancelled' },
  { cat: 'Economics', text: 'The gig economy exploits workers' },
  { cat: 'Economics', text: 'Inflation is always a political choice' },
  { cat: 'Economics', text: 'Healthcare should be entirely publicly funded' },
  { cat: 'Economics', text: 'A wealth tax would do more harm than good' },
  // Ethics & Philosophy
  { cat: 'Ethics', text: 'It is ethical to eat meat' },
  { cat: 'Ethics', text: 'Euthanasia should be a universal right' },
  { cat: 'Ethics', text: 'The death penalty is never justified' },
  { cat: 'Ethics', text: 'We have a moral obligation to colonise Mars' },
  { cat: 'Ethics', text: 'Lying is sometimes the most ethical choice' },
  { cat: 'Ethics', text: 'Genetic enhancement of children should be legal' },
  { cat: 'Ethics', text: 'Animals deserve the same rights as humans' },
  { cat: 'Ethics', text: 'We owe more to future generations than to the present' },
  { cat: 'Ethics', text: 'Effective altruism is a cult for the privileged' },
  { cat: 'Ethics', text: 'It is morally wrong to have children in 2025' },
  { cat: 'Ethics', text: 'Trolley problem: always pull the lever' },
  { cat: 'Ethics', text: 'A world government would be better for humanity' },
  // Science & Environment
  { cat: 'Science', text: 'Nuclear power is essential to fighting climate change' },
  { cat: 'Science', text: 'We are doing too little too late on climate change' },
  { cat: 'Science', text: 'Geoengineering the climate is too risky to attempt' },
  { cat: 'Science', text: 'Space colonisation should be a top global priority' },
  { cat: 'Science', text: 'Veganism is the only ethical diet' },
  { cat: 'Science', text: 'Lab-grown meat will save the planet' },
  { cat: 'Science', text: 'We should resurrect extinct species' },
  { cat: 'Science', text: 'Anti-vaccine sentiment is a bigger threat than any virus' },
  { cat: 'Science', text: 'Psychedelics should be legalised for therapeutic use' },
  { cat: 'Science', text: 'The singularity will happen within 30 years' },
  // Culture & Media
  { cat: 'Culture', text: 'Streaming has killed the movie theatre' },
  { cat: 'Culture', text: 'Video games are a legitimate art form' },
  { cat: 'Culture', text: 'Influencers are the celebrities of our generation' },
  { cat: 'Culture', text: 'Pop music has gotten worse' },
  { cat: 'Culture', text: 'Books are better than their film adaptations' },
  { cat: 'Culture', text: 'Reality TV is genuinely harmful to society' },
  { cat: 'Culture', text: 'The Marvel Cinematic Universe ruined cinema' },
  { cat: 'Culture', text: 'Satire is more powerful than protest' },
  { cat: 'Culture', text: 'Nostalgia is making culture worse' },
  { cat: 'Culture', text: 'Comedy has no limits' },
  { cat: 'Culture', text: 'Twitter/X has been bad for public discourse' },
  { cat: 'Culture', text: 'Long-form journalism is dying and we should care' },
  // Education
  { cat: 'Education', text: 'University is no longer worth the cost' },
  { cat: 'Education', text: 'Standardised testing is counterproductive' },
  { cat: 'Education', text: 'Homework does more harm than good' },
  { cat: 'Education', text: 'Philosophy should be taught in every school' },
  { cat: 'Education', text: 'Elite universities perpetuate inequality' },
  { cat: 'Education', text: 'We should teach negotiation, not just math' },
  { cat: 'Education', text: 'Homeschooling is better than traditional schooling' },
  { cat: 'Education', text: 'Critical thinking should be the core of every curriculum' },
  // Health & Lifestyle
  { cat: 'Health', text: 'Work-life balance is a lie sold to workers' },
  { cat: 'Health', text: 'Mental health days should be a legal right' },
  { cat: 'Health', text: 'Alcohol is more harmful to society than cannabis' },
  { cat: 'Health', text: 'The wellness industry is mostly pseudoscience' },
  { cat: 'Health', text: 'Running is overrated as exercise' },
  { cat: 'Health', text: 'Intermittent fasting is a fad' },
  { cat: 'Health', text: 'We are living through an epidemic of loneliness' },
  { cat: 'Health', text: 'The 8-hour sleep rule is outdated' },
  // Spicy / Fun
  { cat: 'Spicy', text: 'Pineapple belongs on pizza' },
  { cat: 'Spicy', text: 'Remote work is better than office work' },
  { cat: 'Spicy', text: 'Coffee is overrated' },
  { cat: 'Spicy', text: 'Cats are better pets than dogs' },
  { cat: 'Spicy', text: 'Men have it harder than women in modern society' },
  { cat: 'Spicy', text: 'Marriage is an outdated institution' },
  { cat: 'Spicy', text: 'Monogamy is unnatural' },
  { cat: 'Spicy', text: 'Introverts make better leaders' },
  { cat: 'Spicy', text: 'Short meetings should replace emails' },
  { cat: 'Spicy', text: 'Morning people are more productive — or just more annoying' },
  { cat: 'Spicy', text: 'Adults should have a bedtime' },
  { cat: 'Spicy', text: 'Luck matters more than skill in career success' },
  { cat: 'Spicy', text: 'The friend zone does not exist' },
  { cat: 'Spicy', text: 'Hot takes are good for public discourse' },
  { cat: 'Spicy', text: 'Hustle culture is a mental illness' },
];

// 3 featured topics shown as quick-pick chips (shuffled each load)
const FEATURED_TOPICS = (() => {
  const pool = TOPICS.filter(t => [
    'A world government would be better for humanity',
    'Bitcoin is superior to altcoins',
    'Privacy is dead and we should accept it',
  ].includes(t.text));
  return pool;
})();

// ---------- Persona metadata mirrored from backend ----------
const DEBATERS = {
  rigorous:    { name: 'The Academic',     desc: 'Definitions, hidden premises, surgical dissection.' },
  populist:    { name: 'The Firebrand',    desc: 'Gut, stakes, moral heat in plain language.' },
  socratic:    { name: 'The Questioner',   desc: 'Probes. One sharp question, never formulaic.' },
  pragmatist:  { name: 'The Realist',      desc: 'Mechanisms, costs, who bears the downside.' },
  devil:       { name: 'The Contrarian',   desc: 'Surfaces the assumption you didn\'t argue for.' },
  historian:   { name: 'The Historian',    desc: 'Cites precedent, then strikes.' },
  steelman:    { name: 'The Steelman',     desc: 'Restates your case at its strongest, then breaks it.' },
  storyteller: { name: 'The Storyteller',  desc: 'One real case. The story IS the argument.' },
};
const AUDIENCE = {
  academic: { name: 'Prof. Chen', desc: 'Logical rigor and evidence.' },
  undecided_voter: { name: 'Maya', desc: 'Emotionally driven, narrative-led.' },
  policy_wonk: { name: 'Dmitri', desc: 'Policy feasibility, specifics.' },
  skeptic: { name: 'Ren', desc: 'Hostile by default. Win them over.' },
  rhetorician: { name: 'Isabella', desc: 'Pure rhetorical craft.' },
};

// ---------- State ----------
const CONFIG_STORAGE = 'rhetoricarena.config';
const DEFAULT_CONFIG = {
  motion: '',
  user_position: 'against',
  difficulty: 'standard',
  time_per_turn_seconds: 60,
  max_turns: 6,
  debater_count: 2,
  debater_personalities: ['rigorous', 'socratic'],
  audience_count: 3,
  audience_personas: ['academic', 'undecided_voter', 'policy_wonk'],
  input_method: 'voice',
  response_length: 'short',
  show_scratch: 'off',
};
function loadSavedConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
function saveConfig() {
  try { localStorage.setItem(CONFIG_STORAGE, JSON.stringify(state.config)); } catch {}
}

const state = {
  config: loadSavedConfig(),
  sessionId: null,
  ws: null,
  apiKey: '',
  serverHasKey: false,
  transcriptionAvailable: false,
  ttsAvailable: false,
  voiceMode: null,           // 'speech_recognition' | 'media_recorder' | null
  mediaRecorder: null,
  recordingChunks: [],
  recordingStream: null,
  recordingMime: '',
  preRecordingText: '',
  liveTranscribeTimer: null,
  liveTranscribeAbort: null,
  currentSpeaker: null,
  liveBuffers: {},   // speaker -> string (speech only, for non-analyst speakers)
  liveScratch: {},   // debater speaker -> string (the setup/thinking portion)
  timer: null,
  timerSecondsLeft: 0,
  awaitingUser: false,
  recognizing: false,
  recognition: null,
  recognitionDisabled: false,
  evalQueue: [],
  lastTTSPromise: Promise.resolve(),
  turns: [],                 // every saved turn (user + AI) in arrival order
  evaluations: [],           // per-user-turn evaluator output, parallel to user turns
  audienceReactions: [],     // final-screen audience verdicts
};

// ---------- TTS (server OpenAI, browser SpeechSynthesis, off) ----------
// Three modes, cycled by the TTS button. Server TTS sounds great but has 1-3s
// of latency before audio starts; native is instant but voices are mediocre
// (especially on Firefox). Mode persists in localStorage.
const TTS_STORAGE = 'rhetoricarena.tts_mode';
const TTS_SPEED_STORAGE = 'rhetoricarena.tts_speed';
const SPEED_STEPS = [1, 1.25, 1.5, 1.75, 2];
const tts = {
  mode: localStorage.getItem(TTS_STORAGE) || 'browser',  // 'server' | 'browser' | 'off'
  speed: parseFloat(localStorage.getItem(TTS_SPEED_STORAGE)) || 1,
  voices: [],
  voiceMap: {},
  current: null,           // current SpeechSynthesisUtterance
  currentAudio: null,      // current <audio> element when using server TTS
  currentAudioUrl: null,
};

function loadVoices() {
  if (!window.speechSynthesis) return;
  tts.voices = speechSynthesis.getVoices();
}
if (window.speechSynthesis) {
  loadVoices();
  speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

function rankVoice(v) {
  const n = v.name.toLowerCase();
  // Prefer cloud/neural voices; avoid espeak/festival which can sound reverb-y.
  if (n.includes('google')) return 3;
  if (n.includes('microsoft') || n.includes('zira') || n.includes('david')) return 2;
  if (n.includes('espeak') || n.includes('festival') || n.includes('mbrola')) return 0;
  return 1;
}

let _debaterVoiceSlot = 0;

function pickVoice(speakerId) {
  if (tts.voiceMap[speakerId]) return tts.voiceMap[speakerId];
  const en = tts.voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
  if (!en.length) return null;
  const sorted = [...en].sort((a, b) => rankVoice(b) - rankVoice(a));
  let v;
  if (speakerId === 'moderator') {
    // Best available voice for the moderator.
    v = sorted[0];
  } else {
    // Each debater/speaker gets the next slot in the pool sequentially so they
    // never collide and no single speaker is stuck on a bad voice permanently.
    const pool = sorted.length > 1 ? sorted.slice(1) : sorted;
    v = pool[_debaterVoiceSlot % pool.length];
    _debaterVoiceSlot++;
  }
  tts.voiceMap[speakerId] = v;
  return v;
}

async function speak(speakerId, text) {
  if (!text || tts.mode === 'off') return;
  if (tts.mode === 'server' && state.ttsAvailable) {
    try {
      await speakViaServer(speakerId, text);
      return;
    } catch (e) {
      // Fall through to browser TTS on transient server failure.
    }
  }
  await speakViaBrowser(speakerId, text);
}

function applyTTSMode() {
  // Coerce server mode to browser when server TTS isn't actually available.
  if (tts.mode === 'server' && !state.ttsAvailable) tts.mode = 'browser';
  if (!['server', 'browser', 'off'].includes(tts.mode)) tts.mode = state.ttsAvailable ? 'server' : 'browser';
  localStorage.setItem(TTS_STORAGE, tts.mode);

  const btn = document.getElementById('tts-toggle');
  if (btn) {
    if (tts.mode === 'server')  btn.textContent = '🔊 OPENAI';
    else if (tts.mode === 'browser') btn.textContent = '🌐 NATIVE';
    else                              btn.textContent = '🔇 OFF';
    btn.title = `TTS mode: ${tts.mode}. Click to cycle.`;
  }
  if (tts.mode === 'off') stopSpeaking();
}

function cycleTTSMode() {
  const modes = state.ttsAvailable ? ['browser', 'server', 'off'] : ['browser', 'off'];
  const i = modes.indexOf(tts.mode);
  tts.mode = modes[(i + 1) % modes.length];
  stopSpeaking();
  applyTTSMode();
}

function applySpeedUI() {
  const btn = document.getElementById('tts-speed');
  if (btn) btn.textContent = `⏩ ${tts.speed}x`;
}

function cycleSpeed() {
  let i = SPEED_STEPS.indexOf(tts.speed);
  if (i < 0) i = 0;
  tts.speed = SPEED_STEPS[(i + 1) % SPEED_STEPS.length];
  localStorage.setItem(TTS_SPEED_STORAGE, String(tts.speed));
  // Apply live to anything currently playing.
  if (tts.currentAudio) tts.currentAudio.playbackRate = tts.speed;
  applySpeedUI();
}

function speakViaBrowser(speakerId, text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    try { speechSynthesis.cancel(); } catch {}
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(speakerId);
    if (v) u.voice = v;
    u.rate = Math.min(2, 1.05 * tts.speed);
    u.pitch = speakerId.startsWith('debater_') ? 0.95 : 1.0;
    let done = false;
    const finish = () => { if (done) return; done = true; tts.current = null; resolve(); };
    u.onend = finish;
    u.onerror = finish;
    tts.current = u;
    speechSynthesis.speak(u);
  });
}

async function speakViaServer(speakerId, text) {
  const r = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, speaker: speakerId }),
  });
  if (!r.ok) throw new Error('tts http ' + r.status);
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.playbackRate = tts.speed;
  tts.currentAudio = audio;
  tts.currentAudioUrl = url;
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      tts.currentAudio = null;
      try { URL.revokeObjectURL(url); } catch {}
      tts.currentAudioUrl = null;
      resolve();
    };
    audio.onended = finish;
    audio.onerror = finish;
    audio.play().catch(finish);
  });
}

function stopSpeaking() {
  if (window.speechSynthesis) {
    try { speechSynthesis.cancel(); } catch {}
  }
  tts.current = null;
  if (tts.currentAudio) {
    try { tts.currentAudio.pause(); } catch {}
    if (tts.currentAudioUrl) { try { URL.revokeObjectURL(tts.currentAudioUrl); } catch {} }
    tts.currentAudio = null;
    tts.currentAudioUrl = null;
  }
}

// ---------- Helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showScreen(id) {
  $$('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  // Config is a form that should scroll naturally; all other screens are
  // fixed-height panels that must not let the window scroll.
  document.body.style.overflow = id === 'screen-config' ? 'auto' : 'hidden';
}

function speakerLabel(speaker) {
  if (speaker === 'user') return 'YOU';
  if (speaker === 'moderator') return 'MODERATOR';
  if (speaker.startsWith('debater_')) {
    const id = speaker.replace('debater_', '');
    return (DEBATERS[id]?.name || id).toUpperCase();
  }
  return speaker.toUpperCase();
}

// ---------- BYOK ----------
const KEY_STORAGE = 'rhetoricarena.deepseek_api_key';

async function loadServerConfig() {
  try {
    const r = await fetch('/api/config', { cache: 'no-store' });
    const data = await r.json();
    state.serverHasKey = !!data.server_has_key;
    state.transcriptionAvailable = !!data.transcription_available;
    state.ttsAvailable = !!data.tts_available;
  } catch {
    state.serverHasKey = false;
    state.transcriptionAvailable = false;
    state.ttsAvailable = false;
  }

  if (!state.serverHasKey) {
    $('#key-field').style.display = '';
    const saved = localStorage.getItem(KEY_STORAGE) || '';
    if (saved) {
      $('#cfg-api-key').value = saved;
      state.apiKey = saved;
    }
    $('#cfg-api-key').addEventListener('input', (e) => {
      state.apiKey = e.target.value.trim();
      if (state.apiKey) localStorage.setItem(KEY_STORAGE, state.apiKey);
      validate();
    });
  }
}

// ---------- Config screen wiring ----------
function syncConfigUI() {
  // Reflect saved state.config values into the choice buttons, motion field, slider.
  $$('.choices').forEach((group) => {
    const key = group.dataset.key;
    const val = state.config[key];
    if (val === undefined || val === null) return;
    group.querySelectorAll('.choice').forEach((b) => {
      b.classList.toggle('active', String(b.dataset.val) === String(val));
    });
  });
  if (state.config.motion) $('#cfg-motion').value = state.config.motion;
  $('#cfg-max-turns').value = state.config.max_turns;
  $('#max-turns-label').textContent = state.config.max_turns;
}

function setMotion(text) {
  state.config.motion = text;
  $('#cfg-motion').value = text;
  saveConfig();
  validate();
}

function initTopicPicker() {
  // Featured chips
  const suggestionsEl = $('#motion-suggestions');
  FEATURED_TOPICS.forEach((t) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'topic-chip';
    btn.textContent = t.text;
    btn.addEventListener('click', () => setMotion(t.text));
    suggestionsEl.appendChild(btn);
  });

  // Custom panel grouped by category. Replaces a native <select> because
  // Firefox renders <optgroup> with awkward nested popups.
  const panel = $('#motion-browse-panel');
  const browseBtn = $('#motion-browse-btn');
  const cats = [...new Set(TOPICS.map(t => t.cat))];
  cats.forEach((cat) => {
    const head = document.createElement('div');
    head.className = 'motion-browse-cat';
    head.textContent = cat;
    panel.appendChild(head);
    const row = document.createElement('div');
    row.className = 'motion-browse-row';
    TOPICS.filter(t => t.cat === cat).forEach((t) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'topic-chip';
      chip.textContent = t.text;
      chip.addEventListener('click', () => {
        setMotion(t.text);
        panel.classList.add('hidden');
      });
      row.appendChild(chip);
    });
    panel.appendChild(row);
  });

  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('hidden');
  });
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('hidden')) return;
    if (!panel.contains(e.target) && e.target !== browseBtn) {
      panel.classList.add('hidden');
    }
  });
}

function initConfig() {
  // Choice button groups
  $$('.choices').forEach((group) => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.choice');
      if (!btn) return;
      group.querySelectorAll('.choice').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const key = group.dataset.key;
      let val = btn.dataset.val;
      if (['time_per_turn_seconds', 'debater_count', 'audience_count'].includes(key)) val = parseInt(val);
      state.config[key] = val;
      if (key === 'debater_count') renderDebaterSlots();
      if (key === 'audience_count') renderAudienceSlots();
      saveConfig();
      validate();
    });
  });

  $('#cfg-motion').addEventListener('input', (e) => {
    state.config.motion = e.target.value.trim();
    saveConfig();
    validate();
  });

  const turnsSlider = $('#cfg-max-turns');
  turnsSlider.addEventListener('input', (e) => {
    state.config.max_turns = parseInt(e.target.value);
    $('#max-turns-label').textContent = e.target.value;
    saveConfig();
  });

  syncConfigUI();
  renderDebaterSlots();
  renderAudienceSlots();
  initTopicPicker();
  validate();

  $('#enter-arena').addEventListener('click', enterArena);
}

function renderDebaterSlots() {
  const wrap = $('#debater-slots');
  wrap.innerHTML = '';
  const count = state.config.debater_count;
  if (count === 0) { state.config.debater_personalities = []; return; }
  const ids = Object.keys(DEBATERS);
  while (state.config.debater_personalities.length < count) {
    state.config.debater_personalities.push(ids[state.config.debater_personalities.length % ids.length]);
  }
  state.config.debater_personalities = state.config.debater_personalities.slice(0, count);

  for (let i = 0; i < count; i++) {
    const sel = document.createElement('select');
    Object.entries(DEBATERS).forEach(([id, p]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = `${p.name} — ${p.desc}`;
      if (state.config.debater_personalities[i] === id) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', (e) => {
      state.config.debater_personalities[i] = e.target.value;
      saveConfig();
    });
    wrap.appendChild(sel);
  }
}

function renderAudienceSlots() {
  const wrap = $('#audience-slots');
  wrap.innerHTML = '';
  const count = state.config.audience_count;
  if (count === 0) { state.config.audience_personas = []; return; }
  const ids = Object.keys(AUDIENCE);
  while (state.config.audience_personas.length < count) {
    state.config.audience_personas.push(ids[state.config.audience_personas.length % ids.length]);
  }
  state.config.audience_personas = state.config.audience_personas.slice(0, count);

  for (let i = 0; i < count; i++) {
    const sel = document.createElement('select');
    Object.entries(AUDIENCE).forEach(([id, p]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = `${p.name} — ${p.desc}`;
      if (state.config.audience_personas[i] === id) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', (e) => {
      state.config.audience_personas[i] = e.target.value;
      saveConfig();
    });
    wrap.appendChild(sel);
  }
}

function validate() {
  const motionOk = state.config.motion && state.config.motion.length >= 5;
  const keyOk = state.serverHasKey || (state.apiKey && state.apiKey.startsWith('sk-'));
  $('#enter-arena').disabled = !(motionOk && keyOk);
}

// ---------- Enter arena ----------
async function enterArena() {
  $('#enter-arena').disabled = true;
  $('#enter-arena').textContent = 'STARTING...';
  try {
    const body = { config: state.config };
    if (!state.serverHasKey && state.apiKey) body.api_key = state.apiKey;
    const resp = await fetch('/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error('failed to create session');
    const data = await resp.json();
    state.sessionId = data.session_id;
    setupArena();
    connectWebSocket();
    showScreen('screen-arena');
  } catch (e) {
    alert('Could not start session: ' + e.message);
    $('#enter-arena').disabled = false;
    $('#enter-arena').textContent = 'ENTER THE ARENA';
  }
}

function setupArena() {
  $('#motion-pill').textContent = state.config.motion;
  $('#turn-max').textContent = state.config.max_turns;
  $('#turn-current').textContent = 0;

  // Debater cards
  const cards = $('#debater-cards');
  cards.innerHTML = '';
  const showScratch = state.config.show_scratch === 'on';
  cards.classList.toggle('show-scratch', showScratch);
  if (state.config.debater_count === 0) {
    cards.innerHTML = '<p class="muted" style="padding:12px 0;font-size:13px">No opponents — solo review mode.</p>';
  } else {
    state.config.debater_personalities.forEach((pid) => {
      const p = DEBATERS[pid] || { name: pid, desc: '' };
      const div = document.createElement('div');
      div.className = 'debater-card';
      div.dataset.speaker = `debater_${pid}`;
      div.innerHTML = `
        <div class="name">${p.name}</div>
        <div class="bar"></div>
        <div class="scratch-block">
          <div class="scratch-label">SETUP · private thinking</div>
          <div class="scratch" data-role="scratch"></div>
        </div>
        <div class="body" data-role="body"></div>
      `;
      cards.appendChild(div);
    });
  }

  // Audience silhouettes
  const aud = $('#audience-list');
  aud.innerHTML = '';
  if (state.config.audience_count === 0) {
    aud.innerHTML = '<p class="muted" style="font-size:12px;padding:8px 0">No audience.</p>';
  } else {
    state.config.audience_personas.forEach((pid) => {
      const p = AUDIENCE[pid];
      const div = document.createElement('div');
      div.className = 'audience-item';
      div.innerHTML = `
        <div class="a-name">○ ${p.name}</div>
        <div class="a-status">observing...</div>
      `;
      aud.appendChild(div);
    });
  }

  // Transcript reset
  $('#transcript').innerHTML = '';
  $('#user-input').value = '';
}

// ---------- WebSocket ----------
function connectWebSocket() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${proto}//${location.host}/ws/${state.sessionId}`);
  state.ws = ws;

  ws.onmessage = (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    handleMessage(msg);
  };
  ws.onclose = () => setStatus('Connection closed.');
  ws.onerror = () => setStatus('Connection error.');
  ws.onopen = () => setStatus('Connected. The moderator is preparing...');
}

// Buffer for stream messages and post-stream actions that must wait for TTS.
// Each entry is either an array of {type,speaker,token?} (one speaker turn) or
// a function (a deferred action like timer_start / audience_reveal_start).
// Items are flushed strictly in arrival order, each waiting for the in-flight
// TTS promise to resolve before running.
const _streamQueue = [];
let _streamQueueFlushing = false;

function _enqueueStreamGroup(msgs) {
  _streamQueue.push(msgs);
  _flushStreamQueue();
}

function _enqueueAfterTTS(fn) {
  _streamQueue.push(fn);
  _flushStreamQueue();
}

function _flushStreamQueue() {
  if (_streamQueueFlushing) return;
  _streamQueueFlushing = true;
  (function next() {
    if (!_streamQueue.length) { _streamQueueFlushing = false; return; }
    // Read lastTTSPromise lazily so we always chain on the most recently
    // assigned promise (a prior stream_end may have just replaced it).
    state.lastTTSPromise.then(() => {
      const item = _streamQueue.shift();
      if (typeof item === 'function') {
        item();
      } else {
        for (const m of item) {
          if (m.type === 'stream_start') onStreamStart(m.speaker);
          else if (m.type === 'stream_token') onStreamToken(m.speaker, m.token, m.part);
          else if (m.type === 'stream_end') onStreamEnd(m.speaker);
        }
      }
      // onStreamEnd sets a new lastTTSPromise; loop after it resolves
      next();
    });
  })();
}

// Accumulator for the current in-flight stream (non-analyst only).
let _incomingGroup = null;

function handleMessage(msg) {
  switch (msg.type) {
    case 'session_ready':
      setStatus('Session ready.');
      break;
    case 'stream_start':
      if (msg.speaker === 'analyst') { onStreamStart(msg.speaker); break; }
      _incomingGroup = [{ type: 'stream_start', speaker: msg.speaker }];
      break;
    case 'stream_token':
      if (msg.speaker === 'analyst') { onStreamToken(msg.speaker, msg.token); break; }
      if (_incomingGroup) _incomingGroup.push({ type: 'stream_token', speaker: msg.speaker, token: msg.token, part: msg.part });
      break;
    case 'stream_end':
      if (msg.speaker === 'analyst') { onStreamEnd(msg.speaker); break; }
      if (_incomingGroup) {
        _incomingGroup.push({ type: 'stream_end', speaker: msg.speaker });
        _enqueueStreamGroup(_incomingGroup);
        _incomingGroup = null;
      }
      break;
    case 'turn_saved':
      onTurnSaved(msg.turn);
      break;
    case 'eval_complete':
      state.evaluations.push(msg.evaluation);
      showEvalCard(msg.evaluation);
      break;
    case 'timer_start':
      _enqueueAfterTTS(() => {
        if (msg.seconds > 0) {
          startTimer(msg.seconds);
        } else {
          // No time limit — just enable input, show infinity symbol.
          stopTimer();
          $('#timer-text').textContent = '∞';
          $('#timer-fill').style.width = '100%';
        }
        enableUserInput();
      });
      break;
    case 'audience_reveal_start':
      _enqueueAfterTTS(() => {
        stopTimer();
        if (msg.skipped) {
          // No audience configured — jump straight to the analysis prompt.
          showScreen('screen-reveal');
          $('#reveal-cards').innerHTML = '<p class="muted center" style="grid-column:1/-1;padding:32px 0">No audience configured for this session.</p>';
          $('#tally').innerHTML = '';
        } else {
          showScreen('screen-reveal');
        }
      });
      break;
    case 'audience_member_ready':
      state.audienceReactions.push(msg.reaction);
      addRevealCard(msg.reaction);
      break;
    case 'analysis_complete':
      // Already streamed in via stream_token
      finalizeReport(msg.report_markdown);
      break;
    case 'error':
      setStatus('Error: ' + msg.message);
      break;
  }
}

function setStatus(s) { $('#status-line').textContent = s; }

// ---------- Stream rendering ----------
function onStreamStart(speaker) {
  state.currentSpeaker = speaker;
  state.liveBuffers[speaker] = '';
  state.liveScratch[speaker] = '';

  if (speaker.startsWith('debater_')) {
    const card = document.querySelector(`.debater-card[data-speaker="${speaker}"]`);
    if (card) {
      $$('.debater-card').forEach((c) => c.classList.remove('speaking'));
      card.classList.add('speaking');
      card.querySelector('[data-role=body]').textContent = '';
      const scratchEl = card.querySelector('[data-role=scratch]');
      if (scratchEl) scratchEl.textContent = '';
    }
  }
  if (speaker === 'analyst') {
    showScreen('screen-report');
    $('#report-body').innerHTML = '';
  }
  setStatus(`${speakerLabel(speaker)} is speaking...`);
}

function onStreamToken(speaker, token, part) {
  // For debaters, the backend tags each token with part='scratch' or 'speech'.
  // Scratch goes to a separate panel and is never spoken; speech accumulates
  // into liveBuffers exactly like before so the existing TTS path is unchanged.
  if (speaker.startsWith('debater_') && part === 'scratch') {
    state.liveScratch[speaker] = (state.liveScratch[speaker] || '') + token;
    const card = document.querySelector(`.debater-card[data-speaker="${speaker}"]`);
    if (card) {
      const scratchEl = card.querySelector('[data-role=scratch]');
      if (scratchEl) {
        scratchEl.textContent = state.liveScratch[speaker];
        scratchEl.scrollTop = scratchEl.scrollHeight;
      }
    }
    return;
  }

  state.liveBuffers[speaker] = (state.liveBuffers[speaker] || '') + token;
  if (speaker.startsWith('debater_')) {
    const card = document.querySelector(`.debater-card[data-speaker="${speaker}"]`);
    if (card) {
      const body = card.querySelector('[data-role=body]');
      body.textContent = state.liveBuffers[speaker];
      body.scrollTop = body.scrollHeight;
    }
  } else if (speaker === 'analyst') {
    $('#report-body').innerHTML = renderMarkdown(state.liveBuffers[speaker]);
    $('#report-body').scrollTop = $('#report-body').scrollHeight;
  }
}

function onStreamEnd(speaker) {
  if (speaker.startsWith('debater_')) {
    const card = document.querySelector(`.debater-card[data-speaker="${speaker}"]`);
    if (card) card.classList.remove('speaking');
  }
  // Auto-speak everything except the analyst report.
  if (speaker !== 'analyst' && tts.mode !== 'off') {
    const text = state.liveBuffers[speaker] || '';
    showTTSControls(true, speaker);
    state.lastTTSPromise = speak(speaker, text).then(() => {
      showTTSControls(false);
    });
  } else {
    setStatus('');
  }
}

function showTTSControls(playing, speaker) {
  const skip = $('#tts-skip');
  if (!skip) return;
  if (playing) {
    skip.classList.remove('hidden');
    setStatus(`🔊 ${speakerLabel(speaker)} is speaking. Click skip or wait...`);
  } else {
    skip.classList.add('hidden');
    setStatus('');
  }
}

function onTurnSaved(turn) {
  state.turns.push(turn);
  appendTranscript(turn);
  // Update turn counter (count user turns)
  if (turn.speaker === 'user') {
    const cur = parseInt($('#turn-current').textContent) + 1;
    $('#turn-current').textContent = cur;
  }
}

function appendTranscript(turn) {
  const wrap = $('#transcript');
  const div = document.createElement('div');
  const cls = turn.speaker === 'user' ? 'user' : (turn.speaker === 'moderator' ? 'moderator' : 'debater');
  div.className = 'transcript-line ' + cls;
  div.innerHTML = `<span class="transcript-speaker">[${speakerLabel(turn.speaker)}]</span> ${escapeHtml(turn.content)}`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
}

// ---------- Timer ----------
function startTimer(seconds) {
  stopTimer();
  state.timerSecondsLeft = seconds;
  updateTimerUI(seconds, seconds);
  state.timer = setInterval(() => {
    state.timerSecondsLeft -= 1;
    if (state.timerSecondsLeft <= 0) {
      stopTimer();
      autoSubmit();
      return;
    }
    updateTimerUI(state.timerSecondsLeft, seconds);
  }, 1000);
}

function stopTimer() {
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
}

function updateTimerUI(left, total) {
  const m = Math.floor(left / 60);
  const s = left % 60;
  $('#timer-text').textContent = `${m}:${s.toString().padStart(2, '0')}`;
  const fill = $('#timer-fill');
  fill.style.width = `${(left / total) * 100}%`;
  fill.classList.toggle('low', left <= 10);
}

// ---------- User input ----------
function enableUserInput() {
  state.awaitingUser = true;
  // Clear any residue from the prior turn (post-stop recognition tail,
  // stale paste, etc.) so autoSubmit can't fire stale text on this turn.
  $('#user-input').value = '';
  $('#user-input').disabled = false;
  $('#user-input').focus();
  $('#submit-btn').disabled = false;
  $('#mic-btn').disabled = false;
  if (state.config.input_method === 'voice' && !state.recognizing && !state.recognitionDisabled) {
    startRecognition();
  }
}
function disableUserInput() {
  state.awaitingUser = false;
  $('#user-input').disabled = true;
  $('#submit-btn').disabled = true;
  $('#mic-btn').disabled = true;
  // Ensure no recording continues outside the user's turn. Live transcribe
  // requests must not fire while the AI is speaking — they waste API quota
  // and trigger rate-limit / 400 errors mid-session.
  if (state.recognizing) {
    try { stopRecognition(); } catch {}
  }
  // Clear the textbox so the previous turn's content never lingers visibly
  // while the AI is responding.
  $('#user-input').value = '';
}

async function submitUserTurn(content, inputMethod = 'text') {
  if (!state.awaitingUser) return;
  // If recording via the server-side path, await the final transcription
  // so we don't submit before the final transcript replaces the live one.
  if (state.recognizing && state.voiceMode === 'media_recorder') {
    await stopRecognitionAndWait();
    content = $('#user-input').value.trim() || content;
  } else if (state.recognizing) {
    stopRecognition();
  }
  stopTimer();
  disableUserInput();
  state.ws.send(JSON.stringify({ type: 'user_turn', content, input_method: inputMethod }));
  $('#user-input').value = '';
}

function stopRecognitionAndWait() {
  return new Promise((resolve) => {
    const mr = state.mediaRecorder;
    if (!mr || mr.state === 'inactive') { stopRecognition(); resolve(); return; }
    const original = mr.onstop;
    mr.onstop = async (ev) => {
      try { if (original) await original.call(mr, ev); } finally { resolve(); }
    };
    stopRecognition();
  });
}

function autoSubmit() {
  const text = $('#user-input').value.trim();
  submitUserTurn(text || '[No response - speaker yielded the floor]', state.recognizing ? 'voice' : 'text');
}

// ---------- Voice input ----------
// Two paths:
//   1) Browser Web Speech API (Chrome/Edge): live, free, browser-side.
//   2) MediaRecorder + server-side Whisper (Firefox/anyone else):
//      record blob, POST to /api/transcribe on release.
//
// We pick the first available path that actually works.

function detectVoiceMode() {
  const hasSR = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const hasMR = !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  if (hasSR) return 'speech_recognition';
  if (hasMR && state.transcriptionAvailable) return 'media_recorder';
  return null;
}

function disableMic(reason) {
  state.recognitionDisabled = true;
  const mic = $('#mic-btn');
  mic.disabled = true;
  mic.style.opacity = 0.4;
  if (reason) {
    mic.title = reason;
    setStatus(reason);
  }
}

// --- Path 1: Web Speech API ---
function setupSpeech() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.continuous = true;
  r.interimResults = true;
  r.lang = 'en-US';
  let finalText = '';
  r.onresult = (e) => {
    // Web Speech API's stop() is async: after we've already submitted the turn
    // and called stopRecognition(), Chrome may still fire one final onresult
    // with the rest of the buffered audio. If we honor that write, it lands in
    // the input field and gets re-submitted by autoSubmit on the next turn's
    // timer expiry. Gate on state.recognizing so post-stop tails are dropped.
    if (!state.recognizing) return;
    let interim = '';
    finalText = '';
    for (let i = 0; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t + ' ';
      else interim += t;
    }
    $('#user-input').value = (finalText + interim).trim();
  };
  r.onerror = (e) => {
    if (e.error === 'network') {
      // Brave/Firefox-with-extension case: try the server fallback if available.
      if (state.transcriptionAvailable && window.MediaRecorder) {
        setStatus('Browser speech blocked, switching to server transcription.');
        state.voiceMode = 'media_recorder';
      } else {
        disableMic('Voice input unavailable: browser blocked Google speech servers. Use Chrome, or have the host set OPENAI_API_KEY (or GROQ_API_KEY) for server transcription.');
      }
    } else if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      disableMic('Microphone permission denied. Use the text input instead.');
    } else if (e.error === 'no-speech') {
      setStatus('No speech detected.');
    } else if (e.error !== 'aborted') {
      setStatus('Voice error: ' + e.error);
    }
    state.recognizing = false;
    $('#mic-btn').classList.remove('recording');
  };
  r.onend = () => {
    state.recognizing = false;
    $('#mic-btn').classList.remove('recording');
  };
  return r;
}

// --- Path 2: MediaRecorder + server-side Whisper, with progressive live updates ---
//
// While recording we send the cumulative audio buffer to /api/transcribe every
// LIVE_INTERVAL_MS so the user sees their transcript updating in near-real-time.
// Each interval cancels any in-flight earlier request, and the latest result
// replaces the live portion of the input. On stop, one final transcription
// runs against the complete audio for highest accuracy.

const LIVE_INTERVAL_MS = 2000;

async function startMediaRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.recordingStream = stream;
    state.recordingChunks = [];
    state.preRecordingText = $('#user-input').value.trim();

    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    const mime = candidates.find((m) => window.MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '';
    const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    state.mediaRecorder = mr;
    state.recordingMime = mr.mimeType || mime || 'audio/webm';

    mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) state.recordingChunks.push(e.data); };
    mr.onstop = async () => {
      stopLiveTranscribeLoop();
      try { stream.getTracks().forEach((t) => t.stop()); } catch {}
      state.recordingStream = null;
      const blob = new Blob(state.recordingChunks, { type: state.recordingMime });
      state.recordingChunks = [];
      if (blob.size === 0) { setStatus(''); $('#mic-btn').disabled = false; return; }
      await runFinalTranscription(blob);
    };
    // 1-second timeslice so we get incremental ondataavailable callbacks.
    mr.start(1000);
    state.recognizing = true;
    $('#mic-btn').classList.add('recording');
    setStatus('🎙️ Recording...');

    startLiveTranscribeLoop();
  } catch (err) {
    if (err && err.name === 'NotAllowedError') {
      disableMic('Microphone permission denied.');
    } else {
      setStatus('Mic unavailable: ' + (err && err.message || err));
    }
  }
}

function stopMediaRecording() {
  state.recognizing = false;
  $('#mic-btn').classList.remove('recording');
  stopLiveTranscribeLoop();
  const mr = state.mediaRecorder;
  if (mr && mr.state !== 'inactive') {
    try { mr.stop(); } catch {}
  }
  if (state.recordingStream) {
    try { state.recordingStream.getTracks().forEach((t) => t.stop()); } catch {}
    state.recordingStream = null;
  }
}

function startLiveTranscribeLoop() {
  stopLiveTranscribeLoop();
  let inFlight = false;
  state.liveTranscribeTimer = setInterval(async () => {
    if (inFlight) return;
    if (!state.recognizing) return;   // guard against late ticks after stop
    if (state.recordingChunks.length < 2) return;   // need at least header + 1 cluster

    // Approximate total size; skip until we have a non-trivial buffer so the
    // server transcriber doesn't reject a near-empty webm fragment.
    let totalBytes = 0;
    for (const c of state.recordingChunks) totalBytes += c.size;
    if (totalBytes < 4096) return;

    inFlight = true;

    // Abort any earlier still-pending request.
    if (state.liveTranscribeAbort) { try { state.liveTranscribeAbort.abort(); } catch {} }
    const ac = new AbortController();
    state.liveTranscribeAbort = ac;

    try {
      const blob = new Blob(state.recordingChunks.slice(), { type: state.recordingMime });
      const transcript = await postTranscribe(blob, ac.signal);
      // Only apply if we are still the latest in-flight request and still recording.
      if (state.liveTranscribeAbort === ac && state.recognizing && transcript) {
        applyLiveTranscript(transcript);
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        // Soft-fail live updates; the final transcription still runs on stop.
      }
    } finally {
      inFlight = false;
    }
  }, LIVE_INTERVAL_MS);
}

function stopLiveTranscribeLoop() {
  if (state.liveTranscribeTimer) clearInterval(state.liveTranscribeTimer);
  state.liveTranscribeTimer = null;
  if (state.liveTranscribeAbort) { try { state.liveTranscribeAbort.abort(); } catch {} }
  state.liveTranscribeAbort = null;
}

function applyLiveTranscript(transcript) {
  // Refuse to write into the textbox if it's no longer the user's turn.
  // A live-transcribe or final-transcribe response can resolve after the
  // user has already submitted, and writing here would leave stale content
  // visible while the AI is responding.
  if (!state.awaitingUser) return;
  const pre = state.preRecordingText;
  $('#user-input').value = pre ? pre + ' ' + transcript : transcript;
}

async function runFinalTranscription(blob) {
  setStatus('Finalizing transcript...');
  $('#mic-btn').disabled = true;
  try {
    const transcript = await postTranscribe(blob);
    if (transcript) applyLiveTranscript(transcript);
    setStatus('');
  } catch (e) {
    setStatus('Transcription error: ' + e.message);
  } finally {
    $('#mic-btn').disabled = false;
  }
}

async function postTranscribe(blob, signal) {
  const ext = blob.type.includes('webm') ? 'webm'
            : blob.type.includes('ogg')  ? 'ogg'
            : blob.type.includes('mp4')  ? 'm4a'
            : 'webm';
  const fd = new FormData();
  fd.append('audio', blob, `recording.${ext}`);
  const r = await fetch('/api/transcribe', { method: 'POST', body: fd, signal });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error(err.detail || r.status);
  }
  const { transcript } = await r.json();
  return (transcript || '').trim();
}

// --- Unified entry points used by the mic button handlers ---
async function startRecognition() {
  if (state.recognitionDisabled) return;
  if (!state.voiceMode) state.voiceMode = detectVoiceMode();
  // If we still don't have a mode, the config may not have loaded yet
  // (or finished before the user clicked). Refetch and re-detect once.
  if (!state.voiceMode) {
    setStatus('Checking voice availability...');
    await loadServerConfig();
    state.voiceMode = detectVoiceMode();
  }
  if (!state.voiceMode) {
    setStatus(
      'Voice unavailable: this browser has no SpeechRecognition and the server has no transcription provider. ' +
      'Hosts: set OPENAI_API_KEY or GROQ_API_KEY and redeploy.'
    );
    return;
  }
  if (state.voiceMode === 'speech_recognition') {
    if (!state.recognition) state.recognition = setupSpeech();
    if (!state.recognition) { disableMic('Voice not supported in this browser.'); return; }
    state.recognizing = true;
    $('#mic-btn').classList.add('recording');
    try { state.recognition.start(); } catch {}
  } else if (state.voiceMode === 'media_recorder') {
    startMediaRecording();
  }
}

function stopRecognition() {
  if (state.voiceMode === 'speech_recognition') {
    if (state.recognition) try { state.recognition.stop(); } catch {}
    state.recognizing = false;
    $('#mic-btn').classList.remove('recording');
  } else if (state.voiceMode === 'media_recorder') {
    stopMediaRecording();
  }
}

// ---------- Evaluator card ----------
function showEvalCard(ev) {
  const card = $('#eval-card');
  card.classList.remove('hidden');
  $('#eval-turn').textContent = `— Turn ${parseInt($('#turn-current').textContent)}`;
  $('#score-structure').textContent = ev.structure_score;
  $('#score-logic').textContent = ev.logic_score;
  $('#score-rhetoric').textContent = ev.rhetoric_score;
  setTimeout(() => {
    $('#bar-structure').style.width = `${ev.structure_score * 10}%`;
    $('#bar-logic').style.width = `${ev.logic_score * 10}%`;
    $('#bar-rhetoric').style.width = `${ev.rhetoric_score * 10}%`;
  }, 50);
  $('#eval-highlight').textContent = ev.highlight;
  $('#eval-blindspot').textContent = ev.blind_spot;
  $('#eval-tip').textContent = ev.tip;
  $('#eval-flair').textContent = `"${ev.flair_moment}"`;

  // Auto-dismiss after 12s
  clearTimeout(state.evalDismiss);
  state.evalDismiss = setTimeout(dismissEval, 12000);
}

function dismissEval() {
  $('#eval-card').classList.add('hidden');
  // Reset bars for next time
  $('#bar-structure').style.width = '0';
  $('#bar-logic').style.width = '0';
  $('#bar-rhetoric').style.width = '0';
}

// ---------- Reveal screen ----------
function addRevealCard(reaction) {
  const wrap = $('#reveal-cards');
  const div = document.createElement('div');
  div.className = 'reveal-card';
  const personaDesc = AUDIENCE[reaction.persona_id]?.desc || '';
  div.innerHTML = `
    <div class="rc-name">${escapeHtml(reaction.name)}</div>
    <div class="rc-persona">${escapeHtml(personaDesc)}</div>
    <div class="rc-verdict"></div>
    <div class="rc-vote ${reaction.vote}">${reaction.vote.toUpperCase()}</div>
  `;
  wrap.appendChild(div);
  setTimeout(() => div.classList.add('show'), wrap.children.length * 600);
  // Typewriter the verdict monologue. Fall back to older fields if backend
  // hasn't been redeployed yet.
  const msg = reaction.verdict
    || reaction.message_to_speaker
    || reaction.vote_reasoning
    || reaction.what_won_you_over
    || reaction.first_impression
    || '';
  setTimeout(() => typewriter(div.querySelector('.rc-verdict'), msg), wrap.children.length * 600 + 400);

  updateTally();
}

function updateTally() {
  const cards = $$('.reveal-card');
  let pro = 0, con = 0, undec = 0;
  cards.forEach((c) => {
    const v = c.querySelector('.rc-vote').textContent.toLowerCase();
    if (v === 'pro') pro++;
    else if (v === 'con') con++;
    else undec++;
  });
  $('#tally').innerHTML = `
    <div>FOR <b>${pro}</b></div>
    <div>AGAINST <b>${con}</b></div>
    <div>UNDECIDED <b>${undec}</b></div>
  `;
}

function typewriter(el, text) {
  // Reveal in chunks so a long monologue lands in ~2-3 seconds total,
  // not a tedious 7+ second single-char crawl.
  let i = 0;
  el.textContent = '';
  const total = text.length;
  const step = Math.max(2, Math.ceil(total / 120));
  const interval = setInterval(() => {
    i += step;
    el.textContent = text.slice(0, i);
    if (i >= total) { el.textContent = text; clearInterval(interval); }
  }, 22);
}

// ---------- Markdown rendering (lightweight) ----------
function renderMarkdown(md) {
  if (!md) return '';
  const escape = (s) => s.replace(/[&<>]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;'}[c]));
  let html = escape(md);

  // Tables
  html = html.replace(/((?:^\|.*\|\n)+)/gm, (block) => {
    const lines = block.trim().split('\n');
    if (lines.length < 2) return block;
    const header = lines[0].split('|').slice(1, -1).map(s => s.trim());
    const rows = lines.slice(2).map(line => line.split('|').slice(1, -1).map(s => s.trim()));
    const thead = `<tr>${header.map(h => `<th>${h}</th>`).join('')}</tr>`;
    const tbody = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
    return `<table>${thead}${tbody}</table>`;
  });

  // Headings
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
  // Bold/italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Lists
  html = html.replace(/(?:^- .*(?:\n|$))+/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });
  html = html.replace(/(?:^\d+\. .*(?:\n|$))+/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\.\s*/, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });
  // Blockquotes
  html = html.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Paragraphs
  html = html.split(/\n{2,}/).map(block => {
    if (/^<(h\d|table|ul|ol|blockquote|pre)/.test(block.trim())) return block;
    return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  return html;
}

function finalizeReport(md) {
  $('#report-body').innerHTML = renderMarkdown(md);
}

function buildFullDebateMarkdown() {
  const cfg = state.config;
  const out = [];
  out.push(`# RhetoricArena debate log`);
  out.push('');
  out.push(`**Motion:** ${cfg.motion}`);
  out.push(`**Your position:** ${cfg.user_position}`);
  out.push(`**Difficulty:** ${cfg.difficulty}`);
  out.push(`**Time per turn:** ${cfg.time_per_turn_seconds === 0 ? 'unlimited' : cfg.time_per_turn_seconds + 's'}`);
  out.push(`**Max turns:** ${cfg.max_turns}`);
  out.push(`**Response length:** ${cfg.response_length}`);
  if (cfg.debater_count > 0) {
    const names = cfg.debater_personalities.map(pid => `${DEBATERS[pid]?.name || pid} (${pid})`).join(', ');
    out.push(`**Opponents:** ${names}`);
  } else {
    out.push(`**Opponents:** none (solo review)`);
  }
  if (cfg.audience_count > 0) {
    const names = cfg.audience_personas.map(pid => `${AUDIENCE[pid]?.name || pid} (${pid})`).join(', ');
    out.push(`**Audience:** ${names}`);
  } else {
    out.push(`**Audience:** none`);
  }
  out.push(`**Saved at:** ${new Date().toISOString()}`);
  out.push('');
  out.push('---');
  out.push('');
  out.push('## Transcript');
  out.push('');

  const evalByTurnId = {};
  for (const ev of state.evaluations) evalByTurnId[ev.turn_id] = ev;

  for (const t of state.turns) {
    out.push(`### Turn ${t.turn_number} — ${speakerLabel(t.speaker)}`);
    if (t.metadata) {
      const bits = [];
      if (t.metadata.input_method) bits.push(`input: ${t.metadata.input_method}`);
      if (t.metadata.word_count) bits.push(`${t.metadata.word_count} words`);
      if (bits.length) out.push(`*${bits.join(' · ')}*`);
    }
    out.push('');
    out.push(t.content || '');
    out.push('');
    const ev = evalByTurnId[t.id];
    if (ev) {
      out.push(`**Evaluator feedback** — structure ${ev.structure_score}/10 · logic ${ev.logic_score}/10 · rhetoric ${ev.rhetoric_score}/10`);
      if (ev.highlight)    out.push(`- Highlight: ${ev.highlight}`);
      if (ev.blind_spot)   out.push(`- Blind spot: ${ev.blind_spot}`);
      if (ev.tip)          out.push(`- Tip: ${ev.tip}`);
      if (ev.flair_moment) out.push(`- Flair: "${ev.flair_moment}"`);
      out.push('');
    }
  }

  if (state.audienceReactions.length) {
    out.push('---');
    out.push('');
    out.push('## Audience verdicts');
    out.push('');
    for (const r of state.audienceReactions) {
      out.push(`### ${r.name} — vote: ${r.vote.toUpperCase()}`);
      if (r.verdict) {
        out.push('');
        out.push(`> ${r.verdict.replace(/\n/g, '\n> ')}`);
        out.push('');
      }
      if (r.first_impression)    out.push(`- First impression: ${r.first_impression}`);
      if (r.turning_point)       out.push(`- Turning point: ${r.turning_point}`);
      if (r.what_won_you_over)   out.push(`- What won you over: ${r.what_won_you_over}`);
      if (r.vote_reasoning)      out.push(`- Vote reasoning: ${r.vote_reasoning}`);
      if (r.message_to_speaker)  out.push(`- Message to speaker: ${r.message_to_speaker}`);
      out.push('');
    }
  }

  const report = state.liveBuffers.analyst || '';
  if (report.trim()) {
    out.push('---');
    out.push('');
    out.push('## Post-debate analysis');
    out.push('');
    out.push(report);
    out.push('');
  }

  return out.join('\n');
}

// ---------- Buttons ----------
function bindButtons() {
  $('#submit-btn').addEventListener('click', () => {
    const text = $('#user-input').value.trim();
    if (!text) return;
    stopSpeaking();
    submitUserTurn(text, 'text');
  });

  $('#tts-skip').addEventListener('click', () => {
    stopSpeaking();
    showTTSControls(false);
  });

  $('#tts-toggle').addEventListener('click', cycleTTSMode);
  $('#tts-speed').addEventListener('click', cycleSpeed);

  $('#user-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      $('#submit-btn').click();
    }
  });

  $('#end-early').addEventListener('click', () => {
    if (!confirm('End the session early?')) return;
    state.ws.send(JSON.stringify({ type: 'end_session_early' }));
    disableUserInput();
    stopTimer();
  });

  $('#eval-close').addEventListener('click', dismissEval);
  $('#eval-continue').addEventListener('click', dismissEval);

  $('#view-analysis').addEventListener('click', () => {
    state.ws.send(JSON.stringify({ type: 'request_analysis' }));
    showScreen('screen-report');
    $('#report-body').innerHTML = '<p class="muted">Generating analysis...</p>';
  });

  $('#new-session').addEventListener('click', () => {
    stopSpeaking();
    location.reload();
  });

  $('#save-report').addEventListener('click', () => {
    const md = buildFullDebateMarkdown();
    const slug = state.config.motion.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rhetoric-arena-${date}-${slug}.md`;
    a.click();
  });

  // Mic: click to toggle on/off.
  const mic = $('#mic-btn');
  mic.addEventListener('click', () => {
    if (state.recognizing) stopRecognition();
    else startRecognition();
  });
}

// ---------- Init ----------
document.body.style.overflow = 'auto';  // config screen: let window scroll
disableUserInput();
initConfig();
bindButtons();
applyTTSMode();
applySpeedUI();
loadServerConfig().then(() => {
  validate();
  applyTTSMode();
});
