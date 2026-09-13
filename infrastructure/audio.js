(function (root) {
  "use strict";
  let enabled = false,
    context;
  function play(kind = "good") {
    if (!enabled) return;
    try {
      context ||= new (root.AudioContext || root.webkitAudioContext)();
      context.resume().catch(() => {});
      const now = context.currentTime;
      [0, 0.1].forEach((delay, i) => {
        const osc = context.createOscillator(),
          gain = context.createGain();
        osc.type = kind === "stamp" ? "triangle" : "sine";
        osc.frequency.value = kind === "bad" ? [220, 160][i] : [520, 780][i];
        gain.gain.setValueAtTime(0.035, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.14);
        osc.connect(gain);
        gain.connect(context.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.16);
      });
    } catch {
      enabled = false;
    }
  }
  (root.LB ||= {}).Audio = {
    play,
    toggle: () => {
      enabled = !enabled;
      play();
      return enabled;
    },
  };
})(globalThis);
