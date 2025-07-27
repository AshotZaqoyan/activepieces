import { Property, createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { blueskyAuth } from '../..';
import { BLUESKY_BASE_URL, createSession } from '../common';

export const repostPost = createAction({
  auth: blueskyAuth,
  name: 'bluesky_repost_post',
  displayName: 'Repost Post',
  description: 'Repost a post by URI',
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
        collection: 'app.bsky.feed.repost',
        record: {
          $type: 'app.bsky.feed.repost',
          subject: context.propsValue.uri,
          createdAt: new Date().toISOString(),
        },
      },
    });
  },
});
