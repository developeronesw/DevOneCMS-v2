# Package Signing and Integrity

DevOne CMS 2.0 packages are designed to be verifiable before installation or activation.

## Manifest

A package should include a machine-readable manifest such as `plugin.json`, `theme.json`, or the manifest defined for its extension type.

The manifest identifies the extension, version, compatibility range, capabilities, and package metadata. It must not contain secrets.

## Integrity

Release packages should publish a SHA-256 digest. Signed packages may include a detached signature over a canonical manifest and package digest.

Private signing material remains outside the CMS repository and outside distributed packages. DevOne CMS contains only the verification material required by the active trust policy.

## Verification requirements

A future package installer/marketplace service must:

1. validate the package archive and paths;
2. validate the manifest schema;
3. verify package integrity;
4. verify the signature when signing is required;
5. verify the declared DevOne CMS compatibility range;
6. reject malformed, unsigned, or incompatible packages when policy requires verification.

Package signing is separate from the DevOne CMS Network License Server. License keys and installation identities must never be embedded in extension packages.
