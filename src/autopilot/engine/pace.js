// Phone pace. The follower listens every 0.25 s (as on the desktop) while the phone keeps up; a
// phone whose model passes take more than 60% of that steps to every 0.5 s, then every 1 s
// (benchmark, 14 recited clips + 2 sung: 87.9% / 86.2% / 81.0% of time on the right line). The
// follower scales its dwells to the hop it is given, so they keep their meaning in seconds.
const HOPS = [0.25, 0.5, 1.0];
let passMs = null; // running average of model pass time

module.exports = {
  current: () => ({ name: "phone", aligned: false }),
  windowS: (kind, own) => own,
  hopS: (kind, own) => HOPS.find((h) => h >= own && (passMs === null || passMs < 600 * h)) || 1.0,
  onBeat: () => false,
  notePass: (ms) => {
    passMs = passMs === null ? ms : 0.8 * passMs + 0.2 * ms;
  },
};
