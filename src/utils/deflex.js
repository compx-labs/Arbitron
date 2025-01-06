import { DeflexOrderRouterClient } from '@deflex/deflex-sdk-js';
import {ALGO_CLIENT_SERVER_URL, DEFLEX_API_KEY} from './constants.js';

export const deflexRouterClient = DeflexOrderRouterClient.fetchMainnetClient(
    ALGO_CLIENT_SERVER_URL,
    '',
    '',
    'YEKSJM7IYDREGILKVHUU2NV6LOUIM6UJFT6Q22I5YPIRXSBKOVEUGUAPL4',
    undefined,
    DEFLEX_API_KEY
);