const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const CopyPlugin = require( 'copy-webpack-plugin' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		...defaultConfig.entry(),
		'admin/settings/index': './src/frontend/apps/settings/react/index.tsx',
		'admin/developer/index': './src/frontend/apps/developer/react/index.tsx',
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
	plugins: [
		...defaultConfig.plugins,
		new CopyPlugin( {
			patterns: [
				{
					from: 'src/frontend/apps/*/block.json',
					to( { absoluteFilename } ) {
						const parts = absoluteFilename.split( path.sep );
						const blockSlug = parts[ parts.length - 2 ];
						return `blocks/${ blockSlug }/block.json`;
					},
				},
				{
					from: 'src/frontend/apps/*/*.css',
					to( { absoluteFilename } ) {
						const parts = absoluteFilename.split( path.sep );
						const blockSlug = parts[ parts.length - 2 ];
						const fileName = parts[ parts.length - 1 ];
						return `blocks/${ blockSlug }/${ fileName }`;
					},
					noErrorOnMissing: true,
				},
			],
		} ),
	],
};
