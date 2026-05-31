# Nadom product, legal, and safety rules

## Product frame

Nadom / Надом is a Telegram Bot and Telegram Mini App for confidential matching of medical home visits in Moscow. The internal repository and project name is IVhome; use Nadom / Надом for public user-facing content.

Nadom is an aggregator, marketplace, and matching service. Nadom is not a clinic and does not provide medical services. The platform helps a user find a suitable option from a licensed medical organization or properly licensed provider with home-visit availability.

Nadom does not:

* diagnose;
* prescribe treatment;
* recommend IV composition, drug composition, treatment plans, or therapy schemes;
* promise medical results;
* replace an in-person medical consultation.

Medical feasibility, service details, composition, final price, and the visit itself are confirmed by the selected licensed medical organization. The platform should verify and display license or verification-status information for medical organizations. Do not create the impression that Nadom itself has doctors, diagnoses, treatment protocols, or medical responsibility for the procedure.

## Moscow MVP flow

The MVP is focused on Moscow and uses this flow:

`/start → onboarding → consent → emergency screening → service type → district/geozone → desired time → offers list → offer details → request confirmation → manual confirmation by admin/medical organization → status → rating`

UX requirements:

* Use one question per screen, short copy, buttons instead of free text where possible, and a progress indicator or step counter.
* Geolocation is optional. The user may enter a district manually.
* Do not collect a phone number or exact address too early. Collect them only when the selected organization actually needs them for confirmed follow-up, or let the selected organization collect them itself.
* Manual confirmation by an admin or the selected medical organization remains part of the MVP.

## Emergency screening

Emergency screening is a hard-stop routing safeguard, not diagnosis. Ask simple binary questions. If red flags appear, stop the sales and request flow, route the user to `103/112`, do not submit the request, and do not explain diagnoses.

Use this hard-stop copy without emoji:

`при таких симптомах выезд на дом может быть небезопасен. пожалуйста, обратитесь за экстренной помощью: 103 или 112`

## SLA separation

Keep these metrics separate in UI, copy, data models, and reviews:

1. Time to answer or confirmation by the selected organization.
2. Expected arrival time after confirmation.

Never combine or blur these two metrics.

## Offer cards

Each offer card should show:

* medical organization name;
* license or verification status;
* district or service area;
* response or confirmation time;
* expected arrival time after confirmation;
* indicative price;
* conditions;
* rating;
* disclaimer: `детали и медицинскую возможность подтверждает выбранная организация`.

## Price lifecycle

Before confirmation, price is indicative. The selected medical organization confirms the final price. After confirmation, use price-lock wording such as:

* `стоимость подтверждена`;
* `стоимость зафиксирована выбранной организацией`.

## Safety-first ranking

Prioritize offers in this order:

1. License or verification.
2. Actual availability.
3. SLA reliability.
4. Transparent price.
5. Complaints and quality.
6. Service-area fit.
7. Rating.
8. Commercial parameters.

Do not rank sensitive or crisis offers mainly by who pays more. Paid promotion may be added later only with clear labeling.

## Do not add to the MVP

Do not add:

* AI diagnosis;
* automatic selection of IV composition;
* real medical-record storage;
* payments or acquiring;
* CRM integrations;
* absolute anonymity claims.
