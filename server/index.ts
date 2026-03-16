import { Hono } from "hono";
import { newRoute } from "./api_outer/_new";

export type Bindings = {
	ASSETS: Fetcher;
	ROOM_DO: DurableObjectNamespace;
};

export type RoomSnapshot = string;

export type RoomCommandLogEntry = {
	cmd: string;
	ts: number;
	user?: string;
};

export type RoomChatMessage = {
	user: string;
	msg: string;
	ts: number;
};

export type RoomAuditEntry = {
	user?: string;
	action: string;
	ts: number;
};

export type RoomECellMap = Record<string, string>;

export type RoomCronEntry = {
	cell: string;
	times: number[];
};

export type RoomStateData = {
	roomId: string;
	snapshot: RoomSnapshot | null;
	log: RoomCommandLogEntry[];
	audit: RoomAuditEntry[];
	chat: RoomChatMessage[];
	ecell: RoomECellMap;
	cron: RoomCronEntry[];
	updatedAt: number;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/api/", (c) => {
	return c.json({ name: "Cloudflare" });
});

// 明確註冊外部 API 路由
app.route("/", newRoute);

// 靜態資源交給 ASSETS
app.get("*", (c) => {
	return c.env.ASSETS.fetch(c.req.raw);
});

export class RoomDurableObject {
	private state: DurableObjectState;
	private data: RoomStateData | null = null;

	constructor(state: DurableObjectState) {
		this.state = state;
	}

	private async load(): Promise<RoomStateData> {
		if (this.data) return this.data;
		const stored = await this.state.storage.get<RoomStateData>("room");
		if (stored) {
			this.data = stored;
			return stored;
		}
		const roomId = this.state.id.toString();
		const now = Date.now();
		this.data = {
			roomId,
			snapshot: null,
			log: [],
			audit: [],
			chat: [],
			ecell: {},
			cron: [],
			updatedAt: now,
		};
		return this.data;
	}

	private async persist() {
		if (!this.data) return;
		this.data.updatedAt = Date.now();
		await this.state.storage.put("room", this.data);
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		if (request.method === "POST" && pathname === "/init") {
			const data = await this.load();
			await this.persist();
			return new Response(JSON.stringify({ ok: true, roomId: data.roomId }), {
				status: 201,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (request.method === "GET" && pathname === "/state") {
			const data = await this.load();
			return new Response(JSON.stringify(data), {
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response("Not Found", { status: 404 });
	}
}

export default app;
