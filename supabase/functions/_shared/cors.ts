export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(obj: any, status = 200) {
  const body = JSON.stringify(obj);
  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders,
  } as Record<string, string>;
  return new Response(body, { status, headers });
}
