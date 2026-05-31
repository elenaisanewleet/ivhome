# Nadom privacy and security rules

## Privacy by design

Apply privacy by design and data minimization. Collect explicit consent before collecting or transferring personal data. If special-category personal data may be processed, document whether separate consent is needed and implement it where required.

Do not store unnecessary medical details. Do not write sensitive medical details in Telegram messages. Keep status notifications neutral.

Do not collect phone numbers or exact addresses too early. Collect them only when the selected organization actually needs them for confirmed follow-up, or let the selected organization collect them itself.

## Sensitive data handling

Encrypt or hash sensitive fields where appropriate. Never commit `.env` files, secrets, bot tokens, credentials, or real user data.

Do not log:

* tokens or credentials;
* Telegram `initData`;
* phone numbers;
* exact addresses;
* personal data;
* medical details.

Validate Telegram `initData` before trusting Mini App data.

## Access and accountability

Use role-based access control. Record audit logs for important admin and medical-organization actions without leaking sensitive data into those logs.
