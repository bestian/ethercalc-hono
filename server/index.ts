import { Hono } from "hono";

type Bindings = {
	ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/api/", (c) => {
	return c.json({ name: "Cloudflare" });
});

// 靜態資源交給 ASSETS
app.get("*", (c) => {
	return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
