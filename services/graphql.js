import { shopify } from "./shopify.js";
import { logWrite } from "./audit.js";

export async function runGraphQL(session, { query, variables = {}, dry_run = false, skill_id = null }) {
  const isMutation = /^\s*mutation\b/i.test(query);

  if (isMutation && dry_run) {
    return {
      dry_run: true,
      skipped: true,
      message: "Mutation skipped — dry_run is true. Remove ?dry_run=true to execute.",
      query,
      variables,
    };
  }

  const client = new shopify.api.clients.Graphql({ session });
  const response = await client.query({ data: { query, variables } });
  const body = response.body;

  if (isMutation) {
    logWrite({
      shop: session.shop,
      session_id: session.id,
      method: "GRAPHQL_MUTATION",
      path: skill_id ? `skills/${skill_id}` : "graphql",
      resource: "graphql",
      resource_id: null,
      payload: { query, variables },
    });
  }

  return body;
}
