const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		...defaultConfig.entry(),
		'admin/settings/index': './src/frontend/apps/settings/react/index.tsx',
		'blocks/hello-world/index': './src/frontend/apps/hello-world/index.ts',
		'blocks/hello-world/view': './src/frontend/apps/hello-world/view.ts',
	},
	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'build' ),
		filename: '[name].js',
		chunkFilename: '[name].js',
		publicPath: 'auto',
	},
};
