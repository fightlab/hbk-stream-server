module.exports = {
	webpack: (config, options, webpack) => {
		config.entry.main = ["./src/index.ts"];

		config.resolve = {
			extensions: [".ts", ".js", ".json"],
		};

		config.module.rules.push({
			test: /\.ts$/,
			loader: "awesome-typescript-loader",
		});

		return config;
	},
};
