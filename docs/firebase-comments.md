# Firebase Google comments: setup and operation

The blog now contains a Blogger-style discussion module at `assets/js/firebase-comments.js`.
It uses Firebase Authentication (Google provider) and Cloud Firestore while **the
website continues to be hosted by GitHub Pages**.

The frontend is installed but **not live until the site owner creates a Firebase
project, pastes its Web app configuration, and publishes the Firestore rules**.
A public reader sees a temporary setup message until then. Existing Utterances
comments remain accessible under "View earlier discussion on GitHub" and are
not automatically migrated.

## One-time Firebase Console setup

1. Open https://console.firebase.google.com/ and create a new project. The **Spark
   (no-cost)** plan is adequate for an early personal blog. Google Analytics is
   optional. You do **not** need Firebase Hosting.
2. In **Project settings > Your apps**, register a **Web** app. Copy the SDK
   configuration values into `assets/js/firebase-config.js`:
   - `apiKey`
   - `authDomain` (normally `YOUR_PROJECT.firebaseapp.com`)
   - `projectId`
   - `appId`

   These are public Firebase *Web SDK configuration* values, **not service-account
   credentials**. Never add an Admin SDK private key or service-account JSON to
   the GitHub Pages repository.

3. Under **Authentication > Sign-in method**, enable **Google** and configure the
   project support email as requested. In **Authentication > Settings >
   Authorized domains**, explicitly add:
   - `souravius1234.github.io`
   - `souravius234.in` and `www.souravius234.in` **only after those hosts
     are actually serving the website**.

   Authorized domains are hostnames (no `https://` or paths). Keep the Firebase
   project's own `firebaseapp.com` auth domain in its configuration. Google
   pop-up sign-in is used; pop-up restrictions can affect some mobile browsers.

4. Under **Firestore Database**, create the project's **default Cloud Firestore
   database** (native mode) in an appropriate region. The selected region is
   difficult to change later. Start with restrictive/production rules.
5. In **Firestore Database > Rules**, paste the exact contents of the root
   repository file `firestore.rules`, then **Publish**. Do not leave Firestore
   in open test mode. The rules allow anyone to read public comments but only
   authenticated, email-verified **Google** sign-ins to create a comment with
   server-generated time and their authenticated display name. Client updates and
   deletes are denied.
6. Commit the filled `firebase-config.js` to `main`. GitHub Pages will load
   the configured module without any change to your hosting.
7. Test at https://souravius1234.github.io/blog/mext-article.html:
   - Sign in using a Google account.
   - Add one test comment and a reply.
   - Check that a signed-out browser can read them.
   - Check that only Google-authenticated visitors can post.
   - Test mobile browsers and the custom domain once activated.

## Firestore data model

Each post has its own comments subcollection:

```
blogPosts/
  mext-article/
    comments/
      <generated-document-id>/
        uid: Google Firebase user UID
        authorName: Google display name
        body: plain text (max 2,000 characters)
        parentId: null | comment document ID
        createdAt: server timestamp
```

The browser uses DOM `textContent` for submitted content (no HTML rendering).
Visitors' email addresses are never written into comment documents. Their
display names and the comment text are publicly visible.

## Creating another blog article

1. Copy `blog/article-template.html` to `blog/NEW-SLUG.html`.
2. Change `data-comments-post="replace-with-article-slug"` to
   `data-comments-post="NEW-SLUG"`.
3. **Add the slug to the Firestore create rule**: currently
   `postId == 'mext-article'` is intentionally restricted to the active post.
   For example: `postId in ['mext-article', 'NEW-SLUG']`.
4. Publish the updated Firestore rules before announcing the new article.

## Moderation and limitations

- Under **Firebase Console > Firestore Database > Data**, inspect or delete a
  comment document to remove it from the public site. Updates/deletes from the
  web client are deliberately denied. There is no site-owner moderation UI yet.
- Comments appear immediately after posting. This first implementation has no
  approval queue, automatic profanity screening, server-side rate limits, or
  bot detection. **Google login alone is not anti-spam protection**. Consider
  Firebase App Check and server-side moderation if traffic grows.
- The interface loads the **100 most recent** comments per article and presents
  them in oldest-first order; older comments are not paginated yet.
- Each reply is attached to a top-level comment; replies are displayed one level
  deep for readability.
- Older GitHub/Utterances comments stay in the collapsible archive. They have
  **not been migrated** into Firestore.
- Firestore free quotas and auth policies can change. Check
  https://firebase.google.com/docs/firestore/pricing before increasing usage.
- For security, test rules with the **Firebase Emulator Suite** before deploying
  any changes to the permissions or data model.

## Troubleshooting

- **Google sign-in is not yet authorized**: add the exact website hostname to
  Firebase Authentication's Authorized domains.
- **Missing or insufficient permissions**: ensure the `firestore.rules` file
  was published, the project is correct, and Google Authentication is enabled.
- **The UI says Google commenting is being set up**: `firebase-config.js` still
  contains empty configuration values.
- **A popup does not appear**: check browser pop-up restrictions; on some mobile
  browsers Firebase pop-up authentication is limited. Moving to a redirect flow
  on GitHub Pages needs additional cross-origin considerations; see Firebase's
  redirect best-practices documentation.
