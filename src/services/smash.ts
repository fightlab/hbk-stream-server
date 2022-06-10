import axios from "axios";
import { compact, get, map, maxBy, minBy, find } from "lodash";
import { IChallongeMatchTransformed } from "./challonge";

interface ISmashSet {
	id: string;
	fullRoundText: string;
	round: number;
	identifier: string;
	slots: Array<{
		prereqId: string;
		standing: {
			placement: number;
			entrant: {
				id: number;
				name: string;
			};
			stats: {
				score: {
					label: string;
					value: number;
				};
			};
		};
	}>;
}

const smashAPI: string = "https://api.smash.gg/gql/alpha";

const smashToken: string = process.env.SMASHGG_API_KEY || "";

const callGraphQL = ({ query, variables }) =>
	axios({
		url: smashAPI,
		method: "post",
		headers: {
			Authorization: `Bearer ${smashToken}`,
		},
		data: {
			query,
			variables,
		},
	});

export const getEventSets = async ({
	eventId,
	page = 1,
	perPage = 25,
	sets = [],
}): Promise<Array<ISmashSet>> => {
	const event = await callGraphQL({
		query: `
      query EventSets($eventId: ID!, $page: Int!, $perPage: Int!) {
        event(id: $eventId) {
          id
          name
          sets(
            page: $page
            perPage: $perPage
            sortType: NONE
          ) {
            pageInfo {
              total
              totalPages
              page
              perPage
            }
            nodes {
              id
              fullRoundText
              round
              identifier
              slots {
                prereqId
                standing {
                  placement
                  entrant {
                    id
                    name
                  }
                  stats {
                    score {
                      label
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
		variables: {
			eventId,
			page,
			perPage,
		},
	});

	if (get(event, "data.data.event.sets")) {
		const dataSets = get(event, "data.data.event.sets");
		const { pageInfo } = dataSets;
		// eslint-disable-next-line no-param-reassign
		sets = sets.concat(dataSets.nodes);

		if (page < pageInfo.totalPages) {
			return getEventSets({
				eventId,
				page: page + 1,
				perPage,
				sets,
			});
		}
	}

	return compact(sets);
};

export const getTop8MatchesSmash = async ({
	eventId,
}): Promise<Array<IChallongeMatchTransformed>> => {
	const sets = await getEventSets({
		eventId,
		page: 1,
		perPage: 25,
	});

	const gf = maxBy(sets, (m) => m.round)?.round || NaN;
	const wf = gf - 1;
	const wsf = gf - 2;
	const lf = minBy(sets, (m) => m.round)?.round || NaN;
	const lsf = lf + 1;
	const lqf = lf + 2;
	const lt8 = lf + 3;

	const gfm = sets
		.filter((m) => gf >= 0 && m.round === gf)
		.map((m) => ({ ...m, identifier: "Grand Final" }));
		const wfm = sets
		.filter((m) => gf >= 1 && m.round === wf)
		.map((m) => ({ ...m, identifier: "Winners Final" }));
		const wsfm = sets
		.filter((m) => gf >= 2 && m.round === wsf)
		.sort((a, b) => +a.id - +b.id)
		.map((m, i) => ({ ...m, identifier: `Winners SF ${i + 1}` }));
		const lfm = sets
		.filter((m) => lf <= -1 && m.round === lf)
		.map((m) => ({ ...m, identifier: "Losers Final" }));
		const lsfm = sets
		.filter((m) => lf <= -2 && m.round === lsf)
		.map((m) => ({ ...m, identifier: "Losers SF" }));
		const lqfm = sets
		.filter((m) => lf <= -3 && m.round === lqf)
		.sort((a, b) => +a.id - +b.id)
		.map((m, i) => ({ ...m, identifier: `Losers QF ${i + 1}` }));
		const lt8m = sets
		.filter((m) => lf <= -4 && m.round === lt8)
		.sort((a, b) => +a.id - +b.id)
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
		const player1 = m.slots[0];
		const player2 = m.slots[1];
		const winner = find(m.slots, (s) => s.standing?.placement === 1);
		const loser = find(m.slots, (s) => s.standing?.placement === 2);
		const scoresCsv =
			player1.standing?.stats.score.value && player2.standing?.stats.score.value
				? `${player1.standing.stats.score.value}-${player2.standing.stats.score.value}`
				: undefined;

		const player1PrereqMatch = find(
			t8Matches,
			(pm) => pm.id.toString() === player1.prereqId.toString()
		);
		const player2PrereqMatch = find(
			t8Matches,
			(pm) => pm.id.toString() === player2.prereqId.toString()
		);

		const player1DisplayName =
			player1.standing?.entrant.name ||
			`From ${player1PrereqMatch?.identifier}`;
		const player2DisplayName =
			player2.standing?.entrant.name ||
			`From ${player2PrereqMatch?.identifier}`;

		return {
			id: m.id,
			identifier: m.identifier,
			player1Id: player1.standing?.entrant.id,
			player2Id: player2.standing?.entrant.id,
			winnerId: winner?.standing?.entrant.id,
			loserId: loser?.standing?.entrant.id,
			scoresCsv,
			player1DisplayName,
			player2DisplayName,
			player1Score: player1.standing?.stats.score.value,
			player2Score: player2.standing?.stats.score.value,
		} as IChallongeMatchTransformed;
	});
};
