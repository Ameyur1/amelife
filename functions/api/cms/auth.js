import { handleAuth } from '../../../server/cms-oauth.js';

export const onRequest = ({ request, env }) => handleAuth(request, env);
