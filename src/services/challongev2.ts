import axios from "axios";
import { maxBy, minBy } from "lodash";
import { IDataParticipant } from "../data";
import { IChallongeMatchTransformed } from "./challonge";

const api_key = process.env.CHALLONGE_API_KEY;

const getScoresFromCSV = (scoresCsv: string) => {
	const scores = scoresCsv.replace(/ /g, "");
	if (scores === "0-0") {
		return [0, 0];
	}
	const splitByComma = scores.split(",");
	const splitByDash = splitByComma.map((sbc) => sbc.split("-"));

	return [
		splitByDash.reduce((acc, sbd) => acc + +sbd[0], 0),
		splitByDash.reduce((acc, sbd) => acc + +sbd[1], 0),
	];
};

const checkSubdomain = (url: URL) => {
	const subdomain = url.hostname.split(".")[0];
	const path = url.pathname.replace("/", "");

	// check if url has team/group subdomain
	const id = subdomain === "challonge" ? "" : subdomain;

	return [path, id];
};

export const getParticipants = async (
	url: URL
): Promise<Array<IDataParticipant>> => {
	try {
		const [path, id] = checkSubdomain(url);

		const response = await axios.get(
			`https://api.challonge.com/v2/${
				id ? `communities/${id}/` : ""
			}tournaments/${path}/participants.json`,
			{
				headers: {
					Authorization: api_key,
					"Authorization-Type": "v1",
					"Content-Type": "application/vnd.api+json",
					Accept: "application/json",
				},
				params: {
					page: 1,
					per_page: 128,
				},
			}
		);

		const map = response.data.data.map((p: any) => ({
			displayName: p.attributes.name,
			username: p.attributes.username ? p.attributes.username : "",
		}));

		return map;
	} catch (error) {
		console.log(error);
		return [];
	}
};

export const getTop8Matches = async (
	url: URL
): Promise<Array<IChallongeMatchTransformed>> => {
	try {
		const [path, id] = checkSubdomain(url);

		const response = await axios.get(
			`https://api.challonge.com/v2/${
				id ? `communities/${id}/` : ""
			}tournaments/${path}/matches.json`,
			{
				headers: {
					Authorization: api_key,
					"Authorization-Type": "v1",
					"Content-Type": "application/vnd.api+json",
					Accept: "application/json",
				},
				params: {
					page: 1,
					per_page: 128,
				},
			}
		);

		const participants = response.data.included.filter(
			(i: any) => i.type === "participant"
		);
		const matches = response.data.data;

		const gf =
			maxBy(matches, (m: any) => m.attributes.round)?.attributes.round || NaN;
		const wf = gf - 1;
		const wsf = gf - 2;
		const lf =
			minBy(matches, (m: any) => m.attributes.round)?.attributes.round || NaN;
		const lsf = lf + 1;
		const lqf = lf + 2;
		const lt8 = lf + 3;

		const gfm = matches
			.filter((m: any) => gf >= 0 && m.attributes.round === gf)
			.map((m: any) => ({ ...m, identifier: "Grand Final" }));
		const wfm = matches
			.filter((m: any) => gf >= 1 && m.attributes.round === wf)
			.map((m: any) => ({ ...m, identifier: "Winners Final" }));
		const wsfm = matches
			.filter((m: any) => gf >= 2 && m.attributes.round === wsf)
			.map((m: any) => ({ ...m, identifier: "Winners Semi Final" }));
		const lfm = matches
			.filter((m: any) => lf <= -1 && m.attributes.round === lf)
			.map((m: any) => ({ ...m, identifier: "Losers Final" }));
		const lsfm = matches
			.filter((m: any) => lf <= -2 && m.attributes.round === lsf)
			.map((m: any) => ({ ...m, identifier: "Losers Semi Final" }));
		const lqfm = matches
			.filter((m: any) => lf <= -3 && m.attributes.round === lqf)
			.map((m: any) => ({ ...m, identifier: "Losers Quarter Final" }));
		const lt8m = matches
			.filter((m: any) => lf <= -4 && m.attributes.round === lt8)
			.map((m: any) => ({ ...m, identifier: "Losers Top 8" }));

		const t8Matches = [
			...lt8m,
			...lqfm,
			...lsfm,
			...lfm,
			...wsfm,
			...wfm,
			...gfm,
		];

		// eslint-disable-next-line arrow-body-style
		const transformed: Array<IChallongeMatchTransformed> = t8Matches.map(
			(m) => {
				const player1 = participants.find(
					(p) => p.id === m.relationships.player1?.data.id
				);
				const player2 = participants.find(
					(p) => p.id === m.relationships.player2?.data.id
				);

				return {
					id: m.id,
					round: m.attributes.round,
					identifier: m.identifier,
					player1Id: player1 ? player1.id : undefined,
					player2Id: player2 ? player2.id : undefined,
					winnerId: m.attributes.winners
						? m.attributes.winners.toString()
						: undefined,
					loserId: m.attributes.winners
						? (() => {
								if (m.attributes.winners.toString() === player1.id) {
									return player2.id;
								}
								if (m.attributes.winners.toString() === player2.id) {
									return player1.id;
								}
								return undefined;
						  })()
						: undefined,
					scoresCsv: m.attributes.scores,
					player1DisplayName: player1 ? player1.attributes.name : undefined,
					player2DisplayName: player2 ? player2.attributes.name : undefined,
					player1Score: getScoresFromCSV(m.attributes.scores || "0-0")[0],
					player2Score: getScoresFromCSV(m.attributes.scores || "0-0")[1],
				};
			}
		);

		return transformed;
	} catch (error) {
		console.log(error);
		return [];
	}
};
