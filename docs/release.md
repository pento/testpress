# TestPress Release Process

It's currently only possible to build release packages on MacOS and Windows.

## Signing

* **GitHub**: [Create a new token](https://github.com/settings/tokens/new) with the `repo` permissions, and assign it to the `GH_TOKEN` environment variable.
* **MacOS**: Install a MacOS Developer ID Application Key in your keychain.
* **Windows**: Install a Windows Authenticode certificate.

## MacOS Key

You need a MacOS Developer ID Application key. Ensure it's installed in your keychain, and up-to-date.

## Windows Key

You need a Windows Authenticode certificate file. Ensure it's up-to-date.

Set the file location like so:

```
$env:CSC_LINK = "C:\Users\Me\Desktop\code-signing.pfx"
$env:CSC_KEY_PASSWORD = "MySuperSecureCertificatePassword"
```

## Building and Releasing

* Update the version in `package.json` in a PR, and merge.
* On `master`, run `npm run dist` to create the package for testing.
* After smoke testing has passed, run `npm run publish` to push the package to GitHub.
* Visit the [Releases page](https://github.com/pento/testpress/releases), edit the release notes, and publish.
