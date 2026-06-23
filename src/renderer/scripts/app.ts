import { commandCategories, DEFAULT_WAKE_WORDS } from './commands';
import { IPC } from '../../shared/types';
import type { SystemStats, AIStats } from '../../shared/types';

// DOM Elements
const $ = (id: string) => document.getElementById(id)!;

const elements = {
  startBtn: $('startBtn'),
  voiceActivationBtn: $('voiceActivationBtn'),
  minimizeBtn: $('minimizeBtn'),
  orbBtn: $('orbBtn'),
  stealthBtn: $('stealthBtn'),
  widgetBtn: $('widgetBtn'),
  floatingBtn: $('floatingBtn'),
  status: $('status'),
  avatar: $('avatar'),
  avatarCore: $('avatarCore'),
  thinkingRings: $('thinkingRings'),
  voiceStatus: $('voiceStatus'),
  mainContainer: $('mainContainer'),
  transcript: $('transcript'),
  commandsToggle: $('commandsToggle'),
  commandsList: $('commandsList'),
  toggleIcon: $('toggleIcon'),
  voiceVisualizer: $('voiceVisualizer'),
  waves: document.querySelectorAll('.wave-animation'),
  vizBars: document.querySelectorAll('.viz-bar'),
};

// State
let recognition: SpeechRecognition | null = null;
let isListening = false;
let voiceActivationEnabled = false;
let wakeWords = [...DEFAULT_WAKE_WORDS];
let synthUtterance: SpeechSynthesisUtterance | null = null;
let vizAnimationId: number | null = null;

// ─── Speech Recognition ───────────────────────────────────────────

function initSpeechRecognition(): void {
  const SpeechRecognition = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    elements.status.textContent = '❌ SPEECH NOT SUPPORTED';
    elements.startBtn.setAttribute('disabled', 'true');
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let restartAttempts = 0;

  recognition.onstart = () => {
    isListening = true;
    restartAttempts = 0;
    updateListeningUI(true);
  };

  recognition.onresult = (event) => {
    const last = event.results.length - 1;
    const transcript = event.results[last][0].transcript.toLowerCase().trim();

    if (event.results[last].isFinal) {
      if (voiceActivationEnabled) {
        const hasWakeWord = wakeWords.some((w) => transcript.includes(w));
        if (hasWakeWord) {
          let cmd = transcript;
          wakeWords.forEach((w) => { cmd = cmd.replace(w, '').trim(); });
          if (cmd) {
            addToTranscript('user', cmd);
            handleCommand(cmd);
          } else {
            speak('Yes, sir?');
          }
        }
      } else {
        addToTranscript('user', transcript);
        handleCommand(transcript);
      }
    } else if (!voiceActivationEnabled) {
      elements.status.textContent = `🎤 "${transcript.substring(0, 30)}..."`;
      animateVisualizer();
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'audio-capture') {
      elements.status.textContent = '❌ MIC ERROR';
      stopListening();
    } else if (event.error === 'not-allowed') {
      elements.status.textContent = '❌ MIC DENIED';
      stopListening();
    } else if (event.error === 'aborted' && isListening && restartAttempts < 3) {
      setTimeout(() => { try { recognition?.start(); restartAttempts++; } catch { /* */ } }, 200);
    }
  };

  recognition.onend = () => {
    if (isListening) {
      setTimeout(() => { try { recognition?.start(); } catch { updateListeningUI(false); } }, 100);
    } else {
      updateListeningUI(false);
    }
  };

  elements.status.textContent = '✓ JARVIS READY';
}

function updateListeningUI(listening: boolean): void {
  if (listening) {
    elements.avatar.classList.add('listening');
    elements.waves.forEach((w) => w.classList.add('active'));
    elements.voiceVisualizer.classList.add('active');
    elements.status.textContent = voiceActivationEnabled ? '🎯 SAY "HEY JARVIS"' : '🎤 LISTENING...';
    startVisualizerAnimation();
  } else {
    elements.avatar.classList.remove('listening');
    elements.waves.forEach((w) => w.classList.remove('active'));
    elements.voiceVisualizer.classList.remove('active');
    elements.status.textContent = '⏸️ STANDBY';
    stopVisualizerAnimation();
  }
}

function startListening(): void {
  if (!recognition) return;
  try {
    recognition.start();
    elements.startBtn.innerHTML = '<span>⏹</span> <span>Stop</span>';
    elements.startBtn.onclick = () => stopListening();
  } catch {
    updateListeningUI(true);
  }
}

function stopListening(): void {
  isListening = false;
  recognition?.stop();
  updateListeningUI(false);
  elements.startBtn.innerHTML = '<span>▶</span> <span>Activate</span>';
  elements.startBtn.onclick = () => startListening();
}

function toggleVoiceActivation(): void {
  voiceActivationEnabled = !voiceActivationEnabled;
  const span = elements.voiceStatus.querySelector('span')!;

  if (voiceActivationEnabled) {
    elements.voiceActivationBtn.innerHTML = '<span>🎯</span> <span>ON</span>';
    elements.voiceStatus.classList.add('active');
    span.textContent = 'Voice: ON';
    if (!isListening) startListening();
    speak('Voice activation enabled, sir.');
  } else {
    elements.voiceActivationBtn.innerHTML = '<span>🎯</span> <span>Voice</span>';
    elements.voiceStatus.classList.remove('active');
    span.textContent = 'Voice: OFF';
  }
}

// ─── Speech Synthesis ─────────────────────────────────────────────

function speak(text: string): void {
  window.speechSynthesis.cancel();
  synthUtterance = new SpeechSynthesisUtterance(text);
  synthUtterance.rate = 1.0;
  synthUtterance.pitch = 1.0;

  synthUtterance.onstart = () => {
    elements.status.textContent = '🔊 SPEAKING...';
    elements.avatar.classList.add('thinking');
    elements.thinkingRings.classList.add('active');
  };

  synthUtterance.onend = () => {
    elements.avatar.classList.remove('thinking');
    elements.thinkingRings.classList.remove('active');
    if (isListening) {
      elements.status.textContent = voiceActivationEnabled ? '🎯 SAY "HEY JARVIS"' : '🎤 LISTENING...';
    }
  };

  window.speechSynthesis.speak(synthUtterance);
}

// ─── Command Processing ───────────────────────────────────────────

async function handleCommand(command: string): Promise<void> {
  elements.avatar.classList.add('thinking');
  elements.thinkingRings.classList.add('active');
  elements.status.textContent = '🤖 PROCESSING...';

  try {
    const result = await window.jarvis.command.process(command);
    if (result.response) {
      addToTranscript('assistant', result.response);
      speak(result.response);
    }
  } catch {
    addToTranscript('assistant', 'Technical difficulties, sir.');
    speak('Technical difficulties, sir.');
  } finally {
    elements.avatar.classList.remove('thinking');
    elements.thinkingRings.classList.remove('active');
  }
}

function addToTranscript(role: 'user' | 'assistant', text: string): void {
  const placeholder = elements.transcript.querySelector('.transcript-placeholder');
  if (placeholder) placeholder.remove();

  const item = document.createElement('div');
  item.className = 'transcript-item';
  item.innerHTML = `
    <div class="transcript-label ${role}">${role === 'user' ? '> USER' : '> JARVIS'}</div>
    <div class="transcript-text">${escapeHtml(text)}</div>
  `;
  elements.transcript.appendChild(item);
  elements.transcript.scrollTop = elements.transcript.scrollHeight;

  const items = elements.transcript.querySelectorAll('.transcript-item');
  if (items.length > 15) items[0].remove();
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── Visual Effects ───────────────────────────────────────────────

function initParticles(): void {
  const canvas = document.getElementById('particleCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    });
  }

  function draw(): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 255, ${p.alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

function startVisualizerAnimation(): void {
  function animate(): void {
    elements.vizBars.forEach((bar) => {
      const h = Math.random() * 20 + 4;
      (bar as HTMLElement).style.height = `${h}px`;
    });
    vizAnimationId = requestAnimationFrame(animate);
  }
  animate();
}

function stopVisualizerAnimation(): void {
  if (vizAnimationId) cancelAnimationFrame(vizAnimationId);
  elements.vizBars.forEach((bar) => { (bar as HTMLElement).style.height = '4px'; });
}

function animateVisualizer(): void {
  elements.vizBars.forEach((bar) => {
    (bar as HTMLElement).style.height = `${Math.random() * 16 + 4}px`;
  });
}

// ─── Dashboard ────────────────────────────────────────────────────

function initDashboard(): void {
  window.jarvis.on(IPC.EVENT_SYSTEM_STATS, (stats: unknown) => {
    updateDashboard(stats as SystemStats);
  });

  window.jarvis.on(IPC.EVENT_AI_STATUS, (stats: unknown) => {
    updateAIStats(stats as AIStats);
  });
}

function updateDashboard(stats: SystemStats): void {
  const cpu = $('dashCPU');
  const ram = $('dashRAM');
  const disk = $('dashDisk');

  if (cpu) cpu.textContent = `${stats.cpu.usage}%`;
  if (ram) ram.textContent = `${stats.memory.percent}%`;
  if (disk) disk.textContent = `${stats.disk.percent}%`;

  const cpuBar = $('dashCPUBar');
  const ramBar = $('dashRAMBar');
  const diskBar = $('dashDiskBar');
  if (cpuBar) cpuBar.style.width = `${stats.cpu.usage}%`;
  if (ramBar) ramBar.style.width = `${stats.memory.percent}%`;
  if (diskBar) diskBar.style.width = `${stats.disk.percent}%`;

  const battery = $('dashBattery');
  if (battery) {
    battery.textContent = stats.battery
      ? `${stats.battery.percent}%${stats.battery.charging ? ' ⚡' : ''}`
      : 'N/A';
  }

  const network = $('dashNetwork');
  if (network) network.textContent = stats.network.online ? 'Online' : 'Offline';

  const processList = $('processList');
  if (processList && stats.processes.length > 0) {
    processList.innerHTML = stats.processes.map((p) =>
      `<div class="process-item"><span>${escapeHtml(p.name)}</span><span>${p.cpu.toFixed(1)}%</span></div>`
    ).join('');
  }
}

function updateAIStats(stats: AIStats): void {
  const provider = $('dashAIProvider');
  const model = $('dashAIModel');
  const status = $('dashAIStatus');
  const response = $('dashAIResponse');

  if (provider) provider.textContent = stats.provider;
  if (model) model.textContent = stats.model;
  if (status) {
    status.textContent = stats.status.charAt(0).toUpperCase() + stats.status.slice(1);
    status.className = `status-badge ${stats.status}`;
  }
  if (response) response.textContent = stats.lastResponseMs ? `${stats.lastResponseMs}ms` : '—';
}

function updateAssistantDashboard(): void {
  const listening = $('dashListening');
  const wakeWord = $('dashWakeWord');
  const voice = $('dashVoice');

  if (listening) {
    listening.textContent = isListening ? 'On' : 'Off';
    listening.className = `status-badge ${isListening ? 'active' : ''}`;
  }
  if (wakeWord) {
    wakeWord.textContent = voiceActivationEnabled ? 'On' : 'Off';
    wakeWord.className = `status-badge ${voiceActivationEnabled ? 'active' : ''}`;
  }
  if (voice) {
    voice.textContent = voiceActivationEnabled ? 'On' : 'Off';
    voice.className = `status-badge ${voiceActivationEnabled ? 'active' : ''}`;
  }

  window.jarvis.workflow.getAll().then((workflows) => {
    const auto = $('dashAutomations');
    if (auto) auto.textContent = String(workflows.filter((w) => w.enabled).length);
  });
}

// ─── Settings ─────────────────────────────────────────────────────

async function loadSettings(): Promise<void> {
  try {
    const aiSettings = await window.jarvis.ai.getSettings();
    const voiceSettings = await window.jarvis.voice.getSettings();
    const appSettings = await window.jarvis.settings.get();

    const provider = document.getElementById('settingsProvider') as HTMLSelectElement;
    const model = document.getElementById('settingsModel') as HTMLInputElement;
    if (provider) provider.value = aiSettings.activeProvider;
    if (model) model.value = aiSettings.activeModel;

    const taskMap = aiSettings.taskModelMap;
    const setVal = (id: string, val?: string) => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (el && val) el.value = val;
    };
    setVal('modelReasoning', taskMap.reasoning);
    setVal('modelCoding', taskMap.coding);
    setVal('modelResearch', taskMap.research);
    setVal('modelAutomation', taskMap.automation);

    const voiceEnabled = document.getElementById('voiceEnabled') as HTMLInputElement;
    const voiceMode = document.getElementById('voiceMode') as HTMLSelectElement;
    const wakeWordsInput = document.getElementById('wakeWords') as HTMLInputElement;
    if (voiceEnabled) voiceEnabled.checked = voiceSettings.enabled;
    if (voiceMode) voiceMode.value = voiceSettings.mode;
    if (wakeWordsInput) wakeWordsInput.value = voiceSettings.wakeWords.join(', ');
    wakeWords = voiceSettings.wakeWords;

    const theme = document.getElementById('settingsTheme') as HTMLSelectElement;
    if (theme) theme.value = appSettings.theme;
    applyTheme(appSettings.theme);

    loadPlugins();
  } catch { /* settings not available yet */ }
}

async function saveAISettings(): Promise<void> {
  const provider = (document.getElementById('settingsProvider') as HTMLSelectElement).value;
  const apiKey = (document.getElementById('settingsApiKey') as HTMLInputElement).value;
  const model = (document.getElementById('settingsModel') as HTMLInputElement).value;

  await window.jarvis.ai.saveSettings({
    activeProvider: provider as import('../../shared/types').AIProvider,
    activeModel: model,
    apiKeys: { [provider]: apiKey },
    taskModelMap: {
      reasoning: (document.getElementById('modelReasoning') as HTMLInputElement).value,
      coding: (document.getElementById('modelCoding') as HTMLInputElement).value,
      research: (document.getElementById('modelResearch') as HTMLInputElement).value,
      automation: (document.getElementById('modelAutomation') as HTMLInputElement).value,
    },
  });
  speak('AI settings saved, sir.');
}

async function saveVoiceSettings(): Promise<void> {
  const wakeWordsStr = (document.getElementById('wakeWords') as HTMLInputElement).value;
  wakeWords = wakeWordsStr.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);

  await window.jarvis.voice.saveSettings({
    enabled: (document.getElementById('voiceEnabled') as HTMLInputElement).checked,
    mode: (document.getElementById('voiceMode') as HTMLSelectElement).value as import('../../shared/types').VoiceMode,
    wakeWords,
  });
  speak('Voice settings saved, sir.');
}

function applyTheme(theme: string): void {
  document.body.className = document.body.className.replace(/theme-\w+/g, '');
  if (theme !== 'jarvis') document.body.classList.add(`theme-${theme}`);
}

async function loadPlugins(): Promise<void> {
  const list = document.getElementById('pluginList');
  if (!list) return;
  const plugins = await window.jarvis.plugin.getAll();
  list.innerHTML = plugins.map((p) => `
    <div class="plugin-item">
      <span>${escapeHtml(p.name)} v${p.version}</span>
      <button class="btn" style="padding:4px 8px;font-size:9px" data-plugin="${p.id}" data-enabled="${p.enabled}">
        ${p.enabled ? 'Disable' : 'Enable'}
      </button>
    </div>
  `).join('');

  list.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-plugin')!;
      const enabled = btn.getAttribute('data-enabled') === 'true';
      if (enabled) await window.jarvis.plugin.disable(id);
      else await window.jarvis.plugin.enable(id);
      loadPlugins();
    });
  });
}

// ─── Workflows ────────────────────────────────────────────────────

async function loadWorkflows(): Promise<void> {
  const list = document.getElementById('workflowList');
  if (!list) return;
  const workflows = await window.jarvis.workflow.getAll();

  if (workflows.length === 0) {
    list.innerHTML = '<p style="color:#8899ff;font-size:11px;text-align:center">No workflows yet. Create one to automate tasks.</p>';
    return;
  }

  list.innerHTML = workflows.map((w) => `
    <div class="workflow-item">
      <div>
        <h4>${escapeHtml(w.name)}</h4>
        <p>Trigger: ${w.trigger.type} · ${w.actions.length} actions · ${w.enabled ? '✓ Enabled' : '✗ Disabled'}</p>
      </div>
      <button class="btn" style="padding:6px 12px;font-size:9px" data-run="${w.id}">Run</button>
    </div>
  `).join('');

  list.querySelectorAll('[data-run]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.jarvis.workflow.run(btn.getAttribute('data-run')!);
    });
  });
}

// ─── Navigation ───────────────────────────────────────────────────

function initNavigation(): void {
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const view = tab.getAttribute('data-view')!;
      document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`view${view.charAt(0).toUpperCase() + view.slice(1)}`)?.classList.add('active');

      if (view === 'dashboard') updateAssistantDashboard();
      if (view === 'automation') loadWorkflows();
      if (view === 'settings') loadSettings();
    });
  });
}

// ─── Commands List ────────────────────────────────────────────────

function populateCommands(): void {
  commandCategories.forEach((cat) => {
    const div = document.createElement('div');
    div.className = 'command-category';
    div.innerHTML = `<h4>${cat.name} (${cat.commands.length})</h4><ul>${cat.commands.map((c) => `<li>${c}</li>`).join('')}</ul>`;
    elements.commandsList.appendChild(div);
  });
}

function toggleCommands(): void {
  elements.commandsList.classList.toggle('expanded');
  elements.toggleIcon.textContent = elements.commandsList.classList.contains('expanded') ? '▲' : '▼';
}

// ─── IPC Event Listeners ──────────────────────────────────────────

function initEventListeners(): void {
  window.jarvis.on('voice:speak', (text: unknown) => speak(text as string));
  window.jarvis.on('voice:stop', () => window.speechSynthesis.cancel());
  window.jarvis.on('notify:speak', (text: unknown) => speak(text as string));
  window.jarvis.on('tray:voice-on', () => { if (!voiceActivationEnabled) toggleVoiceActivation(); });
  window.jarvis.on('tray:voice-off', () => { if (voiceActivationEnabled) toggleVoiceActivation(); });
  window.jarvis.on('navigate', (view: unknown) => {
    document.querySelector(`[data-view="${view}"]`)?.dispatchEvent(new Event('click'));
  });
}

// ─── Initialize ───────────────────────────────────────────────────

function init(): void {
  populateCommands();
  initSpeechRecognition();
  initParticles();
  initNavigation();
  initDashboard();
  initEventListeners();
  loadSettings();

  elements.startBtn.addEventListener('click', startListening);
  elements.voiceActivationBtn.addEventListener('click', toggleVoiceActivation);
  elements.minimizeBtn.addEventListener('click', () => window.jarvis.window.hide('quick'));
  elements.orbBtn.addEventListener('click', () => window.jarvis.window.setMode('orb'));
  elements.stealthBtn.addEventListener('click', () => window.jarvis.window.setMode('stealth'));
  elements.widgetBtn.addEventListener('click', () => window.jarvis.window.setMode('widget'));
  elements.floatingBtn.addEventListener('click', () => window.jarvis.window.show());
  elements.commandsToggle.addEventListener('click', toggleCommands);

  $('btnMinimize')?.addEventListener('click', () => window.jarvis.window.minimize());
  $('btnHide')?.addEventListener('click', () => window.jarvis.window.hide('quick'));
  $('btnClose')?.addEventListener('click', () => window.jarvis.window.hide('quick'));

  document.getElementById('saveAISettings')?.addEventListener('click', saveAISettings);
  document.getElementById('saveVoiceSettings')?.addEventListener('click', saveVoiceSettings);

  document.getElementById('settingsTheme')?.addEventListener('change', (e) => {
    const theme = (e.target as HTMLSelectElement).value;
    applyTheme(theme);
    window.jarvis.settings.save({ theme: theme as import('../../shared/types').AppSettings['theme'] });
  });

  setTimeout(() => speak('JARVIS online. All systems operational, sir.'), 1500);
}

window.addEventListener('load', init);
