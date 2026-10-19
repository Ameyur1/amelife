import { handleCallback } from '../../../server/cms-oauth.js';

export const onRequest = ({ request, env }) => handleCallback(request, env);
