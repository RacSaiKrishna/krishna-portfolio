/**
 * A small engine, synthesised with Web Audio. Scrolling is the throttle.
 *
 *  - Firing note: a custom waveform rich in low harmonics (4-stroke character) plus a
 *    sub-octave "crank" rumble, lightly saturated, then an exhaust filter that opens with revs.
 *  - Intake: band-passed noise that rises with throttle.
 *  - Behaviour: revs climb with some inertia while you scroll, fall back more slowly when you
 *    let go (engine braking), and on a long fast scroll it shifts up through the gears
 *    (a short dip in revs, then the climb again). About a second after scrolling stops the
 *    engine settles to a soft idle (owner request, 2026-11-20) and keeps ticking over until
 *    the next scroll. The idle is quiet (about a sixth of full throttle) so it never drones.
 *  - ignite(): a scripted start-up roar played once when the page's audio first starts.
 *  - spool(p): revs follow the first-visit loading counter, ending in the ignite() roar.
 *
 * All oscillators sit at exact frequency ratios (no detune), so there is no beating "vibration".
 */
const IDLE = 0.12;                  // idle revs, 0..1
const IDLE_LEVEL = 0.45;            // engine loudness while idling, relative to driving
const GEAR_RATE = [0, 0.11, 0.075, 0.055, 0.042, 0.034]; // how fast revs climb in each gear
const firingHz = (rpm) => 28 + rpm * 190; // ~840 to ~6500 rpm on a 4-cylinder

export function createMotor(ctx, destination, noiseBuffer) {
  // Engine-like periodic wave: falling harmonics, even ones emphasised, mixed phases (pulse-ish).
  const N = 32;
  const real = new Float32Array(N), imag = new Float32Array(N);
  for (let k = 1; k < N; k++) {
    let a = 1 / Math.pow(k, 1.1);
    if (k % 2 === 0) a *= 1.35;
    if (k === 3 || k === 5) a *= 0.7;
    imag[k] = k % 3 === 0 ? -a : a;
  }
  const firing = ctx.createOscillator();
  firing.setPeriodicWave(ctx.createPeriodicWave(real, imag));
  const crank = ctx.createOscillator(); crank.type = "sine";

  const drive = ctx.createGain(); drive.gain.value = 0.5;
  const crankLevel = ctx.createGain(); crankLevel.gain.value = 0.45;

  // Soft saturation for a bit of grit.
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) { const x = (i / (curve.length - 1)) * 2 - 1; curve[i] = Math.tanh(x * 2.2) / Math.tanh(2.2); }
  shaper.curve = curve; shaper.oversample = "2x";

  const body = ctx.createBiquadFilter(); body.type = "peaking"; body.frequency.value = 110; body.gain.value = 5; body.Q.value = 0.9;
  const exhaust = ctx.createBiquadFilter(); exhaust.type = "lowpass"; exhaust.frequency.value = 300; exhaust.Q.value = 1.4;
  const out = ctx.createGain(); out.gain.value = 0;

  firing.connect(drive).connect(shaper);
  crank.connect(crankLevel).connect(shaper);
  shaper.connect(body).connect(exhaust).connect(out).connect(destination);

  const intakeSrc = ctx.createBufferSource(); intakeSrc.buffer = noiseBuffer; intakeSrc.loop = true;
  const intakeFilter = ctx.createBiquadFilter(); intakeFilter.type = "bandpass"; intakeFilter.Q.value = 1.1; intakeFilter.frequency.value = 600;
  const intake = ctx.createGain(); intake.gain.value = 0;
  intakeSrc.connect(intakeFilter).connect(intake).connect(destination);

  firing.frequency.value = firingHz(IDLE);
  crank.frequency.value = firingHz(IDLE) / 2;
  firing.start(); crank.start(); intakeSrc.start();

  let input = 0, throttle = 0, rpm = IDLE, gear = 1, active = 0;
  let lastInput = 0, quietSince = 0, shiftUntil = 0, timer = null;
  let level = 1;           // 1 normally, lower while the intro video talks
  let started = false;     // once the engine has run, it idles instead of falling silent
  let script = null, scriptStart = 0, scriptEnd = 0; // scripted throttle (start-up roar)
  const VOLUME = 0.064;    // engine loudness at full throttle, before the master bus (was 0.075, -15%)

  function apply(now) {
    const t = ctx.currentTime;
    const f = firingHz(rpm);
    firing.frequency.setTargetAtTime(f, t, 0.03);
    crank.frequency.setTargetAtTime(f / 2, t, 0.03);
    exhaust.frequency.setTargetAtTime(220 + rpm * 2600 + throttle * 400, t, 0.05);
    drive.gain.setTargetAtTime(0.5 + throttle * 0.7, t, 0.05);
    const shiftDip = now < shiftUntil ? 0.35 : 1;
    out.gain.setTargetAtTime(VOLUME * level * active * shiftDip * (0.35 + 0.5 * throttle + 0.15 * rpm), t, 0.04);
    intake.gain.setTargetAtTime(0.017 * level * active * throttle, t, 0.06);
    intakeFilter.frequency.setTargetAtTime(500 + rpm * 1800, t, 0.06);
  }

  function tick() {
    const now = performance.now();
    if (script) {
      if (now < scriptEnd) { input = Math.max(input, script(now - scriptStart)); lastInput = now; }
      else { script = null; lastInput = now - 700; } // release: fade out sooner than after a scroll
    }
    if (now - lastInput > 140) input *= 0.8;          // throttle closes when scroll events stop
    throttle += (input - throttle) * 0.35;

    const goal = IDLE + throttle * (1 - IDLE);
    if (throttle > 0.05 && rpm < goal) rpm += (goal - rpm) * GEAR_RATE[gear];
    else rpm += (Math.max(IDLE, goal) - rpm) * 0.05;  // engine braking: slower fall

    if (rpm > 0.88 && throttle > 0.55 && gear < 5) {   // shift up
      gear += 1; rpm -= 0.3; shiftUntil = now + 90;
    }
    if (throttle < 0.08) {
      if (!quietSince) quietSince = now;
      if (now - quietSince > 700) gear = 1;
    } else quietSince = 0;

    const running = now - lastInput < 900;
    const target = running ? 1 : started ? IDLE_LEVEL : 0;
    active += (target - active) * (running ? 0.25 : 0.06);
    apply(now);

    // Settled at idle: the oscillators keep sounding at the idle level; stop updating them.
    if (!running && Math.abs(active - target) < 0.003 && Math.abs(rpm - IDLE) < 0.002) {
      active = target; rpm = IDLE; gear = 1; throttle = 0; input = 0;
      apply(now);
      clearInterval(timer); timer = null;
    }
  }

  return {
    /** Scroll velocity in px/s (sign ignored) opens the throttle. */
    drive(v) {
      input = Math.min(1, Math.max(0, (Math.abs(v) - 150) / 2600)); // follows current speed: ease off = lift off
      lastInput = performance.now();
      started = true;
      if (!timer) timer = setInterval(tick, 30);
    },
    setLevel(l) { level = l; apply(performance.now()); }, // also while idling
    /**
     * Start-up roar: one short rev (about a second, including the fade), played once.
     * peak stays below the gear-shift point, so it is one clean rev.
     */
    ignite(peak = 0.8, hold = 550) {
      script = () => peak;
      scriptStart = performance.now();
      scriptEnd = scriptStart + hold;
      started = true;
      if (!timer) timer = setInterval(tick, 30);
    },
    /** Start-up spool: revs follow the loading counter (p 0..1), from idle up to a high rev. */
    spool(p) {
      input = 0.1 + 0.62 * p * p;
      lastInput = performance.now();
      if (!timer) timer = setInterval(tick, 30);
    },
  };
}
