// Capture a real frame from the graduation video for its preview poster.
// The preview is generated from the same-origin MP4 without autoplay or sound.
(() => {
  const player = document.querySelector('video[data-graduation-preview]');
  const source = player?.querySelector('source');
  if (!player || !source) return;

  const preview = document.createElement('video');
  preview.muted = true;
  preview.playsInline = true;
  preview.preload = 'auto';
  preview.src = source.src;
  let complete = false;

  const release = () => {
    preview.removeAttribute('src');
    preview.load();
  };
  preview.addEventListener('loadedmetadata', () => {
    if (preview.duration > 0) {
      preview.currentTime = Math.min(1, preview.duration / 3);
    } else {
      release();
    }
  }, { once: true });

  preview.addEventListener('seeked', () => {
    if (complete) return;
    complete = true;
    try {
      const canvas = document.createElement('canvas');
      const width = Math.min(848, preview.videoWidth || 848);
      canvas.width = width;
      canvas.height = Math.round(width * (preview.videoHeight || 384) / (preview.videoWidth || 848));
      const ctx = canvas.getContext('2d');
      if (ctx && preview.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
        player.poster = canvas.toDataURL('image/jpeg', 0.82);
      }
    } catch (error) {
      console.warn('Graduation video preview could not be generated:', error);
    } finally {
      release();
    }
  }, { once: true });

  preview.addEventListener('error', release, { once: true });
})();
