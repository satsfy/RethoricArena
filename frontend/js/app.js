// RhetoricArena single-file frontend controller.

// ---------- Persona metadata mirrored from backend ----------
const DEBATERS = {
  rigorous: { name: 'The Academic', desc: 'Cites studies, demands definitions, surgical precision.' },
  populist: { name: 'The Firebrand', desc: 'Emotional appeals, vivid language, rhetorical heat.' },
  socratic: { name: 'The Questioner', desc: 'Only questions. Each one is a trap.' },
  pragmatist: { name: 'The Realist', desc: '"That sounds nice in theory, but in practice..."' },
  devil: { name: 'The Contrarian', desc: 'Hunts the buried assumption in everything.' },
};
const AUDIENCE = {
  academic: { name: 'Prof. Chen', desc: 'Logical rigor and evidence.' },
  undecided_voter: { name: 'Maya', desc: 'Emotionally driven, narrative-led.' },
  policy_wonk: { name: 'Dmitri', desc: 'Policy feasibility, specifics.' },
  skeptic: { name: 'Ren', desc: 'Hostile by default. Win them over.' },
  rhetorician: { name: 'Isabella', desc: 'Pure rhetorical craft.' },
};

// ---------- State ----------
const state = {
  config: {
    motion: '',
    user_position: 'against',
    difficulty: 'standard',
    time_per_turn_seconds: 60,
    max_turns: 6,
    debater_count: 2,
    debater_personalities: ['rigorous', 'socratic'],
    audience_count: 3,
    audience_personas: ['academic', 'undecided_voter', 'policy_wonk'],
    input_method: 'text',
  },
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
  liveBuffers: {},   // speaker -> string
  timer: null,
  timerSecondsLeft: 0,
  awaitingUser: false,
  recognizing: false,
  recognition: null,
  recognitionDisabled: false,
  evalQueue: [],
  lastTTSPromise: Promise.resolve(),
};

// ---------- TTS (server OpenAI, browser SpeechSynthesis, off) ----------
// Three modes, cycled by the TTS button. Server TTS sounds great but has 1-3s
// of latency before audio starts; native is instant but voices are mediocre
// (especially on Firefox). Mode persists in localStorage.
const TTS_STORAGE = 'rhetoricarena.tts_mode';
const tts = {
  mode: localStorage.getItem(TTS_STORAGE) || 'server',  // 'server' | 'browser' | 'off'
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

function pickVoice(speakerId) {
  if (tts.voiceMap[speakerId]) return tts.voiceMap[speakerId];
  const en = tts.voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
  if (!en.length) return null;
  // Prefer non-default, varied voices. Hash speaker id to index.
  let h = 0;
  for (const c of speakerId) h = (h * 31 + c.charCodeAt(0)) | 0;
  const v = en[Math.abs(h) % en.length];
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
  const modes = state.ttsAvailable ? ['server', 'browser', 'off'] : ['browser', 'off'];
  const i = modes.indexOf(tts.mode);
  tts.mode = modes[(i + 1) % modes.length];
  stopSpeaking();
  applyTTSMode();
}

function speakViaBrowser(speakerId, text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    try { speechSynthesis.cancel(); } catch {}
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(speakerId);
    if (v) u.voice = v;
    u.rate = 1.05;
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
      validate();
    });
  });

  $('#cfg-motion').addEventListener('input', (e) => {
    state.config.motion = e.target.value.trim();
    validate();
  });

  const turnsSlider = $('#cfg-max-turns');
  turnsSlider.addEventListener('input', (e) => {
    state.config.max_turns = parseInt(e.target.value);
    $('#max-turns-label').textContent = e.target.value;
  });

  renderDebaterSlots();
  renderAudienceSlots();
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
  if (state.config.debater_count === 0) {
    cards.innerHTML = '<p class="muted" style="padding:12px 0;font-size:13px">No opponents — solo review mode.</p>';
  } else {
    state.config.debater_personalities.forEach((pid) => {
      const p = DEBATERS[pid];
      const div = document.createElement('div');
      div.className = 'debater-card';
      div.dataset.speaker = `debater_${pid}`;
      div.innerHTML = `
        <div class="name">${p.name}</div>
        <div class="bar"></div>
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

function handleMessage(msg) {
  switch (msg.type) {
    case 'session_ready':
      setStatus('Session ready.');
      break;
    case 'stream_start':
      onStreamStart(msg.speaker);
      break;
    case 'stream_token':
      onStreamToken(msg.speaker, msg.token);
      break;
    case 'stream_end':
      onStreamEnd(msg.speaker);
      break;
    case 'turn_saved':
      onTurnSaved(msg.turn);
      break;
    case 'eval_complete':
      showEvalCard(msg.evaluation);
      break;
    case 'timer_start':
      state.lastTTSPromise.then(() => {
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
      state.lastTTSPromise.then(() => {
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

  if (speaker.startsWith('debater_')) {
    const card = document.querySelector(`.debater-card[data-speaker="${speaker}"]`);
    if (card) {
      $$('.debater-card').forEach((c) => c.classList.remove('speaking'));
      card.classList.add('speaking');
      card.querySelector('[data-role=body]').textContent = '';
    }
  }
  if (speaker === 'analyst') {
    showScreen('screen-report');
    $('#report-body').innerHTML = '';
  }
  setStatus(`${speakerLabel(speaker)} is speaking...`);
}

function onStreamToken(speaker, token) {
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
  if (speaker !== 'analyst' && tts.enabled) {
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
  $('#user-input').disabled = false;
  $('#user-input').focus();
  $('#submit-btn').disabled = false;
  $('#mic-btn').disabled = false;
}
function disableUserInput() {
  state.awaitingUser = false;
  $('#user-input').disabled = true;
  $('#submit-btn').disabled = true;
  $('#mic-btn').disabled = true;
}

function submitUserTurn(content, inputMethod = 'text') {
  if (!state.awaitingUser) return;
  if (state.recognizing) stopRecognition();
  stopTimer();
  disableUserInput();
  state.ws.send(JSON.stringify({ type: 'user_turn', content, input_method: inputMethod }));
  $('#user-input').value = '';
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

const LIVE_INTERVAL_MS = 1800;

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
    if (!state.recordingChunks.length) return;
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
  const personaName = AUDIENCE[reaction.persona_id]?.name || reaction.name;
  const personaDesc = AUDIENCE[reaction.persona_id]?.desc || '';
  div.innerHTML = `
    <div class="rc-name">${reaction.name}</div>
    <div class="rc-persona">${personaDesc}</div>
    <div class="rc-quote"></div>
    <div class="rc-vote ${reaction.vote}">${reaction.vote.toUpperCase()}</div>
  `;
  wrap.appendChild(div);
  setTimeout(() => div.classList.add('show'), wrap.children.length * 600);
  // Typewriter for the message
  const msg = reaction.message_to_speaker || reaction.what_won_you_over || reaction.first_impression;
  setTimeout(() => typewriter(div.querySelector('.rc-quote'), msg), wrap.children.length * 600 + 400);

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
  let i = 0;
  el.textContent = '';
  const interval = setInterval(() => {
    el.textContent += text[i] || '';
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 18);
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
    const md = state.liveBuffers.analyst || '';
    const slug = state.config.motion.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rhetoric-arena-${date}-${slug}.md`;
    a.click();
  });

  // Mic press-and-hold OR toggle
  const mic = $('#mic-btn');
  mic.addEventListener('mousedown', () => { if (!state.recognizing) startRecognition(); });
  mic.addEventListener('mouseup', () => { if (state.recognizing) stopRecognition(); });
  mic.addEventListener('mouseleave', () => { if (state.recognizing) stopRecognition(); });
  mic.addEventListener('click', (e) => { e.preventDefault(); }); // prevent toggle behavior conflicts
}

// ---------- Init ----------
disableUserInput();
initConfig();
bindButtons();
loadServerConfig().then(() => {
  validate();
  applyTTSMode();
});
