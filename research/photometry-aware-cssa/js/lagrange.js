const dPotentialDx = (x, mu) => {
  const r1 = Math.abs(x + mu);
  const r2 = Math.abs(x - (1 - mu));
  return x - ((1 - mu) * (x + mu)) / (r1 ** 3) - (mu * (x - (1 - mu))) / (r2 ** 3);
};

const bisectRoot = (fn, lower, upper, tolerance = 1e-13, maxIterations = 200) => {
  let a = lower;
  let b = upper;
  let fa = fn(a);
  let fb = fn(b);

  if (!Number.isFinite(fa) || !Number.isFinite(fb) || fa * fb > 0) {
    throw new Error(`Root is not bracketed on [${lower}, ${upper}]`);
  }

  for (let i = 0; i < maxIterations; i += 1) {
    const c = 0.5 * (a + b);
    const fc = fn(c);
    if (Math.abs(fc) < tolerance || Math.abs(b - a) < tolerance) return c;
    if (fa * fc <= 0) {
      b = c;
      fb = fc;
    } else {
      a = c;
      fa = fc;
    }
  }

  return 0.5 * (a + b);
};

export const computeLagrangePoints = (mu) => {
  const eps = 1e-8;
  const earthX = -mu;
  const moonX = 1 - mu;
  const f = (x) => dPotentialDx(x, mu);

  const l1 = bisectRoot(f, earthX + eps, moonX - eps);
  const l2 = bisectRoot(f, moonX + eps, 2.5);
  const l3 = bisectRoot(f, -2.5, earthX - eps);

  return Object.freeze({
    L1: { x: l1, y: 0, z: 0 },
    L2: { x: l2, y: 0, z: 0 },
    L3: { x: l3, y: 0, z: 0 },
    L4: { x: 0.5 - mu, y: Math.sqrt(3) / 2, z: 0 },
    L5: { x: 0.5 - mu, y: -Math.sqrt(3) / 2, z: 0 }
  });
};
