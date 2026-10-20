import { handleGitHubProxy } from '../../../server/github-proxy.js';

export const onRequest = ({ request }) => handleGitHubProxy(request);

