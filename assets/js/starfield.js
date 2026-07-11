import * as THREE from 'three';

const canvas = document.querySelector('#bg-canvas');

if (canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2200);
  camera.position.z = 100;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const count = Number(canvas.dataset.starCount || 5000);
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    let x;
    let y;
    let z;
    do {
      x = (Math.random() - 0.5) * 2000;
      y = (Math.random() - 0.5) * 2000;
      z = (Math.random() - 0.5) * 2000;
    } while (Math.hypot(x, y, z) < 100);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1,
    opacity: 0.72,
    transparent: true,
    sizeAttenuation: true
  });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);

  const animate = () => {
    requestAnimationFrame(animate);
    stars.rotation.y += 0.00035;
    renderer.render(scene, camera);
  };

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
