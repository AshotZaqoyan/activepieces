import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2AuthorizationMethod,
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { appendToPage } from './lib/actions/append-to-page';
import { createDatabaseItem } from './lib/actions/create-database-item';
import { createPage } from './lib/actions/create-page';
import { updateDatabaseItem } from './lib/actions/update-database-item';
import { newDatabaseItem } from './lib/triggers/new-database-item';
import { updatedDatabaseItem } from './lib/triggers/updated-database-item';
import { newComment } from './lib/triggers/new-comment';
import { updatedPage } from './lib/triggers/updated-page';
import { findDatabaseItem } from './lib/actions/find-item';
import { getPageOrBlockChildren } from './lib/actions/get-page-or-block-children';
import { archiveDatabaseItem } from './lib/actions/archive-database-item';
import { restoreDatabaseItem } from './lib/actions/restore-database-item';
import { addComment } from './lib/actions/add-comment';
import { retrieveDatabase } from './lib/actions/retrieve-database';
import { getPageComments } from './lib/actions/get-page-comments';
import { findPage } from './lib/actions/find-page';

export const notionAuth = PieceAuth.OAuth2({
  authUrl: 'https://api.notion.com/v1/oauth/authorize',
  tokenUrl: 'https://api.notion.com/v1/oauth/token',
  scope: [],
  extra: {
    owner: 'user',
  },
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  required: true,
});

export const notion = createPiece({
  displayName: 'Notion',
  description: 'The all-in-one workspace',
  logoUrl: 'https://cdn.activepieces.com/pieces/notion.png',
  categories: [PieceCategory.PRODUCTIVITY],
  minimumSupportedRelease: '0.30.0',
  authors: [
    'ShayPunter',
    'kishanprmr',
    'MoShizzle',
    'khaledmashaly',
    'abuaboud',
    'AdamSelene',
    'ezhil56x',
    'onyedikachi-david',
  ],
  auth: notionAuth,
  actions: [
    createDatabaseItem,
    updateDatabaseItem,
    findDatabaseItem,
    createPage,
    appendToPage,
    getPageOrBlockChildren,
    archiveDatabaseItem,
    restoreDatabaseItem,
    addComment,
    retrieveDatabase,
    getPageComments,
    findPage,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.notion.com/v1',
      auth: notionAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newDatabaseItem, updatedDatabaseItem, newComment, updatedPage],
});
