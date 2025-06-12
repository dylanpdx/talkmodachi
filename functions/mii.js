export async function onRequest(context) {
	let cache = caches.default;

	let cresponse = await cache.match(context.request);
	if (cresponse) {
		return new Response(cresponse.body, {
			status: cresponse.status,
			headers: cresponse.headers,
		});
	}

	const nurl=new URL(context.request.url)
	const requestUrl = new URL("https://studio.mii.nintendo.com/miis/image.png")

	for (const [key, value] of nurl.searchParams.entries()) {
		requestUrl.searchParams.set(key, value);
	}

	const request = new Request(requestUrl, {
		method: context.request.method,
		headers: context.request.headers,
		body: context.request.body,
	});

	try {
		const response = await fetch(request);
		const finalResponse = new Response(response.body, {
			status: response.status,
			headers: response.headers,
		});
		finalResponse.headers.set("Cache-Control", "max-age=86400, public");
		await cache.put(context.request, finalResponse.clone());
		return finalResponse;
	} catch (error) {
		return new Response("Error", { status: 500 });
	}
}