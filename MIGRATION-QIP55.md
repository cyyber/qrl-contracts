# QIP-55 mixed-case checksum status

This document supersedes the earlier migration note that proposed an EIP-55-style mixed-case checksum for QRL addresses.

Final address policy:

- QRL addresses are 64 bytes.
- Text form is `Q` followed by 128 hexadecimal characters.
- Canonical output is lowercase.
- Address validation is structural only.
- No EIP-55/QIP-55 mixed-case checksum is embedded in the address.

`utils/Strings.hyp::toChecksumHexString(address)` is kept as a compatibility alias for existing contracts and examples. It returns the same canonical lowercase string as `toHexString(address)`.

Applications that need typo detection should add a transport- or UI-level checksum envelope instead of relying on address letter casing.
