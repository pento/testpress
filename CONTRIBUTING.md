# Contributing

Thank you for thinking about contributing to TestPress! If you're unsure of anything, know that you're 💯 welcome to submit an issue or pull request on any topic. The worst that can happen is that you'll be politely directed to the best location to ask your question or to change something in your pull request. We appreciate any sort of contribution and don't want a wall of rules to get in the way of that.

As with all WordPress projects, we want to ensure a welcoming environment for everyone. With that in mind, all contributors are expected to follow our [Code of Conduct](/CODE_OF_CONDUCT.md).

All WordPress projects are [licensed under the GPLv2+](/LICENSE.md), and all contributions to TestPress will be released under the GPLv2+ license. You maintain copyright over any contribution you make, and by submitting a pull request, you are agreeing to release that contribution under the GPLv2+ license.

This document covers the technical details around setup, and submitting your contribution to the TestPress project.

## Getting Started

TestPress is an Electron application, built primarily in JavaScript.

To get started, you will need to [Node.js installed](https://nodejs.org/en/). Most MacOS and Linux systems will have Node already installed, but you may need to download and install it on Windows.

TestPress can sometimes need a different version of Node than you have on your system, you can use [nvm](https://github.com/creationix/nvm) to change node versions on the command line:

```
nvm install
```

You also should have the latest release of [npm installed][npm]. npm is a separate project from Node.js and is updated frequently. If you've just installed Node.js which includes a version of npm within the installation you most likely will need also to update your npm installation. To update npm, type this into your terminal: `nvm install-latest-npm`

Finally, you need to install Docker in order to use TestPress. You can download it for [MacOS](https://download.docker.com/mac/stable/Docker.dmg), [Windows 10 Pro](https://download.docker.com/win/stable/Docker%20for%20Windows%20Installer.exe), [other versions of Windows](https://github.com/docker/toolbox/releases), and [all other operating systems](https://hub.docker.com/search/?type=edition&offering=community).

### Building

After using NVM to ensure the correct version of Node is installed, building TestPress can be done using the following commands:

```
npm install
npm run dev
```

### Debugging

Before running `npm run dev`, you can set TestPress to display debug messages, like so:

```
export DEBUG=testpress:*
npm run dev
```

This enable all debugging messages, then builds and starts TestPress. If you find the debugging messages to be too noisy, you can restrict them by stopping TestPress (quit the application, or press `Ctrl+C` in your terminal), and altering the `DEBUG` environment variable. For example, if you're only interested in debug messages from the Docker service:

```
export DEBUG=testpress:services:docker
npm run dev
```

In Windows, you can set the `DEBUG` environment variable using the appropriate method for your shell:

* **CMD**: `set DEBUG=testpress:*`
* **PowerShell**: `$env:DEBUG = "testpress:*"`

If you need to debug the the TestPress window, holding down Cmd+Shift while clicking the icon will open Dev Tools.

## Workflow

A good workflow for new contributors to follow is listed below:
- Fork TestPress repository in GitHub
- Clone your forked repository to your computer, using [GitHub Desktop](https://desktop.github.com/)
- Create a new branch
- Make code changes
- Commit your changes within the newly created branch
- Push the branch to your forked repository
- Submit a Pull Request to the TestPress repository

Ideally name your branches with prefixes and descriptions, like this: `[type]/[change]`. A good prefix would be:

- `add/` = add a new feature
- `try/` = experimental feature, "tentatively add"
- `update/` = update an existing feature

For example, `add/linux-support` means you're working on adding Linux support.

You can pick among all the [issues](https://github.com/pento/testpress/issues), or some of the ones labelled [Good First Issue](https://github.com/pento/testpress/labels/Good%20First%20Issue).

## How Can Designers Contribute?

If you'd like to contribute to the application design, feel free to contribute to tickets labelled [Needs Design](https://github.com/pento/testpress/labels/Needs%20Design) or [Needs Design Feedback](https://github.com/pento/testpress/labels/Needs%20Design%20Feedback). We could use your thoughtful replies, mockups, animatics, sketches, doodles. Proposed changes are best done as minimal and specific iterations on the work that precedes it, so they can be easily compared.
