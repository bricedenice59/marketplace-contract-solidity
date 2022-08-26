import { createClient } from "urql";

const THEGRAPH_API_URL = process.env.NEXT_PUBLIC_THEGRAPH_API_URL;
const THEGRAPH_MULTISIG_API_URL = process.env.NEXT_PUBLIC_THEGRAPH_MUTLISIG_API_URL;

export const marketplaceTheGraphClient = createClient({ url: THEGRAPH_API_URL });
export const multiSigTheGraphClient = createClient({ url: THEGRAPH_MULTISIG_API_URL });
