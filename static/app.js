const BACKEND_URL = "/api/generate";

/* ---------------------------- Dynamic Multi-Voice & Language Controller ---------------------------- */
const Voice = {
  selectedVoice: null,
  voices: [],

  langMap: {
    "English": "en",
    "Hindi": "hi",
    "Hinglish (Hindi+English mix)": "hi",
    "Bengali": "bn",
    "Tamil": "ta",
    "Telugu": "te",
    "Marathi": "mr",
    "Gujarati": "gu",
    "Kannada": "kn",
    "Malayalam": "ml",
    "Punjabi": "pa",
    "Urdu": "ur",
    "Spanish": "es",
    "French": "fr",
    "German": "de",
    "Arabic": "ar"
  },

  init() {
    const updateVoiceList = () => {
      this.voices = window.speechSynthesis.getVoices();
      const select = document.getElementById("voicePersonaSelect");
      const langSelect = document.getElementById("langSelect");
      if (!select || !langSelect) return;

      select.innerHTML = "";
      const prefix = this.langMap[langSelect.value] || "en";

      const matched = this.voices.filter(v => v.lang.toLowerCase().startsWith(prefix));

      if (!matched.length) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = `Default Device Voice (${prefix})`;
        select.appendChild(opt);
        this.selectedVoice = null;
        return;
      }

      matched.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.lang})`;
        select.appendChild(opt);
      });

      this.selectedVoice = matched[0];
      select.value = matched[0].name;
    };

    updateVoiceList();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoiceList;
    }

    const langSelect = document.getElementById("langSelect");
    if (langSelect) langSelect.addEventListener("change", updateVoiceList);

    const select = document.getElementById("voicePersonaSelect");
    if (select) {
      select.addEventListener("change", (e) => {
        this.selectedVoice = this.voices.find(v => v.name === e.target.value) || null;
      });
    }
  },

  speak(text, langLabel, onDone) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const targetPrefix = this.langMap[langLabel] || "en";

      if (this.selectedVoice) {
        u.voice = this.selectedVoice;
      }

      u.rate = 0.98;
      u.pitch = 1.0;

      u.onstart = () => {
        Avatar.startSpeaking();
        const bubble = document.getElementById('speakBubble');
        if (bubble) {
          bubble.classList.add('active');
          bubble.innerHTML = '<span class="mic-dot"></span> Speaking…';
        }
      };

      u.onend = () => {
        Avatar.stopSpeaking();
        const bubble = document.getElementById('speakBubble');
        if (bubble) {
          bubble.classList.remove('active');
          bubble.textContent = 'Ready when you are.';
        }
        if (onDone) onDone();
      };

      u.onerror = () => {
        Avatar.stopSpeaking();
        if (onDone) onDone();
      };

      window.speechSynthesis.speak(u);
    } catch (e) {
      Avatar.stopSpeaking();
      if (onDone) onDone();
    }
  },

  stop() {
    try { window.speechSynthesis.cancel(); } catch (e) {}
    Avatar.stopSpeaking();
  }
};

/* ---------------------------- Vector Animated Avatar ---------------------------- */
const Avatar = {
  svg: null,
  mouth: null,
  speaking: false,
  animInterval: null,
  blinkTimeout: null,

  init() {
    this.svg = document.getElementById('avatarSvg');
    if (!this.svg) return;

    this.svg.innerHTML = `
      <g id="avatarGroup">
        <!-- Body / Clothes -->
        <path d="M 50 190 Q 100 150 150 190 Z" fill="#254A44" stroke="#E8B84B" stroke-width="2"/>
        <path d="M 85 165 L 100 190 L 115 165" fill="#E8B84B"/>
        <!-- Head -->
        <circle cx="100" cy="95" r="48" fill="#F3EFE3" stroke="#254A44" stroke-width="2"/>
        <!-- Spectacles -->
        <circle cx="82" cy="90" r="14" fill="none" stroke="#254A44" stroke-width="3"/>
        <circle cx="118" cy="90" r="14" fill="none" stroke="#254A44" stroke-width="3"/>
        <line x1="96" y1="90" x2="104" y2="90" stroke="#254A44" stroke-width="3"/>
        <!-- Eyes -->
        <circle id="eyeLeft" cx="82" cy="90" r="4" fill="#173330"/>
        <circle id="eyeRight" cx="118" cy="90" r="4" fill="#173330"/>
        <!-- Eyebrows -->
        <path d="M 70 72 Q 82 68 94 72" stroke="#254A44" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M 106 72 Q 118 68 130 72" stroke="#254A44" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- Hair -->
        <path d="M 52 90 Q 50 48 100 48 Q 150 48 148 90 Q 135 58 100 60 Q 65 58 52 90 Z" fill="#254A44"/>
        <!-- Mouth -->
        <path id="avatarMouth" d="M 86 122 Q 100 122 114 122" stroke="#E4634C" stroke-width="4" fill="none" stroke-linecap="round"/>
      </g>
    `;
    this.mouth = document.getElementById('avatarMouth');
    this.startBlinkLoop();
  },

  startBlinkLoop() {
    clearTimeout(this.blinkTimeout);
    this.blinkTimeout = setTimeout(() => {
      const left = document.getElementById('eyeLeft');
      const right = document.getElementById('eyeRight');
      if (left && right) {
        left.setAttribute('r', '0.5');
        right.setAttribute('r', '0.5');
        setTimeout(() => {
          left.setAttribute('r', '4');
          right.setAttribute('r', '4');
        }, 120);
      }
      this.startBlinkLoop();
    }, 2500 + Math.random() * 3000);
  },

  startSpeaking() {
    this.speaking = true;
    if (this.svg) this.svg.classList.add('nodding');

    const shapes = [
      "M 86 122 Q 100 135 114 122",
      "M 88 122 Q 100 126 112 122",
      "M 86 120 Q 100 140 114 120",
      "M 86 122 Q 100 122 114 122"
    ];
    let i = 0;
    clearInterval(this.animInterval);
    this.animInterval = setInterval(() => {
      if (!this.speaking) return;
      if (this.mouth) this.mouth.setAttribute('d', shapes[i % shapes.length]);
      i++;
    }, 120);
  },

  stopSpeaking() {
    this.speaking = false;
    clearInterval(this.animInterval);
    if (this.svg) this.svg.classList.remove('nodding');
    if (this.mouth) this.mouth.setAttribute('d', "M 86 122 Q 100 122 114 122");
  }
};

/* ---------------------------- Backend API Communication ---------------------------- */
async function callBackend(system, user, { json = true } = {}) {
  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`Server Error (${res.status}): ${JSON.stringify(errData)}`);
  }

  const data = await res.json();
  let text = (data.content || []).map(b => b.text || "").join("\n").trim();

  if (json) {
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end >= 0) text = text.substring(start, end + 1);
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("JSON parse error:", e, text);
      throw e;
    }
  }
  return text;
}

/* ---------------------------- Speech Recognition (STT) ---------------------------- */
const Listen = {
  supported: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  recognizer: null,
  active: false,
  start(langLabel, { onResult, onEnd, onError } = {}) {
    if (!this.supported) {
      if (onError) onError('unsupported');
      return false;
    }
    if (this.active) this.stop();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognizer = new SR();
    this.recognizer.lang = Voice.langMap[langLabel] || 'en-US';
    this.recognizer.interimResults = false;
    this.recognizer.maxAlternatives = 1;
    this.recognizer.continuous = false;
    this.active = true;

    this.recognizer.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      if (onResult) onResult(transcript);
    };
    this.recognizer.onerror = (e) => {
      this.active = false;
      if (onError) onError(e.error);
    };
    this.recognizer.onend = () => {
      this.active = false;
      if (onEnd) onEnd();
    };
    try {
      this.recognizer.start();
      return true;
    } catch (e) {
      this.active = false;
      if (onError) onError(e);
      return false;
    }
  },
  stop() {
    if (this.recognizer && this.active) {
      try { this.recognizer.stop(); } catch (e) {}
    }
    this.active = false;
  }
};

/* ---------------------------- Visual Diagram Renderers ---------------------------- */
const Visuals = {
  render(visual) {
    if (!visual || !visual.type) return "";
    try {
      switch (visual.type) {
        case "bullet": return this.bullet(visual.data);
        case "diagram":
        case "labeled_diagram": return this.diagram(visual.data);
        case "equation": return this.equation(visual.data);
        case "flow": return this.flow(visual.data);
        default: return "";
      }
    } catch (e) {
      return "";
    }
  },
  bullet(d) {
    const pts = (d && d.points) || [];
    return `<div style="display:flex;flex-direction:column;gap:10px;">` + pts.map((p, i) =>
      `<div style="display:flex;gap:10px;align-items:flex-start;">
        <span style="color:var(--amber);font-weight:700;">${String(i + 1).padStart(2, '0')}</span>
        <span style="color:var(--chalk);font-size:14.5px;line-height:1.6;">${esc(p)}</span>
      </div>`).join('') + `</div>`;
  },
  diagram(d) {
    const nodes = (d && d.nodes) || [];
    const edges = (d && d.edges) || [];
    const W = 600, H = 220, cx = W / 2, cy = H / 2, R = 80;
    const pos = {};
    nodes.forEach((n, i) => {
      const a = (2 * Math.PI * i / nodes.length) - Math.PI / 2;
      pos[n.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });
    let svg = `<svg viewBox="0 0 ${W} ${H}">`;
    edges.forEach((e) => {
      const a = pos[e.from], b = pos[e.to];
      if (!a || !b) return;
      svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#79B7C9" stroke-width="2"/>`;
    });
    nodes.forEach((n) => {
      const p = pos[n.id];
      svg += `<circle cx="${p.x}" cy="${p.y}" r="28" fill="#1E3E3A" stroke="#E8B84B" stroke-width="2"/>
              <text x="${p.x}" y="${p.y + 4}" fill="#F3EFE3" font-size="11" text-anchor="middle">${esc(n.label).slice(0, 12)}</text>`;
    });
    svg += `</svg>`;
    return svg;
  },
  equation(d) {
    const steps = (d && d.steps) || [];
    return `<div style="background:rgba(0,0,0,0.25);border:1px solid var(--rule);border-radius:10px;padding:16px;">
      ${d && d.expression ? `<div class="mono" style="font-size:18px;color:var(--amber);margin-bottom:10px;">${esc(d.expression)}</div>` : ''}
      ${steps.map((s, i) => `<div style="color:var(--chalk-dim);font-size:13.5px;margin-bottom:4px;">${i + 1}. ${esc(s)}</div>`).join('')}
    </div>`;
  },
  flow(d) {
    const steps = (d && d.steps) || [];
    return `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;">` + steps.map((s, i) =>
      `<div style="display:flex;align-items:center;gap:8px;">
        <div style="border:1px solid var(--rule-strong);border-radius:8px;padding:8px 12px;font-size:13px;background:rgba(0,0,0,0.2);">${esc(s)}</div>
        ${i < steps.length - 1 ? '<span style="color:var(--amber);">→</span>' : ''}
      </div>`).join('') + `</div>`;
  }
};

function esc(s) {
  return (s == null ? "" : String(s)).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------------------------- UI Control ---------------------------- */
const UI = {
  switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.getElementById('tabTopic').classList.toggle('hidden', tab !== 'topic');
    document.getElementById('tabMaterial').classList.toggle('hidden', tab !== 'material');
  },
  show(id) {
    ['screenSetup', 'screenLoading', 'screenLesson', 'screenReport'].forEach(s => {
      document.getElementById(s).classList.toggle('hidden', s !== id);
    });
  },
  setLoading(text) {
    document.getElementById('loadingText').textContent = text;
  }
};

document.querySelectorAll('#levelChips .chip, #timeChips .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });
});

/* ---------------------------- Main Application Logic ---------------------------- */
const App = {
  state: null,
  voiceMode: false,

  async startLesson() {
    const isMaterial = !document.getElementById('tabMaterial').classList.contains('hidden');
    const topic = document.getElementById('topicInput').value.trim();
    const material = document.getElementById('materialInput').value.trim();
    const focus = document.getElementById('materialFocus').value.trim();
    const lang = document.getElementById('langSelect').value;
    const student = document.getElementById('studentName').value.trim() || 'Student';
    const levelChip = document.querySelector('#levelChips .chip.active');
    const level = levelChip ? levelChip.dataset.val : 'intermediate';

    if (isMaterial && !material) { alert('Paste material or upload a file first.'); return; }
    if (!isMaterial && !topic) { alert('Enter a topic to learn.'); return; }

    this.state = {
      mode: isMaterial ? 'material' : 'topic',
      topic: isMaterial ? (focus || 'Material Study') : topic,
      material, level, lang, student,
      beats: [], beatIndex: -1,
      score: { correct: 0, total: 0 },
      concepts: { covered: new Set(), weak: new Set() }
    };

    UI.show('screenLoading');
    UI.setLoading('Preparing your lesson with AI Teacher…');
    Avatar.init();

    try {
      const plan = await this.generatePlan();
      this.state.lessonTitle = plan.title || this.state.topic;
      this.state.beats = plan.beats || [];
      document.getElementById('sideTopic').textContent = this.state.lessonTitle;
      document.getElementById('sideLevel').textContent = level;
      document.getElementById('sideLang').textContent = lang;
      UI.show('screenLesson');
      document.getElementById('progressPill').classList.remove('hidden');
      this.next();
    } catch (e) {
      alert('Error creating lesson. Please check server logs.');
      UI.show('screenSetup');
    }
  },

  async generatePlan() {
    const s = this.state;
    const materialBlock = s.mode === 'material'
      ? `Material:\n${s.material.slice(0, 3000)}`
      : `Topic: ${s.topic}`;

    // Compact system instructions reduce token generation time by ~60%
    const system = `Expert curriculum designer. Output ONLY valid JSON, no markdown.
All text/headings/questions in ${s.lang}. Keys in English.
JSON format:
{
 "title": "Topic title in ${s.lang}",
 "beats": [
    {"type":"explain","concept":"concept name","heading":"heading","text":"explanation in 50-70 words","visual":{"type":"bullet","data":{"points":["point 1","point 2"]}}},
    {"type":"question","concept":"concept name","qtype":"mcq","prompt":"question prompt","options":["a","b","c","d"],"correctAnswer":"exact correct option","hint":"hint"}
 ]
}`;

    const user = `${materialBlock}\n\nGenerate 3-4 interactive lesson beats now.`;
    return await callBackend(system, user);
  },

  next() {
    Voice.stop();
    const s = this.state;
    s.beatIndex++;
    const beat = s.beats[s.beatIndex];
    if (!beat) {
      this.showReport();
      return;
    }
    this.renderBeat(beat);
    this.updateProgress();
  },

  renderBeat(beat) {
    const container = document.getElementById('beatContent');
    const continueBtn = document.getElementById('continueBtn');
    
    if (beat.type === 'explain') {
      container.innerHTML = `
        <div class="beat-concept">${esc(beat.concept || '')}</div>
        <div class="beat-heading">${esc(beat.heading || '')}</div>
        <div class="beat-text">${esc(beat.text || '')}</div>
        <div class="visual-wrap">${Visuals.render(beat.visual)}</div>
      `;
      continueBtn.classList.remove('hidden');
      Voice.speak(beat.text || beat.heading || '', this.state.lang);
    } else if (beat.type === 'question') {
      container.innerHTML = `
        <div class="beat-concept">${esc(beat.concept || '')} · Quiz</div>
        <div class="beat-heading">Quick Check</div>
        <div class="qa-box">
          <div class="qa-prompt">${esc(beat.prompt || '')}</div>
          <div id="qaOptions"></div>
          <div id="qaFeedback"></div>
        </div>
      `;
      continueBtn.classList.add('hidden');
      const optWrap = document.getElementById('qaOptions');
      optWrap.innerHTML = (beat.options || []).map(o => `<button class="opt-btn" data-opt="${esc(o)}">${esc(o)}</button>`).join('');
      optWrap.querySelectorAll('.opt-btn').forEach(btn => {
        btn.addEventListener('click', () => this.submitAnswer(beat, btn.dataset.opt, optWrap));
      });
      Voice.speak(beat.prompt || '', this.state.lang);
    }
  },

  async submitAnswer(beat, studentAnswer, optWrap) {
    optWrap.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
    const fb = document.getElementById('qaFeedback');
    fb.innerHTML = '<div class="loading-text">Evaluating response…</div>';

    const system = `Evaluate student's answer. Return valid JSON only:
{"correct": true|false, "feedback": "1-2 sentences in ${this.state.lang}"}`;
    const user = `Question: ${beat.prompt}\nCorrect Answer: ${beat.correctAnswer}\nStudent Answer: ${studentAnswer}`;

    let result;
    try {
      result = await callBackend(system, user);
    } catch (e) {
      result = { correct: studentAnswer === beat.correctAnswer, feedback: "Understood." };
    }

    this.state.score.total++;
    if (result.correct) this.state.score.correct++;
    else this.state.concepts.weak.add(beat.concept);

    optWrap.querySelectorAll('.opt-btn').forEach(b => {
      if (b.dataset.opt === beat.correctAnswer) b.classList.add('correct');
      else if (b.dataset.opt === studentAnswer && !result.correct) b.classList.add('incorrect');
    });

    fb.innerHTML = `<div class="feedback-box ${result.correct ? 'ok' : 'no'}">${result.correct ? '✓ ' : '✗ '}${esc(result.feedback || '')}</div>`;
    Voice.speak(result.feedback || '', this.state.lang);
    this.updateProgress();

    const continueBtn = document.getElementById('continueBtn');
    continueBtn.classList.remove('hidden');
    continueBtn.onclick = () => this.next();
  },

  updateProgress() {
    const s = this.state;
    const total = s.beats.length;
    const idx = Math.min(s.beatIndex + 1, total);
    document.getElementById('progressFill').style.width = Math.round(idx / total * 100) + '%';
    document.getElementById('progressLabel').textContent = `${idx} / ${total}`;
    document.getElementById('sideScore').textContent = `${s.score.correct} / ${s.score.total}`;
  },

  replay() {
    const s = this.state;
    const beat = s.beats[s.beatIndex];
    if (beat) Voice.speak(beat.text || beat.prompt || '', s.lang);
  },

  askDoubtPrompt() {
    document.getElementById('doubtInput').focus();
  },

  async askDoubt() {
    const input = document.getElementById('doubtInput');
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    const log = document.getElementById('doubtLog');
    const qDiv = document.createElement('div');
    qDiv.innerHTML = `<div class="q">You: ${esc(q)}</div><div class="a">Thinking…</div>`;
    log.appendChild(qDiv);
    log.scrollTop = log.scrollHeight;
    const aEl = qDiv.querySelector('.a');

    const system = `Answer the student's doubt concisely in 2 sentences in ${this.state.lang}. Plain text only.`;
    try {
      const ans = await callBackend(system, `Topic: ${this.state.lessonTitle}\nQuestion: ${q}`, { json: false });
      aEl.textContent = ans;
      Voice.speak(ans, this.state.lang);
    } catch (e) {
      aEl.textContent = "Could not process question.";
    }
  },

  toggleVoiceMode(on) {
    this.voiceMode = on;
    if (!Listen.supported && on) alert('Voice input not supported in this browser.');
  },

  toggleDoubtMic() {
    const btn = document.getElementById('doubtMicBtn');
    if (Listen.active) { Listen.stop(); btn.classList.remove('listening'); return; }
    btn.classList.add('listening');
    Listen.start(this.state ? this.state.lang : 'English', {
      onResult: (t) => { document.getElementById('doubtInput').value = t; this.askDoubt(); },
      onEnd: () => btn.classList.remove('listening'),
      onError: () => btn.classList.remove('listening')
    });
  },

  showReport() {
    UI.show('screenReport');
    const s = this.state;
    const pct = s.score.total ? Math.round(100 * s.score.correct / s.score.total) : 100;
    document.getElementById('reportTitle').textContent = s.lessonTitle;
    document.getElementById('reportSub').textContent = `${s.student} · ${s.level} · ${s.lang}`;
    document.getElementById('scoreBig').textContent = `${pct}%`;
    document.getElementById('reportSummary').textContent = "Lesson complete! Review your performance metrics above.";
  },

  reset() {
    Voice.stop();
    this.state = null;
    UI.show('screenSetup');
    document.getElementById('progressPill').classList.add('hidden');
  }
};

window.addEventListener('DOMContentLoaded', () => {
  Voice.init();
});