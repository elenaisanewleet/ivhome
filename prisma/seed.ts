import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const date = (value: string) => new Date(value);

const clinicIds = {
  partnerOne: "demo-clinic-partner-one",
  homeCare: "demo-clinic-home-care",
  nightService: "demo-clinic-night-service",
} as const;

const categoryIds = {
  homeMedicalVisit: "demo-category-home-medical-visit",
  nurseVisit: "demo-category-nurse-visit",
  ivTherapyReview: "demo-category-iv-therapy-review",
} as const;

async function main() {
  await prisma.$transaction(async (tx) => {
    const categories = [
      {
        id: categoryIds.homeMedicalVisit,
        slug: "home_medical_visit",
        publicName: "At-home medical visit",
        publicDescription:
          "Request an at-home visit for partner review. IVhome does not diagnose or prescribe treatment.",
      },
      {
        id: categoryIds.nurseVisit,
        slug: "nurse_visit",
        publicName: "At-home nurse visit",
        publicDescription:
          "Request an at-home nurse visit. A partner confirms whether the service can be provided.",
      },
      {
        id: categoryIds.ivTherapyReview,
        slug: "iv_therapy_review",
        publicName: "IV therapy request review",
        publicDescription:
          "Ask a partner to review an at-home IV therapy request. IVhome does not recommend medication or IV composition.",
      },
    ];

    for (const category of categories) {
      await tx.serviceCategory.upsert({
        where: { slug: category.slug },
        update: {
          publicName: category.publicName,
          publicDescription: category.publicDescription,
          isActive: true,
        },
        create: {
          ...category,
          isActive: true,
        },
      });
    }

    const clinics = [
      {
        id: clinicIds.partnerOne,
        legalName: "Demo Medical Partner One LLC",
        publicName: "Demo Medical Partner One",
        inn: "DEMO-INN-0001",
        ogrn: "DEMO-OGRN-0001",
        status: "ACTIVE" as const,
      },
      {
        id: clinicIds.homeCare,
        legalName: "Demo Home Care Partner LLC",
        publicName: "Demo Home Care Partner",
        inn: "DEMO-INN-0002",
        ogrn: "DEMO-OGRN-0002",
        status: "ACTIVE" as const,
      },
      {
        id: clinicIds.nightService,
        legalName: "Demo Clinic Night Service LLC",
        publicName: "Demo Clinic Night Service",
        inn: "DEMO-INN-0003",
        ogrn: "DEMO-OGRN-0003",
        status: "PENDING_REVIEW" as const,
      },
    ];

    for (const clinic of clinics) {
      await tx.clinic.upsert({
        where: { id: clinic.id },
        update: clinic,
        create: clinic,
      });
    }

    const licenses = [
      {
        id: "demo-license-000001",
        clinicId: clinicIds.partnerOne,
        licenseNumber: "DEMO-000001",
        status: "VERIFIED" as const,
        issuedAt: date("2026-01-10T00:00:00.000Z"),
        checkedAt: date("2026-05-01T09:00:00.000Z"),
        nextCheckAt: date("2026-11-01T09:00:00.000Z"),
      },
      {
        id: "demo-license-000002",
        clinicId: clinicIds.homeCare,
        licenseNumber: "DEMO-000002",
        status: "VERIFIED" as const,
        issuedAt: date("2026-01-11T00:00:00.000Z"),
        checkedAt: date("2026-05-02T09:00:00.000Z"),
        nextCheckAt: date("2026-11-02T09:00:00.000Z"),
      },
      {
        id: "demo-license-000003",
        clinicId: clinicIds.nightService,
        licenseNumber: "DEMO-000003",
        status: "PENDING" as const,
        issuedAt: date("2026-01-12T00:00:00.000Z"),
        checkedAt: null,
        nextCheckAt: date("2026-06-15T09:00:00.000Z"),
      },
    ];

    for (const license of licenses) {
      await tx.clinicLicense.upsert({
        where: { id: license.id },
        update: {
          ...license,
          authorityName: "Demo authority for local development only",
          registryUrl: null,
          registryRecordId: null,
          licensedActivities: ["fake-demo-at-home-service"],
          licensedAddresses: ["fake-demo-address"],
          verificationNotes: "Fake demo license for local development only",
        },
        create: {
          ...license,
          authorityName: "Demo authority for local development only",
          licensedActivities: ["fake-demo-at-home-service"],
          licensedAddresses: ["fake-demo-address"],
          verificationNotes: "Fake demo license for local development only",
        },
      });
    }

    const offers = [
      [clinicIds.partnerOne, categoryIds.homeMedicalVisit, "3500.00", "5200.00", 60, 120],
      [clinicIds.partnerOne, categoryIds.nurseVisit, "2500.00", "3900.00", 45, 90],
      [clinicIds.partnerOne, categoryIds.ivTherapyReview, "3000.00", "4800.00", 60, 120],
      [clinicIds.homeCare, categoryIds.homeMedicalVisit, "3800.00", "5500.00", 90, 150],
      [clinicIds.homeCare, categoryIds.nurseVisit, "2700.00", "4100.00", 60, 120],
      [clinicIds.nightService, categoryIds.homeMedicalVisit, "4500.00", "6200.00", 75, 150],
      [clinicIds.nightService, categoryIds.nurseVisit, "3200.00", "4700.00", 60, 120],
    ] as const;

    for (const [clinicId, serviceCategoryId, priceFrom, priceTo, etaFrom, etaTo] of offers) {
      await tx.clinicServiceOffer.upsert({
        where: {
          clinicId_serviceCategoryId: { clinicId, serviceCategoryId },
        },
        update: {
          status: "ACTIVE",
          preliminaryPriceFrom: priceFrom,
          preliminaryPriceTo: priceTo,
          etaMinutesFrom: etaFrom,
          etaMinutesTo: etaTo,
          cancellationTerms: "Fake demo cancellation terms",
          publicConditions: "Subject to partner review and confirmation",
        },
        create: {
          clinicId,
          serviceCategoryId,
          status: "ACTIVE",
          preliminaryPriceFrom: priceFrom,
          preliminaryPriceTo: priceTo,
          etaMinutesFrom: etaFrom,
          etaMinutesTo: etaTo,
          cancellationTerms: "Fake demo cancellation terms",
          publicConditions: "Subject to partner review and confirmation",
        },
      });
    }

    const serviceAreas = [
      [clinicIds.partnerOne, "cao", "Central Administrative Okrug"],
      [clinicIds.partnerOne, "svao", "North-Eastern Administrative Okrug"],
      [clinicIds.homeCare, "zao", "Western Administrative Okrug"],
      [clinicIds.homeCare, "yuzao", "South-Western Administrative Okrug"],
      [clinicIds.nightService, "all_moscow", "All Moscow demo service area"],
    ] as const;

    for (const [clinicId, districtCode, districtName] of serviceAreas) {
      await tx.clinicServiceArea.upsert({
        where: { clinicId_districtCode: { clinicId, districtCode } },
        update: { districtName, isActive: true },
        create: { clinicId, districtCode, districtName, isActive: true },
      });
    }

    const contactChannels = [
      {
        id: "demo-contact-dashboard-0001",
        clinicId: clinicIds.partnerOne,
        type: "DASHBOARD" as const,
        label: "Demo dashboard queue",
        valueMasked: "dashboard-only",
        isPrimary: true,
      },
      {
        id: "demo-contact-telegram-0001",
        clinicId: clinicIds.partnerOne,
        type: "TELEGRAM" as const,
        label: "Demo Telegram contact",
        valueMasked: "@demo_partner_one",
        isPrimary: false,
      },
      {
        id: "demo-contact-phone-0002",
        clinicId: clinicIds.homeCare,
        type: "PHONE" as const,
        label: "Demo masked phone",
        valueMasked: "+7 *** ***-**-02",
        isPrimary: true,
      },
      {
        id: "demo-contact-dashboard-0003",
        clinicId: clinicIds.nightService,
        type: "DASHBOARD" as const,
        label: "Demo dashboard queue",
        valueMasked: "dashboard-only",
        isPrimary: true,
      },
    ];

    for (const channel of contactChannels) {
      await tx.partnerContactChannel.upsert({
        where: { id: channel.id },
        update: channel,
        create: channel,
      });
    }

    const consentDocuments = [
      {
        id: "demo-consent-personal-data-v1",
        type: "PERSONAL_DATA_PROCESSING" as const,
        version: "demo-v1",
        title: "Demo personal data processing consent",
        contentHash: "demo-sha256-personal-data-v1",
        documentUrl: "https://example.invalid/ivhome/demo/personal-data-v1",
      },
      {
        id: "demo-consent-health-data-v1",
        type: "HEALTH_DATA_PROCESSING" as const,
        version: "demo-v1",
        title: "Demo health data processing consent",
        contentHash: "demo-sha256-health-data-v1",
        documentUrl: "https://example.invalid/ivhome/demo/health-data-v1",
      },
      {
        id: "demo-consent-partner-transfer-v1",
        type: "PARTNER_DATA_TRANSFER" as const,
        version: "demo-v1",
        title: "Demo partner data transfer consent",
        contentHash: "demo-sha256-partner-transfer-v1",
        documentUrl: "https://example.invalid/ivhome/demo/partner-transfer-v1",
      },
    ];

    for (const document of consentDocuments) {
      await tx.consentDocument.upsert({
        where: {
          type_version: { type: document.type, version: document.version },
        },
        update: {
          ...document,
          publishedAt: date("2026-05-01T00:00:00.000Z"),
        },
        create: {
          ...document,
          publishedAt: date("2026-05-01T00:00:00.000Z"),
        },
      });
    }

    const patient = await tx.user.upsert({
      where: { id: "demo-user-patient-0001" },
      update: {
        displayName: "Demo Patient",
        phoneEncrypted: "fake-encrypted:demo-patient-phone",
        emailEncrypted: "fake-encrypted:demo-patient-email",
      },
      create: {
        id: "demo-user-patient-0001",
        displayName: "Demo Patient",
        phoneEncrypted: "fake-encrypted:demo-patient-phone",
        emailEncrypted: "fake-encrypted:demo-patient-email",
      },
    });

    await tx.telegramIdentity.upsert({
      where: { userId: patient.id },
      update: {
        telegramUserId: 900000000001n,
        username: "demo_patient",
        languageCode: "ru",
      },
      create: {
        userId: patient.id,
        telegramUserId: 900000000001n,
        username: "demo_patient",
        languageCode: "ru",
      },
    });

    await tx.platformMembership.upsert({
      where: { id: "demo-membership-patient-0001" },
      update: { userId: patient.id, role: "PATIENT", revokedAt: null },
      create: {
        id: "demo-membership-patient-0001",
        userId: patient.id,
        role: "PATIENT",
      },
    });

    const authorizedStaff = await tx.user.upsert({
      where: { id: "demo-user-authorized-staff-0001" },
      update: { displayName: "Demo Authorized Partner Staff" },
      create: {
        id: "demo-user-authorized-staff-0001",
        displayName: "Demo Authorized Partner Staff",
      },
    });

    const clinicMembership = await tx.clinicMembership.upsert({
      where: { id: "demo-clinic-membership-authorized-staff-0001" },
      update: {
        clinicId: clinicIds.partnerOne,
        userId: authorizedStaff.id,
        role: "CLINIC_AUTHORIZED_STAFF",
        revokedAt: null,
      },
      create: {
        id: "demo-clinic-membership-authorized-staff-0001",
        clinicId: clinicIds.partnerOne,
        userId: authorizedStaff.id,
        role: "CLINIC_AUTHORIZED_STAFF",
      },
    });

    for (const document of consentDocuments) {
      await tx.consentAcceptance.upsert({
        where: { id: `demo-acceptance-${document.id}` },
        update: {
          userId: patient.id,
          consentDocumentId: document.id,
          ipHash: "demo-sha256-ip-hash",
          userAgentHash: "demo-sha256-user-agent-hash",
          telegramUserId: 900000000001n,
          evidence: { source: "fake-demo-seed" },
        },
        create: {
          id: `demo-acceptance-${document.id}`,
          userId: patient.id,
          consentDocumentId: document.id,
          ipHash: "demo-sha256-ip-hash",
          userAgentHash: "demo-sha256-user-agent-hash",
          telegramUserId: 900000000001n,
          evidence: { source: "fake-demo-seed" },
        },
      });
    }

    const screening = await tx.emergencyScreening.upsert({
      where: { id: "demo-screening-passed-0001" },
      update: {
        userId: patient.id,
        schemaVersion: "demo-routing-v1",
        answers: {
          emergencyWarningAcknowledged: true,
          route: "demo-non-emergency-flow",
        },
        outcome: "PASSED",
      },
      create: {
        id: "demo-screening-passed-0001",
        userId: patient.id,
        schemaVersion: "demo-routing-v1",
        answers: {
          emergencyWarningAcknowledged: true,
          route: "demo-non-emergency-flow",
        },
        outcome: "PASSED",
      },
    });

    const request = await tx.serviceRequest.upsert({
      where: { id: "demo-request-0001" },
      update: {
        userId: patient.id,
        clinicId: clinicIds.partnerOne,
        serviceCategoryId: categoryIds.nurseVisit,
        emergencyScreeningId: screening.id,
        status: "BOOKED",
        districtCode: "cao",
        addressEncrypted: "fake-encrypted:demo-address-in-cao",
        addressCommentEncrypted: "fake-encrypted:demo-address-comment",
        patientCommentEncrypted: "fake-encrypted:demo-request-without-medical-details",
        requestedWindowFrom: date("2026-06-01T10:00:00.000Z"),
        requestedWindowTo: date("2026-06-01T12:00:00.000Z"),
        submittedAt: date("2026-05-31T08:00:00.000Z"),
      },
      create: {
        id: "demo-request-0001",
        userId: patient.id,
        clinicId: clinicIds.partnerOne,
        serviceCategoryId: categoryIds.nurseVisit,
        emergencyScreeningId: screening.id,
        status: "BOOKED",
        districtCode: "cao",
        addressEncrypted: "fake-encrypted:demo-address-in-cao",
        addressCommentEncrypted: "fake-encrypted:demo-address-comment",
        patientCommentEncrypted: "fake-encrypted:demo-request-without-medical-details",
        requestedWindowFrom: date("2026-06-01T10:00:00.000Z"),
        requestedWindowTo: date("2026-06-01T12:00:00.000Z"),
        submittedAt: date("2026-05-31T08:00:00.000Z"),
      },
    });

    await tx.requestStatusHistory.upsert({
      where: { id: "demo-request-history-booked-0001" },
      update: {
        requestId: request.id,
        fromStatus: "QUOTE_PROVIDED",
        toStatus: "BOOKED",
        actorType: "USER",
        actorId: patient.id,
      },
      create: {
        id: "demo-request-history-booked-0001",
        requestId: request.id,
        fromStatus: "QUOTE_PROVIDED",
        toStatus: "BOOKED",
        actorType: "USER",
        actorId: patient.id,
      },
    });

    const quote = await tx.quote.upsert({
      where: {
        requestId_version: { requestId: request.id, version: 1 },
      },
      update: {
        clinicId: clinicIds.partnerOne,
        status: "ACCEPTED",
        fixedPrice: "2900.00",
        priceBreakdown: { kind: "fake-demo-fixed-price" },
        confirmedEtaAt: date("2026-06-01T10:30:00.000Z"),
        validUntil: date("2026-05-31T12:00:00.000Z"),
        cancellationTerms: "Fake demo cancellation terms",
        conditionsSnapshot: { source: "fake-demo-seed" },
        medicalFeasibilityConfirmedAt: date("2026-05-31T08:15:00.000Z"),
        confirmedByMemberId: clinicMembership.id,
      },
      create: {
        id: "demo-quote-0001",
        requestId: request.id,
        clinicId: clinicIds.partnerOne,
        version: 1,
        status: "ACCEPTED",
        fixedPrice: "2900.00",
        priceBreakdown: { kind: "fake-demo-fixed-price" },
        confirmedEtaAt: date("2026-06-01T10:30:00.000Z"),
        validUntil: date("2026-05-31T12:00:00.000Z"),
        cancellationTerms: "Fake demo cancellation terms",
        conditionsSnapshot: { source: "fake-demo-seed" },
        medicalFeasibilityConfirmedAt: date("2026-05-31T08:15:00.000Z"),
        confirmedByMemberId: clinicMembership.id,
      },
    });

    const booking = await tx.booking.upsert({
      where: { requestId: request.id },
      update: {
        quoteId: quote.id,
        clinicId: clinicIds.partnerOne,
        status: "CONFIRMED",
        confirmedAt: date("2026-05-31T08:20:00.000Z"),
      },
      create: {
        id: "demo-booking-0001",
        requestId: request.id,
        quoteId: quote.id,
        clinicId: clinicIds.partnerOne,
        status: "CONFIRMED",
        confirmedAt: date("2026-05-31T08:20:00.000Z"),
      },
    });

    await tx.slaEvent.upsert({
      where: { id: "demo-sla-arrival-0001" },
      update: {
        bookingId: booking.id,
        metricType: "ARRIVAL",
        dueAt: date("2026-06-01T10:30:00.000Z"),
        status: "PENDING",
        metadata: { source: "fake-demo-seed" },
      },
      create: {
        id: "demo-sla-arrival-0001",
        bookingId: booking.id,
        metricType: "ARRIVAL",
        dueAt: date("2026-06-01T10:30:00.000Z"),
        status: "PENDING",
        metadata: { source: "fake-demo-seed" },
      },
    });

    await tx.partnerLead.upsert({
      where: { id: "demo-partner-lead-0001" },
      update: {
        requestId: request.id,
        clinicId: clinicIds.partnerOne,
        status: "CONVERTED_TO_BOOKING",
        billingStatus: "NOT_BILLABLE",
        contactChannelId: "demo-contact-dashboard-0001",
        sentAt: date("2026-05-31T08:01:00.000Z"),
        acceptedAt: date("2026-05-31T08:10:00.000Z"),
        convertedAt: date("2026-05-31T08:20:00.000Z"),
        metadata: { source: "fake-demo-seed" },
      },
      create: {
        id: "demo-partner-lead-0001",
        requestId: request.id,
        clinicId: clinicIds.partnerOne,
        status: "CONVERTED_TO_BOOKING",
        billingStatus: "NOT_BILLABLE",
        contactChannelId: "demo-contact-dashboard-0001",
        sentAt: date("2026-05-31T08:01:00.000Z"),
        acceptedAt: date("2026-05-31T08:10:00.000Z"),
        convertedAt: date("2026-05-31T08:20:00.000Z"),
        metadata: { source: "fake-demo-seed" },
      },
    });
  });

  console.log("Seeded fake IVhome development data.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
