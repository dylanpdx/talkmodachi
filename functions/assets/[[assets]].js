export async function onRequest(context) {
  const url = new URL(context.request.url);
  let key = url.pathname;
  
  if (key.startsWith('/assets/')) {
      key = key.slice(8); // Remove '/assets/'
  } else if (key.startsWith('/assets')) {
      key = key.slice(7); // Remove '/assets'
  } else if (key.startsWith('/')) {
      key = key.slice(1); // remove leading slash
  }
  
  const obj = await context.env.TM_ASSETS.get(key);
  if (obj === null) {
    return new Response("Not found", { status: 404 });
  }
  
  // Determine content type based on file extension
  let contentType = "application/octet-stream"; // Default content type
  if (key.endsWith('.js')) {
    contentType = "application/javascript";
  } else if (key.endsWith('.data')) {
    contentType = "application/octet-stream";
  } else if (key.endsWith('.wasm')) {
    contentType = "application/wasm";
  } else if (key.endsWith('.css')){
    contentType = "text/css";
  }
  
  return new Response(obj.body, {
    headers: {
      "Content-Type": contentType,
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "test": "test",
    }
  });
}