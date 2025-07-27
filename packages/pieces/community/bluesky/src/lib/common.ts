import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BLUESKY_BASE_URL = 'https://bsky.social';

export interface BlueskyAuth {
  username: string;
  appPassword: string;
}

export const createSession = async (auth: BlueskyAuth) => {
  const response = await httpClient.sendRequest<{ accessJwt: string; did: string }>({
    method: HttpMethod.POST,
    url: `${BLUESKY_BASE_URL}/xrpc/com.atproto.server.createSession`,
    body: {
      identifier: auth.username,
      password: auth.appPassword,
    },
  });
  return response.body;
};
