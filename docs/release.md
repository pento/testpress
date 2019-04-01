# TestPress Release Process

It's currently only possible to build release packages on MacOS.

## GitHub Token

If you don't already have a GitHub token configured:

* [Create a new token](https://github.com/settings/tokens/new) with the `repo` permissions.
* Assign it to the `GH_TOKEN` environment variable on your computer.

## Distribution Key

You need a MacOS Developer ID Application key in order to release TestPress. Please ensure it's installed in your keychain, and up-to-date.

## Building and Releasing

* Update the version in `package.json` in a PR, and merge.
* On `master`, run `npm run dist` to create the package for testing.
* After smoke testing has passed, run `npm run publish` to push the package to GitHub.
* Visit the [Releases page](https://github.com/pento/testpress/releases), edit the release notes, and publish.
