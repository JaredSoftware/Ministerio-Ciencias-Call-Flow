// vue.config.js
module.exports = {
	outputDir: '../dist',
	configureWebpack: {
		module: {
			rules: [
				{
					test: /\.mjs$/,
					include: /node_modules/,
					type: "javascript/auto"
				}
			]
		},
		resolve: {
			fallback: {
				"https": require.resolve("https-browserify"),
				"url":false,
				"http": require.resolve("stream-http")
			}
		}
	},
}