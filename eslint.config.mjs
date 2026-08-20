import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{ ignores: [ 'dist' ] },
	{
		extends: [ js.configs.recommended, ...tseslint.configs.recommended ],
		files: [ '**/*.{ts,tsx,js}' ],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.node,
		},
		plugins: {
			'@stylistic': stylistic,
			'import': importPlugin,
		},
		rules: {
			'@stylistic/no-extra-semi': 'warn',
			'@stylistic/keyword-spacing': [
				'warn', {
					before: true,
					after: true,
				},
			],
			'object-curly-spacing': [ 'warn', 'always' ],
			'@typescript-eslint/no-unused-vars': [ 'warn' ],
			'@typescript-eslint/no-explicit-any': 'off',
			'indent': [ 'warn', 'tab' ],
			'array-bracket-newline': [ 'warn', { multiline: true } ],
			'array-bracket-spacing': [
				'warn',
				'always',
			],
			'arrow-parens': [ 'warn', 'as-needed' ],
			'comma-dangle': [ 'warn', 'always-multiline' ],
			'key-spacing': [
				'warn', {
					afterColon: true,
					beforeColon: false,
					mode: 'strict',
				},
			],
			"keyword-spacing": [
				"error",
				{ "before": true, "after": true }
			],
			'@stylistic/no-extra-parens': "error",
			'@stylistic/brace-style': ["error"],
			'@stylistic/curly-newline': ["error", "always"],
			'@stylistic/multiline-ternary': ["error", "always-multiline"],
			'@stylistic/semi-spacing': "error",
			'@stylistic/space-before-blocks': "error",
			'@stylistic/space-infix-ops': "error",
			'@stylistic/arrow-spacing': "error",
			'@stylistic/no-mixed-spaces-and-tabs': "error",
			'no-multi-spaces': [ 'warn' ],
			'no-multiple-empty-lines': [
				'warn', {
					max: 1,
					maxBOF: 0,
					maxEOF: 0,
				},
			],
			'no-trailing-spaces': 'warn',
			'object-curly-newline': [
				'warn', {
					'ExportDeclaration': { 'multiline': true },
					'ObjectExpression': { 'multiline': true },
					'ObjectPattern': { 'multiline': true },
				},
			],
			'object-property-newline': [
				'warn',
				{ 'allowAllPropertiesOnSameLine': false },
			],
			'padding-line-between-statements': [
				'warn',
				{
					blankLine: 'always',
					next: 'return',
					prev: '*',
				},
			],
			'quotes': [ 'warn', 'single' ],
			'semi': [ 'warn', 'always' ],
			'import/order': [
				'warn', // or 'error'
				{
					groups: [
						'builtin', // Built-in modules (e.g., `fs`, `path`)
						'external', // External modules (e.g., `react`, `lodash`)
						'internal', // Internal modules (local imports)
						'parent', // Parent imports (e.g., `../something`)
						'sibling', // Sibling imports (e.g., `./something`)
						'index', // Index imports (e.g., `./`)
					],
					pathGroups: [
						{
							pattern: '@/**',
							group: 'internal',
						},
					],
					'newlines-between': 'always', // Enforce newlines between groups
					'alphabetize': {
						order: 'asc', // Sort imports alphabetically
						caseInsensitive: true, // Case insensitive sorting
					},
				},
			],
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
);
