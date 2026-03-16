import { Hono } from "hono";
import type { Bindings } from "../index";

export const newRoute = new Hono<{ Bindings: Bindings }>();

newRoute.get("/_new", async (c) => {
	const roomId = crypto.randomUUID();

	const id = c.env.ROOM_DO.idFromName(roomId);
	const stub = c.env.ROOM_DO.get(id);

	await stub.fetch(
		new Request(new URL("/init", c.req.url).toString(), {
			method: "POST",
		}),
	);

	return c.redirect(`/${roomId}`, 302);
});

