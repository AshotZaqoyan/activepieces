import { Property, createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { blueskyAuth } from '../..';
import { BLUESKY_BASE_URL, createSession } from '../common';

export const createPost = createAction({
  auth: blueskyAuth,
  name: 'bluesky_create_post',
  displayName: 'Create Post',
  description: 'Publish a new post on Bluesky',
  props: {
    text: Property.LongText({
      displayName: 'Text',
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
        collection: 'app.bsky.feed.post',
        record: {
          $type: 'app.bsky.feed.post',
          text: context.propsValue.text,
          createdAt: new Date().toISOString(),
        },
      },
    });
  },
});
