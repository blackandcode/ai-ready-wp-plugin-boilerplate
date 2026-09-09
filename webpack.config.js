const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	entry: {
		...defaultConfig.entry(),
		'admin/settings/index': './assets/src/apps/settings/index.tsx',
		'blocks/hello-world/index': './blocks/hello-world/index.ts',
		'blocks/hello-world/view': './blocks/hello-world/view.ts',
	},
	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'build' ),
		filename: '[name].js',
	},
};
