import { Property, createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { blueskyAuth } from '../..';
import { BLUESKY_BASE_URL, createSession } from '../common';

export const findThread = createAction({
  auth: blueskyAuth,
  name: 'bluesky_find_thread',
  displayName: 'Find Thread',
  description: 'Retrieve a thread by post URI',
  props: {
    uri: Property.ShortText({
      displayName: 'Thread URI',
      required: true,
    }),
  },
  async run(context) {
    const session = await createSession(context.auth);
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${BLUESKY_BASE_URL}/xrpc/app.bsky.feed.getPostThread?uri=${context.propsValue.uri}&depth=100`,
      headers: { Authorization: `Bearer ${session.accessJwt}` },
    });
    return res.body;
  },
});
