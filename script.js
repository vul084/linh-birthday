// Set this to your actual Instagram handle before sharing.
const INSTAGRAM_HANDLE = 'linh.kvu';
const AGES = [13,14,15,16,17,18,19,20,21];
const wheel = document.getElementById('dialWheel');
const ring = document.getElementById('numberRing');
const feedback = document.getElementById('feedback');
const dialPage = document.getElementById('dialPage');
const invitePage = document.getElementById('invitePage');
const overlay = document.getElementById('zoomOverlay');
const soundButton = document.getElementById('soundToggle');
let locked = false;
let soundOn = true;
let audioContext;

document.getElementById('rsvpLink').href = `https://www.instagram.com/${encodeURIComponent(INSTAGRAM_HANDLE)}/`;
document.getElementById('rsvpLink').target = '_blank';
document.getElementById('rsvpLink').rel = 'noopener noreferrer';

function audio(){
  if(!soundOn) return null;
  try{
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if(audioContext.state === 'suspended') audioContext.resume();
    return audioContext;
  }catch{
    return null;
  }
}
function tone(freq, delay, duration, volume=.075, type='sine'){
  const ac = audio();
  if(!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const t = ac.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + .008);
  gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + .02);
}
function ticks(){
  for(let i=0;i<15;i++){
    tone(180 + (i % 4) * 40, i * .073, .022, .030, 'square');
    tone(980, i * .073, .012, .024, 'triangle');
  }
}
function errorSound(){
  tone(225,0,.15,.065,'triangle');
  tone(164,.14,.22,.065,'triangle');
}
function connectedSound(){
  tone(659,0,.32,.05);
  tone(880,.1,.4,.05);
  tone(1318,.2,.65,.04);
}
function makeButtons(){
  ring.replaceChildren();
  AGES.forEach((age,index)=>{
    const degrees = -90 + index * 40;
    const rad = degrees * Math.PI / 180;
    const button = document.createElement('button');
    button.className = 'age-button';
    button.type = 'button';
    button.setAttribute('aria-label', `Choose ${age}`);
    button.style.left = `${50 + 39 * Math.cos(rad)}%`;
    button.style.top = `${50 + 39 * Math.sin(rad)}%`;
    button.style.setProperty('--counter-angle', `${-degrees - 90}deg`);
    button.innerHTML = `<span class="age-face">${age}</span>`;
    button.addEventListener('click',()=>selectAge(age, button));
    ring.append(button);
  });
}
function currentRotation(){
  const matrix = getComputedStyle(wheel).transform;
  if(matrix === 'none') return 0;
  const m = new DOMMatrixReadOnly(matrix);
  return (Math.atan2(m.b, m.a) * 180 / Math.PI + 360) % 360;
}
function stopOnTwenty(){
  const current = currentRotation();
  const index = AGES.indexOf(20);
  const ageAngle = -90 + index * 40;
  const target = 44;
  const adjustment = (target - ageAngle - current + 3600) % 360;
  wheel.style.animation = 'none';
  wheel.style.transition = 'none';
  wheel.style.transform = `rotate(${current}deg)`;
  void wheel.offsetWidth;
  wheel.style.transition = 'transform 1.6s cubic-bezier(.15,.74,.22,1)';
  wheel.style.transform = `rotate(${current + 360 + adjustment}deg)`;
}
function selectAge(age, button){
  if(locked) return;
  audio();
  if(age !== 20){
    button.classList.remove('wrong');
    void button.offsetWidth;
    button.classList.add('wrong');
    feedback.textContent = 'wrong number — try again';
    errorSound();
    setTimeout(()=>{
      button.classList.remove('wrong');
      if(!locked) feedback.textContent = 'tap an age';
    }, 760);
    return;
  }
  locked = true;
  button.classList.add('correct');
  feedback.textContent = 'call connected ♡';
  ticks();
  stopOnTwenty();
  setTimeout(connectedSound, 1550);
  setTimeout(()=>zoom(button), 2050);
}
function zoom(button){
  const rect = button.getBoundingClientRect();
  overlay.style.left = `${rect.left + rect.width / 2}px`;
  overlay.style.top = `${rect.top + rect.height / 2}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.setProperty('--zoom-scale', Math.ceil(Math.hypot(innerWidth, innerHeight) * 2 / rect.width));
  overlay.classList.add('active');
  setTimeout(()=>{
    dialPage.hidden = true;
    invitePage.hidden = false;
    invitePage.setAttribute('aria-hidden','false');
    startLetter();
    overlay.style.transition = 'none';
    overlay.classList.remove('active');
    requestAnimationFrame(()=>requestAnimationFrame(()=>overlay.style.transition=''));
    window.scrollTo(0,0);
  }, 820);
}

document.getElementById('replay').addEventListener('click',()=>{
  locked = false;
  clearInterval(typingTimer);
  wheel.style.animation = '';
  wheel.style.transition = '';
  wheel.style.transform = '';
  feedback.textContent = 'tap an age';
  makeButtons();
  invitePage.hidden = true;
  invitePage.setAttribute('aria-hidden','true');
  dialPage.hidden = false;
  window.scrollTo(0,0);
});

soundButton.addEventListener('click',()=>{
  soundOn = !soundOn;
  soundButton.textContent = soundOn ? 'sound on ♪' : 'sound off ♪';
  soundButton.setAttribute('aria-pressed', String(soundOn));
  if(soundOn) tone(780,0,.11);
});

makeButtons();

const fullLetter = "Congrats on guessing my age right! As a reward, you're officially invited to my birthday party.\n\nWe'll be eating good, drinking good, and hopefully making some questionable memories together. My actual birthday is November 16, but since we have school that day (unfortunately), we're celebrating a little early.\n\nFood's on me, so just bring yourself (and maybe a gift because I'm materialistic like that).\n\nSee you on Saturday, November 14, at 7:30 PM at Crystine's house. Can't wait to celebrate with you!";
let typingTimer = null;
function startLetter(){
  const el=document.getElementById('typedMessage');
  clearInterval(typingTimer);
  el.classList.remove('finished');
  el.textContent='';
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){el.textContent=fullLetter;el.classList.add('finished');return;}
  let i=0;
  // Fast and steady reveal, like a note being typed across the page.
  typingTimer=setInterval(()=>{
    i=Math.min(i+2,fullLetter.length);
    el.textContent=fullLetter.slice(0,i);
    if(i===fullLetter.length){clearInterval(typingTimer);el.classList.add('finished');}
  },27);
}
