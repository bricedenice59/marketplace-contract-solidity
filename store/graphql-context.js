import { createClient } from "urql";

const THEGRAPH_API_URL = process.env.NEXT_PUBLIC_THEGRAPH_API_URL;

export const client = createClient({ url: THEGRAPH_API_URL });
