export const loadManifest = async () => {
  const response = await fetch('./data/manifest.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load manifest: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

export const hasStudyData = (manifest) => Object.values(manifest.datasets || {}).some(Boolean);
