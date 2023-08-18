module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "plugin:unicorn/recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "unicorn/prevent-abbreviations": "off",
        "unicorn/no-null": "off",
        "unicorn/prefer-switch": "off",
        "unicorn/consistent-function-scoping": "off",
        "unicorn/no-array-reduce": "off",
        "unicorn/no-nested-ternary": "off",
        "unicorn/prefer-ternary": "off",
        "unicorn/filename-case": "off",
        "unicorn/no-array-for-each": "off",
        "unicorn/prefer-number-properties": "off",
        "unicorn/consistent-destructuring": "off",
        "unicorn/prefer-spread": "off",
        "@typescript-eslint/no-explicit-any": "off",
    }
}
