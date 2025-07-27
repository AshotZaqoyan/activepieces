import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createPost } from './lib/actions/create-post';
import { likePost } from './lib/actions/like-post';
import { repostPost } from './lib/actions/repost-post';
import { findPost } from './lib/actions/find-post';
import { findThread } from './lib/actions/find-thread';
import { newPostByAuthor } from './lib/triggers/new-post-by-author';
import { newFollower } from './lib/triggers/new-follower';
import { newTimelinePosts } from './lib/triggers/new-timeline-posts';
import { newPostSearch } from './lib/triggers/search-post';

export const blueskyAuth = PieceAuth.CustomAuth({
  description: 'Provide your Bluesky username and app password.',
  props: {
    username: Property.ShortText({ displayName: 'Username', required: true }),
    appPassword: Property.SecretText({ displayName: 'App Password', required: true }),
  },
  required: true,
});

export const bluesky = createPiece({
  displayName: 'Bluesky',
  description: 'Decentralized social network',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bluesky.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['community'],
  auth: blueskyAuth,
  actions: [
    createPost,
    likePost,
    repostPost,
    findPost,
    findThread,
    createCustomApiCallAction({
      baseUrl: () => 'https://bsky.social/xrpc',
      auth: blueskyAuth,
      authMapping: async (auth) => {
        const { createSession } = await import('./lib/common');
        const session = await createSession(auth as any);
        return { Authorization: `Bearer ${session.accessJwt}` };
      },
    }),
  ],
  triggers: [newPostByAuthor, newFollower, newTimelinePosts, newPostSearch],
});
