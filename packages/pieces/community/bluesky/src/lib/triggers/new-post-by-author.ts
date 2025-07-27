import { DedupeStrategy, HttpMethod, Polling, httpClient, pollingHelper } from '@activepieces/pieces-common';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../..';
import { BLUESKY_BASE_URL, createSession } from '../common';

interface FeedItem {
  post: unknown;
  indexedAt: string;
}

const polling: Polling<{accessJwt:string}, { author: string; limit: number }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const res = await httpClient.sendRequest<{ feed: FeedItem[] }>({
      method: HttpMethod.GET,
      url: `${BLUESKY_BASE_URL}/xrpc/app.bsky.feed.getAuthorFeed?actor=${propsValue.author}&limit=${propsValue.limit}`,
      headers: { Authorization: `Bearer ${auth.accessJwt}` },
    });
    return res.body.feed.map((item) => ({
      epochMilliSeconds: Date.parse(item.indexedAt),
      data: item,
    }));
  },
};

export const newPostByAuthor = createTrigger({
  auth: blueskyAuth,
  name: 'bluesky_new_post_by_author',
  displayName: 'New Posts by Author',
  description: 'Fires when the selected author creates a new post',
  type: TriggerStrategy.POLLING,
  props: {
    author: Property.ShortText({ displayName: 'Author Handle', required: true }),
    limit: Property.Number({ displayName: 'Limit', required: false, defaultValue: 10 }),
  },
  sampleData: {},
  async onEnable(context) {
    const session = await createSession(context.auth);
    await pollingHelper.onEnable(polling, { auth: session, store: context.store, propsValue: context.propsValue });
  },
  async onDisable(context) {
    const session = await createSession(context.auth);
    await pollingHelper.onDisable(polling, { auth: session, store: context.store, propsValue: context.propsValue });
  },
  async run(context) {
    const session = await createSession(context.auth);
    return pollingHelper.poll(polling, { auth: session, store: context.store, propsValue: context.propsValue, files: context.files });
  },
  async test(context) {
    const session = await createSession(context.auth);
    return pollingHelper.test(polling, { auth: session, store: context.store, propsValue: context.propsValue, files: context.files });
  },
});
