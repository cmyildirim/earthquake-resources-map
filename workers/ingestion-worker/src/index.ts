/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	GAPI_TOKEN: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	SPREADSHEET_BUCKET: R2Bucket;
}

export interface PointEntry {
	cat: string,
	name: string,
	city: string,
	latitude: number,
	longtitude: number,
	address: string,
	contact: string,
	description: string,
	source: string
}

export default {

	async fetch(request: Request, env, ctx) {
		const documentUrl = new URL("https://sheets.googleapis.com/v4/spreadsheets/1fJVVy5GVSoF1BR9VBmijiMmSHaVrroqQN2rif0FmDCI/values/HariciVeriGirisi!A1:I1:append?valueInputOption=USER_ENTERED");
		const params = await request.json<PointEntry>();
		
		console.log(JSON.stringify(params));
		if (params) {
			const gapiRequestBody = {
				range: "HariciVeriGirisi!A1:I1",
				majorDimension: "ROWS",
				values: [
					[params.cat, params.name, params.city, params.latitude, params.longtitude, params.address, params.contact, params.description, params.source]
				]
			}
			const gapiToken = await env.GAPI_TOKEN.get("spreadsheet_scope");
			const googleResponse = await fetch(documentUrl, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${gapiToken}`
				},
				body: JSON.stringify(gapiRequestBody)
			});
			console.log(JSON.stringify(await googleResponse.json()))
		} else {
			return new Response("Bad request", {status: 400, headers: {
				'content-type': 'text'
			}});
		}
		return new Response();
	},

	async scheduled(event, env, ctx) {
		switch (event.cron) {
			case "*/1 * * * *":
				const url = new URL("https://docs.google.com/spreadsheets/d/1fJVVy5GVSoF1BR9VBmijiMmSHaVrroqQN2rif0FmDCI/gviz/tq?tqx=out:csv&sheet=Sheet1");
				const key = '/spread-sheet/csv'
				var response = await fetch(new Request(url))
				ctx.waitUntil(await env.SPREADSHEET_BUCKET.put(key, await response.text()));
				break;
			case "*/45 * * * *":
				const tokenUrl = new URL("https://obtain-gapi-access-token-fa.azurewebsites.net/api/ObtainToken");
				var tokenResponse = await fetch(new Request(tokenUrl));
				ctx.waitUntil(await env.GAPI_TOKEN.put("spreadsheet_scope", await tokenResponse.text()));
				break;
		}
	},
};
