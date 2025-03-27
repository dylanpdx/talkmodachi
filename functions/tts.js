export async function onRequest(context) {
	const API_URL = context.env.API_URL;

	if (!API_URL) {
		return new Response("Not configured", { status: 500 });
	}

	const request = new Request(API_URL, {
		method: context.request.method,
		headers: context.request.headers,
		body: context.request.body,
	});

	try {
		const response = await fetch(request);
		return new Response(response.body, {
			status: response.status,
			headers: response.headers,
		});
	} catch (error) {
		return new Response("Error", { status: 500 });
	}
}