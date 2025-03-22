export async function onRequest(context) {
  const url = new URL(context.request.url);
  let key = url.pathname;
  
  if (key.startsWith('/assets/')) {
      key = key.slice(8); // Remove '/assets/'
  } else if (key.startsWith('/assets')) {
      key = key.slice(7); // Remove '/assets'
  } else if (key.startsWith('/')) {
      key = key.slice(1); // Just remove leading slash
  }
  
  const obj = await context.env.TM_ASSETS.get(key);
  if (obj === null) {
    return new Response("Not found: "+key, { status: 404 });
  }
  
  return new Response(obj.body, {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  });
}