const { ipcRenderer } = require('electron')

const CIRCUMFERENCE = 2 * Math.PI * 88 // ~553.1

const MODES = {
  focus:      { label: '专注', duration: 25 * 60, ringClass: '' },
  shortbreak: { label: '短休', duration: 20, ringClass: 'break-ring' },
  longbreak:  { label: '长休', duration: 15 * 60, ringClass: 'longbreak-ring' },
}

let currentMode = 'focus'
let remaining = MODES.focus.duration
let state = 'idle' // idle | running | paused
let interval = null

// DOM refs
const timeDisplay = document.getElementById('timeDisplay')
const ringFg = document.getElementById('ringForeground')
const startPauseBtn = document.getElementById('startPauseBtn')
const resetBtn = document.getElementById('resetBtn')
const closeBtn = document.getElementById('closeBtn')
const titleBar = document.getElementById('titleBar')
const modeBtns = document.querySelectorAll('.mode-btn')

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(remaining)
  const progress = 1 - remaining / MODES[currentMode].duration
  ringFg.style.strokeDashoffset = CIRCUMFERENCE * progress
}

function showFlash() {
  const overlay = document.createElement('div')
  overlay.className = 'flash-overlay'
  document.body.appendChild(overlay)
  setTimeout(() => overlay.remove(), 1500)
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.value = 0.3
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch (_) { /* audio not available */ }
}

function onComplete() {
  playBeep()
  showFlash()
  ipcRenderer.send('show-notification', MODES[currentMode].label + ' 完成！', '时间到啦，休息一下吧')
  ipcRenderer.send('flash-window')
}

function tick() {
  remaining--
  updateDisplay()
  if (remaining <= 0) {
    clearInterval(interval); interval = null
    state = 'idle'
    startPauseBtn.textContent = '开始'
    startPauseBtn.classList.remove('running')
    remaining = MODES[currentMode].duration
    updateDisplay()
    onComplete()
  }
}

function startTimer() {
  if (interval) clearInterval(interval)
  state = 'running'
  startPauseBtn.textContent = '暂停'
  startPauseBtn.classList.add('running')
  interval = setInterval(tick, 1000)
}

function pauseTimer() {
  clearInterval(interval); interval = null
  state = 'paused'
  startPauseBtn.textContent = '继续'
  startPauseBtn.classList.remove('running')
}

function resetTimer() {
  clearInterval(interval); interval = null
  state = 'idle'
  startPauseBtn.textContent = '开始'
  startPauseBtn.classList.remove('running')
  remaining = MODES[currentMode].duration
  updateDisplay()
}

function switchMode(mode) {
  if (state === 'running') pauseTimer()
  resetTimer()
  currentMode = mode
  document.body.className = MODES[mode].ringClass
  modeBtns.forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode)
  })
  remaining = MODES[mode].duration
  ringFg.style.strokeDashoffset = CIRCUMFERENCE
  updateDisplay()
}

// -- Events --
startPauseBtn.addEventListener('click', () => {
  if (state === 'idle' || state === 'paused') startTimer()
  else pauseTimer()
})

resetBtn.addEventListener('click', resetTimer)

closeBtn.addEventListener('click', () => window.close())

modeBtns.forEach(btn => {
  btn.addEventListener('click', () => switchMode(btn.dataset.mode))
})

// init
updateDisplay()
