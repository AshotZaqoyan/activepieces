import { Property, createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { blueskyAuth } from '../..';
import { BLUESKY_BASE_URL, createSession } from '../common';

export const findPost = createAction({
  auth: blueskyAuth,
  name: 'bluesky_find_post',
  displayName: 'Find Post',
  description: 'Retrieve a post by URI',
  props: {
    uri: Property.ShortText({
      displayName: 'Post URI',
      required: true,
    }),
  },
  async run(context) {
    const session = await createSession(context.auth);
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${BLUESKY_BASE_URL}/xrpc/app.bsky.feed.getPostThread?uri=${context.propsValue.uri}`,
      headers: { Authorization: `Bearer ${session.accessJwt}` },
    });
    return res.body;
  },
});
