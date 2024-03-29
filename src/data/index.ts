/* eslint-disable no-unreachable */
import _ from "lodash";
import axios from "axios";
import { getTop8MatchesSmash } from "../services/smash";
import { getTop8Matches, getParticipants } from "../services/challongev2";

export interface IDataScoreboard {
	p1n: string;
	p2n: string;
	p1s: number;
	p2s: number;
	p1l: boolean;
	p2l: boolean;
	tl: string;
	tr: string;
	bl: string;
	br: string;
	lTag: string;
}

export interface IDataCamera {
	hbk: string;
	brewdog: string;
	fgc: string;
	date: string;
	game: string;
	bg: string;
}

export interface IDataParticipant {
	username: string;
	displayName: string;
}

export interface IDataNightbot {
	bracket: string;
	social: string;
}

export interface IDataPreStream {
	event: string;
	game: string;
	bg: string;
	countdown: number;
	venue: string;
	showTimer: boolean;
	startText: string;
}

export interface IDataSocial {
	web: string;
	twitter: string;
}

export interface IDataMatch {
	identifier: string;
	player1DisplayName: string;
	player2DisplayName: string;
	player1Score: number;
	player2Score: number;
}

export interface IDataCommentatorCamera {
	cl: string;
	clTwitter: string;
	cr: string;
	crTwitter: string;
}

class Data {
	private smashAPI: string = "https://api.start.gg/gql/alpha";

	private smashToken: string = process.env.SMASHGG_API_KEY || "";

	private scoreboard: IDataScoreboard = {
		p1n: "",
		p2n: "",
		p1s: 0,
		p2s: 0,
		p1l: false,
		p2l: false,
		tl: "HBK",
		tr: "#000",
		bl: "Brewdog",
		br: "Brighton",
		lTag: "[L]",
	};

	private camera: IDataCamera = {
		hbk: "Habrewken #000",
		brewdog: "Brewdog Brighton",
		fgc: "Brighton Fighting Game Community",
		date: "Wednesday Xth MONTH 20XX",
		game: "GAME NAME",
		bg: "hbk",
	};

	private social: IDataSocial = {
		web: "fightlab.gg",
		twitter: "fight_lab",
	};

	private participants: Array<IDataParticipant> = [];

	private bracket: string = "";

	private nightbot: IDataNightbot = {
		bracket: "https://fightlab.challonge.com",
		social:
			"Enjoying the Stream? Please give us a follow 🥰!• WEB: https://fightlab.gg • TWITTER: https://twitter.com/fight_lab • DISCORD: https://discord.gg/rjpDJdz",
	};

	private prestream: IDataPreStream = {
		event: "Habrewken #000",
		game: "Game Fighter Name",
		bg: "hbk",
		countdown: 300,
		venue: "BrewDog Brighton",
		showTimer: true,
		startText: "Starts",
	};

	private defaultMatch: IDataMatch = {
		identifier: "N/A",
		player1DisplayName: "N/A",
		player2DisplayName: "N/A",
		player1Score: 0,
		player2Score: 0,
	};

	private commentatorCamera: IDataCommentatorCamera = {
		cl: "CommentatorLeft",
		clTwitter: "@LeftTwitter",
		cr: "CommentatorRight",
		crTwitter: "@RightTwitter",
	};

	private matches: Array<IDataMatch> = Array(10).fill(this.defaultMatch);

	private callGraphQL = ({ query, variables }) =>
		axios({
			url: this.smashAPI,
			method: "post",
			headers: {
				Authorization: `Bearer ${this.smashToken}`,
			},
			data: {
				query,
				variables,
			},
		});

	private getTournamentSmash = ({ slug }: { slug: string }) =>
		this.callGraphQL({
			query: `
      query TournamentInformation($tournamentSlug: String!){
        tournament(slug: $tournamentSlug){
          id
          name
          slug
          events {
            id
            name
            slug
          }
        }
      }
    `,
			variables: {
				tournamentSlug: slug,
			},
		});

	private getParticipantsSmash = async ({
		eventId,
		page = 1,
		perPage = 25,
		participants = [],
	}) => {
		const event = await this.callGraphQL({
			query: `
        query EventEntrants($eventId: ID!, $page: Int!, $perPage: Int!){
          event(id: $eventId){
            id
            name
            slug
            entrants (query:{
              page: $page,
              perPage: $perPage
            }) {
              pageInfo {
                total
                totalPages
                page
                perPage
              }
              nodes {
                id
                participants {
                  id
                  prefix
                  gamerTag
                  entrants {
                    id
                    name
                  }
                  contactInfo {
                    id
                    name
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

		if (_.get(event, "data.data.event.entrants")) {
			const entrants = _.get(event, "data.data.event.entrants");
			const { pageInfo } = entrants;
			// eslint-disable-next-line no-param-reassign
			participants = participants.concat(
				entrants.nodes.map((entrant) => _.get(entrant, "participants[0]", null))
			);

			if (page < pageInfo.totalPages) {
				return this.getParticipantsSmash({
					eventId,
					page: page + 1,
					perPage,
					participants,
				});
			}
		}

		return _.compact(participants);
	};

	constructor({
		scoreboard,
		camera,
		bracket,
		participants,
		prestream,
	}: {
		scoreboard?: IDataScoreboard;
		camera?: IDataCamera;
		bracket?: string;
		participants?: Array<IDataParticipant>;
		prestream?: IDataPreStream;
	} = {}) {
		if (scoreboard) this.scoreboard = scoreboard;
		if (camera) this.camera = camera;
		if (bracket) this.bracket = bracket;
		if (participants) this.participants = participants;
		if (prestream) this.prestream = prestream;
	}

	public getScoreboard = (): IDataScoreboard => this.scoreboard;

	public getCamera = (): IDataCamera => this.camera;

	public getSocial = (): IDataSocial => this.social;

	public getBracket = (): string => this.bracket;

	public getParticipants = (): Array<IDataParticipant> => this.participants;

	public getNightbot = (key?: string): string | IDataNightbot => {
		if (key) return this.nightbot[key] || "";
		return this.nightbot;
	};

	public getPrestream = (): IDataPreStream => this.prestream;

	public getMatches = (): Array<IDataMatch> => this.matches;

	public getCommentatorCamera = (): IDataCommentatorCamera =>
		this.commentatorCamera;

	public setScoreboard = (scoreboard: IDataScoreboard): void => {
		this.scoreboard = scoreboard;
	};

	public setCamera = (camera: IDataCamera): void => {
		this.camera = camera;
	};

	public setSocial = (social: IDataSocial): void => {
		this.social = social;
	};

	public setBracket = (bracket: string): void => {
		this.bracket = bracket;
	};

	public setParticipants = (participants: Array<IDataParticipant>): void => {
		this.participants = participants;
	};

	public setNightbot = (nightbot: IDataNightbot): void => {
		this.nightbot = nightbot;
	};

	public setPrestream = (prestream: IDataPreStream): void => {
		this.prestream = prestream;
	};

	public setMatches = (matches: Array<IDataMatch>): void => {
		this.matches = matches;
	};

	public setCommentatorCamera = (
		commentatorCamera: IDataCommentatorCamera
	): void => {
		this.commentatorCamera = commentatorCamera;
	};

	public getParticipantsFromBracket = (
		bracket: string
	): Promise<Array<IDataParticipant>> =>
		// eslint-disable-next-line no-async-promise-executor
		new Promise(async (resolve, reject) => {
			try {
				const url: URL = new URL(bracket);

				if (url.host.includes("challonge")) {
					const participantsFromChallonge = await getParticipants(url);

					const participants = [
						{
							displayName: "",
							username: "",
						},
						...participantsFromChallonge,
					] as Array<IDataParticipant>;

					this.setParticipants(participants);

					return resolve(participants);
				}

				if (url.host.includes("smash.gg") || url.host.includes("start.gg")) {
					const info = _(url.pathname)
						.split("/")
						.compact()
						.chunk(2)
						.fromPairs()
						.value();

					if (info.tournament && info.event) {
						const tournament = await this.getTournamentSmash({
							slug: info.tournament,
						});

						if (
							_.get(tournament, "data.data.tournament.slug", "") ===
							`tournament/${info.tournament}`
						) {
							const event = _.find(
								tournament.data.data.tournament.events,
								(e) =>
									e.slug === `tournament/${info.tournament}/event/${info.event}`
							);

							const participantsSmash = await this.getParticipantsSmash({
								eventId: event.id,
							});

							const participants = [
								{
									displayName: "",
									username: "",
								},
								...participantsSmash.map((participant) => ({
									displayName: `${_.get(participant, "entrants[0].name", "")}`,
									username: _.get(participant, "contactInfo.name", ""),
								})),
							] as Array<IDataParticipant>;

							this.setParticipants(participants);
							return resolve(participants);
						}
					}
				}

				return resolve([]);
			} catch (error) {
				return reject(error);
			}
		});

	public getTop8MatchesFromBracket = async (
		bracket: string
	): Promise<Array<IDataMatch>> => {
		try {
			const url: URL = new URL(bracket);

			if (url.host.includes("challonge")) {
				const matches = await getTop8Matches(url);

				this.setMatches(
					matches.map((m) => ({
						identifier: m.identifier || "N/A",
						player1DisplayName: m.player1DisplayName || "N/A",
						player2DisplayName: m.player2DisplayName || "N/A",
						player1Score: m.player1Score || 0,
						player2Score: m.player2Score || 0,
					}))
				);
			}

			if (url.host.includes("smash.gg") || url.host.includes("start.gg")) {
				const info = _(url.pathname)
					.split("/")
					.compact()
					.chunk(2)
					.fromPairs()
					.value();

				if (info.tournament && info.event) {
					const tournament = await this.getTournamentSmash({
						slug: info.tournament,
					});

					if (
						_.get(tournament, "data.data.tournament.slug", "") ===
						`tournament/${info.tournament}`
					) {
						const event = _.find(
							tournament.data.data.tournament.events,
							(e) =>
								e.slug === `tournament/${info.tournament}/event/${info.event}`
						);

						const matches = await getTop8MatchesSmash({ eventId: event.id });
						this.setMatches(
							matches.map((m) => ({
								identifier: m.identifier || "N/A",
								player1DisplayName: m.player1DisplayName || "N/A",
								player2DisplayName: m.player2DisplayName || "N/A",
								player1Score: m.player1Score || 0,
								player2Score: m.player2Score || 0,
							}))
						);
					}
				}
			}
		} catch (error) {
			console.error(error);
		}
		return this.getMatches();
	};
}

export default Data;
