const defaultConfig = require( '@wordpress/scripts/config/jest-unit.config' );

module.exports = {
	...defaultConfig,
	coverageDirectory: '<rootDir>/tests/coverage',
	setupFilesAfterEnv: [
		...( defaultConfig.setupFilesAfterEnv || [] ),
		'<rootDir>/tests/js/setup-tests.ts',
	],
	transform: {
		'^.+\\.[jt]sx?$': [
			'babel-jest',
			{
				presets: [
					require.resolve( '@babel/preset-env' ),
					require.resolve( '@babel/preset-typescript' ),
					[
						require.resolve( '@babel/preset-react' ),
						{ runtime: 'automatic' },
					],
				],
			},
		],
	},
};
