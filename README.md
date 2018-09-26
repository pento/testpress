This is an experiment with creating a WordPress testing and contribution environment.

## Usage

Run `npm install`, then `npm run dev` to check it out.

## Notes

Holding down Cmd+Shift while clicking the icon will open Dev Tools.

This is currently tested on MacOS and Windows, but it should probably run on Linux, too. Bug reports and PRs are greatly appreciated. 🙂

You'll need to [install Docker](https://www.docker.com/community-edition#/download) manually before running TestPress.

## Releasing

It's currently only possible to build release packages on MacOS.

If you don't already have a GitHub token configured, [create a new token](https://github.com/settings/tokens/new) with the `repo` permissions, and assing it to the `GH_TOKEN` environment variable.

* Update the version in `package.json` in a PR, and merge.
* On `master`, run `npm run dist` to create the package for testing.
* After smoke testing has passed, run `npm run publish` to push the package to GitHub.
* Visit the [Releases page](https://github.com/pento/testpress/releases), edit the release notes, and publish.
