// A lightweight Blogger-style discussion panel for static GitHub Pages articles.
// The Firebase project must be configured in firebase-config.js before activation.
import { firebaseConfig } from './firebase-config.js';

const mount = document.querySelector('[data-comments-post]');
if (mount) {
  const configured = ['apiKey', 'authDomain', 'projectId', 'appId']
    .every((key) => typeof firebaseConfig[key] === 'string' && firebaseConfig[key].trim());

  if (!configured) {
    mount.innerHTML = '<p class="comments-notice">Google commenting is being set up. Earlier GitHub discussion is available below.</p>';
  } else {
    initializeComments(mount).catch((error) => {
      console.error('Firebase comments could not start:', error);
      mount.innerHTML = '<p class="comments-notice" role="status">Comments are temporarily unavailable. Please try again later.</p>';
    });
  }
}

async function initializeComments(mount) {
  const version = '12.19.0';
  const [{ initializeApp }, authSdk, firestoreSdk] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`)
  ]);

  const { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } = authSdk;
  const {
    getFirestore, collection, query, orderBy, limit,
    onSnapshot, addDoc, serverTimestamp
  } = firestoreSdk;

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const postId = mount.dataset.commentsPost;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(postId || '')) {
    throw new Error('Invalid blog post identifier');
  }
  const comments = collection(db, 'blogPosts', postId, 'comments');
  let currentUser = null;
  let replyTo = null;
  let loadedComments = [];

  mount.innerHTML = `
    <div class="comments-intro">
      <span data-comment-count aria-live="polite">Loading discussion…</span>
      <span class="comments-intro-note">Your Google name will be visible with your comments.</span>
    </div>
    <div class="comment-composer glass-card">
      <div class="comment-user">
        <span class="comment-avatar" aria-hidden="true">G</span>
        <span class="comment-identity" data-comment-identity>Sign in with Google to comment or reply.</span>
        <button class="comment-button comment-signin" type="button" data-comment-signin>Continue with Google</button>
        <button class="comment-button comment-signout" type="button" data-comment-signout hidden>Sign out</button>
      </div>
      <form data-comment-form hidden>
        <div class="comment-replying" data-comment-replying hidden>
          <span data-comment-reply-label></span>
          <button type="button" data-comment-cancel aria-label="Cancel reply">Cancel</button>
        </div>
        <label class="comment-field-label" for="comment-body">Join the discussion</label>
        <textarea id="comment-body" name="body" rows="4" maxlength="2000" required
          placeholder="Share a question or thought…"></textarea>
        <div class="comment-composer-footer">
          <small>Be respectful. Comments are public and moderated by the site owner.</small>
          <button class="comment-button comment-submit" type="submit" data-comment-submit>Post comment</button>
        </div>
      </form>
    </div>
    <p class="comments-status" data-comment-status role="status" aria-live="polite"></p>
    <div class="comments-list" data-comment-list aria-live="polite"></div>
  `;

  const signInButton = mount.querySelector('[data-comment-signin]');
  const signOutButton = mount.querySelector('[data-comment-signout]');
  const identity = mount.querySelector('[data-comment-identity]');
  const avatar = mount.querySelector('.comment-avatar');
  const form = mount.querySelector('[data-comment-form]');
  const textarea = mount.querySelector('#comment-body');
  const status = mount.querySelector('[data-comment-status]');
  const list = mount.querySelector('[data-comment-list]');
  const count = mount.querySelector('[data-comment-count]');
  const replyBanner = mount.querySelector('[data-comment-replying]');
  const replyLabel = mount.querySelector('[data-comment-reply-label]');
  const submit = mount.querySelector('[data-comment-submit]');
  const archive = mount.closest('.blog-comments')?.querySelector('.comment-archive');

  function setStatus(message) {
    status.textContent = message || '';
  }

  function clearReply() {
    replyTo = null;
    replyBanner.hidden = true;
    replyLabel.textContent = '';
  }

  function dateLabel(value) {
    if (!value?.toDate) return 'Just now';
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    }).format(value.toDate());
  }

  function make(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function makeComment(item, isReply) {
    const card = make('article', isReply ? 'comment-card comment-reply' : 'comment-card');
    const header = make('div', 'comment-card-header');
    const initial = make('span', 'comment-avatar', (item.authorName || 'G').trim().slice(0, 1).toUpperCase());
    initial.setAttribute('aria-hidden', 'true');
    const author = make('span', 'comment-author', item.authorName || 'Google user');
    const time = make('time', 'comment-date', dateLabel(item.createdAt));
    if (item.createdAt?.toDate) time.dateTime = item.createdAt.toDate().toISOString();
    header.append(initial, author, time);
    card.append(header, make('p', 'comment-body', item.body));

    const actions = make('div', 'comment-actions');
    const reply = make('button', 'comment-reply-button', 'Reply');
    reply.type = 'button';
    reply.addEventListener('click', () => {
      if (!currentUser) {
        setStatus('Sign in with Google to reply.');
        signInButton.focus();
        return;
      }
      replyTo = item.parentId || item.id; // Keep replies one level deep.
      replyLabel.textContent = 'Replying to ' + (item.authorName || 'this comment');
      replyBanner.hidden = false;
      setStatus('');
      form.hidden = false;
      textarea.focus();
    });
    actions.append(reply);
    card.append(actions);
    return card;
  }

  function render() {
    count.textContent = loadedComments.length === 1
      ? '1 comment' : loadedComments.length + ' comments';
    list.replaceChildren();
    if (!loadedComments.length) {
      list.append(make('p', 'comments-empty', 'No comments yet. Be the first to start the discussion.'));
      return;
    }
    // A descending Firestore query keeps the latest 100 comments available;
    // present them oldest first to make threads easier to read.
    const sorted = [...loadedComments].reverse();
    const replies = new Map();
    const ids = new Set(sorted.map((item) => item.id));
    for (const item of sorted) {
      if (item.parentId && ids.has(item.parentId)) {
        const group = replies.get(item.parentId) || [];
        group.push(item);
        replies.set(item.parentId, group);
      }
    }
    for (const item of sorted) {
      if (item.parentId && ids.has(item.parentId)) continue;
      const thread = make('div', 'comment-thread');
      thread.append(makeComment(item, false));
      const children = replies.get(item.id) || [];
      if (children.length) {
        const repliesWrap = make('div', 'comment-replies');
        children.forEach((child) => repliesWrap.append(makeComment(child, true)));
        thread.append(repliesWrap);
      }
      list.append(thread);
    }
    if (loadedComments.length === 100) {
      list.append(make('p', 'comments-notice', 'Showing the 100 most recent comments.'));
    }
  }

  signInButton.addEventListener('click', async () => {
    signInButton.disabled = true;
    setStatus('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error('Google sign-in failed:', error);
        setStatus(error.code === 'auth/unauthorized-domain'
          ? 'Google sign-in is not yet authorized for this website.'
          : 'Could not sign in. Check pop-up permissions or try another browser.');
      }
    } finally {
      signInButton.disabled = false;
    }
  });

  signOutButton.addEventListener('click', async () => {
    try {
      await signOut(auth);
      clearReply();
      setStatus('');
    } catch (error) {
      console.error('Sign out failed:', error);
      setStatus('Could not sign out. Please retry.');
    }
  });

  mount.querySelector('[data-comment-cancel]').addEventListener('click', clearReply);
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    signInButton.hidden = Boolean(user);
    signOutButton.hidden = !user;
    form.hidden = !user;
    identity.textContent = user?.displayName || (user ? 'Google account' : 'Sign in with Google to comment or reply.');
    avatar.textContent = (user?.displayName || 'G').trim().slice(0, 1).toUpperCase();
    if (!user) clearReply();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const user = auth.currentUser;
    const body = textarea.value.trim();
    if (!user) {
      setStatus('Sign in with Google to post a comment.');
      return;
    }
    if (!body || body.length > 2000) {
      setStatus('Enter a comment between 1 and 2,000 characters.');
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Posting…';
    setStatus('');
    try {
      await addDoc(comments, {
        uid: user.uid,
        authorName: user.displayName || 'Google user',
        body,
        parentId: replyTo,
        createdAt: serverTimestamp()
      });
      textarea.value = '';
      clearReply();
      setStatus('Your comment has been posted.');
    } catch (error) {
      console.error('Unable to post comment:', error);
      setStatus('Your comment could not be posted. Please retry.');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Post comment';
    }
  });

  onSnapshot(
    query(comments, orderBy('createdAt', 'desc'), limit(100)),
    (snapshot) => {
      loadedComments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      count.textContent = '';
      render();
      if (archive) archive.classList.add('has-firebase-comments');
    },
    (error) => {
      console.error('Unable to load Firebase comments:', error);
      count.textContent = 'Discussion unavailable';
      setStatus('Comments are unavailable right now. Please try again later.');
    }
  );
}
