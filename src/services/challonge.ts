import { createClient } from "challonge";
import { map, maxBy, minBy, find } from "lodash";

export interface IChallongeParticipant {
	id?: number;
	name?: string;
	challongeUsername?: string;
	displayName?: string;
	username?: string;
}

export interface IChallongeMatch {
	id?: number | string;
	round?: number;
	identifier?: string;
	player1Id?: number;
	player2Id?: number;
	winnerId?: number;
	loserId?: number;
	scoresCsv?: string;
	player1PrereqMatchId?: number;
	player2PrereqMatchId?: number;
}

export interface IChallongeMatchTransformed extends IChallongeMatch {
	player1DisplayName?: string;
	player2DisplayName?: string;
	player1Score?: number;
	player2Score?: number;
}

class Challonge {
	private client = createClient({
		apiKey: process.env.CHALLONGE_API_KEY,
	});

	private checkSubdomain = (url: URL) => {
		const subdomain = url.hostname.split(".")[0];
		const path = url.pathname.replace("/", "");

		// check if url has team/group subdomain
		const id = subdomain === "challonge" ? "" : subdomain;

		return [path, id];
	};

	private getScoresFromCSV = (scoresCsv: string) => {
		if (scoresCsv === "0-0") {
			return [0, 0];
		}
		const splitByComma = scoresCsv.split(",");
		const splitByDash = splitByComma.map((sbc) => sbc.split("-"));

		return [
			splitByDash.reduce((acc, sbd) => acc + +sbd[0], 0),
			splitByDash.reduce((acc, sbd) => acc + +sbd[1], 0),
		];
	};

	public getParticipants = (url: URL): Promise<Array<IChallongeParticipant>> =>
		new Promise((resolve, reject) => {
			const [path, id] = this.checkSubdomain(url);
			this.client.participants.index({
				id: `${id ? `${id}-` : ""}${path}`,
				callback: (err, response) => {
					if (err) {
						return reject(err);
					}
					return resolve(map(response, ({ participant }) => participant));
				},
			});
		});

	public getMatches = (url: URL): Promise<Array<IChallongeMatch>> =>
		new Promise((resolve, reject) => {
			const [path, id] = this.checkSubdomain(url);

			this.client.matches.index({
				id: `${id ? `${id}-` : ""}${path}`,
				callback: (err, response) => {
					if (err) {
						return reject(err);
					}
					return resolve(map(response, ({ match }) => match));
				},
			});
		});

	public getTop8Matches = async (
		url: URL
	): Promise<Array<IChallongeMatchTransformed>> => {
		const participants = await this.getParticipants(url);
		const matches = await this.getMatches(url);

		const gf = maxBy(matches, (m) => m.round)?.round || NaN;
		const wf = gf - 1;
		const wsf = gf - 2;
		const lf = minBy(matches, (m) => m.round)?.round || NaN;
		const lsf = lf + 1;
		const lqf = lf + 2;
		const lt8 = lf + 3;

		const gfm = matches
			.filter((m) => gf >= 0 && m.round === gf)
			.map((m) => ({ ...m, identifier: "Grand Final" }));
		const wfm = matches
			.filter((m) => gf >= 1 && m.round === wf)
			.map((m) => ({ ...m, identifier: "Winners Final" }));
		const wsfm = matches
			.filter((m) => gf >= 2 && m.round === wsf)
			.map((m, i) => ({ ...m, identifier: `Winners SF ${i + 1}` }));
		const lfm = matches
			.filter((m) => lf <= -1 && m.round === lf)
			.map((m) => ({ ...m, identifier: "Losers Final" }));
		const lsfm = matches
			.filter((m) => lf <= -2 && m.round === lsf)
			.map((m) => ({ ...m, identifier: "Losers SF" }));
		const lqfm = matches
			.filter((m) => lf <= -3 && m.round === lqf)
			.map((m, i) => ({ ...m, identifier: `Losers QF ${i + 1}` }));
		const lt8m = matches
			.filter((m) => lf <= -4 && m.round === lt8)
			.map((m, i) => ({ ...m, identifier: `Losers T8 ${i + 1}` }));

		const t8Matches = [
			...lt8m,
			...lqfm,
			...lsfm,
			...lfm,
			...wsfm,
			...wfm,
			...gfm,
		];

		return map(t8Matches, (m) => {
			const player1 = find(participants, (p) => p.id === m.player1Id);
			const player2 = find(participants, (p) => p.id === m.player2Id);

			const player1PrereqMatch =
				find(t8Matches, (pm) => pm.id === m.player1PrereqMatchId) ||
				find(matches, (pm) => pm.id === m.player1PrereqMatchId);
			const player2PrereqMatch =
				find(t8Matches, (pm) => pm.id === m.player2PrereqMatchId) ||
				find(matches, (pm) => pm.id === m.player2PrereqMatchId);

			const player1DisplayName =
				player1?.displayName || `From ${player1PrereqMatch?.identifier}`;
			const player2DisplayName =
				player2?.displayName || `From ${player2PrereqMatch?.identifier}`;

			return {
				id: m.id,
				round: m.round,
				identifier: m.identifier,
				player1Id: m.player1Id,
				player2Id: m.player2Id,
				winnerId: m.winnerId,
				loserId: m.loserId,
				scoresCsv: m.scoresCsv,
				player1DisplayName,
				player2DisplayName,
				player1Score: this.getScoresFromCSV(m.scoresCsv || "0-0")[0],
				player2Score: this.getScoresFromCSV(m.scoresCsv || "0-0")[1],
			} as IChallongeMatchTransformed;
		});
	};
}

export default Challonge;
