const normalizeRoot = (value) => {
  if (!value || value === '.') return '.';
  return value.replace(/\/$/, '');
};

const joinPath = (root, path) => `${normalizeRoot(root)}/${path}`.replace(/^\.\//, './');

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const root = normalizeRoot(this.getAttribute('root'));
    const current = this.getAttribute('current') || '';
    const links = [
      ['home', 'Home', joinPath(root, 'index.html')],
      ['about', 'About Me', joinPath(root, 'about.html')],
      ['research', 'Research', joinPath(root, 'research.html')],
      ['projects', 'Projects', joinPath(root, 'projects.html')],
      ['contact', 'Contact', joinPath(root, 'contact.html')],
      ['cv', 'CV', joinPath(root, 'Docs/sourav_cv_2025.pdf')]
    ];

    const navLinks = links.map(([key, label, href]) => {
      const currentAttr = key === current ? ' aria-current="page"' : '';
      const externalAttr = key === 'cv' ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${href}"${currentAttr}${externalAttr}>${label}</a>`;
    }).join('');

    this.innerHTML = `
      <header class="site-header">
        <div class="site-nav-shell">
          <a class="site-logo" href="${joinPath(root, 'index.html')}" aria-label="Sourav Ghosh home">
            <img src="${joinPath(root, 'images/SGLogodark.png')}" alt="Sourav Ghosh logo">
          </a>
          <nav class="site-nav" aria-label="Primary navigation">${navLinks}</nav>
          <button class="mobile-menu-button" type="button" aria-expanded="false" aria-controls="mobile-navigation">Menu</button>
        </div>
        <nav id="mobile-navigation" class="mobile-nav" aria-label="Mobile navigation">${navLinks}</nav>
      </header>`;

    const button = this.querySelector('.mobile-menu-button');
    const menu = this.querySelector('.mobile-nav');
    button?.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
  }
}

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="site-footer">
        <div class="site-footer-links">
          <a href="mailto:sg.souravghosh2002@gmail.com">Email</a>
          <a href="https://github.com/souravius1234" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/sourav-ghosh-065a851a5/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://www.instagram.com/souravius234/" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
        <div>&copy; ${year} Sourav Ghosh. Inspired by the Cosmos.</div>
      </footer>`;
  }
}

customElements.define('site-header', SiteHeader);
customElements.define('site-footer', SiteFooter);

const revealSections = () => {
  const sections = document.querySelectorAll('.section-container');
  if (!('IntersectionObserver' in window)) {
    sections.forEach((section) => section.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  sections.forEach((section) => observer.observe(section));
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', revealSections, { once: true });
} else {
  revealSections();
}
