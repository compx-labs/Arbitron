import { DeflexOrderRouterClient } from '@deflex/deflex-sdk-js';
import { ENV } from '../constants';


export const deflexRouterClient = DeflexOrderRouterClient.fetchMainnetClient(
    ENV.ALGOD_API_URL,
    '',
    '',
    'YEKSJM7IYDREGILKVHUU2NV6LOUIM6UJFT6Q22I5YPIRXSBKOVEUGUAPL4',
    undefined,
    ENV.DEFLEX_API_KEY
);

