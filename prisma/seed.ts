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
  alcoholHangover: "demo-category-alcohol-hangover",
  bingeOrNearBinge: "demo-category-binge-or-near-binge",
  intoxication: "demo-category-intoxication",
  urgentVisit: "demo-category-urgent-visit",
  plannedVisit: "demo-category-planned-visit",
  custom: "demo-category-custom",
} as const;

async function main() {
  await prisma.$transaction(async (tx) => {
    const categories = [
      {
        id: categoryIds.homeMedicalVisit,
        slug: "home_medical_visit",
        publicName: "Медицинский выезд на дом",
        publicDescription:
          "Заявка на медицинский выезд на дом. Надом не диагностирует и не назначает лечение.",
      },
      {
        id: categoryIds.nurseVisit,
        slug: "nurse_visit",
        publicName: "Выезд медицинского специалиста",
        publicDescription:
          "Заявка на выезд медицинского специалиста. Возможность выезда подтверждает выбранная медслужба.",
      },
      {
        id: categoryIds.ivTherapyReview,
        slug: "iv_therapy_review",
        publicName: "Рассмотрение заявки на капельное введение",
        publicDescription:
          "Заявка передаётся на рассмотрение выбранной медслужбе. Надом не рекомендует препараты или состав капельницы.",
      },
      { id: categoryIds.alcoholHangover, slug: "alcohol_hangover", publicName: "Плохо после алкоголя", publicDescription: "Детали и стоимость подтверждает выбранная медслужба." },
      { id: categoryIds.bingeOrNearBinge, slug: "binge_or_near_binge", publicName: "Запойная или около-запойная ситуация", publicDescription: "Седативные препараты — только по решению специалиста медслужбы и в рамках лицензии." },
      { id: categoryIds.intoxication, slug: "intoxication", publicName: "Интоксикация / отравление веществами", publicDescription: "Возможность выезда подтверждает выбранная медслужба." },
      { id: categoryIds.urgentVisit, slug: "urgent_visit", publicName: "Срочный неэкстренный выезд специалиста", publicDescription: "Для неэкстренного выезда специалиста выбранной медслужбы." },
      { id: categoryIds.plannedVisit, slug: "planned_visit", publicName: "Плановый выезд специалиста", publicDescription: "Плановый выезд после подтверждения выбранной медслужбой." },
      { id: categoryIds.custom, slug: "custom", publicName: "Свой запрос", publicDescription: "Нейтральный пользовательский запрос для выбранной медслужбы." },
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
        legalName: "ООО «Медслужба Север» (локальные данные)",
        publicName: "Медслужба «Север»",
        inn: "DEMO-INN-0001",
        ogrn: "DEMO-OGRN-0001",
        status: "ACTIVE" as const,
      },
      {
        id: clinicIds.homeCare,
        legalName: "ООО «Медслужба Центр» (локальные данные)",
        publicName: "Медслужба «Центр»",
        inn: "DEMO-INN-0002",
        ogrn: "DEMO-OGRN-0002",
        status: "ACTIVE" as const,
      },
      {
        id: clinicIds.nightService,
        legalName: "ООО «Медслужба Ночь» (локальные данные)",
        publicName: "Медслужба «Ночь»",
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
          authorityName: "Локальные тестовые лицензионные данные",
          registryUrl: null,
          registryRecordId: null,
          licensedActivities: ["локальный тестовый выезд на дом"],
          licensedAddresses: ["локальная тестовая зона"],
          verificationNotes: "Тестовые лицензионные данные только для локальной разработки",
        },
        create: {
          ...license,
          authorityName: "Локальные тестовые лицензионные данные",
          licensedActivities: ["локальный тестовый выезд на дом"],
          licensedAddresses: ["локальная тестовая зона"],
          verificationNotes: "Тестовые лицензионные данные только для локальной разработки",
        },
      });
    }

    const offers = [
      [clinicIds.partnerOne, categoryIds.homeMedicalVisit, "3500.00", "5200.00", 60, 120],
      [clinicIds.partnerOne, categoryIds.nurseVisit, "2500.00", "3900.00", 45, 90],
      [clinicIds.partnerOne, categoryIds.ivTherapyReview, "3000.00", "4800.00", 60, 120],
      [clinicIds.partnerOne, categoryIds.alcoholHangover, "8500.00", "12000.00", 40, 90],
      [clinicIds.partnerOne, categoryIds.urgentVisit, "6000.00", "9000.00", 35, 80],
      [clinicIds.homeCare, categoryIds.homeMedicalVisit, "3800.00", "5500.00", 90, 150],
      [clinicIds.homeCare, categoryIds.nurseVisit, "2700.00", "4100.00", 60, 120],
      [clinicIds.homeCare, categoryIds.plannedVisit, "5500.00", "8500.00", 90, 150],
      [clinicIds.homeCare, categoryIds.intoxication, "10000.00", "14000.00", 70, 140],
      [clinicIds.nightService, categoryIds.homeMedicalVisit, "4500.00", "6200.00", 75, 150],
      [clinicIds.nightService, categoryIds.nurseVisit, "3200.00", "4700.00", 60, 120],
      [clinicIds.nightService, categoryIds.bingeOrNearBinge, "11000.00", "16000.00", 70, 150],
      [clinicIds.nightService, categoryIds.custom, null, null, 75, 150],
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
          cancellationTerms: "Тестовые условия отмены",
          publicConditions: "Выезд после подтверждения выбранной медслужбой",
        },
        create: {
          clinicId,
          serviceCategoryId,
          status: "ACTIVE",
          preliminaryPriceFrom: priceFrom,
          preliminaryPriceTo: priceTo,
          etaMinutesFrom: etaFrom,
          etaMinutesTo: etaTo,
          cancellationTerms: "Тестовые условия отмены",
          publicConditions: "Выезд после подтверждения выбранной медслужбой",
        },
      });
    }

    const serviceAreas = [
      [clinicIds.partnerOne, "cao", "Central Administrative Okrug"],
      [clinicIds.partnerOne, "svao", "North-Eastern Administrative Okrug"],
      [clinicIds.homeCare, "zao", "Western Administrative Okrug"],
      [clinicIds.homeCare, "yuzao", "South-Western Administrative Okrug"],
      [clinicIds.nightService, "all_moscow", "Вся Москва (локальная тестовая зона)"],
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
        label: "Локальная очередь dashboard",
        valueMasked: "dashboard-only",
        isPrimary: true,
      },
      {
        id: "demo-contact-telegram-0001",
        clinicId: clinicIds.partnerOne,
        type: "TELEGRAM" as const,
        label: "Локальный Telegram-контакт",
        valueMasked: "@nadom_dev_contact",
        isPrimary: false,
      },
      {
        id: "demo-contact-phone-0002",
        clinicId: clinicIds.homeCare,
        type: "PHONE" as const,
        label: "Локальный маскированный телефон",
        valueMasked: "+7 *** ***-**-02",
        isPrimary: true,
      },
      {
        id: "demo-contact-dashboard-0003",
        clinicId: clinicIds.nightService,
        type: "DASHBOARD" as const,
        label: "Локальная очередь dashboard",
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
        title: "Локальное согласие на обработку персональных данных",
        contentHash: "dev-sha256-personal-data-v1",
        documentUrl: "https://example.invalid/nadom/dev/personal-data-v1",
      },
      {
        id: "demo-consent-health-data-v1",
        type: "HEALTH_DATA_PROCESSING" as const,
        version: "demo-v1",
        title: "Локальное согласие на обработку данных о здоровье",
        contentHash: "dev-sha256-health-data-v1",
        documentUrl: "https://example.invalid/nadom/dev/health-data-v1",
      },
      {
        id: "demo-consent-partner-transfer-v1",
        type: "PARTNER_DATA_TRANSFER" as const,
        version: "demo-v1",
        title: "Локальное согласие на передачу данных выбранной медслужбе",
        contentHash: "dev-sha256-medservice-transfer-v1",
        documentUrl: "https://example.invalid/nadom/dev/medservice-transfer-v1",
      },
      {
        id: "demo-consent-terms-v1",
        type: "TERMS_OF_USE" as const,
        version: "demo-v1",
        title: "Локальные условия использования",
        contentHash: "dev-sha256-terms-v1",
        documentUrl: "https://example.invalid/nadom/dev/terms-v1",
      },
      {
        id: "demo-consent-privacy-policy-v1",
        type: "PRIVACY_POLICY_ACKNOWLEDGEMENT" as const,
        version: "demo-v1",
        title: "Локальное подтверждение политики конфиденциальности",
        contentHash: "dev-sha256-privacy-policy-v1",
        documentUrl: "https://example.invalid/nadom/dev/privacy-policy-v1",
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
        displayName: "Локальный пользователь",
        phoneEncrypted: "dev-encrypted:user-phone",
        emailEncrypted: "dev-encrypted:user-email",
      },
      create: {
        id: "demo-user-patient-0001",
        displayName: "Локальный пользователь",
        phoneEncrypted: "dev-encrypted:user-phone",
        emailEncrypted: "dev-encrypted:user-email",
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
      update: { displayName: "Локальный сотрудник медслужбы" },
      create: {
        id: "demo-user-authorized-staff-0001",
        displayName: "Локальный сотрудник медслужбы",
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
          ipHash: "dev-sha256-ip-hash",
          userAgentHash: "dev-sha256-user-agent-hash",
          telegramUserId: 900000000001n,
          evidence: { source: "local-seed" },
        },
        create: {
          id: `demo-acceptance-${document.id}`,
          userId: patient.id,
          consentDocumentId: document.id,
          ipHash: "dev-sha256-ip-hash",
          userAgentHash: "dev-sha256-user-agent-hash",
          telegramUserId: 900000000001n,
          evidence: { source: "local-seed" },
        },
      });
    }

    const screening = await tx.emergencyScreening.upsert({
      where: { id: "demo-screening-passed-0001" },
      update: {
        userId: patient.id,
        schemaVersion: "dev-routing-v1",
        answers: {
          emergencyWarningAcknowledged: true,
          route: "dev-non-emergency-flow",
        },
        outcome: "PASSED",
      },
      create: {
        id: "demo-screening-passed-0001",
        userId: patient.id,
        schemaVersion: "dev-routing-v1",
        answers: {
          emergencyWarningAcknowledged: true,
          route: "dev-non-emergency-flow",
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
        addressEncrypted: "dev-encrypted:address-in-cao",
        addressCommentEncrypted: "dev-encrypted:address-comment",
        patientCommentEncrypted: "dev-encrypted:request-without-medical-details",
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
        addressEncrypted: "dev-encrypted:address-in-cao",
        addressCommentEncrypted: "dev-encrypted:address-comment",
        patientCommentEncrypted: "dev-encrypted:request-without-medical-details",
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
        priceBreakdown: { kind: "local-fixed-price" },
        confirmedEtaAt: date("2026-06-01T10:30:00.000Z"),
        validUntil: date("2026-05-31T12:00:00.000Z"),
        cancellationTerms: "Тестовые условия отмены",
        conditionsSnapshot: { source: "local-seed" },
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
        priceBreakdown: { kind: "local-fixed-price" },
        confirmedEtaAt: date("2026-06-01T10:30:00.000Z"),
        validUntil: date("2026-05-31T12:00:00.000Z"),
        cancellationTerms: "Тестовые условия отмены",
        conditionsSnapshot: { source: "local-seed" },
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
        metadata: { source: "local-seed" },
      },
      create: {
        id: "demo-sla-arrival-0001",
        bookingId: booking.id,
        metricType: "ARRIVAL",
        dueAt: date("2026-06-01T10:30:00.000Z"),
        status: "PENDING",
        metadata: { source: "local-seed" },
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
        metadata: { source: "local-seed" },
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
        metadata: { source: "local-seed" },
      },
    });

    // ─── MVP medservices (match app offer IDs) ────────────────────────────────
  const mvpClinics = [
    {
      id: "medservice-north",
      legalName: 'ООО «Медслужба Север»',
      publicName: "Медслужба «Север»",
      inn: "MVP-INN-NORTH-001",
      status: "ACTIVE" as const,
    },
    {
      id: "medservice-center",
      legalName: 'ООО «Медслужба Центр»',
      publicName: "Медслужба «Центр»",
      inn: "MVP-INN-CENTER-002",
      status: "ACTIVE" as const,
    },
    {
      id: "medservice-night",
      legalName: 'ООО «Медслужба Ночь»',
      publicName: "Медслужба «Ночь»",
      inn: "MVP-INN-NIGHT-003",
      status: "ACTIVE" as const,
    },
  ];

  for (const clinic of mvpClinics) {
    await tx.clinic.upsert({
      where: { id: clinic.id },
      update: clinic,
      create: clinic,
    });
  }

  const mvpLicenses = [
    {
      id: "mvp-license-north-001",
      clinicId: "medservice-north",
      licenseNumber: "ЛО-77-01-MVP-NORTH-001",
      status: "VERIFIED" as const,
      issuedAt: date("2025-01-10T00:00:00.000Z"),
    },
    {
      id: "mvp-license-center-001",
      clinicId: "medservice-center",
      licenseNumber: "ЛО-77-01-MVP-CENTER-002",
      status: "VERIFIED" as const,
      issuedAt: date("2025-03-15T00:00:00.000Z"),
    },
    {
      id: "mvp-license-night-001",
      clinicId: "medservice-night",
      licenseNumber: "ЛО-77-01-MVP-NIGHT-003",
      status: "VERIFIED" as const,
      issuedAt: date("2025-06-01T00:00:00.000Z"),
    },
  ];

  for (const license of mvpLicenses) {
    await tx.clinicLicense.upsert({
      where: { id: license.id },
      update: {
        ...license,
        authorityName: "Росздравнадзор (пилотный placeholder)",
        licensedActivities: ["выездное медицинское обслуживание"],
        licensedAddresses: ["г. Москва (пилотная зона)"],
        verificationNotes: "Placeholder-номер для проверки пилотного контура; перед реальным доступом заменить на проверенные данные",
      },
      create: {
        ...license,
        authorityName: "Росздравнадзор (пилотный placeholder)",
        licensedActivities: ["выездное медицинское обслуживание"],
        licensedAddresses: ["г. Москва (пилотная зона)"],
        verificationNotes: "Placeholder-номер для проверки пилотного контура; перед реальным доступом заменить на проверенные данные",
      },
    });
  }

  const mvpCategoryId = categoryIds.homeMedicalVisit;
  const mvpOffers = [
    { clinicId: "medservice-north", priceFrom: "8500.00", priceTo: "9200.00", etaFrom: 10, etaTo: 40 },
    { clinicId: "medservice-center", priceFrom: "9200.00", priceTo: "10400.00", etaFrom: 15, etaTo: 55 },
    { clinicId: "medservice-night", priceFrom: "10500.00", priceTo: "11300.00", etaFrom: 20, etaTo: 70 },
  ];

  for (const offer of mvpOffers) {
    await tx.clinicServiceOffer.upsert({
      where: {
        clinicId_serviceCategoryId: {
          clinicId: offer.clinicId,
          serviceCategoryId: mvpCategoryId,
        },
      },
      update: {
        status: "ACTIVE",
        preliminaryPriceFrom: offer.priceFrom,
        preliminaryPriceTo: offer.priceTo,
        etaMinutesFrom: offer.etaFrom,
        etaMinutesTo: offer.etaTo,
        cancellationTerms: "Условия отмены уточняются у медслужбы",
        publicConditions: "Выезд после подтверждения медслужбой",
      },
      create: {
        clinicId: offer.clinicId,
        serviceCategoryId: mvpCategoryId,
        status: "ACTIVE",
        preliminaryPriceFrom: offer.priceFrom,
        preliminaryPriceTo: offer.priceTo,
        etaMinutesFrom: offer.etaFrom,
        etaMinutesTo: offer.etaTo,
        cancellationTerms: "Условия отмены уточняются у медслужбы",
        publicConditions: "Выезд после подтверждения медслужбой",
      },
    });
  }

  const mvpAreas = [
    [
      "medservice-north",
      [
        { code: "sao", name: "Северный административный округ" },
        { code: "szao", name: "Северо-Западный административный округ" },
        { code: "svao", name: "Северо-Восточный административный округ" },
      ],
    ],
    [
      "medservice-center",
      [
        { code: "cao_mvp", name: "Центральный административный округ" },
        { code: "zao_mvp", name: "Западный административный округ" },
        { code: "yuzao_mvp", name: "Юго-Западный административный округ" },
      ],
    ],
    [
      "medservice-night",
      [
        { code: "all_moscow_mvp", name: "Вся Москва (по зонам выезда)" },
      ],
    ],
  ] as const;

  for (const [clinicId, areas] of mvpAreas) {
    for (const area of areas) {
      await tx.clinicServiceArea.upsert({
        where: { clinicId_districtCode: { clinicId, districtCode: area.code } },
        update: { districtName: area.name, isActive: true },
        create: { clinicId, districtCode: area.code, districtName: area.name, isActive: true },
      });
    }
  }

    console.log("Seeded Nadom development data.");
  });
}


main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
