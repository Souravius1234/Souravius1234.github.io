const list = document.getElementById('blog-posts');
const filter = document.getElementById('blog-category');
const make = (tag, className, value) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
};
const renderEmpty = (title, description) => {
  list.replaceChildren();
  const wrapper = make('div', 'glass-card blog-empty');
  wrapper.append(make('h3', '', title), make('p', 'text-muted', description));
  list.append(wrapper);
};
const formatDate = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { year:'numeric',month:'long',day:'numeric',timeZone:'UTC' }).format(new Date(Date.UTC(year,month-1,day)));
};
const render = (posts, category) => {
  const selected = category === 'all' ? posts : posts.filter((post) => post.category === category);
  if (!selected.length) {
    renderEmpty(posts.length ? 'No articles in this category' : 'Articles coming soon',
      posts.length ? 'Choose a different topic to explore the articles.' : 'The blog is ready. Articles will appear here when published.');
    return;
  }
  list.replaceChildren();
  for (const post of selected) {
    const anchor = make('a', 'glass-card blog-entry');
    anchor.href = 'blog/' + encodeURIComponent(post.slug) + '.html';
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    const meta = make('div', 'blog-entry-meta');
    meta.append(make('time', '', formatDate(post.date)), make('span', '', '·'), make('span', '', post.category));
    meta.firstChild.dateTime = post.date;
    anchor.append(meta, make('h3', '', post.title), make('p', '', post.excerpt), make('span','blog-entry-link','Read article →'));
    list.append(anchor);
  }
};
try {
  const response = await fetch('blog/posts.json');
  if (!response.ok) throw new Error('Could not load articles');
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Invalid article index');
  const posts = data.filter((post) => typeof post.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)
    && typeof post.title === 'string' && typeof post.excerpt === 'string'
    && typeof post.category === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(post.date))
    .sort((a,b) => b.date.localeCompare(a.date));
  const categories = [...new Set(posts.map((post) => post.category))].sort();
  for (const category of categories) {
    const option = make('option', '', category); option.value = category; filter.append(option);
  }
  filter.addEventListener('change', () => render(posts, filter.value));
  render(posts, 'all');
} catch (error) {
  renderEmpty('Unable to load articles', 'Please refresh the page and try again.');
  console.error('Blog index error:', error);
}
