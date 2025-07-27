import { Property, createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { blueskyAuth } from '../..';
import { BLUESKY_BASE_URL, createSession } from '../common';

export const likePost = createAction({
  auth: blueskyAuth,
  name: 'bluesky_like_post',
  displayName: 'Like Post',
  description: 'Like a post by URI',
  props: {
    uri: Property.ShortText({
      displayName: 'Post URI',
      required: true,
    }),
  },
  async run(context) {
    const session = await createSession(context.auth);
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BLUESKY_BASE_URL}/xrpc/com.atproto.repo.createRecord`,
      headers: { Authorization: `Bearer ${session.accessJwt}` },
      body: {
        repo: session.did,
        collection: 'app.bsky.feed.like',
        record: {
          $type: 'app.bsky.feed.like',
          subject: context.propsValue.uri,
          createdAt: new Date().toISOString(),
        },
      },
    });
  },
});
